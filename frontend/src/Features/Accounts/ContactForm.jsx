import { X, Building, Globe, Tag, FileText, Users, MapPin, User, BarChart3, Mail, Phone, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";

export default function ContactForm({ onClose, account = null, setSecContacts, existingContacts = [] }) {
  const [contacts, setContacts] = useState([
    {
      id: Date.now(),
      contactName: '',
      email: '',
      position: '',
      mobile: ''
    }
  ]);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  
  // Populate form with existing contacts if editing
  useEffect(() => {
    if (existingContacts && existingContacts.length > 0) {
      setContacts(existingContacts.map((contact, index) => ({
        id: Date.now() + index,
        contactName: contact.contactName || '',
        email: contact.email || '',
        position: contact.position || '',
        mobile: contact.mobile || ''
      })));
    }
  }, [existingContacts]);

  const handleInputChange = (id, field, value) => {
    setContacts(prevContacts =>
      prevContacts.map(contact =>
        contact.id === id ? { ...contact, [field]: value } : contact
      )
    );
    
    // Clear error when user starts typing
    const errorKey = `${id}_${field}`;
    if (errors[errorKey]) {
      setErrors(prev => ({
        ...prev,
        [errorKey]: ''
      }));
    }
    
    // Clear submit error
    if (submitError) {
      setSubmitError(null);
    }
  };

  const addContactPanel = () => {
    const newContact = {
      id: Date.now(),
      contactName: '',
      email: '',
      position: '',
      mobile: ''
    };
    setContacts([...contacts, newContact]);
  };

  const removeContactPanel = (id) => {
    if (contacts.length > 1) {
      setContacts(contacts.filter(contact => contact.id !== id));
      // Clear errors for removed contact
      const newErrors = { ...errors };
      Object.keys(newErrors).forEach(key => {
        if (key.startsWith(`${id}_`)) {
          delete newErrors[key];
        }
      });
      setErrors(newErrors);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    contacts.forEach((contact, index) => {
      // At least one contact must have a name
      if (index === 0 && !contact.contactName.trim()) {
        newErrors[`${contact.id}_contactName`] = 'At least one contact name is required';
      }

      // If email is provided, validate format
      if (contact.email && !contact.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        newErrors[`${contact.id}_email`] = 'Please enter a valid email address';
      }

      // If any field in a contact is filled, require contact name
      if (!contact.contactName.trim() && (contact.email || contact.position || contact.mobile)) {
        newErrors[`${contact.id}_contactName`] = 'Contact name is required when other fields are filled';
      }
    });

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
      // Filter out empty contacts (all fields empty)
      const validContacts = contacts.filter(contact => 
        contact.contactName.trim() || 
        contact.email.trim() || 
        contact.position.trim() || 
        contact.mobile.trim()
      );

      // Prepare clean contact array (remove id field used for React keys)
      const cleanContacts = validContacts.map(contact => ({
        contactName: contact.contactName || '',
        email: contact.email || '',
        position: contact.position || '',
        mobile: contact.mobile || ''
      }));

      // Pass only the contacts array to parent
      setSecContacts(cleanContacts);

      console.log('Contacts to save:', cleanContacts);
      
      // Close modal after successful submission
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
      
      // Set error message
      const errorMessage = error.response?.data?.message 
        || error.message 
        || 'Failed to save contacts. Please try again.';
      
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-white rounded-2xl shadow-xl max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-orange-50 to-amber-50 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              {existingContacts.length > 0 ? 'Edit Contacts' : 'Add New Contacts'}
            </h1>
            <p className="text-sm text-slate-600">
              {existingContacts.length > 0
                ? 'Update contact information details' 
                : 'Add multiple contacts for this account'}
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
          {/* Add Contact Button at Top */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-600">
              Add multiple contacts for this account. First contact is primary.
            </p>
            <button
              type="button"
              onClick={addContactPanel}
              className="px-4 py-2 text-orange-700 bg-white border-2 border-orange-300 hover:bg-orange-50 rounded-lg transition-all duration-200 font-medium flex items-center gap-2"
              disabled={isSubmitting}
            >
              <Users className="w-4 h-4" />
              Add Contact
            </button>
          </div>

          {/* Contact Panels */}
          {contacts.map((contact, index) => (
            <div 
              key={contact.id} 
              className="bg-orange-50 rounded-xl p-5 border-2 border-orange-200 relative"
            >
              {/* Contact Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                  <User className="w-4 h-4 text-orange-600" />
                  Contact {index + 1} {index === 0 && <span className="text-xs font-normal text-orange-600">(Primary)</span>}
                </h3>
                {contacts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeContactPanel(contact.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                    title="Remove contact"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Contact Name */}
                <div className="lg:col-span-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                    <User className="w-4 h-4 text-orange-600" />
                    Contact Name {index === 0 && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    value={contact.contactName}
                    onChange={(e) => handleInputChange(contact.id, 'contactName', e.target.value)}
                    className={`w-full px-4 py-3 border ${errors[`${contact.id}_contactName`] ? 'border-red-500' : 'border-slate-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent hover:border-slate-400 transition-all bg-white`}
                    placeholder="Enter contact person name"
                  />
                  {errors[`${contact.id}_contactName`] && (
                    <p className="mt-1 text-sm text-red-600">{errors[`${contact.id}_contactName`]}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                    <Mail className="w-4 h-4 text-orange-600" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={contact.email}
                    onChange={(e) => handleInputChange(contact.id, 'email', e.target.value)}
                    className={`w-full px-4 py-3 border ${errors[`${contact.id}_email`] ? 'border-red-500' : 'border-slate-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent hover:border-slate-400 transition-all bg-white`}
                    placeholder="contact@company.com"
                  />
                  {errors[`${contact.id}_email`] && (
                    <p className="mt-1 text-sm text-red-600">{errors[`${contact.id}_email`]}</p>
                  )}
                </div>

                {/* Position */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                    <Tag className="w-4 h-4 text-orange-600" />
                    Position
                  </label>
                  <input
                    type="text"
                    value={contact.position}
                    onChange={(e) => handleInputChange(contact.id, 'position', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent hover:border-slate-400 transition-all bg-white"
                    placeholder="Job title or position"
                  />
                </div>

                {/* Mobile Number */}
                <div className="lg:col-span-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                    <Phone className="w-4 h-4 text-orange-600" />
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={contact.mobile}
                    onChange={(e) => handleInputChange(contact.id, 'mobile', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent hover:border-slate-400 transition-all bg-white"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">i</span>
            </div>
            <div className="flex-1">
              <p className="text-sm text-blue-800">
                <strong>Tip:</strong> You can add multiple contacts for this account. The first contact will be set as the primary contact. Click "Add Contact" to add more contacts.
              </p>
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
          className="px-6 py-3 text-white bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 rounded-lg transition-all duration-200 font-medium flex items-center gap-2 min-w-[140px] justify-center"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Users className="w-4 h-4" />
              Save Contacts
            </>
          )}
        </button>
      </div>
    </div>
  );
}