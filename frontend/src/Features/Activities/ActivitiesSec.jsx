import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageCircleHeart,
  MessageCircle,
  Link,
  Search,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  Users,
  Share2,
  Sparkles,
  MoreHorizontal,
  Calendar1,
  ClipboardList,
  MapPin,
  Phone,
  Handshake,
  Mail,
  Presentation
} from "lucide-react";
import ActivitiesDetails from "./ActivitiesDetails";
import ActivityView from "./ActivityView";
import FilterPanel from "../../components/filters/FilterPanel";

export default function ActivitiesSec({ modalOpen, onEdit, activities, setActivities, loadActivities, loading, isAdmin, page, setPage, pageSize, setPageSize, totalCount, totalPages, searchQuery, setSearchQuery, filters, setFilter, clearAllFilters, filterConfig, typeCounts }) {
  const [localSearch, setLocalSearch] = useState(searchQuery || "");
  const [viewCalendar, setViewCalender] = useState(false);
  const debounceRef = useRef(null);

  // Debounced server-side search
  const handleSearchChange = useCallback((value) => {
    setLocalSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      setSearchQuery(value);
    }, 400);
  }, [setPage, setSearchQuery]);

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const openCalenderModal = () => {
    setViewCalender(true);
  };

  const closeCalenderModal = () => {
    setViewCalender(false);
  };

  // Handle refresh
  const handleRefresh = () => {
    loadActivities();
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="w-full bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-full">
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
              <Calendar className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">
                Sales Plans
              </h1>
              <span className="text-sm text-slate-500 font-normal">
                ({totalCount.toLocaleString()} total)
              </span>
            </div>
          </div> 
        </div>

        {/* Action Bar */}
        <div className={`flex flex-col sm:flex-row gap-4 py-4 border-t border-slate-200 mb-6 relative z-10 ${!loading ? 'animate-fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
          <div className="flex flex-wrap items-center gap-3">
            {/* New Activity Button */}
            <button 
              onClick={modalOpen}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
            >
              <Plus className="w-5 h-5" />
              <span>New Activity</span>
            </button>

            {/* Multi-Select Filters */}
            {filterConfig && (
              <FilterPanel
                filterConfig={filterConfig}
                filters={filters}
                onFilterChange={setFilter}
                onClearAll={clearAllFilters}
                accentColor="blue"
              />
            )}
          </div>

          {/* View Activity Button */}
          <button 
            onClick={openCalenderModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
          >
            <Calendar1 className="w-5 h-5" />
            <span>View Activities</span>
          </button>

          {/* Search */}
          <div className="flex-1 max-w-md ml-auto">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search activities..."
                value={localSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
              />
              {localSearch && (
                <button
                  onClick={() => { setLocalSearch(""); setPage(1); setSearchQuery(""); }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {typeCounts && (
          <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6 ${!loading ? 'animate-fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '250ms', animationFillMode: 'both' }}>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Activities</p>
                  <p className="text-2xl font-bold text-gray-800">{typeCounts.total || 0}</p>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <ClipboardList className="text-blue-600" size={24} />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Site Visit</p>
                  <p className="text-2xl font-bold text-gray-800">{typeCounts.siteVisit || 0}</p>
                </div>
                <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                  <MapPin className="text-orange-600" size={24} />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Phone Call</p>
                  <p className="text-2xl font-bold text-gray-800">{typeCounts.call || 0}</p>
                </div>
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                  <Phone className="text-green-600" size={24} />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Meeting</p>
                  <p className="text-2xl font-bold text-gray-800">{typeCounts.meeting || 0}</p>
                </div>
                <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center">
                  <Handshake className="text-indigo-600" size={24} />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="text-2xl font-bold text-gray-800">{typeCounts.email || 0}</p>
                </div>
                <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                  <Mail className="text-purple-600" size={24} />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Presentation</p>
                  <p className="text-2xl font-bold text-gray-800">{typeCounts.presentation || 0}</p>
                </div>
                <div className="w-12 h-12 bg-pink-50 rounded-lg flex items-center justify-center">
                  <Presentation className="text-pink-600" size={24} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Activities Content */}
        <div className="space-y-6">
          {searchQuery && activities.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
              <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No activities found</h3>
              <p className="text-slate-500">
                Try adjusting your search query
              </p>
            </div>
          ) : (
            <ActivitiesDetails
              onOpen={modalOpen}
              onEdit={onEdit}
              loading={loading}
              delay={300}
              activities={activities}
              setActivities={setActivities}
              loadActivities={loadActivities}
            />
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-lg border border-slate-200 px-4 py-3">
              {/* Page size selector & info */}
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <span>Show</span>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                  className="border border-slate-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span>per page</span>
                <span className="text-slate-400">|</span>
                <span>
                  {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, totalCount)} of {totalCount.toLocaleString()}
                </span>
              </div>

              {/* Page navigation */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className="px-2 py-1 text-sm rounded-md hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="First page"
                >
                  First
                </button>
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="p-1 rounded-md hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {getPageNumbers().map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 text-sm rounded-md transition-colors ${
                      p === page
                        ? 'bg-blue-600 text-white font-medium'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    {p}
                  </button>
                ))}

                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="p-1 rounded-md hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                  className="px-2 py-1 text-sm rounded-md hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Last page"
                >
                  Last
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Floating refresh button */}
        <div className="fixed bottom-6 right-6 z-30">
          <button
            onClick={handleRefresh}
            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 group"
            title="Refresh Activities"
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

      {/* Activity View Modal */}
      {viewCalendar && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <ActivityView 
            data={activities}
            onClose={closeCalenderModal}
            isAdmin={isAdmin}
          />
        </div>
      )}
    </div>
  );
}