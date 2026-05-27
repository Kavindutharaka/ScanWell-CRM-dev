import React, { useState, useEffect } from "react";
import {
  Search,
  UserPlus,
  Upload,
  FileSpreadsheet,
} from "lucide-react";
import Leads from "./Leads";

export default function LeadSec({ modalOpen }) {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    setRefreshTrigger((prev) => prev + 1);
    setTimeout(() => setLoading(false), 1000);
  };

  const handleImportSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="w-full bg-gradient-to-br from-slate-50 to-orange-50/30 min-h-full">
      <style>{`
        @keyframes slideInLeft {
          0% { opacity: 0; transform: translateX(-100px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-slideInLeft {
          animation: slideInLeft 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>

      <div className="p-4 md:p-6 lg:p-8 max-w-[102rem] mx-auto pb-8">
        {/* Page Header */}
        <div
          className={`flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 ${
            !loading ? "animate-fadeInUp" : "opacity-0"
          }`}
          style={{ animationDelay: "100ms", animationFillMode: "both" }}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <UserPlus className="w-6 h-6 text-orange-600" />
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">
                Leads
              </h1>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div
          className={`flex flex-col sm:flex-row gap-4 py-4 border-t border-slate-200 mb-6 ${
            !loading ? "animate-fadeInUp" : "opacity-0"
          }`}
          style={{ animationDelay: "200ms", animationFillMode: "both" }}
        >
          <div className="flex flex-wrap items-center gap-3">
            {modalOpen && (
              <button
                onClick={modalOpen}
                className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
                title="Upload Excel file to import leads"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Excel</span>
              </button>
            )}
          </div>

          <div className="flex-1 flex items-center justify-end">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search leads by name, email, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Leads Table */}
        <div className="space-y-6">
          <Leads
            onOpen={modalOpen}
            loading={loading}
            delay={300}
            searchQuery={searchQuery}
            refreshTrigger={refreshTrigger}
          />
        </div>

        {/* Refresh Button */}
        <div className="fixed bottom-6 right-6 z-30">
          <button
            onClick={handleRefresh}
            className="bg-orange-600 hover:bg-orange-700 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 group"
            title="Refresh Leads"
          >
            <svg
              className={`w-5 h-5 transition-transform duration-200 ${
                loading ? "animate-spin" : "group-hover:rotate-180"
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
        <div className="h-8"></div>
      </div>
    </div>
  );
}
