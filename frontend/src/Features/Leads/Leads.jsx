import React, { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  UserPlus,
  Mail,
  Phone,
  Clock,
  MoreHorizontal,
  Edit3,
  Trash2,
  XCircle,
  Check,
  Megaphone,
  FileText,
  Calendar,
} from "lucide-react";
import {
  fetchLeads,
  updateLead,
  deleteLead,
  bulkDeleteLeads,
} from "../../api/LeadApi";
import { toast } from '../../components/Toast';
import { confirm } from '../../components/ConfirmDialog';

export default function Leads({
  onOpen,
  loading = false,
  delay = 0,
  searchQuery = "",
  refreshTrigger = 0,
}) {
  const [leads, setLeads] = useState([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [leadError, setLeadError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [showEditModal, setShowEditModal] = useState(null);
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Load leads
  const loadLeads = async () => {
    try {
      setIsLoadingLeads(true);
      setLeadError(null);
      const response = await fetchLeads();
      if (!Array.isArray(response)) {
        setLeads([]);
        return;
      }
      setLeads(response);
    } catch (err) {
      console.error("Error fetching leads:", err);
      setLeadError("Failed to load leads. Please try again.");
      setLeads([]);
    } finally {
      setIsLoadingLeads(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, [refreshTrigger]);

  // Filter by search
  const filteredLeads = leads.filter((lead) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (lead.fullName || "").toLowerCase().includes(q) ||
      (lead.email || "").toLowerCase().includes(q) ||
      (lead.phoneNumber || "").toLowerCase().includes(q) ||
      (lead.adName || "").toLowerCase().includes(q) ||
      (lead.formName || "").toLowerCase().includes(q)
    );
  });

  // Sort
  const sortedLeads = [...filteredLeads].sort((a, b) => {
    if (!sortField) return 0;
    let aVal = a[sortField] || "";
    let bVal = b[sortField] || "";
    if (sortField === "createdTime" || sortField === "importedAt") {
      aVal = new Date(aVal || 0).getTime();
      bVal = new Date(bVal || 0).getTime();
    } else {
      aVal = String(aVal).toLowerCase();
      bVal = String(bVal).toLowerCase();
    }
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

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Handle sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Selection
  const handleLeadSelection = (id, isSelected) => {
    setSelectedLeads(
      isSelected
        ? [...selectedLeads, id]
        : selectedLeads.filter((sid) => sid !== id)
    );
  };

  const isAllSelected =
    paginatedLeads.length > 0 &&
    paginatedLeads.every((lead) => selectedLeads.includes(lead.id));
  const isPartiallySelected =
    selectedLeads.length > 0 && !isAllSelected;

  const handleSelectAll = (isSelected) => {
    setSelectedLeads(
      isSelected ? paginatedLeads.map((lead) => lead.id) : []
    );
  };

  // Delete single lead
  const handleDeleteLead = async (id) => {
    if (!(await confirm("Are you sure you want to delete this lead?"))) return;
    try {
      await deleteLead(id);
      setLeads((prev) => prev.filter((l) => l.id !== id));
      setSelectedLeads((prev) => prev.filter((sid) => sid !== id));
    } catch (err) {
      toast.error("Failed to delete lead. Please try again.");
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedLeads.length === 0) return;
    if (
      !(await confirm(
        `Are you sure you want to delete ${selectedLeads.length} lead(s)?`
      ))
    )
      return;
    try {
      await bulkDeleteLeads(selectedLeads);
      setLeads((prev) => prev.filter((l) => !selectedLeads.includes(l.id)));
      setSelectedLeads([]);
    } catch (err) {
      toast.error("Failed to delete leads. Please try again.");
    }
  };

  // Edit lead
  const handleSaveEdit = async (id, updatedData) => {
    try {
      await updateLead(id, updatedData);
      setLeads((prev) =>
        prev.map((l) => (l.id === id ? { ...l, ...updatedData } : l))
      );
      setShowEditModal(null);
    } catch (err) {
      toast.error("Failed to update lead. Please try again.");
    }
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  // Sort header component
  const SortableHeader = ({ field, children, className = "" }) => (
    <th
      className={`px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none ${className}`}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && (
          sortDirection === "asc" ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )
        )}
      </div>
    </th>
  );

  // Edit Modal
  const EditModal = ({ lead, onClose }) => {
    const [formData, setFormData] = useState({
      createdTime: lead.createdTime
        ? new Date(lead.createdTime).toISOString().slice(0, 16)
        : "",
      fullName: lead.fullName || "",
      email: lead.email || "",
      phoneNumber: lead.phoneNumber || "",
      adName: lead.adName || "",
      formName: lead.formName || "",
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      handleSaveEdit(lead.id, {
        ...formData,
        createdTime: formData.createdTime
          ? new Date(formData.createdTime).toISOString()
          : null,
      });
    };

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">
              Edit Lead
            </h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-100 rounded"
            >
              <XCircle className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, phoneNumber: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Created Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.createdTime}
                  onChange={(e) =>
                    setFormData({ ...formData, createdTime: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Ad Name
                </label>
                <input
                  type="text"
                  value={formData.adName}
                  onChange={(e) =>
                    setFormData({ ...formData, adName: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Form Name
                </label>
                <input
                  type="text"
                  value={formData.formName}
                  onChange={(e) =>
                    setFormData({ ...formData, formName: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
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

  // Loading skeleton
  if (loading || isLoadingLeads) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm animate-pulse">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-slate-200 rounded"></div>
            <div className="h-6 bg-slate-200 rounded w-24"></div>
          </div>
        </div>
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-slate-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (leadError) {
    return (
      <div className="bg-white rounded-xl border border-red-200 p-8 text-center">
        <p className="text-red-600">{leadError}</p>
        <button
          onClick={loadLeads}
          className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <div
        className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 animate-slideInLeft"
        style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 gap-4">
          <div className="flex items-center gap-3 flex-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-slate-100 rounded transition-colors group"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
              ) : (
                <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
              )}
            </button>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-slate-800">All Leads</h2>
              <p className="text-sm text-slate-600 mt-1">
                {filteredLeads.length} lead(s)
                {searchQuery && ` matching "${searchQuery}"`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedLeads.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg border border-red-200">
                <span className="text-sm text-red-800 font-medium">
                  {selectedLeads.length} selected
                </span>
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-1 px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
                <button
                  onClick={() => setSelectedLeads([])}
                  className="p-1 hover:bg-red-100 rounded transition-colors"
                >
                  <XCircle className="w-4 h-4 text-red-600" />
                </button>
              </div>
            )}
            <button className="p-1 hover:bg-slate-100 rounded transition-colors">
              <MoreHorizontal className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Table or Empty State */}
        {filteredLeads.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-b-xl">
            <UserPlus className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              {searchQuery ? "No Leads Match Search" : "No Leads Available"}
            </h3>
            <p className="text-slate-600 mb-6 text-lg">
              {searchQuery
                ? "Try adjusting your search terms."
                : "Upload an Excel file to import your leads."}
            </p>
            {!searchQuery && onOpen && (
              <button
                onClick={onOpen}
                className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors shadow-md"
              >
                <FileText className="w-5 h-5" />
                Upload Excel
              </button>
            )}
          </div>
        ) : (
          isExpanded && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left w-12">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          ref={(input) => {
                            if (input)
                              input.indeterminate = isPartiallySelected;
                          }}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="w-4 h-4 text-orange-600 border-slate-300 rounded focus:ring-orange-500"
                        />
                      </th>
                      <SortableHeader field="createdTime">
                        <Calendar className="w-3 h-3" />
                        Created Time
                      </SortableHeader>
                      <SortableHeader field="fullName">
                        <UserPlus className="w-3 h-3" />
                        Full Name
                      </SortableHeader>
                      <SortableHeader field="email">
                        <Mail className="w-3 h-3" />
                        Email
                      </SortableHeader>
                      <SortableHeader field="phoneNumber">
                        <Phone className="w-3 h-3" />
                        Phone Number
                      </SortableHeader>
                      <SortableHeader field="adName">
                        <Megaphone className="w-3 h-3" />
                        Ad Name
                      </SortableHeader>
                      <SortableHeader field="formName">
                        <FileText className="w-3 h-3" />
                        Form Name
                      </SortableHeader>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedLeads.map((lead) => (
                      <tr
                        key={lead.id}
                        className={`hover:bg-slate-50 transition-colors ${
                          selectedLeads.includes(lead.id) ? "bg-orange-50" : ""
                        }`}
                      >
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedLeads.includes(lead.id)}
                            onChange={(e) =>
                              handleLeadSelection(lead.id, e.target.checked)
                            }
                            className="w-4 h-4 text-orange-600 border-slate-300 rounded focus:ring-orange-500"
                          />
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {formatDate(lead.createdTime)}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-medium text-slate-900">
                            {lead.fullName || "—"}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600">
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span className="truncate max-w-[200px]">
                              {lead.email || "—"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600">
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {lead.phoneNumber || "—"}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600">
                          {lead.adName ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-100">
                              {lead.adName}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600">
                          {lead.formName ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-50 text-purple-700 border border-purple-100">
                              {lead.formName}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setShowEditModal(lead)}
                              className="p-1.5 hover:bg-blue-100 rounded transition-colors"
                              title="Edit lead"
                            >
                              <Edit3 className="w-4 h-4 text-blue-600" />
                            </button>
                            <button
                              onClick={() => handleDeleteLead(lead.id)}
                              className="p-1.5 hover:bg-red-100 rounded transition-colors"
                              title="Delete lead"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
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
          )
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <EditModal
          lead={showEditModal}
          onClose={() => setShowEditModal(null)}
        />
      )}
    </>
  );
}
