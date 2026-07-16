export interface DBRepository {
  id: string; // "owner/repo"
  owner: string;
  name: string;
  description: string | null;
  stars: number;
  createdAt: string;
  lastSyncedAt: string | null;
}

export interface DBIssue {
  id: string; // "owner/repo#number"
  repoId: string;
  number: number;
  title: string;
  body: string | null;
  state: "open" | "closed";
  author: string;
  createdAt: string;
  closedAt: string | null;
}

export interface DBPullRequest {
  id: string; // "owner/repo#number"
  repoId: string;
  number: number;
  title: string;
  body: string | null;
  state: "open" | "closed" | "merged";
  author: string;
  createdAt: string;
  mergedAt: string | null;
  baseBranch: string;
  headBranch: string;
}

export interface DBCommit {
  id: string; // sha hash
  repoId: string;
  sha: string;
  message: string;
  authorName: string;
  authorEmail: string;
  createdAt: string;
  parents: string[];
}

export interface DBReview {
  id: string; // string ID
  repoId: string;
  prNumber: number;
  author: string;
  body: string;
  state: string; // "APPROVED", "CHANGES_REQUESTED", "COMMENTED"
  createdAt: string;
  commitId: string | null;
}

export interface DBVectorChunk {
  id: string;
  repoId: string;
  entityType: "issue" | "pr" | "commit" | "review";
  entityId: string; // foreign key to the resource
  text: string;
  embedding: number[];
  metadata: {
    title?: string;
    number?: number;
    author?: string;
    createdAt?: string;
    sha?: string;
  };
}
