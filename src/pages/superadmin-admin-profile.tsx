import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import {
  FaArrowLeft,
  FaUser,
  FaEnvelope,
  FaCalendarAlt,
  FaCheckCircle,
  FaBus,
  FaRoute,
  FaCalendar,
  FaUsers,
  FaShieldAlt,
} from "react-icons/fa";
import busLogo from "../assets/buslogo.jpg";

const API_BASE_URL = "http://localhost:3000";

interface Admin {
  id: string;
  name: string;
  email: string;
  role: string;
  verified: boolean;
  adminVerified: boolean;
  adminVerificationAt: string | null;
  createdAt: string;
}

interface Bus {
  id: string;
  busNumber: string;
  name: string;
  type: string;
  layoutType: string;
  totalSeats: number;
  stops: BusStop[];
  images: BusImage[];
  _count: {
    trips: number;
    stops: number;
  };
}

interface BusStop {
  id: string;
  name: string;
  city: string;
  stopIndex: number;
  lowerSeaterPrice: number;
  lowerSleeperPrice: number;
  upperSleeperPrice: number;
}

interface BusImage {
  id: string;
  imageUrl: string;
  createdAt: string;
}

interface Trip {
  id: string;
  tripDate: string;
  status: string;
  _count: {
    bookings: number;
  };
  bus: {
    busNumber: string;
    name: string;
  };
}

export default function SuperAdminAdminProfile() {
  const { adminId } = useParams<{ adminId: string }>();
  const navigate = useNavigate();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "buses" | "trips">("overview");

  useEffect(() => {
    fetchAdminProfile();
  }, [adminId]);

  const fetchAdminProfile = async () => {
    try {
      // Fetch admin details
      const adminResponse = await axios.get(
        `${API_BASE_URL}/superadmin/admin/${adminId}`,
        { withCredentials: true }
      );
      setAdmin(adminResponse.data.admin);

      // Fetch admin's buses
      const busesResponse = await axios.get(
        `${API_BASE_URL}/superadmin/admin/${adminId}/buses`,
        { withCredentials: true }
      );
      setBuses(busesResponse.data.buses);

      // Fetch admin's trips
      const tripsResponse = await axios.get(
        `${API_BASE_URL}/superadmin/admin/${adminId}/trips`,
        { withCredentials: true }
      );
      setTrips(tripsResponse.data.trips);
    } catch (err: any) {
      if (err.response?.status === 401) {
        navigate("/superadmin");
      } else {
        setError("Failed to load admin profile");
      }
    } finally {
      setLoading(false);
    }
  };

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

  if (error || !admin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || "Admin not found"}</p>
          <Link
            to="/superadmin/dashboard"
            className="text-red-400 hover:text-red-300"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const totalBookings = trips.reduce((sum, trip) => sum + trip._count.bookings, 0);
  const activeTrips = trips.filter((t) => t.status === "SCHEDULED" || t.status === "ONGOING").length;

  const formatCurrency = (value?: number | null) => {
    if (value === null || value === undefined) {
      return "—";
    }

    if (Number.isNaN(value)) {
      return "—";
    }

    return value > 0 ? `₹${value.toLocaleString("en-IN")}` : "₹0";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <nav className="bg-gray-900 border-b border-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to="/superadmin/dashboard"
                className="text-gray-400 hover:text-white transition flex items-center space-x-2"
              >
                <FaArrowLeft />
                <span>Back to Dashboard</span>
              </Link>
            </div>
            <div className="flex items-center justify-center space-x-3">
              <img src={busLogo} alt="Logo" className="h-10 w-10 rounded-full" />
              <FaShieldAlt className="text-red-500 text-2xl" />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Admin Header Card */}
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 mb-6 border border-gray-700">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start space-x-4">
              <div className="bg-red-600 p-4 rounded-full">
                <FaUser className="text-white text-3xl" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{admin.name}</h1>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-gray-300">
                    <FaEnvelope className="text-gray-500" />
                    <span>{admin.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-300">
                    <FaCalendarAlt className="text-gray-500" />
                    <span>Joined: {new Date(admin.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-start lg:items-end gap-2">
              <div className="flex items-center">
                {admin.adminVerified ? (
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-full text-sm font-semibold">
                    <FaCheckCircle />
                    <span>Verified Admin</span>
                  </span>
                ) : (
                  <span className="px-4 py-2 bg-yellow-600 text-white rounded-full text-sm font-semibold">
                    Pending Verification
                  </span>
                )}
              </div>
              {admin.adminVerificationAt && (
                <p className="text-xs text-gray-400">
                  Verified on: {new Date(admin.adminVerificationAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Buses</p>
                <p className="text-3xl font-bold text-white mt-1">{buses.length}</p>
              </div>
              <div className="bg-blue-600 p-3 rounded-full">
                <FaBus className="text-white text-2xl" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Routes</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {buses.reduce((sum, bus) => sum + bus._count.stops, 0) > 0
                    ? buses.filter((bus) => bus._count.stops > 0).length
                    : 0}
                </p>
              </div>
              <div className="bg-green-600 p-3 rounded-full">
                <FaRoute className="text-white text-2xl" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Trips</p>
                <p className="text-3xl font-bold text-white mt-1">{trips.length}</p>
              </div>
              <div className="bg-purple-600 p-3 rounded-full">
                <FaCalendar className="text-white text-2xl" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Bookings</p>
                <p className="text-3xl font-bold text-white mt-1">{totalBookings}</p>
              </div>
              <div className="bg-orange-600 p-3 rounded-full">
                <FaUsers className="text-white text-2xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700">
          <div className="border-b border-gray-700">
            <div className="flex space-x-4 px-6 overflow-x-auto pb-1">
              <button
                onClick={() => setActiveTab("overview")}
                className={`py-4 px-6 font-semibold transition flex-shrink-0 ${
                  activeTab === "overview"
                    ? "text-red-500 border-b-2 border-red-500"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("buses")}
                className={`py-4 px-6 font-semibold transition flex-shrink-0 ${
                  activeTab === "buses"
                    ? "text-red-500 border-b-2 border-red-500"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                Buses ({buses.length})
              </button>
              <button
                onClick={() => setActiveTab("trips")}
                className={`py-4 px-6 font-semibold transition flex-shrink-0 ${
                  activeTab === "trips"
                    ? "text-red-500 border-b-2 border-red-500"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                Trips ({trips.length})
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Admin Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-700 rounded-lg p-4">
                      <p className="text-gray-400 text-sm">User ID</p>
                      <p className="text-white font-mono text-sm">{admin.id}</p>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-4">
                      <p className="text-gray-400 text-sm">Role</p>
                      <p className="text-white font-semibold">{admin.role}</p>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-4">
                      <p className="text-gray-400 text-sm">Email Verified</p>
                      <p className="text-white">
                        {admin.verified ? (
                          <span className="text-green-400 flex items-center space-x-1">
                            <FaCheckCircle />
                            <span>Yes</span>
                          </span>
                        ) : (
                          <span className="text-red-400">No</span>
                        )}
                      </p>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-4">
                      <p className="text-gray-400 text-sm">Account Created</p>
                      <p className="text-white">{new Date(admin.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Activity Summary</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-gray-700 rounded-lg p-4">
                      <span className="text-gray-300">Active Trips</span>
                      <span className="text-white font-bold text-xl">{activeTrips}</span>
                    </div>
                    <div className="flex items-center justify-between bg-gray-700 rounded-lg p-4">
                      <span className="text-gray-300">Completed Trips</span>
                      <span className="text-white font-bold text-xl">
                        {trips.filter((t) => t.status === "COMPLETED").length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-gray-700 rounded-lg p-4">
                      <span className="text-gray-300">Cancelled Trips</span>
                      <span className="text-white font-bold text-xl">
                        {trips.filter((t) => t.status === "CANCELLED").length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Buses Tab */}
            {activeTab === "buses" && (
              <div>
                <h3 className="text-xl font-bold text-white mb-4">Buses Managed</h3>
                {buses.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No buses created yet</p>
                ) : (
                  <div className="space-y-4">
                    {buses.map((bus) => (
                      <div
                        key={bus.id}
                        className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition border border-gray-600"
                      >
                        <div className="flex flex-col gap-4">
                          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                            <div>
                              <h4 className="text-white font-bold text-lg">{bus.busNumber}</h4>
                              <p className="text-gray-300 text-sm">{bus.name}</p>
                                <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-gray-300">
                                <span className="bg-gray-800 px-3 py-1 rounded-full border border-gray-600">Type: {bus.type}</span>
                                <span className="bg-gray-800 px-3 py-1 rounded-full border border-gray-600">Layout: {bus.layoutType.replace(/_/g, " ")}</span>
                                <span className="bg-gray-800 px-3 py-1 rounded-full border border-gray-600">Seats: {bus.totalSeats}</span>
                                <span className="bg-gray-800 px-3 py-1 rounded-full border border-gray-600">Stops: {bus._count.stops}</span>
                                <span className="bg-gray-800 px-3 py-1 rounded-full border border-gray-600">Trips: {bus._count.trips}</span>
                              </div>
                            </div>
                          </div>

                          <div className="border-t border-gray-600 pt-4 space-y-4">
                            <div>
                              <h5 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">Route &amp; Fares</h5>
                              {bus.stops.length >= 2 ? (
                                <div className="mt-3 space-y-3">
                                  <div className="flex items-center gap-2 text-sm text-gray-200">
                                    <FaRoute className="text-gray-400" />
                                    <span>
                                      {(bus.stops[0].city || bus.stops[0].name) ?? "Origin"} → {(bus.stops[bus.stops.length - 1].city || bus.stops[bus.stops.length - 1].name) ?? "Destination"}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    {[{
                                      label: "Lower Seater",
                                      value: bus.stops[bus.stops.length - 1].lowerSeaterPrice,
                                    }, {
                                      label: "Lower Sleeper",
                                      value: bus.stops[bus.stops.length - 1].lowerSleeperPrice,
                                    }, {
                                      label: "Upper Sleeper",
                                      value: bus.stops[bus.stops.length - 1].upperSleeperPrice,
                                    }].map((fare) => (
                                      <div key={fare.label} className="bg-gray-800/60 border border-gray-600 rounded-lg px-3 py-2">
                                        <p className="text-gray-400 text-xs uppercase">{fare.label}</p>
                                        <p className="text-white font-semibold text-sm">{formatCurrency(fare.value)}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm text-gray-400 mt-2">Route information not configured yet.</p>
                              )}
                            </div>

                            {bus.stops.length > 0 && (
                              <div>
                                <h5 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">Stops</h5>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {bus.stops.map((stop) => (
                                    <span
                                      key={stop.id}
                                      className="px-3 py-1 rounded-full border border-gray-600 text-xs text-gray-200 bg-gray-800"
                                    >
                                      {stop.stopIndex + 1}. {stop.city || stop.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {bus.images.length > 0 && (
                              <div>
                                <h5 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">Gallery</h5>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                                  {bus.images.map((image) => (
                                    <div
                                      key={image.id}
                                      className="overflow-hidden rounded-lg border border-gray-600 bg-gray-800"
                                    >
                                      <img
                                        src={image.imageUrl}
                                        alt={`${bus.name} view`}
                                        className="w-full h-40 sm:h-48 object-cover transition-transform duration-200 hover:scale-105"
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Trips Tab */}
            {activeTab === "trips" && (
              <div>
                <h3 className="text-xl font-bold text-white mb-4">Trip History</h3>
                {trips.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No trips scheduled yet</p>
                ) : (
                  <div className="space-y-4">
                    {trips.slice(0, 20).map((trip) => (
                      <div
                        key={trip.id}
                        className="bg-gray-700/80 rounded-2xl p-5 border border-gray-600 hover:border-gray-500 transition"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="space-y-2">
                            <h4 className="text-white font-bold">
                              {trip.bus.busNumber} - {trip.bus.name}
                            </h4>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-300">
                              <span>Date: {new Date(trip.tripDate).toLocaleDateString()}</span>
                              <span>Bookings: {trip._count.bookings}</span>
                            </div>
                          </div>
                          <div className="sm:self-end">
                            <span
                              className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold ${
                                trip.status === "SCHEDULED"
                                  ? "bg-blue-600 text-white"
                                  : trip.status === "ONGOING"
                                  ? "bg-green-600 text-white"
                                  : trip.status === "COMPLETED"
                                  ? "bg-gray-600 text-white"
                                  : "bg-red-600 text-white"
                              }`}
                            >
                              {trip.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
