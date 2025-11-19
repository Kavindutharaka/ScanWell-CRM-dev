import React, { useState, useEffect } from "react";
import {
  MessageCircleHeart,
  MessageCircle,
  Search,
  Filter,
  ChevronDown,
  Users,
  Share2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FileCheck,
  X,
  UserPlus,
  Plus,
} from "lucide-react";
import Leads from "./Leads";
import { bulkApproveLeads, bulkRejectLeads } from "../../api/LeadApi";

export default function LeadSec({ modalOpen }) {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [reviewMode, setReviewMode] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [filterStatus, setFilterStatus] = useState(null); // 'pending', 'quick-review', or null
  const [leadCounts, setLeadCounts] = useState({ pending: 0, quickReview: 0 });

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Handle refresh
  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1500);
  };

  // Handle bulk approve
  const handleBulkApprove = async () => {
    if (selectedLeads.length === 0) {
      alert('Please select leads to approve');
      return;
    }
    if (window.confirm(`Approve ${selectedLeads.length} selected lead(s)?`)) {
      try {
        await bulkApproveLeads(selectedLeads);
        alert(`${selectedLeads.length} lead(s) approved successfully!`);
        setSelectedLeads([]);
      } catch (error) {
        alert('Failed to approve leads. Please try again.');
      }
    }
  };

  // Handle bulk reject
  const handleBulkReject = async () => {
    if (selectedLeads.length === 0) {
      alert('Please select leads to reject');
      return;
    }
    if (window.confirm(`Reject ${selectedLeads.length} selected lead(s)?`)) {
      try {
        await bulkRejectLeads(selectedLeads);
        alert(`${selectedLeads.length} lead(s) rejected successfully!`);
        setSelectedLeads([]);
      } catch (error) {
        alert('Failed to reject leads. Please try again.');
      }
    }
  };

  // Handle review mode toggle
  const toggleReviewMode = () => {
    setReviewMode(!reviewMode);
    setSelectedLeads([]);
  };

  return (
    <div className="w-full bg-gradient-to-br from-slate-50 to-orange-50/30 min-h-full">
      <style jsx>{`
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
        <div className={`flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 ${!loading ? 'animate-fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <UserPlus className="w-6 h-6 text-orange-600" />
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">
                Social Leads {reviewMode && <span className="text-lg text-orange-600">(Review Mode)</span>}
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:gap-3">
            <button
              onClick={toggleReviewMode}
              className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition-all duration-200 shadow-sm group ${reviewMode
                ? 'bg-orange-100 border-orange-300 text-orange-700'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
              title="Toggle review mode"
            >
              <FileCheck className="w-4 h-4" />
              <span className="hidden sm:inline">
                {reviewMode ? 'Exit Review' : 'Review Mode'}
              </span>
            </button>
            <button
              className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all duration-200 shadow-sm group"
              title="Provide feedback"
            >
              <MessageCircleHeart className="w-4 h-4 text-pink-500 group-hover:text-pink-600" />
              <span className="hidden sm:inline">Feedback</span>
            </button>
            <button
              className="p-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-all duration-200 shadow-sm group"
              title="Messages"
            >
              <MessageCircle className="w-5 h-5 text-slate-600 group-hover:text-slate-800" />
            </button>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-full w-9 h-9 flex items-center justify-center shadow-sm">
              <span className="text-sm font-semibold">K</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-l-lg text-sm font-medium hover:bg-slate-50 transition-all duration-200 shadow-sm group"
                title="Invite team members"
              >
                <Users className="w-4 h-4 text-orange-500 group-hover:text-orange-600" />
                <span className="hidden sm:inline">Invite</span>
                <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded text-xs font-medium">1</span>
              </button>
              <button
                className="p-2 bg-white border border-slate-300 border-l-0 rounded-r-lg hover:bg-slate-50 transition-all duration-200 shadow-sm group"
                title="Share leads"
              >
                <Share2 className="w-4 h-4 text-slate-600 group-hover:text-slate-800" />
              </button>
            </div>
          </div>
        </div>
        
        <div className={`flex flex-col sm:flex-row gap-4 py-4 border-t border-slate-200 mb-6 ${!loading ? 'animate-fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
          {reviewMode ? (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBulkApprove}
                    disabled={selectedLeads.length === 0}
                    className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
                    title="Approve selected leads"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>Approve ({selectedLeads.length})</span>
                  </button>
                  <button
                    onClick={handleBulkReject}
                    disabled={selectedLeads.length === 0}
                    className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
                    title="Reject selected leads"
                  >
                    <XCircle className="w-5 h-5" />
                    <span>Reject ({selectedLeads.length})</span>
                  </button>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 bg-blue-50 px-3 py-2 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-blue-600" />
                  <span>Select leads to review and approve/reject</span>
                </div>
              </div>
              <div className="flex-1 flex items-center justify-end">
                <div className="relative w-full sm:w-96">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search leads to review..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-sm"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3">
                {modalOpen && (
                  <button
                    onClick={modalOpen}
                    className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
                    title="Add new lead"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Lead</span>
                  </button>
                )}
                <button
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm ${
                    filterStatus === "quick-review"
                      ? "bg-blue-600 text-white"
                      : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
                  }`}
                  title="Quick review pending leads"
                  onClick={() =>
                    setFilterStatus(
                      filterStatus === "quick-review" ? null : "quick-review"
                    )
                  }
                >
                  <Eye className="w-4 h-4" />
                  <span>Quick Review</span>
                  {leadCounts.quickReview > 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                        filterStatus === "quick-review"
                          ? "bg-blue-500 text-white"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {leadCounts.quickReview}
                    </span>
                  )}
                </button>
                <button
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    filterStatus === "pending"
                      ? "bg-amber-600 text-white"
                      : "bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200"
                  }`}
                  title="View pending approvals"
                  onClick={() =>
                    setFilterStatus(filterStatus === "pending" ? null : "pending")
                  }
                >
                  <Clock className="w-4 h-4" />
                  <span>Pending</span>
                  {leadCounts.pending > 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                        filterStatus === "pending"
                          ? "bg-amber-500 text-white"
                          : "bg-amber-200 text-amber-900"
                      }`}
                    >
                      {leadCounts.pending}
                    </span>
                  )}
                </button>
                {filterStatus && (
                  <button
                    className="flex items-center gap-2 px-3 py-2.5 bg-red-100 text-red-800 border border-red-300 rounded-lg text-sm font-medium hover:bg-red-200 transition-all duration-200"
                    title="Clear filter"
                    onClick={() => setFilterStatus(null)}
                  >
                    <X className="w-4 h-4" />
                    <span>Clear Filter</span>
                  </button>
                )}
              </div>
              
              <div className="flex-1 flex items-center justify-end">
                <div className="relative w-full sm:w-96">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search leads..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-sm"
                  />
                </div>
              </div>
            </>
          )}
        </div>
        
        {reviewMode && (
          <div className={`bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6 ${!loading ? 'animate-fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '250ms', animationFillMode: 'both' }}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-slate-700">Approved: 15</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                  <span className="text-sm font-medium text-slate-700">Pending: 7</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium text-slate-700">Rejected: 3</span>
                </div>
              </div>
              <div className="text-sm text-slate-600">
                Total Selected: <span className="font-medium text-orange-600">{selectedLeads.length}</span>
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-6">
          <Leads
            onOpen={modalOpen}
            loading={loading}
            delay={300}
            reviewMode={reviewMode}
            selectedLeads={selectedLeads}
            setSelectedLeads={setSelectedLeads}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            setLeadCounts={setLeadCounts}
          />
        </div>
        
        <div className="fixed bottom-6 right-6 z-30">
          <button
            onClick={handleRefresh}
            className="bg-orange-600 hover:bg-orange-700 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 group"
            title="Refresh Leads"
          >
            <svg
              className={`w-5 h-5 transition-transform duration-200 ${loading ? 'animate-spin' : 'group-hover:rotate-180'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        <div className="h-8"></div>
      </div>
    </div>
  );
}