import { Request, Response } from "express";
import { db } from "../services/db";
import { gitHubService } from "../services/github";
import { ingestionService } from "../services/ingestion";
import { timelineService } from "../services/timeline";
import { vectorService } from "../services/vector";
import { geminiService } from "../services/gemini";
import { authSession } from "./auth";

export class RepositoryController {
  /**
   * List all ingested repositories
   */
  public async listRepositories(req: Request, res: Response) {
    try {
      const repos = await db.listRepositories();
      return res.json(repos);
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to list repositories.", details: err.message });
    }
  }

  /**
   * Register a repository metadata and save to DB
   */
  public async createRepository(req: Request, res: Response) {
    const { owner, repo } = req.body;

    if (!owner || !repo) {
      return res.status(400).json({ error: "Both 'owner' and 'repo' parameters are required in the request body." });
    }

    try {
      const cleanOwner = owner.trim();
      const cleanRepo = repo.trim();

      const repoMetadata = await gitHubService.fetchRepoMetadata(
        cleanOwner,
        cleanRepo,
        authSession.getAccessToken() || undefined
      );
      await db.saveRepository(repoMetadata);

      // Immediately ingest the repository to fetch commits, issues, PRs, branches, and releases
      try {
        console.log(`[RepositoryController] Immediately triggering ingestion for registered repository ${cleanOwner}/${cleanRepo}`);
        await ingestionService.ingestRepository(
          cleanOwner,
          cleanRepo,
          authSession.getAccessToken() || undefined
        );
      } catch (ingestErr: any) {
        console.error(`[RepositoryController] Immediate ingestion failed during registration:`, ingestErr);
      }

      return res.status(201).json({
        message: "Repository added successfully.",
        repository: repoMetadata,
      });
    } catch (err: any) {
      console.error("[RepositoryController] Error adding repository:", err);
      return res.status(404).json({
        error: `Could not retrieve repository info from GitHub: ${err.message}`,
      });
    }
  }

  /**
   * Trigger Ingestion Process (runs asynchronous pipeline)
   */
  public async ingestRepository(req: Request, res: Response) {
    const { owner, repo } = req.params;
    const repoId = `${owner}/${repo}`.toLowerCase();

    try {
      const repository = await db.getRepository(repoId);
      if (!repository) {
        return res.status(404).json({ error: "Repository metadata must be registered first." });
      }

      console.log(`[RepositoryController] Starting ingestion pipeline for ${repoId}`);
      const counts = await ingestionService.ingestRepository(
        owner,
        repo,
        authSession.getAccessToken() || undefined
      );

      return res.json({
        status: "success",
        counts,
      });
    } catch (err: any) {
      console.error(`[RepositoryController] Ingestion failed for ${repoId}:`, err);
      return res.status(500).json({ error: "Ingestion failed.", details: err.message });
    }
  }

  /**
   * Retrieve fully reconstructed timeline data for UI
   */
  public async getTimeline(req: Request, res: Response) {
    const { owner, repo } = req.params;

    try {
      const events = await timelineService.buildTimeline(owner, repo);
      return res.json(events);
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to load timeline.", details: err.message });
    }
  }

  /**
   * Semantic timeline query using hybrid RAG and Gemini 3.5-Flash
   */
  public async queryRepository(req: Request, res: Response) {
    const { owner, repo } = req.params;
    const repoId = `${owner}/${repo}`.toLowerCase();
    const { queryText } = req.body;

    if (!queryText) {
      return res.status(400).json({ error: "Missing 'queryText' in request body." });
    }

    try {
      // Perform hybrid search (ChromaDB Vector + BM25) fused with RRF
      const matches = await vectorService.hybridSearch(repoId, queryText, 10);

      if (matches.length === 0) {
        return res.json({
          text: "### 🔍 System Notice\n\nNo repository data has been ingested or indexed for this repository yet. Please trigger the ingestion pipeline in the 'Modular Connectors' tab first.",
          matchingEntities: [],
          retrievedDocuments: []
        });
      }

      const contextText = vectorService.prepareLlmContext(matches);

      const systemInstruction = `
You are the CodeStory forensic AI analyzer.
You help engineering teams understand the "WHY" behind code changes (historical decisions, architectural tradeoffs, budget limits, manager bypasses) rather than just "WHAT" lines changed.

We performed a hybrid retrieval (semantic vector search in ChromaDB combined with BM25 keyword search) over the ingested database of GitHub history for ${repoId}.
Below are the top retrieved documents related to the user's query:

${contextText}

CRITICAL INSTRUCTIONS:
1. Base your response ONLY on the facts explicitly mentioned in the retrieved documents above. Do NOT assume, extrapolate, or hallucinate facts not directly stated in the documents.
2. If the provided documents do not contain enough information or are irrelevant to answer the user's query, state clearly and transparently: "The retrieved repository documents do not contain sufficient information to answer this query. I want to avoid fabricating any details."
3. Cite precise issue/PR numbers, commit hashes, and authors where available based ONLY on the documents.
4. Answer in a professional, scannable, Vercel/Linear-style Markdown format. Be technical, direct, and detailed.
`;

      const response = await geminiService.generateContent(
        `User Forensic Query: "${queryText}"`,
        systemInstruction,
        "gemini-3.5-flash",
        0.1 // low temperature to ensure accuracy and factual compliance
      );

      // Extract unique terms to light up matching entities on UI graph
      const matchingEntities = Array.from(new Set(
        matches
          .flatMap((m) => [
            m.chunk.metadata.author,
            m.chunk.entityType,
            m.chunk.metadata.number ? `PR #${m.chunk.metadata.number}` : undefined,
            m.chunk.metadata.sha
          ])
          .filter((val): val is string => !!val)
      ));

      const retrievedDocuments = matches.map((m) => ({
        id: m.chunk.id,
        entityType: m.chunk.entityType,
        entityId: m.chunk.entityId,
        text: m.chunk.text,
        score: m.score,
        semanticRank: m.semanticRank,
        bm25Rank: m.bm25Rank,
        metadata: m.chunk.metadata
      }));

      return res.json({
        text: response.text,
        matchingEntities,
        retrievedDocuments
      });
    } catch (err: any) {
      console.error("[RepositoryController] Query failed:", err);
      return res.status(500).json({ error: "Forensic query failed.", details: err.message });
    }
  }
}

export const repositoryController = new RepositoryController();
