import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import api from '../lib/api';
import { API_ENDPOINTS, APP_NAME } from '../config';
import busLogo from '../assets/buslogo.jpg';
import { BusImageCarousel } from '../components/BusImageCarousel';
import {
  FaArrowLeft,
  FaUser,
  FaBell,
  FaTicketAlt,
  FaInfoCircle,
  FaBed,
  FaChair,
} from 'react-icons/fa';
import { GiSteeringWheel } from 'react-icons/gi';

interface Seat {
  id: string;
  seatNumber: string;
  row: number;
  column: number;
  rowSpan: number;
  columnSpan: number;
  type: 'SEATER' | 'SLEEPER';
  level: 'LOWER' | 'UPPER';
  isAvailable: boolean;
}

interface BusInfo {
  trip: {
    id: string;
    tripDate: string;
    status: string;
  };
  bus: {
    id: string;
    busNumber: string;
    name: string;
    type: string;
    layoutType: string;
    totalSeats: number;
    gridRows: number;
    gridColumns: number;
    images?: Array<{
      id: string;
      imageUrl: string;
      createdAt: string;
    }>;
  };
  route: {
    fromStop: {
      id: string;
      name: string;
      city: string;
      departureTime: string | null;
      lowerSeaterPrice: number;
      lowerSleeperPrice: number;
      upperSleeperPrice: number;
    };
    toStop: {
      id: string;
      name: string;
      city: string;
      arrivalTime: string | null;
      lowerSeaterPrice: number;
      lowerSleeperPrice: number;
      upperSleeperPrice: number;
    };
    fare: number;
  };
  seats: {
    lowerDeck: Seat[];
    upperDeck: Seat[];
    availableCount: number;
  };
}

export function BookingPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = location.state as {
    searchParams?: any;
    fromStopId?: string;
    toStopId?: string;
  };

  const [busInfo, setBusInfo] = useState<BusInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [passengers, setPassengers] = useState<{ [seatId: string]: { name: string; age: number; gender: string } }>({});
  const [currentDeck, setCurrentDeck] = useState<'LOWER' | 'UPPER'>('LOWER');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [fromStopId, setFromStopId] = useState(routeState?.fromStopId || '');
  const [toStopId, setToStopId] = useState(routeState?.toStopId || '');

  useEffect(() => {
    if (!tripId) {
      navigate('/home');
      return;
    }
    fetchUnreadCount();
    
    // If we have stop IDs from navigation state, use them directly
    if (fromStopId && toStopId) {
      fetchBusInfo(fromStopId, toStopId);
    } else {
      // Otherwise, fetch trip stops to get default stops
      fetchTripStops();
    }
  }, [tripId]);

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.UNREAD_COUNT);
      setUnreadCount(response.data.unreadCount);
    } catch (err) {
      console.error('Failed to fetch notifications');
    }
  };

  const fetchTripStops = async () => {
    try {
      // We need to get trip info first to determine stops
      const res = await api.get(`${API_ENDPOINTS.GET_TRIP_SEATS}/${tripId}/seats`);
      
      if (res.data.seats && res.data.seats.length > 0) {
        // Use first and last stop by default
        const stops = res.data.stops || [];
        if (stops.length >= 2) {
          setFromStopId(stops[0].id);
          setToStopId(stops[stops.length - 1].id);
          fetchBusInfo(stops[0].id, stops[stops.length - 1].id);
        }
      }
    } catch (err) {
      console.error('Error fetching trip stops:', err);
      setError('Failed to load trip information');
      setLoading(false);
    }
  };

  const fetchBusInfo = async (fromId: string, toId: string) => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(
        `/user/showbusinfo/${tripId}?fromStopId=${fromId}&toStopId=${toId}`
      );
      console.log('🚌 Bus info:', response.data);
      console.log('📸 Bus images:', response.data.bus?.images);
      setBusInfo(response.data);
    } catch (err: any) {
      setError(
        err.response?.data?.errorMessage ||
          'Failed to load bus information. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSeatClick = (seatId: string, isAvailable: boolean) => {
    if (!isAvailable) return;

    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter((id) => id !== seatId));
      // Remove passenger info for unselected seat
      const newPassengers = { ...passengers };
      delete newPassengers[seatId];
      setPassengers(newPassengers);
    } else {
      if (selectedSeats.length < 6) {
        setSelectedSeats([...selectedSeats, seatId]);
        // Initialize passenger info for new seat
        setPassengers({
          ...passengers,
          [seatId]: { name: '', age: 0, gender: 'MALE' }
        });
      } else {
        alert('You can select maximum 6 seats at a time');
      }
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    try {
      const response = await api.post('/user/applycoupon', {
        couponCode,
        bookingAmount: getTotalAmount(),
      });

      setAppliedCoupon(response.data.coupon);
      alert(`Coupon applied! You saved ₹${response.data.discount}`);
    } catch (err: any) {
      alert(err.response?.data?.errorMessage || 'Invalid coupon code');
    }
  };

  const handleConfirmBooking = async () => {
    if (selectedSeats.length === 0) {
      alert('Please select at least one seat');
      return;
    }

    // Validate passenger information
    for (const seatId of selectedSeats) {
      const passenger = passengers[seatId];
      if (!passenger || !passenger.name || !passenger.age || passenger.age < 1) {
        alert('Please fill in all passenger details (name and age must be valid)');
        return;
      }
    }

    setBookingLoading(true);
    try {
      // Format passengers array for API
      const passengersArray = selectedSeats.map(seatId => ({
        seatId,
        name: passengers[seatId].name,
        age: passengers[seatId].age,
        gender: passengers[seatId].gender,
      }));

      await api.post(API_ENDPOINTS.BOOK_TICKET, {
        tripId,
        fromStopId: fromStopId || busInfo?.route.fromStop.id,
        toStopId: toStopId || busInfo?.route.toStop.id,
        seatIds: selectedSeats,
        passengers: passengersArray,
        couponCode: appliedCoupon?.code || undefined,
      });

      alert('Booking confirmed successfully!');
      navigate('/my-bookings');
    } catch (err: any) {
      alert(
        err.response?.data?.errorMessage ||
          'Booking failed. Please try again.'
      );
    } finally {
      setBookingLoading(false);
    }
  };

  const getSeatPrice = (seat: Seat): number => {
    if (!busInfo) return 0;
    
    if (seat.level === 'LOWER' && seat.type === 'SEATER') {
      return busInfo.route.fromStop.lowerSeaterPrice;
    } else if (seat.level === 'LOWER' && seat.type === 'SLEEPER') {
      return busInfo.route.fromStop.lowerSleeperPrice;
    } else if (seat.level === 'UPPER' && seat.type === 'SLEEPER') {
      return busInfo.route.fromStop.upperSleeperPrice;
    }
    return 0;
  };

  const getTotalAmount = () => {
    if (!busInfo) return 0;
    
    // Calculate base amount based on seat-specific pricing
    const allSeats = [...busInfo.seats.lowerDeck, ...busInfo.seats.upperDeck];
    const baseAmount = selectedSeats.reduce((total, seatId) => {
      const seat = allSeats.find((s) => s.id === seatId);
      if (seat) {
        return total + getSeatPrice(seat);
      }
      return total;
    }, 0);
    
    if (appliedCoupon) {
      const discount = appliedCoupon.discountType === 'PERCENTAGE'
        ? (baseAmount * appliedCoupon.discountValue) / 100
        : appliedCoupon.discountValue;
      return baseAmount - Math.min(discount, appliedCoupon.maxDiscount || discount);
    }
    return baseAmount;
  };

  const getSelectedSeatsInfo = () => {
    if (!busInfo) return [];
    const allSeats = [...busInfo.seats.lowerDeck, ...busInfo.seats.upperDeck];
    return selectedSeats.map((seatId) => {
      const seat = allSeats.find((s) => s.id === seatId);
      return seat;
    }).filter(Boolean);
  };

  const renderSeatGrid = (seats: Seat[], deck: 'LOWER' | 'UPPER') => {
    if (seats.length === 0 && deck === 'UPPER') {
      return (
        <div className="text-center py-12 text-gray-500">
          No upper deck in this bus
        </div>
      );
    }

    if (!busInfo) return null;

    const grid: (Seat | null)[][] = Array(busInfo.bus.gridRows)
      .fill(null)
      .map(() => Array(busInfo.bus.gridColumns).fill(null));

    seats.forEach((seat) => {
      for (let r = 0; r < seat.rowSpan; r++) {
        for (let c = 0; c < seat.columnSpan; c++) {
          if (seat.row + r < busInfo.bus.gridRows && seat.column + c < busInfo.bus.gridColumns) {
            if (r === 0 && c === 0) {
              grid[seat.row][seat.column] = seat;
            } else {
              grid[seat.row + r][seat.column + c] = { ...seat, seatNumber: '' } as Seat;
            }
          }
        }
      }
    });

    const lastOccupiedRowIndex = (() => {
      for (let i = grid.length - 1; i >= 0; i--) {
        if (grid[i].some((cell) => cell !== null)) {
          return i;
        }
      }
      return -1;
    })();

    const trimmedGrid = lastOccupiedRowIndex >= 0 ? grid.slice(0, lastOccupiedRowIndex + 1) : grid;

    return (
      <div className="flex justify-center items-center w-full px-2">
        <div className="overflow-x-auto">
          <div className="inline-block">
            {/* Realistic Bus Layout Container */}
            <div className="relative">
              {/* Bus Frame - Big Border */}
              <div className="border-4 sm:border-6 md:border-8 border-gray-800 rounded-3xl bg-gradient-to-b from-gray-100 to-gray-200 p-3 sm:p-4 md:p-6 shadow-2xl" style={{ minWidth: 'fit-content' }}>
              
              {/* Bus Front Section with Driver */}
              <div className="flex flex-col sm:flex-row justify-between items-center mb-3 sm:mb-4 pb-3 sm:pb-4 border-b-2 sm:border-b-4 border-gray-800 gap-2">
                {/* Windshield/Front Indicator */}
                <div className="flex items-center gap-2 bg-blue-100 border-2 border-blue-400 rounded-lg px-2 sm:px-3 md:px-4 py-1 sm:py-2">
                  <div className="text-[0.65rem] sm:text-xs md:text-sm font-bold text-blue-700">← FRONT →</div>
                </div>
                
                {/* Driver Position - Top Right */}
                <div className="flex items-center gap-1 sm:gap-2 bg-yellow-100 border-2 sm:border-3 border-yellow-500 rounded-xl px-2 sm:px-3 md:px-4 py-2 sm:py-3 shadow-lg">
                  <GiSteeringWheel className="text-yellow-600 text-xl sm:text-2xl md:text-3xl" />
                  <span className="text-xs sm:text-sm md:text-base font-bold text-yellow-700">DRIVER</span>
                </div>
              </div>

              {/* Seat Grid - Rotated 90° (4 columns wide, up to 15 rows long) */}
              <div className="flex flex-col gap-1 sm:gap-2">
                {trimmedGrid.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex gap-1 sm:gap-2 justify-center">
                    {row.map((cell, colIndex) => {
                      if (!cell) {
                        return (
                          <div
                            key={`${rowIndex}-${colIndex}`}
                            className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16"
                          />
                        );
                      }

                      // Skip rendering placeholder cells for multi-span seats
                      if (cell.seatNumber === '') {
                        return null;
                      }

                      const isSelected = selectedSeats.includes(cell.id);
                      const isAvailable = cell.isAvailable;
                      
                      // Calculate the width based on columnSpan
                      const getWidthClass = () => {
                        if (cell.columnSpan === 2) return 'w-[5.25rem] sm:w-[6.25rem] md:w-[7.25rem] lg:w-[8.25rem]';
                        if (cell.columnSpan === 3) return 'w-[8rem] sm:w-[9.5rem] md:w-[11rem] lg:w-[12.5rem]';
                        if (cell.columnSpan === 4) return 'w-[10.75rem] sm:w-[12.75rem] md:w-[14.75rem] lg:w-[16.75rem]';
                        return 'w-10 sm:w-12 md:w-14 lg:w-16';
                      };
                      
                      // Calculate the height based on rowSpan (for vertical sleepers)
                      const getHeightClass = () => {
                        if (cell.rowSpan === 2) return 'h-[5.25rem] sm:h-[6.25rem] md:h-[7.25rem] lg:h-[8.25rem]';
                        return 'h-10 sm:h-12 md:h-14 lg:h-16';
                      };
                      
                      // Scale bed icon based on columnSpan and rowSpan
                      const getBedIconClass = () => {
                        if (cell.type !== 'SLEEPER') return 'text-sm sm:text-base md:text-lg lg:text-xl';
                        
                        // For vertical sleepers (rowSpan = 2)
                        if (cell.rowSpan === 2) return 'text-base sm:text-lg md:text-xl lg:text-2xl';
                        
                        // For horizontal sleepers (columnSpan > 1)
                        if (cell.columnSpan === 2) return 'text-base sm:text-lg md:text-xl lg:text-2xl';
                        if (cell.columnSpan === 3) return 'text-lg sm:text-xl md:text-2xl lg:text-3xl';
                        if (cell.columnSpan === 4) return 'text-xl sm:text-2xl md:text-3xl lg:text-4xl';
                        
                        return 'text-sm sm:text-base md:text-lg lg:text-xl';
                      };

                      return (
                        <button
                          key={`${rowIndex}-${colIndex}`}
                          onClick={() => handleSeatClick(cell.id, isAvailable)}
                          disabled={!isAvailable}
                          className={`
                            ${getWidthClass()}
                            ${getHeightClass()}
                            rounded border-2 font-semibold text-xs
                            transition-all duration-200
                            flex flex-col items-center justify-center
                            ${
                              isSelected
                                ? 'bg-green-500 border-green-600 text-white scale-110'
                                : isAvailable
                                ? 'bg-white border-gray-300 hover:border-indigo-500 hover:bg-indigo-50'
                                : 'bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed'
                            }
                          `}
                        >
                          {cell.type === 'SLEEPER' ? (
                            <FaBed className={`${getBedIconClass()} mb-0.5`} />
                          ) : (
                            <FaChair className="text-sm sm:text-base md:text-lg lg:text-xl mb-0.5" />
                          )}
                          <span className="text-[0.55rem] sm:text-[10px] md:text-xs">{cell.seatNumber}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Bus Back Section */}
              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t-2 sm:border-t-4 border-gray-800 text-center">
                <div className="text-[0.65rem] sm:text-xs md:text-sm font-bold text-gray-600 bg-gray-300 rounded-lg py-1 sm:py-2">BACK</div>
              </div>
              
            </div>
          </div>
        </div>
      </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading bus information...</p>
        </div>
      </div>
    );
  }

  if (error || !busInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md">
          <p className="text-red-700 text-lg mb-4">{error || 'Bus information not available'}</p>
          <button
            onClick={() => navigate('/home')}
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            ← Go back to search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header/Navbar */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
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
                Profile
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Trip Info Bar */}
      <div className="bg-indigo-600 text-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-indigo-100 hover:text-white mb-3"
          >
            <FaArrowLeft />
            Back to Results
          </button>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-bold">{busInfo.bus.name}</h2>
              <p className="text-indigo-100">{busInfo.bus.busNumber} • {busInfo.bus.type}</p>
            </div>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-6">
                <div>
                  <div className="text-sm text-indigo-100">From</div>
                  <div className="font-semibold">{busInfo.route.fromStop.city}</div>
                </div>
                <div>→</div>
                <div>
                  <div className="text-sm text-indigo-100">To</div>
                  <div className="font-semibold">{busInfo.route.toStop.city}</div>
                </div>
              </div>
              <div className="text-sm text-indigo-100">
                Prices vary by seat type and level
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Seat Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bus Images Carousel - Show only if images exist */}
            {busInfo.bus.images && busInfo.bus.images.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-bold mb-4">Bus Photos</h3>
                <BusImageCarousel 
                  images={busInfo.bus.images} 
                  busName={busInfo.bus.name}
                />
              </div>
            )}

            {/* Seat Selection Grid */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold mb-4">Select Your Seats</h3>

              {/* Deck Tabs */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setCurrentDeck('LOWER')}
                  className={`px-6 py-2 rounded-lg font-semibold ${
                    currentDeck === 'LOWER'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Lower Deck
                </button>
                {busInfo.seats.upperDeck.length > 0 && (
                  <button
                    onClick={() => setCurrentDeck('UPPER')}
                    className={`px-6 py-2 rounded-lg font-semibold ${
                      currentDeck === 'UPPER'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    Upper Deck
                  </button>
                )}
              </div>

              {/* Legend */}
              <div className="mb-6 space-y-4">
                <div className="flex gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white border-2 border-gray-300 rounded"></div>
                    <span>Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-500 border-2 border-green-600 rounded"></div>
                    <span>Selected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-200 border-2 border-gray-300 rounded"></div>
                    <span>Booked</span>
                  </div>
                </div>
                
                {/* Pricing Information */}
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <div className="text-sm font-semibold text-indigo-900 mb-2">Seat Pricing</div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="flex flex-col">
                      <span className="text-gray-600">Lower Seater</span>
                      <span className="font-bold text-indigo-700">₹{busInfo.route.fromStop.lowerSeaterPrice}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-600">Lower Sleeper</span>
                      <span className="font-bold text-indigo-700">₹{busInfo.route.fromStop.lowerSleeperPrice}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-600">Upper Sleeper</span>
                      <span className="font-bold text-indigo-700">₹{busInfo.route.fromStop.upperSleeperPrice}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seat Grid */}
              {renderSeatGrid(
                currentDeck === 'LOWER'
                  ? busInfo.seats.lowerDeck
                  : busInfo.seats.upperDeck,
                currentDeck
              )}

              <div className="mt-4 flex items-start gap-2 text-sm text-gray-600">
                <FaInfoCircle className="mt-0.5" />
                <p>Click on available seats to select. You can select up to 6 seats.</p>
              </div>
            </div>
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-24">
              <h3 className="text-xl font-bold mb-4">Booking Summary</h3>

              {selectedSeats.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No seats selected
                </p>
              ) : (
                <>
                  <div className="mb-4">
                    <div className="text-sm text-gray-600 mb-2">Selected Seats:</div>
                    <div className="space-y-2">
                      {getSelectedSeatsInfo().map((seat: any) => (
                        <div
                          key={seat.id}
                          className="flex justify-between items-center px-3 py-2 bg-green-50 border border-green-200 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-green-700">
                              {seat.seatNumber}
                            </span>
                            <span className="text-xs text-gray-600">
                              ({seat.level} {seat.type})
                            </span>
                          </div>
                          <span className="font-semibold text-green-700">
                            ₹{getSeatPrice(seat)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Passenger Information Form */}
                  <div className="mb-4 border-t border-gray-200 pt-4">
                    <div className="text-sm font-medium text-gray-700 mb-3">
                      Passenger Details
                    </div>
                    <div className="space-y-4">
                      {selectedSeats.map((seatId) => {
                        const seat = getSelectedSeatsInfo().find((s: any) => s.id === seatId);
                        return (
                          <div key={seatId} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <div className="text-xs font-semibold text-indigo-600 mb-2">
                              Seat {seat?.seatNumber}
                            </div>
                            <div className="space-y-2">
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">
                                  Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  placeholder="Full Name"
                                  value={passengers[seatId]?.name || ''}
                                  onChange={(e) => {
                                    setPassengers({
                                      ...passengers,
                                      [seatId]: {
                                        name: e.target.value,
                                        age: passengers[seatId]?.age || 0,
                                        gender: passengers[seatId]?.gender || 'MALE',
                                      },
                                    });
                                  }}
                                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">
                                    Age <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    type="number"
                                    placeholder="Age"
                                    min="1"
                                    max="120"
                                    value={passengers[seatId]?.age || ''}
                                    onChange={(e) => {
                                      setPassengers({
                                        ...passengers,
                                        [seatId]: {
                                          name: passengers[seatId]?.name || '',
                                          age: parseInt(e.target.value) || 0,
                                          gender: passengers[seatId]?.gender || 'MALE',
                                        },
                                      });
                                    }}
                                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">
                                    Gender <span className="text-red-500">*</span>
                                  </label>
                                  <select
                                    value={passengers[seatId]?.gender || 'MALE'}
                                    onChange={(e) => {
                                      setPassengers({
                                        ...passengers,
                                        [seatId]: {
                                          name: passengers[seatId]?.name || '',
                                          age: passengers[seatId]?.age || 0,
                                          gender: e.target.value as 'MALE' | 'FEMALE' | 'OTHER',
                                        },
                                      });
                                    }}
                                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  >
                                    <option value="MALE">Male</option>
                                    <option value="FEMALE">Female</option>
                                    <option value="OTHER">Other</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4 mb-4 space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span>Subtotal ({selectedSeats.length} seats)</span>
                      <span>₹{getSelectedSeatsInfo().reduce((sum: number, seat: any) => sum + getSeatPrice(seat), 0)}</span>
                    </div>
                    {appliedCoupon && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Discount ({appliedCoupon.code})</span>
                        <span>
                          -₹
                          {(getSelectedSeatsInfo().reduce((sum: number, seat: any) => sum + getSeatPrice(seat), 0) - getTotalAmount()).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-gray-200 pt-4 mb-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total Amount</span>
                      <span className="text-indigo-600">₹{getTotalAmount()}</span>
                    </div>
                  </div>

                  {/* Coupon Code */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Have a coupon?
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Enter code"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        onClick={handleApplyCoupon}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                      >
                        Apply
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleConfirmBooking}
                    disabled={bookingLoading}
                    className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-400"
                  >
                    {bookingLoading ? 'Processing...' : 'Confirm Booking'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
