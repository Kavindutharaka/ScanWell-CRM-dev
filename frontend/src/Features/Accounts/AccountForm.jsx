import { X, Building, Globe, Tag, FileText, Users, MapPin, User, BarChart3, Mail, Phone, Hash, ArrowUpDown, Search } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { createNewAccount, updateAccount } from "../../api/AccountApi";
import { fetchEmployees } from "../../api/PMApi";

export default function AccountForm({ onClose, account = null, onSuccess, loadAccounts, setOpenContactModal, contacts = [] }) {
  const [formData, setFormData] = useState({
    sysID: '',
    accountName: '',
    accountType: '',
    domain: '',
    fmsCode: '',
    industry: '',
    tp: '',
    location: '',
    salesPerson: '',
    description: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Autocomplete states
  const [employees, setEmployees] = useState([]);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const salesPersonRef = useRef(null);
  const dropdownRef = useRef(null);

  // Fetch employees on component mount
  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const data = await fetchEmployees();
      // Filter only active employees
      const activeEmployees = data.filter(emp => emp.status === 'Active');
      setEmployees(activeEmployees);
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        salesPersonRef.current &&
        !salesPersonRef.current.contains(event.target)
      ) {
        setShowEmployeeDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Populate form if editing existing account
  useEffect(() => {
    if (account && account.sysID) {
      setFormData({
        sysID: account.sysID || '',
        accountName: account.accountName || '',
        accountType: account.accountType || '',
        domain: account.domain || '',
        fmsCode: account.fmsCode || '',
        industry: account.industry || '',
        tp: account.tp || '',
        location: account.location || '',
        salesPerson: account.salesPerson || '',
        description: account.description || ''
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

    // Handle sales person autocomplete
    if (name === 'salesPerson') {
      if (value.trim()) {
        const filtered = employees.filter(emp => {
          const fullName = `${emp.fname} ${emp.lname}`.toLowerCase();
          const searchTerm = value.toLowerCase();
          return fullName.includes(searchTerm) || 
                 emp.email.toLowerCase().includes(searchTerm) ||
                 emp.position.toLowerCase().includes(searchTerm);
        });
        setFilteredEmployees(filtered);
        setShowEmployeeDropdown(true);
      } else {
        setFilteredEmployees([]);
        setShowEmployeeDropdown(false);
      }
    }
  };

  const handleEmployeeSelect = (employee) => {
    const fullName = `${employee.fname} ${employee.lname}`;
    setFormData(prev => ({
      ...prev,
      salesPerson: fullName
    }));
    setShowEmployeeDropdown(false);
  };

  const handleSalesPersonFocus = () => {
    if (formData.salesPerson.trim() && filteredEmployees.length > 0) {
      setShowEmployeeDropdown(true);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.accountName.trim()) {
      newErrors.accountName = 'Account name is required';
    }
    if (!formData.fmsCode.trim()) {
      newErrors.fmsCode = 'FMS code is required';
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
      // Extract primary contact from first contact in array (if exists)
      const primaryContact = contacts.length > 0 ? contacts[0] : {};
      
      // Prepare data for backend
      const fullAccountData = {
        ...formData,
        // Primary contact fields from first contact
        primaryContact: primaryContact.contactName || '',
        primaryEmail: primaryContact.email || '',
        primaryPosition: primaryContact.position || '',
        primaryMobile: primaryContact.mobile || '',
        // All contacts as JSON string
        contactsJson: JSON.stringify(contacts)
      };

      let response;
      if (isEditMode) {
        // Update existing account
        response = await updateAccount(fullAccountData);
      } else {
        // Create new account (remove sysID for creation)
        const { sysID, ...newAccountData } = fullAccountData;
        console.log("this is gonee ",newAccountData);
        response = await createNewAccount(newAccountData);
      }
      
      // Reload accounts after successful save
      if (loadAccounts) {
        loadAccounts();
      }
      
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

  // Get existing contacts for display (parsed from contactsJson)
  const getExistingContacts = () => {
    try {
      if (account && account.contactsJson) {
        const parsed = JSON.parse(account.contactsJson);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      console.error('Error parsing contactsJson:', e);
    }
    return [];
  };

  const existingContacts = getExistingContacts();
  const displayContacts = contacts.length > 0 ? contacts : existingContacts;

  const handleAddContact = () => {
    if (setOpenContactModal) {
      setOpenContactModal(true);
    }
  };

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
          {/* Section 1: Company Information */}
          <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
            <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-600" />
              Company Information
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Account Name */}
              <div className="lg:col-span-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                  <Building className="w-4 h-4 text-blue-600" />
                  Account Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="accountName"
                  value={formData.accountName}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border ${errors.accountName ? 'border-red-500' : 'border-slate-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent hover:border-slate-400 transition-all`}
                  placeholder="Enter company or account name"
                />
                {errors.accountName && (
                  <p className="mt-1 text-sm text-red-600">{errors.accountName}</p>
                )}
              </div>

              {/* Account Type */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                  <ArrowUpDown className="w-4 h-4 text-purple-600" />
                  Account Type
                </label>
                <select
                  name="accountType"
                  value={formData.accountType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent hover:border-slate-400 transition-all bg-white"
                >
                  <option value="">Select account type</option>
                  <option value="import">Import</option>
                  <option value="export">Export</option>
                  <option value="both">Both Import & Export</option>
                </select>
              </div>

              {/* Domain */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                  <Globe className="w-4 h-4 text-green-600" />
                  Domain / Website
                </label>
                <input
                  type="url"
                  name="domain"
                  value={formData.domain}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border ${errors.domain ? 'border-red-500' : 'border-slate-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent hover:border-slate-400 transition-all`}
                  placeholder="https://www.example.com"
                />
                {errors.domain && (
                  <p className="mt-1 text-sm text-red-600">{errors.domain}</p>
                )}
              </div>

              {/* FMS Code */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                  <Hash className="w-4 h-4 text-indigo-600" />
                  FMS Code
                </label>
                <input
                  type="text"
                  name="fmsCode"
                  value={formData.fmsCode}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent hover:border-slate-400 transition-all"
                  placeholder="Enter FMS code"
                />
                 {errors.fmsCode && (
                  <p className="mt-1 text-sm text-red-600">{errors.fmsCode}</p>
                )}
              </div>

              {/* Industry */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                  <Tag className="w-4 h-4 text-yellow-600" />
                  Industry
                </label>
                <select
                  name="industry"
                  value={formData.industry}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent hover:border-slate-400 transition-all bg-white"
                >
                  <option value="">Select industry</option>
                  {industryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Phone */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                  <Phone className="w-4 h-4 text-teal-600" />
                  Company Phone
                </label>
                <input
                  type="tel"
                  name="tp"
                  value={formData.tp}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent hover:border-slate-400 transition-all"
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              {/* Location */}
              <div className="lg:col-span-1">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                  <MapPin className="w-4 h-4 text-red-600" />
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent hover:border-slate-400 transition-all"
                  placeholder="City, State/Province, Country"
                />
              </div>
              
              {/* Sales Person with Autocomplete */}
              <div className="lg:col-span-1 relative">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                  <BarChart3 className="w-4 h-4 text-orange-600" />
                  Sales Person
                </label>
                <div className="relative">
                  <input
                    ref={salesPersonRef}
                    type="text"
                    name="salesPerson"
                    value={formData.salesPerson}
                    onChange={handleInputChange}
                    onFocus={handleSalesPersonFocus}
                    className="w-full px-4 py-3 pr-10 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent hover:border-slate-400 transition-all"
                    placeholder="Type to search employee..."
                    autoComplete="off"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>

                {/* Autocomplete Dropdown */}
                {showEmployeeDropdown && filteredEmployees.length > 0 && (
                  <div 
                    ref={dropdownRef}
                    className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                  >
                    {filteredEmployees.map((employee) => (
                      <button
                        key={employee.sysID}
                        type="button"
                        onClick={() => handleEmployeeSelect(employee)}
                        className="w-full px-4 py-3 text-left hover:bg-purple-50 transition-colors border-b border-slate-100 last:border-b-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900">
                              {employee.fname} {employee.lname}
                            </p>
                            <p className="text-xs text-slate-500">
                              {employee.position} • {employee.department}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Contact Information */}
          <div className="bg-orange-50 rounded-xl p-5 border border-orange-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-orange-600" />
                Contact Information
              </h2>
              <button
                type="button"
                onClick={handleAddContact}
                className="px-4 py-2 text-orange-700 bg-white border-2 border-orange-300 hover:bg-orange-50 rounded-lg transition-all duration-200 font-medium flex items-center gap-2 text-sm"
                disabled={isSubmitting}
              >
                <Users className="w-4 h-4" />
                {displayContacts.length > 0 ? 'Edit Contacts' : 'Add Contacts'}
              </button>
            </div>

            {/* Display Contacts Summary */}
            {displayContacts.length > 0 ? (
              <div className="space-y-3">
                {displayContacts.map((contact, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 border border-orange-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4 text-orange-600" />
                          <span className="font-semibold text-slate-800">
                            {contact.contactName || 'Unnamed Contact'}
                          </span>
                          {index === 0 && (
                            <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full">
                              Primary
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-600">
                          {contact.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-3 h-3 text-orange-500" />
                              <span>{contact.email}</span>
                            </div>
                          )}
                          {contact.position && (
                            <div className="flex items-center gap-2">
                              <Tag className="w-3 h-3 text-orange-500" />
                              <span>{contact.position}</span>
                            </div>
                          )}
                          {contact.mobile && (
                            <div className="flex items-center gap-2 md:col-span-2">
                              <Phone className="w-3 h-3 text-orange-500" />
                              <span>{contact.mobile}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-sm">No contacts added yet</p>
                <p className="text-xs mt-1">Click "Add Contacts" to add contact information</p>
              </div>
            )}
          </div>

          {/* Section 3: Additional Details */}
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
            <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-600" />
              Additional Details
            </h2>
            
            <div className="grid grid-cols-1 gap-6">
              {/* Description */}
              <div>
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