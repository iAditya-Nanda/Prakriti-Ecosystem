import React, { useState, useEffect } from "react";
import Login from "./screens/auth/Login";
import SignUp from "./screens/auth/SignUp";
import DashboardPro from "./screens/verifier/DashboardPro";

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [view, setView] = useState<"login" | "signup">("login");

  // Load and verify persistent session on boot
  useEffect(() => {
    const savedToken = localStorage.getItem("prakriti_token");
    const savedRole = localStorage.getItem("prakriti_role");
    const savedUser = localStorage.getItem("prakriti_user");

    if (savedToken && savedRole && savedUser) {
      const verifySession = async () => {
        try {
          const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
          const res = await fetch(`${apiUrl}/api/v1/auth/verify-token`, {
            headers: { "Authorization": `Bearer ${savedToken}` }
          });
          if (res.status === 401) {
            handleLogout();
          } else {
            setToken(savedToken);
            setRole(savedRole);
            setUser(JSON.parse(savedUser));
          }
        } catch (err) {
          // Keep the cached session on network errors for offline/local resilience
          setToken(savedToken);
          setRole(savedRole);
          setUser(JSON.parse(savedUser));
        }
      };
      verifySession();
    }
  }, []);

  const handleLoginSuccess = (userToken: string, userRole: string, userProfile: any) => {
    localStorage.setItem("prakriti_token", userToken);
    localStorage.setItem("prakriti_role", userRole);
    localStorage.setItem("prakriti_user", JSON.stringify(userProfile));

    setToken(userToken);
    setRole(userRole);
    setUser(userProfile);
  };

  const handleLogout = () => {
    localStorage.removeItem("prakriti_token");
    localStorage.removeItem("prakriti_role");
    localStorage.removeItem("prakriti_user");

    setToken(null);
    setRole(null);
    setUser(null);
    setView("login");
  };

  // Switch between pages based on Auth state
  if (token && role && user) {
    return <DashboardPro user={user} onLogout={handleLogout} />;
  }

  if (view === "signup") {
    return (
      <SignUp
        onSignUpSuccess={() => setView("login")}
        onNavigateToLogin={() => setView("login")}
      />
    );
  }

  return (
    <Login
      onLoginSuccess={handleLoginSuccess}
      onNavigateToSignUp={() => setView("signup")}
    />
  );
}
