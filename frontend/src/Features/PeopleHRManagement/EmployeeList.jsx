import React, { useState } from "react";
import {
  Mail, Phone, Briefcase, Edit, Eye, UserCheck, UserX, Building,
  ChevronLeft, ChevronRight, CheckCircle2, XCircle, Loader2
} from "lucide-react";
import { updateEmployee } from "../../api/PMApi";
import { toast } from '../../components/Toast';
import { confirm } from '../../components/ConfirmDialog';

// =============================================================
// Small presentational helpers
// =============================================================

const getFullName = (fname, lname) => {
  const parts = [fname, lname].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : 'Unknown';
};

const getInitials = (name) => {
  if (!name || name.trim() === '') return '?';
  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  return parts.map(n => n[0]).join('').toUpperCase().substring(0, 2);
};

const Avatar = ({ name, isActive }) => {
  const bg = isActive ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' : 'bg-gradient-to-br from-slate-400 to-slate-500';
  return (
    <div className={`${bg} text-white rounded-full w-9 h-9 flex items-center justify-center shadow-sm relative flex-shrink-0`}>
      <span className="text-xs font-semibold">{getInitials(name)}</span>
      {isActive && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 border-2 border-white rounded-full" />}
    </div>
  );
};

const DepartmentBadge = ({ department }) => {
  if (!department) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
        <Building className="w-3 h-3" /> N/A
      </span>
    );
  }
  const colorMap = {
    logistics: "bg-blue-100 text-blue-800",
    operations: "bg-purple-100 text-purple-800",
    transport: "bg-green-100 text-green-800",
    warehouse: "bg-amber-100 text-amber-800",
    customs: "bg-red-100 text-red-800",
    hr: "bg-pink-100 text-pink-800",
    it: "bg-indigo-100 text-indigo-800",
    dispatch: "bg-teal-100 text-teal-800",
    "fleet-management": "bg-orange-100 text-orange-800",
    "customer-service": "bg-cyan-100 text-cyan-800",
    "quality-control": "bg-lime-100 text-lime-800",
    "supply-chain": "bg-violet-100 text-violet-800",
    inventory: "bg-emerald-100 text-emerald-800",
    procurement: "bg-rose-100 text-rose-800",
    safety: "bg-yellow-100 text-yellow-800",
    "ocean exports": "bg-blue-100 text-blue-800",
    "air exports": "bg-sky-100 text-sky-800",
    "air imports": "bg-cyan-100 text-cyan-800",
    "ocean imports": "bg-blue-100 text-blue-800",
    "customer relations": "bg-pink-100 text-pink-800",
    sales: "bg-purple-100 text-purple-800",
  };
  const color = colorMap[department.toLowerCase()] || "bg-slate-100 text-slate-700";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      <Building className="w-3 h-3" />
      {department}
    </span>
  );
};

// Inline status toggle pill — calls API on click
const StatusToggle = ({ employee, busy, onToggle }) => {
  const isActive = (employee.status || '').toLowerCase() === 'active';
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onToggle(employee); }}
      disabled={busy}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-150 ${
        isActive
          ? 'bg-green-100 text-green-700 hover:bg-green-200'
          : 'bg-red-100 text-red-700 hover:bg-red-200'
      } ${busy ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}
      title={`Click to ${isActive ? 'disable' : 'activate'} this employee`}
    >
      {busy
        ? <Loader2 className="w-3 h-3 animate-spin" />
        : (isActive ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />)}
      <span>{isActive ? 'Active' : (employee.status || 'Disabled')}</span>
    </button>
  );
};

// =============================================================
// Main list component
// =============================================================

export default function HREmployeeList({
  onOpen,
  loading = false,
  delay = 0,
  employees = [],
  setSelectedEmployee,
  onView,
  onRefresh,
  // Pagination props from parent (so search/filter changes can reset the page)
  page = 1,
  pageSize = 10,
  setPage,
  setPageSize,
}) {
  // Track which employee row is currently saving a status toggle.
  const [togglingId, setTogglingId] = useState(null);

  // ---- Loading skeleton ----
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm animate-pulse">
        <div className="p-4 border-b border-slate-100">
          <div className="h-6 bg-slate-200 rounded w-48" />
        </div>
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-9 h-9 bg-slate-200 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-48" />
                <div className="h-3 bg-slate-200 rounded w-32" />
              </div>
              <div className="h-6 bg-slate-200 rounded w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ---- Toggle handler ----
  const handleToggleStatus = async (employee) => {
    if (togglingId) return;
    const isActive = (employee.status || '').toLowerCase() === 'active';
    const newStatus = isActive ? 'inactive' : 'active';
    const verb = isActive ? 'Disable' : 'Activate';
    const ok = await confirm({
      title: `${verb} employee?`,
      message: `Are you sure you want to ${verb.toLowerCase()} ${getFullName(employee.fname, employee.lname)}?`,
      confirmText: verb,
      variant: isActive ? 'danger' : 'info'
    });
    if (!ok) return;

    setTogglingId(employee.sysID);
    try {
      await updateEmployee({ ...employee, status: newStatus });
      toast.success(`${getFullName(employee.fname, employee.lname)} is now ${newStatus}.`);
      onRefresh && onRefresh();
    } catch (err) {
      console.error('toggle status failed:', err);
      toast.error('Failed to update employee status.');
    } finally {
      setTogglingId(null);
    }
  };

  // ---- Edit handler — bubbles up to parent which opens the form modal ----
  const handleEdit = (employee) => {
    if (setSelectedEmployee) setSelectedEmployee(employee);
    if (onOpen) onOpen();
  };

  // ---- Pagination math ----
  const totalCount = employees.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const pageRows = employees.slice(startIdx, startIdx + pageSize);
  const endIdx = startIdx + pageRows.length;

  return (
    <div
      className="bg-white rounded-xl border border-slate-200 shadow-sm"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-slate-800">Employee Management</h2>
          <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">
            {employees.filter(e => (e.status || '').toLowerCase() === 'active').length} Active · {totalCount} total
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
            <tr>
              <th className="px-4 py-2.5 text-left">Employee</th>
              <th className="px-4 py-2.5 text-left">Contact</th>
              <th className="px-4 py-2.5 text-left">Position</th>
              <th className="px-4 py-2.5 text-left">Department</th>
              <th className="px-4 py-2.5 text-left">Manager</th>
              <th className="px-4 py-2.5 text-left">Status</th>
              <th className="px-4 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-slate-400 py-10">
                  No employees found.
                </td>
              </tr>
            )}
            {pageRows.map((employee) => {
              const fullName = getFullName(employee.fname, employee.lname);
              const empId = `EMP-${(employee.sysID || 0).toString().padStart(3, '0')}`;
              const isActive = (employee.status || '').toLowerCase() === 'active';
              return (
                <tr key={employee.sysID} className="hover:bg-slate-50 transition-colors">
                  {/* Employee (avatar + name + id) */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 min-w-[180px]">
                      <Avatar name={fullName} isActive={isActive} />
                      <div>
                        <div className="font-medium text-slate-900">{fullName}</div>
                        <div className="text-xs text-slate-500">{empId}</div>
                      </div>
                    </div>
                  </td>
                  {/* Contact */}
                  <td className="px-4 py-3">
                    <div className="space-y-0.5 min-w-[160px]">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span className="truncate max-w-[200px]">{employee.email || <span className="text-slate-400">N/A</span>}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{employee.tp || <span className="text-slate-400">N/A</span>}</span>
                      </div>
                    </div>
                  </td>
                  {/* Position */}
                  <td className="px-4 py-3">
                    {employee.position ? (
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <Briefcase className="w-3 h-3 text-slate-400" />
                        <span>{employee.position}</span>
                      </div>
                    ) : <span className="text-slate-400 text-xs">—</span>}
                  </td>
                  {/* Department */}
                  <td className="px-4 py-3"><DepartmentBadge department={employee.department} /></td>
                  {/* Manager */}
                  <td className="px-4 py-3">
                    {employee.a_manager ? (
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {employee.a_manager.split(',').slice(0, 2).map((m, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-cyan-50 text-cyan-700 border border-cyan-200 rounded-full text-xs font-medium">
                            {m.trim()}
                          </span>
                        ))}
                        {employee.a_manager.split(',').length > 2 && (
                          <span className="text-xs text-slate-400">+{employee.a_manager.split(',').length - 2}</span>
                        )}
                      </div>
                    ) : <span className="text-slate-400 text-xs">—</span>}
                  </td>
                  {/* Status pill (clickable) */}
                  <td className="px-4 py-3">
                    <StatusToggle
                      employee={employee}
                      busy={togglingId === employee.sysID}
                      onToggle={handleToggleStatus}
                    />
                  </td>
                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onView && onView(employee)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(employee)}
                        className="p-1.5 hover:bg-emerald-50 rounded-lg text-slate-500 hover:text-emerald-700 transition"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 text-sm">
        <div className="text-slate-500">
          {totalCount === 0
            ? 'No employees'
            : <>Showing <strong>{startIdx + 1}</strong>–<strong>{endIdx}</strong> of <strong>{totalCount}</strong></>}
        </div>
        <div className="flex items-center gap-3">
          <label className="text-slate-500 flex items-center gap-2">
            Rows per page:
            <select
              value={pageSize}
              onChange={(e) => { setPageSize && setPageSize(Number(e.target.value)); setPage && setPage(1); }}
              className="px-2 py-1 border border-slate-300 rounded text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage && setPage(Math.max(1, safePage - 1))}
              disabled={safePage <= 1}
              className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600"
              title="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-slate-600 text-xs px-2">Page {safePage} / {totalPages}</span>
            <button
              onClick={() => setPage && setPage(Math.min(totalPages, safePage + 1))}
              disabled={safePage >= totalPages}
              className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600"
              title="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
