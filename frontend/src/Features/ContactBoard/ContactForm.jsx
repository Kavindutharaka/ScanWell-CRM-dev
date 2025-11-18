import { X, UserCircle, Mail, Phone, User, Building, DollarSign, Flag, Briefcase, MessageSquare, Activity, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { createNewContact, updateContact } from "../../api/ContactAPI";

export default function ContactForm({ onClose, onSuccess, selectedData, loadContacts }) {
  const [formData, setFormData] = useState({
    contactName: '',
    email: '',
    phone: '',
    title: '',
    accounts: '',
    deals: '',
    dealsValue: '',
    type: '',
    priority: '',
    comments: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
  if (selectedData && selectedData.sysID) {
    // Convert null values to empty strings for form inputs
    setFormData({
      sysID: selectedData.sysID,
      contactName: selectedData.name || selectedData.contactName || '',
      email: selectedData.email || '',
      phone: selectedData.phone || '',
      title: selectedData.title || '',
      accounts: selectedData.company || selectedData.accounts || '',
      deals: selectedData.deals || '',
      dealsValue: selectedData.deal_value || selectedData.dealsValue || '',
      type: selectedData.type || '',
      priority: selectedData.priority || '',
      comments: selectedData.comments || ''
    });
    setIsEditing(true);
  }
}, [selectedData]); // ✅ Add dependency

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
    
    if (!formData.contactName.trim()) {
      newErrors.contactName = 'Contact name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/[\s\-\(\)]/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (formData.dealsValue && parseFloat(formData.dealsValue) < 0) {
      newErrors.dealsValue = 'Deal value must be positive';
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
    
    try {
      // Create contact object matching API expectations
      const contactData = {
      ...(isEditing && selectedData?.sysID && { sysID: selectedData.sysID }), // Include ID for updates
      name: formData.contactName?.trim() || '',
      email: formData.email?.trim() || '',
      phone: formData.phone?.trim() || null,
      title: formData.title?.trim() || null,
      company: formData.accounts?.trim() || null,
      deals: formData.deals?.trim() || null,
      deal_value: formData.dealsValue ? parseFloat(formData.dealsValue) : null,
      type: formData.type || null,
      priority: formData.priority || null,
      comments: formData.comments?.trim() || null
    };
      
      // Call API to create contact
      if(isEditing){
        console.log("contact edit data: ",contactData);
        await updateContact(contactData);
      }else{
        console.log("contact save data: ",contactData);
        await createNewContact(contactData);
      }
      // Show success message
      setSubmitSuccess(true);
      
      // Close modal after short delay
      setTimeout(() => {
        if (onSuccess) onSuccess(); // Refresh contacts list
        onClose();
      }, 1500);
      loadContacts();
      // window.location.reload();
      
    } catch (error) {
      console.error('Error creating contact:', error);
      
      // Handle specific error messages from API
      if (error.response?.data?.message) {
        setErrors({ submit: error.response.data.message });
      } else {
        setErrors({ submit: 'Failed to create contact. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const typeOptions = [
    { value: 'prospect', label: 'Prospect' },
    { value: 'customer', label: 'Customer' },
    { value: 'partner', label: 'Partner' },
    { value: 'vendor', label: 'Vendor' },
    { value: 'lead', label: 'Lead' },
    { value: 'consultant', label: 'Consultant' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'bg-green-500' },
    { value: 'medium', label: 'Medium', color: 'bg-amber-500' },
    { value: 'high', label: 'High', color: 'bg-red-500' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-700' }
  ];

  return (
    <div className="w-full max-w-5xl mx-auto bg-white rounded-2xl shadow-xl max-h-[90vh] flex flex-col">
      {/* Success Overlay */}
      {submitSuccess && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-2xl z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Contact Created!</h3>
            <p className="text-slate-600">Successfully added new contact</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
            <UserCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">{isEditing ? "Edit" : "Add New"} Contact</h1>
            <p className="text-sm text-slate-600">{isEditing ? "Edit the contact details" : "Create a new contact to manage relationships"}</p>
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
        {/* Error Message */}
        {errors.submit && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{errors.submit}</p>
          </div>
        )}

        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contact Name */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <UserCircle className="w-4 h-4 text-indigo-600" />
                Contact Name *
              </label>
              <input
                type="text"
                name="contactName"
                value={formData.contactName}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                  errors.contactName ? 'border-red-500 bg-red-50' : 'border-slate-300 hover:border-slate-400'
                }`}
                placeholder="Enter contact's full name"
                disabled={isSubmitting}
              />
              {errors.contactName && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <span className="w-4 h-4">⚠️</span>
                  {errors.contactName}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <Mail className="w-4 h-4 text-blue-600" />
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                  errors.email ? 'border-red-500 bg-red-50' : 'border-slate-300 hover:border-slate-400'
                }`}
                placeholder="Enter email address"
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <span className="w-4 h-4">⚠️</span>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <Phone className="w-4 h-4 text-green-600" />
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                  errors.phone ? 'border-red-500 bg-red-50' : 'border-slate-300 hover:border-slate-400'
                }`}
                placeholder="+1 (555) 123-4567"
                disabled={isSubmitting}
              />
              {errors.phone && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <span className="w-4 h-4">⚠️</span>
                  {errors.phone}
                </p>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <User className="w-4 h-4 text-purple-600" />
                Job Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:border-slate-400 transition-all"
                placeholder="Enter job title or position"
                disabled={isSubmitting}
              />
            </div>

            {/* Associated Account */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <Building className="w-4 h-4 text-orange-600" />
                Account/Company
              </label>
              <input
                type="text"
                name="accounts"
                value={formData.accounts}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:border-slate-400 transition-all"
                placeholder="Enter associated company or account"
                disabled={isSubmitting}
              />
            </div>

            {/* Associated Deals */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <Activity className="w-4 h-4 text-cyan-600" />
                Associated Deals
              </label>
              <input
                type="text"
                name="deals"
                value={formData.deals}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:border-slate-400 transition-all"
                placeholder="Enter related deals or opportunities"
                disabled={isSubmitting}
              />
            </div>

            {/* Deal Value */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Deal Value
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">$</span>
                <input
                  type="number"
                  name="dealsValue"
                  value={formData.dealsValue}
                  onChange={handleInputChange}
                  className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                    errors.dealsValue ? 'border-red-500 bg-red-50' : 'border-slate-300 hover:border-slate-400'
                  }`}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  disabled={isSubmitting}
                />
              </div>
              {errors.dealsValue && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <span className="w-4 h-4">⚠️</span>
                  {errors.dealsValue}
                </p>
              )}
            </div>

            {/* Contact Type */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <Briefcase className="w-4 h-4 text-teal-600" />
                Contact Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:border-slate-400 transition-all"
                disabled={isSubmitting}
              >
                <option value="">Select contact type</option>
                {typeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <Flag className="w-4 h-4 text-red-600" />
                Priority Level
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:border-slate-400 transition-all"
                disabled={isSubmitting}
              >
                <option value="">Select priority level</option>
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Comments */}
            <div className="lg:col-span-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <MessageSquare className="w-4 h-4 text-gray-600" />
                Comments & Notes
              </label>
              <textarea
                name="comments"
                value={formData.comments}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:border-slate-400 transition-all resize-none"
                placeholder="Add notes about this contact, their interests, communication preferences, or any relevant information..."
                disabled={isSubmitting}
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
          disabled={isSubmitting || submitSuccess}
          className="px-6 py-3 text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-lg transition-all duration-200 font-medium flex items-center gap-2 min-w-[140px] justify-center"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {isEditing ? "Editing..": "Saving..."}
            </>
          ) : submitSuccess ? (
            <>
              <CheckCircle className="w-4 h-4" />
              Saved!
            </>
          ) : (
            <>
              <UserCircle className="w-4 h-4" />
              {isEditing ? "Edit" : "Save"} Contact
            </>
          )}
        </button>
      </div>
    </div>
  );
}