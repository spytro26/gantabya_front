import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../lib/api';
import { API_ENDPOINTS } from '../config';
import { UserNavbar } from '../components/UserNavbar';
import { BusImageCarousel } from '../components/BusImageCarousel';
import { formatDualCurrency } from '../utils/currency';
import { getDualDate } from '../utils/nepaliDateConverter';
import {
  FaMapMarkerAlt,
  FaClock,
  FaChair,
  FaWifi,
  FaBolt,
  FaSnowflake,
  FaFilter,
  FaArrowLeft,
  FaTimes,
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
  const [showMobileFilters, setShowMobileFilters] = useState(false);
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

  const renderFilters = (variant: 'desktop' | 'mobile') => (
    <div
      className={`bg-white rounded-lg shadow ${
        variant === 'mobile'
          ? 'p-5 max-h-[80vh] overflow-y-auto'
          : 'p-6 sticky top-24'
      }`}
    >
      <div
        className={`flex items-center justify-between ${
          variant === 'mobile' ? 'mb-5' : 'mb-6'
        }`}
      >
        <div className="flex items-center gap-2">
          <FaFilter className="text-indigo-600" />
          <h3 className="text-lg font-semibold">Filters & Sort</h3>
        </div>
        {variant === 'mobile' && (
          <button
            type="button"
            onClick={() => setShowMobileFilters(false)}
            className="p-2 text-gray-500 hover:text-gray-700"
            aria-label="Close filters"
          >
            <FaTimes />
          </button>
        )}
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
          onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        >
          <option value="price">Price: Low to High</option>
          <option value="departure">Departure Time</option>
          <option value="duration">Duration</option>
          <option value="seats">Available Seats</option>
        </select>
      </div>

      <button
        type="button"
        onClick={() => {
          setFilters({ busType: 'ALL', sortBy: 'price' });
          if (variant === 'mobile') {
            setShowMobileFilters(false);
          }
        }}
        className="mt-6 w-full text-sm text-indigo-600 hover:text-indigo-700 font-medium"
      >
        Clear All Filters
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header/Navbar */}
      <UserNavbar unreadCount={unreadCount} currentPage="search" />

      {/* Search Info Bar */}
      <div className="bg-indigo-600 text-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <button
              onClick={() => navigate('/home')}
              className="inline-flex items-center gap-2 text-sm font-medium text-indigo-100 hover:text-white"
            >
              <FaArrowLeft className="text-xs" />
              <span>Modify Search</span>
            </button>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <FaMapMarkerAlt />
                <span className="font-semibold">{searchParams?.startLocation}</span>
                <span>→</span>
                <span className="font-semibold">{searchParams?.endLocation}</span>
              </div>
              <div className="flex items-center gap-2">
                <FaClock />
                <span>
                  {getDualDate(searchParams?.date || '')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="hidden lg:block lg:col-span-1">
            {renderFilters('desktop')}
          </div>

          {/* Results Section */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-4 lg:hidden">
              <button
                type="button"
                onClick={() => setShowMobileFilters(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm text-sm font-medium text-gray-700"
              >
                <FaFilter className="text-indigo-600" />
                Filters & Sort
              </button>
              <div className="text-xs text-gray-500">
                {filteredBuses.length}{' '}
                {filteredBuses.length === 1 ? 'option' : 'options'}
              </div>
            </div>

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
                      className="bg-white rounded-2xl border-2 border-indigo-100 sm:border sm:border-indigo-50 sm:ring-1 sm:ring-indigo-50/80 shadow-[0_8px_24px_rgba(79,70,229,0.08)] hover:shadow-[0_12px_32px_rgba(79,70,229,0.12)] transition-all overflow-hidden"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-stretch">
                        {/* Bus Images - Show on left side */}
                        {bus.images && bus.images.length > 0 && (
                          <div className="w-full lg:w-72 flex-shrink-0 overflow-hidden lg:border-r lg:border-indigo-50">
                            <BusImageCarousel images={bus.images} busName={bus.busName} />
                          </div>
                        )}

                        {/* Bus Info */}
                        <div className="flex-1 flex flex-col">
                          <div className="p-4 sm:p-6 space-y-4 flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                              <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-xs font-semibold text-indigo-600 uppercase tracking-wide">
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-indigo-50/80 border border-indigo-100 text-indigo-600">
                                    {bus.busType}
                                  </span>
                                  <span className="text-gray-400 normal-case font-medium">
                                    {bus.busNumber}
                                  </span>
                                </div>
                                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                                  {bus.busName}
                                </h3>
                              </div>
                              <div className="hidden lg:flex flex-col items-end gap-2">
                                <div className="text-xl font-bold text-indigo-600">
                                  {formatDualCurrency(bus.price)}
                                </div>
                                <div className="text-xs text-gray-500">per seat</div>
                                <button
                                  onClick={() => handleBookNow(bus)}
                                  className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
                                >
                                  View Seats
                                </button>
                              </div>
                            </div>

                            <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-4 sm:p-5 relative">
                              <div className="absolute top-5 bottom-5 left-5 hidden sm:block border-l border-dashed border-indigo-200"></div>
                              <div className="flex flex-col sm:grid sm:grid-cols-3 sm:items-center gap-4 sm:gap-6">
                                <div className="flex items-center gap-3">
                                  <div className="h-3 w-3 rounded-full bg-indigo-500"></div>
                                  <div>
                                    <div className="text-base font-semibold text-gray-900">
                                      {bus.departureTime}
                                    </div>
                                    <div className="text-xs text-gray-500 uppercase tracking-wide">
                                      {bus.fromStop}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex flex-col items-start sm:items-center justify-center text-xs text-gray-500 sm:text-sm">
                                  <span className="font-semibold text-gray-700">
                                    {bus.duration}
                                  </span>
                                  <span className="sm:w-16 sm:h-px sm:bg-indigo-200 sm:my-2 hidden sm:block"></span>
                                  <span className="uppercase tracking-wide text-[10px] sm:text-xs">
                                    journey time
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 sm:justify-end">
                                  <div className="h-3 w-3 rounded-full bg-rose-500"></div>
                                  <div className="text-right">
                                    <div className="text-base font-semibold text-gray-900">
                                      {bus.arrivalTime}
                                    </div>
                                    <div className="text-xs text-gray-500 uppercase tracking-wide">
                                      {bus.toStop}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                              {bus.amenities.hasWifi && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-gray-200 text-gray-600 shadow-sm">
                                  <FaWifi className="text-blue-500" />
                                  WiFi
                                </span>
                              )}
                              {bus.amenities.hasAC && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-gray-200 text-gray-600 shadow-sm">
                                  <FaSnowflake className="text-cyan-500" />
                                  AC
                                </span>
                              )}
                              {bus.amenities.hasCharging && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-gray-200 text-gray-600 shadow-sm">
                                  <FaBolt className="text-yellow-500" />
                                  Charging
                                </span>
                              )}
                              {!bus.amenities.hasWifi &&
                                !bus.amenities.hasAC &&
                                !bus.amenities.hasCharging && (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white border border-gray-200 text-gray-600 shadow-sm">
                                    Basic amenities
                                  </span>
                                )}
                            </div>
                          </div>

                          <div className="border-t border-gray-100 bg-gray-50/70 px-4 sm:px-6 py-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <FaChair className="text-indigo-500" />
                                <span>{bus.availableSeats} seats available</span>
                              </div>
                              <div className="flex items-center gap-3 sm:w-auto w-full justify-between sm:justify-end">
                                <div className="text-left lg:hidden">
                                  <div className="text-base font-bold text-indigo-600">{formatDualCurrency(bus.price)}</div>
                                  <div className="text-xs text-gray-500">per seat</div>
                                </div>
                                <button
                                  onClick={() => handleBookNow(bus)}
                                  className="w-full sm:w-auto lg:hidden px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
                                >
                                  View Seats
                                </button>
                              </div>
                            </div>
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

      {/* Mobile Filters Drawer */}
      {showMobileFilters && (
        <div className="lg:hidden fixed inset-0 z-40">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowMobileFilters(false)}
            aria-label="Close filters"
          />
          <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl p-6 shadow-2xl">
            {renderFilters('mobile')}
          </div>
        </div>
      )}
    </div>
  );
}
