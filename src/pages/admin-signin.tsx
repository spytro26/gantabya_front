import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import { API_ENDPOINTS } from '../config';
import busLogo from '../assets/buslogo.jpg';
import { FaEnvelope, FaLock, FaShieldAlt } from 'react-icons/fa';

export function AdminSignin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post(API_ENDPOINTS.ADMIN_SIGNIN, formData);
      if (response.data?.token) {
        try { localStorage.setItem("auth_token", response.data.token); } catch {}
      }
      
      // Check if admin is verified
      if (response.data.admin && !response.data.admin.adminVerified) {
        // Admin is not verified by super admin yet
        navigate('/admin/verification-pending');
      } else {
        // Admin is verified, go to dashboard
        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      // Handle specific error cases
      if (err.response?.data?.needsEmailVerification) {
        setError('Please verify your email first');
        setTimeout(() => {
          navigate('/admin/verify-email', { state: { email: formData.email } });
        }, 2000);
      } else {
        setError(err.response?.data?.errorMessage || 'Admin signin failed');
      }
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
                src={busLogo} 
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
          <p className="text-gray-400 text-lg">Sign in to your account</p>
        </div>

        {/* Signin Form */}
        <div className="bg-slate-800 shadow-2xl rounded-2xl p-8 border border-slate-700">
          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-500 text-red-200 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSignin} className="space-y-6">
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
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
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
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-slate-600 bg-slate-700 rounded-lg placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-lg font-bold text-slate-900 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing In...' : 'Sign In to Admin Panel'}
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 text-center space-y-2">
            <div className="text-sm">
              <Link
                to="/admin/forgot-password"
                className="font-medium text-yellow-400 hover:text-yellow-300 transition"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="text-sm">
              <span className="text-gray-400">Don't have an account? </span>
              <Link
                to="/admin/signup"
                className="font-medium text-yellow-400 hover:text-yellow-300 transition"
              >
                Sign Up
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
            🔒 Admin portal for authorized personnel only
          </p>
        </div>
      </div>
    </div>
  );
}
