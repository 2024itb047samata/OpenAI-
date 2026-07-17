import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import CybercoreBackground from "./CybercoreBackground";
import ShaderBackground from "./ShaderBackground";
import InteractiveHeroGraph from "./InteractiveHeroGraph";
import {
  Clock,
  Sparkles,
  Network,
  ArrowRight,
  GitBranch,
  ShieldCheck,
  Cpu,
  Layers,
  Lock,
  Terminal,
  Play,
  X,
  Database,
  Search,
  Check,
  ChevronRight,
  AlertCircle,
  Activity,
  Workflow,
  FileText
} from "lucide-react";

interface LandingPageProps {
  onLaunch: () => void;
  serverHealth: "checking" | "online" | "offline";
  apiKeyActive: boolean;
}

// ==========================================
// 1. DUAL-SPOTLIGHT GLASSMOPRHIC CARD
// ==========================================
function SpotlightCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isFocused, setIsFocused] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsFocused(true)}
      onMouseLeave={() => setIsFocused(false)}
      className={`relative overflow-hidden rounded-2xl border border-slate-800/60 bg-slate-900/20 backdrop-blur-xl transition-all duration-300 hover:border-indigo-500/30 hover:shadow-[0_0_30px_rgba(99,102,241,0.05)] ${className}`}
    >
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity: isFocused ? 1 : 0,
          background: `radial-gradient(350px circle at ${coords.x}px ${coords.y}px, rgba(129, 140, 248, 0.12), transparent 80%)`,
        }}
      />
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity: isFocused ? 1 : 0,
          background: `radial-gradient(100px circle at ${coords.x}px ${coords.y}px, rgba(139, 92, 246, 0.2), transparent 80%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// ==========================================
// 3. CHRONOLOGY CONDUIT CORE (INGESTION DEMO)
// ==========================================
interface SolderEdge {
  id: string;
  source: string;
  target: string;
}

function ChronologyConduit() {
  const [activeStep, setActiveStep] = useState(0);
  const [packets, setPackets] = useState<{ id: number; color: string; startNode: string; endNode: string }[]>([]);
  const [solderedEdges, setSolderedEdges] = useState<SolderEdge[]>([
    { id: "e1", source: "Main-Core", target: "Auth-Service" }
  ]);
  const [activeGraphNodes, setActiveGraphNodes] = useState<string[]>(["Main-Core", "Auth-Service", "S3-Bucket"]);
  const [pipelineRunning, setPipelineRunning] = useState(false);

  // Timeline events array
  const mockTimelineEvents = [
    {
      id: "ev-1",
      commit: "7b8e1a2",
      author: "bob_ops",
      type: "commit",
      desc: "Removed staging Redis container to optimize sandbox budget ($120/mo)",
      color: "rgba(16, 185, 129, 0.8)",
      targetNode: "Cache-Store",
      conduitNode: "Commit-Node"
    },
    {
      id: "ev-2",
      commit: "Issue #101",
      author: "alice_dev",
      type: "issue",
      desc: "Staging sandbox container Out-Of-Memory alert triggered in CI",
      color: "rgba(245, 158, 11, 0.8)",
      targetNode: "Heap-Limits",
      conduitNode: "Issue-Node"
    },
    {
      id: "ev-3",
      commit: "PR #405",
      author: "charlie_arch",
      type: "pr",
      desc: "Integrate bounded LRU Cache policy to prevent global leak crashes",
      color: "rgba(168, 85, 247, 0.8)",
      targetNode: "LRU-Engine",
      conduitNode: "PR-Node"
    }
  ];

  const graphNodesCoords: Record<string, { x: number; y: number; label: string; role: string }> = {
    "Main-Core": { x: 50, y: 50, label: "Main Core", role: "PLATFORM_ENTRY" },
    "Auth-Service": { x: 80, y: 25, label: "Auth Module", role: "SECURE_GUARD" },
    "S3-Bucket": { x: 20, y: 30, label: "S3 Storage", role: "STORAGE_NODE" },
    "Cache-Store": { x: 15, y: 75, label: "Redis Cache", role: "TRANSIENT_STORE" },
    "Heap-Limits": { x: 85, y: 70, label: "Heap Monitor", role: "TELEMETRY" },
    "LRU-Engine": { x: 55, y: 85, label: "LRU Engine", role: "EVICTION_LOGIC" }
  };

  const handleSolder = (stepIdx: number) => {
    if (pipelineRunning) return;
    triggerIngestSequence(stepIdx);
  };

  const triggerIngestSequence = (stepIdx: number) => {
    setPipelineRunning(true);
    setActiveStep(stepIdx);
    const event = mockTimelineEvents[stepIdx];

    // Spawn a glowing flying packet
    const newPacket = {
      id: Date.now(),
      color: event.color,
      startNode: event.conduitNode,
      endNode: event.targetNode
    };
    setPackets((prev) => [...prev, newPacket]);

    // Animate the connection addition after flight duration
    setTimeout(() => {
      // Add node to active set
      if (!activeGraphNodes.includes(event.targetNode)) {
        setActiveGraphNodes((prev) => [...prev, event.targetNode]);
      }

      // Add edge
      const edgeId = `edge-solder-${stepIdx}`;
      if (!solderedEdges.some((e) => e.id === edgeId)) {
        setSolderedEdges((prev) => [
          ...prev,
          { id: edgeId, source: "Main-Core", target: event.targetNode }
        ]);
      }

      // Remove animated packet
      setPackets((prev) => prev.filter((p) => p.id !== newPacket.id));
      setPipelineRunning(false);

      // Advance step on loop
      if (stepIdx === mockTimelineEvents.length - 1) {
        // Fully loaded, trigger subtle success ring
      }
    }, 1200);
  };

  // Autoplay loop
  useEffect(() => {
    const timer = setInterval(() => {
      if (!pipelineRunning) {
        const nextStep = (activeStep + 1) % mockTimelineEvents.length;
        triggerIngestSequence(nextStep);
      }
    }, 5500);
    return () => clearInterval(timer);
  }, [activeStep, pipelineRunning]);

  const resetGraph = () => {
    setSolderedEdges([{ id: "e1", source: "Main-Core", target: "Auth-Service" }]);
    setActiveGraphNodes(["Main-Core", "Auth-Service", "S3-Bucket"]);
    setActiveStep(0);
  };

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
      {/* Timeline Stream */}
      <div className="lg:col-span-5 flex flex-col gap-4 text-left">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-indigo-400 font-extrabold uppercase tracking-wider">
            <Workflow size={11} className="animate-spin" style={{ animationDuration: "3s" }} />
            <span>Chronology Stream</span>
          </div>
          <h4 className="text-sm font-sans font-extrabold text-slate-100">
            1. Parse Developer Event Logs
          </h4>
          <p className="text-[11px] text-slate-400">
            Hover or click to solder metadata. Watch the AI build relationships from the chronological commits into the central base.
          </p>
        </div>

        <div className="space-y-3 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[1.5px] before:bg-slate-900">
          {mockTimelineEvents.map((evt, idx) => {
            const isActive = activeStep === idx;
            const itemTypeColors: Record<string, string> = {
              commit: "border-emerald-500/30 bg-emerald-500/5 text-emerald-400",
              issue: "border-amber-500/30 bg-amber-500/5 text-amber-400",
              pr: "border-purple-500/30 bg-purple-500/5 text-purple-400"
            };

            return (
              <motion.div
                key={evt.id}
                onMouseEnter={() => handleSolder(idx)}
                onClick={() => handleSolder(idx)}
                className={`relative flex gap-4 p-3.5 rounded-xl border text-left transition-all duration-300 cursor-pointer select-none ${
                  isActive
                    ? "bg-slate-900/60 border-indigo-500/35 shadow-[0_0_15px_rgba(99,102,241,0.06)] scale-[1.01]"
                    : "bg-slate-950/20 border-slate-900/80 hover:border-slate-800"
                }`}
                whileHover={{ x: 2 }}
              >
                {/* Visual marker */}
                <div className="relative z-10 shrink-0">
                  <div
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center font-mono font-bold text-[9px] transition-all duration-500 ${
                      isActive
                        ? "shadow-[0_0_15px_rgba(129,140,248,0.2)] bg-indigo-950/60 text-white border-indigo-500"
                        : "bg-slate-950 text-slate-500 border-slate-800"
                    }`}
                  >
                    {evt.type === "commit" && "⌂"}
                    {evt.type === "issue" && "⚠️"}
                    {evt.type === "pr" && "⎇"}
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-1 flex-1">
                  <div className="flex justify-between items-center gap-2">
                    <span className={`text-[8px] font-mono font-bold px-1.5 py-0.2 rounded border uppercase ${itemTypeColors[evt.type]}`}>
                      {evt.commit}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500">@{evt.author}</span>
                  </div>
                  <p className="text-[11px] font-sans font-medium text-slate-200 line-clamp-2">
                    {evt.desc}
                  </p>
                  <div className="flex justify-between items-center pt-1.5">
                    <span className="text-[9px] font-mono text-indigo-400/80 flex items-center gap-1">
                      Target Graph Module: <code className="text-slate-300 font-bold font-mono text-[8px] px-1 bg-slate-900 rounded">{evt.targetNode}</code>
                    </span>
                    {isActive && (
                      <span className="text-[8px] font-mono bg-indigo-500/10 text-indigo-400 px-1.5 rounded animate-pulse">
                        splicing...
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <button
          onClick={resetGraph}
          className="mt-2 text-left self-start text-[9px] font-mono text-slate-600 hover:text-slate-400 transition-colors flex items-center gap-1"
        >
          <span>↺ Clear Spliced Map</span>
        </button>
      </div>

      {/* Visual Conduit Space */}
      <div className="lg:col-span-2 hidden lg:flex flex-col items-center justify-center relative">
        <div className="w-full h-0.5 bg-gradient-to-r from-indigo-500/10 via-indigo-500/20 to-indigo-500/10 relative">
          <div className="absolute inset-0 bg-indigo-500/20 blur-[2px]" />

          {/* Flying Packets simulation */}
          <AnimatePresence>
            {packets.map((pkt) => (
              <motion.div
                key={pkt.id}
                className="absolute w-3.5 h-3.5 rounded-full flex items-center justify-center -translate-y-1/2"
                style={{
                  boxShadow: `0 0 15px ${pkt.color}`,
                  background: pkt.color
                }}
                initial={{ left: "0%" }}
                animate={{ left: "100%" }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 1.1, ease: "easeInOut" }}
              >
                <Sparkles size={8} className="text-white animate-pulse" />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <span className="text-[8px] font-mono text-slate-600 uppercase tracking-widest mt-3">
          Semantic Solder conduit
        </span>
      </div>

      {/* Central Knowledge Graph */}
      <div className="lg:col-span-5 flex flex-col gap-4 text-left">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-indigo-400 font-extrabold uppercase tracking-wider">
            <Network size={11} className="text-indigo-400 animate-pulse" />
            <span>Spliced Semantic Graph</span>
          </div>
          <h4 className="text-sm font-sans font-extrabold text-slate-100">
            2. Build Interactive Knowledge Nodes
          </h4>
          <p className="text-[11px] text-slate-400">
            Entities solder to form an offline relational database. Reconstruct trace paths to find regressions instantly.
          </p>
        </div>

        {/* Graph Display Area */}
        <div className="flex-1 min-h-[300px] bg-slate-950/40 border border-slate-900 rounded-2xl relative p-5 overflow-hidden flex items-center justify-center">
          {/* Animated graph background grid */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.02),transparent_60%)]" />

          {/* Render lines (edges) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {solderedEdges.map((edge) => {
              const src = graphNodesCoords[edge.source];
              const tgt = graphNodesCoords[edge.target];
              if (!src || !tgt) return null;

              return (
                <g key={edge.id}>
                  <motion.line
                    x1={`${src.x}%`}
                    y1={`${src.y}%`}
                    x2={`${tgt.x}%`}
                    y2={`${tgt.y}%`}
                    stroke="rgba(129, 140, 248, 0.45)"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    initial={{ strokeDashoffset: 100 }}
                    animate={{ strokeDashoffset: 0 }}
                    transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
                  />
                  {/* Glowing core link */}
                  <motion.line
                    x1={`${src.x}%`}
                    y1={`${src.y}%`}
                    x2={`${tgt.x}%`}
                    y2={`${tgt.y}%`}
                    stroke="#818cf8"
                    strokeWidth="0.7"
                    initial={{ opacity: 0.1 }}
                    animate={{ opacity: [0.2, 0.8, 0.2] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  />
                </g>
              );
            })}
          </svg>

          {/* Render Nodes */}
          {Object.entries(graphNodesCoords).map(([id, node]) => {
            const isActive = activeGraphNodes.includes(id);
            const isHighlight = mockTimelineEvents[activeStep]?.targetNode === id;

            return (
              <motion.div
                key={id}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center select-none"
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
                animate={{
                  scale: isHighlight ? 1.15 : isActive ? 1.0 : 0.85,
                  opacity: isActive ? 1.0 : 0.25
                }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              >
                {/* Node orb */}
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-500 relative group cursor-pointer ${
                    isHighlight
                      ? "bg-indigo-950 border-indigo-400 shadow-[0_0_20px_rgba(139,92,246,0.6)]"
                      : isActive
                      ? "bg-slate-900/90 border-slate-700 hover:border-indigo-500"
                      : "bg-slate-950 border-slate-900"
                  }`}
                >
                  {/* Floating effect */}
                  {isHighlight && (
                    <span className="absolute inset-0 rounded-full border border-indigo-500 animate-ping opacity-60 pointer-events-none" />
                  )}

                  <span className="text-[10px] font-bold">
                    {id === "Main-Core" && "💻"}
                    {id === "Auth-Service" && "🔒"}
                    {id === "S3-Bucket" && "📦"}
                    {id === "Cache-Store" && "🗄️"}
                    {id === "Heap-Limits" && "📈"}
                    {id === "LRU-Engine" && "⚙️"}
                  </span>

                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:block bg-slate-950 border border-slate-800 text-[8.5px] font-mono p-1.5 rounded shadow-xl whitespace-nowrap z-30">
                    <p className="font-bold text-white uppercase">{node.label}</p>
                    <p className="text-indigo-400 font-extrabold">{node.role}</p>
                  </div>
                </div>

                <span className="text-[8.5px] font-mono font-semibold text-slate-400 mt-1.5 whitespace-nowrap tracking-tighter bg-slate-950/80 px-1 py-0.2 rounded">
                  {node.label}
                </span>
              </motion.div>
            );
          })}

          {/* Graph Sync Complete Indicator overlay */}
          <div className="absolute bottom-3 right-3 bg-slate-950/80 border border-slate-900 p-2 rounded-lg backdrop-blur text-[8px] font-mono flex items-center gap-1.5">
            <CheckCircle2 size={10} className="text-emerald-400" />
            <span className="text-slate-400">NODES LINKED: <strong className="text-indigo-400">{activeGraphNodes.length}/6</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}

const CheckCircle2 = ({ size, className }: { size: number; className?: string }) => (
  <svg className={className} width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);


// ==========================================
// 4. WATCH DEMO WALKTHROUGH MODAL
// ==========================================
interface DemoModalProps {
  onClose: () => void;
  onLaunch: () => void;
}

function WatchDemoModal({ onClose, onLaunch }: DemoModalProps) {
  const [activeTab, setActiveTab] = useState<"terminal" | "chronology" | "gemini">("terminal");
  const [logs, setLogs] = useState<string[]>([]);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [pipelineState, setPipelineState] = useState<"idle" | "running" | "complete">("idle");
  const logContainerRef = useRef<HTMLDivElement>(null);

  const demoLogs = [
    "[SYSTEM_INIT] Chronos Ingestion Daemon launched securely...",
    "[RECON_PIPELINE] Tracing production out-of-memory crash trace locks...",
    "[INGESTOR] GitHub API call: loading repo 'company/gateway-service'",
    "[INGESTOR] Synced 24 commit blobs, 4 pull requests, 8 related issues.",
    "[NLP_EXTRACTOR] Splicing event triggers matching 'S3 backups deleted'...",
    "[GRAPH_BUILDER] Splicing nodes: Bob (Author) -> Commit 1f4e5a9 -> Issue #315",
    "[GRAPH_BUILDER] Edge Spliced: AUTHOR_OF -> [Commit 1f4e5a9]",
    "[GRAPH_BUILDER] Edge Spliced: REASON_FOR_DELETE -> [Issue #315]",
    "[EMBEDDING] Injecting vector blocks using text-embedding-004 standard...",
    "[VECTOR_INDEX] Chronological RAG database compiled in sandbox memory.",
    "[ANALYSIS] Invoking Gemini-3.5-Flash reasoning query core..."
  ];

  const fullAiAnswer = `### 📂 S3 Storage Backup Outage Analysis

**1. Root Cause Explanation**
The helper function \`pruneStaleS3Backups()\` was deleted in commit **1f4e5a9** by **bob_ops** during a general code cleanup requested by **dave_manager** in **Issue #315**. 

**2. Why the regression bypassed checks?**
Because the script had no explicit static imports inside the primary Node server bundle (being triggered exclusively via dynamic shell cron jobs), Bob assumed it was dead code. 

**3. Remediation Actions**
Corrected by **alice_dev** in commit **fa9c12a** by restoring the function and adding a unit test verifying dynamic import resolves correctly before running container cleanup.`;

  useEffect(() => {
    setPipelineState("running");
    let currentIdx = 0;
    const interval = setInterval(() => {
      if (currentIdx < demoLogs.length) {
        setLogs((prev) => [...prev, demoLogs[currentIdx]]);
        currentIdx++;
        if (logContainerRef.current) {
          logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
      } else {
        clearInterval(interval);
        setPipelineState("complete");
        setActiveTab("gemini");
      }
    }, 450);

    return () => clearInterval(interval);
  }, []);

  // Text typewriter effect
  useEffect(() => {
    if (activeTab === "gemini" && pipelineState === "complete") {
      let charIdx = 0;
      setTypedAnswer("");
      const typeTimer = setInterval(() => {
        if (charIdx < fullAiAnswer.length) {
          setTypedAnswer((prev) => prev + fullAiAnswer.charAt(charIdx));
          charIdx += 2; // type slightly faster
        } else {
          clearInterval(typeTimer);
        }
      }, 10);
      return () => clearInterval(typeTimer);
    }
  }, [activeTab, pipelineState]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
        className="w-full max-w-4xl h-[560px] bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl relative"
      >
        {/* Glowing visual corners */}
        <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between shrink-0 bg-slate-950/40">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-xs font-mono font-bold text-slate-300">
              TIME MACHINE INVESTIGATION RECONSTRUCT DEMO
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800/60 rounded-lg text-slate-500 hover:text-white transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="px-6 py-2.5 bg-slate-950/20 border-b border-slate-850 flex justify-between items-center shrink-0">
          <div className="flex gap-2 text-[10px] font-mono">
            <button
              onClick={() => setActiveTab("terminal")}
              className={`px-3 py-1.5 rounded-md border font-bold transition-all cursor-pointer ${
                activeTab === "terminal"
                  ? "bg-indigo-600/10 border-indigo-500/40 text-indigo-400"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              [01] INGESTION CONDUIT
            </button>
            <button
              onClick={() => setActiveTab("gemini")}
              disabled={pipelineState !== "complete"}
              className={`px-3 py-1.5 rounded-md border font-bold transition-all cursor-pointer ${
                activeTab === "gemini"
                  ? "bg-indigo-600/10 border-indigo-500/40 text-indigo-400"
                  : "border-transparent text-slate-500 hover:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed"
              }`}
            >
              [02] GEMINI REASONING CORE
            </button>
          </div>

          <div className="text-[9px] font-mono">
            {pipelineState === "running" ? (
              <span className="text-indigo-400 flex items-center gap-1.5 font-bold uppercase animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" /> Analyzing Logs...
              </span>
            ) : (
              <span className="text-emerald-400 font-bold uppercase flex items-center gap-1">
                ✓ Spliced Ingest complete
              </span>
            )}
          </div>
        </div>

        {/* Main Content Pane */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950/40 font-mono text-left">
          {activeTab === "terminal" && (
            <div className="space-y-2 h-full flex flex-col justify-between">
              <div ref={logContainerRef} className="space-y-2 font-mono text-[11px] text-slate-400 overflow-y-auto flex-1 max-h-[340px]">
                {logs.map((log, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-2"
                  >
                    <span className="text-slate-700">{(idx + 1).toString().padStart(2, "0")}</span>
                    <span className={log.includes("[ANALYSIS]") || log.includes("[EMBEDDING]") ? "text-indigo-400 font-bold" : log.includes("[INGESTOR]") ? "text-emerald-400" : "text-slate-300"}>
                      {log}
                    </span>
                  </motion.div>
                ))}
              </div>

              {pipelineState === "complete" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-lg text-[10px] text-indigo-300 flex justify-between items-center mt-4"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles size={12} className="animate-pulse text-indigo-400" />
                    <span>Fact database compiled successfully. Click 'Gemini Reasoning' to view root cause breakdown.</span>
                  </div>
                  <button
                    onClick={() => setActiveTab("gemini")}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[9px] rounded transition-all cursor-pointer"
                  >
                    Open AI Report
                  </button>
                </motion.div>
              )}
            </div>
          )}

          {activeTab === "gemini" && (
            <div className="space-y-4 font-sans text-xs max-w-3xl mx-auto py-2 leading-relaxed">
              <div className="bg-slate-900/60 border border-indigo-500/20 rounded-xl p-5 shadow-inner">
                <div className="flex justify-between items-center border-b border-indigo-500/10 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-indigo-400 animate-pulse" />
                    <span className="font-mono text-[10px] text-slate-400 uppercase font-bold">
                      Reconstructed Investigation Analysis
                    </span>
                  </div>
                  <span className="text-[8px] font-mono px-2 py-0.5 bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 rounded font-bold uppercase">
                    Gemini-3.5-Flash
                  </span>
                </div>

                <div className="text-slate-200 select-text whitespace-pre-wrap font-sans text-xs leading-relaxed space-y-4">
                  {typedAnswer ? (
                    <div>
                      {typedAnswer.split("\n\n").map((para, idx) => {
                        if (para.startsWith("### ")) {
                          return <h4 key={idx} className="font-display font-extrabold text-sm text-indigo-400 mt-4 mb-2">{para.replace("### ", "")}</h4>;
                        }
                        if (para.startsWith("**1.") || para.startsWith("**2.") || para.startsWith("**3.")) {
                          const lines = para.split("\n");
                          return (
                            <div key={idx} className="mt-3">
                              <p className="font-bold text-white">{lines[0]}</p>
                              {lines.slice(1).join("\n") && <p className="text-slate-400 mt-1 pl-4 border-l border-indigo-500/20">{lines.slice(1).join("\n")}</p>}
                            </div>
                          );
                        }
                        return <p key={idx} className="text-slate-300">{para}</p>;
                      })}
                    </div>
                  ) : (
                    <span className="text-slate-600 italic">Synthesizing reasoning data nodes...</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between shrink-0 bg-slate-950/40">
          <span className="text-[10px] font-mono text-slate-500">
            Traced via Time Machine Core Sandbox Engine
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Exit Demo
            </button>
            <button
              onClick={onLaunch}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-[0_0_15px_rgba(99,102,241,0.25)]"
            >
              <span>Launch Full App</span>
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ==========================================
// 5. INTERACTIVE TERMINAL QUERY SIMULATOR
// ==========================================
function InteractiveTerminal() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  const demoScenarios: Record<string, { query: string; response: string }> = {
    redis: {
      query: "why-code-changed --commit=7b8e1a2",
      response: `[ANALYSIS COMPLETED SUCCESS]
>>> Query: Why was Redis removed?
>>> Commit: 7b8e1a2 (bob_ops)

1. ROOT CAUSE: Removed to reduce staging sandbox budget costs ($120/month).
2. CONSEQUENCE: A primitive local JavaScript dictionary fell back to store active request user sessions. Bypassed eviction controls, triggering an Out-Of-Memory container failure on staging integration load.
3. REMEDIATION: Charlie_arch restored staging limits via bounded LRU cache rules in Commit fa9c12a.`
    },
    auth: {
      query: "trace-security-by-pass --file=auth.ts",
      response: `[ANALYSIS COMPLETED SUCCESS]
>>> Query: Find bypass vulnerabilities in auth.ts
>>> Target: auth.ts

1. COMMITTED: db01a2f (bob_ops)
2. PURPOSE: Bob hardcoded a bypass check checking for 'ADMIN_SIMULATOR' string signature to allow Dave_manager to run staging demos quickly.
3. ESCALATION: CodeQL scan checks were administratively bypassed under merge limits. Corrected by Alice_dev in Commit 9c2041e.`
    },
    s3: {
      query: "why-code-changed --issue=315",
      response: `[ANALYSIS COMPLETED SUCCESS]
>>> Query: Trace why S3 backup deleted
>>> Target: Issue #315

1. RECONSTRUCTION: helper function 'pruneStaleS3Backups()' was pruned in Commit 1f4e5a9 by bob_ops.
2. CAUSE: Because S3 pruning was triggered solely via dynamised dynamic cron calls, static imports appeared empty. Bob assumed it was a dead file asset and safely discarded it. Restored by Alice_dev.`
    }
  };

  const runScenario = (key: string) => {
    if (loading) return;
    setLoading(true);
    setQuery(demoScenarios[key].query);
    setResponse(null);

    setTimeout(() => {
      setLoading(false);
      setResponse(demoScenarios[key].response);
    }, 1100);
  };

  return (
    <div className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-2xl relative text-left">
      {/* Window Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
          <span className="text-[10px] font-mono text-slate-500 ml-2">RECON_TERMINAL_PROMPT</span>
        </div>
        <div className="text-[9px] font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded font-extrabold uppercase">
          AI AGENT INTERFACE
        </div>
      </div>

      {/* Simulator buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-[9.5px] font-mono text-slate-500 self-center uppercase font-bold mr-1">
          Simulate Incident Queries:
        </span>
        <button
          onClick={() => runScenario("redis")}
          className="px-3 py-1.5 bg-slate-950 hover:bg-indigo-950/20 text-slate-300 hover:text-indigo-400 border border-slate-800 hover:border-indigo-500/30 text-[10px] font-mono rounded-lg transition-all cursor-pointer"
        >
          🔍 Why Redis Removed?
        </button>
        <button
          onClick={() => runScenario("auth")}
          className="px-3 py-1.5 bg-slate-950 hover:bg-indigo-950/20 text-slate-300 hover:text-indigo-400 border border-slate-800 hover:border-indigo-500/30 text-[10px] font-mono rounded-lg transition-all cursor-pointer"
        >
          🔒 Trace Auth Bypass
        </button>
        <button
          onClick={() => runScenario("s3")}
          className="px-3 py-1.5 bg-slate-950 hover:bg-indigo-950/20 text-slate-300 hover:text-indigo-400 border border-slate-800 hover:border-indigo-500/30 text-[10px] font-mono rounded-lg transition-all cursor-pointer"
        >
          📦 Why S3 Backups Outage?
        </button>
      </div>

      {/* Command prompt area */}
      <div className="space-y-3 bg-slate-950 rounded-xl p-4 border border-slate-850 min-h-[160px] font-mono text-[11px] leading-relaxed flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 text-slate-400">
            <span className="text-indigo-400 font-extrabold">time-machine:~$</span>
            <span className="text-slate-200">{query || "awaiting query..."}</span>
            {!query && <span className="w-1.5 h-3.5 bg-indigo-500 animate-pulse inline-block" />}
          </div>

          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-slate-500 mt-2 space-y-1"
            >
              <p className="animate-pulse">Connecting to isolated chronological database...</p>
              <div className="w-full bg-slate-900 h-1 rounded overflow-hidden border border-slate-850">
                <motion.div
                  className="bg-indigo-500 h-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 0.9 }}
                />
              </div>
            </motion.div>
          )}

          {response && (
            <motion.div
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-slate-300 mt-3 whitespace-pre-wrap select-text leading-relaxed font-mono border-t border-slate-900 pt-3"
            >
              {response}
            </motion.div>
          )}
        </div>

        {!query && !loading && (
          <span className="text-slate-600 italic">Select one of the incident queries above to witness semantic vector lookup and Gemini synthesis.</span>
        )}
      </div>
    </div>
  );
}


// ==========================================
// MAIN LANDING PAGE COMPONENT
// ==========================================
export default function LandingPage({ onLaunch, serverHealth, apiKeyActive }: LandingPageProps) {
  const [showDemo, setShowDemo] = useState(false);

  return (
    <div className="relative min-h-screen bg-transparent text-slate-100 overflow-x-hidden flex flex-col font-sans selection:bg-indigo-500/30 selection:text-white" id="knowledge-time-machine-universe">
      
      {/* 1. CUSTOM KEYFRAME CSS STYLES */}
      <style>{`
        @keyframes drift {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(40px, -40px) scale(1.15); }
          66% { transform: translate(-30px, 30px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes grid-scroll {
          from { background-position: 0 0; }
          to { background-position: 0 100%; }
        }
        .aurora-blur-1 {
          animation: drift 25s ease-in-out infinite;
        }
        .aurora-blur-2 {
          animation: drift 32s ease-in-out infinite alternate;
        }
        .grid-perspective-floor {
          background-image: linear-gradient(rgba(99, 102, 241, 0.05) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(99, 102, 241, 0.05) 1px, transparent 1px);
          background-size: 50px 50px;
          transform: perspective(600px) rotateX(65deg);
          transform-origin: top;
          animation: grid-scroll 28s linear infinite;
        }
        .text-glow {
          text-shadow: 0 0 40px rgba(139, 92, 246, 0.15);
        }
      `}</style>

      {/* 2. ATMOSPHERIC INTERSTELLAR BACKGROUNDS */}
      {/* 1. Fixed elegant WebGL Shader background (z-index: 0) */}
      <ShaderBackground />

      {/* 2. Dark overlay (65% opacity) above shader (z-index: 1) to secure text readability */}
      <div 
        className="fixed inset-0 bg-[#050816]/65 pointer-events-none select-none" 
        style={{ zIndex: 1 }} 
      />

      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 2 }}>
        {/* 3. Premium animated mesh and floating particles (Cybercore background is now transparent) */}
        <div className="absolute inset-0 z-[2] opacity-75">
          <CybercoreBackground />
        </div>

        {/* Deep Glowing Fog */}
        <div className="absolute top-[10%] left-[10%] w-[600px] h-[600px] bg-indigo-900/10 rounded-full blur-[160px] aurora-blur-1 z-[3]" />
        <div className="absolute bottom-[20%] right-[5%] w-[500px] h-[500px] bg-purple-900/800 bg-purple-950/10 rounded-full blur-[140px] aurora-blur-2 z-[3]" />
        <div className="absolute top-[60%] left-[45%] w-[400px] h-[400px] bg-blue-900/10 rounded-full blur-[130px] z-[3]" />

        {/* Cinematic Grid Horizon Floor */}
        <div className="absolute bottom-0 left-0 right-0 h-[45%] overflow-hidden z-[4]">
          <div className="absolute inset-0 bg-gradient-to-t from-[#050816] via-transparent to-transparent z-10" />
          <div className="absolute inset-0 grid-perspective-floor opacity-80" />
        </div>
      </div>

      {/* 4. MAIN PAGE CONTENT WRAPPER (z-index: 10) */}
      <div className="relative z-10 flex-1 flex flex-col">
        {/* 3. PREMIUM TOP BAR GLASS NAVIGATION */}
        <header className="relative z-20 border-b border-slate-900/60 bg-[#050816]/40 backdrop-blur-xl px-6 py-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
            <Clock className="w-4.5 h-4.5 animate-pulse" />
          </div>
          <div className="text-left">
            <span className="text-xs font-extrabold font-display tracking-tight text-white uppercase block">
              Knowledge Time Machine
            </span>
            <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block">
              SaaS Engine Core v1.5
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[10px] font-mono">
          <div className="flex items-center gap-2 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-900">
            <span className="text-slate-500">PLATFORM_STABILITY:</span>
            {serverHealth === "online" ? (
              <span className="text-emerald-400 font-extrabold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> ONLINE
              </span>
            ) : (
              <span className="text-amber-400 font-extrabold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> CHECKING
              </span>
            )}
          </div>
          
          <button
            onClick={onLaunch}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-sans font-bold transition-all duration-300 flex items-center gap-1.5 cursor-pointer shadow-[0_0_20px_rgba(99,102,241,0.25)] hover:shadow-[0_0_30px_rgba(99,102,241,0.4)]"
          >
            <span>Launch Engine</span>
            <ArrowRight size={12} className="animate-pulse" />
          </button>
        </div>
      </header>

      {/* 4. CINEMATIC HERO SECTION */}
      <main className="relative z-10 flex-1 flex flex-col gap-24 py-12 md:py-20 px-6 max-w-7xl mx-auto w-full">
        
        {/* SECTION A: HERO CONTAINER */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center py-12 md:py-20 relative max-w-7xl mx-auto w-full">
          {/* Left Column: Authentic Hero Copy & Interactions */}
          <div className="col-span-12 lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-[10.5px] font-mono font-bold backdrop-blur-md shadow-[0_0_20px_rgba(99,102,241,0.05)]"
            >
              <Sparkles size={12} className="animate-pulse" />
              <span>THE COGNITIVE GIT HISTORY ANALYZER</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15, type: "spring" }}
              className="text-4xl sm:text-5xl md:text-6.5xl font-display font-black tracking-tight text-slate-100 leading-[1.08] text-glow bg-gradient-to-br from-white via-white to-slate-400 text-transparent bg-clip-text text-center lg:text-left"
            >
              Every Commit <br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 text-transparent bg-clip-text font-black">
                Has a Story.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-sm sm:text-base text-slate-400 leading-relaxed font-sans max-w-2xl text-center lg:text-left"
            >
              Knowledge Time Machine reconstructs the engineering decisions behind every code change using AI. Solder issue tracking logs, pull requests, and commit logs into an offline relationship graph.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.45 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2 w-full sm:w-auto"
            >
              <button
                onClick={onLaunch}
                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold font-sans tracking-wide transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_25px_rgba(99,102,241,0.35)] hover:scale-[1.02]"
              >
                <span>✨ Start Exploring</span>
                <ArrowRight size={14} />
              </button>
              
              <button
                onClick={() => setShowDemo(true)}
                className="px-8 py-4 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold font-sans border border-slate-800 hover:border-slate-700 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer backdrop-blur-sm"
              >
                <Play size={11} className="text-indigo-400 fill-indigo-400" />
                <span>▶ Watch Demo</span>
              </button>
            </motion.div>

            {/* Quick Metrics bar - styled as a beautiful premium glassmorphism capsule */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="flex flex-wrap justify-center lg:justify-start items-center gap-6 md:gap-8 px-6 py-4 bg-slate-900/20 backdrop-blur-xl rounded-2xl border border-slate-800/40 shadow-[0_0_30px_rgba(99,102,241,0.02)] max-w-2xl mt-12"
            >
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">Grounding Vector SLA</span>
                <span className="text-xs font-display font-bold text-slate-200">99.98% Factuality</span>
              </div>
              <div className="hidden sm:block w-[1px] h-8 bg-slate-800/60" />
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">Graph Compile Latency</span>
                <span className="text-xs font-display font-bold text-slate-200">&lt;1.2s Real-time Solder</span>
              </div>
              <div className="hidden sm:block w-[1px] h-8 bg-slate-800/60" />
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">Engine Context</span>
                <span className="text-xs font-display font-bold text-indigo-400">Offline Compliant</span>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Premium Interactive Knowledge Graph Visual */}
          <div className="col-span-12 lg:col-span-5 w-full flex items-center justify-center relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 25 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.35, type: "spring", bounce: 0.15 }}
              className="w-full"
            >
              <InteractiveHeroGraph />
            </motion.div>
          </div>
        </section>

        {/* SECTION B: PLAYGROUND SANDBOX TERMINAL (SCROLL TO VIEW) */}
        <motion.section
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="space-y-6"
        >
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <span className="text-[10px] font-mono font-bold text-indigo-500 uppercase tracking-widest block">
              EXPERIENCE THE INTELLIGENCE
            </span>
            <h3 className="text-xl md:text-2xl font-display font-extrabold text-white tracking-tight">
              Interactive Reasoning Sandbox
            </h3>
            <p className="text-xs text-slate-400">
              Run simulated forensic traces below to see how Knowledge Time Machine parses metadata relations to resolve mystery regressions in seconds.
            </p>
          </div>

          <div className="max-w-4xl mx-auto w-full">
            <InteractiveTerminal />
          </div>
        </motion.section>

        {/* SECTION C: CHRONOLOGY CONDUIT PIPELINE (SCROLL TO VIEW) */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-120px" }}
          transition={{ duration: 0.8 }}
          className="border-t border-slate-900/60 pt-20"
        >
          <ChronologyConduit />
        </motion.section>

        {/* SECTION D: BENTO FEATURES GRID */}
        <section className="space-y-12 border-t border-slate-900/60 pt-20">
          <div className="text-center space-y-2">
            <span className="text-[10px] font-mono font-bold text-indigo-500 uppercase tracking-widest block">
              ARCHITECTURE STACK
            </span>
            <h2 className="text-2xl md:text-3.5xl font-display font-extrabold text-white tracking-tight">
              Premium Cognitive Architecture
            </h2>
            <p className="text-xs text-slate-400 max-w-lg mx-auto">
              Engineered with advanced database mapping algorithms and high-contrast glass UI inspired by Linear, Apple Vision, and Vercel.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <SpotlightCard className="p-6 text-left space-y-4">
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 w-fit shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                <GitBranch size={20} className="animate-pulse" />
              </div>
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-bold text-slate-500 uppercase">01 // CHRONOLOGY</h4>
                <h3 className="text-sm font-sans font-bold text-slate-100">
                  Chronological Telemetry Timelines
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Track dynamic commit histories, pull requests, issues, and CodeQL checks compiled chronologically into a single, comprehensive workspace pane.
                </p>
              </div>
            </SpotlightCard>

            <SpotlightCard className="p-6 text-left space-y-4">
              <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400 w-fit shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                <Network size={20} />
              </div>
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-bold text-slate-500 uppercase">02 // EMBEDDINGS</h4>
                <h3 className="text-sm font-sans font-bold text-slate-100">
                  Inter-Record Relationship Mapping
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Our advanced compiler matches commits to referenced issues (e.g. "Closes #101"), author records, files, and dynamic container logs into a searchable map.
                </p>
              </div>
            </SpotlightCard>

            <SpotlightCard className="p-6 text-left space-y-4">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 w-fit shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                <Sparkles size={20} />
              </div>
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-bold text-slate-500 uppercase">03 // AI HYBRID SEARCH</h4>
                <h3 className="text-sm font-sans font-bold text-slate-100">
                  Gemini-Powered Outage Reports
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Slices text semantic vectors and BM25 keywords via RRF. Formulate clear explanations of why code blocks were deleted or modified, preventing regressions.
                </p>
              </div>
            </SpotlightCard>
          </div>
        </section>

      </main>

      {/* 5. WATCH DEMO MODAL ANIME */}
      <AnimatePresence>
        {showDemo && (
          <WatchDemoModal
            onClose={() => setShowDemo(false)}
            onLaunch={() => {
              setShowDemo(false);
              onLaunch();
            }}
          />
        )}
      </AnimatePresence>

        {/* 6. IMMERSIVE MINIMAL FOOTER */}
        <footer className="relative z-10 border-t border-slate-900/60 bg-[#050816]/60 backdrop-blur-xl py-12 px-6 text-center mt-auto font-mono text-[10px] text-slate-500 space-y-3">
          <div className="flex items-center justify-center gap-1.5 text-[9px] uppercase tracking-wider text-slate-600">
            <ShieldCheck size={12} className="text-indigo-500/50" />
            <span>Compliant with Lock-ID-77291 Sandbox Cryptography</span>
          </div>
          <p>&copy; 2026 Knowledge Time Machine Inc. • Inspired by Figma Config 2025, Vercel, Linear, and Interstellar.</p>
        </footer>
      </div>
    </div>
  );
}
