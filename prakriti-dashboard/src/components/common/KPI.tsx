import React from "react";

interface KPICardProps {
  icon: React.ComponentType<any>;
  title: string;
  value: number | string;
  color: string;
}

export default function KPI({ icon: Icon, title, value, color }: KPICardProps) {
  return (
    <div className="bg-white rounded-[1.5rem] border border-slate-200/80 shadow-sm p-4 flex items-center justify-between transition-all hover:shadow-md">
      <div>
        <p className="text-slate-505 text-xs font-semibold text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-800 mt-1">{value.toLocaleString()}</p>
      </div>
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
        style={{ backgroundColor: color }}
      >
        <Icon size={18} />
      </div>
    </div>
  );
}
