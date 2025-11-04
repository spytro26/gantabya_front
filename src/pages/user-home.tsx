import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import { API_ENDPOINTS, APP_NAME } from '../config';
import busLogo from '../assets/buslogo.jpg';
import {
  FaBus,
  FaCalendar,
  FaMapMarkerAlt,
  FaSearch,
  FaUser,
  FaBell,
  FaTicketAlt,
  FaWifi,
  FaClock,
  FaDollarSign,
  FaShieldAlt,
  FaHeadset,
  FaExchangeAlt,
} from 'react-icons/fa';

export function UserHome() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [searchForm, setSearchForm] = useState({
    startLocation: '',
    endLocation: '',
    date: '',
  });
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchUserProfile();
    fetchOffers();
    fetchUnreadCount();
    
    // Load saved search data from localStorage
    const savedSearch = localStorage.getItem('lastSearch');
    if (savedSearch) {
      try {
        const parsed = JSON.parse(savedSearch);
        setSearchForm({
          startLocation: parsed.startLocation || '',
          endLocation: parsed.endLocation || '',
          date: parsed.date || '',
        });
      } catch (err) {
        console.error('Failed to load saved search');
      }
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.USER_PROFILE);
      setUser(response.data.user);
    } catch (err) {
      console.error('Failed to fetch profile');
    }
  };

  const fetchOffers = async () => {
    try {
      // Fetch active offers from public endpoint
      const response = await api.get('/user/offers');
      setOffers(response.data.offers.slice(0, 3)); // Show top 3 offers
    } catch (err) {
      console.error('Failed to fetch offers');
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.UNREAD_COUNT);
      setUnreadCount(response.data.unreadCount);
    } catch (err) {
      console.error('Failed to fetch notifications');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchForm.startLocation && searchForm.endLocation && searchForm.date) {
      // Save to localStorage before navigating
      localStorage.setItem('lastSearch', JSON.stringify(searchForm));
      navigate('/search', { state: searchForm });
    }
  };

  const handleSwapCities = () => {
    setSearchForm({
      ...searchForm,
      startLocation: searchForm.endLocation,
      endLocation: searchForm.startLocation,
    });
  };

  // Get today's date as min date (allow booking for today if bus hasn't departed)
  const today = new Date();
  const minDate = today.toISOString().split('T')[0];

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
                className="w-12 h-12 rounded-full object-cover"
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
                <span className="font-medium">{user?.name || 'Profile'}</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Search */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4">Welcome to {APP_NAME}</h1>
            <p className="text-xl text-indigo-100">
              Your Journey, Our Priority
            </p>
          </div>

          {/* Search Box */}
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-8">
            <form onSubmit={handleSearch} className="space-y-6">
              <div className="grid md:grid-cols-[1fr_auto_1fr_1fr] gap-4 items-end">
                {/* From */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From
                  </label>
                  <div className="relative">
                    <FaMapMarkerAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={searchForm.startLocation}
                      onChange={(e) =>
                        setSearchForm({
                          ...searchForm,
                          startLocation: e.target.value,
                        })
                      }
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                      placeholder="Enter city"
                    />
                  </div>
                </div>

                {/* Swap Button */}
                <div className="pb-1">
                  <button
                    type="button"
                    onClick={handleSwapCities}
                    className="p-3 bg-indigo-100 text-indigo-600 rounded-full hover:bg-indigo-200 transition-colors"
                    title="Swap cities"
                  >
                    <FaExchangeAlt className="text-xl" />
                  </button>
                </div>

                {/* To */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To
                  </label>
                  <div className="relative">
                    <FaMapMarkerAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={searchForm.endLocation}
                      onChange={(e) =>
                        setSearchForm({
                          ...searchForm,
                          endLocation: e.target.value,
                        })
                      }
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                      placeholder="Enter city"
                    />
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Journey Date
                  </label>
                  <div className="relative">
                    <FaCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      required
                      min={minDate}
                      value={searchForm.date}
                      onChange={(e) =>
                        setSearchForm({ ...searchForm, date: e.target.value })
                      }
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
              >
                <FaSearch />
                Search Buses
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Offers Section */}
      {offers.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Special Offers & Coupons
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-white text-orange-500 px-3 py-1 rounded-full text-sm font-bold">
                    {offer.code}
                  </div>
                  <div className="text-2xl font-bold">
                    {offer.discountType === 'PERCENTAGE'
                      ? `${offer.discountValue}% OFF`
                      : `₹${offer.discountValue} OFF`}
                  </div>
                </div>
                <p className="text-lg font-semibold mb-2">{offer.description}</p>
                {offer.minBookingAmount && (
                  <p className="text-sm opacity-90">
                    Min booking: ₹{offer.minBookingAmount}
                  </p>
                )}
                {offer.maxDiscount && (
                  <p className="text-sm opacity-90">
                    Max discount: ₹{offer.maxDiscount}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Why Choose Us Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
            Why Choose {APP_NAME}?
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
                <FaDollarSign className="text-3xl text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Best Prices</h3>
              <p className="text-gray-600">
                Get the most competitive fares with exclusive discounts and offers
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <FaShieldAlt className="text-3xl text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Safe & Secure</h3>
              <p className="text-gray-600">
                Your safety is our priority. Travel with verified operators only
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <FaClock className="text-3xl text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Easy Booking</h3>
              <p className="text-gray-600">
                Book your tickets in just a few clicks. Quick and hassle-free
              </p>
            </div>

            {/* Feature 4 */}
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                <FaWifi className="text-3xl text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Premium Amenities</h3>
              <p className="text-gray-600">
                WiFi, charging ports, AC buses, and more comfort features
              </p>
            </div>

            {/* Feature 5 */}
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <FaHeadset className="text-3xl text-red-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">24/7 Support</h3>
              <p className="text-gray-600">
                Our customer support team is always here to help you
              </p>
            </div>

            {/* Feature 6 */}
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
                <FaBus className="text-3xl text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Wide Network</h3>
              <p className="text-gray-600">
                Connecting cities across the country with reliable service
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            © 2025 {APP_NAME}. All rights reserved.
          </p>
          <p className="text-gray-500 mt-2 text-sm">Your Journey, Our Priority</p>
        </div>
      </footer>
    </div>
  );
}
