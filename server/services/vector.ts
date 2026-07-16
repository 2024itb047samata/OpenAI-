import { geminiService } from "./gemini";
import { db } from "./db";
import { DBVectorChunk } from "../types";

// Compute Cosine Similarity between two arrays of numbers
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// -----------------------------------------------------------------------------
// CHROMADB CLIENT EMULATION (FOR COMPATIBILITY & ULTRA-ROBUST SANDBOX DEPLOYMENT)
// -----------------------------------------------------------------------------
export class ChromaCollection {
  name: string;
  repoId: string;

  constructor(name: string, repoId: string) {
    this.name = name;
    this.repoId = repoId;
  }

  /**
   * Adds embeddings, documents, metadata and IDs to Chroma collection
   */
  async add(params: {
    ids: string[];
    embeddings?: number[][];
    metadatas?: Record<string, any>[];
    documents?: string[];
  }): Promise<void> {
    const { ids, embeddings, metadatas, documents } = params;
    const chunks: DBVectorChunk[] = [];
    for (let i = 0; i < ids.length; i++) {
      chunks.push({
        id: ids[i],
        repoId: this.repoId,
        entityType: metadatas?.[i]?.entityType || "issue",
        entityId: metadatas?.[i]?.entityId || ids[i],
        text: documents?.[i] || "",
        embedding: embeddings?.[i] || [],
        metadata: metadatas?.[i] || {}
      });
    }
    await db.saveVectorChunks(chunks);
  }

  /**
   * Queries collection with vector embeddings and returns nearest matches
   */
  async query(params: {
    queryEmbeddings: number[][];
    nResults?: number;
    where?: Record<string, any>;
  }): Promise<{
    ids: string[][];
    distances: number[][];
    metadatas: Record<string, any>[][];
    documents: string[][];
  }> {
    const { queryEmbeddings, nResults = 10, where } = params;
    const queryVec = queryEmbeddings[0];
    let allChunks = await db.listVectorChunks(this.repoId);

    if (where) {
      allChunks = allChunks.filter(c => {
        for (const [key, val] of Object.entries(where)) {
          if (c.metadata[key] !== val) return false;
        }
        return true;
      });
    }

    const scored = allChunks.map(chunk => {
      const sim = cosineSimilarity(queryVec, chunk.embedding);
      const distance = 1 - sim;
      return { chunk, distance };
    });

    // Sort ascending by distance (descending similarity)
    scored.sort((a, b) => a.distance - b.distance);
    const top = scored.slice(0, nResults);

    return {
      ids: [top.map(t => t.chunk.id)],
      distances: [top.map(t => t.distance)],
      metadatas: [top.map(t => t.chunk.metadata)],
      documents: [top.map(t => t.chunk.text)]
    };
  }
}

export class ChromaClient {
  async getOrCreateCollection(params: { name: string }): Promise<ChromaCollection> {
    const repoId = params.name.toLowerCase();
    return new ChromaCollection(params.name, repoId);
  }
}

// -----------------------------------------------------------------------------
// BM25 KEYWORD SEARCH ENGINE
// -----------------------------------------------------------------------------
export class BM25Searcher {
  private k1 = 1.2;
  private b = 0.75;

  search(chunks: DBVectorChunk[], query: string): { chunk: DBVectorChunk; score: number }[] {
    const documents = chunks.map(c => ({
      id: c.id,
      text: c.text,
      chunk: c
    }));

    const N = documents.length;
    if (N === 0) return [];

    const docTokens = documents.map(doc => ({
      id: doc.id,
      tokens: this.tokenize(doc.text),
      chunk: doc.chunk
    }));

    const docLengths: Record<string, number> = {};
    let totalLength = 0;
    for (const doc of docTokens) {
      docLengths[doc.id] = doc.tokens.length;
      totalLength += doc.tokens.length;
    }
    const avgdl = totalLength / N;

    const termFrequencies: Record<string, Record<string, number>> = {};
    const df: Record<string, number> = {};

    for (const doc of docTokens) {
      termFrequencies[doc.id] = {};
      const uniqueTerms = new Set<string>();

      for (const token of doc.tokens) {
        termFrequencies[doc.id][token] = (termFrequencies[doc.id][token] || 0) + 1;
        uniqueTerms.add(token);
      }

      for (const token of uniqueTerms) {
        df[token] = (df[token] || 0) + 1;
      }
    }

    const queryTokens = this.tokenize(query);
    const results: { chunk: DBVectorChunk; score: number }[] = [];

    for (const doc of docTokens) {
      let score = 0;
      for (const qToken of queryTokens) {
        const tf = termFrequencies[doc.id][qToken] || 0;
        if (tf === 0) continue;

        const docLen = docLengths[doc.id] || 0;
        const documentFreq = df[qToken] || 0;

        const idf = Math.log(1 + (N - documentFreq + 0.5) / (documentFreq + 0.5));
        
        const num = tf * (this.k1 + 1);
        const denom = tf + this.k1 * (this.b + this.b * (docLen / (avgdl || 1)));
        
        score += idf * (num / denom);
      }

      if (score > 0) {
        results.push({ chunk: doc.chunk, score });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results;
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, " ")
      .split(/\s+/)
      .filter(w => w.length > 0);
  }
}

// -----------------------------------------------------------------------------
// RECIPROCAL RANK FUSION (RRF) FOR HYBRID RETRIEVAL
// -----------------------------------------------------------------------------
export interface HybridMatch {
  chunk: DBVectorChunk;
  score: number;
  semanticRank: number;
  bm25Rank: number;
}

export function reciprocalRankFusion(
  semanticResults: { chunk: DBVectorChunk; score: number }[],
  bm25Results: { chunk: DBVectorChunk; score: number }[],
  limit = 10
): HybridMatch[] {
  const rrfScores: Record<string, HybridMatch> = {};
  const k = 60;

  semanticResults.forEach((res, index) => {
    const id = res.chunk.id;
    const rank = index + 1;
    rrfScores[id] = {
      chunk: res.chunk,
      score: 1 / (k + rank),
      semanticRank: rank,
      bm25Rank: Infinity
    };
  });

  bm25Results.forEach((res, index) => {
    const id = res.chunk.id;
    const rank = index + 1;
    if (rrfScores[id]) {
      rrfScores[id].score += 1 / (k + rank);
      rrfScores[id].bm25Rank = rank;
    } else {
      rrfScores[id] = {
        chunk: res.chunk,
        score: 1 / (k + rank),
        semanticRank: Infinity,
        bm25Rank: rank
      };
    }
  });

  const merged = Object.values(rrfScores);
  merged.sort((a, b) => b.score - a.score);

  return merged.slice(0, limit);
}

// -----------------------------------------------------------------------------
// MAIN VECTOR AND RAG SERVICE
// -----------------------------------------------------------------------------
export class VectorService {
  private chromaClient = new ChromaClient();
  private bm25Searcher = new BM25Searcher();

  /**
   * Fetch embedding from Gemini API for a piece of text
   */
  async getEmbedding(text: string): Promise<number[]> {
    try {
      const res = await geminiService.embedContent(text);
      return res.embedding;
    } catch (err: any) {
      console.error("[Vector] Failed to get Gemini embedding:", err.message);
      return new Array(768).fill(0);
    }
  }

  /**
   * Chunk any database item (Issue, PR, Commit, Review) into semantic context sentences
   */
  async indexEntity(
    repoId: string,
    entityType: "issue" | "pr" | "commit" | "review",
    entityId: string,
    text: string,
    metadata: Record<string, any>
  ): Promise<void> {
    if (!text || text.trim().length < 5) return;

    const chunks: string[] = [];
    if (text.length > 800) {
      const paras = text.split("\n\n").filter(p => p.trim().length > 0);
      for (const p of paras) {
        if (p.length > 800) {
          const sentences = p.split(/[.!?]\s+/).filter(s => s.trim().length > 0);
          let current = "";
          for (const s of sentences) {
            if ((current + s).length > 800) {
              chunks.push(current.trim());
              current = s;
            } else {
              current += " " + s;
            }
          }
          if (current) chunks.push(current.trim());
        } else {
          chunks.push(p.trim());
        }
      }
    } else {
      chunks.push(text.trim());
    }

    const vectorChunks: DBVectorChunk[] = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunkText = `[${entityType.toUpperCase()} - ${metadata.title || metadata.sha || "Detail"}]\n${chunks[i]}`;
      const embedding = await this.getEmbedding(chunkText);
      vectorChunks.push({
        id: `${entityType}_${entityId}_chunk_${i}`,
        repoId,
        entityType,
        entityId,
        text: chunkText,
        embedding,
        metadata: {
          title: metadata.title,
          number: metadata.number,
          author: metadata.author,
          createdAt: metadata.createdAt,
          sha: metadata.sha
        }
      });
    }

    if (vectorChunks.length > 0) {
      const collection = await this.chromaClient.getOrCreateCollection({ name: repoId });
      await collection.add({
        ids: vectorChunks.map(c => c.id),
        embeddings: vectorChunks.map(c => c.embedding),
        metadatas: vectorChunks.map(c => c.metadata),
        documents: vectorChunks.map(c => c.text)
      });
    }
  }

  /**
   * Hybrid RAG Retrieval: Merges ChromaDB semantic search and BM25 keyword search using RRF
   */
  async hybridSearch(
    repoId: string,
    query: string,
    limit = 10
  ): Promise<HybridMatch[]> {
    console.log(`[RAG] Initiating hybrid retrieval for: "${query}" (Repo: ${repoId})`);
    
    const allChunks = await db.listVectorChunks(repoId);
    if (allChunks.length === 0) {
      return [];
    }

    const queryVector = await this.getEmbedding(query);
    const collection = await this.chromaClient.getOrCreateCollection({ name: repoId });
    const chromaQueryRes = await collection.query({
      queryEmbeddings: [queryVector],
      nResults: allChunks.length
    });

    const semanticResults: { chunk: DBVectorChunk; score: number }[] = [];
    const distances = chromaQueryRes.distances[0] || [];
    const ids = chromaQueryRes.ids[0] || [];

    for (let i = 0; i < ids.length; i++) {
      const matchedChunk = allChunks.find(c => c.id === ids[i]);
      if (matchedChunk) {
        semanticResults.push({
          chunk: matchedChunk,
          score: 1 - distances[i]
        });
      }
    }

    const bm25Results = this.bm25Searcher.search(allChunks, query);
    const hybridResults = reciprocalRankFusion(semanticResults, bm25Results, limit);

    console.log(`[RAG] Hybrid retrieval fetched ${hybridResults.length} merged documents.`);
    return hybridResults;
  }

  /**
   * Prepares LLM prompt context based on hybrid search results and instructions to prevent hallucinations
   */
  prepareLlmContext(matches: HybridMatch[]): string {
    if (matches.length === 0) {
      return "No matching documents found in the repository index.";
    }

    return matches.map((m, idx) => {
      const { chunk, semanticRank, bm25Rank, score } = m;
      const meta = chunk.metadata;
      return `[Document #${idx + 1}]
ID: ${chunk.id}
Type: ${chunk.entityType.toUpperCase()}
Entity ID: ${chunk.entityId}
Title/Summary: ${meta.title || "N/A"}
Author: ${meta.author || "N/A"}
Created At: ${meta.createdAt || "N/A"}
SHA: ${meta.sha || "N/A"}
RRF Score: ${score.toFixed(4)} (Semantic Rank: ${semanticRank}, BM25 Rank: ${bm25Rank})

Content:
${chunk.text}
----------------------------------------`;
    }).join("\n\n");
  }
}

export const vectorService = new VectorService();
