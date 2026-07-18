import React, { useState, useMemo } from "react";
import {
  GitCommit,
  GitPullRequest,
  AlertCircle,
  MessageSquare,
  Terminal,
  ChevronRight,
  ChevronDown,
  Clock,
  User,
  GitMerge,
  Tag,
  CheckCircle2,
  XCircle,
  FileEdit,
  PlusCircle,
  Activity,
  Layers,
  Filter,
  ArrowUpRight,
  ExternalLink
} from "lucide-react";
import { WorkflowEvent } from "../types";

interface InteractiveTimelineProps {
  events: WorkflowEvent[];
  selectedEventId: string | null;
  onSelectEvent: (eventId: string) => void;
  isIndexing?: boolean;
  errorMessage?: string | null;
}

export default function InteractiveTimeline({
  events,
  selectedEventId,
  onSelectEvent,
  isIndexing = false,
  errorMessage = null,
}: InteractiveTimelineProps) {
  const [expandedDiff, setExpandedDiff] = useState<Record<string, boolean>>({});
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);
  
  // Multi-stage filter toolbar state: all, code, alerts, discussions, deployments
  const [activeCategory, setActiveCategory] = useState<"all" | "code" | "alerts" | "discussions" | "deployments">("all");

  // Requirement 8: Add debug logging for frontend rendering
  console.log("[InteractiveTimeline Rendering] rendering with properties:", {
    totalEvents: events.length,
    filteredEventsCount: events.filter((evt) => {
      if (activeCategory === "all") return true;
      const typeLower = evt.type.toLowerCase();
      const refLower = (evt.refId || "").toLowerCase();
      if (activeCategory === "code") {
        return typeLower === "commit" || typeLower === "merge" || typeLower === "release" || refLower.includes("commit");
      }
      if (activeCategory === "alerts") {
        return typeLower === "ci_failed" || (evt.severity as string) === "error" || evt.title.toLowerCase().includes("fail");
      }
      if (activeCategory === "discussions") {
        return typeLower === "issue" || typeLower === "issue_created" || typeLower === "issue_updated" || typeLower === "review_requested_changes" || typeLower === "review_approved" || typeLower === "pr_opened" || refLower.includes("issue") || refLower.includes("pr");
      }
      if (activeCategory === "deployments") {
        return typeLower === "release" || evt.title.toLowerCase().includes("deploy") || evt.description.toLowerCase().includes("lambda");
      }
      return true;
    }).length,
    selectedEventId,
    isIndexing,
    errorMessage,
    activeCategory
  });

  const toggleDiff = (filePath: string) => {
    setExpandedDiff((prev) => ({ ...prev, [filePath]: !prev[filePath] }));
  };

  const getEventIcon = (type: string, severity: string) => {
    switch (type) {
      case "issue_created":
        return <PlusCircle size={13} className="text-amber-500 animate-pulse" />;
      case "issue_updated":
        return <FileEdit size={13} className="text-amber-400" />;
      case "pr_opened":
        return <GitPullRequest size={13} className="text-indigo-400" />;
      case "commit":
        return <GitCommit size={13} className="text-purple-400" />;
      case "review_requested_changes":
        return <XCircle size={13} className="text-rose-500 animate-pulse" />;
      case "review_approved":
        return <CheckCircle2 size={13} className="text-emerald-500" />;
      case "ci_failed":
        return <AlertCircle size={13} className="text-red-500 animate-pulse" />;
      case "ci_passed":
        return <CheckCircle2 size={13} className="text-teal-400" />;
      case "merge":
        return <GitMerge size={13} className="text-violet-500" />;
      case "release":
        return <Tag size={13} className="text-blue-400 animate-pulse" />;
      case "pr":
        return <GitPullRequest size={13} className="text-indigo-400" />;
      case "issue":
        return <MessageSquare size={13} className="text-amber-400" />;
      case "ci_log":
        return severity === "error" ? (
          <AlertCircle size={13} className="text-red-400 animate-pulse" />
        ) : (
          <Terminal size={13} className="text-slate-400" />
        );
      default:
        return <Clock size={13} className="text-slate-500" />;
    }
  };

  // Filter events based on activeCategory
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      if (activeCategory === "all") return true;
      
      const typeLower = evt.type.toLowerCase();
      const titleLower = evt.title.toLowerCase();
      const descLower = evt.description.toLowerCase();
      const refLower = (evt.refId || "").toLowerCase();

      if (activeCategory === "code") {
        return typeLower === "commit" || typeLower === "merge" || typeLower === "release" || refLower.includes("commit");
      }
      
      if (activeCategory === "alerts") {
        return typeLower === "ci_failed" || (evt.severity as string) === "error" || titleLower.includes("fail") || descLower.includes("crash") || descLower.includes("oom") || (typeLower === "ci_log" && (evt.severity as string) === "error");
      }

      if (activeCategory === "discussions") {
        return typeLower === "issue" || typeLower === "issue_created" || typeLower === "issue_updated" || typeLower === "review_requested_changes" || typeLower === "review_approved" || typeLower === "pr_opened" || refLower.includes("issue") || refLower.includes("pr");
      }

      if (activeCategory === "deployments") {
        return typeLower === "release" || titleLower.includes("deploy") || titleLower.includes("staging") || descLower.includes("cloud") || descLower.includes("lambda");
      }

      return true;
    });
  }, [events, activeCategory]);

  const activeEvent = filteredEvents.find((e) => e.id === selectedEventId) || filteredEvents[0] || events.find((e) => e.id === selectedEventId) || events[0] || null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5" id="timeline-reconstruction-interface">
      
      {/* 1. TOP SELECTION FILTER BAR */}
      <div className="lg:col-span-12 bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-indigo-400" />
          <span className="font-mono font-semibold tracking-tight text-slate-300">Timeline Scope Filters</span>
        </div>

        <div className="flex flex-wrap gap-1 bg-slate-950 p-1 rounded-lg border border-slate-850">
          {[
            { id: "all", label: "All Milestones", count: events.length },
            { id: "code", label: "Code Edits", count: events.filter(e => (e.type as string) === "commit" || (e.type as string) === "merge" || (e.type as string) === "release" || e.refId.toLowerCase().includes("commit")).length },
            { id: "alerts", label: "Alerts & Outages", count: events.filter(e => (e.type as string) === "ci_failed" || (e.severity as string) === "error" || e.title.toLowerCase().includes("fail")).length },
            { id: "discussions", label: "Discussions & Reviews", count: events.filter(e => (e.type as string) === "issue" || (e.type as string) === "pr" || (e.type as string) === "review_requested_changes" || (e.type as string) === "review_approved").length },
            { id: "deployments", label: "Deployments", count: events.filter(e => (e.type as string) === "release" || e.title.toLowerCase().includes("deploy") || e.description.toLowerCase().includes("lambda")).length }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-3 py-1.5 rounded-md font-mono text-[10px] font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                activeCategory === cat.id
                  ? "bg-indigo-600 text-white font-semibold shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <span>{cat.label}</span>
              <span className={`text-[8.5px] px-1 py-0.1 rounded ${activeCategory === cat.id ? "bg-indigo-700 text-indigo-100" : "bg-slate-900 text-slate-500"}`}>
                {cat.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. LEFT COLUMN: Milestones list */}
      <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col h-[540px]">
        <span className="text-[10px] font-mono font-bold text-slate-500 block mb-3 uppercase tracking-wider border-b border-slate-800 pb-2 flex justify-between items-center">
          <span>Chronological Log</span>
          {isIndexing ? (
            <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.2 rounded border border-indigo-500/10 animate-pulse">
              Indexing repository...
            </span>
          ) : (
            <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.2 rounded border border-indigo-500/10">
              {filteredEvents.length} items shown
            </span>
          )}
        </span>

        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
          {isIndexing ? (
            <div className="flex flex-col items-center justify-center h-full text-indigo-400 text-center text-xs font-mono py-12 p-4">
              <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin mb-3 mx-auto" />
              <span className="font-semibold text-slate-200">Indexing repository...</span>
              <p className="text-[10px] text-slate-500 mt-2 max-w-[220px] leading-relaxed mx-auto">
                Parsing commit trees, classifying work logs, and building vector indexes. This will take just a few seconds.
              </p>
            </div>
          ) : errorMessage ? (
            <div className="flex flex-col items-center justify-center h-full text-rose-400 text-center text-xs font-mono py-12 p-4">
              <AlertCircle size={24} className="mb-2 text-rose-500 mx-auto" />
              <span className="font-semibold text-rose-300">Sync Failure</span>
              <p className="text-[10px] text-slate-500 mt-2 max-w-[220px] leading-relaxed mx-auto break-words">
                {errorMessage}
              </p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-600 text-center text-xs font-mono py-12">
              <AlertCircle size={18} className="mb-2 text-slate-700 mx-auto" />
              <span>No events match this scope filter</span>
              <button
                onClick={() => setActiveCategory("all")}
                className="mt-3 text-indigo-400 hover:underline text-[10px]"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            filteredEvents.map((evt, idx) => {
              const isSelected = selectedEventId === evt.id;
              const isHovered = hoveredEventId === evt.id;
              const eventDate = new Date(evt.timestamp).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "UTC",
              });

              return (
                <div
                  key={evt.id}
                  onClick={() => onSelectEvent(evt.id)}
                  onMouseEnter={() => setHoveredEventId(evt.id)}
                  onMouseLeave={() => setHoveredEventId(null)}
                  className={`relative flex gap-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "bg-indigo-600/10 border-indigo-500/60 text-indigo-100 shadow-[0_4px_12px_rgba(99,102,241,0.05)]"
                      : "bg-slate-950/40 border-slate-850 text-slate-400 hover:border-slate-800 hover:text-slate-300 hover:bg-slate-900/40"
                  } ${isHovered ? "scale-[1.01] shadow-[0_4px_12px_rgba(99,102,241,0.03)]" : ""}`}
                >
                  {/* Vertical trace connector line */}
                  {idx < filteredEvents.length - 1 && (
                    <div className="absolute left-[22px] top-[40px] w-[1px] h-[calc(100%-6px)] bg-slate-850 pointer-events-none" />
                  )}

                  {/* Event Marker */}
                  <div
                    className={`w-[20px] h-[20px] rounded-full flex items-center justify-center shrink-0 border transition-all duration-300 ${
                      isSelected
                        ? "bg-indigo-500/20 border-indigo-400 text-indigo-400 ring-4 ring-indigo-500/10"
                        : "bg-slate-900 border-slate-800"
                    }`}
                  >
                    {getEventIcon(evt.type, evt.severity)}
                  </div>

                  {/* Event summary details */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[10px] font-mono font-medium text-slate-500">
                        {eventDate} UTC
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 select-all font-normal uppercase">
                        {evt.refId}
                      </span>
                    </div>

                    <h4 className="text-[13px] font-sans font-normal leading-snug text-slate-200">
                      {evt.title}
                    </h4>

                    <p className="text-[11px] font-mono leading-relaxed text-slate-500 line-clamp-2">
                      {evt.description}
                    </p>

                    {/* Entities tags */}
                    <div className="flex flex-wrap gap-1 pt-1.5">
                      <span className="text-[10.5px] font-sans font-semibold bg-slate-950 px-1.5 py-0.5 border border-slate-900 text-slate-400 rounded">
                        @{evt.author}
                      </span>
                      {evt.entities.slice(0, 2).map((ent) => (
                        <span
                          key={ent}
                          className="text-[10px] font-mono bg-indigo-500/5 px-1.5 py-0.5 border border-indigo-500/10 text-indigo-400 rounded"
                        >
                          {ent}
                        </span>
                      ))}
                    </div>

                    {/* Expand-on-hover quick preview snippet */}
                    {isHovered && !isSelected && (
                      <div className="pt-2 text-[9.5px] text-indigo-400/80 font-mono flex items-center gap-1.5 animate-fade-in">
                        <span>Click to audit changesets</span>
                        <ChevronRight size={10} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 3. RIGHT COLUMN: Interactive details panel */}
      <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col h-[540px]">
        {activeEvent ? (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header metadata */}
            <div className="flex justify-between items-start border-b border-slate-800 pb-3 mb-3 shrink-0">
              <div className="text-left">
                <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-wider block font-bold">
                  Event Forensic Artifact Inspector
                </span>
                <h3 className="text-sm font-sans font-bold text-slate-100 mt-1">
                  {activeEvent.title}
                </h3>
              </div>
              
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-850 px-3 py-1.5 rounded-lg text-[10px] font-mono text-slate-400">
                <User size={12} className="text-slate-500" />
                <span>Author: <strong className="text-slate-200">@{activeEvent.author}</strong></span>
              </div>
            </div>

            {/* In-depth content area */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin text-xs text-left">
              {/* Event Impact summary */}
              <div className="bg-slate-950/60 border border-slate-850 rounded-lg p-4 space-y-2 leading-relaxed">
                <div className="flex items-center justify-between text-[10px] font-mono border-b border-slate-900 pb-1.5 text-slate-500 font-bold">
                  <span>METADATA DIGEST SUMMARY</span>
                  <span>{activeEvent.refId}</span>
                </div>
                <p className="font-mono text-slate-300 leading-relaxed text-[11px]">
                  {activeEvent.description}
                </p>
                <div className="pt-1.5 flex items-center gap-1.5 text-[9.5px] text-slate-500 font-mono">
                  <Clock size={11} className="text-slate-600" />
                  <span>Logged at {new Date(activeEvent.timestamp).toUTCString()}</span>
                </div>
              </div>

              {/* 1. Commit Diff block */}
              {activeEvent.details.commit && (
                <div className="space-y-3">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block tracking-wider">
                    RECONSTRUCTED DIFF CHANGELISTS
                  </span>

                  {activeEvent.details.commit.fileDiffs.map((diff) => {
                    const isExpanded = expandedDiff[diff.file] !== false; // Default true

                    return (
                      <div key={diff.file} className="border border-slate-850 rounded-lg overflow-hidden bg-slate-950 shadow-sm">
                        {/* File Header */}
                        <div
                          onClick={() => toggleDiff(diff.file)}
                          className="flex justify-between items-center bg-slate-900 px-3 py-2 border-b border-slate-850 cursor-pointer select-none text-[11px] font-mono hover:bg-slate-900/80 transition-colors"
                        >
                          <span className="text-slate-200 font-bold truncate max-w-[280px]">{diff.file}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-400 text-[10px] font-bold">+{diff.additions}</span>
                            <span className="text-red-400 text-[10px] font-bold mr-2">-{diff.deletions}</span>
                            {isExpanded ? <ChevronDown size={12} className="text-slate-500" /> : <ChevronRight size={12} className="text-slate-500" />}
                          </div>
                        </div>

                        {/* Diff lines patch */}
                        {isExpanded && (
                          <div className="p-3 font-mono text-[10px] leading-relaxed overflow-x-auto select-text max-h-[220px] bg-slate-950">
                            {diff.patch.split("\n").map((line, lidx) => {
                              const isAddition = line.startsWith("+");
                              const isDeletion = line.startsWith("-");
                              const isMeta = line.startsWith("@@");

                              return (
                                <div
                                  key={lidx}
                                  className={`px-2 py-0.5 whitespace-pre ${
                                    isAddition
                                      ? "bg-emerald-500/5 text-emerald-400 border-l-2 border-emerald-500"
                                      : isDeletion
                                      ? "bg-red-500/5 text-red-400 border-l-2 border-red-500"
                                      : isMeta
                                      ? "text-indigo-400 bg-indigo-500/5 font-bold"
                                      : "text-slate-400"
                                  }`}
                                >
                                  {line}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 2. PR Review comment block */}
              {activeEvent.details.pr && (
                <div className="space-y-3">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block tracking-wider">
                    PULL REQUEST HISTORIC CODE REVIEWS
                  </span>

                  <div className="space-y-3">
                    <div className="bg-slate-950 border border-slate-850 rounded-lg p-3.5 space-y-1.5 shadow-sm">
                      <span className="text-[9px] font-mono font-bold text-slate-500 block uppercase">PR Description Body</span>
                      <p className="text-slate-300 text-[11px] leading-relaxed italic">
                        "{activeEvent.details.pr.body}"
                      </p>
                    </div>

                    {activeEvent.details.pr.reviews.length > 0 && (
                      <div className="space-y-2 border-t border-slate-800 pt-3">
                        <span className="text-[10px] font-mono font-bold text-slate-500 block">
                          Threaded Discussions ({activeEvent.details.pr.reviews.length})
                        </span>

                        {activeEvent.details.pr.reviews.map((rev) => (
                          <div key={rev.id} className="bg-slate-950 border border-slate-850 rounded-lg p-3 space-y-2">
                            <div className="flex justify-between items-center text-[10px] font-mono border-b border-slate-900 pb-1.5">
                              <span className="text-indigo-400 font-bold">@{rev.author}</span>
                              <span className="text-slate-600">{rev.path} (line {rev.line})</span>
                            </div>
                            <p className="text-[11px] font-mono text-slate-300 leading-relaxed select-text">
                              {rev.body}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 3. Issue commentary */}
              {activeEvent.details.issue && (
                <div className="space-y-3">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block tracking-wider">
                    ISSUE DISCUSSION & ESCALATION LOG
                  </span>

                  <div className="bg-slate-950 border border-slate-850 rounded-lg p-3.5 space-y-3 shadow-sm">
                    <div className="text-[11px] font-mono text-slate-300 select-text leading-relaxed bg-slate-900/50 p-3 rounded border border-slate-850">
                      {activeEvent.details.issue.body}
                    </div>

                    {activeEvent.details.issue.comments.length > 0 && (
                      <div className="space-y-2.5 pt-2 border-t border-slate-900">
                        <span className="text-[10px] font-mono text-slate-500 block">Discussion Comments ({activeEvent.details.issue.comments.length})</span>
                        {activeEvent.details.issue.comments.map((comment) => (
                          <div key={comment.id} className="bg-slate-950 border border-slate-900/80 p-3 rounded space-y-1">
                            <div className="flex justify-between text-[9px] font-mono text-slate-500">
                              <span className="text-amber-400 font-semibold">@{comment.author}</span>
                              <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-[11px] font-mono text-slate-300 select-text leading-relaxed">
                              {comment.body}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 4. CI Run console logs */}
              {activeEvent.details.ci && (
                <div className="space-y-3">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block tracking-wider">
                    CI PIPELINE WORKFLOW & MONITORING
                  </span>

                  <div className="bg-slate-950 border border-slate-850 rounded-lg overflow-hidden shadow-sm">
                    {/* Log status header */}
                    <div className="bg-slate-900 px-3 py-2 border-b border-slate-850 flex justify-between items-center text-[10px] font-mono">
                      <span className="text-slate-400 font-bold uppercase">BUILD TIMELINE LIMITS</span>
                      <span className={`px-2 py-0.5 rounded uppercase font-bold text-[9px] border ${
                        activeEvent.details.ci.status === "failed" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      }`}>
                        {activeEvent.details.ci.status.toUpperCase()}
                      </span>
                    </div>

                    {/* Console log content */}
                    <pre className="p-3 bg-slate-950 font-mono text-[9.5px] text-slate-400 leading-relaxed overflow-x-auto select-text max-h-[220px] whitespace-pre-wrap border-b border-slate-900">
                      {activeEvent.details.ci.logs.join("\n")}
                    </pre>

                    {/* Failure watchdog analysis */}
                    {activeEvent.details.ci.failureSummary && (
                      <div className="bg-red-500/5 border-t border-red-500/10 p-3.5 space-y-1 flex items-start gap-2 text-left">
                        <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-wide">
                            WATCHDOG OOM FAULT DIAGNOSIS
                          </span>
                          <p className="text-[10.5px] font-mono text-slate-300 leading-relaxed mt-1">
                            {activeEvent.details.ci.failureSummary}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-1 text-center font-mono text-xs py-12">
            <Clock size={22} className="mb-2 text-slate-700" />
            <span>Select a chronological milestone event to audit code details</span>
          </div>
        )}
      </div>
    </div>
  );
}
