import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { FaEnvelope, FaKey, FaShieldAlt } from "react-icons/fa";

const API_BASE_URL = "http://localhost:3000";

export default function AdminVerifyEmail() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/admin/verifyEmail`,
        { email, otp },
        { withCredentials: true }
      );

      if (response.status === 200) {
        // Email verified, now admin needs super admin approval
        alert("Email verified successfully! Your account is now pending super admin approval.");
        navigate("/admin/signin");
      }
    } catch (err: any) {
      setError(err.response?.data?.errorMessage || "Failed to verify OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Shield Icon Badge */}
        <div className="flex justify-end mb-4">
          <div className="bg-yellow-500 p-3 rounded-full shadow-lg">
            <FaShieldAlt className="text-slate-900 text-2xl" />
          </div>
        </div>

        {/* Verification Card */}
        <div className="bg-slate-800 rounded-lg shadow-2xl p-8 border border-slate-700">
          <div className="text-center mb-8">
            <div className="bg-yellow-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <FaEnvelope className="text-slate-900 text-2xl" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Verify Your Email</h1>
            <p className="text-gray-400">
              We've sent a 6-digit OTP to
            </p>
            <p className="text-yellow-400 font-semibold">{email}</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg">
              <p className="text-red-200 text-sm text-center">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* OTP Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Enter OTP
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaKey className="text-gray-500" />
                </div>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white text-center text-2xl tracking-widest placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="000000"
                  maxLength={6}
                  required
                />
              </div>
              <p className="text-gray-500 text-xs mt-2 text-center">
                OTP expires in 10 minutes
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-900 font-semibold py-3 px-4 rounded-lg hover:from-yellow-500 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-900 mr-2"></div>
                  Verifying...
                </div>
              ) : (
                "Verify Email"
              )}
            </button>
          </form>

          {/* Resend OTP */}
          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              Didn't receive the code?{" "}
              <button className="text-yellow-400 hover:text-yellow-300 font-medium">
                Resend OTP
              </button>
            </p>
          </div>

          {/* Back to Signin */}
          <div className="mt-4 text-center">
            <button
              onClick={() => navigate("/admin/signin")}
              className="text-gray-400 hover:text-gray-300 text-sm"
            >
              Back to Sign In
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm">
            After email verification, your account will await super admin approval
          </p>
        </div>
      </div>
    </div>
  );
}
