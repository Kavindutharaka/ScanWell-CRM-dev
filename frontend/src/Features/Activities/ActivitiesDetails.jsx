import React, { useState, useEffect, useMemo } from "react";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Plus,
  Phone,
  Mail,
  Calendar,
  Users,
  MoreHorizontal,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  Trash2,
  Edit2,
  RefreshCw,
  X
} from "lucide-react";
import { fetchActivities, deleteActivity, fetchActivityHistory } from "../../api/ActivityApi";

export default function ActivitiesDetails({ onOpen, onEdit, loading: initialLoading = false, delay = 0, activities, loadActivities, setActivities }) {
  const [loading, setLoading] = useState(initialLoading);
  const [error, setError] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [activityHistory, setActivityHistory] = useState({});
  const [loadingHistory, setLoadingHistory] = useState({});
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });

  // Fetch activity status history
  const fetchActivityHistoryData = async (activityId) => {
    if (activityHistory[activityId]) {
      return; // Already loaded
    }

    setLoadingHistory(prev => ({ ...prev, [activityId]: true }));
    
    try {
      const data = await fetchActivityHistory(activityId);
      
      setActivityHistory(prev => ({
        ...prev,
        [activityId]: data
      }));
    } catch (err) {
      console.error('Error fetching activity history:', err);
      setError('Failed to load activity history. Please try again.');
    } finally {
      setLoadingHistory(prev => ({ ...prev, [activityId]: false }));
    }
  };

  // Handle column sorting
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Clear sorting
  const clearSort = () => {
    setSortConfig({ key: null, direction: 'asc' });
  };

  // Toggle expand/collapse
  const toggleExpand = async (activityId) => {
    const newExpanded = new Set(expandedRows);
    
    if (newExpanded.has(activityId)) {
      newExpanded.delete(activityId);
    } else {
      newExpanded.add(activityId);
      // Fetch history when expanding
      await fetchActivityHistoryData(activityId);
    }
    
    setExpandedRows(newExpanded);
  };

  // Sort activities based on sortConfig
  const sortedActivities = useMemo(() => {
    if (!sortConfig.key) return activities;

    const sorted = [...activities].sort((a, b) => {
      let aValue, bValue;

      switch(sortConfig.key) {
        case 'startTime':
          aValue = new Date(a.startTime).getTime();
          bValue = new Date(b.startTime).getTime();
          break;
        case 'endTime':
          aValue = new Date(a.endTime).getTime();
          bValue = new Date(b.endTime).getTime();
          break;
        case 'owner':
          aValue = (a.owner || '').toLowerCase();
          bValue = (b.owner || '').toLowerCase();
          return sortConfig.direction === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        default:
          return 0;
      }

      return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return sorted;
  }, [activities, sortConfig]);

  // Handle row selection
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(new Set(sortedActivities.map(a => a.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id, e) => {
    e.stopPropagation();
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Handle edit
  const handleEdit = (activity) => {
    if (onEdit) {
      onEdit(activity.rawData);
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this activity?')) {
      return;
    }
    try {
      await deleteActivity(id);
      setActivities(activities.filter(a => a.id !== id));
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    } catch (err) {
      console.error('Error deleting activity:', err);
      setError('Failed to delete activity. Please try again.');
    }
  };

  // Format date to MM/DD/YYYY HH:mm AM/PM
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12; // Convert to 12-hour format
    const formattedHours = String(hours).padStart(2, '0');
    
    return `${month}/${day}/${year} ${formattedHours}:${minutes} ${ampm}`;
  };

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
          <div className="grid grid-cols-8 gap-4 p-4 bg-slate-50 border-b border-slate-200">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-4 bg-slate-200 rounded"></div>
            ))}
          </div>

          {Array.from({ length: 3 }).map((_, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-8 gap-4 p-4 border-b border-slate-100">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-4 bg-slate-200 rounded"></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Status badge component
  const StatusBadge = ({ status, color }) => {
    const getIcon = () => {
      if (status === 'completed') return <CheckCircle2 className="w-3 h-3" />;
      if (status === 'in-progress') return <Clock className="w-3 h-3" />;
      return <Circle className="w-3 h-3" />;
    };

    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white ${color}`}>
        {getIcon()}
        <span className="capitalize">{status}</span>
      </div>
    );
  };

  // Priority indicator
  const PriorityIndicator = ({ priority }) => {
    const bgColor = priority === 'high' ? 'bg-red-400' : priority === 'medium' ? 'bg-amber-400' : 'bg-green-400';
    return <div className={`w-2 h-8 rounded-full ${bgColor}`}></div>;
  };

  // Avatar component
  const Avatar = ({ initials, fullName }) => {
    const colors = ['bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-green-500', 'bg-indigo-500', 'bg-red-500'];
    
    // Safely handle null or undefined fullName
    const safeName = fullName || 'Unassigned';
    const hashCode = safeName.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const color = colors[hashCode % colors.length];

    return (
      <div className="relative group">
        <div className={`${color} text-white rounded-full w-8 h-8 flex items-center justify-center shadow-sm text-xs font-semibold cursor-pointer transition-transform hover:scale-110`}>
          {initials}
        </div>
        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10">
          {safeName}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
        </div>
      </div>
    );
  };

  // Sortable column header component
  const SortableHeader = ({ label, sortKey, align = 'left' }) => {
    const isActive = sortConfig.key === sortKey;
    const direction = sortConfig.direction;
    
    return (
      <th 
        className={`px-4 py-3 text-${align} text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors select-none`}
        onClick={() => handleSort(sortKey)}
      >
        <div className="flex items-center gap-1">
          <span>{label}</span>
          <div className="flex flex-col">
            <ChevronUp 
              className={`w-3 h-3 -mb-1 ${isActive && direction === 'asc' ? 'text-blue-600' : 'text-slate-400'}`}
            />
            <ChevronDown 
              className={`w-3 h-3 ${isActive && direction === 'desc' ? 'text-blue-600' : 'text-slate-400'}`}
            />
          </div>
        </div>
      </th>
    );
  };

  // Activity History Row Component
  const ActivityHistoryRow = ({ activityId }) => {
    const history = activityHistory[activityId] || [];
    const isLoading = loadingHistory[activityId];

    if (isLoading) {
      return (
        <tr>
          <td colSpan="10" className="px-4 py-3 bg-slate-50">
            <div className="flex items-center justify-center gap-2 text-slate-500">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading history...</span>
            </div>
          </td>
        </tr>
      );
    }

    if (!history || history.length === 0) {
      return (
        <tr>
          <td colSpan="10" className="px-4 py-3 bg-slate-50">
            <div className="text-center text-sm text-slate-500">
              No history available
            </div>
          </td>
        </tr>
      );
    }

    return (
      <tr>
        <td colSpan="10" className="px-4 py-3 bg-slate-50">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Activity History</h4>
            <div className="space-y-2">
              {history.map((record) => (
                <div key={record.sysID} className="bg-white rounded-lg p-3 border border-slate-200">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <StatusBadge 
                          status={record.new_status} 
                          color={
                            record.new_status === 'completed' ? 'bg-green-500' :
                            record.new_status === 'in-progress' ? 'bg-blue-500' :
                            'bg-slate-500'
                          }
                        />
                        <span className="text-xs text-slate-500">
                          {formatDate(record.created_at)}
                        </span>
                      </div>
                      {record.note && (
                        <p className="text-sm text-slate-600 pl-1">
                          {record.note}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </td>
      </tr>
    );
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div
      className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 animate-slideInLeft"
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: 'both'
      }}
    >

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Activities Table */}
      <div className="overflow-x-auto max-h-[630px] overflow-y-auto">
        <div className="min-w-full">
          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <table className="w-full relative">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left w-12"></th>
                  <th className="px-4 py-3 text-left">
                    {/* Checkbox header if needed */}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Activity</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Type</th>
                  <SortableHeader label="Owner" sortKey="owner" />
                  <SortableHeader label="Start Time" sortKey="startTime" />
                  <SortableHeader label="End Time" sortKey="endTime" />
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Related Account</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedActivities.map((activity) => {
                  const TypeIcon = activity.typeIcon;
                  const isExpanded = expandedRows.has(activity.id);
                  
                  return (
                    <React.Fragment key={activity.id}>
                      <tr className="hover:bg-slate-50 transition-colors group">
                        <td className="px-4 py-4">
                          <button
                            onClick={() => toggleExpand(activity.id)}
                            className="p-1 hover:bg-slate-200 rounded transition-all"
                            title={isExpanded ? "Collapse history" : "Expand history"}
                          >
                            <ChevronRight 
                              className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
                                isExpanded ? 'rotate-90' : ''
                              }`}
                            />
                          </button>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <PriorityIndicator priority={activity.priority} />
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <TypeIcon className="w-4 h-4 text-slate-500" />
                            <span className="font-medium text-slate-900">{activity.title}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white ${activity.typeColor}`}>
                            <TypeIcon className="w-3 h-3" />
                            <span>{activity.type}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <Avatar initials={activity.ownerInitial} fullName={activity.owner} />
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600 whitespace-nowrap">
                          {formatDate(activity.startTime)}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600 whitespace-nowrap">
                          {formatDate(activity.endTime)}
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge status={activity.status} color={activity.statusColor} />
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600">
                          {activity.relatedAccount}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(activity)}
                              className="p-1.5 hover:bg-blue-100 rounded transition-colors"
                              title="Edit activity"
                            >
                              <Edit2 className="w-4 h-4 text-blue-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      
                      {/* Expanded History Row */}
                      {isExpanded && (
                        <ActivityHistoryRow activityId={activity.id} />
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden p-4 space-y-4">
            {sortedActivities.map((activity) => {
              const TypeIcon = activity.typeIcon;
              const isExpanded = expandedRows.has(activity.id);
              const history = activityHistory[activity.id] || [];
              const isLoadingHistory = loadingHistory[activity.id];
              
              return (
                <div key={activity.id} className="bg-slate-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <button
                        onClick={() => toggleExpand(activity.id)}
                        className="p-1 hover:bg-slate-200 rounded transition-all"
                      >
                        <ChevronRight 
                          className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
                            isExpanded ? 'rotate-90' : ''
                          }`}
                        />
                      </button>
                      <PriorityIndicator priority={activity.priority} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <TypeIcon className="w-4 h-4 text-slate-500" />
                          <h3 className="font-medium text-slate-900">{activity.title}</h3>
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white ${activity.typeColor}`}>
                            <TypeIcon className="w-3 h-3" />
                            <span>{activity.type}</span>
                          </div>
                          <StatusBadge status={activity.status} color={activity.statusColor} />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <Avatar initials={activity.ownerInitial} fullName={activity.owner} />
                      <span className="text-xs text-slate-600 font-medium">{activity.owner || 'Unassigned'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{formatDate(activity.startTime)} - {formatDate(activity.endTime)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>Related: {activity.relatedAccount}</span>
                    </div>
                  </div>

                  {/* Expanded History for Mobile */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-300">
                      {isLoadingHistory ? (
                        <div className="flex items-center justify-center gap-2 text-slate-500 py-4">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Loading history...</span>
                        </div>
                      ) : history.length === 0 ? (
                        <div className="text-center text-sm text-slate-500 py-4">
                          No history available
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold text-slate-700 mb-2">Activity History</h4>
                          {history.map((record) => (
                            <div key={record.sysID} className="bg-white rounded-lg p-3 border border-slate-200">
                              <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                  <StatusBadge 
                                    status={record.new_status} 
                                    color={
                                      record.new_status === 'completed' ? 'bg-green-500' :
                                      record.new_status === 'in-progress' ? 'bg-blue-500' :
                                      'bg-slate-500'
                                    }
                                  />
                                  <span className="text-xs text-slate-500">
                                    {formatDate(record.created_at)}
                                  </span>
                                </div>
                                {record.note && (
                                  <p className="text-sm text-slate-600">
                                    {record.note}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => handleEdit(activity)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-100 text-blue-600 rounded transition-colors hover:bg-blue-200"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(activity.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-100 text-red-600 rounded transition-colors hover:bg-red-200"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Empty state */}
      {sortedActivities.length === 0 && !error && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No activities yet</h3>
          <p className="text-slate-500 mb-4">Get started by creating your first activity</p>
          {onOpen && (
            <button
              onClick={onOpen}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Activity
            </button>
          )}
        </div>
      )}
    </div>
  );
}