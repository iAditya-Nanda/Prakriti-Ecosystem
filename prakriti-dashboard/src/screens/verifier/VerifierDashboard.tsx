import React from "react";
import { ClipboardClock, CheckCheck, XOctagon, LineChart, TrendingUp, Cpu, Landmark, RefreshCw } from "lucide-react";
import { User, WeeklyStats, BCStats } from "../../types";
import Panel from "../../components/common/Panel";
import MiniArea from "../../components/common/MiniArea";

interface VerifierDashboardProps {
  user: User;
  verifierStats: {
    pending: number;
    approved: number;
    rejected: number;
  };
  bcStats: BCStats | null;
  blockchainLoading: boolean;
  onMineBlockchain: () => void;
  onRefresh: () => void;
  onNavigateToQueue: () => void;
  onNavigateToBusiness: () => void;
  onNavigateToReports: () => void;
  weeklyActions: number[];
  regions: Array<{ name: string; pct: number }>;
  insight: string;
}

export default function VerifierDashboard({
  user,
  verifierStats,
  bcStats,
  blockchainLoading,
  onMineBlockchain,
  onRefresh,
  onNavigateToQueue,
  onNavigateToBusiness,
  onNavigateToReports,
  weeklyActions,
  regions,
  insight,
}: VerifierDashboardProps) {
  const metrics = [
    {
      label: "Pending Verifications",
      value: verifierStats.pending,
      icon: ClipboardClock,
      color: "#B58B00",
      bg: "#FFF9E6",
      border: "border-yellow-200/50",
    },
    {
      label: "Approved Actions",
      value: verifierStats.approved,
      icon: CheckCheck,
      color: "#0E6E59",
      bg: "#EFF6F4",
      border: "border-emerald-200/50",
    },
    {
      label: "Rejected Items",
      value: verifierStats.rejected,
      icon: XOctagon,
      color: "#C84040",
      bg: "#FDF2F2",
      border: "border-red-200/50",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner Card */}
      <div className="bg-white rounded-[2rem] border border-slate-200 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Verifier Control Console</p>
          <h2 className="text-2xl font-black text-slate-800 mt-1">Hello, {user.name} 👋</h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            You verify real-world sustainability impact across Himachalian regions.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="px-4 py-2 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold text-slate-600 bg-slate-50 flex items-center gap-1.5 transition-all outline-none"
        >
          <RefreshCw size={14} /> Refresh Console
        </button>
      </div>

      {/* Metrics Row Grid matching VerifierDashboard.jsx */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <div
              key={i}
              className={`bg-white rounded-2xl p-5 border ${m.border} flex items-center gap-4 shadow-sm`}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs"
                style={{ backgroundColor: m.bg, color: m.color }}
              >
                <Icon size={24} />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-800 leading-none">{m.value}</p>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">{m.label}</p>
              </div>
            </div>
          );
        })}
      </section>

      {/* Quick Action Navigation Grid */}
      <section className="space-y-3">
        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={onNavigateToQueue}
            className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col items-center justify-center text-center hover:border-[#0E6E59] hover:shadow-md transition-all outline-none group active:scale-[0.99]"
          >
            <div className="w-12 h-12 rounded-full bg-[#EFF6F4] flex items-center justify-center text-[#0E6E59] group-hover:scale-110 transition-transform mb-3 shadow-xs">
              <ClipboardClock size={22} />
            </div>
            <span className="text-xs font-bold text-slate-700">Verification Queue</span>
          </button>

          <button
            onClick={onNavigateToBusiness}
            className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col items-center justify-center text-center hover:border-[#0E6E59] hover:shadow-md transition-all outline-none group active:scale-[0.99]"
          >
            <div className="w-12 h-12 rounded-full bg-[#EFF6F4] flex items-center justify-center text-[#0E6E59] group-hover:scale-110 transition-transform mb-3 shadow-xs">
              <Landmark size={22} />
            </div>
            <span className="text-xs font-bold text-slate-700">Business Stamp Requests</span>
          </button>
        </div>
      </section>

      {/* Analytics Progress & PoW Ledger */}
      <section className="grid lg:grid-cols-3 gap-6 pt-2">
        <div className="lg:col-span-2 space-y-6">
          <Panel title="Weekly Actions & Regional shares" subtitle="Aggregated HP metrics" icon={LineChart}>
            <MiniArea values={weeklyActions} from="#0E6E59" to="#1ABC9C" />
            
            <div className="grid sm:grid-cols-2 gap-4 mt-6 border-t border-slate-100 pt-4">
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Top Action District</p>
                <div className="flex items-center justify-between text-xs font-bold bg-slate-50 p-2.5 rounded-xl border border-slate-200/50">
                  <span>{regions[0].name} District</span>
                  <span className="text-[#0E6E59]">{regions[0].pct}%</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active diagnostics</p>
                <div className="text-xs font-semibold text-slate-600 bg-[#EFF6F4] p-2.5 rounded-xl border border-[#D8DFDC]/50 truncate">
                  {insight}
                </div>
              </div>
            </div>
          </Panel>
        </div>

        <div className="lg:col-span-1">
          <Panel title="Blockchain Ledger" subtitle="Confirmed Green Point ledger logs" icon={Cpu}>
            {bcStats ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Blockchain Blocks</p>
                    <p className="text-base font-black text-[#0E6E59] mt-0.5">{bcStats.blockchain_length}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Complexity</p>
                    <p className="text-base font-black text-slate-700 mt-0.5">{bcStats.mining_difficulty}</p>
                  </div>
                  <div className="col-span-2 h-[1px] bg-slate-200 my-1" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Circulation</p>
                    <p className="text-xs font-bold text-slate-700 mt-0.5">{bcStats.total_gp_circulation} GP</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Transactions</p>
                    <p className="text-xs font-bold text-red-600 mt-0.5">{bcStats.pending_transactions}</p>
                  </div>
                </div>

                <button
                  onClick={onMineBlockchain}
                  disabled={blockchainLoading || bcStats.pending_transactions === 0}
                  className="w-full h-10 rounded-xl bg-[#0E6E59] hover:bg-[#0B5847] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-[0.98] outline-none"
                >
                  <Cpu size={16} />
                  {blockchainLoading ? "Confirming block..." : "Confirm Pending Transactions"}
                </button>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs font-medium">
                Loading ledger statistics...
              </div>
            )}
          </Panel>
        </div>
      </section>

      {/* Primary View Reports CTA button */}
      <button
        onClick={onNavigateToReports}
        className="w-full h-12 rounded-full bg-[#0E6E59] hover:bg-[#0B5847] text-white text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99] outline-none"
      >
        <TrendingUp size={16} />
        View Verified Impact Reports
      </button>
    </div>
  );
}
