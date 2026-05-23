import React, { useState } from "react";
import { User, Shield, Phone, Mail, Award, Coins } from "lucide-react";
import Panel from "../../components/common/Panel";

interface ProfilePageProps {
  user: {
    id: number;
    name: string;
    contact: string;
    role: string;
    wallet_address?: string;
    balance?: number;
  };
  onProfileUpdate: (updatedUser: any) => void;
  apiUrl: string;
}

export default function ProfilePage({ user, onProfileUpdate, apiUrl }: ProfilePageProps) {
  const [name, setName] = useState(user.name);
  const [contact, setContact] = useState(user.contact);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("prakriti_token");
      const res = await fetch(`${apiUrl}/api/v1/auth/profile/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ name, contact }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Profile updated successfully!");
        onProfileUpdate({
          ...user,
          name: data.user.name,
          contact: data.user.contact,
        });
      } else {
        alert(data.error || "Failed to update profile.");
      }
    } catch (err) {
      alert("Error updating profile. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Verifier Control Console</p>
          <h2 className="text-2xl font-black text-slate-800 mt-1">Verifier Profile Details</h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Manage your credentials and view ecological validation records.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side: Summary Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-[#0E6E59]" />
            <div className="w-20 h-20 rounded-full bg-[#EFF6F4] text-[#0E6E59] border border-emerald-100 flex items-center justify-center mx-auto mt-4 shadow-sm">
              <User size={36} />
            </div>
            
            <h3 className="text-lg font-black text-slate-800 mt-4">{user.name}</h3>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-[#0E6E59] uppercase tracking-wider mt-2">
              <Shield size={10} /> {user.role}
            </span>

            {/* Sub Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100 text-xs">
              <div className="text-center">
                <p className="text-slate-400 font-semibold">Ledger Balance</p>
                <p className="text-sm font-bold text-[#0E6E59] mt-0.5">{user.balance || 0} GP</p>
              </div>
              <div className="text-center">
                <p className="text-slate-400 font-semibold">Status</p>
                <p className="text-sm font-bold text-emerald-600 mt-0.5">Active</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Editor & Settings */}
        <div className="md:col-span-2 space-y-6">
          <Panel title="Edit Personal Information" subtitle="Update your profile contact details" icon={User}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Verifier Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 h-11 rounded-2xl border border-slate-200 focus:border-[#0E6E59] bg-[#F8F9F8] text-sm text-slate-700 font-semibold transition-all outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Email / Contact Info
                </label>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="w-full px-4 h-11 rounded-2xl border border-slate-200 focus:border-[#0E6E59] bg-[#F8F9F8] text-sm text-slate-700 font-semibold transition-all outline-none"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-full bg-[#0E6E59] hover:bg-[#0B5847] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50 active:scale-[0.99] outline-none"
                >
                  {loading ? "Updating Profile..." : "Save Details"}
                </button>
              </div>
            </form>
          </Panel>

          <Panel title="Blockchain Wallet Details" subtitle="Cryptographic node parameters" icon={Coins}>
            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  Blockchain Wallet Address
                </p>
                <p className="text-slate-700 font-mono font-bold select-all break-all mt-1">
                  {user.wallet_address || "GP_MASTER_WALLET_ADDRESS"}
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    Signature Type
                  </p>
                  <p className="text-slate-700 font-bold mt-1">
                    SHA256 Cryptographic Block Signature
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-[#0E6E59]">
                  <Award size={18} />
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
