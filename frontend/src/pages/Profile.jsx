import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { profileAPI } from '../utils/api';
import { isAuthenticated, removeToken } from '../utils/auth';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/signin');
      return;
    }
    fetchProfile();
  }, [navigate]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await profileAPI.getProfile();
      if (response.success) {
        setUser(response.data);
        setFormData({
          name: response.data.name || '',
          phone: response.data.phone || '',
        });
      }
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/signin');
      } else {
        setError('Failed to load profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.phone.trim()) errors.phone = 'Phone is required';
    else if (!/^[6-9]\d{9}$/.test(formData.phone.trim()))
      errors.phone = 'Enter a valid 10-digit phone number';

    if (showPasswordSection) {
      if (passwordData.newPassword && !passwordData.currentPassword)
        errors.currentPassword = 'Current password is required';
      if (passwordData.currentPassword && !passwordData.newPassword)
        errors.newPassword = 'New password is required';
      if (passwordData.newPassword && passwordData.newPassword.length < 6)
        errors.newPassword = 'Password must be at least 6 characters';
      if (passwordData.newPassword !== passwordData.confirmPassword)
        errors.confirmPassword = 'Passwords do not match';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    setSuccess('');
    setError(null);

    try {
      const updateData = { name: formData.name.trim(), phone: formData.phone.trim() };
      if (showPasswordSection && passwordData.newPassword) {
        updateData.currentPassword = passwordData.currentPassword;
        updateData.newPassword = passwordData.newPassword;
      }

      const response = await profileAPI.updateProfile(updateData);
      if (response.success) {
        setUser(response.data);
        setEditMode(false);
        setShowPasswordSection(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setSuccess('Profile updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
      setTimeout(() => setError(null), 4000);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setShowPasswordSection(false);
    setFormErrors({});
    setFormData({ name: user?.name || '', phone: user?.phone || '' });
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleSignOut = () => {
    removeToken();
    navigate('/');
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brown-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brown-800"></div>
          <p className="mt-4 text-brown-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  const inputClass = (field) =>
    `w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-brown-500 transition-colors ${
      formErrors[field]
        ? 'border-red-400 bg-red-50'
        : 'border-brown-200 bg-white focus:border-brown-500'
    }`;

  return (
    <div className="min-h-screen bg-brown-50">
      <div className="max-w-3xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-10">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-brown-900 mb-6">My Profile</h1>

        {success && (
          <div className="mb-4 px-4 py-3 bg-green-100 border border-green-300 text-green-700 rounded-lg text-sm font-medium">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-md border border-brown-200 overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-brown-800 to-brown-900 px-6 py-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur rounded-full text-white text-3xl font-bold mb-3">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <h2 className="text-xl font-bold text-white">{user?.name}</h2>
            <p className="text-brown-200 text-sm">{user?.email}</p>
          </div>

          {/* Profile Details */}
          <div className="p-6">
            {!editMode ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-brown-50 rounded-lg p-4">
                    <p className="text-xs font-semibold text-brown-500 uppercase tracking-wide mb-1">Full Name</p>
                    <p className="text-brown-900 font-semibold">{user?.name}</p>
                  </div>
                  <div className="bg-brown-50 rounded-lg p-4">
                    <p className="text-xs font-semibold text-brown-500 uppercase tracking-wide mb-1">Email</p>
                    <p className="text-brown-900 font-semibold">{user?.email}</p>
                  </div>
                  <div className="bg-brown-50 rounded-lg p-4">
                    <p className="text-xs font-semibold text-brown-500 uppercase tracking-wide mb-1">Phone</p>
                    <p className="text-brown-900 font-semibold">{user?.phone || 'Not set'}</p>
                  </div>
                  <div className="bg-brown-50 rounded-lg p-4">
                    <p className="text-xs font-semibold text-brown-500 uppercase tracking-wide mb-1">Member Since</p>
                    <p className="text-brown-900 font-semibold">
                      {new Date(user?.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                <div className="pt-4 flex flex-wrap gap-3">
                  <button
                    onClick={() => setEditMode(true)}
                    className="px-5 py-2.5 bg-gradient-to-r from-brown-800 to-brown-900 text-white rounded-lg hover:from-brown-900 hover:to-brown-900 font-semibold transition-all shadow-md"
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="px-5 py-2.5 border-2 border-red-300 text-red-600 rounded-lg hover:bg-red-50 font-semibold transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-brown-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={inputClass('name')}
                    />
                    {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-brown-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full px-4 py-3 border-2 border-brown-100 bg-brown-50 rounded-lg text-brown-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-brown-400 mt-1">Email cannot be changed</p>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-brown-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={inputClass('phone')}
                      maxLength={10}
                    />
                    {formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>}
                  </div>
                </div>

                {/* Change Password Toggle */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPasswordSection(!showPasswordSection)}
                    className="text-sm font-semibold text-brown-600 hover:text-brown-800 transition-colors"
                  >
                    {showPasswordSection ? 'Cancel Password Change' : 'Change Password'}
                  </button>
                </div>

                {showPasswordSection && (
                  <div className="border-t border-brown-200 pt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-brown-700 mb-1">Current Password</label>
                      <input
                        type="password"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        className={inputClass('currentPassword')}
                        placeholder="Enter current password"
                      />
                      {formErrors.currentPassword && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.currentPassword}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-brown-700 mb-1">New Password</label>
                      <input
                        type="password"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        className={inputClass('newPassword')}
                        placeholder="Enter new password"
                      />
                      {formErrors.newPassword && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.newPassword}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-brown-700 mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        className={inputClass('confirmPassword')}
                        placeholder="Confirm new password"
                      />
                      {formErrors.confirmPassword && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.confirmPassword}</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="pt-4 flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-5 py-2.5 bg-gradient-to-r from-brown-800 to-brown-900 text-white rounded-lg hover:from-brown-900 hover:to-brown-900 font-semibold transition-all shadow-md disabled:opacity-60"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-5 py-2.5 border-2 border-brown-300 text-brown-700 rounded-lg hover:bg-brown-50 font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to="/orders"
            className="bg-white rounded-lg shadow-md border border-brown-200 p-5 hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brown-100 rounded-lg flex items-center justify-center group-hover:bg-brown-200 transition-colors">
                <svg className="w-5 h-5 text-brown-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-brown-900">My Orders</p>
                <p className="text-xs text-brown-500">Track your orders</p>
              </div>
            </div>
          </Link>

          <Link
            to="/wishlist"
            className="bg-white rounded-lg shadow-md border border-brown-200 p-5 hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brown-100 rounded-lg flex items-center justify-center group-hover:bg-brown-200 transition-colors">
                <svg className="w-5 h-5 text-brown-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-brown-900">Wishlist</p>
                <p className="text-xs text-brown-500">Your saved items</p>
              </div>
            </div>
          </Link>

          <Link
            to="/cart"
            className="bg-white rounded-lg shadow-md border border-brown-200 p-5 hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brown-100 rounded-lg flex items-center justify-center group-hover:bg-brown-200 transition-colors">
                <svg className="w-5 h-5 text-brown-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-brown-900">Cart</p>
                <p className="text-xs text-brown-500">Your shopping cart</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Profile;
