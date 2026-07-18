import { DBRepository, DBIssue, DBPullRequest, DBCommit, DBReview } from "../types";

export class GitHubService {
  private getHeaders(token?: string): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "User-Agent": "CodeStory-Forensics",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    } else if (process.env.GITHUB_TOKEN) {
      headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
    }
    return headers;
  }

  /**
   * Exchange GitHub OAuth temporary code for an Access Token
   */
  async exchangeOAuthCode(code: string): Promise<{ access_token: string; scope: string }> {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("GitHub OAuth is unconfigured. Please define GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in Secrets.");
    }

    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GitHub token exchange failed: ${errorText}`);
    }

    const data: any = await response.json();
    if (data.error) {
      throw new Error(`GitHub OAuth Error: ${data.error_description || data.error}`);
    }

    return data;
  }

  /**
   * Get Authenticated User Details
   */
  async getAuthenticatedUser(token: string): Promise<any> {
    const response = await fetch("https://api.github.com/user", {
      headers: this.getHeaders(token),
    });
    if (!response.ok) {
      throw new Error("Failed to fetch GitHub user profile");
    }
    return response.json();
  }

  /**
   * Fetch repository metadata
   */
  async fetchRepoMetadata(owner: string, repo: string, token?: string): Promise<DBRepository> {
    console.log(`[GitHub] Fetching repository metadata for ${owner}/${repo}`);
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: this.getHeaders(token),
    });

    if (!res.ok) {
      throw new Error(`Repository ${owner}/${repo} not found or inaccessible on GitHub. Status: ${res.status}`);
    }

    const data: any = await res.json();
    return {
      id: `${owner}/${repo}`.toLowerCase(),
      owner: data.owner?.login || owner,
      name: data.name || repo,
      description: data.description || null,
      stars: data.stargazers_count || 0,
      createdAt: data.created_at,
      lastSyncedAt: new Date().toISOString(),
    };
  }

  /**
   * Fetch recent Commits
   */
  async fetchCommits(owner: string, repo: string, token?: string, limit = 15): Promise<DBCommit[]> {
    console.log(`[GitHub] Fetching commits for ${owner}/${repo}`);
    const repoId = `${owner}/${repo}`.toLowerCase();
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=${limit}`, {
      headers: this.getHeaders(token),
    });

    if (!res.ok) {
      console.warn(`[GitHub] Failed to fetch commits: ${res.statusText}`);
      return [];
    }

    const data: any = await res.json();
    console.log(`[GitHub API Response] Commits endpoint returned status ${res.status}, count: ${Array.isArray(data) ? data.length : 0}`);
    if (Array.isArray(data) && data.length > 0) {
      console.log(`[GitHub API Response] Sample commit:`, {
        sha: data[0].sha,
        message: data[0].commit?.message,
        author: data[0].commit?.author?.name
      });
    }
    if (!Array.isArray(data)) return [];

    return data.map((item: any) => ({
      id: item.sha,
      repoId,
      sha: item.sha,
      message: item.commit?.message || "No commit message",
      authorName: item.commit?.author?.name || item.author?.login || "unknown",
      authorEmail: item.commit?.author?.email || "",
      createdAt: item.commit?.author?.date || new Date().toISOString(),
      parents: Array.isArray(item.parents) ? item.parents.map((p: any) => p.sha) : [],
    }));
  }

  /**
   * Fetch recent Issues (excluding PRs)
   */
  async fetchIssues(owner: string, repo: string, token?: string, limit = 15): Promise<DBIssue[]> {
    console.log(`[GitHub] Fetching issues for ${owner}/${repo}`);
    const repoId = `${owner}/${repo}`.toLowerCase();
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues?state=all&per_page=${limit * 2}`, {
      headers: this.getHeaders(token),
    });

    if (!res.ok) {
      console.warn(`[GitHub] Failed to fetch issues: ${res.statusText}`);
      return [];
    }

    const data: any = await res.json();
    console.log(`[GitHub API Response] Issues endpoint returned status ${res.status}, count: ${Array.isArray(data) ? data.length : 0}`);
    if (Array.isArray(data) && data.length > 0) {
      console.log(`[GitHub API Response] Sample issue/PR:`, {
        number: data[0].number,
        title: data[0].title,
        is_pr: !!data[0].pull_request
      });
    }
    if (!Array.isArray(data)) return [];

    const issuesOnly = data.filter((item: any) => !item.pull_request);

    return issuesOnly.slice(0, limit).map((item: any) => ({
      id: `${repoId}#${item.number}`,
      repoId,
      number: item.number,
      title: item.title,
      body: item.body || null,
      state: item.state === "open" ? "open" : "closed",
      author: item.user?.login || "unknown",
      createdAt: item.created_at,
      closedAt: item.closed_at || null,
    }));
  }

  /**
   * Fetch recent Pull Requests
   */
  async fetchPullRequests(owner: string, repo: string, token?: string, limit = 15): Promise<DBPullRequest[]> {
    console.log(`[GitHub] Fetching PRs for ${owner}/${repo}`);
    const repoId = `${owner}/${repo}`.toLowerCase();
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls?state=all&per_page=${limit}`, {
      headers: this.getHeaders(token),
    });

    if (!res.ok) {
      console.warn(`[GitHub] Failed to fetch PRs: ${res.statusText}`);
      return [];
    }

    const data: any = await res.json();
    console.log(`[GitHub API Response] PRs endpoint returned status ${res.status}, count: ${Array.isArray(data) ? data.length : 0}`);
    if (Array.isArray(data) && data.length > 0) {
      console.log(`[GitHub API Response] Sample PR:`, {
        number: data[0].number,
        title: data[0].title,
        state: data[0].state
      });
    }
    if (!Array.isArray(data)) return [];

    return data.map((item: any) => ({
      id: `${repoId}#${item.number}`,
      repoId,
      number: item.number,
      title: item.title,
      body: item.body || null,
      state: item.merged_at ? "merged" : item.state === "open" ? "open" : "closed",
      author: item.user?.login || "unknown",
      createdAt: item.created_at,
      mergedAt: item.merged_at || null,
      baseBranch: item.base?.ref || "main",
      headBranch: item.head?.ref || "feature",
    }));
  }

  /**
   * Fetch review comments for a set of PRs
   */
  async fetchPRReviews(owner: string, repo: string, prNumber: number, token?: string): Promise<DBReview[]> {
    console.log(`[GitHub] Fetching reviews for PR #${prNumber} in ${owner}/${repo}`);
    const repoId = `${owner}/${repo}`.toLowerCase();
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/reviews`, {
      headers: this.getHeaders(token),
    });

    if (!res.ok) {
      return [];
    }

    const data: any = await res.json();
    console.log(`[GitHub API Response] PR #${prNumber} Reviews returned status ${res.status}, count: ${Array.isArray(data) ? data.length : 0}`);
    if (!Array.isArray(data)) return [];

    return data.map((item: any) => ({
      id: `review_${item.id}`,
      repoId,
      prNumber,
      author: item.user?.login || "unknown",
      body: item.body || "",
      state: item.state,
      createdAt: item.submitted_at || new Date().toISOString(),
      commitId: item.commit_id || null,
    }));
  }

  /**
   * Fetch branches
   */
  async fetchBranches(owner: string, repo: string, token?: string, limit = 30): Promise<any[]> {
    console.log(`[GitHub] Fetching branches for ${owner}/${repo}`);
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches?per_page=${limit}`, {
      headers: this.getHeaders(token),
    });

    if (!res.ok) {
      console.warn(`[GitHub] Failed to fetch branches: ${res.statusText}`);
      return [];
    }

    const data: any = await res.json();
    console.log(`[GitHub API Response] Branches endpoint returned status ${res.status}, count: ${Array.isArray(data) ? data.length : 0}`);
    if (Array.isArray(data) && data.length > 0) {
      console.log(`[GitHub API Response] Sample branches:`, data.slice(0, 3).map((b: any) => b.name));
    }
    if (!Array.isArray(data)) return [];
    return data;
  }

  /**
   * Fetch releases
   */
  async fetchReleases(owner: string, repo: string, token?: string, limit = 30): Promise<any[]> {
    console.log(`[GitHub] Fetching releases for ${owner}/${repo}`);
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases?per_page=${limit}`, {
      headers: this.getHeaders(token),
    });

    if (!res.ok) {
      console.warn(`[GitHub] Failed to fetch releases: ${res.statusText}`);
      return [];
    }

    const data: any = await res.json();
    console.log(`[GitHub API Response] Releases endpoint returned status ${res.status}, count: ${Array.isArray(data) ? data.length : 0}`);
    if (Array.isArray(data) && data.length > 0) {
      console.log(`[GitHub API Response] Sample releases:`, data.slice(0, 3).map((r: any) => r.name || r.tag_name));
    }
    if (!Array.isArray(data)) return [];
    return data;
  }
}

export const gitHubService = new GitHubService();
