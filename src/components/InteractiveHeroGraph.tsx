import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  GitCommit,
  GitPullRequest,
  AlertCircle,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Globe,
  ArrowRight,
  Sparkles
} from "lucide-react";

interface NodeData {
  id: string;
  label: string;
  type: "issue" | "commit" | "pr" | "review" | "deploy" | "doc";
  x: number;
  y: number;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  colorClass: string;
  glowColor: string;
  iconColor: string;
  title: string;
  description: string;
  relations: string[]; // Connected node IDs
}

export default function InteractiveHeroGraph() {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Core structured nodes that trace the "Story behind every code change"
  const nodes: NodeData[] = [
    {
      id: "issue-101",
      label: "Issue #101",
      type: "issue",
      x: 95,
      y: 110,
      icon: AlertCircle,
      colorClass: "border-amber-500/40 bg-amber-500/10 text-amber-400",
      glowColor: "rgba(245, 158, 11, 0.4)",
      iconColor: "text-amber-400",
      title: "Out-of-Memory Crash Alert",
      description: "Sandbox cluster container crash triggered by staging Redis volume eviction.",
      relations: ["commit-7b8"]
    },
    {
      id: "commit-7b8",
      label: "Commit 7b8e1a2",
      type: "commit",
      x: 210,
      y: 195,
      icon: GitCommit,
      colorClass: "border-purple-500/40 bg-purple-500/10 text-purple-400",
      glowColor: "rgba(168, 85, 247, 0.4)",
      iconColor: "text-purple-400",
      title: "Pruned Staging Redis Backup",
      description: "Deleted staging Redis container and metadata backups to save $120/mo sandbox budget.",
      relations: ["issue-101", "pr-405"]
    },
    {
      id: "review-alice",
      label: "Approved (alice_dev)",
      type: "review",
      x: 130,
      y: 330,
      icon: ShieldCheck,
      colorClass: "border-blue-500/40 bg-blue-500/10 text-blue-400",
      glowColor: "rgba(59, 130, 246, 0.4)",
      iconColor: "text-blue-400",
      title: "Security & Eviction Audit",
      description: "Code verified for memory safety limits and proper container eviction bounds.",
      relations: ["pr-405"]
    },
    {
      id: "pr-405",
      label: "PR #405 (LRU Cache)",
      type: "pr",
      x: 325,
      y: 115,
      icon: GitPullRequest,
      colorClass: "border-indigo-500/40 bg-indigo-500/10 text-indigo-400",
      glowColor: "rgba(99, 102, 241, 0.4)",
      iconColor: "text-indigo-400",
      title: "Restore LRU Cache Policy",
      description: "Merged dynamic bounding eviction on static cache to resolve global heap leaks.",
      relations: ["commit-7b8", "review-alice", "deploy-prod"]
    },
    {
      id: "deploy-prod",
      label: "Deploy Staging",
      type: "deploy",
      x: 410,
      y: 220,
      icon: Globe,
      colorClass: "border-cyan-500/40 bg-cyan-500/10 text-cyan-400",
      glowColor: "rgba(6, 182, 212, 0.4)",
      iconColor: "text-cyan-400",
      title: "Dynamic Ingress Rollout",
      description: "Staging deployment fully green. CI integration health: 100% stable.",
      relations: ["pr-405", "doc-runbook"]
    },
    {
      id: "doc-runbook",
      label: "Architecture Runbook",
      type: "doc",
      x: 360,
      y: 340,
      icon: FileText,
      colorClass: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
      glowColor: "rgba(16, 185, 129, 0.4)",
      iconColor: "text-emerald-400",
      title: "Heap Leak Mitigation Doc",
      description: "Generated offline trace & knowledge index on LRU cache memory guidelines.",
      relations: ["deploy-prod"]
    }
  ];

  // Helper to check if a relation line should be highlighted
  const isLineHighlighted = (sourceId: string, targetId: string) => {
    if (!hoveredNodeId) return false;
    return (
      (hoveredNodeId === sourceId && nodes.find(n => n.id === sourceId)?.relations.includes(targetId)) ||
      (hoveredNodeId === targetId && nodes.find(n => n.id === targetId)?.relations.includes(sourceId))
    );
  };

  // Helper to check if a node is currently active/highlighted
  const getNodeActiveState = (nodeId: string) => {
    if (!hoveredNodeId) return "normal";
    if (hoveredNodeId === nodeId) return "hovered";
    const activeNode = nodes.find(n => n.id === hoveredNodeId);
    if (activeNode && activeNode.relations.includes(nodeId)) {
      return "connected";
    }
    return "dimmed";
  };

  // Extract edges to render unique connection links
  const edges = [
    { source: "issue-101", target: "commit-7b8" },
    { source: "commit-7b8", target: "pr-405" },
    { source: "review-alice", target: "pr-405" },
    { source: "pr-405", target: "deploy-prod" },
    { source: "deploy-prod", target: "doc-runbook" }
  ];

  const activeNode = nodes.find(n => n.id === hoveredNodeId);

  return (
    <div className="relative w-full max-w-lg lg:max-w-xl mx-auto flex flex-col gap-4 select-none pointer-events-auto" id="interactive-hero-graph-widget">
      
      {/* 1. Header label with a glowing pulsing state */}
      <div className="flex items-center justify-between px-2 text-[10px] font-mono">
        <span className="text-slate-500 flex items-center gap-1.5 uppercase tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          Interactive Cognitive Sandbox
        </span>
        <span className="text-indigo-400/80 font-bold bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10">
          STORY_RECONSTRUCTION: ACTIVE
        </span>
      </div>

      {/* 2. Glassmorphic interactive viewport */}
      <div className="relative aspect-[5/4] sm:aspect-[4/3.2] w-full rounded-2xl border border-slate-800/60 bg-slate-900/15 backdrop-blur-xl hover:border-slate-700/60 transition-all duration-500 shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)] overflow-hidden group">
        
        {/* Ambient subtle background grid inside the viewport */}
        <div className="absolute inset-0 bg-grid-white/[0.015] pointer-events-none" />

        {/* Dynamic connection lines SVG */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <defs>
            <filter id="glow-line" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <linearGradient id="active-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="50%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>

          {edges.map((edge, idx) => {
            const src = nodes.find(n => n.id === edge.source);
            const tgt = nodes.find(n => n.id === edge.target);
            if (!src || !tgt) return null;

            const isHighlighted = isLineHighlighted(edge.source, edge.target);

            return (
              <g key={`edge-${idx}`}>
                {/* Background base link line */}
                <line
                  x1={`${src.x}%`}
                  y1={`${src.y}%`}
                  x2={`${tgt.x}%`}
                  y2={`${tgt.y}%`}
                  stroke={isHighlighted ? "url(#active-grad)" : "rgba(148, 163, 184, 0.08)"}
                  strokeWidth={isHighlighted ? "2.5" : "1.5"}
                  className="transition-all duration-300"
                />

                {/* Pulsing signal packet flowing across the connection */}
                <motion.line
                  x1={`${src.x}%`}
                  y1={`${src.y}%`}
                  x2={`${tgt.x}%`}
                  y2={`${tgt.y}%`}
                  stroke={isHighlighted ? "#22d3ee" : "rgba(129, 140, 248, 0.2)"}
                  strokeWidth={isHighlighted ? "1.5" : "0.75"}
                  strokeDasharray="10 120"
                  initial={{ strokeDashoffset: 130 }}
                  animate={{ strokeDashoffset: -130 }}
                  transition={{
                    repeat: Infinity,
                    duration: isHighlighted ? 2.5 : 6.0,
                    ease: "linear"
                  }}
                  filter={isHighlighted ? "url(#glow-line)" : undefined}
                />
              </g>
            );
          })}
        </svg>

        {/* Render Interactive Nodes */}
        {nodes.map((node) => {
          const NodeIcon = node.icon;
          const state = getNodeActiveState(node.id);

          // Calculate style based on connection/hover state
          let opacityValue = 1;
          let scaleValue = 1.0;
          let zIndexValue = 10;

          if (state === "hovered") {
            scaleValue = 1.15;
            zIndexValue = 30;
          } else if (state === "connected") {
            scaleValue = 1.05;
            zIndexValue = 20;
          } else if (state === "dimmed") {
            opacityValue = 0.35;
            scaleValue = 0.9;
          }

          return (
            <motion.div
              key={node.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer flex flex-col items-center group/node"
              style={{ left: `${node.x}%`, top: `${node.y}%`, zIndex: zIndexValue }}
              animate={{
                scale: scaleValue,
                opacity: opacityValue,
                // Gentle infinite floating animation distinct for each node
                y: [0, node.y % 2 === 0 ? -6 : 6, 0]
              }}
              transition={{
                scale: { type: "spring", stiffness: 300, damping: 20 },
                y: {
                  repeat: Infinity,
                  duration: 5 + (node.x % 3) * 1.5,
                  ease: "easeInOut"
                }
              }}
              onMouseEnter={() => setHoveredNodeId(node.id)}
              onMouseLeave={() => setHoveredNodeId(null)}
            >
              {/* Glowing ring/pulse when hovered or connected */}
              <AnimatePresence>
                {(state === "hovered" || state === "connected") && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 0.45, scale: 1.3 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute inset-0 rounded-full blur-md"
                    style={{ backgroundColor: node.glowColor }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </AnimatePresence>

              {/* Node Circle */}
              <div
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full border flex items-center justify-center transition-all duration-300 shadow-xl ${node.colorClass} ${
                  state === "hovered" ? "ring-2 ring-indigo-500/20" : ""
                }`}
              >
                <NodeIcon className={`w-5 h-5 ${node.iconColor} transition-transform duration-300`} />
              </div>

              {/* Label */}
              <span className="mt-2 text-[9px] sm:text-[10px] font-mono font-bold text-slate-300 tracking-tight bg-slate-950/80 px-2 py-0.5 rounded-md border border-slate-900/60 shadow-lg">
                {node.label}
              </span>
            </motion.div>
          );
        })}

        {/* Hovering explanation panel inside the graph container */}
        <div className="absolute bottom-3 inset-x-3 bg-slate-950/90 border border-slate-800/80 rounded-xl p-3 backdrop-blur-md flex items-start gap-2.5 shadow-2xl transition-all duration-300 z-40 min-h-[75px]">
          <AnimatePresence mode="wait">
            {activeNode ? (
              <motion.div
                key={activeNode.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full flex items-start gap-2.5"
              >
                <div className={`p-1.5 rounded-lg border w-fit ${activeNode.colorClass.split(" ")[0]} ${activeNode.colorClass.split(" ")[1]}`}>
                  <activeNode.icon size={13} className={activeNode.iconColor} />
                </div>
                <div className="space-y-1 flex-1 text-left">
                  <div className="flex items-center gap-1.5 justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-100">{activeNode.title}</span>
                    <span className="text-[8px] font-mono font-extrabold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-1.5 py-0.5 rounded">
                      {activeNode.type}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed font-sans">{activeNode.description}</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="default-instruct"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex items-start gap-2.5"
              >
                <div className="p-1.5 rounded-lg border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 w-fit">
                  <Sparkles size={13} className="animate-pulse" />
                </div>
                <div className="space-y-1 flex-1 text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold text-slate-300">Hover Nodes to Reconstruct History</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
                    Trace how commits, issues, pull requests, reviews, and container logs automatically link into a unified semantic map.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* 3. Small visual aid that links connections */}
      <div className="flex justify-center items-center gap-2 text-[9px] font-mono text-slate-500">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500/40" /> Issue
        </span>
        <span className="text-slate-800">•</span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500/40" /> Commit
        </span>
        <span className="text-slate-800">•</span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/40" /> PR
        </span>
        <span className="text-slate-800">•</span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/40" /> Deploy
        </span>
      </div>

    </div>
  );
}
