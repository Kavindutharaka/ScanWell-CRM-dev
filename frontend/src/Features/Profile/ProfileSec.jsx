import { useState, useEffect, useContext, useRef } from 'react';
import {
  User, Mail, Phone, Briefcase, MapPin, Users,
  FileText, Shield, Eye, EyeOff,
  Check, Building2, Camera, Upload, Trash2
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { BASE_URL } from '../../config/apiConfig';
import { toast } from '../../components/Toast';
import { confirm } from '../../components/ConfirmDialog';

function MyProfile() {
  const { user, permission } = useContext(AuthContext);

  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  // Profile data — loaded from backend
  const [profileData, setProfileData] = useState({
    sysID: null,
    fname: '',
    lname: '',
    email: '',
    tp: '',
    position: '',
    department: '',
    w_location: '',
    a_manager: '',
    note: '',
    status: '',
    username: '',
    profile_image: null
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Load user data when component mounts / context becomes available
  useEffect(() => {
    if (!permission?.EmployeeId) return;
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`${BASE_URL}/auth/get-user/${permission.EmployeeId}`, {
          credentials: 'include'
        });
        if (!res.ok) throw new Error('Failed to load profile');
        const data = await res.json();
        setProfileData({
          sysID: data.SysID || data.sysID || data.SysId,
          fname: data.fname || '',
          lname: data.lname || '',
          email: data.email || '',
          tp: data.tp || '',
          position: data.position || '',
          department: data.department || '',
          w_location: data.w_location || '',
          a_manager: data.a_manager || '',
          note: data.note || '',
          status: data.status || '',
          username: data.Username || data.username || '',
          profile_image: data.profile_image || null
        });
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, [permission?.EmployeeId]);

  const handlePasswordChange = (field, value) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePasswordUpdate = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords don't match!");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters!');
      return;
    }
    if (!user?.id) {
      toast.error('User session not found. Please log in again.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/change-password`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          UserId: user.id,
          CurrentPassword: passwordData.currentPassword,
          NewPassword: passwordData.newPassword
        })
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(result.message || 'Failed to update password');
        return;
      }
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setIsChangingPassword(false);
      toast.success('Password updated successfully!');
    } catch (err) {
      console.error('Password update error:', err);
      toast.error('Failed to update password. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageSelect = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }
    if (!profileData.sysID) {
      toast.warning('Profile not loaded yet — please try again in a moment');
      return;
    }

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('imageFile', file);
      formData.append('employeeId', String(profileData.sysID));

      const res = await fetch(`${BASE_URL}/auth/upload-profile-image`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(result.message || 'Failed to upload image');
        return;
      }
      // Update local state with new URL (cache-busted so the browser shows the new file)
      const cacheBustedUrl = `${result.imageUrl}?t=${Date.now()}`;
      setProfileData((prev) => ({ ...prev, profile_image: cacheBustedUrl }));

      // Tell the Header (and anywhere else listening) to update instantly.
      window.dispatchEvent(new CustomEvent('profile-image-updated', {
        detail: { imageUrl: cacheBustedUrl }
      }));

      toast.success('Profile image updated!');
    } catch (err) {
      console.error('Image upload error:', err);
      toast.error('Failed to upload image. Please try again.');
    } finally {
      setIsUploadingImage(false);
      // Clear the input so the same file can be re-selected if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Remove profile picture — clears emp_reg.profile_image and deletes the file.
  const handleRemoveImage = async () => {
    if (!profileData.sysID) return;
    const ok = await confirm({
      title: 'Remove profile picture?',
      message: 'Your avatar will go back to initials.',
      confirmText: 'Remove',
      variant: 'danger'
    });
    if (!ok) return;

    setIsUploadingImage(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/profile-image/${profileData.sysID}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(result.message || 'Failed to remove image');
        return;
      }
      setProfileData((prev) => ({ ...prev, profile_image: null }));
      // Broadcast removal so the Header avatar falls back to initials immediately.
      window.dispatchEvent(new CustomEvent('profile-image-updated', {
        detail: { imageUrl: null }
      }));
      toast.success('Profile picture removed.');
    } catch (err) {
      console.error('Image remove error:', err);
      toast.error('Failed to remove image. Please try again.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const getInitials = () => {
    const f = (profileData.fname || '').charAt(0);
    const l = (profileData.lname || '').charAt(0);
    return (f + l).toUpperCase() || '?';
  };

  // Build the full image URL: relative URLs need to be prefixed with the backend base
  const getImageUrl = () => {
    if (!profileData.profile_image) return null;
    const url = profileData.profile_image;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    // Strip "/api" suffix if present so we hit the static file server root
    const apiRoot = BASE_URL.replace(/\/api\/?$/, '');
    return `${apiRoot}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const imageUrl = getImageUrl();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-600">Loading profile...</div>
      </div>
    );
  }

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
              <div className="relative group">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Profile"
                    className="rounded-full w-32 h-32 object-cover shadow-lg border-4 border-white bg-white"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full w-32 h-32 flex items-center justify-center text-3xl font-bold shadow-lg border-4 border-white">
                    {getInitials()}
                  </div>
                )}

                {/* Upload overlay button */}
                <button
                  type="button"
                  onClick={handleImageSelect}
                  disabled={isUploadingImage}
                  title={profileData.profile_image ? 'Change profile photo' : 'Upload profile photo'}
                  className="absolute bottom-1 right-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-full w-9 h-9 flex items-center justify-center shadow-md border-2 border-white transition-all"
                >
                  {isUploadingImage
                    ? <Upload className="w-4 h-4 animate-pulse" />
                    : <Camera className="w-4 h-4" />}
                </button>

                {/* Remove photo button — only when an image exists */}
                {profileData.profile_image && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    disabled={isUploadingImage}
                    title="Remove profile photo"
                    className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-md border-2 border-white transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
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
                <p className="text-slate-600 mt-1">{profileData.position || '—'}</p>
              </div>
              {profileData.status && (
                <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                  String(profileData.status).toLowerCase() === 'active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  <Check className="w-4 h-4 inline mr-1" />
                  {profileData.status}
                </span>
              )}
            </div>

            {/* Personal Information Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">First Name</label>
                  <div className="px-4 py-2.5 bg-slate-50 rounded-lg text-slate-800">{profileData.fname || '—'}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Last Name</label>
                  <div className="px-4 py-2.5 bg-slate-50 rounded-lg text-slate-800">{profileData.lname || '—'}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-600" />
                    Email Address
                  </label>
                  <div className="px-4 py-2.5 bg-slate-50 rounded-lg text-slate-800">{profileData.email || '—'}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-blue-600" />
                    Phone Number
                  </label>
                  <div className="px-4 py-2.5 bg-slate-50 rounded-lg text-slate-800">{profileData.tp || '—'}</div>
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
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Position</label>
                  <div className="px-4 py-2.5 bg-slate-50 rounded-lg text-slate-800">{profileData.position || '—'}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    Department
                  </label>
                  <div className="px-4 py-2.5 bg-slate-50 rounded-lg text-slate-800">{profileData.department || '—'}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    Work Location
                  </label>
                  <div className="px-4 py-2.5 bg-slate-50 rounded-lg text-slate-800">{profileData.w_location || '—'}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    Assigned Manager
                  </label>
                  <div className="px-4 py-2.5 bg-slate-50 rounded-lg text-slate-800">{profileData.a_manager || '—'}</div>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Notes
                  </label>
                  <div className="px-4 py-2.5 bg-slate-50 rounded-lg text-slate-800 whitespace-pre-line">
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
                <label className="block text-sm font-medium text-slate-700 mb-2">Username</label>
                <div className="px-4 py-2.5 bg-slate-50 rounded-lg text-slate-800 border border-slate-200">
                  {profileData.username || '—'}
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
                      <label className="block text-sm font-medium text-slate-700 mb-2">Current Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
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
                      <label className="block text-sm font-medium text-slate-700 mb-2">New Password</label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={passwordData.newPassword}
                          onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-10"
                          placeholder="Enter new password (min. 6 characters)"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Confirm New Password</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
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
                        disabled={
                          isSaving ||
                          !passwordData.currentPassword ||
                          !passwordData.newPassword ||
                          !passwordData.confirmPassword
                        }
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSaving ? 'Updating...' : 'Update Password'}
                      </button>
                      <button
                        onClick={() => {
                          setIsChangingPassword(false);
                          setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
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
