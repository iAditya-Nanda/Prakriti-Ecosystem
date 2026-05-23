import React from "react";
import { ShieldCheck, LayoutDashboard, ClipboardList, Store, Globe, User, Settings } from "lucide-react";

export type SidebarView = "dashboard" | "queue" | "business" | "reports" | "profile" | "settings";

interface SidebarProps {
  activeView: SidebarView;
  onViewChange: (view: SidebarView) => void;
  pendingActionsCount: number;
  pendingStampsCount: number;
}

export default function Sidebar({
  activeView,
  onViewChange,
  pendingActionsCount,
  pendingStampsCount,
}: SidebarProps) {
  const menuItems = [
    {
      id: "dashboard" as SidebarView,
      label: "Dashboard",
      icon: LayoutDashboard,
      badge: 0,
    },
    {
      id: "queue" as SidebarView,
      label: "Eco-Actions Queue",
      icon: ClipboardList,
      badge: pendingActionsCount,
    },
    {
      id: "business" as SidebarView,
      label: "Business Requests",
      icon: Store,
      badge: pendingStampsCount,
    },
    {
      id: "reports" as SidebarView,
      label: "Impact Reports",
      icon: Globe,
      badge: 0,
    },
    {
      id: "profile" as SidebarView,
      label: "Verifier Profile",
      icon: User,
      badge: 0,
    },
    {
      id: "settings" as SidebarView,
      label: "System Settings",
      icon: Settings,
      badge: 0,
    },
  ];

  return (
    <aside className="w-64 h-screen bg-[#0E6E59] text-white flex flex-col justify-between shrink-0 border-r border-[#116D59]/50 sticky top-0 font-sans shadow-lg select-none">
      {/* Brand Top Header */}
      <div>
        <div className="p-6 flex items-center gap-3 border-b border-[#116D59]/50 bg-[#0B5847]/45">
          <div className="w-9 h-9 rounded-2xl bg-white/10 flex items-center justify-center text-white border border-white/15 shadow-sm">
            <ShieldCheck size={20} className="text-emerald-300 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white tracking-wide">Prakriti Verifier</h2>
            <p className="text-[10px] text-[#A6D5CB] font-bold uppercase tracking-wider mt-0.5">
              Consolidated Panel
            </p>
          </div>
        </div>

        {/* Navigation Link list */}
        <nav className="p-4 space-y-2 mt-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all outline-none ${
                  isActive
                    ? "bg-[#0B5847] text-white shadow-inner border border-white/5"
                    : "text-[#A6D5CB] hover:bg-[#116D59]/60 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={16} className={isActive ? "text-emerald-400" : "text-current"} />
                  <span>{item.label}</span>
                </div>

                {item.badge > 0 && (
                  <span className="bg-red-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold shadow-sm">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer metadata info */}
      <div className="p-5 border-t border-[#116D59]/50 bg-[#0B5847]/20 text-[10px] text-[#A6D5CB] leading-relaxed font-bold uppercase tracking-wider text-center">
        HP Env Protection Suite
      </div>
    </aside>
  );
}
