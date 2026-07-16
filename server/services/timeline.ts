import { db } from "./db";

export class TimelineService {
  /**
   * Retrieves commits, issues, PRs, and review comments for a repository
   * and fuses them into a structured timeline array matching the UI `WorkflowEvent` format.
   */
  async buildTimeline(owner: string, repo: string): Promise<any[]> {
    const repoId = `${owner}/${repo}`.toLowerCase();

    const commits = await db.listCommits(repoId);
    const issues = await db.listIssues(repoId);
    const prs = await db.listPullRequests(repoId);
    const reviews = await db.listReviews(repoId);

    const events: any[] = [];

    // Format Commits
    commits.forEach((c) => {
      events.push({
        id: `commit-${c.sha}`,
        timestamp: c.createdAt,
        type: "commit",
        title: `Commit: ${c.message.split("\n")[0]}`,
        author: c.authorName,
        meta: `SHA: ${c.sha.substring(0, 7)}`,
        hash: c.sha,
        entities: ["Commit", c.authorName],
        description: c.message,
      });
    });

    // Format Issues
    issues.forEach((i) => {
      events.push({
        id: `issue-${i.number}`,
        timestamp: i.createdAt,
        type: "issue",
        title: `Issue #${i.number}: ${i.title}`,
        author: i.author,
        meta: i.state === "open" ? "Active Open" : "Closed Resolution",
        hash: `Issue #${i.number}`,
        entities: ["Issue", i.author],
        description: i.body || "No description provided.",
      });
    });

    // Format Pull Requests
    prs.forEach((p) => {
      events.push({
        id: `pr-${p.number}`,
        timestamp: p.createdAt,
        type: "pr",
        title: `PR #${p.number}: ${p.title}`,
        author: p.author,
        meta: p.state === "merged" ? "Merged" : p.state === "open" ? "Under Review" : "Closed",
        hash: `PR #${p.number}`,
        entities: ["PR", p.author],
        description: p.body || "No description provided.",
      });
    });

    // Format Review Comments
    reviews.forEach((r) => {
      events.push({
        id: r.id,
        timestamp: r.createdAt,
        type: "review",
        title: `Review Comment by ${r.author}`,
        author: r.author,
        meta: r.state || "Comment",
        hash: `PR #${r.prNumber} Review`,
        entities: ["Review", r.author],
        description: r.body,
      });
    });

    // Sort chronologically (oldest first)
    events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return events;
  }
}

export const timelineService = new TimelineService();
