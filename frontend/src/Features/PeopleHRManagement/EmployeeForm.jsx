import { X, UserCheck, Mail, Phone, MapPin, Briefcase, Building, User, FileText, ChevronDown, Users } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { createEmployee, updateEmployee, fetchEmployees } from "../../api/PMApi";
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

  const isEditing = editEmployee && editEmployee.sysID;

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [selectedManagers, setSelectedManagers] = useState([]);
  const [managerSearch, setManagerSearch] = useState('');
  const [managerDropdownOpen, setManagerDropdownOpen] = useState(false);
  const managerDropdownRef = useRef(null);

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
      // Parse existing managers (comma-separated) into array
      if (editEmployee.a_manager) {
        const managers = editEmployee.a_manager.split(',').map(m => m.trim()).filter(Boolean);
        setSelectedManagers(managers);
      }
    }
  }, [editEmployee]);

  // Fetch departments, positions, and employees from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [departmentsData, positionsData, employeesData] = await Promise.all([
          fetchDepartment(),
          fetchPosition(),
          fetchEmployees()
        ]);
        setDepartments(departmentsData || []);
        setPositions(positionsData || []);
        setAllEmployees(employeesData || []);
      } catch (error) {
        console.error('Error fetching departments, positions and employees:', error);
      }
    };
    fetchData();
  }, []);

  // Close manager dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (managerDropdownRef.current && !managerDropdownRef.current.contains(e.target)) {
        setManagerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Build employee name list for manager dropdown (exclude current employee being edited)
  const managerOptions = allEmployees
    .filter(emp => {
      const name = `${emp.fname || ''} ${emp.lname || ''}`.trim();
      // Exclude current employee if editing
      if (isEditing && String(emp.sysID || emp.SysID) === String(formData.sysID)) return false;
      // Filter by search
      if (managerSearch && !name.toLowerCase().includes(managerSearch.toLowerCase())) return false;
      // Exclude already selected
      if (selectedManagers.includes(name)) return false;
      return name.length > 0;
    })
    .map(emp => ({
      id: emp.sysID || emp.SysID,
      name: `${emp.fname || ''} ${emp.lname || ''}`.trim(),
      position: emp.position || '',
      department: emp.department || ''
    }));

  const addManager = (name) => {
    const updated = [...selectedManagers, name];
    setSelectedManagers(updated);
    setFormData(prev => ({ ...prev, a_manager: updated.join(', ') }));
    setManagerSearch('');
    setManagerDropdownOpen(false);
  };

  const removeManager = (name) => {
    const updated = selectedManagers.filter(m => m !== name);
    setSelectedManagers(updated);
    setFormData(prev => ({ ...prev, a_manager: updated.join(', ') }));
  };

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

              {/* Assigned Manager - Multi-select */}
              <div className="lg:col-span-2" ref={managerDropdownRef}>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                  <Users className="w-4 h-4 text-cyan-600" />
                  Assigned Manager(s)
                </label>

                {/* Selected Manager Tags */}
                {selectedManagers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedManagers.map((name) => (
                      <span
                        key={name}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-sm font-medium"
                      >
                        <User className="w-3.5 h-3.5" />
                        {name}
                        <button
                          type="button"
                          onClick={() => removeManager(name)}
                          className="ml-1 hover:bg-emerald-200 rounded-full p-0.5 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Search & Dropdown */}
                <div className="relative">
                  <div className="relative">
                    <input
                      type="text"
                      value={managerSearch}
                      onChange={(e) => {
                        setManagerSearch(e.target.value);
                        setManagerDropdownOpen(true);
                      }}
                      onFocus={() => setManagerDropdownOpen(true)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent hover:border-slate-400 transition-all pr-10"
                      placeholder="Search and select managers..."
                    />
                    <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-transform ${managerDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>

                  {/* Dropdown List */}
                  {managerDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {managerOptions.length > 0 ? (
                        managerOptions.map((emp) => (
                          <button
                            type="button"
                            key={emp.id}
                            onClick={() => addManager(emp.name)}
                            className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 transition-colors flex items-center justify-between group"
                          >
                            <div>
                              <span className="text-sm font-medium text-slate-800 group-hover:text-emerald-700">{emp.name}</span>
                              {(emp.position || emp.department) && (
                                <span className="ml-2 text-xs text-slate-400">
                                  {[emp.position, emp.department].filter(Boolean).join(' · ')}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-emerald-500 opacity-0 group-hover:opacity-100">+ Add</span>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-slate-400 text-center">
                          {managerSearch ? 'No matching employees found' : 'No more employees to add'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
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