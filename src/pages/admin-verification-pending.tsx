import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import busLogo from "../assets/buslogo.jpg";

const API_BASE_URL = "http://localhost:3000";

export default function AdminVerificationPending() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkVerificationStatus();
    // Check every 5 seconds if admin has been verified
    const interval = setInterval(checkVerificationStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const checkVerificationStatus = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/admin/verification-status`,
        { withCredentials: true }
      );
      
      // If admin is verified, redirect to dashboard
      if (response.data.admin.adminVerified) {
        navigate("/admin/dashboard");
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        navigate("/admin/signin");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img 
            src={busLogo} 
            alt="Go Gantabya" 
            className="h-32 w-32 rounded-full shadow-2xl border-4 border-yellow-500"
          />
        </div>

        {/* Message */}
        <div className="bg-slate-800 rounded-2xl shadow-2xl p-12 border border-slate-700">
          <h1 className="text-3xl font-bold text-white mb-6">
            Wait for your verification to complete
          </h1>
          
          <div className="flex justify-center mb-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
          </div>
          
          <p className="text-gray-400 text-sm">
            This page will automatically refresh when you're verified
          </p>
        </div>
      </div>
    </div>
  );
}
