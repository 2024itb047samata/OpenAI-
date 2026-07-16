import React, { useState } from "react";
import {
  Link2,
  Shield,
  Settings2,
  RefreshCw,
  Check,
  Code,
  GitPullRequest,
  Database,
  Inbox,
  AlertCircle,
  Plus,
  GitCommit,
  BookOpen,
  ArrowRight,
  LogOut,
  Sparkles,
  HelpCircle
} from "lucide-react";
import { ModularConnector } from "../types";

interface ConnectorIntegrationsProps {
  connectors: ModularConnector[];
  onToggleConnector: (connectorId: string, updatedFields: Record<string, string>) => void;
  isGitHubConnected: boolean;
  githubUser: any;
  customRepos: any[];
  onAddRepo: (owner: string, repo: string) => Promise<any>;
  onIngestRepo: (owner: string, repo: string) => Promise<void>;
  onDisconnectGitHub: () => void;
  onSelectRepo: (repoId: string) => void;
  selectedCustomRepoId: string | null;
}

export default function ConnectorIntegrations({
  connectors,
  onToggleConnector,
  isGitHubConnected,
  githubUser,
  customRepos,
  onAddRepo,
  onIngestRepo,
  onDisconnectGitHub,
  onSelectRepo,
  selectedCustomRepoId
}: ConnectorIntegrationsProps) {
  const [activeTab, setActiveTab] = useState<string>("github");
  const [ownerInput, setOwnerInput] = useState<string>("");
  const [repoInput, setRepoInput] = useState<string>("");
  const [isAddingRepo, setIsAddingRepo] = useState<boolean>(false);
  const [repoError, setRepoError] = useState<string | null>(null);
  const [ingestionStatuses, setIngestionStatuses] = useState<Record<string, "idle" | "running" | "success" | "failed">>({});
  const [ingestionLogs, setIngestionLogs] = useState<Record<string, string>>({});

  const activeConn = connectors.find((c) => c.id === activeTab) || connectors[0];

  // Initiate GitHub OAuth Popup flow
  const handleConnectGitHub = async () => {
    try {
      const res = await fetch("/api/auth/github/url");
      if (!res.ok) {
        throw new Error("Failed to get authorization URL");
      }
      const { url } = await res.json();

      // Open the OAuth provider's URL directly in a popup window
      const authWindow = window.open(
        url,
        "github_oauth_popup",
        "width=600,height=700,status=no,resizable=yes"
      );

      if (!authWindow) {
        alert("Please enable popups for this site to complete GitHub authentication.");
      }
    } catch (err: any) {
      alert(`OAuth initialization failed: ${err.message}`);
    }
  };

  const handleRegisterRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerInput.trim() || !repoInput.trim()) return;

    setIsAddingRepo(true);
    setRepoError(null);
    try {
      await onAddRepo(ownerInput.trim(), repoInput.trim());
      setOwnerInput("");
      setRepoInput("");
    } catch (err: any) {
      setRepoError(err.message || "Failed to locate repository on GitHub.");
    } finally {
      setIsAddingRepo(false);
    }
  };

  const handleTriggerIngestion = async (repoId: string) => {
    setIngestionStatuses((prev) => ({ ...prev, [repoId]: "running" }));
    setIngestionLogs((prev) => ({ ...prev, [repoId]: "Initializing GitHub Ingestion pipeline...\n" }));

    try {
      const updateLogs = (msg: string) => {
        setIngestionLogs((prev) => ({ ...prev, [repoId]: (prev[repoId] || "") + msg + "\n" }));
      };

      updateLogs("Connecting security proxy tunnel...");
      await new Promise((r) => setTimeout(r, 600));

      updateLogs("Fetching recent repository commits (real integration)...");
      await new Promise((r) => setTimeout(r, 600));

      updateLogs("Fetching Issues & PR reviews...");
      await new Promise((r) => setTimeout(r, 600));

      updateLogs("Parsing commit message structures & calculating entity links...");
      await new Promise((r) => setTimeout(r, 600));

      updateLogs("Generating Gemini text-embedding-004 vectors (semantic indexing)...");
      
      // Perform the actual backend ingestion API call!
      const [owner, repo] = repoId.split("/");
      const res = await fetch(`/api/repositories/${owner}/${repo}/ingest`, {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Ingestion API returned failed status");
      }

      const data = await res.json();
      updateLogs(`[OK] Successfully ingested:\n - ${data.counts.commits} Commits\n - ${data.counts.prs} Pull Requests\n - ${data.counts.issues} Issues\n - ${data.counts.reviews} Review Comments`);
      
      setIngestionStatuses((prev) => ({ ...prev, [repoId]: "success" }));
    } catch (err: any) {
      setIngestionStatuses((prev) => ({ ...prev, [repoId]: "failed" }));
      setIngestionLogs((prev) => ({
        ...prev,
        [repoId]: (prev[repoId] || "") + `[ERROR] Pipeline crashed: ${err.message}\nEnsure your GEMINI_API_KEY is configured.`,
      }));
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5" id="connector-integrations-module">
      {/* Left List of available modular services */}
      <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col gap-3">
        <div>
          <span className="text-[10px] font-mono font-bold text-slate-500 block uppercase tracking-wider">
            Modular Connectors
          </span>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Connect external repositories or platforms into your central Semantic Knowledge Base.
          </p>
        </div>

        <nav className="space-y-1.5 pt-2 border-t border-slate-800">
          {/* GitHub Connector */}
          <button
            onClick={() => setActiveTab("github")}
            className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all ${
              activeTab === "github"
                ? "bg-indigo-600/10 border-indigo-500/40 text-indigo-400 font-bold"
                : "bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-300"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`p-1.5 rounded ${
                  isGitHubConnected ? "bg-emerald-500/15 text-emerald-400" : "bg-slate-900 text-slate-500"
                }`}
              >
                <Code size={13} />
              </div>
              <div>
                <span className="text-xs font-sans font-bold block text-slate-200">GitHub Connector</span>
                <span className="text-[9px] font-mono text-slate-500 uppercase">LIVE SYNC</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 font-mono text-[9px]">
              {isGitHubConnected ? (
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> ACTIVE
                </span>
              ) : (
                <span className="text-slate-600">UNLINKED</span>
              )}
            </div>
          </button>

          {/* Jira, Slack, Notion Connectors (Showing modularity) */}
          {connectors
            .filter((c) => c.id !== "github")
            .map((conn) => {
              const isActive = activeTab === conn.id;
              return (
                <button
                  key={conn.id}
                  onClick={() => setActiveTab(conn.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all ${
                    isActive
                      ? "bg-indigo-600/10 border-indigo-500/40 text-indigo-400 font-bold"
                      : "bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded bg-slate-900 text-slate-600">
                      <Link2 size={13} />
                    </div>
                    <div>
                      <span className="text-xs font-sans font-bold block text-slate-300">{conn.name}</span>
                      <span className="text-[9px] font-mono text-slate-600 uppercase">{conn.type} CONNECTOR</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono text-slate-700">MODULAR</span>
                </button>
              );
            })}
        </nav>

        {/* Modular SDK Architecture Spec Box */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 mt-auto text-[10px] space-y-1.5 font-mono text-slate-400">
          <div className="flex items-center gap-1 text-slate-300">
            <Shield size={11} className="text-indigo-400" />
            <span className="font-bold">MODULAR EXTENSION SDK</span>
          </div>
          <p className="text-[9px] leading-relaxed text-slate-500">
            The Time Machine core accepts structured logs from any developer tool. New integrations (Jira, Slack, Notion) extend the <code className="text-indigo-300 bg-slate-900 px-1 py-0.5 rounded">BaseConnector</code> schema to map timelines without modifying the core AI search algorithm.
          </p>
        </div>
      </div>

      {/* Right Service Config Panels */}
      <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col h-full min-h-[420px]">
        {activeTab === "github" ? (
          <div className="space-y-5 flex-1 flex flex-col">
            {/* Header properties */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-3">
              <div>
                <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-wider block">
                  GitHub Connector
                </span>
                <h3 className="text-xs font-sans font-bold text-slate-200 mt-0.5">
                  Sync Repositories & Manage Connection
                </h3>
              </div>

              {isGitHubConnected ? (
                <div className="flex items-center gap-3 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                  {githubUser?.avatar_url && (
                    <img
                      src={githubUser.avatar_url}
                      alt="avatar"
                      className="w-5 h-5 rounded-full border border-indigo-500/30"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <span className="text-[10px] font-mono text-slate-300 font-bold">
                    @{githubUser?.login || "User"}
                  </span>
                  <button
                    onClick={onDisconnectGitHub}
                    className="p-1 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                    title="Disconnect GitHub Link"
                  >
                    <LogOut size={12} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleConnectGitHub}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Code size={11} />
                  <span>Connect GitHub Account</span>
                </button>
              )}
            </div>

            {/* GitHub rate limit warning if unauthenticated */}
            {!isGitHubConnected && (
              <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-lg text-[11px] text-slate-400 leading-relaxed flex items-start gap-2">
                <AlertCircle size={14} className="text-indigo-400 shrink-0 mt-0.5" />
                <p>
                  GitHub API is currently executing in **public rate-limited mode** (60 calls/hr max). 
                  Click <strong>Connect GitHub Account</strong> to unlock 5,000 requests/hr, connect private repositories, and trace actual user timelines securely!
                </p>
              </div>
            )}

            {/* Ingestion Console & Workspace */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 flex-1">
              {/* Left Form: Register Repo */}
              <div className="md:col-span-5 space-y-4">
                <div className="space-y-1">
                  <h4 className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-tight">
                    Add Repository
                  </h4>
                  <p className="text-[9px] text-slate-500">
                    Connect any public or authenticated GitHub repository to parse its issues, PRs, and commit history.
                  </p>
                </div>

                <form onSubmit={handleRegisterRepo} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-mono">Owner / Organization</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. facebook"
                      value={ownerInput}
                      onChange={(e) => setOwnerInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-mono">Repository Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. react"
                      value={repoInput}
                      onChange={(e) => setRepoInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-800"
                    />
                  </div>

                  {repoError && (
                    <div className="text-[9px] font-mono text-red-400 bg-red-950/20 p-2 rounded border border-red-900/30">
                      {repoError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isAddingRepo || !ownerInput.trim() || !repoInput.trim()}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded py-2 text-[10px] font-bold font-mono transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isAddingRepo ? (
                      <>
                        <RefreshCw size={11} className="animate-spin" />
                        <span>Querying GitHub...</span>
                      </>
                    ) : (
                      <>
                        <Plus size={11} />
                        <span>Add Repository</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Right List: Ingested Repositories */}
              <div className="md:col-span-7 flex flex-col space-y-3">
                <div className="space-y-1">
                  <h4 className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-tight">
                    Connected Repositories
                  </h4>
                  <p className="text-[9px] text-slate-500">
                    Select a repository to toggle it as active, or click "Sync Repository" to index it.
                  </p>
                </div>

                <div className="flex-1 max-h-[220px] overflow-y-auto space-y-2 pr-1">
                  {customRepos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-slate-600 border border-dashed border-slate-800 rounded-lg">
                      <Database size={16} className="mb-1" />
                      <span className="text-[10px] font-mono">No target repositories registered.</span>
                    </div>
                  ) : (
                    customRepos.map((rp) => {
                      const isActive = selectedCustomRepoId === rp.id;
                      const status = ingestionStatuses[rp.id] || (rp.lastSyncedAt ? "success" : "idle");
                      return (
                        <div
                          key={rp.id}
                          className={`p-2.5 rounded-lg border flex flex-col gap-2 transition-all ${
                            isActive
                              ? "bg-indigo-600/5 border-indigo-500/40"
                              : "bg-slate-950/40 border-slate-800/80 hover:border-slate-800"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="cursor-pointer" onClick={() => onSelectRepo(rp.id)}>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-sans font-bold text-slate-200">
                                  {rp.id}
                                </span>
                                {isActive && (
                                  <span className="text-[8px] font-mono bg-indigo-500/20 text-indigo-400 px-1 py-0.2 rounded uppercase font-bold">
                                    ACTIVE REPO
                                  </span>
                                )}
                              </div>
                              <span className="text-[9px] font-mono text-slate-500 leading-tight block truncate max-w-[200px]">
                                {rp.description || "No description provided."}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {status === "success" && (
                                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/20 px-1.5 py-0.5 rounded border border-emerald-900/30 flex items-center gap-1">
                                  <Check size={8} /> INDEXED
                                </span>
                              )}
                              {status === "running" && (
                                <span className="text-[9px] font-mono text-indigo-400 bg-indigo-950/20 px-1.5 py-0.5 rounded border border-indigo-900/30 flex items-center gap-1 animate-pulse">
                                  <RefreshCw size={8} className="animate-spin" /> SYNCING
                                </span>
                              )}
                              {status === "idle" && (
                                <span className="text-[9px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 flex items-center gap-1">
                                  PENDING
                                </span>
                              )}
                              {status === "failed" && (
                                <span className="text-[9px] font-mono text-red-400 bg-red-950/20 px-1.5 py-0.5 rounded border border-red-900/30 flex items-center gap-1">
                                  FAILED
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Trigger ingestion / sync */}
                          <div className="flex items-center justify-between border-t border-slate-800/40 pt-2 text-[9px] font-mono text-slate-500">
                            <span>Last indexed: {rp.lastSyncedAt ? new Date(rp.lastSyncedAt).toLocaleDateString() : "Never"}</span>
                            
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handleTriggerIngestion(rp.id)}
                                disabled={status === "running"}
                                className="px-2 py-0.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded transition-colors cursor-pointer"
                              >
                                {rp.lastSyncedAt ? "Re-index" : "Sync Repository"}
                              </button>
                            </div>
                          </div>

                          {/* Show logs box if running or failed */}
                          {ingestionLogs[rp.id] && (
                            <div className="bg-slate-950 border border-slate-900 p-2 rounded text-[8px] font-mono text-slate-400 whitespace-pre-wrap leading-normal max-h-[110px] overflow-y-auto">
                              {ingestionLogs[rp.id]}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full space-y-4">
            {/* Header properties */}
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-wider block">
                  Configuration Panel
                </span>
                <h3 className="text-xs font-sans font-bold text-slate-200 mt-0.5">
                  {activeConn.name} Integration Properties
                </h3>
              </div>
            </div>

            <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-lg text-slate-400 text-xs flex items-center gap-2.5 font-medium leading-relaxed">
              <AlertCircle size={14} className="shrink-0 text-indigo-400" />
              <span>
                The connector <strong>{activeConn.name}</strong> is pre-registered in the modular system. Configure details below to activate live pipelines.
              </span>
            </div>

            {/* Config Fields Form */}
            <div className="flex-1 space-y-4">
              <div className="space-y-3">
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block flex items-center gap-1">
                  <Settings2 size={12} />
                  API ENDPOINTS & ENCRYPTED TOKENS
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeConn.configSchema.fields.map((fld) => (
                    <div key={fld.name} className="flex flex-col gap-1.5">
                      <label className="text-[11px] text-slate-400 font-medium font-mono">{fld.label}</label>
                      <input
                        type={fld.type}
                        placeholder={fld.placeholder}
                        disabled
                        className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs font-mono text-slate-600 focus:outline-none placeholder:text-slate-800"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Save Action */}
            <div className="border-t border-slate-800 pt-3.5 mt-auto flex justify-end gap-2.5">
              <button
                disabled
                className="px-3 py-1.5 rounded text-xs font-bold font-mono tracking-tight bg-slate-950 border border-slate-800 text-slate-600 cursor-not-allowed flex items-center gap-1.5"
              >
                <Check size={12} />
                <span>Enable Connector</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
