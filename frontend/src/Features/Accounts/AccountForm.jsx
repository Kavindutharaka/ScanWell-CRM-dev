import { X, Building, Globe, Tag, FileText, Users, MapPin, User, BarChart3 } from "lucide-react";
import { useState, useEffect } from "react";
import { createNewAccount, updateAccount } from "../../api/AccountApi";

export default function AccountForm({ onClose, account = null, onSuccess, loadAccounts }) {
  // var isEditMode = false;
  
  const [formData, setFormData] = useState({
    sysID: '',
    accountName: '',
    domain: '',
    industry: '',
    description: '',
    numberOfEmployees: '',
    headquartersLocation: '',
    contacts: '',
    deals: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  
  // Populate form if editing existing account
  useEffect(() => {
    if (account && account.sysID) {
      setFormData({
        sysID: account.sysID || '',
        accountName: account.accountName || '',
        domain: account.domain || '',
        industry: account.industry || '',
        description: account.description || '',
        numberOfEmployees: account.numberOfEmployees || '',
        headquartersLocation: account.headquartersLocation || '',
        contacts: account.contacts || '',
        deals: account.deals || ''
      });
      setIsEditMode(true);
      console.log(account);
    }
  }, [account]);

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
    
    // Clear submit error
    if (submitError) {
      setSubmitError(null);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.accountName.trim()) {
      newErrors.accountName = 'Account name is required';
    }
    
    if (formData.domain && !formData.domain.match(/^https?:\/\/.+/)) {
      newErrors.domain = 'Please enter a valid URL (starting with http:// or https://)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // Prepare data for backend (remove empty strings if needed)
      const accountData = {
        ...formData,
        // Convert empty strings to empty string or null based on your backend preference
        domain: formData.domain || '',
        industry: formData.industry || '',
        description: formData.description || '',
        numberOfEmployees: formData.numberOfEmployees || '',
        headquartersLocation: formData.headquartersLocation || '',
        contacts: formData.contacts || '',
        deals: formData.deals || ''
      };

      let response;
      if (isEditMode) {
        // Update existing account
        response = await updateAccount(accountData);
      } else {
        // Create new account (remove sysID for creation)
        const { sysID, ...newAccountData } = accountData;
        response = await createNewAccount(newAccountData);
      }
      loadAccounts();
      console.log('Account saved successfully:', response);
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess(response);
      }
      
      // Close modal after successful submission
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
      
      // Set error message
      const errorMessage = error.response?.data?.message 
        || error.message 
        || `Failed to ${isEditMode ? 'update' : 'create'} account. Please try again.`;
      
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const industryOptions = [
    { value: 'technology', label: 'Technology' },
    { value: 'software', label: 'Software & SaaS' },
    { value: 'data-analytics', label: 'Data & Analytics' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'finance', label: 'Finance & Banking' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'retail', label: 'Retail & E-commerce' },
    { value: 'education', label: 'Education' },
    { value: 'real-estate', label: 'Real Estate' },
    { value: 'consulting', label: 'Consulting' },
    { value: 'media', label: 'Media & Entertainment' },
    { value: 'automotive', label: 'Automotive' },
    { value: 'energy', label: 'Energy & Utilities' },
    { value: 'telecommunications', label: 'Telecommunications' },
    { value: 'agriculture', label: 'Agriculture' },
    { value: 'construction', label: 'Construction' },
    { value: 'logistics', label: 'Logistics & Transportation' },
    { value: 'government', label: 'Government' },
    { value: 'nonprofit', label: 'Non-profit' },
    { value: 'other', label: 'Other' }
  ];

  const employeeSizeOptions = [
    { value: '1-10', label: '1-10 employees' },
    { value: '11-50', label: '11-50 employees' },
    { value: '51-200', label: '51-200 employees' },
    { value: '201-500', label: '201-500 employees' },
    { value: '501-1000', label: '501-1,000 employees' },
    { value: '1001-5000', label: '1,001-5,000 employees' },
    { value: '5001-10000', label: '5,001-10,000 employees' },
    { value: '10000+', label: '10,000+ employees' }
  ];

  return (
    <div className="w-full max-w-5xl mx-auto bg-white rounded-2xl shadow-xl max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
            <Building className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              {isEditMode ? 'Edit Account' : 'Add New Account'}
            </h1>
            <p className="text-sm text-slate-600">
              {isEditMode 
                ? 'Update account information and business details' 
                : 'Create a new account to manage business relationships'}
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
      
      {/* Error Message */}
      {submitError && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <span className="text-red-500 text-lg">⚠️</span>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-red-800">Submission Error</h3>
            <p className="text-sm text-red-700 mt-1">{submitError}</p>
          </div>
        </div>
      )}
      
      {/* Form Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Account Name */}
            <div className="lg:col-span-1">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <Building className="w-4 h-4 text-purple-600" />
                Account Name *
              </label>
              <input
                type="text"
                name="accountName"
                value={formData.accountName}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                  errors.accountName ? 'border-red-500 bg-red-50' : 'border-slate-300 hover:border-slate-400'
                }`}
                placeholder="Enter company or organization name"
              />
              {errors.accountName && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <span className="w-4 h-4">⚠️</span>
                  {errors.accountName}
                </p>
              )}
            </div>

            {/* Domain */}
            <div className="lg:col-span-1">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <Globe className="w-4 h-4 text-blue-600" />
                Company Website
              </label>
              <input
                type="url"
                name="domain"
                value={formData.domain}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                  errors.domain ? 'border-red-500 bg-red-50' : 'border-slate-300 hover:border-slate-400'
                }`}
                placeholder="https://company.com"
              />
              {errors.domain && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <span className="w-4 h-4">⚠️</span>
                  {errors.domain}
                </p>
              )}
            </div>

            {/* Industry */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <Tag className="w-4 h-4 text-green-600" />
                Industry
              </label>
              <select
                name="industry"
                value={formData.industry}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent hover:border-slate-400 transition-all"
              >
                <option value="">Select industry</option>
                {industryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Number of Employees */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <Users className="w-4 h-4 text-indigo-600" />
                Company Size
              </label>
              <select
                name="numberOfEmployees"
                value={formData.numberOfEmployees}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent hover:border-slate-400 transition-all"
              >
                <option value="">Select company size</option>
                {employeeSizeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Headquarters Location */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <MapPin className="w-4 h-4 text-red-600" />
                Headquarters Location
              </label>
              <input
                type="text"
                name="headquartersLocation"
                value={formData.headquartersLocation}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent hover:border-slate-400 transition-all"
                placeholder="e.g., New York, NY, USA"
              />
            </div>

            {/* Contacts */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <User className="w-4 h-4 text-orange-600" />
                Key Contacts
              </label>
              <input
                type="text"
                name="contacts"
                value={formData.contacts}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent hover:border-slate-400 transition-all"
                placeholder="Main contact persons (comma separated)"
              />
            </div>

            {/* Deals */}
            <div className="lg:col-span-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <BarChart3 className="w-4 h-4 text-cyan-600" />
                Associated Deals
              </label>
              <input
                type="text"
                name="deals"
                value={formData.deals}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent hover:border-slate-400 transition-all"
                placeholder="Related deals, opportunities, or partnerships"
              />
            </div>

            {/* Description */}
            <div className="lg:col-span-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <FileText className="w-4 h-4 text-gray-600" />
                Company Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent hover:border-slate-400 transition-all resize-none"
                placeholder="Enter company description, business overview, services, or important notes about this account..."
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
          type="submit"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-6 py-3 text-white bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 rounded-lg transition-all duration-200 font-medium flex items-center gap-2 min-w-[140px] justify-center"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {isEditMode ? 'Updating...' : 'Saving...'}
            </>
          ) : (
            <>
              <Building className="w-4 h-4" />
              {isEditMode ? 'Update Account' : 'Save Account'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}