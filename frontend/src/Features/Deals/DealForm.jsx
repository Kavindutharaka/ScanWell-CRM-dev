import { X, DollarSign, User, Calendar, Building, Target, Percent, TrendingUp, Clock, FileText, Activity } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { createNewDeal, updateDeal } from "../../api/DealApi";
import { fetchAccounts } from "../../api/AccountApi";

export default function DealForm({ onClose, dealData = null, onSuccess, loadDeals}) {
  const isEditMode = !!dealData;
  
  const [formData, setFormData] = useState({
    sysID: dealData?.sysID || null,
    dealName: dealData?.dealName || '',
    stage: dealData?.stage || '',
    owner: dealData?.owner || '',
    dealsValue: dealData?.dealsValue || '',
    contacts: dealData?.contacts || '',
    accounts: dealData?.accounts || '',
    expectedCloseDate: dealData?.expectedCloseDate || '',
    closeProbability: dealData?.closeProbability || '',
    forecastValue: dealData?.forecastValue || '',
    lastInteraction: dealData?.lastInteraction || '',
    quotesInvoicesNumber: dealData?.quotesInvoicesNumber || '',
    notes: dealData?.notes || ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const [relatedAccount, setRelatedAccount] = useState([]);
  const [showAccountSuggestions, setShowAccountSuggestions] = useState(false);
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  
  const accountInputRef = useRef(null);
  const accountDropdownRef = useRef(null);

  // Initialize form with dealData if editing
  useEffect(() => {
    if (dealData) {
      setFormData({
        sysID: dealData.sysID || null,
        dealName: dealData.dealName || '',
        stage: dealData.stage || '',
        owner: dealData.owner || '',
        dealsValue: dealData.dealsValue || '',
        contacts: dealData.contacts || '',
        accounts: dealData.accounts || '',
        expectedCloseDate: dealData.expectedCloseDate || '',
        closeProbability: dealData.closeProbability || '',
        forecastValue: dealData.forecastValue || '',
        lastInteraction: dealData.lastInteraction || '',
        quotesInvoicesNumber: dealData.quotesInvoicesNumber || '',
        notes: dealData.notes || ''
      });
    }
  }, [dealData]);

  useEffect(() => {
    getAccount();
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        accountDropdownRef.current && 
        !accountDropdownRef.current.contains(event.target) &&
        accountInputRef.current &&
        !accountInputRef.current.contains(event.target)
      ) {
        setShowAccountSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getAccount = async () => {
    const res = await fetchAccounts();
    const accountNames = res.map(account => account.accountName);
    setRelatedAccount(accountNames);
    console.log("this is sales account ", accountNames);
  };

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

    // Handle account suggestions
    if (name === 'accounts') {
      const filtered = relatedAccount.filter(account =>
        account.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredAccounts(filtered);
      setShowAccountSuggestions(value.length > 0 && filtered.length > 0);
    }

    // Auto-calculate forecast value when deal value or probability changes
    if (name === 'dealsValue' || name === 'closeProbability') {
      const dealValue = name === 'dealsValue' ? parseFloat(value) || 0 : parseFloat(formData.dealsValue) || 0;
      const probability = name === 'closeProbability' ? parseFloat(value) || 0 : parseFloat(formData.closeProbability) || 0;
      const forecastValue = (dealValue * probability / 100).toFixed(2);
      
      setFormData(prev => ({
        ...prev,
        [name]: value,
        forecastValue: forecastValue
      }));
    }
  };

  const handleAccountSelect = (accountName) => {
    setFormData(prev => ({
      ...prev,
      accounts: accountName
    }));
    setShowAccountSuggestions(false);
  };

  const handleAccountFocus = () => {
    if (formData.accounts) {
      const filtered = relatedAccount.filter(account =>
        account.toLowerCase().includes(formData.accounts.toLowerCase())
      );
      setFilteredAccounts(filtered);
      setShowAccountSuggestions(filtered.length > 0);
    } else {
      setFilteredAccounts(relatedAccount);
      setShowAccountSuggestions(relatedAccount.length > 0);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.dealName.trim()) {
      newErrors.dealName = 'Deal name is required';
    }
    
    if (!formData.stage) {
      newErrors.stage = 'Stage is required';
    }
    
    if (!formData.dealsValue || parseFloat(formData.dealsValue) <= 0) {
      newErrors.dealsValue = 'Deal value must be greater than 0';
    }

    if (formData.closeProbability && (parseFloat(formData.closeProbability) < 0 || parseFloat(formData.closeProbability) > 100)) {
      newErrors.closeProbability = 'Probability must be between 0 and 100';
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
      // Prepare data for API - convert to strings as expected by backend
      const dealPayload = {
        sysID: formData.sysID,
        dealName: formData.dealName,
        stage: formData.stage,
        owner: formData.owner,
        dealsValue: formData.dealsValue.toString(),
        contacts: formData.contacts,
        accounts: formData.accounts,
        expectedCloseDate: formData.expectedCloseDate,
        closeProbability: formData.closeProbability.toString(),
        forecastValue: formData.forecastValue.toString(),
        lastInteraction: formData.lastInteraction,
        quotesInvoicesNumber: formData.quotesInvoicesNumber,
        notes: formData.notes
      };

      let result;
      if (isEditMode) {
        // Update existing deal
        result = await updateDeal(dealPayload);
        console.log('Deal updated successfully:', result);
      } else {
        // Create new deal
        result = await createNewDeal(dealPayload);
        console.log('Deal created successfully:', result);
      }
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess(result);   
      }
       loadDeals();
      // Close modal after successful submission
      onClose();
    } catch (error) {
      console.error('Error submitting deal:', error);
      setSubmitError(
        error.response?.data?.message || 
        error.message || 
        `Failed to ${isEditMode ? 'update' : 'create'} deal. Please try again.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const stageOptions = [
    { value: 'prospecting', label: 'Prospecting', color: 'bg-slate-500' },
    { value: 'qualification', label: 'Qualification', color: 'bg-blue-500' },
    { value: 'needs-analysis', label: 'Needs Analysis', color: 'bg-indigo-500' },
    { value: 'discovery', label: 'Discovery', color: 'bg-purple-500' },
    { value: 'proposal', label: 'Proposal', color: 'bg-amber-500' },
    { value: 'negotiation', label: 'Negotiation', color: 'bg-red-500' },
    { value: 'closed-won', label: 'Closed Won', color: 'bg-green-500' },
    { value: 'closed-lost', label: 'Closed Lost', color: 'bg-gray-500' }
  ];

  return (
    <div className="w-full max-w-5xl mx-auto bg-white rounded-2xl shadow-xl max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              {isEditMode ? 'Edit Deal' : 'Add New Deal'}
            </h1>
            <p className="text-sm text-slate-600">
              {isEditMode ? 'Update deal information' : 'Create and track sales opportunities'}
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
          <span className="text-red-600 text-xl">⚠️</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">Error</p>
            <p className="text-sm text-red-700">{submitError}</p>
          </div>
        </div>
      )}

      {/* Form Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Deal Name */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Subject For Inquiry*
              </label>
              <input
                type="text"
                name="dealName"
                value={formData.dealName}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                  errors.dealName ? 'border-red-500 bg-red-50' : 'border-slate-300 hover:border-slate-400'
                }`}
                placeholder="Enter a descriptive subject for inquiry"
              />
              {errors.dealName && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <span className="w-4 h-4">⚠️</span>
                  {errors.dealName}
                </p>
              )}
            </div>

            {/* Stage */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <Target className="w-4 h-4 text-purple-600" />
                Stage *
              </label>
              <select
                name="stage"
                value={formData.stage}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                  errors.stage ? 'border-red-500 bg-red-50' : 'border-slate-300 hover:border-slate-400'
                }`}
              >
                <option value="">Select stage</option>
                {stageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.stage && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <span className="w-4 h-4">⚠️</span>
                  {errors.stage}
                </p>
              )}
            </div>

            {/* Deal Value */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <TrendingUp className="w-4 h-4 text-green-600" />
                Deal Value *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">$</span>
                <input
                  type="number"
                  name="dealsValue"
                  value={formData.dealsValue}
                  onChange={handleInputChange}
                  className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                    errors.dealsValue ? 'border-red-500 bg-red-50' : 'border-slate-300 hover:border-slate-400'
                  }`}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              {errors.dealsValue && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <span className="w-4 h-4">⚠️</span>
                  {errors.dealsValue}
                </p>
              )}
            </div>

            {/* Close Probability */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <Percent className="w-4 h-4 text-blue-600" />
                Close Probability
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="closeProbability"
                  value={formData.closeProbability}
                  onChange={handleInputChange}
                  className={`w-full px-4 pr-8 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                    errors.closeProbability ? 'border-red-500 bg-red-50' : 'border-slate-300 hover:border-slate-400'
                  }`}
                  placeholder="0"
                  min="0"
                  max="100"
                  step="1"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500">%</span>
              </div>
              {errors.closeProbability && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <span className="w-4 h-4">⚠️</span>
                  {errors.closeProbability}
                </p>
              )}
            </div>

            {/* Forecast Value (Auto-calculated) */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <Activity className="w-4 h-4 text-indigo-600" />
                Forecast Value
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">$</span>
                <input
                  type="text"
                  value={formData.forecastValue}
                  readOnly
                  className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-600"
                  placeholder="Auto-calculated"
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">Automatically calculated: Deal Value × Close Probability</p>
            </div>

            {/* Owner */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <User className="w-4 h-4 text-orange-600" />
                Sales Owner
              </label>
              <input
                type="text"
                name="owner"
                value={formData.owner}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent hover:border-slate-400 transition-all"
                placeholder="Assigned deal owner"
              />
            </div>

            {/* Expected Close Date */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <Calendar className="w-4 h-4 text-red-600" />
                Expected Close Date
              </label>
              <input
                type="date"
                name="expectedCloseDate"
                value={formData.expectedCloseDate}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent hover:border-slate-400 transition-all"
              />
            </div>

            {/* Last Interaction */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <Clock className="w-4 h-4 text-cyan-600" />
                Last Interaction
              </label>
              <input
                type="datetime-local"
                name="lastInteraction"
                value={formData.lastInteraction}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent hover:border-slate-400 transition-all"
              />
            </div>

            {/* Contacts */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <User className="w-4 h-4 text-pink-600" />
                Associated Contacts
              </label>
              <input
                type="text"
                name="contacts"
                value={formData.contacts}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent hover:border-slate-400 transition-all"
                placeholder="Key contacts for this deal"
              />
            </div>

            {/* Accounts - WITH AUTOCOMPLETE */}
            <div className="relative">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <Building className="w-4 h-4 text-violet-600" />
                Related Account
              </label>
              <input
                ref={accountInputRef}
                type="text"
                name="accounts"
                value={formData.accounts}
                onChange={handleInputChange}
                onFocus={handleAccountFocus}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent hover:border-slate-400 transition-all"
                placeholder="Associated account or company"
                autoComplete="off"
              />
              
              {/* Suggestions Dropdown */}
              {showAccountSuggestions && (
                <div
                  ref={accountDropdownRef}
                  className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                >
                  {filteredAccounts.length > 0 ? (
                    filteredAccounts.map((account, index) => (
                      <div
                        key={index}
                        onClick={() => handleAccountSelect(account)}
                        className="px-4 py-3 hover:bg-violet-50 cursor-pointer transition-colors border-b border-slate-100 last:border-b-0 flex items-center gap-2"
                      >
                        <Building className="w-4 h-4 text-violet-600 flex-shrink-0" />
                        <span className="text-sm text-slate-700">{account}</span>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-slate-500 text-center">
                      No accounts found
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="lg:col-span-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <FileText className="w-4 h-4 text-gray-600" />
                Deal Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent hover:border-slate-400 transition-all resize-none"
                placeholder="Add notes about this deal, key requirements, decision makers, competition, or next steps..."
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
          className="px-6 py-3 text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 rounded-lg transition-all duration-200 font-medium flex items-center gap-2 min-w-[140px] justify-center"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {isEditMode ? 'Updating...' : 'Saving...'}
            </>
          ) : (
            <>
              <DollarSign className="w-4 h-4" />
              {isEditMode ? 'Update Deal' : 'Save Deal'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}