import React, { useState } from "react";
import { Leaf, Lock, Mail, Eye, EyeOff } from "lucide-react";

interface LoginProps {
  onLoginSuccess: (token: string, role: string, user: any) => void;
  onNavigateToSignUp: () => void;
}

export default function Login({ onLoginSuccess, onNavigateToSignUp }: LoginProps) {
  const [emailOrPhone, setEmailOrPhone] = useState("verifier@prakriti.ai");
  const [password, setPassword] = useState("prakriti@verifier");
  const [role, setRole] = useState("verifier");
  const [secureText, setSecureText] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePrefill = (selectedRole: string) => {
    setRole(selectedRole);
    if (selectedRole === "verifier") {
      setEmailOrPhone("verifier@prakriti.ai");
      setPassword("prakriti@verifier");
    } else if (selectedRole === "business") {
      setEmailOrPhone("business@prakriti.ai");
      setPassword("prakriti@business");
    }
  };

  const handleEmailChange = (text: string) => {
    setEmailOrPhone(text);
    const trimmed = text.trim();
    if (trimmed === "verifier@prakriti.ai") {
      setRole("verifier");
      setPassword("prakriti@verifier");
    } else if (trimmed === "business@prakriti.ai") {
      setRole("business");
      setPassword("prakriti@business");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrPhone.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setError("");
    setLoading(true);

    // Map placeholder emails to master contact expected by backend
    let contactToSend = emailOrPhone.trim();
    if (contactToSend === "verifier@prakriti.ai" || contactToSend === "business@prakriti.ai") {
      contactToSend = "1234567890";
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
      const res = await fetch(`${apiUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact: contactToSend,
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      if (data.user.role === "user") {
        throw new Error("Access denied. The dashboard is restricted to Verifiers and Business Operators.");
      }

      // Invoke parent login completion callback
      onLoginSuccess(data.token || data.accessToken, data.user.role, data.user);
    } catch (err: any) {
      setError(err.message || "Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-[#0E6E59] overflow-hidden font-sans">
      {/* Curved abstract leaf overlay in top-left matching mobile */}
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
        <h1 className="text-4xl font-extrabold tracking-tight">Hello!</h1>
        <p className="text-emerald-200 mt-1 font-medium">Welcome to Prakriti Control Center</p>
      </div>

      {/* Custom SVG Potted Plant sitting on the card curve edge */}
      <div className="absolute right-12 top-10 md:right-24 md:top-14 z-20 hidden md:block animate-bounce" style={{ animationDuration: "3s" }}>
        <svg height="120" width="70" viewBox="0 0 70 120">
          <path d="M35 70 C20 40, 20 5, 35 0 C50 5, 50 40, 35 70 Z" fill="#2E7E6B" />
          <path d="M35 70 C12 50, 8 20, 24 8 C32 24, 32 50, 35 70 Z" fill="#4AA792" opacity="0.9" />
          <path d="M35 70 C58 50, 62 20, 46 8 C38 24, 38 50, 35 70 Z" fill="#226454" opacity="0.95" />
          <path d="M22 70 L48 70 L42 96 L28 96 Z" fill="#FFFFFF" />
          <ellipse cx="35" cy="99" rx="14" ry="2.5" fill="rgba(0,0,0,0.15)" />
        </svg>
      </div>

      {/* Main asymmetric visual curve background card */}
      <div className="w-full max-w-md mx-4 p-8 rounded-[2.5rem] bg-[#EFF2F1] shadow-2xl relative z-10 border border-[#D8DFDC]/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-[#0E6E59] flex items-center justify-center text-white shadow-md">
            <Leaf size={20} />
          </div>
          <h2 className="text-2xl font-bold text-[#0E6E59]">Login</h2>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email Input */}
          <div className="flex items-center bg-white rounded-full px-4 h-12 shadow-sm border border-transparent focus-within:border-[#A6D5CB] transition-all">
            <Mail size={18} className="text-[#8AA090] mr-2" />
            <input
              type="text"
              placeholder="Email or Contact"
              className="flex-1 bg-transparent border-none outline-none text-sm text-[#2E3B30] font-medium"
              value={emailOrPhone}
              onChange={(e) => handleEmailChange(e.target.value)}
            />
          </div>

          {/* Password Input */}
          <div className="flex items-center bg-white rounded-full px-4 h-12 shadow-sm border border-transparent focus-within:border-[#A6D5CB] transition-all">
            <Lock size={18} className="text-[#8AA090] mr-2" />
            <input
              type={secureText ? "password" : "text"}
              placeholder="Password"
              className="flex-1 bg-transparent border-none outline-none text-sm text-[#2E3B30] font-medium"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setSecureText(!secureText)}
              className="p-1 text-[#8AA090] hover:text-[#0E6E59] transition-colors"
            >
              {secureText ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Quick Prefill badges */}
          <div className="mt-2">
            <p className="text-[11px] text-[#8AA094] font-bold uppercase tracking-wider mb-2">Quick Fill</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handlePrefill("verifier")}
                className={`px-4 py-2 rounded-full text-xs font-semibold shadow-sm transition-all border ${
                  role === "verifier"
                    ? "border-[#0E6E59] bg-[#EFF6F4] text-[#0E6E59]"
                    : "border-[#D8DFDC] bg-white text-[#8AA094]"
                }`}
              >
                Verifier Console
              </button>
              <button
                type="button"
                onClick={() => handlePrefill("business")}
                className={`px-4 py-2 rounded-full text-xs font-semibold shadow-sm transition-all border ${
                  role === "business"
                    ? "border-[#0E6E59] bg-[#EFF6F4] text-[#0E6E59]"
                    : "border-[#D8DFDC] bg-white text-[#8AA094]"
                }`}
              >
                Business Admin
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <a href="#forgot" className="text-xs font-bold text-[#0E6E59] hover:underline">
              Forgot Password?
            </a>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-full bg-[#0E6E59] hover:bg-[#0B5847] active:scale-[0.98] transition-all text-white font-bold tracking-wide shadow-md flex items-center justify-center disabled:opacity-60 disabled:pointer-events-none mt-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "Login"
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
          <span className="text-[#8AA094] font-medium">Don't have an account? </span>
          <button
            onClick={onNavigateToSignUp}
            className="text-[#0E6E59] font-bold ml-1 hover:underline outline-none"
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}
