import logo from '../assets/images/logo.png';
import { Bell, MessageSquareText, Menu, X, User, LogOut } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { BASE_URL } from '../config/apiConfig';
import axios from '../config/axios';

function Header({ onMenuToggle, isMobileMenuOpen }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileDropdownRef = useRef(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };

    if (showProfileDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileDropdown]);

  const handleLogout = async () => {
    // Add your logout logic here
    try{
      const response = await axios.post(`${BASE_URL}/auth/logout`);
          console.log('Logging out...',response);
        window.location.href = "/login";
    }catch(error){
      console.log("error when logout", error);
    }
    // For example: localStorage.removeItem('token'); navigate('/login');
  };
  

  return (
    <header className="fixed top-0 left-0 right-0 w-full h-14 bg-white/95 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 md:px-6 z-50 shadow-sm">
      {/* Left side - Logo and Mobile Menu */}
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-all duration-200 active:scale-95"
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMobileMenuOpen ? (
            <X className="w-5 h-5 text-slate-600" />
          ) : (
            <Menu className="w-5 h-5 text-slate-600" />
          )}
        </button>
        
        {/* Logo */}
        <div className="flex items-center">
          <img 
            src={logo} 
            alt="Company Logo" 
            className="h-8 w-auto transition-transform hover:scale-105" 
          />
        </div>
      </div>

      {/* Right side - Actions and Profile */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Notifications */}
        <div className="relative group">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg hover:bg-slate-100 transition-all duration-200 active:scale-95 relative"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-slate-600 group-hover:text-slate-800" />
            {/* Notification badge */}
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-[10px] text-white font-medium">3</span>
            </span>
          </button>
          
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            Notifications (3)
          </div>
        </div>

        {/* Messages */}
        <div className="relative group">
          <button
            className="p-2 rounded-lg hover:bg-slate-100 transition-all duration-200 active:scale-95"
            aria-label="Messages"
          >
            <MessageSquareText className="w-5 h-5 text-slate-600 group-hover:text-slate-800" />
          </button>
          
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            Messages
          </div>
        </div>

        {/* Profile */}
        <div className="relative" ref={profileDropdownRef}>
          <button 
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full w-9 h-9 flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-200 active:scale-95"
            aria-label="User profile"
          >
            <span className="text-sm font-semibold">K</span>
          </button>
          
          {/* Profile Dropdown */}
          {showProfileDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* User Info */}
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center">
                    <span className="text-sm font-semibold">K</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">Kavindu</p>
                    <p className="text-xs text-slate-500 truncate">kavindu@scanwell.lk</p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-1">
                <button
                  className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-3"
                  onClick={() => {
                    setShowProfileDropdown(false);
                    // Add profile navigation logic here
                    console.log('Navigate to profile');
                  }}
                >
                  <User className="w-4 h-4 text-slate-500" />
                  <span>My Profile</span>
                </button>
                
                <button
                  className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3"
                  onClick={() => {
                    setShowProfileDropdown(false);
                    handleLogout();
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;