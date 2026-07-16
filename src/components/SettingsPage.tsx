import React, { useState } from "react";
import { KeyRound, ShieldAlert, CheckCircle2, Sliders, Users, Cpu, Database, Save, Info, Plus } from "lucide-react";

interface SettingsPageProps {
  apiKeyActive: boolean;
  onSaveApiKey: (key: string) => void;
  isGitHubConnected: boolean;
  githubUser: any;
  onDisconnectGitHub: () => void;
}

export default function SettingsPage({
  apiKeyActive,
  onSaveApiKey,
  isGitHubConnected,
  githubUser,
  onDisconnectGitHub
}: SettingsPageProps) {
  const [apiKey, setApiKey] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [confidence, setConfidence] = useState(85);
  const [rrfConstant, setRrfConstant] = useState(60);
  const [vectorModel, setVectorModel] = useState("text-embedding-004");
  const [evictionPolicy, setEvictionPolicy] = useState("LRU");

  const [team, setTeam] = useState([
    { name: "Alice Dev", role: "Security & Forensic Investigator", email: "alice@company.com" },
    { name: "Charlie Arch", role: "Infrastructure Architect", email: "charlie@company.com" },
    { name: "Dave Manager", role: "Compliance Lead Manager", email: "dave@company.com" }
  ]);

  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("Investigator");
  const [newEmail, setNewEmail] = useState("");

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;
    setTeam([...team, { name: newName, role: newRole, email: newEmail }]);
    setNewName("");
    setNewEmail("");
  };

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;
    onSaveApiKey(apiKey);
    setSavedSuccess(true);
    setApiKey("");
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  return (
    <div className="space-y-6 animate-fade-in text-left" id="saas-settings-page">
      {/* Page Header */}
      <div className="border-b border-slate-900 pb-4">
        <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider block">
          Platform Workspace Configurations
        </span>
        <h2 className="text-lg font-display font-bold text-slate-100 mt-0.5">
          Workspace & API Tuner Settings
        </h2>
        <p className="text-[11px] text-slate-400">
          Configure API credentials, fine-tune hybrid semantic search grounding thresholds, and manage your audit investigator team.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left column - Credentials and RAG parameters */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Section 1: Security & Credentials */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
              <KeyRound size={15} className="text-indigo-400" />
              <h3 className="text-xs font-sans font-bold text-slate-200">
                Credentials & API Tokens
              </h3>
            </div>

            <form onSubmit={handleSaveApiKey} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-slate-400 uppercase block">
                  Gemini API Secret Key
                </label>
                <div className="relative flex items-center">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={apiKeyActive ? "••••••••••••••••••••••••••••••••" : "Enter GEMINI_API_KEY to activate live AI analysis..."}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg pl-3 pr-24 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-700"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-bold font-mono transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Save size={11} />
                    Save Secret
                  </button>
                </div>
                <p className="text-[9px] text-slate-500 leading-normal">
                  Secrets are persisted on your secure back-end sandbox container and never exposed to browser inspectors.
                </p>
              </div>
            </form>

            {savedSuccess && (
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] font-mono rounded flex items-center gap-1.5 animate-fade-in">
                <CheckCircle2 size={13} />
                <span>Gemini API Key locked and registered into workspace successfully.</span>
              </div>
            )}

            {/* GitHub Connection */}
            <div className="border-t border-slate-850/60 pt-4 mt-2 space-y-3">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">
                GitHub Auth Node Integration
              </span>

              {isGitHubConnected ? (
                <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {githubUser?.avatar_url && (
                      <img
                        src={githubUser.avatar_url}
                        alt="Avatar"
                        className="w-7 h-7 rounded-full border border-emerald-500/30"
                      />
                    )}
                    <div>
                      <span className="text-xs font-sans font-bold text-slate-200 block">
                        @{githubUser?.login || "Active Session"}
                      </span>
                      <span className="text-[9px] font-mono text-slate-500">
                        Token synced to pull live chronological repository data
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={onDisconnectGitHub}
                    className="px-2.5 py-1.5 border border-red-500/20 hover:border-red-500/40 text-red-400 hover:bg-red-500/5 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-slate-950/40 border border-slate-850 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div>
                    <span className="text-[11px] font-sans font-bold text-slate-300 block">
                      Connect GitHub credentials
                    </span>
                    <span className="text-[9px] font-mono text-slate-500">
                      Sync pull requests, issue workflows, and code commits
                    </span>
                  </div>
                  <span className="text-[9px] font-mono font-bold bg-slate-900 text-slate-600 border border-slate-800 px-2 py-1 rounded">
                    UNCONNECTED
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Fine Tuning Parameters (sliders, dropdowns) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
              <Sliders size={15} className="text-indigo-400" />
              <h3 className="text-xs font-sans font-bold text-slate-200">
                Grounding & AI RAG Fine-Tuning
              </h3>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <div className="flex justify-between font-mono font-bold text-[10px] text-slate-400">
                  <span>GROUNDING CONFIDENCE BOUNDS</span>
                  <span className="text-indigo-400">{confidence}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={confidence}
                  onChange={(e) => setConfidence(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
                <p className="text-[9px] text-slate-500 font-mono">
                  Reject retrieved documents with scoring weights below this percentage rate.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between font-mono font-bold text-[10px] text-slate-400">
                  <span>RECIPROCAL RANK FUSION (RRF) CONSTANT</span>
                  <span className="text-indigo-400">k = {rrfConstant}</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="120"
                  value={rrfConstant}
                  onChange={(e) => setRrfConstant(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
                <p className="text-[9px] text-slate-500 font-mono">
                  Controls the scaling curve of keyword (BM25) and semantic vector merges.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-mono font-bold text-slate-400 block">
                    EMBEDDING VECTOR MODEL
                  </label>
                  <select
                    value={vectorModel}
                    onChange={(e) => setVectorModel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 text-xs font-mono text-slate-300 rounded-lg p-2 focus:outline-none"
                  >
                    <option value="text-embedding-004">text-embedding-004 (Default)</option>
                    <option value="text-multilingual-embedding-002">text-multilingual-002</option>
                  </select>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-mono font-bold text-slate-400 block">
                    CACHE EVICTION POLICY
                  </label>
                  <select
                    value={evictionPolicy}
                    onChange={(e) => setEvictionPolicy(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 text-xs font-mono text-slate-300 rounded-lg p-2 focus:outline-none"
                  >
                    <option value="LRU">LRU (Least Recently Used)</option>
                    <option value="LFU">LFU (Least Frequently Used)</option>
                    <option value="FIFO">FIFO (First In First Out)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column - Team Members Management */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Section 3: Team Management */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
              <Users size={15} className="text-indigo-400" />
              <h3 className="text-xs font-sans font-bold text-slate-200">
                Workspace Audit Team ({team.length})
              </h3>
            </div>

            {/* List of active team members */}
            <div className="space-y-2.5 max-h-[220px] overflow-y-auto scrollbar-thin pr-1">
              {team.map((mbr, index) => (
                <div key={index} className="p-3 bg-slate-950/40 border border-slate-850 rounded-lg text-left space-y-1">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-sans font-bold text-slate-200">{mbr.name}</span>
                    <span className="text-[8px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded uppercase font-bold">
                      {mbr.role.split(" ")[0]}
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-slate-500 leading-normal">{mbr.role}</p>
                  <p className="text-[9px] font-mono text-slate-600">{mbr.email}</p>
                </div>
              ))}
            </div>

            {/* Invite form */}
            <form onSubmit={handleAddMember} className="border-t border-slate-850/60 pt-4 mt-2 space-y-3">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">
                Add Investigator / Team Node
              </span>

              <div className="space-y-2 text-xs">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-slate-300 placeholder:text-slate-700 focus:outline-none"
                />

                <input
                  type="email"
                  placeholder="Email Address"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-slate-300 placeholder:text-slate-700 focus:outline-none"
                />

                <div className="flex gap-2">
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-850 text-[11px] font-mono text-slate-300 rounded-lg px-2 py-1.5 focus:outline-none"
                  >
                    <option value="Investigator">Investigator</option>
                    <option value="Infrastructure Auditor">Infrastructure Auditor</option>
                    <option value="Compliance Manager">Compliance Manager</option>
                  </select>

                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Plus size={11} />
                    Invite
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
