import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaBus,
  FaPlus,
  FaEdit,
  FaTrash,
  FaRoute,
  FaCalendar,
  FaChair,
  FaImage,
} from 'react-icons/fa';
import AdminLayout from '../components/AdminLayout';
import api from '../lib/api';

interface Bus {
  id: string;
  busNumber: string;
  name: string;
  type: string;
  layoutType: string;
  totalSeats: number;
  gridRows: number;
  gridColumns: number;
  seatCount: number;
  stopCount: number;
  tripCount: number;
  createdAt: string;
}

const BusManagement: React.FC = () => {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchBuses();
  }, []);

  const fetchBuses = async () => {
    try {
      const response = await api.get('/admin/buses');
      setBuses(response.data.buses);
    } catch (err: any) {
      setError(err.response?.data?.errorMessage || 'Failed to load buses');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (busId: string) => {
    if (!deleteConfirm) {
      setDeleteConfirm(busId);
      return;
    }

    try {
      await api.delete(`/admin/bus/${busId}`);
      setBuses(buses.filter((bus) => bus.id !== busId));
      setDeleteConfirm(null);
    } catch (err: any) {
      alert(err.response?.data?.errorMessage || 'Failed to delete bus');
      setDeleteConfirm(null);
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Bus Management</h1>
            <p className="text-gray-600 mt-1">Manage your fleet of buses</p>
          </div>
          <Link
            to="/admin/buses/new"
            className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition flex items-center space-x-2 shadow-lg"
          >
            <FaPlus />
            <span>Add New Bus</span>
          </Link>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Bus Cards Grid */}
        {buses.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <FaBus className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Buses Added Yet</h3>
            <p className="text-gray-500 mb-6">Get started by adding your first bus to the fleet</p>
            <Link
              to="/admin/buses/new"
              className="inline-flex items-center px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
            >
              <FaPlus className="mr-2" />
              Add Your First Bus
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {buses.map((bus) => (
              <div
                key={bus.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition overflow-hidden"
              >
                {/* Card Header */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-white bg-opacity-20 p-3 rounded-full">
                        <FaBus className="text-2xl" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">{bus.busNumber}</h3>
                        <p className="text-sm text-blue-100">{bus.name}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-semibold text-gray-800">{bus.type}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Layout:</span>
                    <span className="font-semibold text-gray-800">{bus.layoutType}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total Seats:</span>
                    <span className="font-semibold text-gray-800">{bus.totalSeats || 0}</span>
                  </div>

                  <div className="border-t pt-3 grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <FaChair className="text-purple-500" />
                      </div>
                      <p className="text-xs text-gray-600">Seats</p>
                      <p className="font-bold text-gray-800">{bus.seatCount}</p>
                    </div>
                    <div className="text-center border-x">
                      <div className="flex items-center justify-center mb-1">
                        <FaRoute className="text-green-500" />
                      </div>
                      <p className="text-xs text-gray-600">Stops</p>
                      <p className="font-bold text-gray-800">{bus.stopCount}</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <FaCalendar className="text-blue-500" />
                      </div>
                      <p className="text-xs text-gray-600">Trips</p>
                      <p className="font-bold text-gray-800">{bus.tripCount}</p>
                    </div>
                  </div>
                </div>

                {/* Card Footer - Actions */}
                <div className="bg-gray-50 px-5 py-3 flex items-center justify-between border-t">
                  <div className="flex items-center space-x-3">
                    <Link
                      to={`/admin/buses/${bus.id}/seats`}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
                    >
                      <FaChair />
                      <span>Seat Layout</span>
                    </Link>
                    <Link
                      to={`/admin/buses/${bus.id}/images`}
                      className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center space-x-1"
                    >
                      <FaImage />
                      <span>Images</span>
                    </Link>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/admin/buses/${bus.id}/edit`}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                      title="Edit Bus"
                    >
                      <FaEdit />
                    </Link>
                    <button
                      onClick={() => handleDelete(bus.id)}
                      className={`p-2 rounded transition ${
                        deleteConfirm === bus.id
                          ? 'text-white bg-red-600 hover:bg-red-700'
                          : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                      }`}
                      title={deleteConfirm === bus.id ? 'Click again to confirm' : 'Delete Bus'}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default BusManagement;
