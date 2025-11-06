import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { API_ENDPOINTS, APP_NAME } from '../config';
import busLogo from '../assets/buslogo.jpg';
import {
  FaUser,
  FaBell,
  FaTicketAlt,
  FaEnvelope,
  FaEdit,
  FaSignOutAlt,
  FaCheckCircle,
} from 'react-icons/fa';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  verified: boolean;
  createdAt: string;
}

export function UserProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
  });

  useEffect(() => {
    fetchProfile();
    fetchUnreadCount();
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.UNREAD_COUNT);
      setUnreadCount(response.data.unreadCount);
    } catch (err) {
      console.error('Failed to fetch notifications');
    }
  };

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(API_ENDPOINTS.USER_PROFILE);
      setUser(response.data.user);
      setFormData({ name: response.data.user.name });
    } catch (err: any) {
      if (err.response?.status === 401) {
        navigate('/signin');
      } else {
        setError(
          err.response?.data?.errorMessage ||
            'Failed to fetch profile. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      await api.patch('/user/profile/update', formData);
      alert('Profile updated successfully');
      fetchProfile();
      setEditMode(false);
    } catch (err: any) {
      alert(
        err.response?.data?.errorMessage ||
          'Failed to update profile. Please try again.'
      );
    }
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      // Clear cookies by making a logout request if endpoint exists
      // For now, just navigate to signin
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      navigate('/signin');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md">
          <p className="text-red-700 text-lg mb-4">{error || 'Failed to load profile'}</p>
          <button
            onClick={() => navigate('/home')}
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            ← Go back to home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header/Navbar */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img
                src={busLogo}
                alt="Logo"
                className="w-10 h-10 rounded-full object-cover"
              />
              <span className="text-2xl font-bold text-indigo-900">
                {APP_NAME}
              </span>
            </div>
            <div className="flex items-center space-x-6">
              <Link
                to="/home"
                className="text-gray-700 hover:text-indigo-600 font-medium"
              >
                Home
              </Link>
              <Link
                to="/my-bookings"
                className="text-gray-700 hover:text-indigo-600 font-medium flex items-center gap-2"
              >
                <FaTicketAlt />
                My Bookings
              </Link>
              <Link
                to="/notifications"
                className="relative text-gray-700 hover:text-indigo-600"
              >
                <FaBell className="text-xl" />
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Link>
              <Link
                to="/profile"
                className="flex items-center gap-2 text-indigo-600 font-semibold"
              >
                <FaUser />
                Profile
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Page Header */}
      <div className="bg-indigo-600 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-indigo-100 mt-2">Manage your account information</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold">Account Information</h2>
                {!editMode && (
                  <button
                    onClick={() => setEditMode(true)}
                    className="flex items-center gap-2 px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg font-medium"
                  >
                    <FaEdit />
                    Edit
                  </button>
                )}
              </div>

              {editMode ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Email cannot be changed
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleUpdateProfile}
                      className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => {
                        setEditMode(false);
                        setFormData({ name: user.name });
                      }}
                      className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Full Name</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {user.name}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-1 flex items-center gap-2">
                      <FaEnvelope className="text-indigo-600" />
                      Email Address
                    </div>
                    <div className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      {user.email}
                      {user.verified && (
                        <FaCheckCircle className="text-green-500" title="Verified" />
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-1">Account Type</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {user.role}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-1">Member Since</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="md:col-span-1 space-y-4">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold text-lg mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  to="/my-bookings"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <FaTicketAlt className="text-indigo-600" />
                  <span className="font-medium">View Bookings</span>
                </Link>
                <Link
                  to="/notifications"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <FaBell className="text-indigo-600" />
                  <span className="font-medium">Notifications</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                >
                  <FaSignOutAlt />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </div>

            {/* Account Stats */}
            <div className="bg-gradient-to-br from-indigo-600 to-blue-500 text-white rounded-lg shadow p-6">
              <h3 className="font-bold text-lg mb-4">Account Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-indigo-100">Verification</span>
                  <span className="font-semibold">
                    {user.verified ? '✓ Verified' : 'Not Verified'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
