import React, { useState, useEffect } from 'react';
import { X, Building2, Briefcase, Save } from 'lucide-react';
import { createNewDepartment, updateDepartmentName } from '../../api/DepartmentApi';
import { createNewPosition, updatePositionName } from '../../api/PositionApi';

// API functions (replace with your actual API calls)


export default function HRSystemForm({ onClose, editItem = null, activeTab, onSuccess, loadDepartment, loadPosition }) {
  const [formData, setFormData] = useState({
    name: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createDepartment = async (name) => {
    const response = await createNewDepartment({ dName: name });
    loadDepartment();
  };

  const updateDepartment = async (id, name) => {
    const body = {
      "Id": id,
      "dName": name
    }
    const response = await updateDepartmentName(body);
    loadDepartment();
  };

  const createPosition = async (name) => {
    const response = await createNewPosition({ pName: name });
    loadPosition();
  };

  const updatePosition = async (id, name) => {
    const body = {
      "Id": id,
      "pName": name
    }
    const response = await updatePositionName(body);
    loadPosition();
  };

  // Populate form when editing
  useEffect(() => {
    if (editItem) {
      if (activeTab === 'departments') {
        setFormData({
          name: editItem.d_name || ''
        });
      } else {
        setFormData({
          name: editItem.p_name || ''
        });
      }
    }
  }, [editItem]);

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

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
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
      let result;

      if (editItem && editItem.sysID) {
        // Update existing item
        if (activeTab === 'departments') {
          result = await updateDepartment(editItem.sysID, formData.name);
        } else {
          result = await updatePosition(editItem.sysID, formData.name);
        }
        console.log(`${activeTab.slice(0, -1)} updated:`, result);
      } else {
        // Create new item
        if (activeTab === 'departments') {
          result = await createDepartment(formData.name);
        } else {
          result = await createPosition(formData.name);
        }
        console.log(`${activeTab.slice(0, -1)} created:`, result);
      }

      // Call success callback if provided
      if (onSuccess) {
        onSuccess(result);
      }

      onClose(); // Close modal after successful submission
    } catch (error) {
      console.error('Error submitting form:', error);
      // You might want to show an error message to the user here
      alert(`Error saving ${activeTab.slice(0, -1)}. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditing = editItem && editItem.sysID;

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-green-50 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
            {activeTab === 'departments' ? (
              <Building2 className="w-5 h-5 text-white" />
            ) : (
              <Briefcase className="w-5 h-5 text-white" />
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              {isEditing ? 'Edit' : 'Add'} {activeTab.slice(0, -1)}
            </h1>
            <p className="text-sm text-slate-600">
              {isEditing ? 'Update' : 'Create'} {activeTab.slice(0, -1)} information
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

      {/* Form Content */}
      <div className="p-6">
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
            {activeTab === 'departments' ? (
              <Building2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <Briefcase className="w-4 h-4 text-emerald-600" />
            )}
            {activeTab === 'departments' ? 'Department' : 'Position'} Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${errors.name ? 'border-red-500 bg-red-50' : 'border-slate-300 hover:border-slate-400'
              }`}
            placeholder={`Enter ${activeTab.slice(0, -1)} name`}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)}
          />
          {errors.name && (
            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
              <span className="w-4 h-4">⚠️</span>
              {errors.name}
            </p>
          )}
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
          disabled={isSubmitting || !formData.name.trim()}
          className="px-6 py-3 text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 rounded-lg transition-all duration-200 font-medium flex items-center gap-2 min-w-[120px] justify-center"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {isEditing ? 'Updating...' : 'Saving...'}
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {isEditing ? 'Update' : 'Save'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}