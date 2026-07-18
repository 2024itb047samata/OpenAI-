import { db } from "./db";
import { gitHubService } from "./github";
import { vectorService } from "./vector";
import { DBReview } from "../types";

export class IngestionService {
  /**
   * Run the full pipeline for a registered repository:
   * 1. Fetch commits, issues, PRs, PR Reviews from GitHub
   * 2. Save items into the database (JSON Storage)
   * 3. Run semantic chunking, embedding generation & index chunks
   * 4. Update the sync status
   */
  async ingestRepository(owner: string, repo: string, accessToken?: string) {
    const repoId = `${owner}/${repo}`.toLowerCase();

    const repository = await db.getRepository(repoId);
    if (!repository) {
      throw new Error("Repository metadata must be registered first.");
    }

    console.log(`[IngestionService] Starting ingestion pipeline for ${repoId}`);

    // Step 1: Fetch data from GitHub API
    const commits = await gitHubService.fetchCommits(owner, repo, accessToken);
    const prs = await gitHubService.fetchPullRequests(owner, repo, accessToken);
    const issues = await gitHubService.fetchIssues(owner, repo, accessToken);
    const branches = await gitHubService.fetchBranches(owner, repo, accessToken);
    const releases = await gitHubService.fetchReleases(owner, repo, accessToken);

    // Requirement 2: Log the number of objects returned from each GitHub API endpoint in requested format
    console.log(`\n[GitHub Ingestion Pipeline Summary for ${repoId}]:`);
    console.log(`Commits: ${commits.length}`);
    console.log(`Pull Requests: ${prs.length}`);
    console.log(`Issues: ${issues.length}`);
    console.log(`Branches: ${branches.length}`);
    console.log(`Releases: ${releases.length}\n`);

    // Step 2: Save to DB
    await db.saveCommits(commits);
    await db.saveIssues(issues);
    await db.savePullRequests(prs);

    // Fetch Reviews for each PR
    const allReviews: DBReview[] = [];
    for (const pr of prs) {
      const prReviews = await gitHubService.fetchPRReviews(owner, repo, pr.number, accessToken);
      allReviews.push(...prReviews);
    }
    await db.saveReviews(allReviews);

    // Step 3: Semantic indexing & embedding generation
    console.log(`[IngestionService] Semantic indexing in progress for ${repoId}...`);

    // Index Commits
    for (const c of commits) {
      await vectorService.indexEntity(repoId, "commit", c.id, c.message, {
        title: `Commit by ${c.authorName}`,
        sha: c.sha,
        author: c.authorName,
        createdAt: c.createdAt,
      });
    }

    // Index Issues
    for (const i of issues) {
      await vectorService.indexEntity(repoId, "issue", i.id, `${i.title}\n\n${i.body || ""}`, {
        title: `Issue #${i.number}: ${i.title}`,
        number: i.number,
        author: i.author,
        createdAt: i.createdAt,
      });
    }

    // Index PRs
    for (const p of prs) {
      await vectorService.indexEntity(repoId, "pr", p.id, `${p.title}\n\n${p.body || ""}`, {
        title: `PR #${p.number}: ${p.title}`,
        number: p.number,
        author: p.author,
        createdAt: p.createdAt,
      });
    }

    // Index Reviews
    for (const r of allReviews) {
      await vectorService.indexEntity(repoId, "review", r.id, r.body, {
        title: `PR #${r.prNumber} Review Comment by ${r.author}`,
        number: r.prNumber,
        author: r.author,
        createdAt: r.createdAt,
      });
    }

    // Step 4: Update Repository sync time
    repository.lastSyncedAt = new Date().toISOString();
    await db.saveRepository(repository);

    console.log(`[IngestionService] Ingestion pipeline successfully completed for ${repoId}!`);

    return {
      commits: commits.length,
      issues: issues.length,
      prs: prs.length,
      reviews: allReviews.length,
      branches: branches.length,
      releases: releases.length,
    };
  }
}

export const ingestionService = new IngestionService();
