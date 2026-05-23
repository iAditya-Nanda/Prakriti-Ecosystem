import React, { useState } from "react";
import { Leaf, Lock, Mail, User, ShieldCheck } from "lucide-react";

interface SignUpProps {
  onSignUpSuccess: () => void;
  onNavigateToLogin: () => void;
}

export default function SignUp({ onSignUpSuccess, onNavigateToLogin }: SignUpProps) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("verifier");
  const [verifierKey, setVerifierKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !contact.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    if (role === "verifier" && verifierKey !== "prakriti@admin") {
      setError("Invalid verifier registration key.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
      const res = await fetch(`${apiUrl}/api/v1/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          contact: contact.trim(),
          password: password.trim(),
          role: role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      setSuccessMsg("Registration successful! Redirecting to login...");
      setTimeout(() => {
        onSignUpSuccess();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Something went wrong during signup.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-[#0E6E59] overflow-hidden font-sans">
      {/* Curved abstract leaf overlay in top-left */}
      <div className="absolute top-0 left-0 opacity-30 select-none pointer-events-none">
        <svg height="220" width="220" viewBox="0 0 160 160">
          <path
            d="M-20 -20 C35 -20, 95 20, 95 80 C95 140, 25 160, -20 160 Z"
            fill="#116D59"
          />
          <path
            d="M-40 -40 C25 -40, 75 0, 75 55 C75 110, 15 115, -40 115 Z"
            fill="#116D59"
            opacity="0.8"
          />
        </svg>
      </div>

      {/* Solid green branding and greeting area */}
      <div className="absolute top-10 left-10 md:left-20 text-white z-10 hidden sm:block">
        <h1 className="text-4xl font-extrabold tracking-tight">Join Us!</h1>
        <p className="text-emerald-200 mt-1 font-medium">Create your Prakriti operator account</p>
      </div>

      {/* Curved white background panel */}
      <div className="w-full max-w-md mx-4 p-8 rounded-[2.5rem] bg-[#EFF2F1] shadow-2xl relative z-10 border border-[#D8DFDC]/50 my-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-[#0E6E59] flex items-center justify-center text-white shadow-md">
            <Leaf size={20} />
          </div>
          <h2 className="text-2xl font-bold text-[#0E6E59]">Sign Up</h2>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-4">
          {/* Full Name */}
          <div className="flex items-center bg-white rounded-full px-4 h-12 shadow-sm border border-transparent focus-within:border-[#A6D5CB] transition-all">
            <User size={18} className="text-[#8AA090] mr-2" />
            <input
              type="text"
              placeholder="Full Name"
              className="flex-1 bg-transparent border-none outline-none text-sm text-[#2E3B30] font-medium"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Email or Phone */}
          <div className="flex items-center bg-white rounded-full px-4 h-12 shadow-sm border border-transparent focus-within:border-[#A6D5CB] transition-all">
            <Mail size={18} className="text-[#8AA090] mr-2" />
            <input
              type="text"
              placeholder="Email or Contact Number"
              className="flex-1 bg-transparent border-none outline-none text-sm text-[#2E3B30] font-medium"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div className="flex items-center bg-white rounded-full px-4 h-12 shadow-sm border border-transparent focus-within:border-[#A6D5CB] transition-all">
            <Lock size={18} className="text-[#8AA090] mr-2" />
            <input
              type="password"
              placeholder="Password"
              className="flex-1 bg-transparent border-none outline-none text-sm text-[#2E3B30] font-medium"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Role Choice */}
          <div className="mt-2">
            <p className="text-[11px] text-[#8AA094] font-bold uppercase tracking-wider mb-2">Registry Role</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRole("verifier")}
                className={`px-4 py-2 rounded-full text-xs font-semibold shadow-sm transition-all border ${
                  role === "verifier"
                    ? "border-[#0E6E59] bg-[#EFF6F4] text-[#0E6E59]"
                    : "border-[#D8DFDC] bg-white text-[#8AA094]"
                }`}
              >
                Verifier
              </button>
              <button
                type="button"
                onClick={() => setRole("business")}
                className={`px-4 py-2 rounded-full text-xs font-semibold shadow-sm transition-all border ${
                  role === "business"
                    ? "border-[#0E6E59] bg-[#EFF6F4] text-[#0E6E59]"
                    : "border-[#D8DFDC] bg-white text-[#8AA094]"
                }`}
              >
                Business Operator
              </button>
            </div>
          </div>

          {/* Verifier Secret Key (only visible when role == verifier) */}
          {role === "verifier" && (
            <div className="flex items-center bg-white rounded-full px-4 h-12 shadow-sm border border-transparent focus-within:border-[#A6D5CB] transition-all animate-fade-in">
              <ShieldCheck size={18} className="text-[#8AA090] mr-2" />
              <input
                type="password"
                placeholder="Verifier Secret Key (prakriti@admin)"
                className="flex-1 bg-transparent border-none outline-none text-sm text-[#2E3B30] font-medium"
                value={verifierKey}
                onChange={(e) => setVerifierKey(e.target.value)}
                required
              />
            </div>
          )}

          {/* SignUp Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-full bg-[#0E6E59] hover:bg-[#0B5847] active:scale-[0.98] transition-all text-white font-bold tracking-wide shadow-md flex items-center justify-center disabled:opacity-60 disabled:pointer-events-none mt-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "Sign Up"
            )}
          </button>
        </form>

        {/* Separator */}
        <div className="flex items-center my-6">
          <div className="flex-1 h-[1px] bg-[#D8DFDC]" />
          <span className="mx-3 text-[11px] font-bold text-[#8AA094] uppercase tracking-wider">Or</span>
          <div className="flex-1 h-[1px] bg-[#D8DFDC]" />
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-center text-xs">
          <span className="text-[#8AA094] font-medium">Already have an account? </span>
          <button
            onClick={onNavigateToLogin}
            className="text-[#0E6E59] font-bold ml-1 hover:underline outline-none"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}
