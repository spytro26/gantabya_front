import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../lib/api';
import { API_ENDPOINTS, APP_NAME } from '../config';
import busLogo from '../assets/buslogo.jpg';
import { BusImageCarousel } from '../components/BusImageCarousel';
import {
  FaMapMarkerAlt,
  FaClock,
  FaChair,
  FaWifi,
  FaBolt,
  FaSnowflake,
  FaFilter,
  FaArrowLeft,
  FaUser,
  FaBell,
  FaTicketAlt,
} from 'react-icons/fa';

interface Bus {
  tripId: string;
  busId: string;
  busNumber: string;
  busName: string;
  busType: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  availableSeats: number;
  totalSeats: number;
  amenities: {
    hasWifi: boolean;
    hasAC: boolean;
    hasCharging: boolean;
  };
  fromStop: string;
  toStop: string;
  fromStopId: string;
  toStopId: string;
  images?: Array<{
    id: string;
    imageUrl: string;
    createdAt: string;
  }>;
}

export function SearchResults() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = location.state as {
    startLocation: string;
    endLocation: string;
    date: string;
  };

  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    busType: 'ALL',
    sortBy: 'price',
  });
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!searchParams) {
      navigate('/home');
      return;
    }
    fetchBuses();
    fetchUnreadCount();
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.UNREAD_COUNT);
      setUnreadCount(response.data.unreadCount);
    } catch (err) {
      console.error('Failed to fetch notifications');
    }
  };

  const fetchBuses = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.post(API_ENDPOINTS.SEARCH_BUSES, {
        startLocation: searchParams.startLocation,
        endLocation: searchParams.endLocation,
        date: searchParams.date,
      });

      // Backend returns 'trips' array
      if (response.data.trips && response.data.trips.length > 0) {
        // Map trips to Bus format expected by frontend
        const mappedBuses = response.data.trips.map((trip: any) => {
          console.log('🚌 Trip images:', trip.images);
          return {
            tripId: trip.tripId,
            busId: trip.busId,
            busNumber: trip.busNumber,
            busName: trip.busName,
            busType: trip.busType,
            departureTime: trip.fromStop.departureTime || '',
            arrivalTime: trip.toStop.arrivalTime || '',
            duration: `${Math.floor(trip.duration / 60)}h ${trip.duration % 60}m`,
            price: trip.lowerSeaterPrice || trip.lowerSleeperPrice || trip.upperSleeperPrice || trip.fare || 0,
            availableSeats: trip.availableSeats,
            totalSeats: trip.totalSeats,
            amenities: trip.amenities || {
              hasWifi: false,
              hasAC: false,
              hasCharging: false,
            },
            fromStop: trip.fromStop.name,
            toStop: trip.toStop.name,
            fromStopId: trip.fromStop.id,
            toStopId: trip.toStop.id,
            images: trip.images || [],
          };
        });
        setBuses(mappedBuses);
      } else {
        setError('No buses found for this route and date');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.errorMessage ||
          'Failed to search buses. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const getFilteredAndSortedBuses = () => {
    let filtered = [...buses];

    // Filter by bus type
    if (filters.busType !== 'ALL') {
      filtered = filtered.filter((bus) => bus.busType === filters.busType);
    }

    // Sort
    if (filters.sortBy === 'price') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (filters.sortBy === 'departure') {
      filtered.sort((a, b) =>
        a.departureTime.localeCompare(b.departureTime)
      );
    } else if (filters.sortBy === 'duration') {
      filtered.sort((a, b) => a.duration.localeCompare(b.duration));
    } else if (filters.sortBy === 'seats') {
      filtered.sort((a, b) => b.availableSeats - a.availableSeats);
    }

    return filtered;
  };

  const handleBookNow = (bus: Bus) => {
    navigate(`/book/${bus.tripId}`, {
      state: {
        searchParams,
        fromStopId: bus.fromStopId,
        toStopId: bus.toStopId,
      },
    });
  };

  const filteredBuses = getFilteredAndSortedBuses();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header/Navbar */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <img
                src={busLogo}
                alt="Logo"
                className="w-16 h-16 rounded-full object-cover"
              />
              <span className="text-2xl font-bold text-indigo-900">
                {APP_NAME}
              </span>
            </div>

            {/* Nav Links */}
            <div className="flex items-center space-x-6">
              <Link
                to="/home"
                className="text-gray-700 hover:text-indigo-600 font-medium"
              >
                Home
              </Link>
              <Link
                to="/my-bookings"
                className="text-gray-700 hover:text-indigo-600 font-medium flex items-center gap-2"
              >
                <FaTicketAlt />
                My Bookings
              </Link>
              <Link
                to="/notifications"
                className="relative text-gray-700 hover:text-indigo-600"
              >
                <FaBell className="text-xl" />
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Link>
              <Link
                to="/profile"
                className="flex items-center gap-2 text-gray-700 hover:text-indigo-600"
              >
                <FaUser />
                <span className="font-medium">Profile</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Search Info Bar */}
      <div className="bg-indigo-600 text-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <button
              onClick={() => navigate('/home')}
              className="flex items-center gap-2 text-indigo-100 hover:text-white"
            >
              <FaArrowLeft />
              <span>Modify Search</span>
            </button>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <FaMapMarkerAlt />
                <span className="font-semibold">{searchParams?.startLocation}</span>
                <span>→</span>
                <span className="font-semibold">{searchParams?.endLocation}</span>
              </div>
              <div className="flex items-center gap-2">
                <FaClock />
                <span>
                  {(() => {
                    // ✅ FIX: Parse YYYY-MM-DD string correctly
                    const [year, month, day] = searchParams?.date.split('-').map(Number);
                    const date = new Date(year, month - 1, day);
                    return date.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    });
                  })()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-24">
              <div className="flex items-center gap-2 mb-6">
                <FaFilter className="text-indigo-600" />
                <h3 className="text-lg font-semibold">Filters</h3>
              </div>

              {/* Bus Type Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Bus Type
                </label>
                <div className="space-y-2">
                  {['ALL', 'SEATER', 'SLEEPER', 'MIXED'].map((type) => (
                    <label key={type} className="flex items-center">
                      <input
                        type="radio"
                        name="busType"
                        value={type}
                        checked={filters.busType === type}
                        onChange={(e) =>
                          setFilters({ ...filters, busType: e.target.value })
                        }
                        className="mr-2 text-indigo-600"
                      />
                      <span className="text-sm text-gray-700">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) =>
                    setFilters({ ...filters, sortBy: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="price">Price: Low to High</option>
                  <option value="departure">Departure Time</option>
                  <option value="duration">Duration</option>
                  <option value="seats">Available Seats</option>
                </select>
              </div>

              <button
                onClick={() =>
                  setFilters({ busType: 'ALL', sortBy: 'price' })
                }
                className="mt-6 w-full text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Clear All Filters
              </button>
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
                <p className="mt-4 text-gray-600">Searching buses...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
                <p className="text-red-700 text-lg">{error}</p>
                <button
                  onClick={() => navigate('/home')}
                  className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  ← Go back to search
                </button>
              </div>
            ) : filteredBuses.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
                <p className="text-gray-700 text-lg">
                  No buses match your filters
                </p>
                <button
                  onClick={() =>
                    setFilters({ busType: 'ALL', sortBy: 'price' })
                  }
                  className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <>
                <div className="mb-4 text-gray-600">
                  <span className="font-semibold">{filteredBuses.length}</span>{' '}
                  {filteredBuses.length === 1 ? 'bus' : 'buses'} found
                </div>

                <div className="space-y-4">
                  {filteredBuses.map((bus) => (
                    <div
                      key={bus.tripId}
                      className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                        {/* Bus Images - Show on left side */}
                        {bus.images && bus.images.length > 0 && (
                          <div className="lg:w-64 flex-shrink-0">
                            <BusImageCarousel images={bus.images} busName={bus.busName} />
                          </div>
                        )}

                        {/* Bus Info */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-xl font-bold text-gray-900">
                                {bus.busName}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {bus.busNumber} • {bus.busType}
                              </p>
                            </div>
                            <div className="text-right lg:hidden">
                              <div className="text-2xl font-bold text-indigo-600">
                                ₹{bus.price}
                              </div>
                              <div className="text-xs text-gray-500">per seat</div>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4 mb-3">
                            <div>
                              <div className="text-lg font-semibold text-gray-900">
                                {bus.departureTime}
                              </div>
                              <div className="text-sm text-gray-600">
                                {bus.fromStop}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm text-gray-500">
                                {bus.duration}
                              </div>
                              <div className="text-xs text-gray-400">---</div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-semibold text-gray-900">
                                {bus.arrivalTime}
                              </div>
                              <div className="text-sm text-gray-600">
                                {bus.toStop}
                              </div>
                            </div>
                          </div>

                          {/* Amenities */}
                          <div className="flex items-center gap-4 text-sm">
                            {bus.amenities.hasWifi && (
                              <span className="flex items-center gap-1 text-gray-600">
                                <FaWifi className="text-blue-500" />
                                WiFi
                              </span>
                            )}
                            {bus.amenities.hasAC && (
                              <span className="flex items-center gap-1 text-gray-600">
                                <FaSnowflake className="text-cyan-500" />
                                AC
                              </span>
                            )}
                            {bus.amenities.hasCharging && (
                              <span className="flex items-center gap-1 text-gray-600">
                                <FaBolt className="text-yellow-500" />
                                Charging
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Booking Section */}
                        <div className="flex flex-col items-end gap-3">
                          <div className="hidden lg:block text-right mb-2">
                            <div className="text-2xl font-bold text-indigo-600">
                              ₹{bus.price}
                            </div>
                            <div className="text-xs text-gray-500">per seat</div>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center gap-2 text-gray-600 mb-2">
                              <FaChair />
                              <span className="text-sm">
                                {bus.availableSeats} seats available
                              </span>
                            </div>
                            <button
                              onClick={() => handleBookNow(bus)}
                              className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                            >
                              View Seats
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
