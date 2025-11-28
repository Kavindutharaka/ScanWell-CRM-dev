import { useState, useEffect } from 'react';
import { 
  Save, 
  X, 
  User, 
  Key, 
  Eye, 
  EyeOff, 
  Shield,
  CheckSquare,
  Square,
  Database,
  Link,
  TrendingUp,
  FileText,
  MessageSquare,
  Users,
  Briefcase,
  Settings
} from 'lucide-react';
import UserRoleApi from '../../api/UserRoleApi';

const RoleForm = ({ employees, selectedRole, isEditMode, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    employeeId: '',
    username: '',
    password: '',
    isAdmin: false,
    isActive: true,
    // Rate Manage
    rateManageView: false,
    rateManageAdd: false,
    rateManageEdit: false,
    // Useful Links
    usefulLinksView: false,
    usefulLinksAdd: false,
    usefulLinksEdit: false,
    // Sales Plan
    salesPlanView: false,
    salesPlanAdd: false,
    salesPlanEdit: false,
    // Quotes
    quotesView: false,
    quotesAdd: false,
    quotesEdit: false,
    // RFQ
    rfqView: false,
    rfqAdd: false,
    rfqEdit: false,
    // Contact
    contactView: false,
    contactAdd: false,
    contactEdit: false,
    // Account
    accountView: false,
    accountAdd: false,
    accountEdit: false,
    // System Management
    systemManagementView: false,
    systemManagementAdd: false,
    systemManagementEdit: false,
  });

  const modules = [
    { 
      name: 'Rate Manage', 
      key: 'rateManage',
      icon: Database,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    { 
      name: 'Useful Links', 
      key: 'usefulLinks',
      icon: Link,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    { 
      name: 'Sales Plan', 
      key: 'salesPlan',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    { 
      name: 'Quotes', 
      key: 'quotes',
      icon: FileText,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    { 
      name: 'RFQ', 
      key: 'rfq',
      icon: MessageSquare,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100'
    },
    { 
      name: 'Contact', 
      key: 'contact',
      icon: Users,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100'
    },
    { 
      name: 'Account', 
      key: 'account',
      icon: Briefcase,
      color: 'text-teal-600',
      bgColor: 'bg-teal-100'
    },
    { 
      name: 'System Management', 
      key: 'systemManagement',
      icon: Settings,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
  ];

  useEffect(() => {
    if (isEditMode && selectedRole) {
      setFormData({
        employeeId: selectedRole.employeeId || '',
        username: selectedRole.username || '',
        password: '', // Don't populate password for security
        isAdmin: selectedRole.isAdmin || false,
        isActive: selectedRole.isActive !== undefined ? selectedRole.isActive : true,
        // Rate Manage
        rateManageView: selectedRole.rateManageView || false,
        rateManageAdd: selectedRole.rateManageAdd || false,
        rateManageEdit: selectedRole.rateManageEdit || false,
        // Useful Links
        usefulLinksView: selectedRole.usefulLinksView || false,
        usefulLinksAdd: selectedRole.usefulLinksAdd || false,
        usefulLinksEdit: selectedRole.usefulLinksEdit || false,
        // Sales Plan
        salesPlanView: selectedRole.salesPlanView || false,
        salesPlanAdd: selectedRole.salesPlanAdd || false,
        salesPlanEdit: selectedRole.salesPlanEdit || false,
        // Quotes
        quotesView: selectedRole.quotesView || false,
        quotesAdd: selectedRole.quotesAdd || false,
        quotesEdit: selectedRole.quotesEdit || false,
        // RFQ
        rfqView: selectedRole.rfqView || false,
        rfqAdd: selectedRole.rfqAdd || false,
        rfqEdit: selectedRole.rfqEdit || false,
        // Contact
        contactView: selectedRole.contactView || false,
        contactAdd: selectedRole.contactAdd || false,
        contactEdit: selectedRole.contactEdit || false,
        // Account
        accountView: selectedRole.accountView || false,
        accountAdd: selectedRole.accountAdd || false,
        accountEdit: selectedRole.accountEdit || false,
        // System Management
        systemManagementView: selectedRole.systemManagementView || false,
        systemManagementAdd: selectedRole.systemManagementAdd || false,
        systemManagementEdit: selectedRole.systemManagementEdit || false,
      });
    }
  }, [selectedRole, isEditMode]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePermissionChange = (moduleKey, permissionType) => {
    const fieldName = `${moduleKey}${permissionType}`;
    setFormData(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
  };

  const handleSelectAllForModule = (moduleKey) => {
    const allSelected = formData[`${moduleKey}View`] && 
                       formData[`${moduleKey}Add`] && 
                       formData[`${moduleKey}Edit`];
    
    setFormData(prev => ({
      ...prev,
      [`${moduleKey}View`]: !allSelected,
      [`${moduleKey}Add`]: !allSelected,
      [`${moduleKey}Edit`]: !allSelected,
    }));
  };

  const handleSelectAllPermissions = () => {
    const allSelected = modules.every(module => 
      formData[`${module.key}View`] && 
      formData[`${module.key}Add`] && 
      formData[`${module.key}Edit`]
    );

    const newState = {};
    modules.forEach(module => {
      newState[`${module.key}View`] = !allSelected;
      newState[`${module.key}Add`] = !allSelected;
      newState[`${module.key}Edit`] = !allSelected;
    });

    setFormData(prev => ({ ...prev, ...newState }));
  };

  const validateForm = () => {
    if (!formData.employeeId) {
      alert('Please select an employee');
      return false;
    }
    if (!formData.username.trim()) {
      alert('Please enter a username');
      return false;
    }
    if (!isEditMode && !formData.password.trim()) {
      alert('Please enter a password');
      return false;
    }
    if (formData.password && formData.password.length < 6) {
      alert('Password must be at least 6 characters long');
      return false;
    }
    return true;
  };

  // Transform camelCase to PascalCase for backend
  const transformToBackend = (data) => {
    const backendData = {
      EmployeeId: data.employeeId,
      Username: data.username,
      IsAdmin: data.isAdmin,
      IsActive: data.isActive,
      
      // Rate Manage
      RateManageView: data.rateManageView,
      RateManageAdd: data.rateManageAdd,
      RateManageEdit: data.rateManageEdit,
      
      // Useful Links
      UsefulLinksView: data.usefulLinksView,
      UsefulLinksAdd: data.usefulLinksAdd,
      UsefulLinksEdit: data.usefulLinksEdit,
      
      // Sales Plan
      SalesPlanView: data.salesPlanView,
      SalesPlanAdd: data.salesPlanAdd,
      SalesPlanEdit: data.salesPlanEdit,
      
      // Quotes
      QuotesView: data.quotesView,
      QuotesAdd: data.quotesAdd,
      QuotesEdit: data.quotesEdit,
      
      // RFQ
      RfqView: data.rfqView,
      RfqAdd: data.rfqAdd,
      RfqEdit: data.rfqEdit,
      
      // Contact
      ContactView: data.contactView,
      ContactAdd: data.contactAdd,
      ContactEdit: data.contactEdit,
      
      // Account
      AccountView: data.accountView,
      AccountAdd: data.accountAdd,
      AccountEdit: data.accountEdit,
      
      // System Management
      SystemManagementView: data.systemManagementView,
      SystemManagementAdd: data.systemManagementAdd,
      SystemManagementEdit: data.systemManagementEdit,
    };

    // Add password only if provided
    if (data.password && data.password.trim()) {
      backendData.Password = data.password;
    }

    return backendData;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);

      const backendData = transformToBackend(formData);
      console.log("this is y: ", backendData);

      if (isEditMode) {
        await UserRoleApi.updateUserRole(selectedRole.id, backendData);
        alert('User role updated successfully!');
      } else {
        await UserRoleApi.createUserRole(backendData);
        alert('User role created successfully!');
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving user role:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.Message ||
                          'Failed to save user role. Please try again.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Find selected employee using the transformed data structure
  const selectedEmployee = employees.find(emp => emp.id === formData.employeeId);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Employee Selection Section */}
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-purple-600" />
          Employee Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Employee <span className="text-red-500">*</span>
            </label>
            <select
              name="employeeId"
              value={formData.employeeId}
              onChange={handleInputChange}
              disabled={isEditMode}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              required
            >
              <option value="">-- Select Employee --</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName} - {emp.sysID}
                </option>
              ))}
            </select>
          </div>

          {selectedEmployee && (
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-sm text-gray-600 space-y-1">
                <p><span className="font-medium">Department:</span> {selectedEmployee.department || 'N/A'}</p>
                <p><span className="font-medium">Position:</span> {selectedEmployee.position || 'N/A'}</p>
                <p><span className="font-medium">Email:</span> {selectedEmployee.email || 'N/A'}</p>
                <p><span className="font-medium">Location:</span> {selectedEmployee.location || 'N/A'}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Credentials Section */}
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Key className="w-5 h-5 text-purple-600" />
          Login Credentials
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Enter username"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password {!isEditMode && <span className="text-red-500">*</span>}
              {isEditMode && <span className="text-sm text-gray-500">(Leave empty to keep current)</span>}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder={isEditMode ? 'Enter new password' : 'Enter password'}
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required={!isEditMode}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Status Toggle */}
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="isActive"
            checked={formData.isActive}
            onChange={handleInputChange}
            className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
          />
          <div>
            <span className="text-sm font-medium text-gray-900">Active Status</span>
            <p className="text-sm text-gray-500">User can log in and access assigned modules</p>
          </div>
        </label>
      </div>

      {/* Permissions Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-purple-50 px-6 py-4 border-b border-purple-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-600" />
            Module Permissions
          </h3>
          <button
            type="button"
            onClick={handleSelectAllPermissions}
            className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
          >
            <CheckSquare className="w-4 h-4" />
            Select All
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-1/3">
                  Module
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-20">
                  View
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-20">
                  Add
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-20">
                  Edit
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                  All
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {modules.map((module) => {
                const Icon = module.icon;
                const allSelected = formData[`${module.key}View`] && 
                                  formData[`${module.key}Add`] && 
                                  formData[`${module.key}Edit`];
                
                return (
                  <tr key={module.key} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${module.bgColor}`}>
                          <Icon className={`w-5 h-5 ${module.color}`} />
                        </div>
                        <span className="font-medium text-gray-900">{module.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => handlePermissionChange(module.key, 'View')}
                        className="inline-flex items-center justify-center w-6 h-6 rounded hover:bg-gray-100 transition-colors"
                      >
                        {formData[`${module.key}View`] ? (
                          <CheckSquare className="w-5 h-5 text-purple-600" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => handlePermissionChange(module.key, 'Add')}
                        className="inline-flex items-center justify-center w-6 h-6 rounded hover:bg-gray-100 transition-colors"
                      >
                        {formData[`${module.key}Add`] ? (
                          <CheckSquare className="w-5 h-5 text-green-600" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => handlePermissionChange(module.key, 'Edit')}
                        className="inline-flex items-center justify-center w-6 h-6 rounded hover:bg-gray-100 transition-colors"
                      >
                        {formData[`${module.key}Edit`] ? (
                          <CheckSquare className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleSelectAllForModule(module.key)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          allSelected 
                            ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {allSelected ? 'All' : 'None'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Checkbox Section */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-6 border border-red-200">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="isAdmin"
            checked={formData.isAdmin}
            onChange={handleInputChange}
            className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500 mt-0.5"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-5 h-5 text-red-600" />
              <span className="text-sm font-bold text-red-900">Administrator Access</span>
            </div>
            <p className="text-sm text-red-700">
              Grant full system access with administrative privileges. Administrators can manage all modules, 
              users, and system settings regardless of individual permissions.
            </p>
          </div>
        </label>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          disabled={loading}
        >
          <X className="w-5 h-5" />
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              {isEditMode ? 'Update Role' : 'Create Role'}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default RoleForm;