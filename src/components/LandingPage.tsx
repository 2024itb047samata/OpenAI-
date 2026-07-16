import React from "react";
import { Clock, ShieldAlert, Sparkles, Network, ArrowRight, GitBranch, KeyRound, Terminal, CheckCircle2 } from "lucide-react";

interface LandingPageProps {
  onLaunch: () => void;
  serverHealth: "checking" | "online" | "offline";
  apiKeyActive: boolean;
}

export default function LandingPage({ onLaunch, serverHealth, apiKeyActive }: LandingPageProps) {
  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 overflow-hidden flex flex-col font-sans" id="saas-landing-page">
      {/* Decorative Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.03)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      
      {/* Glowing Neon Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-violet-600/5 rounded-full blur-[80px] pointer-events-none" />

      {/* Top Banner Status */}
      <div className="border-b border-slate-900 bg-slate-950/60 backdrop-blur-md px-6 py-4 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400">
            <Clock className="w-4 h-4 animate-pulse" />
          </div>
          <span className="text-xs font-bold font-display tracking-tight text-white uppercase">
            Knowledge Time Machine
          </span>
          <span className="text-[9px] font-mono bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded font-bold">
            SaaS Core v1.5
          </span>
        </div>

        <div className="flex items-center gap-3 text-[10px] font-mono">
          <div className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-1 rounded-md border border-slate-800">
            <span className="text-slate-500">ENGINE:</span>
            {serverHealth === "online" ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> ONLINE
              </span>
            ) : (
              <span className="text-amber-400 font-bold">CHECKING...</span>
            )}
          </div>
          <button
            onClick={onLaunch}
            className="px-3.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-[10px] font-bold font-sans transition-all flex items-center gap-1 cursor-pointer shadow-[0_0_15px_rgba(99,102,241,0.25)]"
          >
            Launch Console
            <ArrowRight size={10} />
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16 max-w-5xl mx-auto relative z-10 gap-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-[10px] font-mono font-bold animate-fade-in">
            <Sparkles size={11} className="animate-pulse" />
            <span>AI-POWERED GIT HISTORY SEARCH</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-display font-extrabold tracking-tight text-slate-100 max-w-3xl leading-[1.1] bg-gradient-to-r from-slate-100 via-slate-100 to-indigo-400 text-transparent bg-clip-text">
            Solder Git History into a Searchable Knowledge Base
          </h1>
          
          <p className="text-sm md:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed font-sans">
            Explore why changes happened. Knowledge Time Machine parses your issues, pull requests, and commits into an easy-to-use relationship graph using AI embeddings.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 relative z-10">
          <button
            onClick={onLaunch}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold font-sans tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:scale-[1.02]"
          >
            Launch Time Machine
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <a
            href="#features"
            className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-bold font-sans border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-center"
          >
            Explore Platform Features
          </a>
        </div>

        {/* Interactive Mockup */}
        <div className="w-full mt-6 bg-slate-900/50 border border-slate-800 rounded-xl p-2.5 shadow-2xl relative group">
          <div className="absolute -inset-[1px] bg-gradient-to-r from-indigo-500/10 to-violet-500/10 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 pointer-events-none" />
          <div className="bg-slate-950 rounded-lg p-4 border border-slate-900 text-left space-y-4">
            {/* Window controls */}
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                <span className="text-[9px] font-mono text-slate-600 ml-2">TIME_MACHINE_ACTIVE</span>
              </div>
              <div className="text-[9px] font-mono text-indigo-400 bg-indigo-500/5 border border-indigo-500/10 px-2 py-0.5 rounded">
                TIME MACHINE ONLINE
              </div>
            </div>

            {/* Simulated graph or stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-slate-900/40 border border-slate-800/60 rounded-lg p-3 space-y-1.5">
                <span className="text-[9px] font-mono text-slate-500 block">AI SEARCH ACCURACY</span>
                <div className="text-base font-bold text-slate-200">99.98% SLA</div>
                <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-900">
                  <div className="bg-indigo-500 h-full w-[99.98%]" />
                </div>
              </div>
              <div className="bg-slate-900/40 border border-slate-800/60 rounded-lg p-3 space-y-1.5">
                <span className="text-[9px] font-mono text-slate-500 block">ITEMS INDEXED</span>
                <div className="text-base font-bold text-slate-200">418 Items</div>
                <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-900">
                  <div className="bg-violet-500 h-full w-[85%]" />
                </div>
              </div>
              <div className="bg-slate-900/40 border border-slate-800/60 rounded-lg p-3 space-y-1.5">
                <span className="text-[9px] font-mono text-slate-500 block">SAVED REASONS</span>
                <div className="text-base font-bold text-slate-200">12 saved files</div>
                <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-900">
                  <div className="bg-emerald-500 h-full w-[100%]" />
                </div>
              </div>
            </div>

            <div className="bg-slate-900/20 border border-slate-900 rounded p-3 text-[10px] font-mono text-slate-500 leading-relaxed">
              <span className="text-indigo-400 font-bold">time-machine:~$</span> query --why-code-changed --commit="7b8e1a2"<br />
              <span className="text-slate-300">Searching collection... Merging reciprocal rank fusion... Found match!</span><br />
              <span className="text-indigo-300 font-semibold">"Redis removed under PR #405 to reduce staging environment sandboxes costs ($120/month). Unintended side effect: memory crash due to in-process JavaScript cache object."</span>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div id="features" className="border-t border-slate-900 bg-slate-950 relative z-10 px-6 py-16 max-w-5xl mx-auto w-full space-y-8">
        <div className="text-center space-y-2">
          <span className="text-[10px] font-mono font-bold text-indigo-500 uppercase tracking-wider block">
            Core Architecture
          </span>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight">
            Designed for Modern Dev Teams & Engineers
          </h2>
          <p className="text-xs text-slate-400 max-w-xl mx-auto">
            A clean, fast platform styled after GitHub, Linear, and Vercel.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-xl space-y-3 hover:border-slate-700 transition-all text-left">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400 w-fit">
              <GitBranch size={16} />
            </div>
            <h3 className="text-xs font-sans font-bold text-slate-200">Chronological Timelines</h3>
            <p className="text-[10px] font-sans text-slate-400 leading-relaxed">
              Order events correctly. Seamlessly track Issue Creation, PR Updates, Commits, CI builds, reviews, and merges with high-fidelity telemetry stamps.
            </p>
          </div>

          <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-xl space-y-3 hover:border-slate-700 transition-all text-left">
            <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-400 w-fit">
              <Network size={16} />
            </div>
            <h3 className="text-xs font-sans font-bold text-slate-200">Semantic Graph Maps</h3>
            <p className="text-[10px] font-sans text-slate-400 leading-relaxed">
              Solder records. Automatically detect references like "Fixes #101" inside commits or pull requests, mapping nodes and authors into an interactive network.
            </p>
          </div>

          <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-xl space-y-3 hover:border-slate-700 transition-all text-left">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 w-fit">
              <Sparkles size={16} />
            </div>
            <h3 className="text-xs font-sans font-bold text-slate-200">Hybrid RAG Search</h3>
            <p className="text-[10px] font-sans text-slate-400 leading-relaxed">
              Dual-strategy retrieval combining ChromaDB semantic vectors and BM25 keyword matching via Reciprocal Rank Fusion to secure precise, hallucination-free facts.
            </p>
          </div>
        </div>
      </div>

      {/* Simple Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 px-6 mt-auto text-center text-[10px] font-mono text-slate-500 relative z-10">
        <p>&copy; 2026 Knowledge Time Machine Inc. All rights reserved. • approachable and simple for all developers</p>
      </footer>
    </div>
  );
}
