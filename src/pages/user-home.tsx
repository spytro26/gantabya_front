import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { API_ENDPOINTS, APP_NAME } from '../config';
import { UserNavbar } from '../components/UserNavbar';
import {
  FaBus,
  FaCalendar,
  FaMapMarkerAlt,
  FaSearch,
  FaWifi,
  FaClock,
  FaDollarSign,
  FaShieldAlt,
  FaHeadset,
  FaExchangeAlt,
} from 'react-icons/fa';

interface PublicOffer {
  id: string;
  code: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  creatorRole: 'ADMIN' | 'SUPERADMIN';
  busServiceName?: string | null;
  minBookingAmount?: number | null;
  maxDiscount?: number | null;
  usageLimit?: number | null;
  usageCount?: number;
  validFrom: string;
  validUntil: string;
}

export function UserHome() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [offers, setOffers] = useState<PublicOffer[]>([]);
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
      <UserNavbar user={user} unreadCount={unreadCount} currentPage="home" />

      {/* Hero Section with Search */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white py-4 sm:py-8 lg:py-12">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="text-center mb-4 sm:mb-8 lg:mb-12">
            <h1 className="text-xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-1 sm:mb-2 lg:mb-4">Welcome to {APP_NAME}</h1>
            <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-indigo-100">
              Your Journey, Our Priority
            </p>
          </div>

          {/* Search Box */}
          <div className="max-w-4xl mx-auto bg-white rounded-xl sm:rounded-2xl shadow-2xl p-3 sm:p-4 lg:p-6 xl:p-8">
            <form onSubmit={handleSearch} className="space-y-3 sm:space-y-4 lg:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_auto_1fr_1fr] gap-3 sm:gap-4 sm:items-end">
                <div className="relative flex flex-col gap-3 sm:contents">
                  {/* From */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      From
                    </label>
                    <div className="relative">
                      <FaMapMarkerAlt className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-base" />
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
                        className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-2.5 lg:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 text-sm sm:text-base"
                        placeholder="Enter city"
                      />
                    </div>
                  </div>

                  {/* Swap Button - Mobile */}
                  <div className="sm:hidden -my-2 flex justify-center">
                    <button
                      type="button"
                      onClick={handleSwapCities}
                      className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500 text-white shadow-xl shadow-indigo-200 ring-4 ring-white transition-transform duration-150 hover:bg-indigo-600 active:scale-95"
                      title="Swap cities"
                      aria-label="Swap start and end locations"
                    >
                      <FaExchangeAlt className="text-xl" />
                    </button>
                  </div>

                  {/* Swap Button - Tablet/Desktop */}
                  <div className="hidden sm:flex sm:pb-1 justify-center items-center lg:block">
                    <button
                      type="button"
                      onClick={handleSwapCities}
                      className="p-2 sm:p-2.5 lg:p-3 bg-indigo-100 text-indigo-600 rounded-full hover:bg-indigo-200 transition-colors"
                      title="Swap cities"
                      aria-label="Swap start and end locations"
                    >
                      <FaExchangeAlt className="text-base sm:text-lg lg:text-xl" />
                    </button>
                  </div>

                  {/* To */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      To
                    </label>
                    <div className="relative">
                      <FaMapMarkerAlt className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-base" />
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
                        className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-2.5 lg:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 text-sm sm:text-base"
                        placeholder="Enter city"
                      />
                    </div>
                  </div>
                </div>

                {/* Date */}
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Journey Date
                  </label>
                  <div className="relative">
                    <FaCalendar className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm sm:text-base" />
                    <input
                      type="date"
                      required
                      min={minDate}
                      value={searchForm.date}
                      onChange={(e) =>
                        setSearchForm({ ...searchForm, date: e.target.value })
                      }
                      className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 lg:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 text-sm sm:text-base"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-2.5 sm:py-3 lg:py-4 rounded-lg font-semibold text-sm sm:text-base lg:text-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
              >
                <FaSearch className="text-sm sm:text-base" />
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
            {offers.map((offer) => {
              const usesLeft =
                offer.usageLimit !== null && offer.usageLimit !== undefined
                  ? Math.max(offer.usageLimit - (offer.usageCount || 0), 0)
                  : null;

              return (
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
                
                {/* Show applicability */}
                <div className="mb-2">
                  {offer.creatorRole === 'SUPERADMIN' ? (
                    <p className="text-sm font-medium bg-white/20 rounded px-2 py-1 inline-block">
                      🌐 Offer available for every bus
                    </p>
                  ) : offer.creatorRole === 'ADMIN' && offer.busServiceName ? (
                    <p className="text-sm font-medium bg-white/20 rounded px-2 py-1 inline-block">
                      🚌 Offer from {offer.busServiceName}
                    </p>
                  ) : null}
                </div>

                {/* Min/Max limits */}
                <div className="space-y-1 text-sm opacity-90">
                  <p>
                    📅 Valid: {new Date(offer.validFrom).toLocaleDateString()} –{' '}
                    {new Date(offer.validUntil).toLocaleDateString()}
                  </p>
                  {offer.minBookingAmount ? (
                    <p>💰 Minimum booking: ₹{offer.minBookingAmount}</p>
                  ) : (
                    <p>💰 No minimum booking required</p>
                  )}
                  {offer.maxDiscount && (
                    <p>🎯 Maximum savings: ₹{offer.maxDiscount}</p>
                  )}
                  {usesLeft !== null && (
                    <p>⏳ Uses left: {usesLeft}</p>
                  )}
                </div>
              </div>
              );
            })}
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
