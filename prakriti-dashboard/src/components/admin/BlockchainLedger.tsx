import React from "react";
import { Cpu, Coins } from "lucide-react";
import { BCStats } from "../../types";
import Panel from "../common/Panel";

interface BlockchainLedgerProps {
  bcStats: BCStats | null;
  loading: boolean;
  onMine: () => void;
}

export default function BlockchainLedger({ bcStats, loading, onMine }: BlockchainLedgerProps) {
  return (
    <Panel title="Blockchain Ledger" subtitle="Confirmed Green Point ledger logs" icon={Coins}>
      {bcStats ? (
        <div className="space-y-4">
          {/* Blockchain KPI stats block */}
          <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
            <div>
              <p className="font-semibold text-slate-500">Blockchain Blocks</p>
              <p className="text-lg font-bold text-[#0E6E59]">{bcStats.blockchain_length}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-500">Complexity</p>
              <p className="text-lg font-bold text-slate-700">{bcStats.mining_difficulty}</p>
            </div>
            <div className="col-span-2 h-[1px] bg-slate-200 my-1" />
            <div>
              <p className="font-semibold text-slate-500">GP Circulation</p>
              <p className="text-sm font-bold text-slate-700">{bcStats.total_gp_circulation} GP</p>
            </div>
            <div>
              <p className="font-semibold text-slate-500">Pending Transactions</p>
              <p className="text-sm font-bold text-red-600">{bcStats.pending_transactions}</p>
            </div>
          </div>

          {/* Manual commit trigger */}
          <button
            onClick={onMine}
            disabled={loading || bcStats.pending_transactions === 0}
            className="w-full h-10 rounded-xl bg-[#0E6E59] hover:bg-[#0B5847] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-[0.98]"
          >
            <Cpu size={16} />
            {loading ? "Confirming to blockchain..." : "Confirm Pending Transactions"}
          </button>

          {/* Status */}
          <div className="text-[10px] text-slate-500 text-center leading-relaxed font-medium">
            Cryptographic verification confirms pending tourist verifications onto the database-backed blockchain ledger instantly.
          </div>
        </div>
      ) : (
        <div className="text-center py-6 text-slate-400 text-xs font-medium">
          Loading ledger statistics...
        </div>
      )}
    </Panel>
  );
}
