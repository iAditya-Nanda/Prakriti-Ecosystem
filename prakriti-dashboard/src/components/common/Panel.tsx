import React from "react";

interface PanelProps {
  title: string;
  subtitle: string;
  icon: React.ComponentType<any>;
  children: React.ReactNode;
}

export default function Panel({ title, subtitle, icon: Icon, children }: PanelProps) {
  return (
    <div className="bg-white rounded-[2rem] border border-slate-200/80 shadow-sm p-5 transition-all hover:border-slate-300">
      <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Icon size={16} className="text-[#0E6E59]" /> {title}
          </h3>
          <p className="text-xs text-slate-505 font-semibold text-slate-500">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
