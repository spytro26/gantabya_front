import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import superAdminApi from "../lib/superAdminApi";
import {
  FaShieldAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaSignOutAlt,
  FaUsers,
  FaUserCheck,
  FaUserClock,
  FaEye,
  FaTags,
} from "react-icons/fa";

interface Admin {
  id: string;
  name: string;
  email: string;
  verified: boolean;
  adminVerified: boolean;
  adminVerificationAt: string | null;
  createdAt: string;
}

export default function SuperAdminDashboard() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const response = await superAdminApi.get("/superadmin/admins");
      setAdmins(response.data.admins);
    } catch (err: any) {
      if (err.response?.status === 401) {
        navigate("/superadmin");
      } else {
        setError("Failed to load admins");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAdmin = async (adminId: string) => {
    setActionLoading(adminId);
    try {
      await superAdminApi.post(`/superadmin/verify-admin/${adminId}`, {});
      fetchAdmins(); // Refresh list
    } catch (err: any) {
      alert(err.response?.data?.errorMessage || "Failed to verify admin");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevokeAdmin = async (adminId: string) => {
    if (!confirm("Are you sure you want to revoke this admin's verification?")) {
      return;
    }
    setActionLoading(adminId);
    try {
      await superAdminApi.post(`/superadmin/revoke-admin/${adminId}`, {});
      fetchAdmins(); // Refresh list
    } catch (err: any) {
      alert(err.response?.data?.errorMessage || "Failed to revoke admin");
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = async () => {
    try {
      await superAdminApi.post("/superadmin/logout", {});
      localStorage.removeItem('superAdminToken');
      navigate("/superadmin");
    } catch (err) {
      console.error("Logout error:", err);
      localStorage.removeItem('superAdminToken');
    }
  };

  const pendingAdmins = admins.filter((a) => !a.adminVerified);
  const verifiedAdmins = admins.filter((a) => a.adminVerified);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-red-600 p-2 rounded-lg">
                <FaShieldAlt className="text-white text-2xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Super Admin Dashboard</h1>
                <p className="text-gray-400 text-sm">Manage admin verifications</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:w-auto">
              <Link
                to="/superadmin/offers"
                className="flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black rounded-lg font-semibold transition-colors"
              >
                <FaTags />
                <span>Manage Offers</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <FaSignOutAlt />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg">
            <p className="text-red-200 text-center">{error}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Admins</p>
                <p className="text-3xl font-bold text-white mt-1">{admins.length}</p>
              </div>
              <FaUsers className="text-gray-600 text-4xl" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Verified Admins</p>
                <p className="text-3xl font-bold text-green-400 mt-1">{verifiedAdmins.length}</p>
              </div>
              <FaUserCheck className="text-green-600 text-4xl" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Pending Verification</p>
                <p className="text-3xl font-bold text-yellow-400 mt-1">{pendingAdmins.length}</p>
              </div>
              <FaUserClock className="text-yellow-600 text-4xl" />
            </div>
          </div>
        </div>

        {/* Pending Admins Section */}
        {pendingAdmins.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <FaClock className="mr-2 text-yellow-400" />
              Pending Verification ({pendingAdmins.length})
            </h2>
            <div className="space-y-4">
              {pendingAdmins.map((admin) => (
                <div
                  key={admin.id}
                  className="bg-gray-800 rounded-lg p-6 border border-yellow-600 hover:border-yellow-500 transition-colors"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">{admin.name}</h3>
                        <span className="px-3 py-1 bg-yellow-900/50 text-yellow-400 text-xs rounded-full border border-yellow-600">
                          Pending
                        </span>
                        {admin.verified && (
                          <span className="px-3 py-1 bg-green-900/50 text-green-400 text-xs rounded-full border border-green-600">
                            Email Verified
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm mb-1">{admin.email}</p>
                      <p className="text-gray-500 text-xs">
                        Registered: {new Date(admin.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row md:items-center">
                      <Link
                        to={`/superadmin/admin/${admin.id}`}
                        className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <FaEye />
                        <span>View Profile</span>
                      </Link>
                      <button
                        onClick={() => handleVerifyAdmin(admin.id)}
                        disabled={actionLoading === admin.id}
                        className="w-full sm:w-auto px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {actionLoading === admin.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Verifying...</span>
                          </>
                        ) : (
                          <>
                            <FaCheckCircle />
                            <span>Verify Admin</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Verified Admins Section */}
        {verifiedAdmins.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <FaUserCheck className="mr-2 text-green-400" />
              Verified Admins ({verifiedAdmins.length})
            </h2>
            <div className="space-y-4">
              {verifiedAdmins.map((admin) => (
                <div
                  key={admin.id}
                  className="bg-gray-800 rounded-lg p-6 border border-green-600 hover:border-green-500 transition-colors"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">{admin.name}</h3>
                        <span className="px-3 py-1 bg-green-900/50 text-green-400 text-xs rounded-full border border-green-600 flex items-center space-x-1">
                          <FaCheckCircle />
                          <span>Verified</span>
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mb-1">{admin.email}</p>
                      <div className="flex space-x-4 text-xs text-gray-500">
                        <p>Registered: {new Date(admin.createdAt).toLocaleDateString()}</p>
                        {admin.adminVerificationAt && (
                          <p>Verified: {new Date(admin.adminVerificationAt).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row md:items-center">
                      <Link
                        to={`/superadmin/admin/${admin.id}`}
                        className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <FaEye />
                        <span>View Profile</span>
                      </Link>
                      <button
                        onClick={() => handleRevokeAdmin(admin.id)}
                        disabled={actionLoading === admin.id}
                        className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {actionLoading === admin.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Revoking...</span>
                          </>
                        ) : (
                          <>
                            <FaTimesCircle />
                            <span>Revoke</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {admins.length === 0 && (
          <div className="text-center py-16">
            <FaUsers className="text-gray-600 text-6xl mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No admins found</p>
          </div>
        )}
      </div>
    </div>
  );
}
