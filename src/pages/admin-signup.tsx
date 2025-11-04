import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaUser, FaEnvelope, FaLock, FaShieldAlt } from 'react-icons/fa';
import api from '../lib/api';
import { API_ENDPOINTS } from '../config';
import buslogo from '../assets/buslogo.jpg';

const AdminSignup: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate form
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post(API_ENDPOINTS.ADMIN_SIGNUP, {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      setSuccess(response.data.message);
      // Navigate to email verification page
      setTimeout(() => {
        navigate('/admin/verify-email', { state: { email: formData.email } });
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.errorMessage || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-800 via-slate-900 to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <img 
                src={buslogo} 
                alt="Go Gantabya" 
                className="h-24 w-24 rounded-full shadow-lg border-4 border-yellow-500"
              />
              <div className="absolute -top-2 -right-2 bg-yellow-500 text-slate-900 rounded-full p-2 shadow-lg">
                <FaShieldAlt className="text-xl" />
              </div>
            </div>
          </div>
          <h2 className="text-4xl font-extrabold text-white mb-2">
            Admin Portal
          </h2>
          <p className="text-gray-400 text-lg">Create Your Admin Account</p>
        </div>

        {/* Signup Form */}
        <div className="bg-slate-800 shadow-2xl rounded-2xl p-8 border border-slate-700">
          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-500 text-red-200 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-900/50 border border-green-500 text-green-200 rounded-lg text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="text-gray-500" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-slate-600 bg-slate-700 rounded-lg placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="text-gray-500" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-slate-600 bg-slate-700 rounded-lg placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition"
                  placeholder="admin@example.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-slate-600 bg-slate-700 rounded-lg placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition"
                  placeholder="Minimum 6 characters"
                />
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-500" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-slate-600 bg-slate-700 rounded-lg placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition"
                  placeholder="Re-enter password"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-lg font-bold text-slate-900 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Admin Account'}
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 text-center space-y-2">
            <div className="text-sm">
              <span className="text-gray-400">Already have an account? </span>
              <Link
                to="/admin/signin"
                className="font-medium text-yellow-400 hover:text-yellow-300 transition"
              >
                Sign In
              </Link>
            </div>
            <div className="text-sm">
              <Link
                to="/signin"
                className="font-medium text-gray-400 hover:text-gray-300 transition"
              >
                ← Back to User Portal
              </Link>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            🔒 Admin accounts have full access to manage buses, routes, and bookings
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminSignup;
