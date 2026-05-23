import React, { useState } from "react";
import { RefreshCw, MapPin, Clock, Camera, Leaf, Check, X, Search } from "lucide-react";
import { Submission } from "../../types";

interface VerifierQueueProps {
  submissions: Submission[];
  loading: boolean;
  error: string;
  onRefresh: () => void;
  onReview: (action: "approve" | "reject", remarks: string, submissionId: number) => void;
  apiUrl: string;
}

export default function VerifierQueue({
  submissions,
  loading,
  error,
  onRefresh,
  onReview,
  apiUrl,
}: VerifierQueueProps) {
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [remarks, setRemarks] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const handleAction = (action: "approve" | "reject") => {
    if (selectedSubmission) {
      onReview(action, remarks, selectedSubmission.id);
    }
    setSelectedSubmission(null);
    setRemarks("");
  };

  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch =
      sub.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.user_id.toString().includes(searchQuery);
      
    const matchesFilter = filterStatus === "all" ? true : sub.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="grid lg:grid-cols-3 gap-6 animate-fade-in">
      {/* Submissions List Panel */}
      <div className="lg:col-span-1 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
            Verification Queue ({filteredSubmissions.length})
          </h2>
          <button
            onClick={onRefresh}
            className="text-[#0E6E59] hover:underline flex items-center gap-1 text-xs outline-none font-bold"
          >
            <RefreshCw size={12} /> Refresh
          </button>
        </div>

        {/* Search & Filters */}
        <div className="space-y-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 h-9">
            <Search size={14} className="text-slate-400 mr-2" />
            <input
              type="text"
              placeholder="Search by title, location..."
              className="flex-1 bg-transparent border-none outline-none text-xs text-slate-700 font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-1.5 pt-1">
            {(["all", "pending", "approved", "rejected"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all border outline-none ${
                  filterStatus === status
                    ? "border-[#0E6E59] bg-[#EFF6F4] text-[#0E6E59]"
                    : "border-slate-200 bg-white text-slate-400 hover:border-slate-300"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Submissions queue cards */}
        {loading ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-xs font-semibold text-slate-500 shadow-sm animate-pulse">
            Loading eco-actions queue...
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-700 border border-red-200 text-xs rounded-xl font-medium shadow-sm">
            {error}
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-xs font-semibold text-slate-400 shadow-sm">
            No matches found.
          </div>
        ) : (
          <div className="space-y-2 overflow-y-auto max-h-[60vh] pr-1">
            {filteredSubmissions.map((sub) => (
              <div
                key={sub.id}
                onClick={() => setSelectedSubmission(sub)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white ${
                  selectedSubmission?.id === sub.id
                    ? "border-[#0E6E59] shadow-md ring-1 ring-[#0E6E59]"
                    : "border-slate-200 hover:border-slate-300 shadow-sm"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${
                      sub.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : sub.status === "approved"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {sub.status}
                  </span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold">
                    <Clock size={10} /> {new Date(sub.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-800 truncate">{sub.title}</h4>
                <p className="text-[10px] text-slate-500 mt-1 font-semibold flex items-center gap-1">
                  <MapPin size={10} /> {sub.location}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Verification Detailed Side-by-Side Panel */}
      <div className="lg:col-span-2">
        {selectedSubmission ? (
          <div className="bg-white rounded-[2rem] border border-slate-200 p-6 space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">{selectedSubmission.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5 font-semibold">
                  Tourist ID: #{selectedSubmission.user_id} • Status:{" "}
                  <span className="capitalize text-[#0E6E59] font-bold">{selectedSubmission.status}</span>
                </p>
              </div>

              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 outline-none"
              >
                Close Details
              </button>
            </div>

            {/* User captured image vs LLaVA downscaled AI vision diagnositics overlays */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* User Photo */}
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/80">
                <h4 className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1.5">
                  <Camera size={14} /> Captured Proof Photo
                </h4>
                {selectedSubmission.image ? (
                  <img
                    src={`${apiUrl}${selectedSubmission.image}`}
                    alt="Captured visual"
                    className="w-full h-48 object-cover rounded-xl border border-slate-200"
                  />
                ) : (
                  <div className="w-full h-48 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-xs text-slate-400 font-semibold bg-slate-100">
                    No photo provided
                  </div>
                )}
              </div>

              {/* LLaVA Vision overlay diagnostics */}
              <div className="rounded-2xl bg-[#EFF6F4] p-4 border border-[#D8DFDC]/60">
                <h4 className="text-xs font-bold text-[#0E6E59] mb-2 flex items-center gap-1.5">
                  <Leaf size={14} /> AI Copilot Vision Diagnostics
                </h4>
                {selectedSubmission.scanned_image ? (
                  <img
                    src={`${apiUrl}${selectedSubmission.scanned_image}`}
                    alt="AI Downscaled classification"
                    className="w-full h-48 object-cover rounded-xl border border-slate-200"
                  />
                ) : (
                  <div className="w-full h-48 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-xs text-slate-400 font-semibold bg-slate-100">
                    AI vision overlays not generated
                  </div>
                )}
              </div>
            </div>

            {/* Assessment Remarks + Approval Triggers */}
            {selectedSubmission.status === "pending" && (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Reviewer Assessment Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide disposal comments or specify why a submission is flagged/approved..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full border border-slate-200 focus:border-[#A6D5CB] outline-none rounded-xl p-3 text-xs bg-slate-50 text-slate-800 font-medium"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleAction("approve")}
                    className="flex-1 h-11 bg-[#0E6E59] hover:bg-[#0B5847] text-white text-xs font-bold rounded-full flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98] outline-none"
                  >
                    <Check size={16} /> Approve & Issue Reward
                  </button>
                  <button
                    onClick={() => handleAction("reject")}
                    className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-full flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98] outline-none"
                  >
                    <X size={16} /> Reject Submission
                  </button>
                </div>
              </div>
            )}

            {/* Verification Metadata logs */}
            {selectedSubmission.status !== "pending" && (
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs shadow-xs">
                <p className="font-bold text-slate-600 mb-1">Verification Records</p>
                <div className="space-y-1 mt-2 text-[#8AA094] font-semibold leading-relaxed">
                  <p className="text-slate-600">Verified By Verifier ID: #{selectedSubmission.reviewer_id || "SYSTEM"}</p>
                  {selectedSubmission.remarks && <p className="text-slate-600">Remarks: "{selectedSubmission.remarks}"</p>}
                  {selectedSubmission.blockchain_tx && (
                    <p className="flex items-center gap-1 truncate text-slate-600">
                      PoW Blockchain Tx ID: <span className="font-mono text-[10px] text-[#0E6E59]">{selectedSubmission.blockchain_tx}</span>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-[60vh] rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 bg-white shadow-sm">
            <Leaf size={48} className="stroke-slate-300 mb-2" />
            <p className="text-xs font-bold text-slate-500">Select an eco-action item to inspect</p>
            <p className="text-[10px] mt-1 text-slate-400 font-semibold">Side-by-side photo proofs will render here</p>
          </div>
        )}
      </div>
    </div>
  );
}
