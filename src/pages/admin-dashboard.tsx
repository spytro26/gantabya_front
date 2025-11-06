import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaBus,
  FaRoute,
  FaTicketAlt,
  FaRupeeSign,
  FaArrowRight,
  FaCalendarPlus,
  FaTags,
  FaChartLine,
} from 'react-icons/fa';
import AdminLayout from '../components/AdminLayout';
import api from '../lib/api';
import { API_ENDPOINTS } from '../config';

interface DashboardData {
  serviceProfile: {
    adminName: string;
    busServiceName: string;
  };
  overview: {
    totalBuses: number;
    totalTrips: number;
    upcomingTrips: number;
    totalBookings: number;
    confirmedBookings: number;
    totalRevenue: number;
  };
  busStatistics: Array<{
    busId: string;
    busNumber: string;
    busName: string;
    totalTrips: number;
    totalBookings: number;
    totalRevenue: number;
  }>;
  recentBookings: Array<{
    bookingGroupId: string;
    passengerName: string;
    passengerEmail: string;
    bus: string;
    route: string;
    tripDate: string;
    amount: number;
    status: string;
    bookedAt: string;
  }>;
}

const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [serviceName, setServiceName] = useState('Ankush Travels');
  const [serviceNameDraft, setServiceNameDraft] = useState('Ankush Travels');
  const [serviceNameSaving, setServiceNameSaving] = useState(false);
  const [serviceNameMessage, setServiceNameMessage] = useState('');
  const [serviceNameError, setServiceNameError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
  const response = await api.get(API_ENDPOINTS.ADMIN_DASHBOARD);
      setData(response.data);
      const service = response.data?.serviceProfile?.busServiceName || 'Ankush Travels';
      setServiceName(service);
      setServiceNameDraft(service);
    } catch (err: any) {
      setError(err.response?.data?.errorMessage || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleServiceNameSave = async () => {
    setServiceNameError('');
    setServiceNameMessage('');

    const trimmed = serviceNameDraft.trim();
    if (trimmed.length < 3) {
      setServiceNameError('Service name must be at least 3 characters long');
      return;
    }

    setServiceNameSaving(true);

    try {
  const response = await api.put(API_ENDPOINTS.ADMIN_SERVICE_NAME, {
        serviceName: trimmed,
      });
      const updatedName = response.data?.serviceName || trimmed;
      setServiceName(updatedName);
      setServiceNameDraft(updatedName);
      setServiceNameMessage('Service name updated successfully');
      setData((prev) =>
        prev
          ? {
              ...prev,
              serviceProfile: {
                ...prev.serviceProfile,
                busServiceName: updatedName,
              },
            }
          : prev
      );
      window.dispatchEvent(
        new CustomEvent('service-name-updated', {
          detail: updatedName,
        })
      );
    } catch (err: any) {
      setServiceNameError(err.response?.data?.errorMessage || 'Failed to update service name');
    } finally {
      setServiceNameSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !data) {
    return (
      <AdminLayout>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error || 'Failed to load data'}
        </div>
      </AdminLayout>
    );
  }

  const { overview, busStatistics, recentBookings, serviceProfile } = data;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-gray-600 mt-1">Overview of your bus operations</p>
          </div>
          <div className="flex space-x-3">
            <Link
              to="/admin/buses/new"
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition flex items-center space-x-2"
            >
              <FaBus />
              <span>Add Bus</span>
            </Link>
            <Link
              to="/admin/trips/new"
              className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition flex items-center space-x-2"
            >
              <FaCalendarPlus />
              <span>Add Trip</span>
            </Link>
          </div>
        </div>

        {/* Service Branding */}
        <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Bus Service Branding</h2>
              <p className="text-gray-600 mt-1">
                This name appears across the booking experience for your passengers.
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Admin: {serviceProfile.adminName || '—'}
              </p>
            </div>
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full md:w-auto">
              <input
                type="text"
                value={serviceNameDraft}
                onChange={(e) => setServiceNameDraft(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="e.g., Ankush Travels"
              />
              <button
                onClick={handleServiceNameSave}
                disabled={serviceNameSaving}
                className="px-5 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {serviceNameSaving ? 'Saving...' : 'Update Name'}
              </button>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-gray-500">
              Current display name: <span className="font-semibold text-gray-800">{serviceName}</span>
            </p>
            <div className="space-y-2 sm:space-y-0 sm:space-x-3">
              {serviceNameError && (
                <span className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded-lg inline-block">
                  {serviceNameError}
                </span>
              )}
              {serviceNameMessage && (
                <span className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-lg inline-block">
                  {serviceNameMessage}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Buses */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Buses</p>
                <p className="text-3xl font-bold mt-2">{overview.totalBuses}</p>
              </div>
              <div className="bg-blue-400 bg-opacity-30 p-4 rounded-full">
                <FaBus className="text-3xl" />
              </div>
            </div>
            <Link
              to="/admin/buses"
              className="mt-4 inline-flex items-center text-sm text-blue-100 hover:text-white transition"
            >
              View all <FaArrowRight className="ml-2" />
            </Link>
          </div>

          {/* Upcoming Trips */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Upcoming Trips</p>
                <p className="text-3xl font-bold mt-2">{overview.upcomingTrips}</p>
                <p className="text-xs text-green-100 mt-1">of {overview.totalTrips} total</p>
              </div>
              <div className="bg-green-400 bg-opacity-30 p-4 rounded-full">
                <FaRoute className="text-3xl" />
              </div>
            </div>
            <Link
              to="/admin/trips"
              className="mt-4 inline-flex items-center text-sm text-green-100 hover:text-white transition"
            >
              View all <FaArrowRight className="ml-2" />
            </Link>
          </div>

          {/* Confirmed Bookings */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Confirmed Bookings</p>
                <p className="text-3xl font-bold mt-2">{overview.confirmedBookings}</p>
                <p className="text-xs text-purple-100 mt-1">of {overview.totalBookings} total</p>
              </div>
              <div className="bg-purple-400 bg-opacity-30 p-4 rounded-full">
                <FaTicketAlt className="text-3xl" />
              </div>
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm font-medium">Total Revenue</p>
                <p className="text-3xl font-bold mt-2 flex items-center">
                  <FaRupeeSign className="text-2xl" />
                  {overview.totalRevenue.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="bg-yellow-400 bg-opacity-30 p-4 rounded-full">
                <FaChartLine className="text-3xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/admin/buses/new"
              className="flex items-center space-x-3 p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition"
            >
              <FaBus className="text-2xl text-blue-600" />
              <div>
                <p className="font-semibold text-gray-800">Add New Bus</p>
                <p className="text-sm text-gray-600">Register a new bus</p>
              </div>
            </Link>

            <Link
              to="/admin/routes"
              className="flex items-center space-x-3 p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 hover:border-green-400 transition"
            >
              <FaRoute className="text-2xl text-green-600" />
              <div>
                <p className="font-semibold text-gray-800">Manage Routes</p>
                <p className="text-sm text-gray-600">Add stops & pricing</p>
              </div>
            </Link>

            <Link
              to="/admin/trips/new"
              className="flex items-center space-x-3 p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 hover:border-purple-400 transition"
            >
              <FaCalendarPlus className="text-2xl text-purple-600" />
              <div>
                <p className="font-semibold text-gray-800">Schedule Trip</p>
                <p className="text-sm text-gray-600">Create new trip</p>
              </div>
            </Link>

            <Link
              to="/admin/offers"
              className="flex items-center space-x-3 p-4 border-2 border-yellow-200 rounded-lg hover:bg-yellow-50 hover:border-yellow-400 transition"
            >
              <FaTags className="text-2xl text-yellow-600" />
              <div>
                <p className="font-semibold text-gray-800">Create Offer</p>
                <p className="text-sm text-gray-600">Add new coupon</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Bus-wise Statistics */}
        {busStatistics.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Bus Performance</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bus</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trips</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bookings</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {busStatistics.map((bus) => (
                    <tr key={bus.busId} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-semibold text-gray-800">{bus.busNumber}</p>
                          <p className="text-sm text-gray-600">{bus.busName}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{bus.totalTrips}</td>
                      <td className="px-4 py-3 text-gray-700">{bus.totalBookings}</td>
                      <td className="px-4 py-3 text-gray-700 font-semibold">
                        ₹{bus.totalRevenue.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recent Bookings */}
        {recentBookings.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Bookings</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Passenger</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bus</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentBookings.map((booking) => (
                    <tr key={booking.bookingGroupId} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-semibold text-gray-800">{booking.passengerName}</p>
                          <p className="text-xs text-gray-600">{booking.passengerEmail}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{booking.bus}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{booking.route}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {new Date(booking.tripDate).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-gray-700 font-semibold">
                        ₹{booking.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            booking.status === 'CONFIRMED'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {booking.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {busStatistics.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <FaBus className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Buses Yet</h3>
            <p className="text-gray-500 mb-6">Get started by adding your first bus</p>
            <Link
              to="/admin/buses/new"
              className="inline-flex items-center px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
            >
              <FaBus className="mr-2" />
              Add Your First Bus
            </Link>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
