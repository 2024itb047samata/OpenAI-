import React, { useState, useEffect, useRef } from "react";
import {
  ShieldCheck,
  Sparkles,
  CheckCircle,
  GitPullRequest,
  GitCommit,
  AlertCircle,
  FileText,
  ChevronRight,
  User,
  Calendar,
  MessageSquare,
  ArrowRight,
  ShieldAlert,
  Download,
  Info,
  Terminal,
  Layers,
  Heart,
  ExternalLink,
  ChevronDown
} from "lucide-react";
import { KnowledgeGraphNode, KnowledgeGraphEdge, Scenario, WorkflowEvent } from "../types";
import KnowledgeGraphView from "./KnowledgeGraphView";

interface EvidencePageProps {
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  currentScenario: Scenario;
  scenarioEvents: WorkflowEvent[];
  selectedEventId: string | null;
  onSelectEvent: (eventId: string | null) => void;
}

export default function EvidencePage({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  currentScenario,
  scenarioEvents,
  selectedEventId,
  onSelectEvent
}: EvidencePageProps) {
  const [activeEvidenceModal, setActiveEvidenceModal] = useState<any | null>(null);
  const [isTimelineHighlighted, setIsTimelineHighlighted] = useState(false);
  const [expandedDiff, setExpandedDiff] = useState<Record<string, boolean>>({});

  const timelineContainerRef = useRef<HTMLDivElement>(null);

  // Pre-baked elite premium storytelling metadata per scenario
  const scenarioStories: Record<string, {
    storyTitle: string;
    overview: string;
    explanationMarkdown: string;
    confidenceScore: number;
    confidenceFactors: string[];
    evidenceItems: {
      id: string;
      label: string;
      type: "pr" | "issue" | "slack" | "docs" | "commit";
      ref: string;
      content: string;
      verified: boolean;
    }[];
  }> = {
    "redis-incident": {
      storyTitle: "The Redis Ingestion Downgrade Memory Leak",
      overview: "Trace how a cloud optimization task to scale down staging servers inadvertently replaced a robust Redis remote cache with an unbound memory-leaking local Dictionary fallback, which subsequently crashed longevity build containers.",
      confidenceScore: 98,
      confidenceFactors: [
        "Cryptographic commit signature verified for bob_ops",
        "Watchdog build memory logging matches the JavaScript Heap capacity limit",
        "Matching PR #405 reviews flagged memory leaks but were overridden"
      ],
      explanationMarkdown: "To reduce staging infrastructure budget fees, the Redis remote cluster was deleted and replaced with a global JS Object dictionary (`localCache = {}`) in `src/services/cache.js`. Because this dictionary lacked a TTL or eviction strategy, memory grew boundlessly during longevity tests, crashing with a JavaScript Heap Out of Memory error in Build #902. This was ultimately mitigated by wrapping the dictionary inside a bounded LRU Cache in fa9c12a.",
      evidenceItems: [
        {
          id: "ev-redis-1",
          label: "PR #405: Scale down staging databases",
          type: "pr",
          ref: "PR #405",
          content: "PR authorized by bob_ops. Replaces containerized Redis connections with an unevictable global JavaScript object cache to save $120/month per environment.",
          verified: true
        },
        {
          id: "ev-redis-2",
          label: "Issue #101: Staging Cloud Constraints",
          type: "issue",
          ref: "Issue #101",
          content: "Dave_manager logged an issue requesting developers to 'minimize unessential third-party dependencies' inside non-production environments to streamline budgets.",
          verified: true
        },
        {
          id: "ev-redis-3",
          label: "Internal Slack Sync: #infra-alerts",
          type: "slack",
          ref: "#infra-alerts",
          content: "alice_dev: 'Wait, if we use a plain JS object, we have no TTL eviction. Won't this leak memory?'\nbob_ops: 'Staging has very low traffic, it will survive. We can fix it later if it leaks.'",
          verified: true
        },
        {
          id: "ev-redis-4",
          label: "Cache.js Architecture Document",
          type: "docs",
          ref: "cache_service.md",
          content: "Core cache specifications demand a strict bounded footprint on memory in server instances. Replacing Redis violates rule 4.3 of the cloud security framework.",
          verified: true
        },
        {
          id: "ev-redis-5",
          label: "Commit 7b8e1a2: Remove Redis Cluster",
          type: "commit",
          ref: "7b8e1a2",
          content: "Refactored cache connection logic. Deleted standard Redis setup, established a primitive key-value object cache with no size limits.",
          verified: true
        }
      ]
    },
    "auth-bypass": {
      storyTitle: "The Staging Pipeline Cryptographic Bypass Backdoor",
      overview: "Deconstruct how an engineering request to decrease latency on local environments bypassed a static security CodeQL barrier, creating a severe cryptographic backdoor that went straight into production packages.",
      confidenceScore: 99,
      confidenceFactors: [
        "CodeQL Static audit records clearly flagged db01a2f as a severity:critical risk",
        "Dave_manager merged the pull request bypassing standard branch safeguards",
        "Commit 9c2041e fully reverted the MD5 fallback structure"
      ],
      explanationMarkdown: "To fix Issue #202 (JWT decryption latency in testing environments), bob_ops added a temporary bypass backdoor checking client tokens starting with 'md5-' or matching 'test-override' directly, returning root admin rights without secret decryption. This was flagged by CodeQL in Build #945, but dave_manager bypassed the scan and merged PR #411 to keep a board demo green. Alice_dev later discovered and deleted the backdoor in 9c2041e.",
      evidenceItems: [
        {
          id: "ev-auth-1",
          label: "PR #411: Fix test account latency",
          type: "pr",
          ref: "PR #411",
          content: "Merged by dave_manager. Contains a raw cryptographic check that bypasses strong AES signature authentication when certain headers are transmitted.",
          verified: true
        },
        {
          id: "ev-auth-2",
          label: "Issue #202: JWT Parsing Latency on Mobile",
          type: "issue",
          ref: "Issue #202",
          content: "Charlie_arch reports that Vite staging environments experience a 300ms decryption lag on mobile client test requests.",
          verified: true
        },
        {
          id: "ev-auth-3",
          label: "Developer Sync on Slack",
          type: "slack",
          ref: "#sec-emergency",
          content: "alice_dev: 'Who put this test-override in production auth?!'\nbob_ops: 'Ah, sorry. I was testing a bypass in staging because HMAC decryption was slow. Dave asked to merge it immediately for the board demo.'",
          verified: true
        },
        {
          id: "ev-auth-4",
          label: "Security Audit CodeQL Log",
          type: "docs",
          ref: "codeql-audit.log",
          content: "Alert: CRITICAL SECURITY BYPASS in auth.ts. Plaintext signature matching allowed. Merging this block exposes user permissions to raw manipulation.",
          verified: true
        },
        {
          id: "ev-auth-5",
          label: "Commit db01a2f: add test backdoor",
          type: "commit",
          ref: "db01a2f",
          content: "Introduces bypass pattern. Allows tokens matching test-override or prefixed with md5- to skip full signature validation checks.",
          verified: true
        }
      ]
    },
    "orphaned-sync": {
      storyTitle: "The AWS S3 Backup Orphaned Pruner Deletion",
      overview: "Trace how a routine code house-cleaning sweep to delete unused modules failed to account for external system Cron Jobs, leading to failed Lambda runs, cumulative temporary storage dumps, and massive AWS S3 cost overrides.",
      confidenceScore: 96,
      confidenceFactors: [
        "AWS CloudWatch logs recorded daily 'Cannot find module' Lambda triggers",
        "S3 Bucket metrics logged a storage size expansion from 2.1TB to 14.5TB",
        "Commit 1f4e5a9 directly purged the storage sync service helper without static imports"
      ],
      explanationMarkdown: "During a general code clean-up (Issue #315), bob_ops deleted pruneStaleS3Backups() in 1f4e5a9 assuming it was dead code because no static imports referenced it in the core bundle. However, an external AWS Lambda cron job invoked this file dynamically. Its deletion caused the daily cron to crash, leaving unpruned diagnostics files to pile up, swelling S3 storage to 14.5TB and triggering a 450% budget surge.",
      evidenceItems: [
        {
          id: "ev-sync-1",
          label: "PR #320: Pruning Stale Controllers",
          type: "pr",
          ref: "PR #320",
          content: "Pruned 12 files identified as orphaned. Author: bob_ops. Merged after basic static dependency checks passed without warnings.",
          verified: true
        },
        {
          id: "ev-sync-2",
          label: "Issue #315: Codebase general cleanup",
          type: "issue",
          ref: "Issue #315",
          content: "Dave_manager requested that the team delete 'legacy dead code' and 'stale configuration files' to keep the build sizes minimal.",
          verified: true
        },
        {
          id: "ev-sync-3",
          label: "AWS Billing Support Discussion",
          type: "slack",
          ref: "#cloud-billing",
          content: "dave_manager: 'Our S3 invoice is up 450% this month! Why did we use 14.5TB of storage?'\nbob_ops: 'Oh my god. The pruning helper I deleted was called directly by our external AWS backup lambda! Let me restore it immediately.'",
          verified: true
        },
        {
          id: "ev-sync-4",
          label: "S3 Storage Policy Schema",
          type: "docs",
          ref: "s3_retention.json",
          content: "Specifies a maximum retention period of 48 hours for temporary archives. Daily dynamic pruning is mandatory to stay within budget quotas.",
          verified: true
        },
        {
          id: "ev-sync-5",
          label: "Commit 1f4e5a9: Delete sync service",
          type: "commit",
          ref: "1f4e5a9",
          content: "Deleted storage_sync_cleanup_service.js. Refactored the storage module file structure.",
          verified: true
        }
      ]
    }
  };

  const activeStory = scenarioStories[currentScenario.id] || scenarioStories["redis-incident"];
  const activeEvent = scenarioEvents.find((e) => e.id === selectedEventId) || scenarioEvents[0] || null;

  const handleViewCompleteStory = () => {
    setIsTimelineHighlighted(true);
    if (timelineContainerRef.current) {
      timelineContainerRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    // Automatically select the first event to kickoff the story experience
    if (scenarioEvents.length > 0) {
      onSelectEvent(scenarioEvents[0].id);
    }
    // Reset glow after 3 seconds
    setTimeout(() => {
      setIsTimelineHighlighted(false);
    }, 3000);
  };

  const toggleDiff = (filePath: string) => {
    setExpandedDiff((prev) => ({ ...prev, [filePath]: !prev[filePath] }));
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "pr":
      case "pr_opened":
        return <GitPullRequest size={13} className="text-indigo-400" />;
      case "commit":
        return <GitCommit size={13} className="text-purple-400" />;
      case "issue":
      case "issue_created":
        return <MessageSquare size={13} className="text-amber-400" />;
      case "ci_log":
      case "ci_failed":
        return <AlertCircle size={13} className="text-red-400 animate-pulse" />;
      default:
        return <Calendar size={13} className="text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-left pb-16" id="why-it-changed-container">
      {/* 1. TOP HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-5">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-mono text-[10px] font-bold uppercase tracking-widest">
            <Sparkles size={11} className="animate-pulse" />
            <span>AI Forensic Investigator</span>
          </div>
          <h2 className="text-xl font-display font-bold text-slate-100 mt-1">
            Why It Changed
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Understand the complete narrative of changes, regressions, decisions, and system chronology.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-3 py-1.5 text-[10px] font-mono text-indigo-400 font-bold">
            <ShieldCheck size={12} className="text-indigo-400" />
            <span>VERIFIED DIGITAL LEDGER</span>
          </div>
        </div>
      </div>

      {/* 2. DUAL COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Narrative & Supporting Evidence */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* A. STORY OVERVIEW & AI EXPLANATION */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950/40">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex justify-between items-start border-b border-slate-800 pb-3.5">
              <div className="space-y-0.5">
                <span className="text-[8px] font-mono font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded px-1.5 py-0.5 uppercase tracking-wider">
                  Incident Narrative
                </span>
                <h3 className="text-sm font-sans font-bold text-slate-200 mt-2">
                  {activeStory.storyTitle}
                </h3>
              </div>

              {/* Confidence Metric */}
              <div className="flex flex-col items-end">
                <span className="text-[9px] font-mono text-slate-500">AI CONFIDENCE</span>
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center">
                    <CheckCircle size={8} className="text-emerald-400" />
                  </div>
                  <span className="text-sm font-mono font-black text-emerald-400">
                    {activeStory.confidenceScore}%
                  </span>
                </div>
              </div>
            </div>

            {/* AI Explanation block */}
            <div className="mt-4 space-y-4">
              <div className="bg-slate-950/60 border border-slate-850 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-xs font-sans">
                  <Sparkles size={13} className="text-indigo-400" />
                  <span>Why it changed: AI Reconstruction</span>
                </div>
                
                <p className="text-[11px] font-mono leading-relaxed text-slate-300">
                  {activeStory.explanationMarkdown}
                </p>

                <p className="text-[10px] text-slate-500 font-sans italic border-t border-slate-900 pt-2.5">
                  "{activeStory.overview}"
                </p>
              </div>

              {/* Verification Checklist */}
              <div className="space-y-2">
                <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
                  Verification Audit Factors:
                </span>
                <div className="grid grid-cols-1 gap-1.5 text-[10px] font-mono text-slate-400">
                  {activeStory.confidenceFactors.map((factor, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-950/40 p-2 rounded border border-slate-850/80">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                      <span>{factor}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* B. SUPPORTING EVIDENCE LEDGER */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <span className="text-[9px] font-mono font-bold text-slate-500 block uppercase tracking-wider">
                Supporting Evidence & Linked Records
              </span>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Click on any verified record to fetch raw metadata digests, transcripts, and secure proof signatures.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeStory.evidenceItems.map((item) => {
                const colors: Record<string, string> = {
                  pr: "border-indigo-500/20 hover:border-indigo-500/50 hover:bg-indigo-500/5 text-indigo-400",
                  issue: "border-amber-500/20 hover:border-amber-500/50 hover:bg-amber-500/5 text-amber-400",
                  slack: "border-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-500/5 text-emerald-400",
                  docs: "border-blue-500/20 hover:border-blue-500/50 hover:bg-blue-500/5 text-blue-400",
                  commit: "border-purple-500/20 hover:border-purple-500/50 hover:bg-purple-500/5 text-purple-400"
                };

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveEvidenceModal(item)}
                    className={`p-3 rounded-lg border text-left bg-slate-950/40 transition-all duration-200 cursor-pointer flex flex-col justify-between h-24 ${colors[item.type] || "border-slate-800 hover:border-slate-700"}`}
                  >
                    <div className="w-full flex justify-between items-start">
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider">
                        {item.type} RECORD
                      </span>
                      <span className="text-[10px] font-mono font-extrabold text-slate-500 select-all">
                        {item.ref}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-sans font-bold text-slate-200 block truncate">
                        {item.label}
                      </span>
                      <div className="flex items-center gap-1 text-[9px] font-mono text-slate-500">
                        <CheckCircle size={9} className="text-emerald-400" />
                        <span>Cryptographically Verified</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* View Complete Story CTA Button */}
            <div className="pt-2 border-t border-slate-800/60 mt-2 flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-500">
                Wired with knowledge topology engine
              </span>
              
              <button
                onClick={handleViewCompleteStory}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs rounded-lg shadow-lg shadow-indigo-600/10 hover:shadow-indigo-500/20 transition-all flex items-center gap-2 cursor-pointer group"
              >
                <span>View Complete Story</span>
                <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Connected Timeline Card */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* THE CHRONOLOGICAL CONNECTED TIMELINE CARD */}
          <div
            ref={timelineContainerRef}
            className={`bg-slate-900 border rounded-xl p-5 shadow-lg flex flex-col transition-all duration-500 ${
              isTimelineHighlighted
                ? "border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/30"
                : "border-slate-800"
            }`}
          >
            <div className="flex justify-between items-center border-b border-slate-800 pb-3.5 mb-4">
              <div className="space-y-0.5">
                <span className="text-[8px] font-mono font-bold text-slate-500 block uppercase tracking-wider">
                  Chronological Path
                </span>
                <h4 className="text-xs font-sans font-bold text-slate-200">
                  Incident Path Timeline ({scenarioEvents.length} events)
                </h4>
              </div>

              <span className="text-[9px] font-mono text-slate-500 uppercase">
                UTC CLOCK
              </span>
            </div>

            {/* Timeline Items List */}
            <div className="space-y-3.5 max-h-[480px] overflow-y-auto pr-1 scrollbar-thin">
              {scenarioEvents.map((evt, idx) => {
                const isSelected = selectedEventId === evt.id;
                const formattedDate = new Date(evt.timestamp).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "UTC",
                });

                return (
                  <div
                    key={evt.id}
                    onClick={() => {
                      onSelectEvent(evt.id);
                      // Auto trigger node highlight on clicking timeline event
                      const nodeMatch = nodes.find(
                        (n) => n.id.toLowerCase().includes(evt.author.toLowerCase()) || n.id.toLowerCase().includes(evt.refId?.toLowerCase().replace("commit ", "co-").replace("issue #", "is-").replace("pr #", "pr-") || "")
                      );
                      if (nodeMatch) onSelectNode(nodeMatch.id);
                    }}
                    className={`relative flex gap-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "bg-indigo-600/10 border-indigo-500/60 text-indigo-100 shadow-[0_0_10px_rgba(99,102,241,0.05)]"
                        : "bg-slate-950/40 border-slate-850 text-slate-400 hover:border-slate-800 hover:text-slate-300"
                    }`}
                  >
                    {/* Vertical connecting line */}
                    {idx < scenarioEvents.length - 1 && (
                      <div className="absolute left-[22px] top-[40px] w-[1px] h-[calc(100%-4px)] bg-slate-800/80 pointer-events-none" />
                    )}

                    {/* Timeline Event Node */}
                    <div
                      className={`w-[20px] h-[20px] rounded-full flex items-center justify-center shrink-0 border transition-all duration-300 ${
                        isSelected
                          ? "bg-indigo-500/20 border-indigo-400 text-indigo-400 ring-2 ring-indigo-500/15"
                          : "bg-slate-900 border-slate-800"
                      }`}
                    >
                      {getEventIcon(evt.type)}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[9px] font-mono text-slate-500">
                          {formattedDate}
                        </span>
                        <span className="text-[9px] font-mono text-slate-600 font-bold uppercase select-all">
                          {evt.refId}
                        </span>
                      </div>
                      
                      <h5 className="text-[11px] font-sans font-bold leading-snug">
                        {evt.title}
                      </h5>

                      <p className="text-[10px] font-mono leading-relaxed text-slate-500 line-clamp-2">
                        {evt.description}
                      </p>

                      <div className="flex items-center gap-1.5 pt-1 text-[9px] font-mono text-slate-400">
                        <User size={10} className="text-slate-600" />
                        <span>@{evt.author}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ACTIVE EVENT DRILL-DOWN PANEL */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
            <span className="text-[10px] font-mono font-bold text-slate-500 block mb-2.5 uppercase tracking-wider border-b border-slate-850 pb-2">
              Timeline Artifact Inspector
            </span>

            {activeEvent ? (
              <div className="space-y-3.5">
                <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                  <div className="flex items-center gap-2">
                    {getEventIcon(activeEvent.type)}
                    <span className="text-xs font-sans font-bold text-slate-200">
                      {activeEvent.title}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-indigo-400 font-bold bg-indigo-500/10 px-1.5 py-0.5 rounded">
                    @{activeEvent.author}
                  </span>
                </div>

                <div className="text-[11px] font-mono text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded-lg border border-slate-850">
                  {activeEvent.description}
                </div>

                {/* File affected details if a commit diff exists */}
                {activeEvent.details.commit?.fileDiffs && (
                  <div className="space-y-2">
                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">
                      Files Modified:
                    </span>
                    {activeEvent.details.commit.fileDiffs.map((diff) => {
                      const isExpanded = expandedDiff[diff.file] === true;
                      return (
                        <div key={diff.file} className="border border-slate-850 rounded bg-slate-950 overflow-hidden">
                          <div
                            onClick={() => setExpandedDiff(prev => ({ ...prev, [diff.file]: !isExpanded }))}
                            className="flex justify-between items-center bg-slate-900 px-2.5 py-1.5 cursor-pointer text-[10px] font-mono select-none"
                          >
                            <span className="text-slate-300 font-bold truncate max-w-[200px]">{diff.file}</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-emerald-400 font-bold">+{diff.additions}</span>
                              <span className="text-red-400 font-bold">-{diff.deletions}</span>
                              {isExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                            </div>
                          </div>

                          {isExpanded && (
                            <pre className="p-2.5 text-[8.5px] font-mono text-slate-400 overflow-x-auto bg-slate-950 max-h-[160px] whitespace-pre border-t border-slate-900 leading-normal">
                              {diff.patch}
                            </pre>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-600 text-xs font-mono">
                Click a timeline node above to inspect raw changes
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. VERIFIED RELATIONSHIP TOPOLOGY MAP */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4 mt-6">
        <div className="flex justify-between items-center border-b border-slate-850 pb-3">
          <div>
            <h3 className="text-xs font-sans font-bold text-slate-200 flex items-center gap-1.5">
              <Layers size={13} className="text-indigo-400" />
              <span>Verified Entity Graph Topology</span>
            </h3>
            <p className="text-[10px] text-slate-500 font-mono">
              Trace how actors, PRs, issues, commits, and services interconnect to build this incident.
            </p>
          </div>
          
          <div className="text-[9px] font-mono text-indigo-400 bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10">
            TIME TOPOLOGY MAP
          </div>
        </div>

        {/* Embedded Knowledge Graph View */}
        <div className="border border-slate-950 rounded-lg bg-slate-950/40 p-2 overflow-hidden">
          <KnowledgeGraphView
            nodes={nodes}
            edges={edges}
            selectedNodeId={selectedNodeId}
            onSelectNode={onSelectNode}
          />
        </div>
      </div>

      {/* 4. VERIFIED EVIDENCE RECORD MODAL DETAILS */}
      {activeEvidenceModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-fade-in text-left">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-widest block font-bold">
                  {activeEvidenceModal.type} EVIDENCE FILE
                </span>
                <h3 className="text-sm font-sans font-bold text-slate-200 mt-1">
                  {activeEvidenceModal.label}
                </h3>
              </div>
              <span className="text-xs font-mono bg-slate-950 px-2.5 py-1 rounded border border-slate-850 text-slate-400 select-all font-bold">
                {activeEvidenceModal.ref}
              </span>
            </div>

            <div className="bg-slate-950 p-4 rounded-lg border border-slate-850 font-mono text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed max-h-[220px] overflow-y-auto">
              {activeEvidenceModal.content}
            </div>

            <div className="flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/15 rounded-lg p-3 text-[10px] font-mono text-emerald-400">
              <CheckCircle size={14} className="shrink-0 text-emerald-400" />
              <div>
                <span className="font-bold uppercase">SHA-256 SECURE LOCK SIGNED</span>
                <p className="text-slate-400 text-[9px] mt-0.5">
                  Metadata verified via cryptographically signed hashes in current Time Machine instance.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setActiveEvidenceModal(null)}
                className="px-4 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 font-mono text-xs rounded-lg transition-colors cursor-pointer"
              >
                Close Audit Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
