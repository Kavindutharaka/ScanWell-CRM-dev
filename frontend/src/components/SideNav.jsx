import { useEffect, useRef } from "react";

import { NavLink } from 'react-router-dom';
import {
  Mail,
  UsersRound,
  CircleDollarSign,
  CirclePlus,
  CreditCard,
  BarChart3,
  FileText,
  TrendingUp,
  Receipt,
  Users,
  UserPlus,
  UserCog,
  Building2,
  Briefcase,
  UserCheck,
  Settings,
  Info,
  ChartLine
} from "lucide-react";

export default function SideNav({ isOpen, onClose, scrollBottom = false }) {
  const sidebarRef = useRef(null);

  const scrollDown =()=>{
      if (sidebarRef.current) {
      sidebarRef.current.scrollTop = sidebarRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if(scrollBottom){
    scrollDown();
    }
  }, []);

  const navigationItems = [
    {
      path: "/dashboard",
      icon: TrendingUp,
      label: "Dashboard"
    },
    {
      path: "/rates", 
      icon: ChartLine,
      label: "Rates Manage"
    },
    {
      path: "/usefull-link", 
      icon: Info,
      label: "Usefull Links"
    },
    {
      path: "/leads",
      icon: CirclePlus,
      label: "Social Leads"
    },
    {
      path: "/mail-tracking",
      icon: Mail,
      label: "Email Leads"
    }  
  ];

  const workspaceItems = [
    {
      path: "/sales-plans",
      icon: FileText,
      label: "Sales Plans"
    },
    {
      path: "/quotes-invoices", 
      icon: Receipt,
      label: "Quotes"
    },
    {
      path: "/rfq",
      icon: CircleDollarSign,
      label: "RFQ"
    },
    {
      path: "/contacts",
      icon: UsersRound,
      label: "Contacts"
    },
    {
      path: "/accounts",
      icon: CreditCard,
      label: "Accounts"
    }
  ];

  // HR System Management - For managing departments, positions, etc.
  const hrSystemItems = [
    {
      path: "/hr/manage",
      icon: Building2,
      label: "Resources"
    },
    {
      path: "/hr/manage-employee",
      icon: Briefcase,
      label: "Employee"
    }
  ];

  const NavButton = ({ path, icon: Icon, label }) => (
    <NavLink
      to={path}
      onClick={() => {
        // Close mobile menu when navigation item is clicked
        if (window.innerWidth < 1024) {
          onClose?.();
        }
      }}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
          isActive 
            ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600 shadow-sm' 
            : 'hover:bg-slate-50 text-slate-700 hover:text-slate-900'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={`w-5 h-5 transition-colors ${
            isActive ? 'text-blue-600' : 'text-slate-500 group-hover:text-slate-700'
          }`} />
          <span className="font-medium truncate">{label}</span>
        </>
      )}
    </NavLink>
  );

  return (
    <>
      {/* Mobile overlay - positioned below fixed header */}
      {isOpen && (
        <div 
          className="fixed inset-0 top-14 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar - positioned properly for fixed header */}
      <aside className={`
        fixed lg:relative 
        top-14 lg:top-0 left-0 
        z-50 lg:z-auto
        w-72 lg:w-64 
        h-[calc(100vh-3.5rem)] lg:min-h-full
        bg-white 
        shadow-xl lg:shadow-md 
        border-r border-slate-200
        transform transition-transform duration-300 ease-in-out lg:transform-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
        overflow-y-auto
      `}>
        {/* Navigation header (mobile only) */}
        <div className="lg:hidden px-4 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Navigation</h2>
        </div>

        {/* Navigation content */}
        <div
        ref={sidebarRef}
        className="flex-1 p-4 overflow-y-auto">
          {/* Main navigation */}
          <nav className="space-y-1 mb-6">
             <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
                Info
              </h3>
            </div>
              <div className="h-px bg-slate-200"></div>
            {navigationItems.map((item) => (
              <NavButton
                key={item.path}
                path={item.path}
                icon={item.icon}
                label={item.label}
              />
            ))}
          </nav>

          {/* Workspaces section */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
                Workspaces
              </h3>
            </div>
            
            <div className="h-px bg-slate-200"></div>
            
            <nav className="space-y-1">
              {workspaceItems.map((item) => (
                <NavButton
                  key={item.path}
                  path={item.path}
                  icon={item.icon}
                  label={item.label}
                />
              ))}
            </nav>
          </div>

          {/* HR Employee Directory section */}
          {/* <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">
                Employee Directory
              </h3>
            </div>
            
            <div className="h-px bg-emerald-200"></div>
            
            <nav className="space-y-1">
              {hrEmployeeItems.map((item) => (
                <NavButton
                  key={item.path}
                  path={item.path}
                  icon={item.icon}
                  label={item.label}
                />
              ))}
            </nav>
          </div> */}

          {/* HR System Management section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-orange-600 uppercase tracking-wider">
                System Management
              </h3>
            </div>
            
            <div className="h-px bg-orange-200"></div>
            
            <nav className="space-y-1">
              {hrSystemItems.map((item) => (
                <NavButton
                  key={item.path}
                  path={item.path}
                  icon={item.icon}
                  label={item.label}
                />
              ))}
            </nav>
          </div>
        </div>

        {/* Footer (optional upgrade prompt or user info) */}
        {/* <div className="p-4 border-t border-slate-200">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3">
            <p className="text-xs text-slate-600 mb-1">Developed By</p>
            <span className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">
              PHV Tech
            </span>
          </div>
        </div> */}
      </aside>
    </>
  );
}