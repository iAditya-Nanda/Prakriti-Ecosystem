import React, { useState } from "react";
import { RefreshCw, Clock, BadgeCheck, X, Check, Search, MapPin } from "lucide-react";
import { BusinessApplication } from "../../types";

interface BusinessRequestsProps {
  applications: BusinessApplication[];
  loading: boolean;
  error: string;
  onRefresh: () => void;
  onReview: (action: "approve" | "reject", applicationId: number) => void;
  apiUrl: string;
}

export default function BusinessRequests({
  applications,
  loading,
  error,
  onRefresh,
  onReview,
  apiUrl,
}: BusinessRequestsProps) {
  const [selectedApplication, setSelectedApplication] = useState<BusinessApplication | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const handleAction = (action: "approve" | "reject") => {
    if (selectedApplication) {
      onReview(action, selectedApplication.id);
    }
    setSelectedApplication(null);
  };

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.business_id.toString().includes(searchQuery);
      
    const matchesFilter = filterStatus === "all" ? true : app.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="grid lg:grid-cols-3 gap-6 animate-fade-in">
      {/* Applications List Column */}
      <div className="lg:col-span-1 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
            Green Stamp Requests ({filteredApplications.length})
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
              placeholder="Search by business ID or details..."
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

        {/* Applications cards */}
        {loading ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-xs font-semibold text-slate-505 text-slate-500 shadow-sm animate-pulse">
            Loading business stamp requests...
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-700 border border-red-200 text-xs rounded-xl font-medium shadow-sm">
            {error}
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-xs font-semibold text-slate-400 shadow-sm">
            No matches found.
          </div>
        ) : (
          <div className="space-y-2 overflow-y-auto max-h-[60vh] pr-1">
            {filteredApplications.map((app) => (
              <div
                key={app.id}
                onClick={() => setSelectedApplication(app)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white ${
                  selectedApplication?.id === app.id
                    ? "border-[#0E6E59] shadow-md ring-1 ring-[#0E6E59]"
                    : "border-slate-200 hover:border-slate-300 shadow-sm"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${
                      app.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : app.status === "approved"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {app.status}
                  </span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold">
                    <Clock size={10} /> {new Date(app.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-800 truncate">Business ID: #{app.business_id}</h4>
                <p className="text-[10px] text-slate-505 mt-1 font-semibold leading-relaxed truncate text-slate-500">
                  "{app.description}"
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Application Detail Column */}
      <div className="lg:col-span-2">
        {selectedApplication ? (
          <div className="bg-white rounded-[2rem] border border-slate-200 p-6 space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Green Application ID: #{selectedApplication.id}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 font-semibold">
                  Business Operator ID: #{selectedApplication.business_id} • Status:{" "}
                  <span className="capitalize text-[#0E6E59] font-bold">{selectedApplication.status}</span>
                </p>
              </div>

              <button
                onClick={() => setSelectedApplication(null)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 outline-none"
              >
                Close Details
              </button>
            </div>

            {/* Business Description */}
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Eco Proposal Description
              </h4>
              <p className="text-xs leading-relaxed text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 font-medium">
                "{selectedApplication.description}"
              </p>
            </div>

            {/* Checklist Audit */}
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Green Practices Checklist
              </h4>
              <div className="grid md:grid-cols-2 gap-2 mt-2">
                {Object.entries(selectedApplication.checklist || {}).map(([key, val]) => (
                  <div
                    key={key}
                    className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200/60 text-xs font-semibold text-slate-700"
                  >
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-white ${
                        val ? "bg-emerald-500" : "bg-slate-300"
                      }`}
                    >
                      {val ? <Check size={12} /> : <X size={12} />}
                    </div>
                    <span className="capitalize">{key.replace(/_/g, " ")}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Uploaded Evidence Photos */}
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Infrastructure Proof Photos
              </h4>
              <div className="grid sm:grid-cols-2 gap-3 mt-2">
                {(selectedApplication.photos || []).map((path, index) => (
                  <div key={index} className="rounded-xl border border-slate-200 overflow-hidden">
                    <img
                      src={`${apiUrl}${path}`}
                      alt={`Infrastructure visual ${index}`}
                      className="w-full h-40 object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Action Review controls */}
            {selectedApplication.status === "pending" && (
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => handleAction("approve")}
                  className="flex-1 h-11 bg-[#0E6E59] hover:bg-[#0B5847] text-white text-xs font-bold rounded-full flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98] outline-none"
                >
                  <BadgeCheck size={16} /> Approve & Grant Green Stamp
                </button>
                <button
                  onClick={() => handleAction("reject")}
                  className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-full flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98] outline-none"
                >
                  <X size={16} /> Reject Application
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="h-[60vh] rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 bg-white shadow-sm">
            <BadgeCheck size={48} className="stroke-slate-300 mb-2" />
            <p className="text-xs font-bold text-slate-500">Select a green certification application to inspect</p>
            <p className="text-[10px] mt-1 text-slate-400 font-semibold">Checks and proofs will render here</p>
          </div>
        )}
      </div>
    </div>
  );
}
