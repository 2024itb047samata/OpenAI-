import React from "react";
import { 
  GitBranch, 
  Layers, 
  Activity, 
  ShieldCheck, 
  ShieldAlert, 
  ArrowUpRight, 
  Terminal, 
  Cpu, 
  Clock, 
  FileLock2, 
  Sparkles,
  ExternalLink 
} from "lucide-react";

interface Scenario {
  id: string;
  name: string;
  description: string;
  severity: "critical" | "high" | "warning";
  status: "investigating" | "resolved" | "active";
  targetQuestion: string;
}

interface DashboardPageProps {
  scenarios: Scenario[];
  selectedScenarioId: string;
  onSelectScenario: (id: string) => void;
  onNavigateToTimeline: () => void;
  onNavigateToAskAi: () => void;
  isGitHubConnected: boolean;
  githubUser: any;
  customReposCount: number;
}

export default function DashboardPage({
  scenarios,
  selectedScenarioId,
  onSelectScenario,
  onNavigateToTimeline,
  onNavigateToAskAi,
  isGitHubConnected,
  githubUser,
  customReposCount
}: DashboardPageProps) {

  // Custom data for activity chart
  const weeklyActivity = [
    { day: "Mon", commits: 24, issues: 12 },
    { day: "Tue", commits: 42, issues: 18 },
    { day: "Wed", commits: 35, issues: 14 },
    { day: "Thu", commits: 58, issues: 22 },
    { day: "Fri", commits: 48, issues: 20 },
    { day: "Sat", commits: 15, issues: 5 },
    { day: "Sun", commits: 10, issues: 8 }
  ];

  const maxVal = 60;

  return (
    <div className="space-y-6 animate-fade-in" id="saas-dashboard-page">
      {/* Welcome banner */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl bg-gradient-to-br from-slate-900 to-indigo-950/20 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider block">
              Active Console
            </span>
            <h2 className="text-xl font-display font-bold text-slate-100">
              Welcome back, {githubUser?.name || githubUser?.login || "Engineer"}
            </h2>
            <p className="text-[11px] text-slate-400 max-w-xl">
              CodeStory has mapped your repository integrations. All systems are operational.
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={onNavigateToAskAi}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(99,102,241,0.2)]"
            >
              <Sparkles size={11} className="animate-pulse" />
              Ask AI
            </button>
            <button
              onClick={onNavigateToTimeline}
              className="px-3.5 py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg text-[10px] font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Clock size={11} />
              Timeline
            </button>
          </div>
        </div>
      </div>

      {/* Grid statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl text-left space-y-2">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-[10px] font-mono uppercase font-bold tracking-wider">Indexed Artifacts</span>
            <Layers size={14} className="text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-100">418</span>
            <span className="text-[9px] font-mono text-emerald-400 font-semibold">+14% last week</span>
          </div>
          <p className="text-[9px] font-mono text-slate-500 leading-normal">
            Issues, PRs, Commits, & Reviews cached locally.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl text-left space-y-2">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-[10px] font-mono uppercase font-bold tracking-wider">Grounding SLA</span>
            <Activity size={14} className="text-indigo-400 animate-pulse" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-100">99.98%</span>
            <span className="text-[9px] font-mono text-indigo-400 font-semibold">Zero Hallucinations</span>
          </div>
          <p className="text-[9px] font-mono text-slate-500 leading-normal">
            RRF synthesis matches vector nodes perfectly.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl text-left space-y-2">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-[10px] font-mono uppercase font-bold tracking-wider">AI Queries Made</span>
            <Cpu size={14} className="text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-100">284</span>
            <span className="text-[9px] font-mono text-indigo-400 font-semibold">100% token usage</span>
          </div>
          <p className="text-[9px] font-mono text-slate-500 leading-normal">
            Requests resolved by server-side Gemini RAG.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl text-left space-y-2">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-[10px] font-mono uppercase font-bold tracking-wider">Saved Explanations</span>
            <FileLock2 size={14} className="text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-100">12</span>
            <span className="text-[9px] font-mono text-emerald-400 font-semibold">Saved changes</span>
          </div>
          <p className="text-[9px] font-mono text-slate-500 leading-normal">
            Saved reasons behind changes.
          </p>
        </div>
      </div>

      {/* Main Content Area - Chart and Incident Alert log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* SVG Activity Graph Chart - lg:col-span-7 */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 text-left flex flex-col space-y-4 shadow-lg">
          <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
            <div>
              <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
                Repository Diagnostics
              </span>
              <h3 className="text-xs font-sans font-bold text-slate-200 mt-0.5">
                Ingestion & Code Check-In Velocity
              </h3>
            </div>
            <div className="flex gap-3 text-[9px] font-mono font-bold">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" /> Commits</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-indigo-300 rounded-full" /> Issues/PRs</span>
            </div>
          </div>

          {/* SVG Canvas Chart */}
          <div className="flex-1 min-h-[220px] relative flex items-end">
            <svg className="w-full h-full min-h-[200px]" viewBox="0 0 500 200" preserveAspectRatio="none">
              {/* Grid Lines */}
              <line x1="0" y1="50" x2="500" y2="50" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="0" y1="100" x2="500" y2="100" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="0" y1="150" x2="500" y2="150" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
              
              {/* Commits Area/Line */}
              <path
                d={`M 10 ${200 - (weeklyActivity[0].commits / maxVal) * 180}
                    L 80 ${200 - (weeklyActivity[1].commits / maxVal) * 180}
                    L 150 ${200 - (weeklyActivity[2].commits / maxVal) * 180}
                    L 220 ${200 - (weeklyActivity[3].commits / maxVal) * 180}
                    L 290 ${200 - (weeklyActivity[4].commits / maxVal) * 180}
                    L 360 ${200 - (weeklyActivity[5].commits / maxVal) * 180}
                    L 430 ${200 - (weeklyActivity[6].commits / maxVal) * 180}
                    L 490 ${200 - (weeklyActivity[6].commits / maxVal) * 180}`}
                fill="none"
                stroke="#6366f1"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Commits Gradient fill */}
              <path
                d={`M 10 200
                    L 10 ${200 - (weeklyActivity[0].commits / maxVal) * 180}
                    L 80 ${200 - (weeklyActivity[1].commits / maxVal) * 180}
                    L 150 ${200 - (weeklyActivity[2].commits / maxVal) * 180}
                    L 220 ${200 - (weeklyActivity[3].commits / maxVal) * 180}
                    L 290 ${200 - (weeklyActivity[4].commits / maxVal) * 180}
                    L 360 ${200 - (weeklyActivity[5].commits / maxVal) * 180}
                    L 430 ${200 - (weeklyActivity[6].commits / maxVal) * 180}
                    L 490 200 Z`}
                fill="url(#indigo-grad)"
                opacity="0.12"
              />

              {/* Issues/PRs Line */}
              <path
                d={`M 10 ${200 - (weeklyActivity[0].issues / maxVal) * 180}
                    L 80 ${200 - (weeklyActivity[1].issues / maxVal) * 180}
                    L 150 ${200 - (weeklyActivity[2].issues / maxVal) * 180}
                    L 220 ${200 - (weeklyActivity[3].issues / maxVal) * 180}
                    L 290 ${200 - (weeklyActivity[4].issues / maxVal) * 180}
                    L 360 ${200 - (weeklyActivity[5].issues / maxVal) * 180}
                    L 430 ${200 - (weeklyActivity[6].issues / maxVal) * 180}`}
                fill="none"
                stroke="#a5b4fc"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />

              {/* Grid Gradient Defs */}
              <defs>
                <linearGradient id="indigo-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* X axis labels */}
          <div className="flex justify-between px-2 text-[8px] font-mono text-slate-500 pt-2 border-t border-slate-900">
            {weeklyActivity.map((d) => (
              <span key={d.day}>{d.day} ({d.commits} commits)</span>
            ))}
          </div>
        </div>

        {/* Scenario Selection Log - lg:col-span-5 */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 text-left flex flex-col space-y-4 shadow-lg">
          <div className="border-b border-slate-800/80 pb-3">
            <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
              Demo Scenarios
            </span>
            <h3 className="text-xs font-sans font-bold text-slate-200 mt-0.5">
              Explore Scenarios ({scenarios.length})
            </h3>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[220px] scrollbar-thin pr-1">
            {scenarios.map((sc) => {
              const isActive = selectedScenarioId === sc.id;
              
              const severityStyles = {
                critical: "bg-red-500/10 border-red-500/25 text-red-400",
                high: "bg-amber-500/10 border-amber-500/25 text-amber-400",
                warning: "bg-blue-500/10 border-blue-500/25 text-blue-400"
              };

              const statusStyles = {
                investigating: "border-amber-500/20 text-amber-400 bg-amber-500/5",
                resolved: "border-emerald-500/20 text-emerald-400 bg-emerald-500/5",
                active: "border-red-500/20 text-red-400 bg-red-500/5"
              };

              return (
                <div
                  key={sc.id}
                  onClick={() => onSelectScenario(sc.id)}
                  className={`p-3 border rounded-lg transition-all cursor-pointer text-left space-y-2.5 ${
                    isActive 
                      ? "bg-slate-950/80 border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.1)]" 
                      : "bg-slate-950/40 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 border rounded uppercase ${severityStyles[sc.severity]}`}>
                          {sc.severity}
                        </span>
                        <h4 className="text-[11px] font-sans font-bold text-slate-200 truncate">
                          {sc.name}
                        </h4>
                      </div>
                    </div>
                    
                    <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 border rounded uppercase shrink-0 ${statusStyles[sc.status]}`}>
                      {sc.status}
                    </span>
                  </div>

                  <p className="text-[10px] font-mono leading-normal text-slate-500 line-clamp-2">
                    {sc.description}
                  </p>

                  <div className="flex justify-between items-center text-[9px] font-mono text-slate-600 border-t border-slate-900 pt-2">
                    <span>Target: {sc.id}</span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectScenario(sc.id);
                        onNavigateToTimeline();
                      }}
                      className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-0.5"
                    >
                      View timeline
                      <ArrowUpRight size={10} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Connected Integration Status Block */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-left space-y-3 shadow-lg">
        <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Terminal size={14} className="text-indigo-400" />
            <h3 className="text-xs font-sans font-bold text-slate-200">
              Active Integration Node Status
            </h3>
          </div>
          <span className="text-[9px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded">
            SYS_HEALTH_CHECK: OK
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-3.5 bg-slate-950/40 border border-slate-850 rounded-lg flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isGitHubConnected ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-900 text-slate-500"}`}>
              <GitBranch size={16} />
            </div>
            <div>
              <span className="text-[9px] text-slate-500 block">GITHUB CONNECTOR</span>
              <span className="text-[11px] font-bold text-slate-300">
                {isGitHubConnected ? `@${githubUser?.login || "Active"}` : "Unconnected"}
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-950/40 border border-slate-850 rounded-lg flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Layers size={16} />
            </div>
            <div>
              <span className="text-[9px] text-slate-500 block">CUSTOM REPOS SYNCED</span>
              <span className="text-[11px] font-bold text-slate-300">
                {customReposCount} Repositories
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-950/40 border border-slate-850 rounded-lg flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <ShieldCheck size={16} />
            </div>
            <div>
              <span className="text-[9px] text-slate-500 block">AI RAG STATUS</span>
              <span className="text-[11px] font-bold text-slate-300">
                Active & Calibrated
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
