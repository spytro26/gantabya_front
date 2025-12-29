import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
// API_BASE_URL
import { API_ENDPOINTS } from '../config';
import { UserNavbar } from '../components/UserNavbar';
import { getDualDateDisplay } from '../utils/nepaliDateConverter';
import {
  FaMapMarkerAlt,
  FaRupeeSign,
  FaCalendar,
  FaTicketAlt,
  FaDownload,
} from 'react-icons/fa';

interface Booking {
  bookingGroupId: string;
  status: string;
  totalPrice: number;
  discountAmount: number;
  finalPrice: number;
  coupon: {
    code: string;
    description: string;
  } | null;
  bookedAt: string;
  trip: {
    tripId: string;
    tripDate: string;
    tripStatus: string;
  };
  bus: {
    busNumber: string;
    name: string;
    type: string;
  };
  route: {
    from: {
      name: string;
      city: string;
      departureTime: string | null;
    };
    to: {
      name: string;
      city: string;
      arrivalTime: string | null;
    };
  };
  boardingPoint: {
    name: string;
    landmark: string | null;
    time: string;
  } | null;
  droppingPoint: {
    name: string;
    landmark: string | null;
    time: string;
  } | null;
  seats: Array<{
    seatNumber: string;
    type: string;
    level: string;
  }>;
  payment: {
    method: string;
    amount: number;
    currency: string;
  } | null;
}

export function MyBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    setPage(1);
    setBookings([]);
    setHasMore(true);
    fetchBookings(1, true);
    fetchUnreadCount();
  }, [filter]);

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.UNREAD_COUNT);
      setUnreadCount(response.data.unreadCount);
    } catch (err) {
      console.error('Failed to fetch notifications');
    }
  };

  const fetchBookings = async (pageNum: number, isInitial: boolean = false) => {
    if (isInitial) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError('');
    try {
      const queryParam = filter === 'upcoming' ? '&upcoming=true' : '';
      const response = await api.get(`${API_ENDPOINTS.MY_BOOKINGS}?page=${pageNum}&limit=5${queryParam}`);
      
      let newBookings = response.data.bookings || [];
      
      if (filter === 'past') {
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Normalize to start of day
        newBookings = newBookings.filter((booking: Booking) => {
          // ✅ FIX: Parse YYYY-MM-DD string correctly
          const [year, month, day] = booking.trip.tripDate.split('-').map(Number);
          const tripDate = new Date(year, month - 1, day);
          return tripDate < now;
        });
      }
      
      if (isInitial) {
        setBookings(newBookings);
      } else {
        setBookings(prev => [...prev, ...newBookings]);
      }

      // Check if we have more pages
      // If we received fewer items than the limit (5), then there are no more items
      if (newBookings.length < 5) {
        setHasMore(false);
      } else {
        // Also check total pages from response if available, but length check is usually enough for "Load More"
        if (pageNum >= response.data.totalPages) {
            setHasMore(false);
        }
      }

    } catch (err: any) {
      setError(
        err.response?.data?.errorMessage ||
          'Failed to fetch bookings. Please try again.'
      );
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchBookings(nextPage, false);
  };

  const handleDownloadTicket = async (bookingGroupId: string) => {
    try {
      const response = await api.get(
        `${API_ENDPOINTS.DOWNLOAD_TICKET}/${bookingGroupId}`,
        {
          responseType: 'blob', // Important for downloading binary data
        }
      );

      // Create a blob from the PDF data
      const blob = new Blob([response.data], { type: 'application/pdf' });
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary anchor element and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `ticket-${bookingGroupId}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(
        err.response?.data?.errorMessage ||
          'Failed to download ticket. Please try again.'
      );
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      CONFIRMED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${
          statusColors[status] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header/Navbar */}
      <UserNavbar unreadCount={unreadCount} currentPage="my-bookings" />

      {/* Page Header */}
      <div className="bg-indigo-600 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold">My Bookings</h1>
          <p className="text-indigo-100 mt-2">View and manage your bus tickets</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Tabs */}
        <div className="mb-6 flex gap-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-2 rounded-lg font-semibold ${
              filter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            All Bookings
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-6 py-2 rounded-lg font-semibold ${
              filter === 'upcoming'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`px-6 py-2 rounded-lg font-semibold ${
              filter === 'past'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            Past
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading bookings...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <p className="text-red-700 text-lg">{error}</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <FaTicketAlt className="mx-auto text-6xl text-gray-300 mb-4" />
            <p className="text-gray-600 text-lg mb-4">No bookings found</p>
            <button
              onClick={() => navigate('/home')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
            >
              Book Your First Ticket
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.bookingGroupId}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {booking.bus.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {booking.bus.busNumber} • {booking.bus.type}
                    </p>
                  </div>
                  {getStatusBadge(booking.status)}
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-4">
                  {/* Journey Details */}
                  <div>
                    <div className="flex items-start gap-4">
                      <FaMapMarkerAlt className="text-green-500 mt-1" />
                      <div>
                        <div className="text-sm text-gray-600">Pickup From</div>
                        <div className="font-semibold">
                          {booking.route.from.city}
                          {booking.boardingPoint && (
                            <span className="text-sm text-gray-600 font-normal">
                              {' '}({booking.boardingPoint.name})
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          {booking.boardingPoint?.time || booking.route.from.departureTime}
                        </div>
                      </div>
                    </div>
                    <div className="my-2 ml-2 border-l-2 border-gray-300 h-6"></div>
                    <div className="flex items-start gap-4">
                      <FaMapMarkerAlt className="text-red-500 mt-1" />
                      <div>
                        <div className="text-sm text-gray-600">Drop At</div>
                        <div className="font-semibold">
                          {booking.route.to.city}
                          {booking.droppingPoint && (
                            <span className="text-sm text-gray-600 font-normal">
                              {' '}({booking.droppingPoint.name})
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          {booking.droppingPoint?.time || booking.route.to.arrivalTime}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-gray-700">
                      <FaCalendar className="text-indigo-600" />
                      <div>
                        <div className="text-sm text-gray-600">Journey Date</div>
                        <div className="font-semibold">
                          {(() => {
                            const dual = getDualDateDisplay(booking.trip.tripDate);
                            return (
                              <>
                                <span>{dual.ad}</span>
                                <span className="text-sm text-gray-500 ml-2">({dual.bs})</span>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-gray-700">
                      <FaTicketAlt className="text-indigo-600" />
                      <div>
                        <div className="text-sm text-gray-600">Seats</div>
                        <div className="font-semibold">
                          {booking.seats.map((s) => `${s.seatNumber} (${s.level})`).join(', ')}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 text-gray-700">
                      {/* Show Rupee sign only if INR or default, otherwise show generic or text */}
                      {(!booking.payment || booking.payment.currency === 'INR') ? (
                        <div className="flex items-center text-indigo-600 mt-1">
                          <span className="text-sm font-bold mr-1">INR</span>
                          <FaRupeeSign />
                        </div>
                      ) : (
                        <span className="text-indigo-600 font-bold mt-1 text-sm">NPR</span>
                      )}
                      <div className="w-full">
                        {booking.coupon && booking.discountAmount > 0 ? (
                          <>
                            <div className="text-sm text-gray-600">Amount Paid</div>
                            <div className="space-y-1">
                              {/* Original Price (before discount) - Strikethrough */}
                              <div className="text-sm text-gray-500 line-through">
                                Original: {booking.payment?.currency === 'INR' ? 'INR ' : 'NPR '}
                                {booking.payment?.currency === 'INR' 
                                  ? (Math.abs(booking.totalPrice) * 0.625).toFixed(2)
                                  : Math.abs(booking.totalPrice).toFixed(2)
                                }
                              </div>
                              {/* Final Price (after discount) - Bold */}
                              <div className="font-bold text-xl text-indigo-600">
                                {booking.payment ? (
                                  booking.payment.currency === 'INR' 
                                    ? `${Math.abs(booking.payment.amount).toFixed(2)}` 
                                    : ` ${Math.abs(booking.payment.amount).toFixed(2)}`
                                ) : (
                                  Math.abs(booking.finalPrice).toFixed(2)
                                )}
                              </div>
                              {/* Discount Amount */}
                              <div className="text-xs text-green-600 font-medium">
                                Saved {booking.payment?.currency === 'INR' ? 'INR ' : 'NPR '}
                                {booking.payment?.currency === 'INR'
                                  ? (Math.abs(booking.discountAmount) * 0.625).toFixed(2)
                                  : Math.abs(booking.discountAmount).toFixed(2)
                                } with {booking.coupon.code}
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="text-sm text-gray-600">Total Amount</div>
                            <div className="font-bold text-xl text-indigo-600">
                                {booking.payment ? (
                                  booking.payment.currency === 'INR' 
                                    ? `${Math.abs(booking.payment.amount).toFixed(2)}` 
                                    : ` ${Math.abs(booking.payment.amount).toFixed(2)}`
                                ) : (
                                  Math.abs(booking.finalPrice || booking.totalPrice).toFixed(2)
                                )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 flex justify-between items-center flex-wrap gap-3">
                  <div className="text-sm text-gray-500">
                    Booked on{' '}
                    {getDualDateDisplay(booking.bookedAt).ad}
                    <span className="text-xs ml-1">({getDualDateDisplay(booking.bookedAt).bs})</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {/* Download Ticket Button - Available for CONFIRMED bookings */}
                    {booking.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleDownloadTicket(booking.bookingGroupId)}
                        className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 font-medium flex items-center gap-2"
                      >
                        <FaDownload />
                        Download Ticket
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {hasMore && (
              <div className="text-center mt-8 pb-8">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-8 py-3 bg-white border border-indigo-200 text-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {loadingMore ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      Loading...
                    </span>
                  ) : (
                    'Load More Bookings'
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
