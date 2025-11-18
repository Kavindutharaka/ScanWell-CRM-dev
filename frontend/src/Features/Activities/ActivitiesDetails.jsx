import React, { useState, useEffect } from "react";
import {
  ChevronDown,
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
  RefreshCw
} from "lucide-react";
import { fetchActivities, deleteActivity } from "../../api/ActivityApi";

export default function ActivitiesDetails({ onOpen, onEdit, loading: initialLoading = false, delay = 0, activities, loadActivities, setActivities }) {
  // const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(initialLoading);
  const [error, setError] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());

 

  // Handle row selection
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(new Set(activities.map(a => a.id)));
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
  const Avatar = ({ name }) => {
    const colors = ['bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-green-500', 'bg-indigo-500', 'bg-red-500'];
    const hashCode = name.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const color = colors[hashCode % colors.length];

    return (
      <div className={`${color} text-white rounded-full w-8 h-8 flex items-center justify-center shadow-sm text-xs font-semibold`}>
        {name.charAt(0).toUpperCase()}
      </div>
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
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-slate-100 gap-4">
        <div className="flex items-center gap-3">
          <button className="p-1 hover:bg-slate-100 rounded transition-colors group">
            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
          </button>
          <h2 className="text-lg font-bold text-slate-800">Sales Calls</h2>
          <span className="text-sm text-slate-500">({activities.length})</span>
          {/* {onOpen && (
            <button
              onClick={onOpen}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all duration-200 active:scale-95 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Activity</span>
            </button>
          )} */}
        </div>

        <button
          onClick={loadActivities}
          className="p-1 hover:bg-slate-100 rounded transition-colors"
          title="Refresh activities"
        >
          <RefreshCw className="w-4 h-4 text-slate-400 hover:text-slate-600" />
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Activities Table */}
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    {/* <input
                      type="checkbox"
                      checked={selectedIds.size === activities.length && activities.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 focus:ring-2"
                    /> */}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Activity</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Owner</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Start Time</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">End Time</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Related Item</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activities.map((activity) => {
                  const TypeIcon = activity.typeIcon;
                  return (
                    <tr key={activity.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <PriorityIndicator priority={activity.priority} />
                          {/* <input
                            type="checkbox"
                            checked={selectedIds.has(activity.id)}
                            onChange={(e) => handleSelectRow(activity.id, e)}
                            className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 focus:ring-2"
                          /> */}
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
                        <Avatar name={activity.owner} />
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600 whitespace-nowrap">
                        {activity.startTime}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600 whitespace-nowrap">
                        {activity.endTime}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={activity.status} color={activity.statusColor} />
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        {activity.relatedItem}
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
                          {/* <button
                            onClick={() => handleDelete(activity.id)}
                            className="p-1.5 hover:bg-red-100 rounded transition-colors"
                            title="Delete activity"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button> */}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden p-4 space-y-4">
            {activities.map((activity) => {
              const TypeIcon = activity.typeIcon;
              return (
                <div key={activity.id} className="bg-slate-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <PriorityIndicator priority={activity.priority} />
                      <input
                        type="checkbox"
                        checked={selectedIds.has(activity.id)}
                        onChange={(e) => handleSelectRow(activity.id, e)}
                        className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
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
                    <Avatar name={activity.owner} />
                  </div>

                  <div className="grid grid-cols-1 gap-2 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{activity.startTime} - {activity.endTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>Related: {activity.relatedItem}</span>
                    </div>
                  </div>

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
      {activities.length === 0 && !error && (
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