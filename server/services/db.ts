import { promises as fsPromises } from "fs";
import path from "path";
import { DBRepository, DBIssue, DBPullRequest, DBCommit, DBReview, DBVectorChunk } from "../types";

const DB_DIR = path.join(process.cwd(), "db_storage");

export class DatabaseService {
  private async ensureDbDir() {
    try {
      await fsPromises.mkdir(DB_DIR, { recursive: true });
    } catch (err) {
      console.error("[DB] Failed to create db directory:", err);
    }
  }

  private getFilePath(table: string): string {
    return path.join(DB_DIR, `${table}.json`);
  }

  private async readTable<T>(table: string): Promise<T[]> {
    await this.ensureDbDir();
    const filePath = this.getFilePath(table);
    try {
      const exists = await fsPromises.stat(filePath).then(() => true).catch(() => false);
      if (!exists) {
        return [];
      }
      const raw = await fsPromises.readFile(filePath, "utf-8");
      return JSON.parse(raw) as T[];
    } catch (err) {
      console.error(`[DB] Error reading table ${table}, returning empty array:`, err);
      return [];
    }
  }

  private async writeTable<T>(table: string, data: T[]): Promise<void> {
    await this.ensureDbDir();
    const filePath = this.getFilePath(table);
    try {
      const tempPath = `${filePath}.tmp`;
      await fsPromises.writeFile(tempPath, JSON.stringify(data, null, 2), "utf-8");
      await fsPromises.rename(tempPath, filePath);
    } catch (err) {
      console.error(`[DB] Error writing table ${table}:`, err);
      throw err;
    }
  }

  // --- REPOSITORIES ---
  async listRepositories(): Promise<DBRepository[]> {
    return this.readTable<DBRepository>("repositories");
  }

  async getRepository(id: string): Promise<DBRepository | undefined> {
    const repos = await this.listRepositories();
    return repos.find((r) => r.id === id);
  }

  async saveRepository(repo: DBRepository): Promise<void> {
    const repos = await this.listRepositories();
    const index = repos.findIndex((r) => r.id === repo.id);
    if (index !== -1) {
      repos[index] = repo;
    } else {
      repos.push(repo);
    }
    await this.writeTable("repositories", repos);
    console.log(`[DB] Saved repository: ${repo.id}`);
  }

  // --- ISSUES ---
  async listIssues(repoId?: string): Promise<DBIssue[]> {
    const issues = await this.readTable<DBIssue>("issues");
    if (repoId) {
      return issues.filter((i) => i.repoId === repoId);
    }
    return issues;
  }

  async saveIssues(issues: DBIssue[]): Promise<void> {
    if (issues.length === 0) return;
    const all = await this.readTable<DBIssue>("issues");
    const existingMap = new Map(all.map((item) => [item.id, item]));
    for (const issue of issues) {
      existingMap.set(issue.id, issue);
    }
    await this.writeTable("issues", Array.from(existingMap.values()));
    console.log(`[DB] Stored/updated ${issues.length} issues`);
  }

  // --- PULL REQUESTS ---
  async listPullRequests(repoId?: string): Promise<DBPullRequest[]> {
    const prs = await this.readTable<DBPullRequest>("prs");
    if (repoId) {
      return prs.filter((p) => p.repoId === repoId);
    }
    return prs;
  }

  async savePullRequests(prs: DBPullRequest[]): Promise<void> {
    if (prs.length === 0) return;
    const all = await this.readTable<DBPullRequest>("prs");
    const existingMap = new Map(all.map((item) => [item.id, item]));
    for (const pr of prs) {
      existingMap.set(pr.id, pr);
    }
    await this.writeTable("prs", Array.from(existingMap.values()));
    console.log(`[DB] Stored/updated ${prs.length} PRs`);
  }

  // --- COMMITS ---
  async listCommits(repoId?: string): Promise<DBCommit[]> {
    const commits = await this.readTable<DBCommit>("commits");
    if (repoId) {
      return commits.filter((c) => c.repoId === repoId);
    }
    return commits;
  }

  async saveCommits(commits: DBCommit[]): Promise<void> {
    if (commits.length === 0) return;
    const all = await this.readTable<DBCommit>("commits");
    const existingMap = new Map(all.map((item) => [item.id, item]));
    for (const commit of commits) {
      existingMap.set(commit.id, commit);
    }
    await this.writeTable("commits", Array.from(existingMap.values()));
    console.log(`[DB] Stored/updated ${commits.length} commits`);
  }

  // --- REVIEWS ---
  async listReviews(repoId?: string): Promise<DBReview[]> {
    const reviews = await this.readTable<DBReview>("reviews");
    if (repoId) {
      return reviews.filter((r) => r.repoId === repoId);
    }
    return reviews;
  }

  async saveReviews(reviews: DBReview[]): Promise<void> {
    if (reviews.length === 0) return;
    const all = await this.readTable<DBReview>("reviews");
    const existingMap = new Map(all.map((item) => [item.id, item]));
    for (const review of reviews) {
      existingMap.set(review.id, review);
    }
    await this.writeTable("reviews", Array.from(existingMap.values()));
    console.log(`[DB] Stored/updated ${reviews.length} review comments`);
  }

  // --- VECTOR CHUNKS ---
  async listVectorChunks(repoId?: string): Promise<DBVectorChunk[]> {
    const chunks = await this.readTable<DBVectorChunk>("vector_chunks");
    if (repoId) {
      return chunks.filter((c) => c.repoId === repoId);
    }
    return chunks;
  }

  async saveVectorChunks(chunks: DBVectorChunk[]): Promise<void> {
    if (chunks.length === 0) return;
    const all = await this.readTable<DBVectorChunk>("vector_chunks");
    const existingMap = new Map(all.map((item) => [item.id, item]));
    for (const chunk of chunks) {
      existingMap.set(chunk.id, chunk);
    }
    await this.writeTable("vector_chunks", Array.from(existingMap.values()));
    console.log(`[DB] Saved ${chunks.length} semantic vector chunks`);
  }
}

export const db = new DatabaseService();
