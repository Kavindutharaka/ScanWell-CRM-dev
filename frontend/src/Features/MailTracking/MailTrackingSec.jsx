import React, { useState, useEffect, useContext } from "react";
import {
  Search,
  Globe,
  Mail,
  Phone,
  User,
  Edit3,
  Trash2,
  XCircle,
  Check,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { fetchAllWebLeads, updateWebLead, deleteWebLead } from "../../api/WebLeadApi";
import { AuthContext } from "../../context/AuthContext";
import { toast } from '../../components/Toast';
import { confirm } from '../../components/ConfirmDialog';

export default function MailTrackingSec() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showEditModal, setShowEditModal] = useState(null);
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");

  const { permission } = useContext(AuthContext);
  const isAdmin = permission?.IsAdmin || false;

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const loadLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAllWebLeads();
      if (Array.isArray(data)) {
        setLeads(data);
      } else {
        setLeads([]);
      }
    } catch (err) {
      console.error("Error fetching web leads:", err);
      setError("Failed to load web leads. Please try again.");
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const handleRefresh = () => {
    loadLeads();
  };

  // Filter by search
  const filteredLeads = leads.filter((lead) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (lead.name || "").toLowerCase().includes(q) ||
      (lead.email || "").toLowerCase().includes(q) ||
      (lead.tp || "").toLowerCase().includes(q)
    );
  });

  // Sort
  const sortedLeads = [...filteredLeads].sort((a, b) => {
    if (!sortField) return 0;
    const aVal = String(a[sortField] || "").toLowerCase();
    const bVal = String(b[sortField] || "").toLowerCase();
    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedLeads.length / itemsPerPage);
  const paginatedLeads = sortedLeads.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Delete (admin only)
  const handleDelete = async (id) => {
    if (!(await confirm("Are you sure you want to delete this web lead?"))) return;
    try {
      await deleteWebLead(id);
      setLeads((prev) => prev.filter((l) => l.sysId !== id));
    } catch (err) {
      toast.error("Failed to delete web lead. Please try again.");
    }
  };

  // Edit (admin only)
  const handleSaveEdit = async (updatedLead) => {
    try {
      await updateWebLead(updatedLead);
      setLeads((prev) =>
        prev.map((l) => (l.sysId === updatedLead.sysId ? { ...l, ...updatedLead } : l))
      );
      setShowEditModal(null);
    } catch (err) {
      toast.error("Failed to update web lead. Please try again.");
    }
  };

  // Sort header
  const SortableHeader = ({ field, children }) => (
    <th
      className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field &&
          (sortDirection === "asc" ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          ))}
      </div>
    </th>
  );

  // Edit Modal (admin only)
  const EditModal = ({ lead, onClose }) => {
    const [formData, setFormData] = useState({
      sysId: lead.sysId,
      name: lead.name || "",
      tp: lead.tp || "",
      email: lead.email || "",
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      handleSaveEdit(formData);
    };

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Edit Web Lead</h3>
            <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
              <XCircle className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone (TP)</label>
              <input
                type="text"
                value={formData.tp}
                onChange={(e) => setFormData({ ...formData, tp: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors"
              >
                <Check className="w-4 h-4" />
                Save Changes
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-slate-200 text-slate-700 py-2 px-4 rounded-lg hover:bg-slate-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
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

      <main className="p-4 md:p-6 lg:p-8 max-w-[102rem] mx-auto pb-8">
        {/* Page Header */}
        <div
          className={`flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 ${
            !loading ? "animate-fadeInUp" : "opacity-0"
          }`}
          style={{ animationDelay: "100ms", animationFillMode: "both" }}
        >
          <div className="flex items-center gap-3">
            <Globe className="w-6 h-6 text-orange-600" />
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">Web Leads</h1>
          </div>
        </div>

        {/* Toolbar */}
        <div
          className={`flex flex-col sm:flex-row gap-4 py-4 border-t border-slate-200 mb-6 ${
            !loading ? "animate-fadeInUp" : "opacity-0"
          }`}
          style={{ animationDelay: "200ms", animationFillMode: "both" }}
        >
          <div className="flex items-center gap-3">
            <div className="px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg">
              <span className="text-sm font-medium text-orange-700">
                {filteredLeads.length} lead(s)
              </span>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-end">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div
          className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden ${
            !loading ? "animate-fadeInUp" : "opacity-0"
          }`}
          style={{ animationDelay: "300ms", animationFillMode: "both" }}
        >
          {/* Loading */}
          {loading && (
            <div className="p-4 space-y-3 animate-pulse">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-slate-100 rounded"></div>
              ))}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="p-8 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredLeads.length === 0 && (
            <div className="text-center py-12">
              <Globe className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                {searchQuery ? "No Leads Match Search" : "No Web Leads Yet"}
              </h3>
              <p className="text-slate-600 text-lg">
                {searchQuery
                  ? "Try adjusting your search terms."
                  : "Web leads will appear here when submitted through your website."}
              </p>
            </div>
          )}

          {/* Table */}
          {!loading && !error && filteredLeads.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-16">
                        #
                      </th>
                      <SortableHeader field="name">
                        <User className="w-3 h-3" />
                        Name
                      </SortableHeader>
                      <SortableHeader field="tp">
                        <Phone className="w-3 h-3" />
                        Phone (TP)
                      </SortableHeader>
                      <SortableHeader field="email">
                        <Mail className="w-3 h-3" />
                        Email
                      </SortableHeader>
                      {isAdmin && (
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedLeads.map((lead, index) => (
                      <tr
                        key={lead.sysId}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">
                            {lead.name || "—"}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {lead.tp || "—"}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span className="truncate max-w-[250px]">
                              {lead.email || "—"}
                            </span>
                          </div>
                        </td>
                        {isAdmin && (
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setShowEditModal(lead)}
                                className="p-1.5 hover:bg-blue-100 rounded transition-colors"
                                title="Edit"
                              >
                                <Edit3 className="w-4 h-4 text-blue-600" />
                              </button>
                              <button
                                onClick={() => handleDelete(lead.sysId)}
                                className="p-1.5 hover:bg-red-100 rounded transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200">
                  <div className="text-sm text-slate-600">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                    {Math.min(currentPage * itemsPerPage, sortedLeads.length)} of{" "}
                    {sortedLeads.length} leads
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let page;
                      if (totalPages <= 5) {
                        page = i + 1;
                      } else if (currentPage <= 3) {
                        page = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        page = totalPages - 4 + i;
                      } else {
                        page = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                            currentPage === page
                              ? "bg-orange-600 text-white"
                              : "border border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    <button
                      onClick={() =>
                        setCurrentPage(Math.min(totalPages, currentPage + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Refresh FAB */}
        <div className="fixed bottom-6 right-6 z-30">
          <button
            onClick={handleRefresh}
            className="bg-orange-600 hover:bg-orange-700 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 group"
            title="Refresh Web Leads"
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
      </main>

      {/* Edit Modal */}
      {showEditModal && (
        <EditModal lead={showEditModal} onClose={() => setShowEditModal(null)} />
      )}
    </div>
  );
}
