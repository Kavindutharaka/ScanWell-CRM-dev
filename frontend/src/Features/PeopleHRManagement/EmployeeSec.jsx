import React, { useState, useEffect } from "react";
import {
  MessageCircleHeart,
  MessageCircle,
  Link,
  Search,
  Filter,
  ChevronDown,
  Plus,
  Calendar,
  Users,
  Share2,
  MoreHorizontal,
  UserCheck
} from "lucide-react";
import EmployeeList from "./EmployeeList";

export default function EmployeeSec({ modalOpen, employees, setSelectedEmployee}) {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

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

  // Filter employees with proper null handling
  const filteredEmployees = employees.filter(emp => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    
    // Safely check each field with null handling
    return (
      (emp.fname || '').toLowerCase().includes(query) ||
      (emp.lname || '').toLowerCase().includes(query) ||
      (emp.email || '').toLowerCase().includes(query) ||
      (emp.tp || '').toLowerCase().includes(query) ||
      (emp.position || '').toLowerCase().includes(query) ||
      (emp.department || '').toLowerCase().includes(query) ||
      (emp.w_location || '').toLowerCase().includes(query) ||
      (emp.a_manager || '').toLowerCase().includes(query) ||
      (emp.status || '').toLowerCase().includes(query)
    );
  });

  return (
    <div className="w-full bg-gradient-to-br from-slate-50 to-emerald-50/30 min-h-full">
      {/* Add custom CSS for animations */}
      <style jsx>{`
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

          {/* Header Actions */}
          <div className="flex flex-wrap items-center gap-2 lg:gap-3">
            {/* Feedback Button */}
            <button 
              className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all duration-200 shadow-sm group"
              title="Provide feedback"
            >
              <MessageCircleHeart className="w-4 h-4 text-pink-500 group-hover:text-pink-600" />
              <span className="hidden sm:inline">Feedback</span>
            </button>

            {/* Messages */}
            <button 
              className="p-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-all duration-200 shadow-sm group"
              title="Messages"
            >
              <MessageCircle className="w-5 h-5 text-slate-600 group-hover:text-slate-800" />
            </button>

            {/* Profile */}
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-full w-9 h-9 flex items-center justify-center shadow-sm">
              <span className="text-sm font-semibold">K</span>
            </div>

            {/* Invite/Share Actions */}
            <div className="flex items-center gap-1">
              <button 
                className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-l-lg text-sm font-medium hover:bg-slate-50 transition-all duration-200 shadow-sm group"
                title="Invite team members"
              >
                <Users className="w-4 h-4 text-emerald-500 group-hover:text-emerald-600" />
                <span className="hidden sm:inline">Invite</span>
                <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-xs font-medium">1</span>
              </button>
              <button 
                className="p-2 bg-white border border-slate-300 border-l-0 rounded-r-lg hover:bg-slate-50 transition-all duration-200 shadow-sm group"
                title="Share employee data"
              >
                <Share2 className="w-4 h-4 text-slate-600 group-hover:text-slate-800" />
              </button>
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

            {/* Filter Button */}
            <button 
              className="flex items-center gap-2 px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all duration-200 shadow-sm"
              title="Filter employees"
            >
              <Filter className="w-4 h-4 text-slate-600" />
              <span>Filter</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md ml-auto">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Employee List Content */}
        <div className="space-y-6">
          <EmployeeList 
            onOpen={modalOpen} 
            loading={loading}
            employees={filteredEmployees}
            delay={300}
            setSelectedEmployee={setSelectedEmployee}
          />
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