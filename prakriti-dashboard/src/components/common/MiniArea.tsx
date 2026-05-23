import React from "react";

interface MiniAreaProps {
  values: number[];
  from: string;
  to: string;
}

export default function MiniArea({ values, from, to }: MiniAreaProps) {
  const max = Math.max(...values);
  const points = values.map((v, i) => `${(i / (values.length - 1)) * 105},${100 - (v / max) * 100}`).join(" ");
  return (
    <div>
      <div className="h-44 bg-slate-50/50 rounded-xl p-2 border border-slate-200/40">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id="area-grad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={from} stopOpacity="0.35" />
              <stop offset="100%" stopColor={to} stopOpacity="0.01" />
            </linearGradient>
          </defs>
          <polygon points={`0,100 ${points} 100,100`} fill="url(#area-grad)" />
          <polyline points={points} fill="none" stroke={from} strokeWidth="2.5" />
        </svg>
      </div>
      <div className="mt-2.5 text-[10px] text-slate-400 flex justify-between px-1 font-bold">
        <span>−7w</span>
        <span>−5w</span>
        <span>−3w</span>
        <span>This Week</span>
      </div>
    </div>
  );
}
