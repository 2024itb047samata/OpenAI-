import React, { useState } from "react";
import { ShieldCheck, Database, FileText, CheckCircle2, Download, Search, Info, Trash2, Calendar } from "lucide-react";
import KnowledgeGraphView from "./KnowledgeGraphView";
import { KnowledgeGraphNode, KnowledgeGraphEdge } from "../types";

interface EvidencePageProps {
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
}

export default function EvidencePage({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode
}: EvidencePageProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Forensic evidence ledger data
  const forensicEvidences = [
    {
      id: "ev-01",
      title: "HMAC Authorization Bypass Check Bypass",
      sha: "db01a2f3a47291a1005",
      type: "Auth Backdoor",
      severity: "CRITICAL",
      investigator: "alice_dev",
      date: "2026-07-04",
      status: "SEALED & SIGNED",
      fileAffected: "src/middleware/auth.ts"
    },
    {
      id: "ev-02",
      title: "Unevictable global cache memory dictionary leaks",
      sha: "7b8e1a2fba81c19b02a",
      type: "Resource Leak",
      severity: "HIGH",
      investigator: "charlie_arch",
      date: "2026-06-28",
      status: "SEALED & SIGNED",
      fileAffected: "src/services/cache.js"
    },
    {
      id: "ev-03",
      title: "Stale S3 backup prune helper deletion error",
      sha: "1f4e5a9bc82e140d315",
      type: "Orphaned Routine Delete",
      severity: "MEDIUM",
      investigator: "bob_ops",
      date: "2026-07-10",
      status: "SEALED & SIGNED",
      fileAffected: "src/services/storage_sync_cleanup_service.js"
    }
  ];

  const filteredEvidence = forensicEvidences.filter(
    (ev) =>
      ev.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.sha.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in text-left" id="saas-evidence-page">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider block">
            📄 Why It Changed
          </span>
          <h2 className="text-lg font-display font-bold text-slate-100 mt-0.5">
            Understand Reasons Behind Changes
          </h2>
          <p className="text-[11px] text-slate-400">
            See the reasons behind changes, related discussions, pull requests, commits, and supporting information.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 border border-slate-800 rounded-lg text-[10px] font-mono text-emerald-400 font-semibold">
          <ShieldCheck size={13} />
          <span>REASONS LINKED WITH COMMITS</span>
        </div>
      </div>

      {/* Main Layout - Relationship Graph at Top */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex justify-between items-center border-b border-slate-850 pb-3">
          <div>
            <h3 className="text-xs font-sans font-bold text-slate-200">
              How Things Are Connected
            </h3>
            <p className="text-[10px] text-slate-500 font-mono">
              Hover and select items to see connections and related code changes.
            </p>
          </div>
          
          <div className="text-[9px] font-mono text-indigo-400 bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10">
            CONNECTION MAP
          </div>
        </div>

        {/* Knowledge Graph component embedded cleanly */}
        <div className="border border-slate-950 rounded-lg bg-slate-950/40 p-2 overflow-hidden">
          <KnowledgeGraphView
            nodes={nodes}
            edges={edges}
            selectedNodeId={selectedNodeId}
            onSelectNode={onSelectNode}
          />
        </div>
      </div>

      {/* Sealed Evidence Ledger Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-850 pb-3">
          <div>
            <h3 className="text-xs font-sans font-bold text-slate-200">
              Secured Forensics Proofs Locker
            </h3>
            <p className="text-[10px] text-slate-500 font-mono">
              List of code blocks and files marked as forensic evidence during investigations.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative flex items-center min-w-[200px]">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search changes database..."
              className="w-full bg-slate-950 border border-slate-850 rounded-lg pl-3 pr-8 py-1.5 text-[10px] font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-700"
            />
            <Search size={11} className="absolute right-2.5 text-slate-500 pointer-events-none" />
          </div>
        </div>

        {/* Ledger Grid Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] font-mono text-slate-400 border-collapse">
            <thead>
              <tr className="border-b border-slate-850 text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                <th className="py-2.5 px-3">Record ID</th>
                <th className="py-2.5 px-3">Scenario / Title</th>
                <th className="py-2.5 px-3">File Affected</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3 text-center">Impact Level</th>
                <th className="py-2.5 px-3">Author</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/50">
              {filteredEvidence.map((ev) => {
                const threatColors: Record<string, string> = {
                  CRITICAL: "bg-red-500/10 text-red-400 border-red-500/20",
                  HIGH: "bg-amber-500/10 text-amber-400 border-amber-500/20",
                  MEDIUM: "bg-blue-500/10 text-blue-400 border-blue-500/20"
                };

                return (
                  <tr key={ev.id} className="hover:bg-slate-950/40 transition-colors">
                    <td className="py-3 px-3 text-indigo-400 font-bold">{ev.id}</td>
                    <td className="py-3 px-3">
                      <div className="space-y-0.5">
                        <span className="font-sans font-bold text-slate-200 block">{ev.title}</span>
                        <span className="text-[9px] text-slate-500">SHA-255: <code className="text-slate-400">{ev.sha}</code></span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-300">{ev.fileAffected}</td>
                    <td className="py-3 px-3 text-slate-500">{ev.type}</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`text-[8px] font-bold border rounded px-1.5 py-0.5 uppercase ${threatColors[ev.severity] || "border-slate-850 bg-slate-900"}`}>
                        {ev.severity}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400">@{ev.investigator}</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => alert(`Downloading verified details for: ${ev.title}`)}
                        className="p-1.5 bg-slate-950 border border-slate-850 rounded hover:border-indigo-500/40 text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                        title="Download Record Details"
                      >
                        <Download size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredEvidence.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-slate-600 font-mono">
                    No records match the active search filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
