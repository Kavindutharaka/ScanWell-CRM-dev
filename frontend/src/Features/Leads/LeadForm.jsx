import { X, UserPlus, Mail, Phone, Building, Tag, FileText, User, Calendar, Target, Clock } from "lucide-react";
import { useState } from "react";
import { createLead, groupAssign } from "../../api/LeadApi";

export default function LeadForm({ onClose, createGLeadId }) {
  const [formData, setFormData] = useState({
    leadName: '',
    status: '',
    company: '',
    title: '',
    email: '',
    phone: '',
    lastInteraction: '',
    activeSequences: '',
    notes: '',
    priority: 'medium',
    score: 50
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.leadName.trim()) {
      newErrors.leadName = 'Lead name is required';
    }
    if (!formData.status) {
      newErrors.status = 'Status is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (formData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/[\s\-\(\)]/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    if (!formData.company.trim()) {
      newErrors.company = 'Company name is required';
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
      const leadData = {
        name: formData.leadName,
        status: formData.status,
        company: formData.company,
        title: formData.title,
        email: formData.email,
        phone: formData.phone,
        lastInteraction: formData.lastInteraction,
        activeSequences: formData.activeSequences,
        notes: formData.notes,
        priority: formData.priority,
        score: parseInt(formData.score),
        approvalStatus: "pending",
        assignedTo: null
      };
      console.log("ll", leadData);
      const response = await createLead(leadData);
      console.log("Created lead response", response);
      console.log("Going to lead save",response.id, createGLeadId);
      // await assignGroup(response.id, createGLeadId);
      alert('Lead created successfully!');
      onClose();
      window.location.reload();
    } catch (error) {
      alert('Failed to create lead. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const assignGroup = async(lid, gid)=>{
    const response = await groupAssign(lid, gid);
  };

  const statusOptions = [
    { value: 'new', label: 'New Lead', color: 'bg-orange-500' },
    { value: 'contacted', label: 'Contacted', color: 'bg-blue-500' },
    { value: 'qualified', label: 'Qualified', color: 'bg-green-500' },
    { value: 'unqualified', label: 'Unqualified', color: 'bg-red-500' },
    { value: 'nurturing', label: 'Nurturing', color: 'bg-purple-500' },
    { value: 'converted', label: 'Converted', color: 'bg-emerald-500' },
    { value: 'lost', label: 'Lost', color: 'bg-gray-500' }
  ];

  const sequenceOptions = [
    { value: 'welcome', label: 'Welcome Series' },
    { value: 'demo', label: 'Product Demo Flow' },
    { value: 'nurture', label: 'Lead Nurturing' },
    { value: 'trial', label: 'Free Trial Follow-up' },
    { value: 'webinar', label: 'Webinar Series' },
    { value: 'consultation', label: 'Consultation Booking' },
    { value: 'custom', label: 'Custom Sequence' }
  ];

  return (
    <div className="w-full max-w-5xl mx-auto bg-white rounded-2xl shadow-xl max-h-[90vh] flex flex-col">
      <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-orange-50 to-amber-50 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Add New Lead</h1>
            <p className="text-sm text-slate-600">Capture and track potential customers</p>
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
      <div className="flex-1 overflow-y-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <UserPlus className="w-4 h-4 text-orange-600" />
                Lead Name *
              </label>
              <input
                type="text"
                name="leadName"
                value={formData.leadName}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                  errors.leadName ? 'border-red-500 bg-red-50' : 'border-slate-300 hover:border-slate-400'
                }`}
                placeholder="Enter lead's full name"
              />
              {errors.leadName && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <span className="w-4 h-4">⚠️</span>
                  {errors.leadName}
                </p>
              )}
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <Tag className="w-4 h-4 text-orange-600" />
                Status *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                  errors.status ? 'border-red-500 bg-red-50' : 'border-slate-300 hover:border-slate-400'
                }`}
              >
                <option value="">Select status</option>
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              {errors.status && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <span className="w-4 h-4">⚠️</span>
                  {errors.status}
                </p>
              )}
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <Building className="w-4 h-4 text-orange-600" />
                Company *
              </label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                  errors.company ? 'border-red-500 bg-red-50' : 'border-slate-300 hover:border-slate-400'
                }`}
                placeholder="Enter company name"
              />
              {errors.company && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <span className="w-4 h-4">⚠️</span>
                  {errors.company}
                </p>
              )}
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <User className="w-4 h-4 text-orange-600" />
                Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all hover:border-slate-400"
                placeholder="Enter lead's title"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <Mail className="w-4 h-4 text-orange-600" />
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                  errors.email ? 'border-red-500 bg-red-50' : 'border-slate-300 hover:border-slate-400'
                }`}
                placeholder="Enter lead's email"
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <span className="w-4 h-4">⚠️</span>
                  {errors.email}
                </p>
              )}
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <Phone className="w-4 h-4 text-orange-600" />
                Phone
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                  errors.phone ? 'border-red-500 bg-red-50' : 'border-slate-300 hover:border-slate-400'
                }`}
                placeholder="Enter lead's phone number"
              />
              {errors.phone && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <span className="w-4 h-4">⚠️</span>
                  {errors.phone}
                </p>
              )}
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <Calendar className="w-4 h-4 text-orange-600" />
                Last Interaction
              </label>
              <input
                type="date"
                name="lastInteraction"
                value={formData.lastInteraction}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all hover:border-slate-400"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <Target className="w-4 h-4 text-orange-600" />
                Active Sequences
              </label>
              <select
                name="activeSequences"
                value={formData.activeSequences}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all hover:border-slate-400"
              >
                <option value="">Select sequence</option>
                {sequenceOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <Target className="w-4 h-4 text-orange-600" />
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all hover:border-slate-400"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            {/* <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <Clock className="w-4 h-4 text-orange-600" />
                Score
              </label>
              <input
                type="number"
                name="score"
                value={formData.score}
                onChange={handleInputChange}
                min="0"
                max="100"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all hover:border-slate-400"
                placeholder="Enter lead score (0-100)"
              />
            </div> */}
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
              <FileText className="w-4 h-4 text-orange-600" />
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all hover:border-slate-400"
              placeholder="Add any additional notes about the lead"
            />
          </div>
          <div className="flex gap-4 pt-4 border-t border-slate-200">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                isSubmitting
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-orange-600 hover:bg-orange-700 text-white'
              }`}
            >
              <UserPlus className="w-5 h-5" />
              {isSubmitting ? 'Creating...' : 'Create Lead'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300 transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}