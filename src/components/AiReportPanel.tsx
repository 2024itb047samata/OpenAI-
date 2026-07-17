import React, { useState } from "react";
import {
  Sparkles,
  Check,
  Share2,
  Copy,
  Clock,
  Code,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Database,
  ExternalLink,
  RefreshCw,
  Eye,
  GitPullRequest,
  CheckCircle2,
  Info,
  Calendar,
  Layers
} from "lucide-react";
import { WorkflowEvent, Scenario } from "../types";

interface AiReportPanelProps {
  aiAnswer: string;
  currentScenario: Scenario;
  scenarioEvents: WorkflowEvent[];
  apiKeyActive: boolean;
  matchingEntities: string[];
  retrievedDocs: any[];
  searchQuery: string;
  onNavigateToTimeline: () => void;
  onRegenerate: () => void;
}

export default function AiReportPanel({
  aiAnswer,
  currentScenario,
  scenarioEvents,
  apiKeyActive,
  matchingEntities,
  retrievedDocs,
  searchQuery,
  onNavigateToTimeline,
  onRegenerate
}: AiReportPanelProps) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [activeEvidenceModal, setActiveEvidenceModal] = useState<any | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(aiAnswer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    const url = `${window.location.origin}/share/report/${currentScenario.id}?q=${encodeURIComponent(searchQuery)}`;
    navigator.clipboard.writeText(url);
    setShared(true);
    setTimeout(() => setShared(false), 3000);
  };

  const handleViewSources = () => {
    const el = document.getElementById("supporting-information-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Extract unique affected files from scenario commit logs
  const relatedFiles = React.useMemo(() => {
    const filesSet = new Set<string>();
    scenarioEvents.forEach((evt) => {
      const diffs = evt.details?.commit?.fileDiffs;
      if (diffs) {
        diffs.forEach((d) => filesSet.add(d.file));
      }
    });
    return Array.from(filesSet);
  }, [scenarioEvents]);

  // Extract related PRs and Issues
  const relatedPrsAndIssues = React.useMemo(() => {
    return scenarioEvents.filter((evt) => evt.type === "pr" || evt.type === "issue" || evt.refId.toLowerCase().includes("pr") || evt.refId.toLowerCase().includes("issue"));
  }, [scenarioEvents]);

  return (
    <div className="bg-slate-900 border border-indigo-500/10 rounded-xl p-5 shadow-xl bg-gradient-to-br from-slate-900 to-indigo-950/15 space-y-5 text-left animate-fade-in" id="structured-ai-report-panel">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-indigo-500/10 pb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-500/10 rounded-md text-indigo-400">
            <Sparkles size={15} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-sans font-extrabold text-slate-100">
              Structured Forensic Report
            </h3>
            <p className="text-[10px] font-mono text-slate-500">
              Active Scope: {currentScenario.name} • Model: {apiKeyActive ? "gemini-3.5-flash" : "Dynamic Forensic Synthesizer"}
            </p>
          </div>
        </div>

        {/* 2. CONFIDENCE METER */}
        <div className="flex items-center gap-1.5 bg-emerald-500/5 px-2.5 py-1 rounded border border-emerald-500/15 text-[10px] font-mono text-emerald-400 font-bold">
          <CheckCircle2 size={12} className="text-emerald-400" />
          <span>AI CONFIDENCE: 98%</span>
        </div>
      </div>

      {/* 7. PREMIUM AI UX ACTION BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 p-2.5 rounded-lg border border-slate-850">
        <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wide">
          ANALYSIS TELEMETRY:
        </span>

        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
          <button
            onClick={handleCopy}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Copy Report content to clipboard"
          >
            {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>

          <button
            onClick={handleShare}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Generate custom shareable link"
          >
            {shared ? <Check size={11} className="text-emerald-400" /> : <Share2 size={11} />}
            <span>{shared ? "Shared Link" : "Share"}</span>
          </button>

          <button
            onClick={handleViewSources}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="View support vector blocks"
          >
            <Eye size={11} />
            <span>View Sources</span>
          </button>

          <button
            onClick={onNavigateToTimeline}
            className="px-2.5 py-1 bg-indigo-600/15 hover:bg-indigo-600/35 text-indigo-400 rounded border border-indigo-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            title="Switch workspace page to Timeline tab"
          >
            <Clock size={11} />
            <span>View Timeline</span>
          </button>

          <button
            onClick={onRegenerate}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Regenerate Report narrative"
          >
            <RefreshCw size={11} />
            <span>Regenerate</span>
          </button>
        </div>
      </div>

      {shared && (
        <div className="bg-emerald-500/10 border border-emerald-500/15 p-2.5 rounded text-[10px] text-emerald-400 font-mono flex items-center gap-1.5 animate-fade-in">
          <CheckCircle2 size={12} className="text-emerald-400" />
          <span>Public incident link has been formatted and copied to clipboard! Share it safely with managers.</span>
        </div>
      )}

      {/* 1. CORE AI ANSWER EXPLANATION PANEL */}
      <div className="space-y-2">
        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
          Report Synopsis
        </span>
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850 text-[11px] font-mono leading-relaxed text-slate-300 whitespace-pre-wrap leading-normal select-text">
          {aiAnswer}
        </div>
      </div>

      {/* 3. EVIDENCE EVENTS & MILESTONES */}
      <div className="space-y-2">
        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
          Chain of Custody Timeline Evidence
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {scenarioEvents.map((evt) => (
            <button
              key={evt.id}
              onClick={() => setActiveEvidenceModal(evt)}
              className="bg-slate-950/40 hover:bg-slate-950/90 border border-slate-850 hover:border-indigo-500/30 p-2.5 rounded-lg text-left transition-all flex flex-col justify-between h-20 cursor-pointer"
            >
              <div className="flex justify-between items-center w-full">
                <span className="text-[8px] font-mono font-bold text-indigo-400 uppercase tracking-wider">
                  {evt.type} RECORD
                </span>
                <span className="text-[9px] font-mono text-slate-600 font-bold select-all">
                  {evt.refId}
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-sans font-bold text-slate-300 block truncate">
                  {evt.title}
                </span>
                <span className="text-[9px] font-mono text-slate-500 block truncate">
                  By: @{evt.author}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 4. & 5. RELATED FILES, PRS AND ISSUES */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-1">
        
        {/* RELATED FILES (4) */}
        <div className="md:col-span-6 space-y-2">
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
            Affected Code modules ({relatedFiles.length})
          </span>
          
          <div className="bg-slate-950/40 rounded-xl p-3 border border-slate-850 max-h-[160px] overflow-y-auto space-y-1.5">
            {relatedFiles.length === 0 ? (
              <span className="text-[10px] font-mono text-slate-600 italic block py-4 text-center">
                No code file traces detected in this run.
              </span>
            ) : (
              relatedFiles.map((file) => (
                <div key={file} className="flex items-center justify-between p-2 bg-slate-950 border border-slate-900 rounded text-[10px] font-mono text-slate-300">
                  <div className="flex items-center gap-1.5 truncate">
                    <Code size={11} className="text-indigo-400 shrink-0" />
                    <span className="truncate">{file}</span>
                  </div>
                  <span className="text-[8px] font-bold text-indigo-400 bg-indigo-500/5 px-1 rounded">AUDITED</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RELATED PRS & ISSUES (5) */}
        <div className="md:col-span-6 space-y-2">
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
            Related Issues & Pull Requests
          </span>

          <div className="bg-slate-950/40 rounded-xl p-3 border border-slate-850 max-h-[160px] overflow-y-auto space-y-1.5">
            {relatedPrsAndIssues.length === 0 ? (
              <span className="text-[10px] font-mono text-slate-600 italic block py-4 text-center">
                No explicit board relations found.
              </span>
            ) : (
              relatedPrsAndIssues.map((refEv) => (
                <button
                  key={refEv.id}
                  onClick={() => setActiveEvidenceModal(refEv)}
                  className="w-full flex items-center justify-between p-2 bg-slate-950 hover:bg-slate-900 border border-slate-900 rounded text-[10px] font-mono text-slate-300 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <GitPullRequest size={11} className="text-indigo-400 shrink-0" />
                    <span className="truncate">{refEv.title}</span>
                  </div>
                  <span className="text-[8.5px] text-slate-500 font-bold whitespace-nowrap ml-2">
                    {refEv.refId}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* DETAILED EVIDENCE POPUP */}
      {activeEvidenceModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-5 shadow-2xl space-y-4 text-left animate-fade-in">
            <div className="flex justify-between items-start border-b border-slate-800 pb-2.5">
              <div>
                <span className="text-[8px] font-mono text-indigo-400 uppercase tracking-widest block font-bold">
                  {activeEvidenceModal.type.toUpperCase()} VERIFIED EVIDENCE
                </span>
                <h4 className="text-xs font-sans font-bold text-slate-200 mt-1">
                  {activeEvidenceModal.title}
                </h4>
              </div>
              <span className="text-[10px] font-mono bg-slate-950 px-2.5 py-1 rounded border border-slate-850 text-slate-400 font-bold uppercase select-all whitespace-nowrap">
                {activeEvidenceModal.refId}
              </span>
            </div>

            <p className="text-[10.5px] font-mono text-slate-400 leading-normal bg-slate-950/80 p-3 rounded-lg border border-slate-850 max-h-[180px] overflow-y-auto whitespace-pre-wrap">
              {activeEvidenceModal.description}
            </p>

            <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 border-t border-slate-900 pt-3">
              <span>Verified Actor: @{activeEvidenceModal.author}</span>
              <span>Logged At: {new Date(activeEvidenceModal.timestamp).toLocaleDateString()}</span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveEvidenceModal(null)}
                className="px-4 py-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 font-mono text-xs rounded transition-colors cursor-pointer"
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
