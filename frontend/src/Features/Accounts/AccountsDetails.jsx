import React, { useState, useEffect } from "react";
import {
  ChevronDown,
  Plus,
  Building,
  Globe,
  MapPin,
  Users,
  BarChart3,
  Clock,
  User,
  Briefcase,
  MoreHorizontal,
  ExternalLink,
  Activity,
  Edit,
} from "lucide-react";

export default function AccountsDetails({ onOpen, onEdit, setSelectedAccount, accounts, error, loading, loadAccounts }) {
 

  // useEffect(()=>{

  // },[accounts]);

  const handleEdit = (account) => {
    setSelectedAccount(account);
    onOpen();
  };

  // Loading skeleton for table
  const LoadingSkeleton = () => (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 bg-slate-200 rounded"></div>
          <div className="h-6 bg-slate-200 rounded w-24"></div>
          <div className="h-8 bg-slate-200 rounded w-32"></div>
        </div>
        <div className="w-4 h-4 bg-slate-200 rounded"></div>
      </div>

      {/* Table skeleton */}
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Header row */}
          <div className="grid grid-cols-11 gap-4 p-4 bg-slate-50 border-b border-slate-200">
            {Array.from({ length: 11 }).map((_, i) => (
              <div key={i} className="h-4 bg-slate-200 rounded"></div>
            ))}
          </div>

          {/* Data rows */}
          {Array.from({ length: 3 }).map((_, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-11 gap-4 p-4 border-b border-slate-100">
              {Array.from({ length: 11 }).map((_, i) => (
                <div key={i} className="h-4 bg-slate-200 rounded"></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Company size badge
  const CompanySizeBadge = ({ size }) => {
    if (!size) return null;
    
    const getSizeColor = () => {
      if (size.includes('10000+') || size.includes('10,000+')) return 'bg-purple-500';
      if (size.includes('5001') || size.includes('5,000')) return 'bg-blue-500';
      if (size.includes('1001') || size.includes('1,000')) return 'bg-green-500';
      return 'bg-amber-500';
    };

    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white ${getSizeColor()}`}>
        <Users className="w-3 h-3" />
        <span>{size}</span>
      </div>
    );
  };

  // Industry badge
  const IndustryBadge = ({ industry }) => {
    if (!industry) return null;
    
    return (
      <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
        <Briefcase className="w-3 h-3" />
        <span className="truncate max-w-32">{industry}</span>
      </div>
    );
  };

  // Domain link component
  const DomainLink = ({ domain }) => {
    if (!domain) return <span className="text-sm text-slate-400">-</span>;
    
    return (
      <a
        href={domain.startsWith('http') ? domain : `https://${domain}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-800 transition-colors group"
      >
        <Globe className="w-3 h-3" />
        <span className="text-sm truncate max-w-32">{domain.replace(/^https?:\/\//, '')}</span>
        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      </a>
    );
  };

  // Action buttons
  const ActionButtons = ({ account }) => (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleEdit(account)}
        className="p-2 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200"
        title="Edit account"
      >
        <Edit className="w-4 h-4" />
      </button>
    </div>
  );

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-red-200 shadow-sm p-8">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">Failed to load accounts</h3>
          <p className="text-slate-500 mb-4">{error}</p>
          <button
            onClick={loadAccounts}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
      {/* Accounts Table */}
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Desktop Table View */}
          <div className="hidden xl:block">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500 focus:ring-2"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Account</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Domain</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Industry</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Employees</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Contacts</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Deals</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accounts.map((account) => (
                  <tr key={account.sysID} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-4 py-4">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500 focus:ring-2"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-purple-600" />
                        <span className="font-medium text-slate-900">{account.accountName || '-'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <DomainLink domain={account.domain} />
                    </td>
                    <td className="px-4 py-4">
                      <IndustryBadge industry={account.industry} />
                    </td>
                    <td className="px-4 py-4 max-w-48">
                      <p className="text-sm text-slate-600 truncate" title={account.description}>
                        {account.description || '-'}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <CompanySizeBadge size={account.numberOfEmployees} />
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate max-w-32">{account.headquartersLocation || '-'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span className="truncate max-w-24">{account.contacts || '-'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <BarChart3 className="w-3 h-3" />
                        <span className="truncate max-w-24">{account.deals || '-'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <ActionButtons account={account} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile/Tablet Card View */}
          <div className="xl:hidden p-4 space-y-4">
            {accounts.map((account) => (
              <div key={account.sysID} className="bg-slate-50 rounded-lg p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500 focus:ring-2" 
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Building className="w-4 h-4 text-purple-600" />
                        <h3 className="font-medium text-slate-900">{account.accountName}</h3>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <DomainLink domain={account.domain} />
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <IndustryBadge industry={account.industry} />
                        <CompanySizeBadge size={account.numberOfEmployees} />
                      </div>
                    </div>
                  </div>
                  <ActionButtons account={account} />
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-slate-600">{account.description || 'No description'}</p>
                  
                  <div className="grid grid-cols-1 gap-2 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>Location: {account.headquartersLocation || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>Contacts: {account.contacts || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      <span>Deals: {account.deals || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Empty state for when no accounts */}
      {accounts.length === 0 && !loading && (
        <div className="text-center py-12">
          <Building className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No accounts yet</h3>
          <p className="text-slate-500 mb-4">Get started by adding your first account</p>
          {onOpen && (
            <button 
              onClick={onOpen}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Account
            </button>
          )}
        </div>
      )}
    </div>
  );
}