import React, { useState, useEffect } from "react";
import {
  ChevronDown,
  Plus,
  DollarSign,
  User,
  Calendar,
  Building,
  Activity,
  MoreHorizontal,
  Target,
  Percent,
  TrendingUp,
  Clock,
  FileText,
  Phone,
  Mail,
  AlertCircle,
  RefreshCw
} from "lucide-react";

export default function Deals({ onOpen, onEdit, deals, loadDeals, loading, error }) {

  // Fetch deals on component mount
  

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
          <div className="grid grid-cols-13 gap-4 p-4 bg-slate-50 border-b border-slate-200">
            {Array.from({ length: 13 }).map((_, i) => (
              <div key={i} className="h-4 bg-slate-200 rounded"></div>
            ))}
          </div>
          {Array.from({ length: 3 }).map((_, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-13 gap-4 p-4 border-b border-slate-100">
              {Array.from({ length: 13 }).map((_, i) => (
                <div key={i} className="h-4 bg-slate-200 rounded"></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Error state
  const ErrorState = () => (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
      <div className="text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-2">Failed to load deals</h3>
        <p className="text-slate-500 mb-4">{error}</p>
        <button
          onClick={loadDeals}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    </div>
  );

  // Stage badge component
  const StageBadge = ({ stage, color }) => {
    const getIcon = () => {
      switch (stage?.toLowerCase()) {
        case "discovery":
          return <Target className="w-3 h-3" />;
        case "proposal":
          return <FileText className="w-3 h-3" />;
        case "negotiation":
          return <TrendingUp className="w-3 h-3" />;
        default:
          return <Clock className="w-3 h-3" />;
      }
    };

    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white ${color}`}>
        {getIcon()}
        <span>{stage}</span>
      </div>
    );
  };

  // Timeline component
  const TimelineBars = ({ timeline }) => (
    <div className="flex gap-1 justify-center items-center">
      {timeline.map((day, index) => {
        let color = 'bg-slate-200';
        if (day.status === 'proposal') color = 'bg-amber-500';
        else if (day.status === 'negotiation') color = 'bg-red-500';
        else if (day.status === 'active') color = 'bg-green-500';
        else if (day.status === 'inactive') color = 'bg-slate-300';

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

  // Avatar component
  const Avatar = ({ name, color = "bg-emerald-600" }) => (
    <div className={`${color} text-white rounded-full w-8 h-8 flex items-center justify-center shadow-sm`}>
      <span className="text-sm font-semibold">{name}</span>
    </div>
  );

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  // Handle row click for editing
  const handleRowClick = (deal) => {
    if (onEdit) {
      // Transform back to backend format for editing
      const dealData = {
        sysID: deal.id,
        dealName: deal.name,
        stage: deal.stage,
        owner: deal.owner,
        dealsValue: deal.value.toString(),
        contacts: deal.contacts,
        accounts: deal.account,
        expectedCloseDate: deal.expectedCloseDate,
        closeProbability: deal.closeProbability.toString(),
        forecastValue: deal.forecastValue.toString(),
        lastInteraction: deal.lastInteraction,
        quotesInvoicesNumber: deal.quotesInvoices,
        notes: deal.notes
      };
      onEdit(dealData);
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorState />;
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-slate-900">Sales</h2>
          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
            {deals.length} {deals.length === 1 ? 'deal' : 'deals'}
          </span>
        </div>
        <button
          onClick={loadDeals}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          title="Refresh deals"
        >
          <RefreshCw className="w-4 h-4 text-slate-600" />
        </button> 
      </div>

      {/* Deals Table */}
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Desktop Table View */}
          <div className="hidden xl:block">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {/* Sticky Checkbox Column */}
                  <th className="px-4 py-3 text-left bg-slate-50 sticky left-0 z-20 border-r border-slate-200 shadow-sm">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 focus:ring-2"
                    />
                  </th>
                  
                  {/* Sticky Deal Name Column */}
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider bg-slate-50 sticky left-16 z-20 border-r border-slate-200 min-w-48 shadow-sm">
                    Deal Name
                  </th>
                  
                  {/* Scrollable Columns */}
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-40">Timeline</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-32">Stage</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-24">Owner</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-32">Value</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-40">Contacts</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-32">Account</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-36">Close Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-28">Probability</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-32">Forecast</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-32">Last Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-32">Quotes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deals.map((deal) => (
                  <tr 
                    key={deal.id} 
                    onClick={() => handleRowClick(deal)}
                    className="hover:bg-slate-50 transition-colors group cursor-pointer"
                  >
                    {/* Sticky Checkbox */}
                    <td 
                      className="px-4 py-4 bg-white sticky left-0 z-10 border-r border-slate-200 shadow-sm group-hover:bg-slate-50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 focus:ring-2"
                      />
                    </td>
                    
                    {/* Sticky Deal Name */}
                    <td className="px-4 py-4 bg-white sticky left-16 z-10 border-r border-slate-200 min-w-48 shadow-sm group-hover:bg-slate-50">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-600" />
                        <span className="font-medium text-slate-900">{deal.name}</span>
                      </div>
                    </td>
                    
                    {/* Scrollable Content */}
                    <td className="px-4 py-4">
                      <TimelineBars timeline={deal.timeline} />
                    </td>
                    <td className="px-4 py-4">
                      <StageBadge stage={deal.stage} color={deal.stageColor} />
                    </td>
                    <td className="px-4 py-4">
                      <Avatar name={deal.owner} />
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-emerald-600">
                      {formatCurrency(deal.value)}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span className="truncate max-w-32">{deal.contacts}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <Building className="w-3 h-3" />
                        <span>{deal.account}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(deal.expectedCloseDate)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <Percent className="w-3 h-3 text-slate-500" />
                        <span className="font-medium text-slate-900">{deal.closeProbability}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-slate-900">
                      {formatCurrency(deal.forecastValue)}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(deal.lastInteraction)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        <span>{deal.quotesInvoices}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile/Tablet Card View */}
          <div className="xl:hidden p-4 space-y-4">
            {deals.map((deal) => (
              <div 
                key={deal.id} 
                onClick={() => handleRowClick(deal)}
                className="bg-slate-50 rounded-lg p-4 space-y-4 cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 focus:ring-2"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-4 h-4 text-emerald-600" />
                        <h3 className="font-medium text-slate-900">{deal.name}</h3>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <StageBadge stage={deal.stage} color={deal.stageColor} />
                        <span className="text-lg font-bold text-emerald-600">{formatCurrency(deal.value)}</span>
                      </div>
                    </div>
                  </div>
                  <Avatar name={deal.owner} />
                </div>
                
                <div className="space-y-2">
                  <div className="grid grid-cols-1 gap-2 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      <span>Account: {deal.account}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>Contacts: {deal.contacts}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Close Date: {formatDate(deal.expectedCloseDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Percent className="w-4 h-4" />
                      <span>Probability: {deal.closeProbability}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      <span>Forecast: {formatCurrency(deal.forecastValue)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>Last Contact: {formatDate(deal.lastInteraction)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span>Quote: {deal.quotesInvoices}</span>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-4 h-4" />
                      <span className="text-sm font-medium">Activity Timeline:</span>
                    </div>
                    <TimelineBars timeline={deal.timeline} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Empty state */}
      {deals.length === 0 && !loading && !error && (
        <div className="text-center py-12">
          <DollarSign className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No deals yet</h3>
          <p className="text-slate-500 mb-4">Get started by creating your first deal</p>
          {onOpen && (
            <button 
              onClick={onOpen}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Deal
            </button>
          )}
        </div>
      )}
    </div>
  );
}