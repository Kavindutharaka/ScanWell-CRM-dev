import React, { useState, useEffect } from "react";
import {
  ChevronDown,
  Plus,
  FolderOpen,
  User,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  MoreHorizontal,
  Calendar,
  Target,
  Building,
  RefreshCw,
  Edit,
  Trash2
} from "lucide-react";
import { fetchProjects } from "../../api/ProjectApi";

export default function ProjectDetails({ onOpen, onEdit, onDelete, refreshTrigger = 0, loading: parentLoading = false, delay = 0, projects , error, refreshing }) {
  
  const [selectedProjects, setSelectedProjects] = useState(new Set());

  // Handle checkbox selection
  const handleSelectProject = (projectId) => {
    const newSelected = new Set(selectedProjects);
    if (newSelected.has(projectId)) {
      newSelected.delete(projectId);
    } else {
      newSelected.add(projectId);
    }
    setSelectedProjects(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedProjects.size === projects.length) {
      setSelectedProjects(new Set());
    } else {
      setSelectedProjects(new Set(projects.map(p => p.id)));
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  // Get priority color based on priority level
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-amber-500';
      case 'high': return 'bg-red-500';
      case 'urgent': return 'bg-red-600';
      case 'critical': return 'bg-red-800';
      default: return 'bg-slate-500';
    }
  };

  // Get status color based on status
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'planning': return 'bg-blue-500';
      case 'in-progress': return 'bg-amber-500';
      case 'on-hold': return 'bg-gray-500';
      case 'review': return 'bg-purple-500';
      case 'testing': return 'bg-indigo-500';
      case 'completed': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-slate-500';
    }
  };

  // Calculate progress based on status (since backend doesn't have progress field)
  const calculateProgress = (status) => {
    switch (status?.toLowerCase()) {
      case 'planning': return 10;
      case 'in-progress': return 50;
      case 'on-hold': return 25;
      case 'review': return 75;
      case 'testing': return 85;
      case 'completed': return 100;
      case 'cancelled': return 0;
      default: return 0;
    }
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
          <div className="grid grid-cols-10 gap-4 p-4 bg-slate-50 border-b border-slate-200">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-4 bg-slate-200 rounded"></div>
            ))}
          </div>

          {/* Data rows */}
          {Array.from({ length: 3 }).map((_, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-10 gap-4 p-4 border-b border-slate-100">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-4 bg-slate-200 rounded"></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Error state component
  const ErrorState = () => (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-2">Failed to load projects</h3>
        <p className="text-slate-500 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    </div>
  );

  // Status badge component
  const StatusBadge = ({ status, color }) => {
    const getIcon = () => {
      switch (status?.toLowerCase()) {
        case "completed":
          return <CheckCircle2 className="w-3 h-3" />;
        case "in-progress":
          return <Clock className="w-3 h-3" />;
        default:
          return <Circle className="w-3 h-3" />;
      }
    };

    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white ${color}`}>
        {getIcon()}
        <span className="capitalize">{status || 'Unknown'}</span>
      </div>
    );
  };

  // Priority indicator
  const PriorityIndicator = ({ priority, color }) => (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white ${color}`}>
      <Target className="w-3 h-3" />
      <span className="capitalize">{priority || 'None'}</span>
    </div>
  );

  // Progress bar component
  const ProgressBar = ({ progress }) => (
    <div className="w-full bg-slate-200 rounded-full h-2">
      <div 
        className="bg-green-500 h-2 rounded-full transition-all duration-300"
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  );

  // Avatar component
  const Avatar = ({ name, color = "bg-slate-600" }) => {
    const initials = name ? name.substring(0, 2).toUpperCase() : 'N/A';
    return (
      <div className={`${color} text-white rounded-full w-8 h-8 flex items-center justify-center shadow-sm`}>
        <span className="text-sm font-semibold">{initials}</span>
      </div>
    );
  };

  // Action buttons component
  const ActionButtons = ({ project }) => (
    <div className="flex items-center gap-2">
      {onEdit && (
        <button
          onClick={() => onEdit(project)}
          className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-slate-500 hover:text-blue-600"
          title="Edit project"
        >
          <Edit className="w-4 h-4" />
        </button>
      )}
      {/* {onDelete && (
        <button
          onClick={() => onDelete(project)}
          className="p-2 hover:bg-red-50 rounded-lg transition-colors text-slate-500 hover:text-red-600"
          title="Delete project"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )} */}
    </div>
  );

  if (parentLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorState />;
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
          <h2 className="text-lg font-bold text-slate-800">Projects</h2>
          <span className="text-sm text-slate-500">({projects.length})</span>
          {/* {onOpen && (
            <button 
              onClick={onOpen}
              className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-all duration-200 active:scale-95 shadow-sm"
              title="Add new project"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Project</span>
            </button>
          )} */}
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            disabled={refreshing}
            className="p-1 hover:bg-slate-100 rounded transition-colors disabled:opacity-50"
            title="Refresh projects"
          >
            <RefreshCw className={`w-4 h-4 text-slate-400 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button className="p-1 hover:bg-slate-100 rounded transition-colors">
            <MoreHorizontal className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Projects Table */}
      {projects.length > 0 ? (
        <div className="overflow-x-auto">
          <div className="min-w-full">
            {/* Desktop Table View */}
            <div className="hidden lg:block">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input 
                        type="checkbox" 
                        checked={selectedProjects.size === projects.length && projects.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-green-600 border-slate-300 rounded focus:ring-green-500 focus:ring-2"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Project</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Priority</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Timeline</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Progress</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Deals</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Account</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {projects.map((project) => {
                    const progress = calculateProgress(project.status);
                    const priorityColor = getPriorityColor(project.priority);
                    const statusColor = getStatusColor(project.status);
                    
                    return (
                      <tr key={project.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-4 py-4">
                          <input 
                            type="checkbox" 
                            checked={selectedProjects.has(project.id)}
                            onChange={() => handleSelectProject(project.id)}
                            className="w-4 h-4 text-green-600 border-slate-300 rounded focus:ring-green-500 focus:ring-2"
                          />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <FolderOpen className="w-4 h-4 text-green-600" />
                            <span className="font-medium text-slate-900">{project.project_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <PriorityIndicator priority={project.priority} color={priorityColor} />
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(project.timeline)}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge status={project.status} color={statusColor} />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <ProgressBar progress={progress} />
                            <span className="text-xs text-slate-600 min-w-[30px]">{progress}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600">
                          {project.deals || '-'}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {project.contact || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600">
                          <div className="flex items-center gap-1">
                            <Building className="w-3 h-3" />
                            {project.accounts || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <ActionButtons project={project} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden p-4 space-y-4">
              {projects.map((project) => {
                const progress = calculateProgress(project.status);
                const priorityColor = getPriorityColor(project.priority);
                const statusColor = getStatusColor(project.status);
                
                return (
                  <div key={project.id} className="bg-slate-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <input 
                          type="checkbox" 
                          checked={selectedProjects.has(project.id)}
                          onChange={() => handleSelectProject(project.id)}
                          className="w-4 h-4 text-green-600 border-slate-300 rounded focus:ring-green-500 focus:ring-2" 
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <FolderOpen className="w-4 h-4 text-green-600" />
                            <h3 className="font-medium text-slate-900">{project.project_name}</h3>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <PriorityIndicator priority={project.priority} color={priorityColor} />
                            <StatusBadge status={project.status} color={statusColor} />
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <ProgressBar progress={progress} />
                            <span className="text-xs text-slate-600">{progress}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <ActionButtons project={project} />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Due: {formatDate(project.timeline)}</span>
                      </div>
                      {project.contact && (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>Contact: {project.contact}</span>
                        </div>
                      )}
                      {project.accounts && (
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4" />
                          <span>Account: {project.accounts}</span>
                        </div>
                      )}
                      {project.deals && (
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          <span>Deal: {project.deals}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Empty state */
        <div className="text-center py-12">
          <FolderOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No projects yet</h3>
          <p className="text-slate-500 mb-4">Get started by creating your first project</p>
          {onOpen && (
            <button 
              onClick={onOpen}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Project
            </button>
          )}
        </div>
      )}
    </div>
  );
}