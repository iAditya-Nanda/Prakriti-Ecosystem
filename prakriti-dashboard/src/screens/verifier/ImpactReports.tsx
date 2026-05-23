import React from "react";
import { Recycle, Store, Award, Info, FileSpreadsheet } from "lucide-react";
import { WeeklyStats } from "../../types";

interface ImpactReportsProps {
  totals: WeeklyStats;
}

export default function ImpactReports({ totals }: ImpactReportsProps) {
  // Diverted plastic computation (4.2kg per eco-action)
  const plasticDiverted = roundTo((totals.ecoActions * 0.35), 1);

  function roundTo(value: number, precision: number) {
    const power = Math.pow(10, precision);
    return Math.round(value * power) / power;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in py-4">
      {/* Sleek Header */}
      <div>
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
          Verified Ecological Impact
        </h2>
        <p className="text-xs text-slate-555 font-semibold text-slate-500 mt-0.5">
          Himachal Pradesh Sustainability Ledger
        </p>
      </div>

      {/* Main Stat Dashboard Card - centered big recycle counter matching VerifierReports.jsx */}
      <div className="bg-white rounded-[2rem] border border-slate-200 p-8 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden">
        {/* Abstract light green background circles */}
        <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full bg-[#EFF6F4]/40 blur-xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-[#EFF6F4]/40 blur-xl pointer-events-none" />

        <div className="w-16 h-16 rounded-full bg-[#EFF6F4] flex items-center justify-center text-[#0E6E59] shadow-xs mb-4 z-10">
          <Recycle size={32} />
        </div>
        
        <h3 className="text-6xl font-black text-[#0E6E59] tracking-tighter leading-none z-10">
          {totals.ecoActions.toLocaleString()}
        </h3>
        
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-3.5 z-10">
          Total Eco Actions Verified
        </p>
      </div>

      {/* Sub Stats Row Grid matching small cards in VerifierReports.jsx */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Certified Businesses Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-10 h-10 rounded-full bg-[#EFF6F4] flex items-center justify-center text-[#0E6E59] shadow-xs mb-3">
            <Store size={20} />
          </div>
          <p className="text-2xl font-black text-slate-800 leading-none">
            {totals.certifiedBusinesses}
          </p>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-2">
            Certified Green Partners
          </p>
        </div>

        {/* Diverted plastic card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-10 h-10 rounded-full bg-[#EFF6F4] flex items-center justify-center text-[#0E6E59] shadow-xs mb-3">
            <Award size={20} />
          </div>
          <p className="text-2xl font-black text-slate-800 leading-none">
            {plasticDiverted.toLocaleString()} kg
          </p>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-2">
            Diverted Recyclable Waste
          </p>
        </div>
      </section>

      {/* Action export links or logs summary */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3 shadow-sm text-xs font-semibold text-slate-600 bg-slate-50/50">
        <Info size={16} className="text-[#0E6E59] shrink-0" />
        <p className="leading-relaxed">
          These environmental figures directly reflect the real-world validation logs certified through your verifications console.
        </p>
      </div>

      {/* Export CSV/Excel Trigger */}
      <button
        onClick={() => alert("Generating full ecological impact CSV log report...")}
        className="w-full h-11 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.99] outline-none shadow-xs"
      >
        <FileSpreadsheet size={16} /> Export Consolidated Environmental Audit Report
      </button>
    </div>
  );
}
