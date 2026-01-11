import { X, Calendar, User, Clock, Tag, FileText, AlertCircle, Building2, Search } from "lucide-react";
import { useEffect, useState, useRef, useContext  } from "react";
import { createNewActivity, saveNotes, updateActivity } from "../../api/ActivityApi";
import { fetchAccounts } from "../../api/AccountApi";
import { AuthContext } from "../../context/AuthContext";

export default function ActivitiesForm({ onClose, initialActivity = null, isEditMode = false, noteModalOpen, isSuccesssNote, setCurrentStatus }) {

   const { user } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    id: initialActivity?.id || null,
    activityName: initialActivity?.activity_name || '',
    activityType: initialActivity?.activity_type || '',
    owner: initialActivity?.owner || '',
    startTime: initialActivity?.start_time || '',
    endTime: initialActivity?.end_time || '',
    status: initialActivity?.status || '',
    relatedAccount: initialActivity?.related_account || '',
    rescheduleDate: initialActivity?.reschedule_date || ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [preStatus, setPreStatus] = useState("");
  const [iscanEdit, setIsCanEdit] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  
  // Account autocomplete states
  const [accounts, setAccounts] = useState([]);
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [showAccountSuggestions, setShowAccountSuggestions] = useState(false);
  const [accountSearchTerm, setAccountSearchTerm] = useState('');
  const accountInputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Load accounts on component mount
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const accountsData = await fetchAccounts();
        setAccounts(accountsData);
      } catch (error) {
        console.error('Error loading accounts:', error);
      }
    };
    loadAccounts();
  }, []);

  useEffect(() => {
    if (!isEditMode) {
      const now = new Date();

      // Convert to local datetime-local format (yyyy-MM-ddTHH:mm)
      const pad = (n) => String(n).padStart(2, "0");

      const local = [
        now.getFullYear(),
        pad(now.getMonth() + 1),
        pad(now.getDate())
      ].join("-") + "T" + [
        pad(now.getHours()),
        pad(now.getMinutes())
      ].join(":");

      setFormData(prev => ({
        ...prev,
        startTime: local,   // <-- NOW IN LOCAL TIME ZONE FORMAT
        status: "planned"
      }));

    } else {

      if (initialActivity?.status === 'completed') {
        setIsCompleted(true);
      }

      if (initialActivity?.related_account) {
        setAccountSearchTerm(initialActivity.related_account);
      }
    }
  }, [isEditMode, initialActivity]);


  useEffect(()=>{
    if(isSuccesssNote){
      console.log("dan trigger function!!");
      autoTriggerEdit();
    };
  },[isSuccesssNote]);

  useEffect(()=>{
    setPreStatus(initialActivity?.status || "");
    console.log(initialActivity);
  },[initialActivity]);

  // Handle clicks outside of suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target) &&
        accountInputRef.current &&
        !accountInputRef.current.contains(event.target)
      ) {
        setShowAccountSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // Handle account search input
  const handleAccountSearch = (e) => {
    const value = e.target.value;
    setAccountSearchTerm(value);
    setFormData(prev => ({
      ...prev,
      relatedAccount: value
    }));

    // Filter accounts based on search term
    if (value.trim() === '') {
      setFilteredAccounts([]);
      setShowAccountSuggestions(false);
    } else {
      const filtered = accounts.filter(account => 
        account.accountName?.toLowerCase().includes(value.toLowerCase()) ||
        account.companyName?.toLowerCase().includes(value.toLowerCase()) ||
        account.accountNumber?.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredAccounts(filtered);
      setShowAccountSuggestions(true);
    }
  };

  // Handle account selection from suggestions
  const handleAccountSelect = (account) => {
    const accountDisplay = account.accountName || account.companyName || 'Unknown Account';
    setAccountSearchTerm(accountDisplay);
    setFormData(prev => ({
      ...prev,
      relatedAccount: accountDisplay
    }));
    setShowAccountSuggestions(false);
  };

  // Get available status options based on current status
  const getAvailableStatusOptions = () => {
    if (!isEditMode) {
      return []; // No status selection in create mode
    }

    const currentStatus = preStatus;
    
    // Define all status options
    const allStatusOptions = [
      { value: 'in_progress', label: 'In Progress', color: 'bg-blue-500', canRepeat: true },
      { value: 'completed', label: 'Completed', color: 'bg-green-500', canRepeat: false },
      { value: 'cancelled', label: 'Cancelled', color: 'bg-red-500', canRepeat: false },
      { value: 'reschedule', label: 'Reschedule', color: 'bg-amber-500', canRepeat: true }
    ];

    // If already completed, no status changes allowed
    if (currentStatus === 'completed') {
      return [{ value: 'completed', label: 'Completed', color: 'bg-green-500', canRepeat: false }];
    }

    // If already cancelled, can only stay cancelled or reschedule
    if (currentStatus === 'cancelled') {
      return allStatusOptions.filter(opt => ['cancelled', 'reschedule'].includes(opt.value));
    }

    // For any other status, can't go back to 'planned'
    return allStatusOptions;
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

    // Validate reschedule date if status is reschedule
    if (formData.status === 'reschedule' && !formData.rescheduleDate) {
      newErrors.rescheduleDate = 'Reschedule date is required when status is Reschedule';
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
        owner: user.id || null,
        startTime: formatDateTime(formData.startTime),
        endTime: formData.endTime ? formatDateTime(formData.endTime) : null,
        status: formData.status,
        relatedAccount: formData.relatedAccount.trim() || null,
        rescheduleDate: formData.rescheduleDate ? formatDateTime(formData.rescheduleDate) : null
      };

      console.log("yes it's bypass!");

      // Update existing activity
      const response = await updateActivity(activityData);
      console.log('Activity updated successfully:', response);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent submission if activity is completed
    if (isCompleted) {
      setApiError('Completed activities cannot be edited');
      return;
    }

    if (!validateForm()) {
      return;
    }

    // If status changed in edit mode, trigger notes modal
    if(isEditMode && preStatus !== formData.status && !iscanEdit){
      console.log("Status changed - opening notes modal");
      setCurrentStatus({
        status: formData.status,
        activity_id: formData.id,
        rescheduleDate: formData.rescheduleDate
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
        owner: user.id || null,
        startTime: formatDateTime(formData.startTime),
        endTime: formData.endTime ? formatDateTime(formData.endTime) : null,
        status: formData.status,
        relatedAccount: formData.relatedAccount.trim() || null,
        rescheduleDate: formData.rescheduleDate ? formatDateTime(formData.rescheduleDate) : null
      };

      let response;

      console.log("checking activities ", activityData);
      
      if (isEditMode) {
        // Update existing activity
        response = await updateActivity(activityData);
        console.log('Activity updated successfully:', response);
      } else {
        // Create new activity
        response = await createNewActivity(activityData);
        console.log('Activity created successfully:', response);
        
        // Create initial status log
        if(response.activityId){
          const payload = {
            new_status: "planned",
            note: "Activity created and planned",
            activity_id: response.activityId
          }
          console.log(payload);
          const res = await saveNotes(payload);
          console.log(res);
        }
      }
      
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

  const activityTypeOptions = [
    { value: 'call', label: 'Phone Call', color: 'bg-blue-500' },
    { value: 'email', label: 'Email', color: 'bg-purple-500' },
    { value: 'meeting', label: 'Meeting', color: 'bg-green-500' },
    { value: 'follow_up', label: 'Follow Up', color: 'bg-yellow-500' },
    { value: 'presentation', label: 'Presentation', color: 'bg-pink-500' },
    { value: 'site_visit', label: 'Site Visit', color: 'bg-indigo-500' },
    { value: 'other', label: 'Other', color: 'bg-gray-500' }
  ];

  const availableStatusOptions = getAvailableStatusOptions();

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
              {isEditMode ? 'Edit Activity' : 'Create New Activity'}
            </h1>
            {isCompleted && (
              <p className="text-sm text-green-600 font-medium mt-1">
                ✓ This activity is completed and cannot be edited
              </p>
            )}
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

        {/* Completed Activity Info Banner */}
        {isCompleted && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-semibold text-green-800">Activity Completed</p>
              <p className="text-green-700 text-sm">
                This activity has been marked as completed. All fields are now read-only.
              </p>
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
                disabled={isCompleted}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  isCompleted ? 'bg-slate-100 cursor-not-allowed' :
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
                disabled={isCompleted}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  isCompleted ? 'bg-slate-100 cursor-not-allowed' :
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

            {/* Status - Only shown in edit mode */}
            {isEditMode && (
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                  <Clock className="w-4 h-4 text-green-600" />
                  Status *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  disabled={isCompleted}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    isCompleted ? 'bg-slate-100 cursor-not-allowed' :
                    errors.status ? 'border-red-500 bg-red-50' : 'border-slate-300 hover:border-slate-400'
                  }`}
                >
                  <option value="">Select status</option>
                  {availableStatusOptions.map((option) => (
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
                
                {/* Status Info */}
                {formData.status && (
                  <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-2 rounded">
                    {formData.status === 'completed' && '✓ Activity will be marked as completed and cannot be edited further'}
                    {formData.status === 'cancelled' && '✗ Activity will be cancelled'}
                    {formData.status === 'in_progress' && '▶ Activity is currently in progress'}
                    {formData.status === 'reschedule' && '⏰ Activity will be rescheduled to a new date'}
                  </div>
                )}
              </div>
            )}

            {/* Reschedule Date - Only shown when status is reschedule */}
            {isEditMode && formData.status === 'reschedule' && (
              <div className="lg:col-span-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                  <Calendar className="w-4 h-4 text-amber-600" />
                  Reschedule Date & Time *
                </label>
                <input
                  type="datetime-local"
                  name="rescheduleDate"
                  value={formData.rescheduleDate}
                  onChange={handleInputChange}
                  disabled={isCompleted}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    isCompleted ? 'bg-slate-100 cursor-not-allowed' :
                    errors.rescheduleDate ? 'border-red-500 bg-red-50' : 'border-slate-300 hover:border-slate-400'
                  }`}
                />
                {errors.rescheduleDate && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <span className="w-4 h-4">⚠️</span>
                    {errors.rescheduleDate}
                  </p>
                )}
              </div>
            )}            

            {/* Related Account with Autocomplete */}
            {!isEditMode && (
            <div className="relative">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <Building2 className="w-4 h-4 text-cyan-600" />
                Related Account
              </label>
              <div className="relative">
                <input
                  ref={accountInputRef}
                  type="text"
                  name="relatedAccount"
                  value={accountSearchTerm}
                  onChange={handleAccountSearch}
                  onFocus={() => {
                    if (accountSearchTerm.trim() !== '') {
                      const filtered = accounts.filter(account => 
                        account.accountName?.toLowerCase().includes(accountSearchTerm.toLowerCase()) ||
                        account.companyName?.toLowerCase().includes(accountSearchTerm.toLowerCase()) ||
                        account.accountNumber?.toLowerCase().includes(accountSearchTerm.toLowerCase())
                      );
                      setFilteredAccounts(filtered);
                      setShowAccountSuggestions(true);
                    }
                  }}
                  disabled={isCompleted}
                  className={`w-full px-4 py-3 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    isCompleted ? 'bg-slate-100 cursor-not-allowed' : 'border-slate-300 hover:border-slate-400'
                  }`}
                  placeholder="Search account by name, company, or number..."
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              </div>

              {/* Autocomplete Suggestions Dropdown */}
              {showAccountSuggestions && filteredAccounts.length > 0 && (
                <div 
                  ref={suggestionsRef}
                  className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                >
                  {filteredAccounts.map((account, index) => (
                    <button
                      key={account.id || index}
                      type="button"
                      onClick={() => handleAccountSelect(account)}
                      className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-slate-100 last:border-b-0 focus:outline-none focus:bg-blue-50"
                    >
                      <div className="flex items-start gap-3">
                        <Building2 className="w-5 h-5 text-cyan-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 truncate">
                            {account.accountName || account.companyName || 'Unknown Account'}
                          </p>
                          {account.companyName && account.accountName !== account.companyName && (
                            <p className="text-sm text-slate-600 truncate">
                              {account.companyName}
                            </p>
                          )}
                          {account.accountNumber && (
                            <p className="text-xs text-slate-500">
                              Account #: {account.accountNumber}
                            </p>
                          )}
                          {account.industry && (
                            <p className="text-xs text-slate-500">
                              {account.industry}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* No results message */}
              {showAccountSuggestions && filteredAccounts.length === 0 && accountSearchTerm.trim() !== '' && (
                <div 
                  ref={suggestionsRef}
                  className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg p-4 text-center text-slate-600"
                >
                  <Search className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                  <p className="text-sm">No accounts found matching "{accountSearchTerm}"</p>
                </div>
              )}
            </div>
            )}

            {/* Start Time and End Time - Only shown in create mode */}
            {!isEditMode && (
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
            )}
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
          {isCompleted ? 'Close' : 'Cancel'}
        </button>
        {!isCompleted && (
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
        )}
      </div>
    </div>
  );
}