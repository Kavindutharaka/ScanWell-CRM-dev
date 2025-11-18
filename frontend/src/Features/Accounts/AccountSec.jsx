import React, { useState, useEffect, useMemo } from "react";
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
  Sparkles,
  MoreHorizontal,
  Building
} from "lucide-react";
import AccountsDetails from "./AccountsDetails";

export default function AccountSec({ modalOpen, setSelectedAccount, error, accounts, loadAccounts}) {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);
  
  // Filter accounts based on search query
  const filteredAccounts = useMemo(() => {
    if (!searchQuery.trim()) {
      return accounts;
    }

    const query = searchQuery.toLowerCase();

    return accounts.filter(account => {
      // Search across multiple fields
      const searchableFields = [
        account.accountName,
        account.domain,
        account.industry,
        account.description,
        account.headquartersLocation,
        account.numberOfEmployees?.toString(),
      ];

      return searchableFields.some(field => 
        field?.toLowerCase().includes(query)
      );
    });
  }, [accounts, searchQuery]);

  // Handle refresh
  const handleRefresh = () => {
    setLoading(true);
    loadAccounts(); // Reload accounts from your data source
    setTimeout(() => setLoading(false), 1500);
  };

  return (
    <div className="w-full bg-gradient-to-br from-slate-50 to-purple-50/30 min-h-full">
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
              <Building className="w-6 h-6 text-purple-600" />
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">
                Accounts
              </h1>
              {/* Show filtered count when searching */}
              {searchQuery && (
                <span className="text-sm text-slate-500 font-normal">
                  ({filteredAccounts.length} of {accounts.length})
                </span>
              )}
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
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-full w-9 h-9 flex items-center justify-center shadow-sm">
              <span className="text-sm font-semibold">K</span>
            </div>

            {/* Invite/Share Actions */}
            <div className="flex items-center gap-1">
              <button 
                className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-l-lg text-sm font-medium hover:bg-slate-50 transition-all duration-200 shadow-sm group"
                title="Invite team members"
              >
                <Users className="w-4 h-4 text-purple-500 group-hover:text-purple-600" />
                <span className="hidden sm:inline">Invite</span>
                <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-xs font-medium">1</span>
              </button>
              <button 
                className="p-2 bg-white border border-slate-300 border-l-0 rounded-r-lg hover:bg-slate-50 transition-all duration-200 shadow-sm group"
                title="Share account"
              >
                <Share2 className="w-4 h-4 text-slate-600 group-hover:text-slate-800" />
              </button>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className={`flex flex-col sm:flex-row gap-4 py-4 border-t border-slate-200 mb-6 ${!loading ? 'animate-fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
          <div className="flex flex-wrap items-center gap-3">
            {/* New Account Button */}
            <button 
              onClick={modalOpen}
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
              title="Create a new account"
            >
              <Plus className="w-5 h-5" />
              <span>New Account</span>
            </button>

            {/* Filter Button */}
            <button 
              className="flex items-center gap-2 px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all duration-200 shadow-sm"
              title="Filter accounts"
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
                placeholder="Search accounts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-sm"
              />
              {/* Clear search button */}
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Accounts Content */}
        <div className="space-y-6">
          {/* Show no results message */}
          {searchQuery && filteredAccounts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
              <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No accounts found</h3>
              <p className="text-slate-500">
                Try adjusting your search query
              </p>
            </div>
          ) : (
            <AccountsDetails 
              onOpen={modalOpen} 
              loading={loading}
              delay={300}
              setSelectedAccount={setSelectedAccount}
              error={error}
              accounts={filteredAccounts} // Pass filtered accounts
              loadAccounts={loadAccounts}
            />
          )}
        </div>

        {/* Floating refresh button */}
        <div className="fixed bottom-6 right-6 z-30">
          <button
            onClick={handleRefresh}
            className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 group"
            title="Refresh Accounts"
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