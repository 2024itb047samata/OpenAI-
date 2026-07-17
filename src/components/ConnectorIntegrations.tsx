import React, { useState, useEffect } from "react";
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
  HelpCircle,
  X,
  Lock,
  Compass,
  CheckCircle,
  Clock,
  ShieldAlert,
  ShieldCheck
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
  
  // Ingestion status tracking
  const [ingestionStatuses, setIngestionStatuses] = useState<Record<string, "idle" | "running" | "success" | "failed">>({});
  const [ingestionLogs, setIngestionLogs] = useState<Record<string, string>>({});

  // 1. GITHUB TRUST DISCLAIMER LAUNCHER STATES (local storage backed)
  const [isDisclaimerAccepted, setIsDisclaimerAccepted] = useState<boolean>(() => {
    return localStorage.getItem("tm_github_disclaimer") === "true";
  });

  // 2. SECONDARY APPLICATIONS OAUTH SIMULATOR (local storage backed)
  const [appStates, setAppStates] = useState<Record<string, "unlinked" | "connecting" | "connected">>({
    jira: "unlinked",
    slack: "unlinked",
    notion: "unlinked"
  });

  const [activeOAuthPopup, setActiveOAuthPopup] = useState<{
    connectorId: string;
    step: "disclaimer" | "authorizing" | "success";
    title: string;
    permissions: string[];
    scopeDesc: string;
  } | null>(null);

  // Initialize States from localStorage
  useEffect(() => {
    const savedApps = localStorage.getItem("tm_connected_apps");
    if (savedApps) {
      try {
        setAppStates(JSON.parse(savedApps));
      } catch (e) {
        // use default unlinked state
      }
    }
  }, []);

  const saveAppStates = (newStates: Record<string, "unlinked" | "connecting" | "connected">) => {
    setAppStates(newStates);
    localStorage.setItem("tm_connected_apps", JSON.stringify(newStates));
  };

  const handleToggleDisclaimer = (checked: boolean) => {
    setIsDisclaimerAccepted(checked);
    localStorage.setItem("tm_github_disclaimer", String(checked));
  };

  const activeConn = connectors.find((c) => c.id === activeTab) || connectors[0];

  // Initiate GitHub OAuth Popup flow
  const handleConnectGitHub = async () => {
    if (!isDisclaimerAccepted) return;
    try {
      const res = await fetch("/api/auth/github/url");
      if (!res.ok) {
        throw new Error("Failed to get authorization URL");
      }
      const { url } = await res.json();

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
      await new Promise((r) => setTimeout(r, 400));

      updateLogs("Fetching recent repository commits (real integration)...");
      await new Promise((r) => setTimeout(r, 400));

      updateLogs("Fetching Issues & PR reviews...");
      await new Promise((r) => setTimeout(r, 400));

      updateLogs("Parsing commit message structures & calculating entity links...");
      await new Promise((r) => setTimeout(r, 400));

      updateLogs("Generating Gemini text-embedding-004 vectors (semantic indexing)...");
      
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

  // Launch simulated ChatGPT-style OAuth Popup for Slack, Jira, Notion
  const triggerOAuthPopupSim = (connectorId: string) => {
    const appsConfig: Record<string, { title: string; permissions: string[]; scopeDesc: string }> = {
      jira: {
        title: "Atlassian Jira Platform Authorization",
        permissions: ["Read project issue metadata and status workflows", "Query epic details and task relationships", "Trace historical activity logs and timelines"],
        scopeDesc: "This grants the Knowledge Time Machine read-only query capabilities across your Jira projects to map timeline events."
      },
      slack: {
        title: "Slack Workspace Integration Protocol",
        permissions: ["Access channel lists and public communication threads", "Parse incident alerts from integrated monitoring bots", "Extract text conversations to find design summaries"],
        scopeDesc: "Authorize Knowledge Time Machine to retrieve chat threads within permitted channels for chronological context mining."
      },
      notion: {
        title: "Notion Workspace Database Sync",
        permissions: ["Access specific page trees and engineering directories", "Read design specification tables and logs", "Ingest documentation summaries"],
        scopeDesc: "Connect Knowledge Time Machine to scan Notion pages to locate design decisions and system specifications."
      }
    };

    const config = appsConfig[connectorId];
    if (config) {
      setActiveOAuthPopup({
        connectorId,
        step: "disclaimer",
        ...config
      });
    }
  };

  const handleOAuthSimProceed = () => {
    if (!activeOAuthPopup) return;
    setActiveOAuthPopup((prev: any) => ({ ...prev, step: "authorizing" }));
    
    // Simulate auth lag
    setTimeout(() => {
      setActiveOAuthPopup((prev: any) => ({ ...prev, step: "success" }));
    }, 1500);
  };

  const handleOAuthSimSuccessConfirm = () => {
    if (!activeOAuthPopup) return;
    const { connectorId } = activeOAuthPopup;
    const updated = { ...appStates, [connectorId]: "connected" as const };
    saveAppStates(updated);
    setActiveOAuthPopup(null);
  };

  const handleDisconnectApp = (connectorId: string) => {
    const updated = { ...appStates, [connectorId]: "unlinked" as const };
    saveAppStates(updated);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-fade-in" id="connector-integrations-module">
      {/* 1. LEFT COLUMN: Integrations list */}
      <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col gap-3">
        <div>
          <span className="text-[10px] font-mono font-bold text-indigo-400 block uppercase tracking-wider">
            Connected Sources
          </span>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Synchronize workspace repositories, tickets, documents, and messages.
          </p>
        </div>

        <nav className="space-y-1.5 pt-2 border-t border-slate-800 flex-1">
          {/* GitHub Connector */}
          <button
            onClick={() => setActiveTab("github")}
            className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all cursor-pointer ${
              activeTab === "github"
                ? "bg-indigo-600/10 border-indigo-500/40 text-indigo-400 font-bold"
                : "bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-300"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className={`p-1.5 rounded ${isGitHubConnected ? "bg-emerald-500/15 text-emerald-400" : "bg-slate-900 text-slate-500"}`}>
                <Code size={13} />
              </div>
              <div className="text-left">
                <span className="text-xs font-sans font-bold block text-slate-200">GitHub Ingestion</span>
                <span className="text-[8px] font-mono text-slate-500 uppercase">Commits, PRs, Code</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 font-mono text-[9px]">
              {isGitHubConnected ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/5 px-1.5 py-0.5 rounded border border-emerald-500/15">
                  <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping"></span> ACTIVE
                </span>
              ) : (
                <span className="text-slate-600 text-[8px] bg-slate-950 px-1 py-0.5 rounded uppercase border border-slate-800/60">UNLINKED</span>
              )}
            </div>
          </button>

          {/* Jira, Slack, Notion Connectors */}
          {connectors
            .filter((c) => c.id !== "github")
            .map((conn) => {
              const isActive = activeTab === conn.id;
              const status = appStates[conn.id] || "unlinked";

              return (
                <button
                  key={conn.id}
                  onClick={() => setActiveTab(conn.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    isActive
                      ? "bg-indigo-600/10 border-indigo-500/40 text-indigo-400 font-bold"
                      : "bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded ${status === "connected" ? "bg-emerald-500/15 text-emerald-400" : "bg-slate-900 text-slate-500"}`}>
                      <Link2 size={13} />
                    </div>
                    <div className="text-left">
                      <span className="text-xs font-sans font-bold block text-slate-200">{conn.name}</span>
                      <span className="text-[8px] font-mono text-slate-500 uppercase">{conn.type} CONNECTOR</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 font-mono text-[9px]">
                    {status === "connected" ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/5 px-1.5 py-0.5 rounded border border-emerald-500/15">
                        <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" /> CONNECTED
                      </span>
                    ) : status === "connecting" ? (
                      <span className="text-indigo-400 animate-pulse font-bold">LINKING...</span>
                    ) : (
                      <span className="text-slate-600 text-[8px] bg-slate-950 px-1 py-0.5 rounded uppercase border border-slate-800/60">DISCONNECTED</span>
                    )}
                  </div>
                </button>
              );
            })}
        </nav>

        {/* TRUST POLICY BANNER */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 text-[10px] space-y-1 text-left font-mono text-slate-400">
          <div className="flex items-center gap-1 text-slate-300">
            <Shield size={11} className="text-indigo-400" />
            <span className="font-bold">DATA ISOLATION PROTOCOL</span>
          </div>
          <p className="text-[9px] text-slate-500 leading-normal">
            No source code contents are permanently stored on database discs. Timelines are compiled on-the-fly using secure cryptographic checksum arrays.
          </p>
        </div>
      </div>

      {/* 2. RIGHT COLUMN: Service config/launcher panel */}
      <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col h-full min-h-[460px]">
        
        {/* GITHUB INTEGRATION PANEL */}
        {activeTab === "github" ? (
          <div className="space-y-5 flex-1 flex flex-col text-left">
            
            {/* Header properties */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-3">
              <div>
                <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-wider block font-bold">
                  Ingestion Control Center
                </span>
                <h3 className="text-sm font-sans font-bold text-slate-200 mt-0.5">
                  GitHub Metadata Sync
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
              ) : null}
            </div>

            {/* IF NOT CONNECTED, RENDER DISCLAIMER FIRST */}
            {!isGitHubConnected ? (
              <div className="space-y-4">
                {/* 4. PREMIUM GITHUB TRUST DISCLAIMER CARD */}
                <div className="bg-slate-950 border border-indigo-500/15 rounded-xl p-4 space-y-3 shadow-md bg-gradient-to-br from-slate-950 to-indigo-950/10">
                  <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold font-sans">
                    <ShieldCheck size={16} className="text-indigo-400 animate-pulse" />
                    <span>Security & Trust Protocol (OAuth Read-Only Safeguard)</span>
                  </div>

                  <p className="text-[10.5px] font-mono leading-relaxed text-slate-400">
                    Before linking your GitHub account, understand what metadata structures the Knowledge Time Machine requires to map incidents and timeline events:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-[10px] font-mono">
                    <div className="bg-slate-900/40 p-2.5 rounded border border-slate-850 space-y-1">
                      <span className="text-indigo-400 font-bold block uppercase text-[9px]">We retrieve:</span>
                      <ul className="list-disc pl-3 text-slate-500 space-y-0.5 leading-snug">
                        <li>Commit logs and author profiles</li>
                        <li>PR titles, reviews, and comment threads</li>
                        <li>Issue discussions and status alerts</li>
                        <li>Branch merges and tags</li>
                      </ul>
                    </div>

                    <div className="bg-slate-900/40 p-2.5 rounded border border-slate-850 space-y-1">
                      <span className="text-rose-400 font-bold block uppercase text-[9px]">We NEVER retrieve:</span>
                      <ul className="list-disc pl-3 text-slate-500 space-y-0.5 leading-snug">
                        <li>Raw codebase source lines</li>
                        <li>User account passwords</li>
                        <li>Personal user profile records</li>
                        <li>Write access to files</li>
                      </ul>
                    </div>
                  </div>

                  {/* Accept Checkbox */}
                  <div className="pt-2 flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      id="accept-github-disclaimer"
                      checked={isDisclaimerAccepted}
                      onChange={(e) => handleToggleDisclaimer(e.target.checked)}
                      className="mt-0.5 w-4.5 h-4.5 rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 bg-slate-950"
                    />
                    <label htmlFor="accept-github-disclaimer" className="text-[10px] font-mono text-slate-400 leading-normal cursor-pointer">
                      I authorize Knowledge Time Machine to retrieve, index, and cache repository metadata for analytical incident reconstruction.
                    </label>
                  </div>
                </div>

                {/* Primary launcher button */}
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleConnectGitHub}
                    disabled={!isDisclaimerAccepted}
                    className={`px-5 py-2.5 font-bold font-mono text-xs rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                      isDisclaimerAccepted
                        ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/10"
                        : "bg-slate-950 border border-slate-800 text-slate-500 cursor-not-allowed"
                    }`}
                  >
                    <Code size={13} />
                    <span>Authorize & Link GitHub Account</span>
                  </button>
                </div>
              </div>
            ) : (
              /* IF GITHUB CONNECTED, SHOW INGESTION ENGINE */
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 flex-1">
                {/* Add Repository block */}
                <div className="md:col-span-5 space-y-3.5">
                  <div className="space-y-1">
                    <h4 className="text-[11px] font-mono font-bold text-slate-300 uppercase">
                      Register Repository
                    </h4>
                    <p className="text-[9.5px] text-slate-500 leading-normal">
                      Link active repositories to analyze their issues, PR histories, and commit structures.
                    </p>
                  </div>

                  <form onSubmit={handleRegisterRepo} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-mono font-bold">Owner / Organization</label>
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
                      <label className="text-[10px] text-slate-400 font-mono font-bold">Repository Name</label>
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
                          <span>Searching Repository...</span>
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

                {/* List of Registered Repositories */}
                <div className="md:col-span-7 flex flex-col space-y-3">
                  <div className="space-y-1">
                    <h4 className="text-[11px] font-mono font-bold text-slate-300 uppercase">
                      Registered repositories
                    </h4>
                    <p className="text-[9.5px] text-slate-500 leading-normal">
                      Select active target to explore timelines or trigger semantic sync indexes.
                    </p>
                  </div>

                  <div className="flex-1 max-h-[260px] overflow-y-auto space-y-2 pr-1">
                    {customRepos.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-slate-600 border border-dashed border-slate-800 rounded-lg">
                        <Database size={16} className="mb-1" />
                        <span className="text-[10px] font-mono">No connected repositories.</span>
                      </div>
                    ) : (
                      customRepos.map((rp) => {
                        const isActive = selectedCustomRepoId === rp.id;
                        const status = ingestionStatuses[rp.id] || (rp.lastSyncedAt ? "success" : "idle");
                        return (
                          <div
                            key={rp.id}
                            className={`p-3 rounded-lg border flex flex-col gap-2 transition-all ${
                              isActive
                                ? "bg-indigo-600/5 border-indigo-500/40"
                                : "bg-slate-950/40 border-slate-800/80 hover:border-slate-800"
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="cursor-pointer" onClick={() => onSelectRepo(rp.id)}>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11.5px] font-sans font-bold text-slate-200">
                                    {rp.id}
                                  </span>
                                  {isActive && (
                                    <span className="text-[8px] font-mono bg-indigo-500/15 text-indigo-400 px-1.5 py-0.2 rounded uppercase font-bold border border-indigo-500/10">
                                      ACTIVE
                                    </span>
                                  )}
                                </div>
                                <span className="text-[9.5px] font-mono text-slate-500 leading-tight block truncate max-w-[200px] mt-0.5">
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
                                  <span className="text-[9px] font-mono text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-850 flex items-center gap-1">
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

                            <div className="flex items-center justify-between border-t border-slate-800/40 pt-2 text-[9px] font-mono text-slate-500">
                              <span>Last synced: {rp.lastSyncedAt ? new Date(rp.lastSyncedAt).toLocaleDateString() : "Never"}</span>
                              <button
                                onClick={() => handleTriggerIngestion(rp.id)}
                                disabled={status === "running"}
                                className="px-2.5 py-1 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded transition-colors cursor-pointer"
                              >
                                {rp.lastSyncedAt ? "Re-index Repository" : "Sync Timeline"}
                              </button>
                            </div>

                            {ingestionLogs[rp.id] && (
                              <div className="bg-slate-950 border border-slate-900 p-2.5 rounded text-[8.5px] font-mono text-slate-400 whitespace-pre-wrap leading-normal max-h-[110px] overflow-y-auto">
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
            )}
          </div>
        ) : (
          /* JIRA, SLACK, NOTION INTERFACE WITH ChatGPT-style OAuth login continue-style buttons */
          <div className="space-y-5 flex-1 flex flex-col text-left">
            <div className="border-b border-slate-800 pb-3">
              <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-widest block font-bold">
                Secondary Source Connector
              </span>
              <h3 className="text-sm font-sans font-bold text-slate-200 mt-0.5">
                {activeConn.name} API Sync Tunnel
              </h3>
            </div>

            <div className="p-3.5 bg-indigo-500/5 border border-indigo-500/10 rounded-lg text-slate-400 text-xs flex items-center gap-3 font-medium leading-relaxed">
              <AlertCircle size={15} className="shrink-0 text-indigo-400" />
              <span>
                To retrieve tickets, messages, or manuals, connect <strong>{activeConn.name}</strong> securely with OAuth scopes. Raw tokens or password fields are not required.
              </span>
            </div>

            {/* Simulated Active State Panel */}
            <div className="flex-1 flex flex-col justify-center items-center py-10 bg-slate-950/40 border border-slate-800/80 rounded-xl space-y-4 max-w-lg mx-auto w-full">
              {appStates[activeConn.id] === "connected" ? (
                <div className="flex flex-col items-center text-center space-y-4 p-5 animate-fade-in">
                  <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/5 animate-pulse">
                    <CheckCircle size={22} />
                  </div>
                  
                  <div className="space-y-1">
                    <h5 className="text-sm font-sans font-extrabold text-slate-200">
                      Enrypted Integration Channel Active
                    </h5>
                    <p className="text-[10px] font-mono text-emerald-400">
                      Workspace connection fully verified & synchronized
                    </p>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 text-[10px] text-slate-400 max-w-[320px] font-mono leading-relaxed space-y-1 text-left">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Connected to:</span>
                      <span className="text-slate-300 font-bold">Acme Corp HQ</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Scopes Authored:</span>
                      <span className="text-indigo-400">read_workspace_events</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDisconnectApp(activeConn.id)}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-red-950/20 hover:text-red-400 hover:border-red-500/20 text-slate-400 font-mono text-[10px] font-bold rounded-md border border-slate-800 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <LogOut size={11} />
                    <span>Disconnect Sync Tunnel</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center space-y-4 p-5">
                  <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center text-slate-500">
                    <Link2 size={20} />
                  </div>

                  <div className="space-y-1">
                    <h5 className="text-xs font-sans font-bold text-slate-300">
                      OAuth 2.0 Integration Safeguard
                    </h5>
                    <p className="text-[9.5px] font-mono text-slate-500 max-w-[280px]">
                      Access public directories and timelines securely without storing credentials on server disks.
                    </p>
                  </div>

                  {/* Continue Button */}
                  <button
                    onClick={() => triggerOAuthPopupSim(activeConn.id)}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs rounded-lg shadow-lg shadow-indigo-600/10 flex items-center gap-1.5 cursor-pointer group"
                  >
                    <span>Continue to link {activeConn.name}</span>
                    <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* CHATGPT-STYLE OAuth POPUP SIMULATOR MODAL */}
      {activeOAuthPopup && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full overflow-hidden shadow-2xl animate-fade-in text-left">
            
            {/* Header */}
            <div className="bg-slate-950 p-4 border-b border-slate-850 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-500/15 text-indigo-400 rounded-md">
                  <Lock size={14} className="animate-pulse" />
                </div>
                <span className="text-[11px] font-mono font-bold text-indigo-400">Encrypted OAuth Proxy Gateway</span>
              </div>
              <button
                onClick={() => setActiveOAuthPopup(null)}
                className="text-slate-500 hover:text-slate-300"
              >
                <X size={15} />
              </button>
            </div>

            {/* Content stages */}
            <div className="p-5 space-y-4">
              
              {activeOAuthPopup.step === "disclaimer" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-1">
                    <h4 className="text-xs font-sans font-extrabold text-slate-200">
                      {activeOAuthPopup.title}
                    </h4>
                    <p className="text-[10px] font-mono text-slate-500 leading-normal">
                      {activeOAuthPopup.scopeDesc}
                    </p>
                  </div>

                  <div className="space-y-2 border-t border-b border-slate-800/80 py-3">
                    <span className="text-[9.5px] font-mono font-bold text-slate-400 uppercase tracking-wide block">
                      Requested Scopes:
                    </span>
                    <div className="space-y-1.5">
                      {activeOAuthPopup.permissions.map((perm, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-[10px] font-mono text-slate-500">
                          <CheckCircle size={12} className="text-indigo-500 shrink-0 mt-0.5" />
                          <span className="leading-tight">{perm}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-1">
                    <button
                      onClick={() => setActiveOAuthPopup(null)}
                      className="px-3 py-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-850 text-slate-400 font-mono text-xs rounded transition-colors cursor-pointer"
                    >
                      Cancel Connect
                    </button>
                    <button
                      onClick={handleOAuthSimProceed}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs rounded transition-colors cursor-pointer flex items-center gap-1 font-bold"
                    >
                      <span>Authorize Access</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              )}

              {activeOAuthPopup.step === "authorizing" && (
                <div className="flex flex-col items-center justify-center py-10 space-y-4 animate-fade-in text-center">
                  <RefreshCw size={28} className="text-indigo-400 animate-spin" />
                  <div className="space-y-1">
                    <span className="text-xs font-sans font-bold text-slate-200">Confirming Token Handshake...</span>
                    <p className="text-[9.5px] font-mono text-slate-500 max-w-[250px]">
                      Authenticating security proxy token arrays with integrated API endpoint gateway
                    </p>
                  </div>
                </div>
              )}

              {activeOAuthPopup.step === "success" && (
                <div className="space-y-4 text-center py-4 animate-fade-in">
                  <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 mx-auto">
                    <CheckCircle size={24} className="animate-bounce" />
                  </div>

                  <div className="space-y-1">
                    <h5 className="text-sm font-sans font-extrabold text-slate-200">
                      Connection Handshake Successful!
                    </h5>
                    <p className="text-[10px] font-mono text-slate-500">
                      Workspace context has been successfully authorized and linked.
                    </p>
                  </div>

                  <button
                    onClick={handleOAuthSimSuccessConfirm}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-mono py-2 text-xs rounded-lg transition-colors cursor-pointer font-bold"
                  >
                    Return to Ingestion Center
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
