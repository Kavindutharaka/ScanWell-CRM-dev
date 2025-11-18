import React, { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  Plus,
  UserPlus,
  Mail,
  Phone,
  Building,
  Clock,
  Activity,
  MoreHorizontal,
  UserCheck,
  Calendar,
  ArrowRight,
  Target,
  CheckCircle,
  XCircle,
  Eye,
  AlertTriangle,
  User,
  Users,
  ChevronUp,
  Search,
  Check,
  MessageCircle,
  History,
  Edit3,
  UserX,
  Star,
} from "lucide-react";
import { fetchEmployees } from "../../api/PMApi";
import {
  fetchLeads,
  approveLead,
  rejectLead,
  assignLead,
  bulkApproveLeads,
  bulkRejectLeads,
  bulkAssignLeads,
  updateLead,
  convertLeadToContact,
} from "../../api/LeadApi";

export default function Leads({
  onOpen,
  loading = false,
  delay = 0,
  reviewMode = false,
  selectedLeads = [],
  setSelectedLeads = () => {},
  filterStatus = null,
  setFilterStatus = () => {},
  setLeadCounts = () => {},
}) {
  // State for employees
  const [employees, setEmployees] = useState([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [employeeError, setEmployeeError] = useState(null);

  // State for leads
  const [leads, setLeads] = useState([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [leadError, setLeadError] = useState(null);

  const [isExpanded, setIsExpanded] = useState(true);

  // Default timeline for leads without one
  const defaultTimeline = Array(15)
    .fill()
    .map((_, i) => ({
      day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i % 7],
      status: "inactive",
    }));

  // Helper function to map status to label and color
  const getStatusInfo = (status) => {
    const statusLower = (status || "new").toLowerCase();
    const statusMap = {
      new: { label: "New Lead", color: "bg-orange-500" },
      contacted: { label: "Contacted", color: "bg-blue-500" },
      qualified: { label: "Qualified", color: "bg-green-500" },
      converted: { label: "Converted", color: "bg-purple-500" },
      lost: { label: "Lost", color: "bg-red-500" },
    };
    return statusMap[statusLower] || { label: "New Lead", color: "bg-orange-500" };
  };

  // Load employees from API
  const loadEmployees = async () => {
    try {
      setIsLoadingEmployees(true);
      setEmployeeError(null);
      const data = await fetchEmployees();
      console.log("Fetched employees:", data);

      const mappedEmployees = data.map((employee) => ({
        id: employee.sysID,
        name: `${employee.fname} ${employee.lname}`.trim(),
        email: employee.email,
        role: employee.position,
        avatar: `${employee.fname[0]}${employee.lname[0]}`.toUpperCase(),
        department: employee.department,
        status: employee.status,
      }));

      setEmployees(mappedEmployees);
    } catch (err) {
      console.error("Error fetching employees:", err);
      setEmployeeError("Failed to load employees. Please try again.");
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  // Helper function to map employee ID to employee object
  const getEmployeeById = (employeeId) => {
    if (!employeeId) return null;
    return employees.find((emp) => emp.id === employeeId) || null;
  };

  // Load all leads
  const loadLeads = async () => {
    try {
      setIsLoadingLeads(true);
      setLeadError(null);

      const response = await fetchLeads();
      console.log("Fetched leads:", response);

      // Handle empty or invalid response
      if (!Array.isArray(response)) {
        console.warn("fetchLeads returned non-array response:", response);
        setLeads([]);
        return;
      }

      // Map leads and ensure required fields
      const mappedLeads = response.map((lead) => {
        const statusInfo = getStatusInfo(lead.status);
        const assignedEmployee = getEmployeeById(lead.assignedTo);

        return {
          id: lead.id || Date.now() + Math.random(),
          name: lead.name || "Unknown Lead",
          status: (lead.status || "new").toLowerCase(),
          statusLabel: statusInfo.label,
          statusColor: statusInfo.color,
          company: lead.company || "Unknown Company",
          title: lead.title || "Unknown Title",
          email: lead.email || "",
          phone: lead.phone || "",
          lastInteraction: lead.lastInteraction || "",
          activeSequences: lead.activeSequences || "",
          approvalStatus: lead.approvalStatus || "pending",
          assignedTo: assignedEmployee,
          priority: lead.priority || "medium",
          source: lead.source || "Unknown",
          score: lead.score || 0,
          notes: lead.notes || "",
          timeline: lead.timeline || defaultTimeline,
          createdAt: lead.createdAt,
          updatedAt: lead.updatedAt,
        };
      });

      setLeads(mappedLeads);
    } catch (err) {
      console.error("Error fetching leads:", err);
      setLeadError("Failed to load leads. Please try again.");
      setLeads([]);
    } finally {
      setIsLoadingLeads(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (employees.length > 0) {
      loadLeads();
    }
  }, [employees]);

  // Update lead counts whenever leads data changes
  useEffect(() => {
    const pending = leads.filter((l) => l.approvalStatus === "pending").length;
    const quickReview = leads.filter(
      (l) => l.approvalStatus === "pending" && !l.assignedTo
    ).length;
    setLeadCounts({ pending, quickReview });
  }, [leads, setLeadCounts]);

  // State for dropdowns and modals
  const [showQuickEditModal, setShowQuickEditModal] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(null);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(null);
  const [searchEmployee, setSearchEmployee] = useState("");

  const dropdownRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowAssignmentModal(null);
        setShowEmployeeDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter leads based on filter status
  const filteredLeads = leads.filter((lead) => {
    if (filterStatus === "pending") {
      return lead.approvalStatus === "pending";
    } else if (filterStatus === "quick-review") {
      return lead.approvalStatus === "pending" && !lead.assignedTo;
    }
    return true; // No filter, show all
  });

  // Handle checkbox selection
  const handleLeadSelection = (leadId, isSelected) => {
    const newSelectedLeads = isSelected
      ? [...selectedLeads, leadId]
      : selectedLeads.filter((id) => id !== leadId);
    setSelectedLeads(newSelectedLeads);
  };

  // Handle select all
  const handleSelectAll = (isSelected) => {
    const newSelectedLeads = isSelected
      ? filteredLeads.map((lead) => lead.id)
      : [];
    setSelectedLeads(newSelectedLeads);
  };

  // Individual approve - NO auto-assign
  const handleApproveLead = async (leadId) => {
    try {
      await approveLead(leadId);

      // Update local state
      setLeads((prevLeads) =>
        prevLeads.map((lead) =>
          lead.id === leadId ? { ...lead, approvalStatus: "approved" } : lead
        )
      );

      const leadName = leads.find((l) => l.id === leadId)?.name || "Lead";
      alert(`${leadName} approved successfully!`);
    } catch (error) {
      console.error("Error approving lead:", error);
      alert("Failed to approve lead. Please try again.");
    }
  };

  const handleRejectLead = async (leadId, reason = "") => {
    try {
      await rejectLead(leadId, reason);

      // Update local state
      setLeads((prevLeads) =>
        prevLeads.map((lead) =>
          lead.id === leadId
            ? { ...lead, approvalStatus: "rejected", rejectionReason: reason }
            : lead
        )
      );

      const leadName = leads.find((l) => l.id === leadId)?.name || "Lead";
      alert(`${leadName} rejected successfully!`);
    } catch (error) {
      console.error("Error rejecting lead:", error);
      alert("Failed to reject lead. Please try again.");
    }
  };

  // Bulk approval - NO auto-assign
  const handleBulkApprove = async () => {
    if (selectedLeads.length === 0) {
      alert("Please select leads to approve");
      return;
    }

    try {
      await bulkApproveLeads(selectedLeads);

      // Update local state
      setLeads((prevLeads) =>
        prevLeads.map((lead) =>
          selectedLeads.includes(lead.id)
            ? { ...lead, approvalStatus: "approved" }
            : lead
        )
      );

      alert(`${selectedLeads.length} lead(s) approved successfully!`);
      setSelectedLeads([]); // Clear selection after approval
    } catch (error) {
      console.error("Error bulk approving leads:", error);
      alert("Failed to approve leads. Please try again.");
    }
  };

  const handleBulkReject = async () => {
    if (selectedLeads.length === 0) {
      alert("Please select leads to reject");
      return;
    }

    const reason = window.prompt("Enter rejection reason (optional):");
    if (reason === null) return; // User cancelled

    try {
      await bulkRejectLeads(selectedLeads, reason);

      // Update local state
      setLeads((prevLeads) =>
        prevLeads.map((lead) =>
          selectedLeads.includes(lead.id)
            ? { ...lead, approvalStatus: "rejected", rejectionReason: reason }
            : lead
        )
      );

      alert(`${selectedLeads.length} lead(s) rejected successfully!`);
      setSelectedLeads([]);
    } catch (error) {
      console.error("Error bulk rejecting leads:", error);
      alert("Failed to reject leads. Please try again.");
    }
  };

  // NEW: Separate bulk assign function
  const handleBulkAssign = () => {
    if (selectedLeads.length === 0) {
      alert("Please select leads to assign");
      return;
    }
    setShowAssignmentModal([...selectedLeads]);
  };

  // Assign employee to leads
  const handleAssignEmployees = async (leadIds, employee) => {
    try {
      if (leadIds.length === 1) {
        // Single assignment
        await assignLead(leadIds[0], employee.id);
      } else {
        // Bulk assignment
        await bulkAssignLeads(leadIds, employee.id);
      }

      // Update local state
      setLeads((prevLeads) =>
        prevLeads.map((lead) =>
          leadIds.includes(lead.id) ? { ...lead, assignedTo: employee } : lead
        )
      );

      const leadCount = leadIds.length;
      const leadText = leadCount === 1 ? "lead" : "leads";
      alert(
        `${leadCount} ${leadText} assigned to ${employee.name} successfully!`
      );
      setShowAssignmentModal(null);
      setShowEmployeeDropdown(null);
      setSelectedLeads([]);
    } catch (error) {
      console.error("Error assigning leads:", error);
      alert("Failed to assign leads. Please try again.");
    }
  };

  // Quick edit lead
  const handleQuickEdit = async (leadId, updates) => {
    try {
      // Get the current lead data
      const currentLead = leads.find((lead) => lead.id === leadId);

      // Merge current lead with updates
      const updatedLeadData = { ...currentLead, ...updates };

      await updateLead(leadId, updatedLeadData);

      // Update local state
      setLeads((prevLeads) =>
        prevLeads.map((lead) =>
          lead.id === leadId ? { ...lead, ...updates } : lead
        )
      );

      setShowQuickEditModal(null);
      alert("Lead updated successfully!");
    } catch (error) {
      console.error("Error updating lead:", error);
      alert("Failed to update lead. Please try again.");
    }
  };

  // Convert to contact
  const handleConvertToContact = async (leadId, leadName) => {
    if (
      window.confirm(
        `Convert ${leadName} to a contact? This will move them to your contacts board.`
      )
    ) {
      try {
        await convertLeadToContact(leadId);

        // Remove from local state
        setLeads((prevLeads) => prevLeads.filter((lead) => lead.id !== leadId));

        alert(`${leadName} has been successfully converted to a contact!`);
      } catch (error) {
        console.error("Error converting lead:", error);
        alert("Failed to convert lead. Please try again.");
      }
    }
  };

  // Filter employees based on search
  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchEmployee.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchEmployee.toLowerCase())
  );

  // Get counts for filter badges
  const pendingCount = leads.filter((l) => l.approvalStatus === "pending").length;
  const quickReviewCount = leads.filter(
    (l) => l.approvalStatus === "pending" && !l.assignedTo
  ).length;

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm animate-pulse">
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 bg-slate-200 rounded"></div>
          <div className="h-6 bg-slate-200 rounded w-24"></div>
          <div className="h-8 bg-slate-200 rounded w-32"></div>
        </div>
        <div className="w-4 h-4 bg-slate-200 rounded"></div>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-full">
          <div className="grid grid-cols-12 gap-4 p-4 bg-slate-50 border-b border-slate-200">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-4 bg-slate-200 rounded"></div>
            ))}
          </div>
          {Array.from({ length: 2 }).map((_, rowIndex) => (
            <div
              key={rowIndex}
              className="grid grid-cols-12 gap-4 p-4 border-b border-slate-100"
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-4 bg-slate-200 rounded"></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Component functions for UI elements
  const ApprovalBadge = ({ status }) => {
    const configs = {
      pending: {
        icon: Clock,
        color: "bg-amber-100 text-amber-800",
        label: "Pending",
      },
      approved: {
        icon: CheckCircle,
        color: "bg-green-100 text-green-800",
        label: "Approved",
      },
      rejected: {
        icon: XCircle,
        color: "bg-red-100 text-red-800",
        label: "Rejected",
      },
    };

    const config = configs[status] || configs.pending;
    const Icon = config.icon;

    return (
      <div
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
      >
        <Icon className="w-3 h-3" />
        <span>{config.label}</span>
      </div>
    );
  };

  const PriorityBadge = ({ priority }) => {
    const colors = {
      high: "bg-red-100 text-red-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-green-100 text-green-800",
    };

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
          colors[priority] || colors.medium
        }`}
      >
        <Star className="w-3 h-3" />
        {(priority || "medium").charAt(0).toUpperCase() +
          (priority || "medium").slice(1)}
      </span>
    );
  };

  const StatusBadge = ({ status, color, label }) => {
    const getIcon = () => {
      switch (status) {
        case "qualified":
          return <UserCheck className="w-3 h-3" />;
        case "contacted":
          return <Mail className="w-3 h-3" />;
        case "new":
          return <UserPlus className="w-3 h-3" />;
        case "converted":
          return <CheckCircle className="w-3 h-3" />;
        case "lost":
          return <XCircle className="w-3 h-3" />;
        default:
          return <Clock className="w-3 h-3" />;
      }
    };

    return (
      <div
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white ${
          color || "bg-orange-500"
        }`}
      >
        {getIcon()}
        <span>{label || "New Lead"}</span>
      </div>
    );
  };

  const TimelineBars = ({ timeline }) => (
    <div className="flex gap-1 justify-center items-center">
      {(timeline || defaultTimeline).map((day, index) => {
        let color = "bg-slate-200";
        if (day.status === "qualified") color = "bg-green-500";
        else if (day.status === "contacted") color = "bg-blue-500";
        else if (day.status === "new") color = "bg-orange-500";
        else if (day.status === "pending") color = "bg-amber-500";
        else if (day.status === "inactive") color = "bg-slate-300";

        return (
          <div
            key={index}
            className={`h-6 w-2 rounded-sm ${color} transition-all duration-200 hover:scale-110`}
            title={`${day.day}: ${day.status}`}
          />
        );
      })}
    </div>
  );

  // Employee Dropdown Component
  const EmployeeDropdown = ({ leadId, currentAssignee }) => {
    return (
      <div className="absolute z-20 mt-2 w-64 bg-white border border-slate-200 rounded-lg shadow-lg">
        <div className="p-2">
          <div className="relative mb-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchEmployee}
              onChange={(e) => setSearchEmployee(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          {isLoadingEmployees ? (
            <div className="text-center text-sm text-slate-500">
              Loading employees...
            </div>
          ) : employeeError ? (
            <div className="text-center text-sm text-red-500">
              {employeeError}
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center text-sm text-slate-500">
              No employees found
            </div>
          ) : (
            <div className="max-h-40 overflow-y-auto">
              {filteredEmployees.map((employee) => (
                <button
                  key={employee.id}
                  onClick={() => handleAssignEmployees([leadId], employee)}
                  className={`w-full p-2 text-left flex items-center gap-2 hover:bg-slate-100 rounded transition-colors ${
                    currentAssignee?.id === employee.id ? "bg-orange-50" : ""
                  }`}
                >
                  <div className="w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                    {employee.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">
                      {employee.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {employee.email}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Assignment Modal Component
  const AssignmentModal = ({ leadIds, onClose }) => {
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const selectedLeadsData = leads.filter((lead) => leadIds.includes(lead.id));

    const handleAssign = () => {
      if (selectedEmployee) {
        handleAssignEmployees(leadIds, selectedEmployee);
      } else {
        alert("Please select an employee to assign.");
      }
    };

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <h3 className="text-xl font-semibold text-slate-900">
              Assign Leads ({leadIds.length})
            </h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-100 rounded"
            >
              <XCircle className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <h4 className="text-sm font-medium text-slate-700 mb-3">
                Selected Leads:
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {selectedLeadsData.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"
                  >
                    <UserPlus className="w-4 h-4 text-orange-600" />
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">
                        {lead.name}
                      </div>
                      <div className="text-sm text-slate-600">
                        {lead.company} • {lead.title}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={lead.priority} />
                      <span className="text-sm font-medium text-slate-700">
                        {lead.score}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-sm font-medium text-slate-700 mb-3">
                Assign to Employee:
              </h4>
              <div className="relative mb-3">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchEmployee}
                  onChange={(e) => setSearchEmployee(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {isLoadingEmployees ? (
                <div className="text-center text-sm text-slate-500">
                  Loading employees...
                </div>
              ) : employeeError ? (
                <div className="text-center text-sm text-red-500">
                  {employeeError}
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="text-center text-sm text-slate-500">
                  No employees found
                </div>
              ) : (
                <div className="grid gap-2 max-h-64 overflow-y-auto">
                  {filteredEmployees.map((employee) => (
                    <button
                      key={employee.id}
                      onClick={() => setSelectedEmployee(employee)}
                      className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
                        selectedEmployee?.id === employee.id
                          ? "border-orange-500 bg-orange-50"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                          {employee.avatar}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-slate-900">
                            {employee.name}
                          </div>
                          <div className="text-sm text-slate-600">
                            {employee.role}
                          </div>
                          <div className="text-xs text-slate-500">
                            {employee.email}
                          </div>
                        </div>
                        {selectedEmployee?.id === employee.id && (
                          <Check className="w-5 h-5 text-orange-600" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={handleAssign}
                className="flex-1 flex items-center justify-center gap-2 bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
                disabled={!selectedEmployee}
              >
                <Users className="w-5 h-5" />
                {selectedEmployee
                  ? `Assign to ${selectedEmployee.name}`
                  : "Select an Employee"}
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const QuickEditModal = ({ lead, onClose }) => {
    const [formData, setFormData] = useState({
      priority: lead.priority || "medium",
      notes: lead.notes || "",
      source: lead.source || "",
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      handleQuickEdit(lead.id, formData);
    };

    if (!leads || leads.length === 0) {
      return null;
    }

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">
              Quick Edit: {lead.name}
            </h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-100 rounded"
            >
              <XCircle className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Source
              </label>
              <input
                type="text"
                value={formData.source}
                onChange={(e) =>
                  setFormData({ ...formData, source: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors"
              >
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

  if (loading || isLoadingEmployees || isLoadingLeads) {
    return <LoadingSkeleton />;
  }

  if (employeeError || leadError) {
    return <></>;
  }

  const isAllSelected =
    filteredLeads.length > 0 &&
    selectedLeads.length === filteredLeads.length &&
    filteredLeads.every((lead) => selectedLeads.includes(lead.id));
  const isPartiallySelected =
    selectedLeads.length > 0 &&
    selectedLeads.length < filteredLeads.length;

  return (
    <>
      <div
        className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 animate-slideInLeft"
        style={{
          animationDelay: `${delay}ms`,
          animationFillMode: "both",
        }}
      >
        {/* Section Header */}
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
              <h2 className="text-lg font-bold text-slate-800">
                All Leads{" "}
                {reviewMode && (
                  <span className="text-sm text-orange-600">(Review Mode)</span>
                )}
                {filterStatus && (
                  <span className="text-sm text-blue-600">
                    {" "}
                    - {filterStatus === "pending" ? "Pending" : "Quick Review"}
                  </span>
                )}
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                {filterStatus
                  ? `Showing ${filteredLeads.length} filtered lead(s)`
                  : `Manage all your leads in one place (${leads.length} total)`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedLeads.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 rounded-lg border border-orange-200">
                <span className="text-sm text-orange-800 font-medium">
                  {selectedLeads.length} selected
                </span>
                <button
                  onClick={handleBulkApprove}
                  className="p-1 hover:bg-green-100 rounded transition-colors"
                  title="Approve selected"
                >
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </button>
                <button
                  onClick={handleBulkReject}
                  className="p-1 hover:bg-red-100 rounded transition-colors"
                  title="Reject selected"
                >
                  <XCircle className="w-4 h-4 text-red-600" />
                </button>
                <button
                  onClick={handleBulkAssign}
                  className="p-1 hover:bg-blue-100 rounded transition-colors"
                  title="Assign selected leads"
                >
                  <Users className="w-4 h-4 text-blue-600" />
                </button>
              </div>
            )}
            <button className="p-1 hover:bg-slate-100 rounded transition-colors">
              <MoreHorizontal className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Leads Table or Empty State */}
        {filteredLeads.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-b-xl">
            <UserPlus className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              {filterStatus
                ? "No Leads Match Filter"
                : "No Leads Available"}
            </h3>
            <p className="text-slate-600 mb-6 text-lg">
              {filterStatus
                ? "Try adjusting your filter criteria."
                : "Start by adding leads to manage your prospects effectively."}
            </p>
            {!filterStatus && onOpen && (
              <button
                onClick={onOpen}
                className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors shadow-md"
              >
                <Plus className="w-5 h-5" />
                Add Your First Lead
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            {isExpanded && (
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left bg-slate-50 sticky left-0 z-10 border-r border-slate-200">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        ref={(input) => {
                          if (input) input.indeterminate = isPartiallySelected;
                        }}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="w-4 h-4 text-orange-600 border-slate-300 rounded focus:ring-orange-500 focus:ring-2"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider bg-slate-50 sticky left-16 z-10 border-r border-slate-200 min-w-48">
                      Lead
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Approval
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Assigned To
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Timeline
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Actions
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Source
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="hover:bg-slate-50 transition-colors group"
                    >
                      <td className="px-4 py-4 bg-white sticky left-0 z-10 border-r border-slate-200 shadow-sm group-hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={selectedLeads.includes(lead.id)}
                          onChange={(e) =>
                            handleLeadSelection(lead.id, e.target.checked)
                          }
                          className="w-4 h-4 text-orange-600 border-slate-300 rounded focus:ring-orange-500 focus:ring-2"
                        />
                      </td>
                      <td className="px-4 py-4 bg-white sticky left-16 z-10 border-r border-slate-200 min-w-48 shadow-sm group-hover:bg-slate-50">
                        <div className="flex items-center gap-2">
                          <UserPlus className="w-4 h-4 text-orange-600" />
                          <div>
                            <div className="font-medium text-slate-900">
                              {lead.name}
                            </div>
                            <div className="text-xs text-slate-500">
                              {lead.title}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge
                          status={lead.status}
                          color={lead.statusColor}
                          label={lead.statusLabel}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <ApprovalBadge status={lead.approvalStatus} />
                      </td>
                      <td className="px-4 py-4">
                        <PriorityBadge priority={lead.priority} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              lead.score >= 80
                                ? "bg-green-500"
                                : lead.score >= 60
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                          ></div>
                          <span className="text-sm font-medium text-slate-900">
                            {lead.score}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 relative">
                        {lead.assignedTo ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                              {lead.assignedTo.avatar}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-slate-900 truncate">
                                {lead.assignedTo.name}
                              </div>
                              <div className="text-xs text-slate-500 truncate">
                                {lead.assignedTo.role}
                              </div>
                            </div>
                            <button
                              onClick={() =>
                                setShowEmployeeDropdown(
                                  showEmployeeDropdown === lead.id
                                    ? null
                                    : lead.id
                                )
                              }
                              className="p-1 hover:bg-slate-100 rounded transition-colors"
                            >
                              <ChevronDown className="w-3 h-3 text-slate-400" />
                            </button>
                          </div>
                        ) : (
                          <div className="relative">
                            <button
                              onClick={() =>
                                setShowEmployeeDropdown(
                                  showEmployeeDropdown === lead.id
                                    ? null
                                    : lead.id
                                )
                              }
                              className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm text-slate-600 transition-colors"
                            >
                              <User className="w-4 h-4" />
                              <span>Assign</span>
                              <ChevronDown className="w-3 h-3" />
                            </button>
                            {showEmployeeDropdown === lead.id && (
                              <EmployeeDropdown
                                leadId={lead.id}
                                currentAssignee={lead.assignedTo}
                              />
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <TimelineBars timeline={lead.timeline} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          {reviewMode ? (
                            <>
                              <button
                                onClick={() => setShowApprovalModal(lead)}
                                className="p-1 hover:bg-blue-100 rounded transition-colors"
                                title="Review details"
                              >
                                <Eye className="w-4 h-4 text-blue-600" />
                              </button>
                              <button
                                onClick={() => handleApproveLead(lead.id)}
                                className="p-1 hover:bg-green-100 rounded transition-colors"
                                title="Approve"
                              >
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              </button>
                              <button
                                onClick={() => handleRejectLead(lead.id)}
                                className="p-1 hover:bg-red-100 rounded transition-colors"
                                title="Reject"
                              >
                                <XCircle className="w-4 h-4 text-red-600" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => setShowQuickEditModal(lead)}
                                className="p-1 hover:bg-blue-100 rounded transition-colors"
                                title="Quick edit"
                              >
                                <Edit3 className="w-4 h-4 text-blue-600" />
                              </button>
                              <button
                                onClick={() =>
                                  handleConvertToContact(lead.id, lead.name)
                                }
                                className="p-1 hover:bg-green-100 rounded transition-colors"
                                title="Convert to contact"
                              >
                                <ArrowRight className="w-4 h-4 text-green-600" />
                              </button>
                              <button
                                className="p-1 hover:bg-orange-100 rounded transition-colors"
                                title="Add note"
                              >
                                <MessageCircle className="w-4 h-4 text-orange-600" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                          <Building className="w-3 h-3" />
                          <span>{lead.company}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          <span className="truncate max-w-32">
                            {lead.email}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-slate-100 text-slate-700">
                          {lead.source}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {showAssignmentModal && (
        <AssignmentModal
          leadIds={showAssignmentModal}
          onClose={() => {
            setShowAssignmentModal(null);
            setSelectedLeads([]);
          }}
        />
      )}
      {showQuickEditModal && (
        <QuickEditModal
          lead={showQuickEditModal}
          onClose={() => setShowQuickEditModal(null)}
        />
      )}

      {showApprovalModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-xl font-semibold text-slate-900">
                Review Lead: {showApprovalModal.name}
              </h3>
              <button
                onClick={() => setShowApprovalModal(null)}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <XCircle className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Company
                  </label>
                  <p className="text-slate-900">{showApprovalModal.company}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Title
                  </label>
                  <p className="text-slate-900">{showApprovalModal.title}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email
                  </label>
                  <p className="text-slate-900">{showApprovalModal.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Phone
                  </label>
                  <p className="text-slate-900">{showApprovalModal.phone}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Source
                  </label>
                  <p className="text-slate-900">{showApprovalModal.source}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Score
                  </label>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        showApprovalModal.score >= 80
                          ? "bg-green-500"
                          : showApprovalModal.score >= 60
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                    ></div>
                    <span className="font-medium">
                      {showApprovalModal.score}/100
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-slate-700">
                    Priority:
                  </label>
                  <PriorityBadge priority={showApprovalModal.priority} />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-slate-700">
                    Status:
                  </label>
                  <StatusBadge
                    status={showApprovalModal.status}
                    color={showApprovalModal.statusColor}
                    label={showApprovalModal.statusLabel}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-slate-700">
                    Approval:
                  </label>
                  <ApprovalBadge status={showApprovalModal.approvalStatus} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Notes
                </label>
                <p className="text-slate-900 bg-slate-50 p-3 rounded-lg">
                  {showApprovalModal.notes || "No notes available"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Recent Activity
                </label>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <TimelineBars timeline={showApprovalModal.timeline} />
                  <p className="text-xs text-slate-600 mt-2 text-center">
                    Last 15 days of activity
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Assignment
                </label>
                <div className="flex items-center gap-2">
                  {showApprovalModal.assignedTo ? (
                    <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg">
                      <div className="w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                        {showApprovalModal.assignedTo.avatar}
                      </div>
                      <span className="text-sm text-green-800">
                        Assigned to {showApprovalModal.assignedTo.name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-slate-500 px-3 py-2 bg-slate-100 rounded-lg">
                      Not assigned
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={() => {
                    handleApproveLead(showApprovalModal.id);
                    setShowApprovalModal(null);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="w-5 h-5" />
                  Approve Lead
                </button>
                <button
                  onClick={() => {
                    handleRejectLead(showApprovalModal.id);
                    setShowApprovalModal(null);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                  Reject Lead
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}