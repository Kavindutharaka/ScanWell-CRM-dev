import React from "react";
import {
  ChevronDown,
  Plus,
  UserCheck,
  Mail,
  Phone,
  Briefcase,
  MoreHorizontal,
  Edit,
  Eye,
  UserX,
  User,
  Building,
  ToggleLeft,
  ToggleRight
} from "lucide-react";

export default function HREmployeeList({ onOpen, loading = false, delay = 0, employees = [], setSelectedEmployee }) {
  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm animate-pulse">
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 bg-slate-200 rounded"></div>
          <div className="h-6 bg-slate-200 rounded w-32"></div>
          <div className="h-8 bg-slate-200 rounded w-32"></div>
        </div>
        <div className="w-4 h-4 bg-slate-200 rounded"></div>
      </div>
      <div className="p-4 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 rounded w-48"></div>
              <div className="h-3 bg-slate-200 rounded w-32"></div>
            </div>
            <div className="h-6 bg-slate-200 rounded w-20"></div>
            <div className="h-6 bg-slate-200 rounded w-16"></div>
          </div>
        ))}
      </div>
    </div>
  );

  // Status toggle component
  const StatusToggle = ({ employee, onToggle }) => {
    const isActive = (employee.status || '').toLowerCase() === 'active';
    return (
      <button
        onClick={() => onToggle(employee.sysID)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
          isActive 
            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
            : 'bg-red-100 text-red-800 hover:bg-red-200'
        }`}
        title={`Click to ${isActive ? 'disable' : 'enable'} employee`}
      >
        {isActive ? (
          <>
            <UserCheck className="w-3 h-3" />
            <span>Active</span>
          </>
        ) : (
          <>
            <UserX className="w-3 h-3" />
            <span>Disabled</span>
          </>
        )}
      </button>
    );
  };

  // Availability toggle
  const AvailabilityToggle = ({ employee, onToggle }) => {
    const isAvailable = (employee.status || '').toLowerCase() === 'active';
    return (
      <button
        onClick={() => onToggle(employee.sysID)}
        className={`flex items-center gap-2 transition-all duration-200 ${
          isAvailable ? 'text-emerald-600' : 'text-slate-400'
        }`}
        title={`Toggle availability for task assignment`}
        disabled={(employee.status || '').toLowerCase() !== 'active'}
      >
        {isAvailable ? (
          <ToggleRight className="w-6 h-6" />
        ) : (
          <ToggleLeft className="w-6 h-6" />
        )}
      </button>
    );
  };

  // Task capacity indicator
  const TaskCapacity = ({ current, capacity }) => {
    const percentage = (current / capacity) * 100;
    const getColor = () => {
      if (percentage >= 100) return 'bg-red-500';
      if (percentage >= 75) return 'bg-amber-500';
      return 'bg-green-500';
    };

    return (
      <div className="flex items-center gap-2">
        <div className="w-16 bg-slate-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${getColor()}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          ></div>
        </div>
        <span className="text-xs text-slate-600 font-medium">
          {current}/{capacity}
        </span>
      </div>
    );
  };

  // Department badge with logistics company colors - NULL SAFE
  const DepartmentBadge = ({ department }) => {
    if (!department) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
          <Building className="w-3 h-3" />
          N/A
        </span>
      );
    }

    const getColor = () => {
      const dept = department.toLowerCase();
      switch (dept) {
        case "logistics": return "bg-blue-100 text-blue-800";
        case "operations": return "bg-purple-100 text-purple-800";
        case "transport": return "bg-green-100 text-green-800";
        case "warehouse": return "bg-amber-100 text-amber-800";
        case "customs": return "bg-red-100 text-red-800";
        case "hr": return "bg-pink-100 text-pink-800";
        case "it": return "bg-indigo-100 text-indigo-800";
        case "dispatch": return "bg-teal-100 text-teal-800";
        case "fleet-management": return "bg-orange-100 text-orange-800";
        case "customer-service": return "bg-cyan-100 text-cyan-800";
        case "quality-control": return "bg-lime-100 text-lime-800";
        case "supply-chain": return "bg-violet-100 text-violet-800";
        case "inventory": return "bg-emerald-100 text-emerald-800";
        case "procurement": return "bg-rose-100 text-rose-800";
        case "safety": return "bg-yellow-100 text-yellow-800";
        case "ocean exports": return "bg-blue-100 text-blue-800";
        case "air exports": return "bg-sky-100 text-sky-800";
        case "air imports": return "bg-cyan-100 text-cyan-800";
        case "ocean imports": return "bg-blue-100 text-blue-800";
        case "customer relations": return "bg-pink-100 text-pink-800";
        case "sales": return "bg-purple-100 text-purple-800";
        default: return "bg-slate-100 text-slate-800";
      }
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getColor()}`}>
        <Building className="w-3 h-3" />
        {department}
      </span>
    );
  };

  // Avatar component - NULL SAFE
  const Avatar = ({ name, status, isAvailable }) => {
    const getInitials = () => {
      if (!name || name.trim() === '') return '?';
      const parts = name.split(' ').filter(Boolean);
      if (parts.length === 0) return '?';
      return parts.map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    const initials = getInitials();
    const isActive = (status || '').toLowerCase() === 'active';
    const bgColor = isActive ? 'bg-emerald-600' : 'bg-slate-400';
    
    return (
      <div className={`${bgColor} text-white rounded-full w-10 h-10 flex items-center justify-center shadow-sm relative`}>
        <span className="text-sm font-semibold">{initials}</span>
        {isActive && (
          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-white rounded-full ${
            isAvailable ? 'bg-green-400' : 'bg-amber-400'
          }`}></div>
        )}
      </div>
    );
  };

  // Helper function to get full name - NULL SAFE
  const getFullName = (fname, lname) => {
    const parts = [fname, lname].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : 'Unknown';
  };

  // Toggle employee status
  const toggleEmployeeStatus = (employeeId) => {
    console.log(`Toggling status for employee ${employeeId}`);
    // This would update the employee status in your state/API
  };

  // Toggle employee availability
  const toggleEmployeeAvailability = (employeeId) => {
    console.log(`Toggling availability for employee ${employeeId}`);
    // This would update the employee availability in your state/API
  };

  // Handle edit employee
  const handleEmployeeEdit = (emp) => {
    setSelectedEmployee(emp);
    onOpen();
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div 
      className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300"
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: 'both'
      }}
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-slate-100 gap-4">
        <div className="flex items-center gap-3">
          <button className="p-1 hover:bg-slate-100 rounded transition-colors group">
            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
          </button>
          <h2 className="text-lg font-bold text-slate-800">Employee Management</h2>
          <div className="text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded">
            {employees.filter(e => (e.status || '').toLowerCase() === 'active').length} Active
          </div>
          {onOpen && (
            <button 
              onClick={() => onOpen()}
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-all duration-200 active:scale-95 shadow-sm"
              title="Add new employee"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Employee</span>
            </button>
          )}
        </div>
        
        <button className="p-1 hover:bg-slate-100 rounded transition-colors self-start sm:self-center">
          <MoreHorizontal className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Employee Table */}
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {/* Sticky Checkbox Column */}
                  <th className="px-4 py-3 text-left bg-slate-50 sticky left-0 z-20 border-r border-slate-200 shadow-sm">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 focus:ring-2"
                    />
                  </th>
                  
                  {/* Sticky Employee Name Column */}
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider bg-slate-50 sticky left-16 z-20 border-r border-slate-200 min-w-48 shadow-sm">
                    Employee
                  </th>
                  
                  {/* Scrollable Columns */}
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-48">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-36">Position</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-32">Department</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-24">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-24">Available</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-32">Task Load</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((employee) => {
                  const fullName = getFullName(employee.fname, employee.lname);
                  const employeeId = `EMP${(employee.sysID || 0).toString().padStart(3, '0')}`;
                  const isActive = (employee.status || '').toLowerCase() === 'active';
                  
                  return (
                    <tr key={employee.sysID} className="hover:bg-slate-50 transition-colors group">
                      {/* Sticky Checkbox */}
                      <td className="px-4 py-4 bg-white sticky left-0 z-10 border-r border-slate-200 shadow-sm group-hover:bg-slate-50">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 focus:ring-2"
                        />
                      </td>
                      
                      {/* Sticky Employee Name */}
                      <td className="px-4 py-4 bg-white sticky left-16 z-10 border-r border-slate-200 min-w-48 shadow-sm group-hover:bg-slate-50">
                        <div className="flex items-center gap-3">
                          <Avatar 
                            name={fullName} 
                            status={employee.status || ''} 
                            isAvailable={isActive} 
                          />
                          <div>
                            <div className="font-medium text-slate-900">{fullName}</div>
                            <div className="text-xs text-slate-500">{employeeId}</div>
                          </div>
                        </div>
                      </td>
                      
                      {/* Scrollable Content */}
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          {employee.email ? (
                            <div className="flex items-center gap-1 text-sm text-slate-600">
                              <Mail className="w-3 h-3" />
                              <span className="truncate">{employee.email}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-sm text-slate-400">
                              <Mail className="w-3 h-3" />
                              <span>N/A</span>
                            </div>
                          )}
                          {employee.tp ? (
                            <div className="flex items-center gap-1 text-sm text-slate-600">
                              <Phone className="w-3 h-3" />
                              <span>{employee.tp}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-sm text-slate-400">
                              <Phone className="w-3 h-3" />
                              <span>N/A</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {employee.position ? (
                          <div className="flex items-center gap-1 text-sm text-slate-600">
                            <Briefcase className="w-3 h-3" />
                            <span>{employee.position}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-sm text-slate-400">
                            <Briefcase className="w-3 h-3" />
                            <span>N/A</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <DepartmentBadge department={employee.department} />
                      </td>
                      <td className="px-4 py-4">
                        <StatusToggle 
                          employee={employee} 
                          onToggle={toggleEmployeeStatus}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <AvailabilityToggle 
                          employee={employee} 
                          onToggle={toggleEmployeeAvailability}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <TaskCapacity 
                          current={Math.floor(Math.random() * 5)} 
                          capacity={5}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button 
                            className="p-1 hover:bg-slate-100 rounded transition-colors"
                            title="View employee details"
                          >
                            <Eye className="w-4 h-4 text-slate-600" />
                          </button>
                          <button 
                            onClick={() => handleEmployeeEdit(employee)}
                            className="p-1 hover:bg-slate-100 rounded transition-colors"
                            title="Edit employee"
                          >
                            <Edit className="w-4 h-4 text-slate-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden divide-y divide-slate-200">
            {employees.map((employee) => {
              const fullName = getFullName(employee.fname, employee.lname);
              const employeeId = `EMP${(employee.sysID || 0).toString().padStart(3, '0')}`;
              const isActive = (employee.status || '').toLowerCase() === 'active';
              
              return (
                <div key={employee.sysID} className="p-4 space-y-4">
                  {/* Employee Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 focus:ring-2"
                      />
                      <Avatar 
                        name={fullName} 
                        status={employee.status || ''} 
                        isAvailable={isActive} 
                      />
                      <div>
                        <div className="font-medium text-slate-900">{fullName}</div>
                        <div className="text-xs text-slate-500">{employeeId}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        className="p-2 hover:bg-slate-100 rounded transition-colors"
                        title="View employee details"
                      >
                        <Eye className="w-4 h-4 text-slate-600" />
                      </button>
                      <button 
                        onClick={() => handleEmployeeEdit(employee)}
                        className="p-2 hover:bg-slate-100 rounded transition-colors"
                        title="Edit employee"
                      >
                        <Edit className="w-4 h-4 text-slate-600" />
                      </button>
                    </div>
                  </div>

                  {/* Employee Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Contact</div>
                      <div className="space-y-1">
                        {employee.email ? (
                          <div className="flex items-center gap-1 text-sm text-slate-600">
                            <Mail className="w-3 h-3" />
                            <span className="truncate">{employee.email}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-sm text-slate-400">
                            <Mail className="w-3 h-3" />
                            <span>N/A</span>
                          </div>
                        )}
                        {employee.tp ? (
                          <div className="flex items-center gap-1 text-sm text-slate-600">
                            <Phone className="w-3 h-3" />
                            <span>{employee.tp}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-sm text-slate-400">
                            <Phone className="w-3 h-3" />
                            <span>N/A</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-slate-500 mb-1">Position</div>
                      {employee.position ? (
                        <div className="flex items-center gap-1 text-sm text-slate-600">
                          <Briefcase className="w-3 h-3" />
                          <span>{employee.position}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-sm text-slate-400">
                          <Briefcase className="w-3 h-3" />
                          <span>N/A</span>
                        </div>
                      )}
                      <div className="mt-1">
                        <DepartmentBadge department={employee.department} />
                      </div>
                    </div>
                  </div>

                  {/* Status and Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="text-xs text-slate-500 mb-1">Status</div>
                        <StatusToggle 
                          employee={employee} 
                          onToggle={toggleEmployeeStatus}
                        />
                      </div>
                      
                      <div>
                        <div className="text-xs text-slate-500 mb-1">Available</div>
                        <AvailabilityToggle 
                          employee={employee} 
                          onToggle={toggleEmployeeAvailability}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-slate-500 mb-1">Task Load</div>
                      <TaskCapacity 
                        current={Math.floor(Math.random() * 5)} 
                        capacity={5}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Empty State */}
      {employees.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">No employees found</h3>
          <p className="text-slate-500 mb-4">Get started by adding your first employee to the system.</p>
          {onOpen && (
            <button 
              onClick={() => onOpen()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Employee
            </button>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes slideInLeft {
          0% {
            opacity: 0;
            transform: translateX(-20px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-slideInLeft {
          animation: slideInLeft 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}