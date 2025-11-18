import { X, FolderOpen, User, Clock, Tag, FileText, Building, Calendar, Target } from "lucide-react";
import { useState, useEffect } from "react";
import { createNewProject, updateProject } from "../../api/ProjectApi";

export default function ProjectForm({ onClose, existingProject = null, onSuccess, loadProjects }) {
  const [formData, setFormData] = useState({
    id: null,
    projectName: '',
    priority: '',
    timeline: '',
    status: '',
    deals: '',
    contact: '',
    accounts: '',
    description: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = Boolean(existingProject);

  // Populate form data if editing existing project
  useEffect(() => {
    if (existingProject) {
      console.log("Exiting project: ", existingProject);
      setFormData({
        id: existingProject.sysID,
        projectName: existingProject.project_name || '',
        priority: existingProject.priority || '',
        timeline: existingProject.timeline ? new Date(existingProject.timeline).toISOString().split('T')[0] : '',
        status: existingProject.status || '',
        deals: existingProject.deals || '',
        contact: existingProject.contact || '',
        accounts: existingProject.accounts || '',
        description: existingProject.description || ''
      });
    }
  }, [existingProject]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.projectName.trim()) {
      newErrors.projectName = 'Project name is required';
    }
    
    if (!formData.priority) {
      newErrors.priority = 'Priority is required';
    }
    
    if (!formData.status) {
      newErrors.status = 'Status is required';
    }

    if (!formData.timeline) {
      newErrors.timeline = 'Timeline is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const prepareDataForAPI = (data) => {
    // Convert form data to match backend model expectations
    return {
      ...(data.id && { id: data.id }), // Include ID only if it exists (for updates)
      projectName: data.projectName.trim(),
      priority: data.priority,
      timeline: new Date(data.timeline).toISOString(), // Convert to DateTime format
      status: data.status,
      deals: data.deals.trim() || null, // Convert empty strings to null for optional fields
      contact: data.contact.trim() || null,
      accounts: data.accounts.trim() || null,
      description: data.description.trim() || null
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const apiData = prepareDataForAPI(formData);
      let result;

      if (isEditMode) {
        console.log(apiData);
        result = await updateProject(apiData);
        console.log('Project updated successfully:', result);
      } else {
        result = await createNewProject(apiData);
        console.log('Project created successfully:', result);
      }

      // Call success callback if provided
      if (onSuccess) {
        onSuccess(result);
      }
      loadProjects();
      onClose(); // Close modal after successful submission
    } catch (error) {
      console.error('Error submitting project:', error);
      
      // Handle specific API errors
      if (error.response?.data?.errors) {
        // Handle validation errors from backend
        const backendErrors = {};
        Object.keys(error.response.data.errors).forEach(field => {
          const fieldName = field.toLowerCase();
          backendErrors[fieldName] = error.response.data.errors[field][0];
        });
        setErrors(backendErrors);
      } else {
        // Generic error handling
        setErrors({
          general: error.response?.data?.message || 'An error occurred while saving the project. Please try again.'
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'bg-green-500' },
    { value: 'medium', label: 'Medium', color: 'bg-amber-500' },
    { value: 'high', label: 'High', color: 'bg-red-500' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-600' },
    { value: 'critical', label: 'Critical', color: 'bg-red-800' }
  ];

  const statusOptions = [
    { value: 'planning', label: 'Planning', color: 'bg-blue-100 text-blue-800' },
    { value: 'in-progress', label: 'In Progress', color: 'bg-amber-100 text-amber-800' },
    { value: 'on-hold', label: 'On Hold', color: 'bg-gray-100 text-gray-800' },
    { value: 'review', label: 'Under Review', color: 'bg-purple-100 text-purple-800' },
    { value: 'testing', label: 'Testing', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-xl max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
            <FolderOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              {isEditMode ? 'Edit Project' : 'Add New Project'}
            </h1>
            <p className="text-sm text-slate-600">
              {isEditMode ? 'Update project details' : 'Create a new project to track your work'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/70 rounded-lg transition-colors group"
          aria-label="Close modal"
        >
          <X className="w-5 h-5 text-slate-500 group-hover:text-slate-700" />
        </button>
      </div>
      
      {/* Form Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* General error message */}
        {errors.general && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700 flex items-center gap-2">
              <span className="w-4 h-4">⚠️</span>
              {errors.general}
            </p>
          </div>
        )}

        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Project Name */}
            <div className="lg:col-span-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <FolderOpen className="w-4 h-4 text-green-600" />
                Project Name *
              </label>
              <input
                type="text"
                name="projectName"
                value={formData.projectName}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                  errors.projectName ? 'border-red-500 bg-red-50' : 'border-slate-300 hover:border-slate-400'
                }`}
                placeholder="Enter a descriptive project name"
              />
              {errors.projectName && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <span className="w-4 h-4">⚠️</span>
                  {errors.projectName}
                </p>
              )}
            </div>

            {/* Priority */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <Target className="w-4 h-4 text-red-600" />
                Priority *
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                  errors.priority ? 'border-red-500 bg-red-50' : 'border-slate-300 hover:border-slate-400'
                }`}
              >
                <option value="">Select priority level</option>
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.priority && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <span className="w-4 h-4">⚠️</span>
                  {errors.priority}
                </p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <Clock className="w-4 h-4 text-blue-600" />
                Status *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                  errors.status ? 'border-red-500 bg-red-50' : 'border-slate-300 hover:border-slate-400'
                }`}
              >
                <option value="">Select project status</option>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.status && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <span className="w-4 h-4">⚠️</span>
                  {errors.status}
                </p>
              )}
            </div>

            {/* Timeline */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <Calendar className="w-4 h-4 text-purple-600" />
                Timeline *
              </label>
              <input
                type="date"
                name="timeline"
                value={formData.timeline}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                  errors.timeline ? 'border-red-500 bg-red-50' : 'border-slate-300 hover:border-slate-400'
                }`}
              />
              {errors.timeline && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <span className="w-4 h-4">⚠️</span>
                  {errors.timeline}
                </p>
              )}
            </div>

            {/* Contact */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <User className="w-4 h-4 text-indigo-600" />
                Contact Person
              </label>
              <input
                type="text"
                name="contact"
                value={formData.contact}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent hover:border-slate-400 transition-all"
                placeholder="Project contact person"
              />
            </div>

            {/* Deals */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <Tag className="w-4 h-4 text-cyan-600" />
                Associated Deals
              </label>
              <input
                type="text"
                name="deals"
                value={formData.deals}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent hover:border-slate-400 transition-all"
                placeholder="Related deals or opportunities"
              />
            </div>

            {/* Accounts */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <Building className="w-4 h-4 text-orange-600" />
                Related Accounts
              </label>
              <input
                type="text"
                name="accounts"
                value={formData.accounts}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent hover:border-slate-400 transition-all"
                placeholder="Related accounts or clients"
              />
            </div>

            {/* Description */}
            <div className="lg:col-span-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <FileText className="w-4 h-4 text-gray-600" />
                Project Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent hover:border-slate-400 transition-all resize-none"
                placeholder="Describe the project goals, scope, and key deliverables..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-3 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-all duration-200 font-medium"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-6 py-3 text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400 rounded-lg transition-all duration-200 font-medium flex items-center gap-2 min-w-[140px] justify-center"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {isEditMode ? 'Updating...' : 'Saving...'}
            </>
          ) : (
            <>
              <FolderOpen className="w-4 h-4" />
              {isEditMode ? 'Update Project' : 'Save Project'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}