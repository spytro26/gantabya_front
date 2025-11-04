import React, { useEffect, useState } from 'react';
import { FaCalendarAlt, FaInfoCircle, FaCalendarTimes, FaArrowRight, FaBus } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import api from '../lib/api';

interface Bus {
  id: string;
  busNumber: string;
  name: string;
}

interface Trip {
  id: string;
  tripDate: string;
  status: string;
  bookingCount: number;
  seatsBooked: number;
}

const TripManagement: React.FC = () => {
  const navigate = useNavigate();
  const [buses, setBuses] = useState<Bus[]>([]);
  const [selectedBus, setSelectedBus] = useState<string>('');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBuses();
  }, []);

  useEffect(() => {
    if (selectedBus) {
      fetchTrips();
    }
  }, [selectedBus]);

  const fetchBuses = async () => {
    try {
      const response = await api.get('/admin/buses');
      setBuses(response.data.buses);
    } catch (err: any) {
      setError('Failed to load buses');
    }
  };

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/bus/${selectedBus}/trips`);
      setTrips(response.data.trips || []);
    } catch (err: any) {
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center space-x-3">
            <FaCalendarAlt className="text-purple-600" />
            <span>Trip Management</span>
          </h1>
          <p className="text-gray-600 mt-1">View auto-generated trips and manage exceptions</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">{error}</div>
        )}

        {/* Auto-Trip Info Box */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 rounded-xl p-6">
          <div className="flex items-start space-x-4">
            <FaInfoCircle className="text-blue-600 text-3xl mt-1" />
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-800 mb-3">✨ Automatic Trip Generation</h2>
              <div className="space-y-2 text-gray-700">
                <p><strong>Good news!</strong> You no longer need to manually create trips for every date.</p>
                <p className="text-sm">🔄 <strong>How it works:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                  <li>Trips are <strong>automatically created</strong> when users search for buses</li>
                  <li>All buses run <strong>every day by default</strong></li>
                  <li>No manual trip creation needed anymore!</li>
                </ul>
                <p className="text-sm mt-3">🚫 <strong>Want to mark days when bus doesn't run?</strong></p>
                <p className="text-sm ml-4">Use the <strong>Holiday Management</strong> page to add exceptions (festivals, maintenance, etc.)</p>
                <button
                  onClick={() => navigate('/admin/holidays')}
                  className="mt-4 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center space-x-2 font-semibold"
                >
                  <FaCalendarTimes />
                  <span>Manage Holidays</span>
                  <FaArrowRight />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bus Selector */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Bus to View Existing Trips
          </label>
          <select
            value={selectedBus}
            onChange={(e) => setSelectedBus(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="">-- Choose a bus --</option>
            {buses.map((bus) => (
              <option key={bus.id} value={bus.id}>
                {bus.busNumber} - {bus.name}
              </option>
            ))}
          </select>
        </div>

        {/* Existing Trips View */}
        {selectedBus && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
              <FaBus />
              <span>Auto-Generated Trips</span>
            </h2>
            {loading ? (
              <p className="text-gray-500 text-center py-8">Loading...</p>
            ) : trips.length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <p className="text-gray-500">No trips created yet</p>
                <p className="text-sm text-gray-400">Trips will be automatically created when users search for this bus</p>
              </div>
            ) : (
              <div className="space-y-3">
                {trips.map((trip) => (
                  <div
                    key={trip.id}
                    className="flex justify-between items-center p-4 border-2 border-gray-200 rounded-lg hover:border-purple-300 transition"
                  >
                    <div>
                      <p className="font-semibold text-gray-800">
                        {new Date(trip.tripDate).toLocaleDateString('en-IN', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                      <p className="text-sm text-gray-600">
                        Status:{' '}
                        <span
                          className={`font-semibold ${
                            trip.status === 'CANCELLED' ? 'text-red-600' : 
                            trip.status === 'COMPLETED' ? 'text-gray-600' :
                            'text-green-600'
                          }`}
                        >
                          {trip.status}
                        </span>{' '}
                        {trip.bookingCount > 0 && (
                          <>| Bookings: {trip.bookingCount} | Seats Booked: {trip.seatsBooked}</>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default TripManagement;
