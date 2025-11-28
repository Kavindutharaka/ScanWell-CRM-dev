import { useState } from 'react';
import { 
  User, Mail, Phone, Briefcase, MapPin, Users, 
  FileText, Shield, Eye, EyeOff,
  Check, Building2
} from 'lucide-react';

function MyProfile() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Profile data
  const [profileData] = useState({
    sysID: 9,
    fname: "Tharanga",
    lname: "Liyanage",
    email: "Tharanga@gmail.com",
    tp: "0781447845",
    position: "Forklift Operator",
    department: "Supply Chain",
    w_location: "Colombo",
    a_manager: "Jane Smith",
    note: "Demo",
    status: "Active",
    username: "" // Add username
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };


  const handlePasswordUpdate = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("Passwords don't match!");
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      alert("Password must be at least 6 characters!");
      return;
    }

    setIsSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log('Password updated');
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      setIsChangingPassword(false);
      setIsSaving(false);
      alert("Password updated successfully!");
    }, 1000);
  };

  const getInitials = () => {
    return `${profileData.fname.charAt(0)}${profileData.lname.charAt(0)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">My Profile</h1>
          <p className="text-slate-600">Manage your personal information and account settings</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          {/* Profile Header with Blue Gradient */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 h-32 relative">
            <div className="absolute -bottom-16 left-8">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full w-32 h-32 flex items-center justify-center text-3xl font-bold shadow-lg border-4 border-white">
                {getInitials()}
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="pt-20 px-8 pb-8">
            {/* Name and Status */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">
                  {profileData.fname} {profileData.lname}
                </h2>
                <p className="text-slate-600 mt-1">{profileData.position}</p>
              </div>
              <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                profileData.status === 'Active' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                <Check className="w-4 h-4 inline mr-1" />
                {profileData.status}
              </span>
            </div>

            {/* Personal Information Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    First Name
                  </label>
                  <div className="px-4 py-2.5 bg-slate-50 rounded-lg text-slate-800">
                    {profileData.fname}
                  </div>
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Last Name
                  </label>
                  <div className="px-4 py-2.5 bg-slate-50 rounded-lg text-slate-800">
                    {profileData.lname}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-600" />
                    Email Address
                  </label>
                  <div className="px-4 py-2.5 bg-slate-50 rounded-lg text-slate-800">
                    {profileData.email}
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-blue-600" />
                    Phone Number
                  </label>
                  <div className="px-4 py-2.5 bg-slate-50 rounded-lg text-slate-800">
                    {profileData.tp}
                  </div>
                </div>
              </div>
            </div>

            {/* Work Information Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-600" />
                Work Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Position */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Position
                  </label>
                  <div className="px-4 py-2.5 bg-slate-50 rounded-lg text-slate-800">
                    {profileData.position}
                  </div>
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    Department
                  </label>
                  <div className="px-4 py-2.5 bg-slate-50 rounded-lg text-slate-800">
                    {profileData.department}
                  </div>
                </div>

                {/* Work Location */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    Work Location
                  </label>
                  <div className="px-4 py-2.5 bg-slate-50 rounded-lg text-slate-800">
                    {profileData.w_location}
                  </div>
                </div>

                {/* Assigned Manager */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    Assigned Manager
                  </label>
                  <div className="px-4 py-2.5 bg-slate-50 rounded-lg text-slate-800">
                    {profileData.a_manager}
                  </div>
                </div>

                {/* Notes */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Notes
                  </label>
                  <div className="px-4 py-2.5 bg-slate-50 rounded-lg text-slate-800">
                    {profileData.note || 'No notes added'}
                  </div>
                </div>
              </div>
            </div>

            {/* Account Security Section */}
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Account Security
              </h3>
              
              {/* Username (Read-only) */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Username
                </label>
                <div className="px-4 py-2.5 bg-slate-50 rounded-lg text-slate-800 border border-slate-200">
                  {profileData.username}
                </div>
              </div>

              {/* Password Change Section */}
              {!isChangingPassword ? (
                <button
                  onClick={() => setIsChangingPassword(true)}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 font-medium"
                >
                  Change Password
                </button>
              ) : (
                <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                  <div className="grid grid-cols-1 gap-4">
                    {/* Current Password */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-10"
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Enter new password (min. 6 characters)"
                      />
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={passwordData.confirmPassword}
                          onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-10"
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Password Strength Indicator */}
                    {passwordData.newPassword && (
                      <div className="text-xs text-slate-600">
                        Password strength: 
                        <span className={`ml-2 font-medium ${
                          passwordData.newPassword.length < 6 ? 'text-red-600' :
                          passwordData.newPassword.length < 10 ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {passwordData.newPassword.length < 6 ? 'Weak' :
                           passwordData.newPassword.length < 10 ? 'Medium' :
                           'Strong'}
                        </span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 mt-2">
                      <button
                        onClick={handlePasswordUpdate}
                        disabled={isSaving || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSaving ? 'Updating...' : 'Update Password'}
                      </button>
                      <button
                        onClick={() => {
                          setIsChangingPassword(false);
                          setPasswordData({
                            currentPassword: "",
                            newPassword: "",
                            confirmPassword: ""
                          });
                        }}
                        className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-all duration-200 font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyProfile;