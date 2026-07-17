import React, { useState, useEffect, useMemo } from "react";
import {
  Clock,
  Database,
  GitBranch,
  Sparkles,
  Terminal,
  Network,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Search,
  Send,
  HelpCircle,
  Cpu,
  Layers,
  Settings2,
  BookOpen,
  ChevronRight,
  ChevronDown,
  User,
  FolderGit,
  FileLock2,
  Activity,
  LogOut,
  LayoutDashboard,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
  PlusCircle,
  Tag
} from "lucide-react";

// Types
import { Scenario, WorkflowEvent, KnowledgeGraphNode, KnowledgeGraphEdge, ModularConnector, PipelineStage } from "./types";

// Static preset datasets
import {
  PRESET_SCENARIOS,
  WORKFLOW_EVENTS,
  KNOWLEDGE_GRAPH_NODES,
  KNOWLEDGE_GRAPH_EDGES,
  MODULAR_CONNECTORS
} from "./data/presetData";

// Sub-components
import PipelineWorkflow from "./components/PipelineWorkflow";
import KnowledgeGraphView from "./components/KnowledgeGraphView";
import InteractiveTimeline from "./components/InteractiveTimeline";
import ConnectorIntegrations from "./components/ConnectorIntegrations";
import AiReportPanel from "./components/AiReportPanel";

// Modular SaaS pages
import LandingPage from "./components/LandingPage";
import DashboardPage from "./components/DashboardPage";
import EvidencePage from "./components/EvidencePage";
import SettingsPage from "./components/SettingsPage";

// High-fidelity markdown inline styles parser
function renderInlineStyles(text: string) {
  const parts: React.ReactNode[] = [];
  let currentIndex = 0;
  
  while (currentIndex < text.length) {
    const boldStart = text.indexOf("**", currentIndex);
    const codeStart = text.indexOf("`", currentIndex);
    
    if (boldStart !== -1 && (codeStart === -1 || boldStart < codeStart)) {
      if (boldStart > currentIndex) {
        parts.push(text.substring(currentIndex, boldStart));
      }
      
      const boldEnd = text.indexOf("**", boldStart + 2);
      if (boldEnd !== -1) {
        parts.push(
          <strong key={`bold-${boldStart}`} className="font-bold text-slate-100 font-sans">
            {text.substring(boldStart + 2, boldEnd)}
          </strong>
        );
        currentIndex = boldEnd + 2;
      } else {
        parts.push("**");
        currentIndex = boldStart + 2;
      }
    } else if (codeStart !== -1 && (boldStart === -1 || codeStart < boldStart)) {
      if (codeStart > currentIndex) {
        parts.push(text.substring(currentIndex, codeStart));
      }
      
      const codeEnd = text.indexOf("`", codeStart + 1);
      if (codeEnd !== -1) {
        parts.push(
          <code key={`code-${codeStart}`} className="bg-slate-900 border border-slate-800 text-indigo-300 px-1.5 py-0.5 rounded text-[10px] font-mono">
            {text.substring(codeStart + 1, codeEnd)}
          </code>
        );
        currentIndex = codeEnd + 1;
      } else {
        parts.push("`");
        currentIndex = codeStart + 1;
      }
    } else {
      parts.push(text.substring(currentIndex));
      break;
    }
  }
  
  return parts.length > 0 ? parts : text;
}

// Markdown blocks parser component
function MarkdownRenderer({ text }: { text: string }) {
  const lines = text.split("\n");
  
  return (
    <div className="space-y-3.5 font-mono text-[11px] text-slate-300 leading-relaxed">
      {lines.map((line, lidx) => {
        const trimmed = line.trim();
        
        // Headers (### or ##)
        if (trimmed.startsWith("### ")) {
          return (
            <h4 key={lidx} className="text-xs font-bold text-indigo-400 font-sans tracking-wide mt-5 mb-2 uppercase border-b border-slate-900 pb-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
              {renderInlineStyles(trimmed.substring(4))}
            </h4>
          );
        }
        if (trimmed.startsWith("## ") || trimmed.startsWith("# ")) {
          const content = trimmed.startsWith("## ") ? trimmed.substring(3) : trimmed.substring(2);
          return (
            <h3 key={lidx} className="text-sm font-bold text-slate-100 font-sans tracking-tight mt-6 mb-3 border-b border-slate-800 pb-1.5">
              {renderInlineStyles(content)}
            </h3>
          );
        }
        
        // Horizontal lines
        if (trimmed === "---") {
          return <hr key={lidx} className="border-slate-800/80 my-4" />;
        }
        
        // Quotes / Blockquotes
        if (trimmed.startsWith("> ")) {
          return (
            <blockquote key={lidx} className="border-l-2 border-indigo-500/40 bg-indigo-500/5 px-3 py-2.5 my-2.5 rounded-r-md text-slate-400 italic font-sans text-xs">
              {renderInlineStyles(trimmed.substring(2))}
            </blockquote>
          );
        }
        
        // Unordered List Items
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          return (
            <div key={lidx} className="flex items-start gap-2.5 pl-3">
              <span className="text-indigo-400 select-none mt-1 text-[9px]">••</span>
              <span className="flex-1">{renderInlineStyles(trimmed.substring(2))}</span>
            </div>
          );
        }

        // Ordered List Items
        const numMatch = trimmed.match(/^(\d+)\.\s(.*)/);
        if (numMatch) {
          return (
            <div key={lidx} className="flex items-start gap-2.5 pl-3">
              <span className="text-indigo-400 font-bold select-none text-[10px] mt-0.5">{numMatch[1]}.</span>
              <span className="flex-1">{renderInlineStyles(numMatch[2])}</span>
            </div>
          );
        }

        // Empty spacer
        if (trimmed === "") {
          return <div key={lidx} className="h-1" />;
        }
        
        // Default text line
        return (
          <p key={lidx} className="leading-relaxed">
            {renderInlineStyles(line)}
          </p>
        );
      })}
    </div>
  );
}

export default function App() {
  const [serverHealth, setServerHealth] = useState<"checking" | "online" | "offline">("checking");
  const [apiKeyActive, setApiKeyActive] = useState<boolean>(false);
  const [showKeyWarning, setShowKeyWarning] = useState<boolean>(false);

  // Active view page state
  const [currentPage, setCurrentPage] = useState<"landing" | "dashboard" | "repository" | "timeline" | "evidence" | "ask_ai" | "settings">("landing");

  // Live GitHub integration state
  const [isGitHubConnected, setIsGitHubConnected] = useState<boolean>(false);
  const [githubUser, setGithubUser] = useState<any>(null);
  const [customRepos, setCustomRepos] = useState<any[]>([]);
  const [selectedCustomRepoId, setSelectedCustomRepoId] = useState<string | null>(null);
  const [customEvents, setCustomEvents] = useState<any[]>([]);

  // Selection states
  const [scenarios] = useState<Scenario[]>(PRESET_SCENARIOS);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("redis-incident");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Toggle between preset scenarios vs live ingested repos
  const [workspaceMode, setWorkspaceMode] = useState<"preset" | "live">("preset");

  // Custom User query states
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isReconstructing, setIsReconstructing] = useState<boolean>(false);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [matchingEntities, setMatchingEntities] = useState<string[]>([]);
  const [retrievedDocs, setRetrievedDocs] = useState<any[]>([]);

  // Mobile sidebar visibility
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Pipeline stages progress state
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([
    { id: "ingestion", name: "Indexing repository...", description: "Fetch issues, PRs, and commits", status: "idle" },
    { id: "extraction", name: "Understanding code evolution...", description: "Parse event metadata structures", status: "idle" },
    { id: "graph", name: "Reconstructing repository history...", description: "Solder nodes & relationships", status: "idle" },
    { id: "vector", name: "Finding related commits...", description: "Embed semantic vector context", status: "idle" },
    { id: "timeline", name: "Building engineering timeline...", description: "Reconstruct chronological flow", status: "idle" },
    { id: "llm", name: "Generating AI insights...", description: "Synthesize forensic findings", status: "idle" }
  ]);
  const [activeStageId, setActiveStageId] = useState<string | null>(null);

  // Modular connectors state
  const [connectors, setConnectors] = useState<ModularConnector[]>(MODULAR_CONNECTORS);

  // Check health & GitHub connection on load
  const checkHealthAndAuth = async () => {
    try {
      const res = await fetch("/api/health");
      if (res.ok) {
        const data = await res.json();
        setServerHealth("online");
        setApiKeyActive(data.hasApiKey);
        if (!data.hasApiKey) {
          setShowKeyWarning(true);
        }
      } else {
        setServerHealth("offline");
      }
    } catch (err) {
      console.error("Backend health check failed:", err);
      setServerHealth("offline");
    }

    try {
      const res = await fetch("/api/auth/github/user");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setGithubUser(data.user);
          setIsGitHubConnected(true);
        }
      }
    } catch (err) {
      console.error("Failed to fetch github user info:", err);
    }
  };

  const fetchCustomRepos = async () => {
    try {
      const res = await fetch("/api/repositories");
      if (res.ok) {
        const data = await res.json();
        setCustomRepos(data);
      }
    } catch (err) {
      console.error("Failed to load custom repos:", err);
    }
  };

  useEffect(() => {
    checkHealthAndAuth();
    fetchCustomRepos();
  }, []);

  // Handle postMessage from OAuth popups
  useEffect(() => {
    const handleOAuthSuccess = (event: MessageEvent) => {
      if (event.data?.type === "OAUTH_AUTH_SUCCESS") {
        setGithubUser(event.data.user);
        setIsGitHubConnected(true);
        fetchCustomRepos();
      }
    };
    window.addEventListener("message", handleOAuthSuccess);
    return () => window.removeEventListener("message", handleOAuthSuccess);
  }, []);

  const currentScenario = scenarios.find((s) => s.id === selectedScenarioId) || scenarios[0];

  // Dynamic Graph construction from real custom repository events
  const customNodes = useMemo(() => {
    if (!selectedCustomRepoId) return [];
    const nodes: KnowledgeGraphNode[] = [
      { id: "repo-root", label: selectedCustomRepoId, type: "service", group: "repository" }
    ];
    const addedIds = new Set<string>(["repo-root"]);

    customEvents.forEach((evt) => {
      if (evt.author && !addedIds.has(`author-${evt.author}`)) {
        nodes.push({
          id: `author-${evt.author}`,
          label: `@${evt.author}`,
          type: "author",
          group: "authors"
        });
        addedIds.add(`author-${evt.author}`);
      }

      if (evt.type === "commit") {
        const commitSha = evt.hash || evt.id;
        const shortSha = commitSha.substring(0, 7);
        if (!addedIds.has(`commit-${commitSha}`)) {
          nodes.push({
            id: `commit-${commitSha}`,
            label: `Commit ${shortSha}`,
            type: "commit",
            group: "commits"
          });
          addedIds.add(`commit-${commitSha}`);
        }
      }

      if (evt.type === "issue") {
        const issueNum = evt.id;
        if (!addedIds.has(issueNum)) {
          nodes.push({
            id: issueNum,
            label: evt.title.split(":")[0],
            type: "issue",
            group: "issues"
          });
          addedIds.add(issueNum);
        }
      }

      if (evt.type === "pr") {
        const prNum = evt.id;
        if (!addedIds.has(prNum)) {
          nodes.push({
            id: prNum,
            label: evt.title.split(":")[0],
            type: "pr",
            group: "prs"
          });
          addedIds.add(prNum);
        }
      }
    });

    return nodes;
  }, [selectedCustomRepoId, customEvents]);

  const customEdges = useMemo(() => {
    if (!selectedCustomRepoId) return [];
    const edges: KnowledgeGraphEdge[] = [];
    const addedAuthors = new Set<string>();

    customEvents.forEach((evt) => {
      if (evt.author) {
        if (!addedAuthors.has(evt.author)) {
          edges.push({
            id: `edge-author-${evt.author}-repo`,
            source: `author-${evt.author}`,
            target: "repo-root",
            relation: "contributes"
          });
          addedAuthors.add(evt.author);
        }

        if (evt.type === "commit") {
          const commitSha = evt.hash || evt.id;
          edges.push({
            id: `edge-commit-${commitSha}-author`,
            source: `author-${evt.author}`,
            target: `commit-${commitSha}`,
            relation: "authored"
          });
        }

        if (evt.type === "issue") {
          edges.push({
            id: `edge-issue-${evt.id}-author`,
            source: `author-${evt.author}`,
            target: evt.id,
            relation: "reported"
          });
        }

        if (evt.type === "pr") {
          edges.push({
            id: `edge-pr-${evt.id}-author`,
            source: `author-${evt.author}`,
            target: evt.id,
            relation: "opened"
          });
        }
      }
    });

    return edges;
  }, [selectedCustomRepoId, customEvents]);

  // Determine active scenario data based on selection mode
  const isLiveMode = workspaceMode === "live" && !!selectedCustomRepoId;
  const scenarioEvents = isLiveMode ? customEvents : (WORKFLOW_EVENTS[selectedScenarioId] || []);
  const scenarioNodes = isLiveMode ? customNodes : (KNOWLEDGE_GRAPH_NODES[selectedScenarioId] || []);
  const scenarioEdges = isLiveMode ? customEdges : (KNOWLEDGE_GRAPH_EDGES[selectedScenarioId] || []);

  // Fetch custom timeline events when repository selection changes
  const fetchCustomTimeline = async (repoId: string) => {
    try {
      const [owner, repo] = repoId.split("/");
      const res = await fetch(`/api/repositories/${owner}/${repo}/timeline`);
      if (res.ok) {
        const data = await res.json();
        setCustomEvents(data);
        if (data.length > 0) {
          setSelectedEventId(data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load custom repo timeline:", err);
    }
  };

  useEffect(() => {
    if (selectedCustomRepoId) {
      fetchCustomTimeline(selectedCustomRepoId);
    }
    setAiAnswer(null);
    setSearchQuery("");
    setMatchingEntities([]);
    setRetrievedDocs([]);
    resetPipeline();
  }, [selectedCustomRepoId]);

  // Default select first event when scenario changes (in preset mode)
  useEffect(() => {
    if (!isLiveMode && scenarioEvents.length > 0) {
      setSelectedEventId(scenarioEvents[0].id);
    }
    if (!isLiveMode && scenarioNodes.length > 0) {
      setSelectedNodeId(scenarioNodes[0].id);
    }
    setAiAnswer(null);
    setSearchQuery("");
    setMatchingEntities([]);
    setRetrievedDocs([]);
    resetPipeline();
  }, [selectedScenarioId, workspaceMode]);

  const resetPipeline = () => {
    setPipelineStages((prev) =>
      prev.map((s) => ({ ...s, status: "idle", metrics: undefined }))
    );
    setActiveStageId(null);
    setIsReconstructing(false);
  };

  const handleDisconnectGitHub = async () => {
    try {
      await fetch("/api/auth/github/logout", { method: "POST" });
      setGithubUser(null);
      setIsGitHubConnected(false);
      fetchCustomRepos();
      setSelectedCustomRepoId(null);
      setWorkspaceMode("preset");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const handleAddRepo = async (owner: string, repo: string) => {
    const res = await fetch("/api/repositories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ owner, repo })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to add repository.");
    }
    const data = await res.json();
    await fetchCustomRepos();
    setSelectedCustomRepoId(data.repository.id);
    setWorkspaceMode("live");
    return data.repository;
  };

  const handleSaveApiKeyOnBackend = async (key: string) => {
    try {
      const res = await fetch("/api/settings/secret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key })
      });
      if (res.ok) {
        setApiKeyActive(true);
        setShowKeyWarning(false);
      }
    } catch (err) {
      console.error("Failed to save secret key on backend:", err);
    }
  };

  // Perform forensic reconstruction
  const runReconstruction = async (queryText: string) => {
    if (!queryText.trim() || isReconstructing) return;

    setIsReconstructing(true);
    setSearchQuery(queryText);
    setAiAnswer(null);

    // Animate stages step-by-step
    const stagesList: PipelineStage["id"][] = ["ingestion", "extraction", "graph", "vector", "timeline", "llm"];
    
    for (let i = 0; i < stagesList.length; i++) {
      const stageId = stagesList[i];
      setActiveStageId(stageId);
      
      setPipelineStages((prev) =>
        prev.map((s) => {
          if (s.id === stageId) {
            return { ...s, status: "running" };
          }
          return s;
        })
      );

      // Sleep to simulate rapid pipeline parsing
      await new Promise((resolve) => setTimeout(resolve, 300));

      setPipelineStages((prev) =>
        prev.map((s) => {
          if (s.id === stageId) {
            let metrics = "OK";
            if (stageId === "ingestion") metrics = `${scenarioEvents.length} events loaded`;
            if (stageId === "extraction") metrics = `${scenarioEvents.reduce((acc, curr) => acc + (curr.entities?.length || 0), 0)} nodes extracted`;
            if (stageId === "graph") metrics = `${scenarioNodes.length} nodes connected`;
            if (stageId === "vector") metrics = isLiveMode ? "Semantic context retrieved" : "12 text chunks indexed";
            if (stageId === "timeline") metrics = "Chronology locked";
            if (stageId === "llm") metrics = "Report generated";

            return { ...s, status: "success", metrics };
          }
          return s;
        })
      );
    }

    setActiveStageId(null);

    // Highlight matching entities based on simple keyword intersections to make graph glow!
    const queryLower = queryText.toLowerCase();
    const matched = scenarioEvents
      .flatMap((e) => e.entities || [])
      .filter((ent) => queryLower.includes(ent.toLowerCase()) || ent.toLowerCase().includes(queryLower));
    setMatchingEntities(Array.from(new Set(matched)));

    // Try requesting actual Gemini AI models
    if (isLiveMode) {
      try {
        const [owner, repo] = (selectedCustomRepoId || "").split("/");
        const response = await fetch(`/api/repositories/${owner}/${repo}/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ queryText })
        });

        if (response.ok) {
          const data = await response.json();
          setAiAnswer(data.text);
          setMatchingEntities(data.matchingEntities || []);
          setRetrievedDocs(data.retrievedDocuments || []);
        } else {
          throw new Error("Custom query endpoint failed.");
        }
      } catch (err) {
        console.warn("Forensics API fail:", err);
        setAiAnswer("### 🔍 Live Forensic Pipeline Warning\n\nNo active semantic index matches found for this repository, or the Google Gemini API key is unconfigured. Run the **Ingestion Pipeline** under the **Modular Connectors** tab to index the repository history!");
      } finally {
        setIsReconstructing(false);
      }
      return;
    }

    try {
      const response = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `USER QUERY: ${queryText}\nSCENARIO NAME: ${currentScenario.name}`,
          systemInstruction: `You are the CodeStory AI assistant. Explain the timelines and underlying reasons why changes or regressions occurred based on WORKFLOW_EVENTS. Current: ${JSON.stringify(scenarioEvents, null, 2)}`,
          model: "gemini-3.5-flash",
          temperature: 0.1
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAiAnswer(data.text);
      } else {
        throw new Error("Gemini endpoint bypassed or returned non-ok status");
      }
    } catch (err) {
      console.warn("Falling back to local model:", err);
      generateLocalFallbackAnswer(queryText);
    } finally {
      setIsReconstructing(false);
    }
  };

  const generateLocalFallbackAnswer = (query: string) => {
    const qLower = query.toLowerCase();
    if (selectedScenarioId === "redis-incident") {
      if (qLower.includes("redis") || qLower.includes("remove") || qLower.includes("why")) {
        setAiAnswer(`### 🔍 Redis Removal Report

**1. Root Cause Analysis**
Redis was removed in commit **7b8e1a2** by **bob_ops** under **PR #405** to reduce staging infrastructure budget fees (saving $120/month per staging environment sandbox) following the resource constraints raised in **Issue #101**.

**2. The Regression Mechanism**
Bob replaced the robust Redis remote cache server with an unbound global JavaScript Object dictionary cache (\`localCache = {}\`) inside \`src/services/cache.js\`. Because this dictionary lacked a Time-To-Live (TTL) or eviction strategy, active sessions grew indefinitely.

**3. CI Pipeline Alert & Resolution**
- **Trigger**: The longevity traffic simulator (**Build #902**) crashed with a JavaScript heap out of memory after 2 hours of processing 15,000 auth tokens.
- **Resolution**: **charlie_arch** committed a hotfix (**fa9c12a**) wrapping the dictionary with a bounded \`LRUCache\` configured to a maximum of 1,000 items with a 15-minute expiration period.

**Suggested Mitigation**: Never use unevictable global objects for active request sessions. Ensure all staging fallbacks utilize containerized Redis replicas or strictly bounded caches.`);
      } else {
        setAiAnswer(`### 🔍 General Summary: Redis Incident
The timeline reveals that staging downscaling optimization led to removing the containerized Redis cluster. The resulting fallback memory cache memory leak was flagged by **alice_dev** on code review but dismissed, resulting in an OOM container failure under test load. Resolved via a bounded LRU policy by **charlie_arch** in **fa9c12a**.`);
      }
    } else if (selectedScenarioId === "auth-bypass") {
      if (qLower.includes("bug") || qLower.includes("who") || qLower.includes("bypass")) {
        setAiAnswer(`### 🔒 Cryptographic Auth Bypass Report

**1. Who Introduced the Vulnerability?**
The bypass backdoor was committed by **bob_ops** in **Commit db01a2f**. 
- **The Code**: Bob added a raw check allowing any client token matching \`test-override\` or starting with \`md5-\` to gain complete root admin privileges without secret-key decryption.

**2. Why was Security Ignored?**
The bypass was created to resolve **Issue #202** (Vite development sandboxes experiencing 300ms JWT decryption latency). 
- **The Override**: The CodeQL static security analyzer correctly flagged the backdoor as a Critical Security Vulnerability in **Build #945**. However, **dave_manager** manually bypassed the warning and merged **PR #411** to ensure a vital board meeting demo remained green.

**3. Remediation**
On July 4th, **alice_dev** discovered the active backdoor in production packages and reverted the backdoor check in **Commit 9c2041e**, restoring secure HMAC signature validation.`);
      } else {
        setAiAnswer(`### 🔍 General Summary: Auth Bypass
A development backdoor committed by **bob_ops** was administrative-merged into main by **dave_manager** to unlock the staging pipelines for a demo. This bypassed a critical CodeQL scan. Corrected by **alice_dev** in **9c2041e**.`);
      }
    } else {
      setAiAnswer(`### 📂 S3 Storage Sync Cleanup Report

**1. Why was the function deleted?**
The helper function \`pruneStaleS3Backups()\` was deleted in commit **1f4e5a9** by **bob_ops** during a general house-cleaning task requested by **dave_manager** (**Issue #315**). Because the file had no explicit static imports inside the main Node bundle, Bob assumed it was obsolete code.

**2. The Unintended Side-Effects**
The cleanup routine was actually invoked externally by an AWS Lambda cron job container using dynamic Node execution:
\`node -e "require('./src/services/storage_sync_cleanup_service').pruneStaleS3Backups()"\`

**3. Operational Consequences**
- After the deletion merged under **PR #320**, the Lambda cron job crashed daily with \`Cannot find module\` errors (**Build #1004**).
- For 10 days, temporary diagnostic zip archives accumulated on AWS S3, ballooning the storage to 14.5TB and triggering a budget alarm spike of 450%.

**Aesthetic Resolution**: Restore the isolated service code immediately and introduce automated integration tests checking external trigger dependency imports.`);
    }
  };

  // Render Full Screen Landing page first
  if (currentPage === "landing") {
    return (
      <LandingPage
        onLaunch={() => setCurrentPage("dashboard")}
        serverHealth={serverHealth}
        apiKeyActive={apiKeyActive}
      />
    );
  }

  // Sidebar Menu Definitions
  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: <span className="text-sm">🏠</span> },
    { id: "repository", label: "Connect Repos", icon: <span className="text-sm">🔗</span> },
    { id: "timeline", label: "Timeline", icon: <span className="text-sm">🕒</span> },
    { id: "evidence", label: "Why It Changed", icon: <span className="text-sm">📄</span> },
    { id: "ask_ai", label: "Ask AI", icon: <span className="text-sm">🤖</span> },
    { id: "settings", label: "Settings", icon: <span className="text-sm">⚙️</span> }
  ] as const;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans selection:bg-indigo-500/30 selection:text-white" id="main-saas-container">
      
      {/* 1. LEFT SIDEBAR PANEL */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-slate-900 bg-slate-950/90 p-5 flex flex-col justify-between shrink-0 transition-transform md:translate-x-0 md:static ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="space-y-6">
          {/* Brand header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-500/15 border border-indigo-500/25 rounded-lg text-indigo-400">
                <Clock className="w-4.5 h-4.5 animate-pulse" />
              </div>
              <div className="text-left">
                <h1 className="text-sm font-black tracking-tight text-white font-display uppercase">
                  CodeStory
                </h1>
                <span className="text-[8px] font-mono text-indigo-400 uppercase tracking-wider block">Every Commit Has a Story.</span>
              </div>
            </div>
            
            {/* Mobile close button */}
            <button className="md:hidden p-1 text-slate-500 hover:text-slate-300" onClick={() => setIsSidebarOpen(false)}>
              <X size={15} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 pt-4">
            {navigationItems.map((item) => {
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentPage(item.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    isActive
                      ? "bg-indigo-600/10 border border-indigo-500/30 text-indigo-400 font-extrabold shadow-[0_0_10px_rgba(99,102,241,0.05)]"
                      : "border border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/50"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 ml-auto animate-pulse" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer details */}
        <div className="space-y-4 border-t border-slate-900 pt-5">
          {/* Active GitHub session */}
          {isGitHubConnected ? (
            <div className="flex items-center justify-between p-2 bg-slate-900/40 rounded-lg border border-slate-900">
              <div className="flex items-center gap-2 min-w-0">
                {githubUser?.avatar_url ? (
                  <img src={githubUser.avatar_url} alt="Profile" className="w-6 h-6 rounded-full border border-slate-800" />
                ) : (
                  <User size={13} className="text-slate-500" />
                )}
                <div className="text-left min-w-0">
                  <span className="text-[10px] font-bold text-slate-300 block truncate">@{githubUser?.login}</span>
                  <span className="text-[8px] font-mono text-emerald-400 font-semibold block">INTEGRATED</span>
                </div>
              </div>
              <button onClick={handleDisconnectGitHub} className="p-1 text-slate-500 hover:text-red-400 transition-colors" title="Logout session">
                <LogOut size={11} />
              </button>
            </div>
          ) : (
            <div className="p-2.5 bg-slate-900/20 rounded-lg border border-slate-900/80 text-left space-y-1">
              <span className="text-[9px] font-mono text-slate-500 block uppercase">Integration Node</span>
              <span className="text-[10px] font-mono font-bold text-slate-400">Sandbox Unlinked</span>
            </div>
          )}

          {/* Core Server Status */}
          <div className="text-[9px] font-mono text-left space-y-1">
            <div className="flex justify-between items-center text-slate-600">
              <span>SERVER STATUS:</span>
              {serverHealth === "online" ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" /> ONLINE
                </span>
              ) : (
                <span className="text-red-400 font-bold">OFFLINE</span>
              )}
            </div>

            <div className="flex justify-between items-center text-slate-600">
              <span>AI ASSISTANT:</span>
              {apiKeyActive ? (
                <span className="text-emerald-400 font-bold">ACTIVE</span>
              ) : (
                <span className="text-amber-400 font-bold">MUTED</span>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE FRAME */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Professional Navigation Header */}
        <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between shrink-0 relative z-30">
          
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger */}
            <button className="md:hidden p-1 text-slate-500 hover:text-slate-300" onClick={() => setIsSidebarOpen(true)}>
              <Menu size={16} />
            </button>

            {/* Breadcrumb path */}
            <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500">
              <span className="hover:text-slate-300 transition-colors cursor-pointer">TIME_MACHINE</span>
              <ChevronRight size={10} />
              <span className="text-indigo-400 font-extrabold uppercase">
                {navigationItems.find(n => n.id === currentPage)?.label || currentPage}
              </span>
            </div>
          </div>

          {/* Global Scenario Selector Dropdown */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-900/80 border border-slate-800 rounded-lg p-1 px-2">
              <label className="text-[9px] font-mono text-slate-500 font-bold uppercase mr-1 hidden sm:inline-block">
                Active Scenario:
              </label>
              
              <select
                value={selectedScenarioId}
                onChange={(e) => {
                  setSelectedScenarioId(e.target.value);
                  setWorkspaceMode("preset");
                }}
                className="bg-transparent text-[10px] font-mono text-indigo-400 font-bold focus:outline-none cursor-pointer border-none py-0.5"
              >
                {scenarios.map((sc) => (
                  <option key={sc.id} value={sc.id} className="bg-slate-950 text-slate-300 text-xs font-sans">
                    Scenario: {sc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Return back to landing helper button */}
            <button
              onClick={() => setCurrentPage("landing")}
              className="px-3 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-lg text-[9px] font-mono font-bold transition-all cursor-pointer"
            >
              Exit App
            </button>
          </div>
        </header>

        {/* Missing API Key Warning Banner */}
        {showKeyWarning && currentPage !== "settings" && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px] text-amber-400 leading-relaxed font-medium relative z-20">
            <div className="flex items-start gap-2.5 text-left">
              <ShieldAlert size={15} className="shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Missing Gemini API Key</span>
                <p className="text-slate-400 mt-0.5">
                  Set your <code className="text-amber-400 font-mono bg-amber-500/5 px-1 rounded">GEMINI_API_KEY</code> inside the <b>Settings</b> panel to run live AI analysis.
                </p>
              </div>
            </div>
            <button
              onClick={() => setCurrentPage("settings")}
              className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/40 border border-amber-500/30 text-amber-400 hover:text-white rounded text-[10px] font-mono transition-colors self-end sm:self-center cursor-pointer"
            >
              Open Settings
            </button>
          </div>
        )}

        {/* 3. PRIMARY SAAS WORKSPACE CONTENT VIEWER */}
        <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          <div className="max-w-6xl mx-auto w-full">
            
            {/* DASHBOARD PAGE */}
            {currentPage === "dashboard" && (
              <DashboardPage
                scenarios={scenarios}
                selectedScenarioId={selectedScenarioId}
                onSelectScenario={setSelectedScenarioId}
                onNavigateToTimeline={() => setCurrentPage("timeline")}
                onNavigateToAskAi={() => setCurrentPage("ask_ai")}
                isGitHubConnected={isGitHubConnected}
                githubUser={githubUser}
                customReposCount={customRepos.length}
              />
            )}

            {/* REPOSITORY CONNECTOR PAGE */}
            {currentPage === "repository" && (
              <div className="space-y-6">
                <div className="text-left border-b border-slate-900 pb-4">
                  <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider block">
                    CONNECTIONS
                  </span>
                  <h2 className="text-lg font-display font-bold text-slate-100 mt-0.5">
                    Connect Repos
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Connect and manage GitHub repositories.
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
                  <ConnectorIntegrations
                    connectors={connectors}
                    onToggleConnector={() => {}}
                    isGitHubConnected={isGitHubConnected}
                    githubUser={githubUser}
                    customRepos={customRepos}
                    onAddRepo={handleAddRepo}
                    onIngestRepo={fetchCustomTimeline}
                    onDisconnectGitHub={handleDisconnectGitHub}
                    onSelectRepo={(id) => {
                      setSelectedCustomRepoId(id);
                      setWorkspaceMode("live");
                      setCurrentPage("timeline");
                    }}
                    selectedCustomRepoId={selectedCustomRepoId}
                  />
                </div>
              </div>
            )}

            {/* TIMELINE PAGE */}
            {currentPage === "timeline" && (
              <div className="space-y-6">
                <div className="text-left border-b border-slate-900 pb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider block">
                      CHRONOLOGY
                    </span>
                    <h2 className="text-lg font-display font-bold text-slate-100 mt-0.5">
                      Timeline
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      View the history of commits, pull requests, issues, and code changes.
                    </p>
                  </div>
                  
                  {/* Mode Indicators */}
                  <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 text-[9px] font-mono font-bold">
                    <button
                      onClick={() => setWorkspaceMode("preset")}
                      className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                        workspaceMode === "preset"
                          ? "bg-indigo-600 text-white font-extrabold"
                          : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      PRESET SCENARIOS
                    </button>
                    <button
                      onClick={() => {
                        setWorkspaceMode("live");
                        if (customRepos.length > 0 && !selectedCustomRepoId) {
                          setSelectedCustomRepoId(customRepos[0].id);
                        }
                      }}
                      className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                        workspaceMode === "live"
                          ? "bg-indigo-600 text-white font-extrabold"
                          : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      CONNECTED REPOS
                    </button>
                  </div>
                </div>

                <InteractiveTimeline
                  events={scenarioEvents}
                  selectedEventId={selectedEventId}
                  onSelectEvent={(id) => {
                    setSelectedEventId(id);
                    const evt = scenarioEvents.find((e) => e.id === id);
                    if (evt) {
                      const nodeMatch = scenarioNodes.find(
                        (n) => n.id.toLowerCase().includes(evt.author.toLowerCase()) || n.id.toLowerCase().includes(evt.refId?.toLowerCase().replace("commit ", "co-").replace("issue #", "is-").replace("pr #", "pr-") || "")
                      );
                      if (nodeMatch) setSelectedNodeId(nodeMatch.id);
                    }
                  }}
                />
              </div>
            )}

            {/* EVIDENCE PAGE (incorporating KnowledgeGraph and Secure Proof Locker ledger) */}
            {currentPage === "evidence" && (
              <EvidencePage
                nodes={scenarioNodes}
                edges={scenarioEdges}
                selectedNodeId={selectedNodeId}
                onSelectNode={(id) => {
                  setSelectedNodeId(id);
                  const matchedEvt = scenarioEvents.find(
                    (e) => e.author.toLowerCase() === id.toLowerCase() || (e.refId || "").toLowerCase().replace("commit ", "co-").replace("issue #", "is-").replace("pr #", "pr-").includes(id.toLowerCase())
                  );
                  if (matchedEvt) setSelectedEventId(matchedEvt.id);
                }}
                currentScenario={currentScenario}
                scenarioEvents={scenarioEvents}
                selectedEventId={selectedEventId}
                onSelectEvent={setSelectedEventId}
              />
            )}

            {/* ASK AI PAGE */}
            {currentPage === "ask_ai" && (
              <div className="space-y-6 text-left">
                <div className="border-b border-slate-900 pb-4">
                  <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider block">
                    AI ASSISTANT
                  </span>
                  <h2 className="text-lg font-display font-bold text-slate-100 mt-0.5">
                    Ask AI
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Ask questions about the repository in natural language and get AI-powered explanations.
                  </p>
                </div>

                {/* Query Input Section */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
                      Ask Questions
                    </span>
                    <p className="text-[10px] text-slate-400">
                      Ask why lines of code were modified, who worked on them, or how things are connected.
                    </p>
                  </div>

                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && runReconstruction(searchQuery)}
                      placeholder={isLiveMode ? "Ask: \"Why was this code changed?\" or \"Who reported this bug?\"" : `Ask: "${currentScenario.targetQuestion}"`}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-3 pr-24 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-700"
                    />
                    <button
                      onClick={() => runReconstruction(searchQuery)}
                      disabled={!searchQuery.trim() || isReconstructing}
                      className="absolute right-2 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                    >
                      <Send size={10} />
                      <span>{isReconstructing ? "Executing..." : "Query AI"}</span>
                    </button>
                  </div>

                  {/* Suggestions pills */}
                  {!isLiveMode && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px]">
                      <div className="flex items-center gap-1 text-slate-500 font-mono text-[9px] font-bold uppercase mr-1">
                        <HelpCircle size={11} className="text-indigo-400 animate-pulse" />
                        <span>SUGGESTED CHIPS:</span>
                      </div>
                      {currentScenario.defaultQuestions.map((q) => (
                        <button
                          key={q}
                          onClick={() => {
                            setSearchQuery(q);
                            runReconstruction(q);
                          }}
                          className="text-[10px] font-mono bg-slate-950 hover:bg-slate-900 px-3 py-1 rounded-full border border-slate-850 hover:border-indigo-500/30 text-slate-400 hover:text-indigo-400 shadow-[0_2px_4px_rgba(0,0,0,0.2)] transition-all duration-200 cursor-pointer hover:translate-y-[-0.5px]"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pipeline Workflow block */}
                <PipelineWorkflow stages={pipelineStages} activeStageId={activeStageId} />

                {/* AI report panel */}
                {aiAnswer && (
                  <div className="space-y-6">
                    <AiReportPanel
                      aiAnswer={aiAnswer}
                      currentScenario={currentScenario}
                      scenarioEvents={scenarioEvents}
                      apiKeyActive={apiKeyActive}
                      matchingEntities={matchingEntities}
                      retrievedDocs={retrievedDocs}
                      searchQuery={searchQuery}
                      onNavigateToTimeline={() => setCurrentPage("timeline")}
                      onRegenerate={() => runReconstruction(searchQuery)}
                    />

                    {/* Retrieved document chunks (from hybrid search) */}
                    {retrievedDocs && retrievedDocs.length > 0 && (
                      <div
                        id="supporting-information-section"
                        className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4"
                      >
                        <div className="border-b border-slate-800 pb-3">
                          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
                            Supporting Hybrid-Search Indexes (Retrieved Blocks)
                          </span>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Raw semantic vectors matches and BM25 lexicons queried live from Knowledge Base.
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {retrievedDocs.map((doc, idx) => {
                            const entityTypeColors: Record<string, string> = {
                              issue: "border-amber-500/30 bg-amber-500/5 text-amber-400",
                              pr: "border-purple-500/30 bg-purple-500/5 text-purple-400",
                              commit: "border-emerald-500/30 bg-emerald-500/5 text-emerald-400",
                              review: "border-blue-500/30 bg-blue-500/5 text-blue-400"
                            };
                            const typeColor = entityTypeColors[doc.entityType] || "border-slate-800 bg-slate-900/40 text-slate-400";
                            
                            return (
                              <div key={doc.id || idx} className="p-3 bg-slate-950/60 border border-slate-850 rounded-lg text-left space-y-2 hover:border-indigo-500/30 transition-all duration-200">
                                <div className="flex justify-between items-start gap-2">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`text-[8px] font-bold font-mono px-1.5 py-0.5 rounded uppercase border ${typeColor}`}>
                                      {doc.entityType}
                                    </span>
                                    <span className="text-[10px] font-bold font-sans text-slate-200 line-clamp-1">
                                      {doc.metadata?.title || doc.metadata?.sha?.substring(0, 7) || "GitHub Node"}
                                    </span>
                                  </div>
                                  <span className="text-[9px] font-mono text-indigo-400 font-bold whitespace-nowrap bg-indigo-500/5 border border-indigo-500/10 px-1 py-0.5 rounded">
                                    Score: {doc.score?.toFixed(3)}
                                  </span>
                                </div>
                                
                                <p className="text-[10px] text-slate-400 font-mono line-clamp-2 leading-relaxed whitespace-pre-wrap bg-slate-950/40 p-2 border border-slate-900 rounded">
                                  {doc.text}
                                </p>
                                
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[8px] font-mono text-slate-500 border-t border-slate-900 pt-1.5">
                                  {doc.metadata?.author && <span>By: @{doc.metadata.author}</span>}
                                  {doc.metadata?.createdAt && <span>• {new Date(doc.metadata.createdAt).toLocaleDateString()}</span>}
                                  <span>• Ranks: Semantic #{doc.semanticRank}, BM25 #{doc.bm25Rank}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* SETTINGS PAGE */}
            {currentPage === "settings" && (
              <SettingsPage
                apiKeyActive={apiKeyActive}
                onSaveApiKey={handleSaveApiKeyOnBackend}
                isGitHubConnected={isGitHubConnected}
                githubUser={githubUser}
                onDisconnectGitHub={handleDisconnectGitHub}
              />
            )}

          </div>
        </main>

        {/* Minimal Footer */}
        <footer className="border-t border-slate-900 bg-slate-950 py-4 px-6 shrink-0">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3 text-[10px] font-mono text-slate-500">
            <div className="flex items-center gap-1.5">
              <BookOpen size={11} className="text-slate-600" />
              <span>SECURITY FORENSICS POLICY: COMPLIANT WITH LOCK-ID-77291</span>
            </div>
            <span>&copy; 2026 Chronos Forensics Inc. • GitHub + Vercel + Linear Inspired</span>
          </div>
        </footer>

      </div>

    </div>
  );
}
