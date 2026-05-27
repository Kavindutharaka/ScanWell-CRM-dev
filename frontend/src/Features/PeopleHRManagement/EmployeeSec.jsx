import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  UserCheck
} from "lucide-react";
import EmployeeList from "./EmployeeList";
import OnlineEmployees from "./OnlineEmployees";
import EmployeeViewModal from "./EmployeeViewModal";

export default function EmployeeSec({ modalOpen, employees, setSelectedEmployee, onRefresh }) {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  // Pagination state — lives in the parent so search/filter changes can reset it.
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  // View-modal state — opened from the Eye-icon button in the list.
  const [viewingEmployee, setViewingEmployee] = useState(null);

  // Reset to page 1 whenever the search query changes so users don't get stuck on an
  // empty/out-of-range page.
  useEffect(() => { setPage(1); }, [searchQuery]);

  // Simulate loading
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

  // Filter employees — matches name, email, phone, employee ID (raw or formatted), and other fields.
  const filteredEmployees = employees.filter(emp => {
    if (!searchQuery) return true;

    // Normalize the query: strip "EMP-" / "EMP" prefixes + dashes so users can type
    // any of these and find the same employee:  "11" | "EMP011" | "EMP-011" | "emp 011"
    const raw = searchQuery.toLowerCase().trim();
    const normalized = raw.replace(/^emp[-\s]?0*/, '').replace(/[-\s]/g, '');

    // Pre-compute searchable strings for this employee.
    const idStr      = String(emp.sysID ?? '');
    const idPadded   = idStr.padStart(3, '0');                           // "011"
    const idEmpForm  = `emp-${idPadded}`;                                 // "emp-011"
    const idEmpFlat  = `emp${idPadded}`;                                  // "emp011"
    const fullName   = `${emp.fname || ''} ${emp.lname || ''}`.toLowerCase().trim();

    return (
      // Name fields
      (emp.fname || '').toLowerCase().includes(raw) ||
      (emp.lname || '').toLowerCase().includes(raw) ||
      fullName.includes(raw) ||
      // Contact
      (emp.email || '').toLowerCase().includes(raw) ||
      (emp.tp || '').toLowerCase().includes(raw) ||
      // Employee ID — multiple forms
      idStr === raw ||                          // exact "11"
      idStr === normalized ||                   // typed "EMP011" → 11
      idPadded.includes(raw) ||                 // partial "011"
      idEmpForm.includes(raw) ||                // "emp-011" / "emp-01"
      idEmpFlat.includes(raw) ||                // "emp011"
      // Work fields
      (emp.position || '').toLowerCase().includes(raw) ||
      (emp.department || '').toLowerCase().includes(raw) ||
      (emp.w_location || '').toLowerCase().includes(raw) ||
      (emp.a_manager || '').toLowerCase().includes(raw) ||
      (emp.status || '').toLowerCase().includes(raw)
    );
  });

  return (
    <div className="w-full bg-gradient-to-br from-slate-50 to-emerald-50/30 min-h-full">
      {/* Add custom CSS for animations */}
      <style>{`
        @keyframes slideInLeft {
          0% {
            opacity: 0;
            transform: translateX(-100px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
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
        <div className={`flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 ${!loading ? 'animate-fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <UserCheck className="w-6 h-6 text-emerald-600" />
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">
                Employee Directory
              </h1>
            </div>
          </div>

        </div>

        {/* Action Bar */}
        <div className={`flex flex-col sm:flex-row gap-4 py-4 border-t border-slate-200 mb-6 ${!loading ? 'animate-fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
          <div className="flex flex-wrap items-center gap-3">
            {/* New Employee Button */}
            <button 
              onClick={modalOpen}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
              title="Add new employee"
            >
              <Plus className="w-5 h-5" />
              <span>Add Employee</span>
            </button>

          </div>

          {/* Search */}
          <div className="flex-1 max-w-md ml-auto">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, email, phone, or ID (e.g. 11 or EMP-011)…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Currently-online employees — driven by sys_event_log, polls every 30s */}
        <OnlineEmployees />

        {/* Employee List Content */}
        <div className="space-y-6">
          <EmployeeList
            onOpen={modalOpen}
            loading={loading}
            employees={filteredEmployees}
            delay={300}
            setSelectedEmployee={setSelectedEmployee}
            onView={setViewingEmployee}
            onRefresh={onRefresh}
            page={page}
            setPage={setPage}
            pageSize={pageSize}
            setPageSize={setPageSize}
          />

          {/* Read-only details modal — opened via the Eye-icon in the table */}
          {viewingEmployee && (
            <EmployeeViewModal
              employee={viewingEmployee}
              onClose={() => setViewingEmployee(null)}
              onEdit={(emp) => {
                setSelectedEmployee(emp);
                modalOpen();
              }}
            />
          )}
        </div>

        {/* Floating refresh button */}
        <div className="fixed bottom-6 right-6 z-30">
          <button
            onClick={handleRefresh}
            className="bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 group"
            title="Refresh Employees"
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

        {/* Bottom spacing */}
        <div className="h-8"></div>
      </div>
    </div>
  );
}