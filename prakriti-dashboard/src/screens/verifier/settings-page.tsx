import React, { useState } from "react";
import { Lock, Sliders, RefreshCw, HelpCircle } from "lucide-react";
import Panel from "../../components/common/Panel";

interface SettingsPageProps {
  userId: number;
  apiUrl: string;
}

export default function SettingsPage({ userId, apiUrl }: SettingsPageProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Dashboard configuration states
  const [pollingRate, setPollingRate] = useState(() => {
    return localStorage.getItem("prakriti_polling_rate") || "8000";
  });
  const [localMode, setLocalMode] = useState(() => {
    return localStorage.getItem("prakriti_local_mode") === "true";
  });

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("New passwords do not match!");
      return;
    }

    setPasswordLoading(true);
    try {
      const token = localStorage.getItem("prakriti_token");
      const res = await fetch(`${apiUrl}/api/v1/auth/change-password/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        alert(data.error || "Failed to update password.");
      }
    } catch (err) {
      alert("Error changing password. Please verify connection.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleConfigSave = (rate: string) => {
    setPollingRate(rate);
    localStorage.setItem("prakriti_polling_rate", rate);
    alert("Polling frequency updated! Please refresh dashboard to apply.");
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm">
        <div>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Verifier Control Console</p>
          <h2 className="text-2xl font-black text-slate-800 mt-1">Dashboard Settings</h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Configure system parameters, intervals, and login safety.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Side: Security Settings */}
        <div className="space-y-6">
          <Panel title="Change Password" subtitle="Modify your login credentials" icon={Lock}>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 h-11 rounded-2xl border border-slate-200 focus:border-[#0E6E59] bg-[#F8F9F8] text-sm text-slate-700 font-semibold transition-all outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 h-11 rounded-2xl border border-slate-200 focus:border-[#0E6E59] bg-[#F8F9F8] text-sm text-slate-700 font-semibold transition-all outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 h-11 rounded-2xl border border-slate-200 focus:border-[#0E6E59] bg-[#F8F9F8] text-sm text-slate-700 font-semibold transition-all outline-none"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="w-full h-11 rounded-full bg-[#0E6E59] hover:bg-[#0B5847] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50 active:scale-[0.99] outline-none"
                >
                  {passwordLoading ? "Updating Password..." : "Change Password"}
                </button>
              </div>
            </form>
          </Panel>
        </div>

        {/* Right Side: Dashboard Feature Settings */}
        <div className="space-y-6">
          <Panel title="Ecosystem Configuration" subtitle="Fine-tune dashboard operational settings" icon={Sliders}>
            <div className="space-y-6">
              {/* Polling frequency */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <RefreshCw size={13} className="text-[#0E6E59] animate-spin" style={{ animationDuration: "3s" }} />
                  Live Sync Polling Rate
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "High (5s)", val: "5000" },
                    { label: "Normal (8s)", val: "8000" },
                    { label: "Eco (15s)", val: "15000" },
                  ].map((item) => {
                    const isSelected = pollingRate === item.val;
                    return (
                      <button
                        key={item.val}
                        onClick={() => handleConfigSave(item.val)}
                        type="button"
                        className={`h-10 rounded-xl text-xs font-bold transition-all border outline-none ${
                          isSelected
                            ? "bg-[#EFF6F4] border-[#0E6E59] text-[#0E6E59]"
                            : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-400 font-semibold mt-2 leading-relaxed">
                  Controls how frequently the dashboard calls backend stats to sync environmental actions.
                </p>
              </div>

              {/* Developer local mock bypass */}
              <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-700">Developer Local Mode</h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5 max-w-[240px] leading-relaxed">
                    Uses mock fallback parameters when server backend offline.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const val = !localMode;
                    setLocalMode(val);
                    localStorage.setItem("prakriti_local_mode", String(val));
                  }}
                  className={`w-12 h-6 rounded-full p-1 transition-all outline-none flex ${
                    localMode ? "bg-[#0E6E59] justify-end" : "bg-slate-200 justify-start"
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-sm" />
                </button>
              </div>
            </div>
          </Panel>

          <Panel title="System Info" subtitle="HP Environment protection nodes" icon={HelpCircle}>
            <div className="space-y-2 text-xs font-semibold text-slate-600 leading-relaxed">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span>Ecosystem Version</span>
                <span className="font-bold text-slate-800">1.0.0 (Production Build)</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span>Central API Connection</span>
                <span className="font-bold text-[#0E6E59]">{apiUrl}</span>
              </div>
              <div className="flex justify-between">
                <span>Ledger Security Node</span>
                <span className="font-bold text-slate-800">SHA-256 Enabled</span>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
