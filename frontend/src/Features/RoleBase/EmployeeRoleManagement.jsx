import { useState, useEffect } from "react";
import { Users, Shield, Search, Plus, Edit2, Trash2, Key } from 'lucide-react';
import Header from "../../components/Header";
import SideNav from "../../components/SideNav";
import RoleManagementSection from './RoleManagementSection';
import UserRoleApi from '../../api/UserRoleApi';
import { fetchEmployees } from '../../api/PMApi';

export default function EmployeeRoleManagement() {
  const [openModal, setOpenModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [employees, setEmployees] = useState([]);
  const [userRoles, setUserRoles] = useState([]);
  const [filteredRoles, setFilteredRoles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUserRoles();
    loadEmployees();
  }, [refreshTrigger]);

  useEffect(() => {
    filterRoles();
  }, [searchTerm, userRoles]);

  const loadEmployees = async () => {
    try {
      const data = await fetchEmployees();
      // Transform PMApi employee data to our format
      const transformedEmployees = data.map(emp => ({
        id: emp.sysID.toString(),
        sysID: emp.sysID,
        firstName: emp.fname,
        lastName: emp.lname,
        fullName: `${emp.fname} ${emp.lname}`,
        email: emp.email,
        phone: emp.tp,
        position: emp.position,
        department: emp.department,
        location: emp.w_location,
        manager: emp.a_manager,
        status: emp.status
      }));
      setEmployees(transformedEmployees);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchUserRoles = async () => {
    try {
      setLoading(true);
      const data = await UserRoleApi.fetchUserRoles();
      console.log("bbbb: ",data);
      // Transform backend PascalCase to frontend camelCase
      const transformedData = data.map(role => ({
        id: role.id,
        employeeId: role.employeeId,
        employeeName: role.employeeName || 'Unknown Employee',
        username: role.username,
        isAdmin: role.isAdmin,
        isActive: role.isActive,
        
        // Rate Manage
        rateManageView: role.rateManageView,
        rateManageAdd: role.rateManageAdd,
        rateManageEdit: role.rateManageEdit,
        
        // Useful Links
        usefulLinksView: role.usefulLinksView,
        usefulLinksAdd: role.usefulLinksAdd,
        usefulLinksEdit: role.usefulLinksEdit,
        
        // Sales Plan
        salesPlanView: role.salesPlanView,
        salesPlanAdd: role.salesPlanAdd,
        salesPlanEdit: role.salesPlanEdit,
        
        // Quotes
        quotesView: role.quotesView,
        quotesAdd: role.quotesAdd,
        quotesEdit: role.quotesEdit,
        
        // RFQ
        rfqView: role.rfqView,
        rfqAdd: role.rfqAdd,
        rfqEdit: role.rfqEdit,
        
        // Contact
        contactView: role.contactView,
        contactAdd: role.contactAdd,
        contactEdit: role.contactEdit,
        
        // Account
        accountView: role.accountView,
        accountAdd: role.accountAdd,
        accountEdit: role.accountEdit,
        
        // System Management
        systemManagementView: role.systemManagementView,
        systemManagementAdd: role.systemManagementAdd,
        systemManagementEdit: role.systemManagementEdit,
        
        createdAt: role.createdAt,
        updatedAt: role.updatedAt
      }));
      
      setUserRoles(transformedData);
      setFilteredRoles(transformedData);
    } catch (error) {
      console.error('Error fetching user roles:', error);
      alert('Failed to load user roles. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterRoles = () => {
    if (!searchTerm.trim()) {
      setFilteredRoles(userRoles);
      return;
    }

    const filtered = userRoles.filter(role =>
      role.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredRoles(filtered);
  };

  const modalOpen = () => {
    setSelectedRole(null);
    setIsEditMode(false);
    setOpenModal(true);
  };

  const modalClose = () => {
    setOpenModal(false);
    setSelectedRole(null);
    setIsEditMode(false);
  };

  const handleEditRole = (role) => {
    setSelectedRole(role);
    setIsEditMode(true);
    setOpenModal(true);
  };

  const handleDeleteRole = async (roleId) => {
    if (!window.confirm('Are you sure you want to delete this user role? This will revoke all access permissions.')) {
      return;
    }

    try {
      await UserRoleApi.deleteUserRole(roleId);
      setRefreshTrigger(prev => prev + 1);
      alert('User role deleted successfully!');
    } catch (error) {
      console.error('Error deleting user role:', error);
      alert(error.response?.data?.message || 'Failed to delete user role. Please try again.');
    }
  };

  const handleSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
    modalClose();
  };

  const handleMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMenuClose = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
      <Header 
        onMenuToggle={handleMenuToggle} 
        isMobileMenuOpen={isMobileMenuOpen}
      />
      
      <div className="flex flex-1 overflow-hidden pt-14">
        <SideNav 
          isOpen={isMobileMenuOpen} 
          onClose={handleMenuClose}
        />

        <main className="flex-1 overflow-y-auto p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Employee Role Management</h1>
            </div>
            <p className="text-gray-600 ml-14">Manage employee access permissions and system roles</p>
          </div>

          {/* Action Bar */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by employee name, username, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={modalOpen}
                className="flex items-center gap-2 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add User Role
              </button>
            </div>
          </div>

          {/* User Roles Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-purple-50 border-b border-purple-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-purple-900 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-purple-900 uppercase tracking-wider">
                      Username
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-purple-900 uppercase tracking-wider">
                      Role Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-purple-900 uppercase tracking-wider">
                      Permissions
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-purple-900 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-purple-900 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                          Loading user roles...
                        </div>
                      </td>
                    </tr>
                  ) : filteredRoles.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-lg font-medium text-gray-600 mb-1">No user roles found</p>
                        <p className="text-sm text-gray-500">
                          {searchTerm ? 'Try adjusting your search criteria' : 'Click "Add User Role" to create the first one'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredRoles.map((role) => {
                      const permissionCount = [
                        role.rateManageView, role.rateManageAdd, role.rateManageEdit,
                        role.usefulLinksView, role.usefulLinksAdd, role.usefulLinksEdit,
                        role.salesPlanView, role.salesPlanAdd, role.salesPlanEdit,
                        role.quotesView, role.quotesAdd, role.quotesEdit,
                        role.rfqView, role.rfqAdd, role.rfqEdit,
                        role.contactView, role.contactAdd, role.contactEdit,
                        role.accountView, role.accountAdd, role.accountEdit,
                        role.systemManagementView, role.systemManagementAdd, role.systemManagementEdit
                      ].filter(Boolean).length;

                      return (
                        <tr key={role.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                <Users className="w-5 h-5 text-purple-600" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{role.employeeName}</div>
                                <div className="text-sm text-gray-500">ID: {role.employeeId}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Key className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-900 font-medium">{role.username}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {role.isAdmin ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                                <Shield className="w-4 h-4" />
                                Administrator
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                <Users className="w-4 h-4" />
                                Standard User
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-600">
                              {permissionCount} permissions assigned
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                              role.isActive 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {role.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleEditRole(role)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit Role"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteRole(role.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Role"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden p-4 space-y-4">
              {loading ? (
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-12">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500">Loading user roles...</p>
                  </div>
                </div>
              ) : filteredRoles.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-12">
                  <div className="text-center">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-lg font-medium text-gray-600 mb-1">No user roles found</p>
                    <p className="text-sm text-gray-500">
                      {searchTerm ? 'Try adjusting your search criteria' : 'Click "Add User Role" to create the first one'}
                    </p>
                  </div>
                </div>
              ) : (
                filteredRoles.map((role) => {
                  const permissionCount = [
                    role.rateManageView, role.rateManageAdd, role.rateManageEdit,
                    role.usefulLinksView, role.usefulLinksAdd, role.usefulLinksEdit,
                    role.salesPlanView, role.salesPlanAdd, role.salesPlanEdit,
                    role.quotesView, role.quotesAdd, role.quotesEdit,
                    role.rfqView, role.rfqAdd, role.rfqEdit,
                    role.contactView, role.contactAdd, role.contactEdit,
                    role.accountView, role.accountAdd, role.accountEdit,
                    role.systemManagementView, role.systemManagementAdd, role.systemManagementEdit
                  ].filter(Boolean).length;

                  return (
                    <div key={role.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                      {/* Card Header */}
                      <div className="p-4 bg-purple-50 border-b border-purple-100">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <Users className="w-6 h-6 text-purple-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 text-base mb-1">
                                {role.employeeName}
                              </h3>
                              <div className="text-xs text-gray-500 mb-2">ID: {role.employeeId}</div>
                              <div className="flex items-center gap-2">
                                <Key className="w-3 h-3 text-gray-400" />
                                <span className="text-sm text-gray-700 font-medium">{role.username}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Role Type & Status */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {role.isAdmin ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                              <Shield className="w-3 h-3" />
                              Administrator
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                              <Users className="w-3 h-3" />
                              Standard User
                            </span>
                          )}
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                            role.isActive 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {role.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-4">
                        {/* Permissions */}
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
                          <div className="flex items-center gap-2 mb-1">
                            <Shield className="w-4 h-4 text-purple-600" />
                            <span className="text-xs font-semibold text-purple-900">Permissions</span>
                          </div>
                          <div className="text-lg font-bold text-purple-700">
                            {permissionCount} assigned
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditRole(role)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit Role
                          </button>
                          <button
                            onClick={() => handleDeleteRole(role.id)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </main>
      </div>

      {openModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={modalClose}
          />
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="relative w-full animate-fadeIn">
              <RoleManagementSection
                employees={employees}
                selectedRole={selectedRole}
                isEditMode={isEditMode}
                onClose={modalClose}
                onSuccess={handleSuccess}
              />
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          0% {
            opacity: 0;
            transform: scale(0.95);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}