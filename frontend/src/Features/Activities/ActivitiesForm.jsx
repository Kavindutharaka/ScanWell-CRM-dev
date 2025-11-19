import { X, Calendar, User, Clock, Tag, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { createNewActivity, saveNotes, updateActivity } from "../../api/ActivityApi";

export default function ActivitiesForm({ onClose, initialActivity = null, isEditMode = false, noteModalOpen, isSuccesssNote, setCurrentStatus }) {
  const [formData, setFormData] = useState({
    id: initialActivity?.id || null,
    activityName: initialActivity?.activity_name || '',
    activityType: initialActivity?.activity_type || '',
    owner: initialActivity?.owner || '',
    startTime: initialActivity?.start_time || '',
    endTime: initialActivity?.end_time || '',
    status: initialActivity?.status || '',
    relatedItem: initialActivity?.related_item || ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [preStatus, setPreStatus] = useState("");
  const [iscanEdit, setIsCanEdit] = useState(false);

  useEffect(()=>{
    if(!isEditMode){
    const now = new Date();
    const formatted = now.toISOString().slice(0, 16);
    setFormData(prev => ({
      ...prev,
      startTime: formatted,
      status: "planned"
    }));
  }
  },[])

  useEffect(()=>{
    if(isSuccesssNote){
    console.log("dan trigger function!!");
    autoTriggerEdit();
    };
  },[isSuccesssNote]);

  useEffect(()=>{setPreStatus("status");console.log(initialActivity);},[initialActivity]);

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
    if (apiError) {
      setApiError('');
    }
  };
  

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.activityName.trim()) {
      newErrors.activityName = 'Activity name is required';
    }
    
    if (!formData.activityType) {
      newErrors.activityType = 'Activity type is required';
    }
    
    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }
    
    if (!formData.status) {
      newErrors.status = 'Status is required';
    }

    // Validate end time is after start time
    if (formData.startTime && formData.endTime && formData.endTime <= formData.startTime) {
      newErrors.endTime = 'End time must be after start time';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return null;
    // Convert local datetime string to ISO format for backend
    return new Date(dateTimeString).toISOString();
  };

   const autoTriggerEdit = async () => {
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setApiError('');
    
    try {
      // Prepare data for backend
      const activityData = {
        ...(isEditMode && { id: formData.id }),
        activityName: formData.activityName.trim(),
        activityType: formData.activityType,
        owner: formData.owner.trim() || null,
        startTime: formatDateTime(formData.startTime),
        endTime: formData.endTime ? formatDateTime(formData.endTime) : null,
        status: formData.status,
        relatedItem: formData.relatedItem.trim() || null
      };

       console.log("yes it's bypass!");

      let response;     
        // Update existing activity
        response = await updateActivity(activityData);
        console.log('Activity updated successfully:', response);

      
      // Close modal after successful submission
      onClose(response);
      // window.location.reload();
    } catch (error) {
      console.error('Error submitting form:', error);
      setApiError(
        error.response?.data?.message || 
        error.message || 
        'An error occurred while saving the activity. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if(isEditMode && preStatus !== formData.status && !iscanEdit){
      console.log("not equal can't update!");
      setCurrentStatus(
        {
          status: formData.status,
          activity_id: formData.id
        });
      noteModalOpen();
      return;
    }
      console.log("yes it's bypass!");

    setIsSubmitting(true);
    setApiError('');
    
    try {
      // Prepare data for backend
      const activityData = {
        ...(isEditMode && { id: formData.id }),
        activityName: formData.activityName.trim(),
        activityType: formData.activityType,
        owner: formData.owner.trim() || null,
        startTime: formatDateTime(formData.startTime),
        endTime: formData.endTime ? formatDateTime(formData.endTime) : null,
        status: formData.status,
        relatedItem: formData.relatedItem.trim() || null
      };

      let response;
      
      if (isEditMode) {
        // Update existing activity
        response = await updateActivity(activityData);
        console.log('Activity updated successfully:', response);
      } else {
        // Create new activity
        response = await createNewActivity(activityData);
        console.log('Activity created successfully:', response);
        if(response.activityId){
            var payload = {
              new_status: "planned",
              note: "Start the activity",
              activity_id: response.activityId
            }
                  console.log(payload);
                  const res = await saveNotes(payload);
                  console.log(res);
          }
      }
      
      // Close modal after successful submission
      onClose(response);
      window.location.reload();
    } catch (error) {
      console.error('Error submitting form:', error);
      setApiError(
        error.response?.data?.message || 
        error.message || 
        'An error occurred while saving the activity. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const activityTypeOptions = [
    { value: 'call', label: 'Phone Call', color: 'bg-blue-500' },
    { value: 'email', label: 'Email', color: 'bg-purple-500' },
    { value: 'meeting', label: 'Meeting', color: 'bg-indigo-500' },
    { value: 'demo', label: 'Demo', color: 'bg-green-500' },
    { value: 'follow-up', label: 'Follow-up', color: 'bg-amber-500' },
    { value: 'presentation', label: 'Presentation', color: 'bg-pink-500' },
    { value: 'proposal', label: 'Proposal', color: 'bg-cyan-500' },
    { value: 'negotiation', label: 'Negotiation', color: 'bg-red-500' },
    { value: 'site-visit', label: 'Site Visit', color: 'bg-orange-500' },
    { value: 'training', label: 'Training', color: 'bg-teal-500' },
    { value: 'webinar', label: 'Webinar', color: 'bg-violet-500' },
    { value: 'conference', label: 'Conference', color: 'bg-lime-500' },
    { value: 'task', label: 'Task', color: 'bg-slate-500' },
    { value: 'other', label: 'Other', color: 'bg-gray-500' }
  ];

  const statusOptions = [
    { value: 'planned', label: 'Planned', color: 'bg-blue-100 text-blue-800' },
    { value: 'in-progress', label: 'In Progress', color: 'bg-amber-100 text-amber-800' },
    { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
    { value: 'rescheduled', label: 'Rescheduled', color: 'bg-purple-100 text-purple-800' },
    { value: 'overdue', label: 'Overdue', color: 'bg-orange-100 text-orange-800' }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-xl max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              {isEditMode ? 'Edit Activity' : 'Add New Activity'}
            </h1>
            <p className="text-sm text-slate-600">
              {isEditMode ? 'Update activity details' : 'Create a new activity to track your work'}
            </p>
          </div>
        </div>
        <button
          onClick={() => onClose()}
          className="p-2 hover:bg-white/70 rounded-lg transition-colors group"
          aria-label="Close modal"
        >
          <X className="w-5 h-5 text-slate-500 group-hover:text-slate-700" />
        </button>
      </div>
      
      {/* Form Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* API Error Alert */}
        {apiError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-semibold text-red-800">Error</p>
              <p className="text-red-700 text-sm">{apiError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Activity Name */}
            <div className="lg:col-span-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <FileText className="w-4 h-4 text-blue-600" />
                Activity Name *
              </label>
              <input
                type="text"
                name="activityName"
                value={formData.activityName}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  errors.activityName ? 'border-red-500 bg-red-50' : 'border-slate-300 hover:border-slate-400'
                }`}
                placeholder="Enter a descriptive activity name"
              />
              {errors.activityName && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <span className="w-4 h-4">⚠️</span>
                  {errors.activityName}
                </p>
              )}
            </div>

            {/* Activity Type */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <Tag className="w-4 h-4 text-purple-600" />
                Activity Type *
              </label>
              <select
                name="activityType"
                value={formData.activityType}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  errors.activityType ? 'border-red-500 bg-red-50' : 'border-slate-300 hover:border-slate-400'
                }`}
              >
                <option value="">Select activity type</option>
                {activityTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.activityType && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <span className="w-4 h-4">⚠️</span>
                  {errors.activityType}
                </p>
              )}
            </div>

            {/* Status */}
            {isEditMode &&  <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <Clock className="w-4 h-4 text-green-600" />
                Status *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  errors.status ? 'border-red-500 bg-red-50' : 'border-slate-300 hover:border-slate-400'
                }`}
              >
                <option value="">Select status</option>
                {statusOptions
                .filter(option => !['planned', 'overdue'].includes(option.value))
                .map((option) => (
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
            </div>}

            {/* Owner */}
            {!isEditMode &&
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <User className="w-4 h-4 text-indigo-600" />
                Owner
              </label>
              <input
                type="text"
                name="owner"
                value={formData.owner}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-slate-400 transition-all"
                placeholder="Activity owner/assignee"
              />
            </div>
            }

            {/* Related Item */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <FileText className="w-4 h-4 text-cyan-600" />
                Related Item
              </label>
              <input
                type="text"
                name="relatedItem"
                value={formData.relatedItem}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-slate-400 transition-all"
                placeholder="Related contact, deal, account, or project"
              />
            </div>

            {/* Start Time */}
            {!isEditMode && 
            <>
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <Calendar className="w-4 h-4 text-emerald-600" />
                Start Time *
              </label>
              <input
                type="datetime-local"
                name="startTime"
                value={formData.startTime}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  errors.startTime ? 'border-red-500 bg-red-50' : 'border-slate-300 hover:border-slate-400'
                }`}
                readOnly
              />
              {errors.startTime && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <span className="w-4 h-4">⚠️</span>
                  {errors.startTime}
                </p>
              )}
            </div>

            {/* End Time */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <Calendar className="w-4 h-4 text-red-600" />
                End Time
              </label>
              <input
                type="datetime-local"
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  errors.endTime ? 'border-red-500 bg-red-50' : 'border-slate-300 hover:border-slate-400'
                }`}
              />
              {errors.endTime && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <span className="w-4 h-4">⚠️</span>
                  {errors.endTime}
                </p>
              )}
            </div>
            </>
            }
          </div>
        </form>
      </div>

      {/* Footer Actions */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
        <button
          type="button"
          onClick={() => onClose()}
          className="px-6 py-3 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-all duration-200 font-medium"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-6 py-3 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-all duration-200 font-medium flex items-center gap-2 min-w-[140px] justify-center"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Calendar className="w-4 h-4" />
              {isEditMode ? 'Update Activity' : 'Save Activity'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}