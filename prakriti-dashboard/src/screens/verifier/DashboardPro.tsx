import React, { useMemo, useState, useEffect } from "react";
import { LogOut } from "lucide-react";
import { User, WeeklyStats, BCStats, Submission, BusinessApplication } from "../../types";
import Sidebar, { SidebarView } from "../../components/admin/Sidebar";
import VerifierDashboard from "./VerifierDashboard";
import VerifierQueue from "./VerifierQueue";
import BusinessRequests from "./BusinessRequests";
import ImpactReports from "./ImpactReports";
import ProfilePage from "./profile-page";
import SettingsPage from "./settings-page";

interface DashboardProProps {
  user: User;
  onLogout: () => void;
}

export default function DashboardPro({ user, onLogout }: DashboardProProps) {
  const [activeView, setActiveView] = useState<SidebarView>("dashboard");
  const [currentUser, setCurrentUser] = useState<User>(user);

  // Dashboard Stats
  const [totals, setTotals] = useState<WeeklyStats>({
    ecoActions: 0,
    activeTourists: 0,
    certifiedBusinesses: 0,
    complianceRate: 0,
  });

  const [weeklyActions] = useState<number[]>([3100, 3220, 3340, 3525, 3440, 3610, 3740, 3925]);
  const [regions] = useState([
    { name: "Kullu", pct: 28 },
    { name: "Shimla", pct: 22 },
    { name: "Kangra", pct: 18 },
    { name: "Lahaul & Spiti", pct: 12 },
    { name: "Kinnaur", pct: 10 },
    { name: "Others", pct: 10 },
  ]);

  // Verifier metrics stack
  const [verifierStats, setVerifierStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  // Blockchain Stats
  const [bcStats, setBcStats] = useState<BCStats | null>(null);
  const [blockchainLoading, setBlockchainLoading] = useState(false);

  // Verifications Queue State
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [submissionsError, setSubmissionsError] = useState("");

  // Business Green Applications State
  const [applications, setApplications] = useState<BusinessApplication[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [applicationsError, setApplicationsError] = useState("");

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";

  // AI text insights summary
  const insight = useMemo(() => {
    const leader = regions[0];
    return `Eco-actions are active at ${totals.ecoActions.toLocaleString()} verifications this week. ${
      leader.name
    } leads regional participation (${leader.pct}%), with ${totals.activeTourists.toLocaleString()} active tourists and ${totals.certifiedBusinesses.toLocaleString()} green certified businesses indicating high system adoption.`;
  }, [totals, regions]);

  // 1. Fetch dashboard metrics stats
  const fetchStats = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/v1/dashboard/stats`);
      const json = await res.json();
      if (json.totals) {
        setTotals(json.totals);
      }
    } catch (err) {
      console.log("Failed to fetch live stats:", err);
    }
  };

  // 2. Fetch Blockchain Stats
  const fetchBlockchainStats = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/stats`);
      const json = await res.json();
      if (json.success) {
        setBcStats(json.data);
      }
    } catch (err) {
      console.log("Failed to fetch blockchain stats:", err);
    }
  };

  // 3. Fetch Verifications stats matching VerifierDashboard.jsx
  const fetchVerifierStats = async () => {
    try {
      const token = localStorage.getItem("prakriti_token");
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${apiUrl}/api/v1/verifier/${currentUser.id}`, { headers });
      const json = await res.json();
      
      // Handle both standard verifier stats and master bypass details
      const pendingCount = json.pendingVerifications !== undefined 
        ? json.pendingVerifications 
        : (json.pendingCount !== undefined ? json.pendingCount : 0);
      const approvedCount = json.approvedActions !== undefined 
        ? json.approvedActions 
        : (json.verifiedCount !== undefined ? json.verifiedCount : 0);
      const rejectedCount = json.rejectedItems !== undefined ? json.rejectedItems : 0;

      setVerifierStats({
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
      });
    } catch (err) {
      console.log("Failed to fetch verifier stats:", err);
    }
  };

  // 4. Fetch Verifications Queue list
  const fetchSubmissions = async () => {
    setSubmissionsLoading(true);
    setSubmissionsError("");
    try {
      const token = localStorage.getItem("prakriti_token");
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      const res = await fetch(`${apiUrl}/api/v1/submissions/all`, { headers });
      const json = await res.json();
      if (json.submissions) {
        setSubmissions(json.submissions);
      }
    } catch (err) {
      setSubmissionsError("Failed to retrieve submissions queue.");
    } finally {
      setSubmissionsLoading(false);
    }
  };

  // 5. Fetch Green Stamp Requests list
  const fetchApplications = async () => {
    setApplicationsLoading(true);
    setApplicationsError("");
    try {
      const res = await fetch(`${apiUrl}/api/v1/business/applications`);
      const json = await res.json();
      if (json.applications) {
        setApplications(json.applications);
      }
    } catch (err) {
      setApplicationsError("Failed to retrieve green stamp requests.");
    } finally {
      setApplicationsLoading(false);
    }
  };

  // Confirm pending transactions onto the blockchain
  const handleMineBlockchain = async () => {
    setBlockchainLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/mine`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ miner: "SYSTEM" }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Block successfully verified and confirmed to blockchain! Hash: ${data.data.block_hash}`);
        fetchBlockchainStats();
        fetchStats();
      } else {
        alert(data.message || "Failed to confirm block onto blockchain.");
      }
    } catch (err) {
      alert("Failed to connect to blockchain engine.");
    } finally {
      setBlockchainLoading(false);
    }
  };

  // Submit verifier review decisions
  const handleReviewSubmission = async (action: "approve" | "reject", submissionRemarks: string, submissionId: number) => {
    try {
      const res = await fetch(`${apiUrl}/api/v1/submissions/${submissionId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          remarks: submissionRemarks.trim() || `${action === "approve" ? "Approved" : "Rejected"} via dashboard`,
          reviewer_id: currentUser.id,
        }),
      });

      if (res.ok) {
        alert(`Submission ${action}d successfully!`);
        fetchSubmissions();
        fetchVerifierStats();
        fetchStats();
        fetchBlockchainStats();
      } else {
        const data = await res.json();
        alert(data.error || "Review submission failed.");
      }
    } catch (err) {
      alert("Error executing review submission.");
    }
  };

  // Submit Green Stamp review decisions
  const handleReviewApplication = async (action: "approve" | "reject", applicationId: number) => {
    try {
      const res = await fetch(`${apiUrl}/api/v1/business/applications/${applicationId}/review`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        alert(`Business Green Stamp Application ${action}d successfully!`);
        fetchApplications();
        fetchStats();
      } else {
        const data = await res.json();
        alert(data.error || "Review application failed.");
      }
    } catch (err) {
      alert("Error executing Green Stamp review.");
    }
  };

  const handleRefreshAll = () => {
    fetchStats();
    fetchBlockchainStats();
    fetchVerifierStats();
    fetchSubmissions();
    fetchApplications();
  };

  // Lifecycle polling syncs
  useEffect(() => {
    handleRefreshAll();

    const pollingRateConfig = parseInt(localStorage.getItem("prakriti_polling_rate") || "8000", 10);
    const interval = setInterval(() => {
      fetchStats();
      fetchBlockchainStats();
      fetchVerifierStats();
    }, pollingRateConfig);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F9F8] flex font-sans">
      {/* SIDEBAR NAVIGATION */}
      <Sidebar
        activeView={activeView}
        onViewChange={(view) => setActiveView(view)}
        pendingActionsCount={submissions.filter((s) => s.status === "pending").length}
        pendingStampsCount={applications.filter((a) => a.status === "pending").length}
      />

      {/* MAIN VIEWPORT FRAME */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* TOP COMPACT BAR */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200/80 shadow-xs px-6 py-3 flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2ECC71] animate-ping shrink-0" />
            <span className="text-xs font-bold text-[#0E6E59] uppercase tracking-wider">
              HP Green Ledger Network Online
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-xs font-semibold text-slate-500">
              Logged in as <span className="font-bold text-slate-700">{currentUser.name}</span> ({currentUser.role})
            </div>

            <button
              onClick={onLogout}
              className="px-3 py-1.5 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition-all text-xs font-bold flex items-center gap-1.5 outline-none shadow-xs"
              title="Sign Out"
            >
              <LogOut size={14} /> Log Out
            </button>
          </div>
        </header>

        {/* ACTIVE MAIN VIEW CONTENT FRAME */}
        <main className="flex-1 p-6 overflow-y-auto">
          {activeView === "dashboard" && (
            <VerifierDashboard
              user={currentUser}
              verifierStats={verifierStats}
              bcStats={bcStats}
              blockchainLoading={blockchainLoading}
              onMineBlockchain={handleMineBlockchain}
              onRefresh={handleRefreshAll}
              onNavigateToQueue={() => setActiveView("queue")}
              onNavigateToBusiness={() => setActiveView("business")}
              onNavigateToReports={() => setActiveView("reports")}
              weeklyActions={weeklyActions}
              regions={regions}
              insight={insight}
            />
          )}

          {activeView === "queue" && (
            <VerifierQueue
              submissions={submissions}
              loading={submissionsLoading}
              error={submissionsError}
              onRefresh={fetchSubmissions}
              onReview={(action, remarks, subId) => handleReviewSubmission(action, remarks, subId)}
              apiUrl={apiUrl}
            />
          )}

          {activeView === "business" && (
            <BusinessRequests
              applications={applications}
              loading={applicationsLoading}
              error={applicationsError}
              onRefresh={fetchApplications}
              onReview={(action, appId) => handleReviewApplication(action, appId)}
              apiUrl={apiUrl}
            />
          )}

          {activeView === "reports" && <ImpactReports totals={totals} />}

          {activeView === "profile" && (
            <ProfilePage
              user={currentUser}
              onProfileUpdate={(updatedUser) => {
                setCurrentUser(updatedUser);
                localStorage.setItem("prakriti_user", JSON.stringify(updatedUser));
              }}
              apiUrl={apiUrl}
            />
          )}

          {activeView === "settings" && (
            <SettingsPage
              userId={currentUser.id}
              apiUrl={apiUrl}
            />
          )}
        </main>
      </div>
    </div>
  );
}
