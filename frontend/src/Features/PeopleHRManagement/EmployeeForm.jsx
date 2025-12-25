import { X, UserCheck, Mail, Phone, MapPin, Briefcase, Building, User, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { createEmployee, updateEmployee } from "../../api/PMApi";
import { fetchDepartment } from "../../api/DepartmentApi";
import { fetchPosition } from "../../api/PositionApi";


export default function EmployeeForm({ onClose, editEmployee = null, onSuccess }) {
  const [formData, setFormData] = useState({
    sysID: '',
    fname: '',
    lname: '',
    email: '',
    tp: '',
    position: '',
    department: '',
    w_location: '',
    a_manager: '',
    status: 'Active',
    note: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);

  // Populate form when editing
  useEffect(() => {
    console.log("this is employee", editEmployee);
    if (editEmployee) {
      setFormData({
        sysID: editEmployee.sysID || '',
        fname: editEmployee.fname || '',
        lname: editEmployee.lname || '',
        email: editEmployee.email || '',
        tp: editEmployee.tp || '',
        position: editEmployee.position || '',
        department: editEmployee.department || '',
        w_location: editEmployee.w_location || '',
        a_manager: editEmployee.a_manager || '',
        status: editEmployee.status || 'Active',
        note: editEmployee.note || ''
      });
    }
  }, [editEmployee]);

  // Fetch departments and positions from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [departmentsData, positionsData] = await Promise.all([
          fetchDepartment(),
          fetchPosition()
        ]);
        setDepartments(departmentsData || []);
        setPositions(positionsData || []);
      } catch (error) {
        console.error('Error fetching departments and positions:', error);
      }
    };
    fetchData();
  }, []);

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
    
    if (!formData.fname.trim()) {
      newErrors.fname = 'First name is required';
    }
    
    if (!formData.lname.trim()) {
      newErrors.lname = 'Last name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.position) {
      newErrors.position = 'Position is required';
    }

    if (!formData.department) {
      newErrors.department = 'Department is required';
    }

    if (formData.tp && !/^[\+]?[0-9\s\-\(\)]{10,15}$/.test(formData.tp)) {
      newErrors.tp = 'Please enter a valid phone number';
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

    console.log("pppppppp",formData);
    
    try {
      let result;
      
      if (editEmployee && editEmployee.sysID) {
        result = await updateEmployee(formData);
        console.log('Employee updated:', result);
      } else {
        const { sysID, ...createData } = formData;
        result = await createEmployee(createData);
        console.log('Employee created:', result);
      }
      
      if (onSuccess) {
        onSuccess(result);
      }     
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error saving employee. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusOptions = [
    { value: 'Active', label: 'Active' },
    { value: 'Inactive', label: 'Inactive' }
  ];

  const isEditing = editEmployee && editEmployee.sysID;

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-xl max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-green-50 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
            <UserCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              {isEditing ? 'Edit Employee' : 'Add New Employee'}
            </h1>
            <p className="text-sm text-slate-600">
              {isEditing ? 'Update employee information' : 'Create a new employee profile'}
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
        <div className="space-y-8">
          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* First Name */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                  <User className="w-4 h-4 text-blue-600" />
                  First Name *
                </label>
                <input
                  type="text"
                  name="fname"
                  value={formData.fname}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                    errors.fname ? 'border-red-500 bg-red-50' : 'border-slate-300 hover:border-slate-400'
                  }`}
                  placeholder="Enter first name"
                />
                {errors.fname && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <span className="w-4 h-4">⚠️</span>
                    {errors.fname}
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                  <User className="w-4 h-4 text-purple-600" />
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lname"
                  value={formData.lname}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                    errors.lname ? 'border-red-500 bg-red-50' : 'border-slate-300 hover:border-slate-400'
                  }`}
                  placeholder="Enter last name"
                />
                {errors.lname && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <span className="w-4 h-4">⚠️</span>
                    {errors.lname}
                  </p>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  Employment Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent hover:border-slate-400 transition-all"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Email */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                  <Mail className="w-4 h-4 text-red-600" />
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                    errors.email ? 'border-red-500 bg-red-50' : 'border-slate-300 hover:border-slate-400'
                  }`}
                  placeholder="Enter email address"
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
                  name="tp"
                  value={formData.tp}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                    errors.tp ? 'border-red-500 bg-red-50' : 'border-slate-300 hover:border-slate-400'
                  }`}
                  placeholder="0771234567"
                />
                {errors.tp && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <span className="w-4 h-4">⚠️</span>
                    {errors.tp}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Employment Information */}
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Employment Information</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Position - Select Dropdown */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                  <Briefcase className="w-4 h-4 text-indigo-600" />
                  Position/Title *
                </label>
                <select
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                    errors.position ? 'border-red-500 bg-red-50' : 'border-slate-300 hover:border-slate-400'
                  }`}
                >
                  <option value="">Select position</option>
                  {positions.map((option) => (
                    <option key={option.sysID} value={option.p_name}>
                      {option.p_name}
                    </option>
                  ))}
                </select>
                {errors.position && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <span className="w-4 h-4">⚠️</span>
                    {errors.position}
                  </p>
                )}
              </div>

              {/* Department */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                  <Building className="w-4 h-4 text-orange-600" />
                  Department *
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                    errors.department ? 'border-red-500 bg-red-50' : 'border-slate-300 hover:border-slate-400'
                  }`}
                >
                  <option value="">Select department</option>
                  {departments.map((option) => (
                    <option key={option.sysID} value={option.d_name}>
                      {option.d_name}
                    </option>
                  ))}
                </select>
                {errors.department && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <span className="w-4 h-4">⚠️</span>
                    {errors.department}
                  </p>
                )}
              </div>

              {/* Work Location */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                  <MapPin className="w-4 h-4 text-teal-600" />
                  Work Location
                </label>
                <input
                  type="text"
                  name="w_location"
                  value={formData.w_location}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent hover:border-slate-400 transition-all"
                  placeholder="e.g., Warehouse A, Distribution Center, Main Office"
                />
              </div>

              {/* Assigned Manager */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                  <User className="w-4 h-4 text-cyan-600" />
                  Assigned Manager
                </label>
                <input
                  type="text"
                  name="a_manager"
                  value={formData.a_manager}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent hover:border-slate-400 transition-all"
                  placeholder="Enter assigned manager's name"
                />
              </div>
            </div>
          </div>

          {/* Additional Information - Only Notes */}
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Additional Information</h3>
            <div className="grid grid-cols-1 gap-6">
              {/* Notes */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                  <FileText className="w-4 h-4 text-gray-600" />
                  Additional Notes
                </label>
                <textarea
                  name="note"
                  value={formData.note}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent hover:border-slate-400 transition-all resize-none"
                  placeholder="Any additional notes about this employee, special skills, certifications, training requirements, etc..."
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
          className="px-6 py-3 text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 rounded-lg transition-all duration-200 font-medium flex items-center gap-2 min-w-[140px] justify-center"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {isEditing ? 'Updating...' : 'Saving...'}
            </>
          ) : (
            <>
              <UserCheck className="w-4 h-4" />
              {isEditing ? 'Update Employee' : 'Add Employee'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}