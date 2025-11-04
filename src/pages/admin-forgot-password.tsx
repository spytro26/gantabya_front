import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import busLogo from '../assets/buslogo.jpg';
import { FaEnvelope, FaKey, FaLock, FaShieldAlt } from 'react-icons/fa';

export default function AdminForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/admin/forgot-password', { email: formData.email });
      setSuccess('OTP sent to your email!');
      setTimeout(() => {
        setStep('otp');
        setSuccess('');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.errorMessage || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await api.post('/admin/reset-password', {
        email: formData.email,
        otp: formData.otp,
        newPassword: formData.newPassword,
      });
      setSuccess('Password reset successfully!');
      setTimeout(() => {
        navigate('/admin/signin');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.errorMessage || 'Failed to reset password');
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
            Reset Password
          </h2>
          <p className="text-gray-400 text-lg">Admin Portal</p>
        </div>

        {/* Form Card */}
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

          {step === 'email' ? (
            <form onSubmit={handleSendOTP} className="space-y-6">
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

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-lg font-bold text-slate-900 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-300 mb-2">
                  Enter OTP
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaKey className="text-gray-500" />
                  </div>
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    required
                    maxLength={6}
                    value={formData.otp}
                    onChange={(e) =>
                      setFormData({ ...formData, otp: e.target.value.replace(/\D/g, '') })
                    }
                    className="appearance-none block w-full pl-10 pr-3 py-3 border border-slate-600 bg-slate-700 rounded-lg placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition text-center tracking-widest text-2xl"
                    placeholder="000000"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="text-gray-500" />
                  </div>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    required
                    value={formData.newPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, newPassword: e.target.value })
                    }
                    className="appearance-none block w-full pl-10 pr-3 py-3 border border-slate-600 bg-slate-700 rounded-lg placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition"
                    placeholder="Enter new password"
                  />
                </div>
              </div>

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
                    required
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, confirmPassword: e.target.value })
                    }
                    className="appearance-none block w-full pl-10 pr-3 py-3 border border-slate-600 bg-slate-700 rounded-lg placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-lg font-bold text-slate-900 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

          {/* Links */}
          <div className="mt-6 text-center space-y-2">
            <div className="text-sm">
              <Link
                to="/admin/signin"
                className="font-medium text-gray-400 hover:text-gray-300 transition"
              >
                ← Back to Sign In
              </Link>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            🔒 OTP will expire in 10 minutes
          </p>
        </div>
      </div>
    </div>
  );
}
