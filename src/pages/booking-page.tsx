import {
  useState,
  useEffect,
  type TouchEvent as ReactTouchEvent,
} from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../lib/api';
import { API_ENDPOINTS } from '../config';
import { UserNavbar } from '../components/UserNavbar';
import { BusImageCarousel } from '../components/BusImageCarousel';
import { roundToTwo, formatAmount } from '../utils/currency';
import {
  FaArrowLeft,
  FaInfoCircle,
  FaBed,
  FaChair,
  FaChevronUp,
  FaChevronDown,
  FaCreditCard,
  FaMobileAlt,
} from 'react-icons/fa';
import { GiSteeringWheel } from 'react-icons/gi';
import type { BusInfo, Seat } from '../types/booking';
import { loadRazorpayScript, submitEsewaForm } from '../utils/payment';

type PaymentGateway = 'RAZORPAY' | 'ESEWA';

export function BookingPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = location.state as {
    searchParams?: any;
    fromStopId?: string;
    toStopId?: string;
    selectedSeats?: string[];
    boardingPointId?: string;
    droppingPointId?: string;
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
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [modalStage, setModalStage] = useState<'BOARDING' | 'PASSENGER'>('BOARDING');
  const [currentSeatStep, setCurrentSeatStep] = useState(0);
  const [modalError, setModalError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentGateway>('RAZORPAY');
  const [selectedBoardingPointId, setSelectedBoardingPointId] = useState(
    routeState?.boardingPointId || ''
  );
  const [selectedDroppingPointId, setSelectedDroppingPointId] = useState(
    routeState?.droppingPointId || ''
  );
  const [isConfirmationReady, setIsConfirmationReady] = useState(false);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.innerWidth < 768;
  });
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

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
    useEffect(() => {
      const checkViewport = () => {
        if (typeof window === 'undefined') return;
        setIsMobile(window.innerWidth < 768);
      };

      checkViewport();
      window.addEventListener('resize', checkViewport);
      return () => window.removeEventListener('resize', checkViewport);
    }, []);

    useEffect(() => {
      if (!isMobile) {
        setIsSheetExpanded(false);
      }
    }, [isMobile]);

    useEffect(() => {
      if (selectedSeats.length === 0) {
        setIsSheetExpanded(false);
      }
    }, [selectedSeats.length]);


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

  useEffect(() => {
    if (!busInfo) {
      return;
    }

    setSelectedBoardingPointId((prev) => {
      if (prev) {
        return prev;
      }
      const first = busInfo.route.boardingPoints?.[0]?.id;
      return first || '';
    });

    setSelectedDroppingPointId((prev) => {
      if (prev) {
        return prev;
      }
      const first = busInfo.route.droppingPoints?.[0]?.id;
      return first || '';
    });
  }, [busInfo]);

  useEffect(() => {
    if (
      routeState?.selectedSeats &&
      Array.isArray(routeState.selectedSeats) &&
      routeState.selectedSeats.length > 0 &&
      selectedSeats.length === 0
    ) {
      setSelectedSeats(routeState.selectedSeats);
      const restoredPassengers: {
        [seatId: string]: { name: string; age: number; gender: string };
      } = {};
      routeState.selectedSeats.forEach((seatId) => {
        restoredPassengers[seatId] = { name: '', age: 0, gender: 'MALE' };
      });
      setPassengers(restoredPassengers);
    }
  }, [routeState?.selectedSeats, selectedSeats.length]);

  const handleSeatClick = (seatId: string, isAvailable: boolean) => {
    if (!isAvailable) return;

    setIsConfirmationReady(false);
    setShowBookingModal(false);
  setCurrentSeatStep(0);

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
    const trimmedCode = couponCode.trim().toUpperCase();

    if (!trimmedCode) {
      return;
    }

    if (!tripId) {
      alert('Trip ID not found');
      return;
    }

    const baseAmount = calculateBaseAmount();

    if (baseAmount <= 0) {
      alert('Please select at least one seat before applying a coupon.');
      return;
    }

    try {
      const response = await api.post('/user/booking/apply-coupon', {
        code: trimmedCode,
        tripId,
        totalAmount: roundToTwo(baseAmount),
      });

      // Backend returns: { offer, originalAmount, discountAmount, finalAmount }
      setAppliedCoupon({
        ...response.data.offer,
        originalAmount: roundToTwo(response.data.originalAmount ?? baseAmount),
        discountAmount: roundToTwo(response.data.discountAmount),
        finalAmount: roundToTwo(response.data.finalAmount),
      });
      alert(`Coupon applied! You saved ₹${formatAmount(response.data.discountAmount)}`);
    } catch (err: any) {
      alert(err.response?.data?.errorMessage || 'Invalid coupon code');
    }
  };

  const handleConfirmBooking = async () => {
    if (selectedSeats.length === 0) {
      alert('Please select at least one seat');
      return;
    }

    if (!selectedBoardingPointId || !selectedDroppingPointId) {
      alert('Please select your boarding and dropping points before confirming');
      return;
    }

    for (const seatId of selectedSeats) {
      const passenger = passengers[seatId];
      if (!passenger || !passenger.name || !passenger.age || passenger.age < 1) {
        alert('Please fill in all passenger details (name and age must be valid)');
        return;
      }
    }

    setIsConfirmationReady(false);
    setModalError('');
    setBookingLoading(true);

    try {
      const passengersArray = selectedSeats.map((seatId) => ({
        seatId,
        name: passengers[seatId].name,
        age: passengers[seatId].age,
        gender: passengers[seatId].gender,
      }));

      const bookingPayload = {
        tripId,
        fromStopId: fromStopId || busInfo?.route.fromStop.id,
        toStopId: toStopId || busInfo?.route.toStop.id,
        seatIds: selectedSeats,
        passengers: passengersArray,
        boardingPointId: selectedBoardingPointId,
        droppingPointId: selectedDroppingPointId,
        couponCode: appliedCoupon?.code || undefined,
      };

      const initiateResponse = await api.post(API_ENDPOINTS.PAYMENTS_INITIATE, {
        ...bookingPayload,
        paymentMethod,
      });

      const {
        paymentId,
        method,
        amount,
        currency,
        orderId,
        razorpayKeyId,
        form,
      } = initiateResponse.data;

      if (method === 'RAZORPAY') {
        await loadRazorpayScript();
        setBookingLoading(false);

        if (!window.Razorpay) {
          throw new Error('Failed to load Razorpay checkout. Please refresh and try again.');
        }

        const razorpay = new window.Razorpay({
          key: razorpayKeyId,
          amount: Math.round((amount || 0) * 100),
          currency: currency || 'INR',
          name: 'Go Gantabya',
          description: 'Bus ticket booking',
          order_id: orderId,
          notes: {
            tripId: tripId || '',
            fromStopId: bookingPayload.fromStopId ?? '',
            toStopId: bookingPayload.toStopId ?? '',
          },
          handler: async (response) => {
            try {
              setBookingLoading(true);
              await api.post(API_ENDPOINTS.PAYMENTS_VERIFY, {
                paymentId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });

              await api.post(API_ENDPOINTS.PAYMENTS_CONFIRM, {
                paymentId,
              });

              alert('Booking confirmed successfully!');
              navigate('/my-bookings');
            } catch (verificationError: any) {
              console.error('Error verifying Razorpay payment:', verificationError);
              const message =
                verificationError.response?.data?.errorMessage ||
                'Payment verification failed. Please contact support if amount was deducted.';
              setModalError(message);
              alert(message);
            } finally {
              setBookingLoading(false);
            }
          },
          modal: {
            ondismiss: () => {
              setBookingLoading(false);
              setModalError('Payment was cancelled before completion.');
            },
          },
          theme: {
            color: '#4F46E5',
          },
        });

        razorpay.on('payment.failed', (failure) => {
          console.error('Razorpay payment failed:', failure);
          const message =
            failure.error?.description || 'Payment failed. Please try again with a different method or card.';
          setModalError(message);
          alert(message);
        });

        razorpay.open();
        return;
      }

      if (method === 'ESEWA' && form) {
        sessionStorage.setItem('latestPaymentId', paymentId);
        alert('Redirecting to eSewa to complete your payment.');
        setBookingLoading(false);
        submitEsewaForm(form.formUrl, form.params);
        return;
      }

      throw new Error('Unsupported payment method.');
    } catch (err: any) {
      console.error('Error initiating payment:', err);
      const message =
        err.response?.data?.errorMessage || err.message || 'Payment initiation failed. Please try again.';
      setModalError(message);
      alert(message);
      setBookingLoading(false);
    }
  };

  const getSeatPrice = (seat: Seat): number => {
    if (!busInfo) return 0;

    // Calculate journey price = toStop price - fromStop price
    // Both prices are cumulative from origin, so difference gives journey price
    if (seat.level === 'LOWER' && seat.type === 'SEATER') {
      return roundToTwo(
        Math.abs(
          busInfo.route.toStop.lowerSeaterPrice -
            busInfo.route.fromStop.lowerSeaterPrice
        )
      );
    } else if (seat.level === 'LOWER' && seat.type === 'SLEEPER') {
      return roundToTwo(
        Math.abs(
          busInfo.route.toStop.lowerSleeperPrice -
            busInfo.route.fromStop.lowerSleeperPrice
        )
      );
    } else if (seat.level === 'UPPER' && seat.type === 'SLEEPER') {
      return roundToTwo(
        Math.abs(
          busInfo.route.toStop.upperSleeperPrice -
            busInfo.route.fromStop.upperSleeperPrice
        )
      );
    }
    return 0;
  };

  const calculateBaseAmount = () => {
    if (!busInfo) return 0;

    const allSeats = [...busInfo.seats.lowerDeck, ...busInfo.seats.upperDeck];
    const total = selectedSeats.reduce((sum, seatId) => {
      const seat = allSeats.find((s) => s.id === seatId);
      if (!seat) {
        return sum;
      }
      return roundToTwo(sum + getSeatPrice(seat));
    }, 0);

    return roundToTwo(total);
  };

  const getTotalAmount = () => {
    const baseAmount = calculateBaseAmount();

    if (appliedCoupon && appliedCoupon.finalAmount !== undefined) {
      return roundToTwo(appliedCoupon.finalAmount);
    }

    return baseAmount;
  };

  const getDiscountAmount = () => {
    if (!appliedCoupon || !appliedCoupon.discountAmount) return 0;
    return roundToTwo(appliedCoupon.discountAmount);
  };

  const getSelectedSeatsInfo = (): Seat[] => {
    if (!busInfo) return [];
    const allSeats = [...busInfo.seats.lowerDeck, ...busInfo.seats.upperDeck];
    return selectedSeats
      .map((seatId) => allSeats.find((s) => s.id === seatId))
      .filter((seat): seat is Seat => Boolean(seat));
  };

  const getMinimumSeatPrice = () => {
    if (!busInfo) return 0;
    const prices = [
      roundToTwo(
        Math.abs(
          busInfo.route.toStop.lowerSeaterPrice -
            busInfo.route.fromStop.lowerSeaterPrice
        )
      ),
      roundToTwo(
        Math.abs(
          busInfo.route.toStop.lowerSleeperPrice -
            busInfo.route.fromStop.lowerSleeperPrice
        )
      ),
      roundToTwo(
        Math.abs(
          busInfo.route.toStop.upperSleeperPrice -
            busInfo.route.fromStop.upperSleeperPrice
        )
      ),
    ].filter((price) => price > 0);

    if (prices.length === 0) {
      return 0;
    }

    return roundToTwo(Math.min(...prices));
  };

  const bottomSheetPeekHeight = selectedSeats.length > 0 ? 220 : 160;
  const mobileContentPaddingBottom = bottomSheetPeekHeight + (selectedSeats.length > 0 ? 120 : 80);
  const bottomSheetTransform = isSheetExpanded
    ? 'translateY(0)'
    : `translateY(calc(100% - ${bottomSheetPeekHeight}px))`;

  const handleSheetToggle = () => {
    setIsSheetExpanded((prev) => !prev);
  };

  const handleSheetTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
    setTouchStartY(event.touches[0]?.clientY ?? null);
  };

  const handleSheetTouchEnd = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (touchStartY === null) return;
    const endY = event.changedTouches[0]?.clientY ?? touchStartY;
    const delta = endY - touchStartY;

    if (delta < -40) {
      setIsSheetExpanded(true);
    } else if (delta > 40) {
      setIsSheetExpanded(false);
    }

    setTouchStartY(null);
  };

  const handleProceedOrder = () => {
    if (!tripId || selectedSeats.length === 0) {
      return;
    }

    const effectiveFromStopId = fromStopId || busInfo?.route.fromStop.id || '';
    const effectiveToStopId = toStopId || busInfo?.route.toStop.id || '';

    navigate(`/book/${tripId}/boarding`, {
      state: {
        selectedSeats,
        fromStopId: effectiveFromStopId,
        toStopId: effectiveToStopId,
        searchParams: routeState?.searchParams || null,
        boardingPointId: routeState?.boardingPointId || selectedBoardingPointId || '',
        droppingPointId: routeState?.droppingPointId || selectedDroppingPointId || '',
      },
    });
  };

  const handleOpenBookingModal = () => {
    if (selectedSeats.length === 0 || !busInfo) {
      return;
    }

    if (!selectedBoardingPointId && busInfo.route.boardingPoints?.length) {
      setSelectedBoardingPointId(busInfo.route.boardingPoints[0].id);
    }

    if (!selectedDroppingPointId && busInfo.route.droppingPoints?.length) {
      setSelectedDroppingPointId(busInfo.route.droppingPoints[0].id);
    }

    setModalStage('BOARDING');
    setCurrentSeatStep(0);
    setModalError('');
    setShowBookingModal(true);
    setIsConfirmationReady(false);
  };

  const handleCloseBookingModal = () => {
    setShowBookingModal(false);
    setModalStage('BOARDING');
    setCurrentSeatStep(0);
    setModalError('');
  };

  const handleBoardingNext = () => {
    if (!selectedBoardingPointId || !selectedDroppingPointId) {
      setModalError('Please select both boarding and dropping points to continue');
      return;
    }

    setModalError('');
    setModalStage('PASSENGER');
    setCurrentSeatStep(0);
  };

  const handlePassengerNext = () => {
    if (selectedSeats.length === 0) {
      setModalError('Select at least one seat to continue');
      return;
    }

    const seatId = selectedSeats[currentSeatStep];
    const passenger = passengers[seatId];

    if (!passenger || !passenger.name.trim()) {
      setModalError('Passenger name is required');
      return;
    }

    if (!passenger.age || passenger.age < 1) {
      setModalError('Passenger age must be at least 1');
      return;
    }

    setModalError('');

    if (currentSeatStep < selectedSeats.length - 1) {
      setCurrentSeatStep((prev) => prev + 1);
    } else {
      setShowBookingModal(false);
      setIsConfirmationReady(true);
    }
  };

  const handlePassengerBack = () => {
    if (modalStage === 'BOARDING') {
      handleCloseBookingModal();
      return;
    }

    if (currentSeatStep === 0) {
      setModalStage('BOARDING');
      setModalError('');
      return;
    }

    setModalError('');
    setCurrentSeatStep((prev) => Math.max(prev - 1, 0));
  };

  const renderRoutePath = () => {
    if (!busInfo || !busInfo.route.path || busInfo.route.path.length === 0) {
      return null;
    }

    const path = busInfo.route.path;
    const fromId = busInfo.route.fromStop.id;
    const toId = busInfo.route.toStop.id;
    const fromIndex = path.findIndex((stop) => stop.id === fromId);
    const toIndex = path.findIndex((stop) => stop.id === toId);

    if (fromIndex === -1 || toIndex === -1) {
      return null;
    }

    const startIndex = Math.min(fromIndex, toIndex);
    const endIndex = Math.max(fromIndex, toIndex);

    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm text-gray-500">Journey Direction</div>
            <div className="text-lg font-semibold text-gray-800">
              {busInfo.route.isReturnTrip ? 'Return Trip' : 'Forward Trip'}
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {busInfo.route.fromStop.city} → {busInfo.route.toStop.city}
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="flex items-center gap-4 min-w-max">
            {path.map((stop, index) => {
              const isActive = index >= startIndex && index <= endIndex;
              const isEndpoint = stop.id === fromId || stop.id === toId;
              const displayTime = busInfo.route.isReturnTrip
                ? stop.returnDepartureTime || stop.returnArrivalTime || stop.departureTime || '--'
                : stop.departureTime || stop.arrivalTime || '--';

              return (
                <div key={stop.id} className="flex items-center gap-4">
                  <div
                    className={`px-4 py-3 rounded-2xl border shadow-sm transition-colors duration-200 ${
                      isActive
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-white text-gray-700 border-gray-200'
                    } ${isEndpoint ? 'ring-2 ring-offset-2 ring-indigo-300' : ''}`}
                  >
                    <div className="text-sm font-semibold">
                      {stop.city || stop.name}
                    </div>
                    <div className="text-xs opacity-80">{displayTime}</div>
                  </div>
                  {index < path.length - 1 && (
                    <span
                      className={`text-lg font-semibold ${
                        index >= startIndex && index < endIndex
                          ? 'text-indigo-500'
                          : 'text-gray-300'
                      }`}
                    >
                      →
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
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

    // Calculate the actual grid size based on seats present
    let maxRow = 0;
    let maxColumn = 0;
    
    seats.forEach((seat) => {
      const seatMaxRow = seat.row + seat.rowSpan - 1;
      const seatMaxColumn = seat.column + seat.columnSpan - 1;
      if (seatMaxRow > maxRow) maxRow = seatMaxRow;
      if (seatMaxColumn > maxColumn) maxColumn = seatMaxColumn;
    });
    
    // Grid dimensions (add 1 because 0-indexed)
    const gridRows = maxRow + 1;
    const gridColumns = maxColumn + 1;

    return (
      <div className="flex justify-center items-center w-full px-2">
        <div className="overflow-x-auto">
          <div className="inline-block">
            {/* Bus Frame */}
            <div className="border-4 sm:border-6 md:border-8 border-gray-800 rounded-3xl bg-gradient-to-b from-gray-100 to-gray-200 p-3 sm:p-4 md:p-6 shadow-2xl" style={{ minWidth: 'fit-content' }}>
              
              {/* Bus Front Section with Driver */}
              <div className="flex flex-col sm:flex-row justify-between items-center mb-3 sm:mb-4 pb-3 sm:pb-4 border-b-2 sm:border-b-4 border-gray-800 gap-2">
                <div className="flex items-center gap-2 bg-blue-100 border-2 border-blue-400 rounded-lg px-2 sm:px-3 md:px-4 py-1 sm:py-2">
                  <div className="text-[0.65rem] sm:text-xs md:text-sm font-bold text-blue-700">← FRONT →</div>
                </div>
                
                <div className="flex items-center gap-1 sm:gap-2 bg-yellow-100 border-2 sm:border-3 border-yellow-500 rounded-xl px-2 sm:px-3 md:px-4 py-2 sm:py-3 shadow-lg">
                  <GiSteeringWheel className="text-yellow-600 text-xl sm:text-2xl md:text-3xl" />
                  <span className="text-xs sm:text-sm md:text-base font-bold text-yellow-700">DRIVER</span>
                </div>
              </div>

              {/* ✅ CSS Grid Layout - No white spaces, exact positioning */}
              <div 
                className="gap-1 sm:gap-2"
                style={{
                  display: 'grid',
                  gridTemplateRows: `repeat(${gridRows}, minmax(2.5rem, 1fr))`,
                  gridTemplateColumns: `repeat(${gridColumns}, minmax(2.5rem, 1fr))`,
                }}
              >
                {seats.map((seat) => {
                  const isSelected = selectedSeats.includes(seat.id);
                  const isAvailable = seat.isAvailable;
                  
                  // Scale bed icon based on span
                  const getBedIconClass = () => {
                    if (seat.type !== 'SLEEPER') return 'text-sm sm:text-base md:text-lg lg:text-xl';
                    
                    // Vertical sleeper
                    if (seat.rowSpan === 2) return 'text-base sm:text-lg md:text-xl lg:text-2xl';
                    
                    // Horizontal sleeper
                    if (seat.columnSpan === 2) return 'text-base sm:text-lg md:text-xl lg:text-2xl';
                    if (seat.columnSpan === 3) return 'text-lg sm:text-xl md:text-2xl lg:text-3xl';
                    if (seat.columnSpan === 4) return 'text-xl sm:text-2xl md:text-3xl lg:text-4xl';
                    
                    return 'text-sm sm:text-base md:text-lg lg:text-xl';
                  };

                  return (
                    <button
                      key={seat.id}
                      onClick={() => handleSeatClick(seat.id, isAvailable)}
                      disabled={!isAvailable}
                      style={{
                        gridRow: `${seat.row + 1} / span ${seat.rowSpan}`,
                        gridColumn: `${seat.column + 1} / span ${seat.columnSpan}`,
                      }}
                      className={`
                        rounded border-2 font-semibold text-xs
                        transition-all duration-200
                        flex flex-col items-center justify-center
                        min-h-[2.5rem] min-w-[2.5rem]
                        ${
                          isSelected
                            ? 'bg-green-500 border-green-600 text-white scale-105 shadow-lg z-10'
                            : isAvailable
                            ? 'bg-white border-gray-300 hover:border-indigo-500 hover:bg-indigo-50 hover:shadow-md'
                            : 'bg-red-400 border-red-500 text-white cursor-not-allowed opacity-75'
                        }
                      `}
                    >
                      {seat.type === 'SLEEPER' ? (
                        <FaBed className={`${getBedIconClass()} mb-0.5`} />
                      ) : (
                        <FaChair className="text-sm sm:text-base md:text-lg lg:text-xl mb-0.5" />
                      )}
                      <span className="text-[0.55rem] sm:text-[10px] md:text-xs font-semibold">{seat.seatNumber}</span>
                    </button>
                  );
                })}
              </div>

              {/* Bus Back Section */}
              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t-2 sm:border-t-4 border-gray-800 text-center">
                <div className="text-[0.65rem] sm:text-xs md:text-sm font-bold text-gray-600 bg-gray-300 rounded-lg py-1 sm:py-2">BACK</div>
              </div>
              
            </div>
          </div>
        </div>
      </div>
    );
  };

  const seatDetails = getSelectedSeatsInfo();
  const selectedBoardingPoint = busInfo?.route.boardingPoints?.find(
    (point) => point.id === selectedBoardingPointId
  );
  const selectedDroppingPoint = busInfo?.route.droppingPoints?.find(
    (point) => point.id === selectedDroppingPointId
  );
  const subtotal = calculateBaseAmount();
  const discountAmountValue = getDiscountAmount();
  const totalAmountValue = getTotalAmount();
  const currentSeatId = selectedSeats[currentSeatStep] || '';
  const currentSeatDetails = seatDetails[currentSeatStep] || null;
  const currentPassengerDetails = currentSeatId
    ? passengers[currentSeatId]
    : undefined;

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
      <UserNavbar unreadCount={unreadCount} currentPage="booking" />

  {/* Trip Info Bar */}
  <div className="hidden md:block bg-indigo-600 text-white py-3 sm:py-4">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-xs sm:text-sm text-indigo-100 hover:text-white mb-2 sm:mb-3"
          >
            <FaArrowLeft />
            Back to Results
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">{busInfo.bus.name}</h2>
              <p className="text-xs sm:text-sm text-indigo-100">{busInfo.bus.busNumber} • {busInfo.bus.type}</p>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
              <div className="flex items-center gap-3 sm:gap-6">
                <div>
                  <div className="text-xs text-indigo-100">From</div>
                  <div className="text-sm sm:text-base font-semibold">{busInfo.route.fromStop.city}</div>
                </div>
                <div className="text-sm sm:text-base">→</div>
                <div>
                  <div className="text-xs text-indigo-100">To</div>
                  <div className="text-sm sm:text-base font-semibold">{busInfo.route.toStop.city}</div>
                </div>
              </div>
              <div className="text-xs sm:text-sm text-indigo-100">
                Prices vary by seat type
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Seat Experience */}
  <div className="md:hidden relative">
        <div
          className="px-3 pt-4"
          style={{ paddingBottom: mobileContentPaddingBottom }}
        >
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-indigo-600 shadow-sm"
            >
              <FaArrowLeft className="text-sm" />
              Back
            </button>
            <div className="text-right">
              <div className="text-sm font-semibold text-gray-900">{busInfo.bus.name}</div>
              <div className="text-[11px] text-gray-500">{busInfo.bus.busNumber} • {busInfo.bus.type}</div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-4 shadow-xl">
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentDeck('LOWER')}
                className={`w-full rounded-2xl px-4 py-2 text-sm font-semibold transition-colors ${
                  currentDeck === 'LOWER'
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                Lower Deck
              </button>
              {busInfo.seats.upperDeck.length > 0 && (
                <button
                  onClick={() => setCurrentDeck('UPPER')}
                  className={`w-full rounded-2xl px-4 py-2 text-sm font-semibold transition-colors ${
                    currentDeck === 'UPPER'
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  Upper Deck
                </button>
              )}
            </div>

            <div className="mt-4 rounded-2xl bg-gray-50 p-2 shadow-inner">
              {renderSeatGrid(
                currentDeck === 'LOWER'
                  ? busInfo.seats.lowerDeck
                  : busInfo.seats.upperDeck,
                currentDeck
              )}
            </div>

            <div className="mt-4 flex items-center justify-between text-[11px] text-gray-500">
              <span>Tap seats to select • Max 6 seats</span>
              <span className="font-semibold text-indigo-600">
                {selectedSeats.length > 0
                  ? `Selected: ${selectedSeats.length}`
                  : 'No seats yet'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Info Bottom Sheet */}
      {isMobile && (
        <div
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300 ease-out"
          style={{ transform: bottomSheetTransform }}
        >
          <div className="rounded-t-3xl bg-white px-5 pt-4 pb-6 shadow-[0_-20px_60px_rgba(15,23,42,0.25)]">
            <div
              className="flex justify-center"
              onTouchStart={handleSheetTouchStart}
              onTouchEnd={handleSheetTouchEnd}
            >
              <button
                type="button"
                onClick={handleSheetToggle}
                className="h-1.5 w-12 rounded-full bg-gray-300"
                aria-label={isSheetExpanded ? 'Collapse bus details' : 'Expand bus details'}
              ></button>
            </div>

            <div className="mt-3 flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-wide text-gray-400">Route</div>
                <div className="text-base font-semibold text-gray-900">
                  {busInfo.route.fromStop.city} → {busInfo.route.toStop.city}
                </div>
                <div className="text-[11px] text-gray-500">
                  {(busInfo.route.fromStop.departureTime || '--')} • {(busInfo.route.toStop.arrivalTime || '--')}
                </div>
              </div>
              <button
                type="button"
                onClick={handleSheetToggle}
                className="rounded-full border border-gray-200 p-2 text-gray-600 shadow-sm"
                aria-label={isSheetExpanded ? 'Collapse bus details' : 'Expand bus details'}
              >
                {isSheetExpanded ? <FaChevronDown /> : <FaChevronUp />}
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-[11px] text-gray-500">
              <div>
                <div className="text-[11px] uppercase tracking-wide text-gray-400">Bus</div>
                <div className="text-sm font-semibold text-gray-900">{busInfo.bus.name}</div>
                <div>{busInfo.bus.busNumber}</div>
              </div>
              <div className="text-right">
                <div className="text-[11px] uppercase tracking-wide text-gray-400">{selectedSeats.length > 0 ? 'Your total' : 'Starts at'}</div>
                <div className="text-lg font-bold text-indigo-600">
                  ₹{
                    selectedSeats.length > 0
                      ? formatAmount(totalAmountValue)
                      : formatAmount(getMinimumSeatPrice())
                  }
                </div>
                {selectedSeats.length > 0 && (
                  <div className="text-[10px] text-gray-400">
                    {selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''} selected
                  </div>
                )}
              </div>
            </div>

            {selectedSeats.length > 0 && (
              <div className="mt-4">
                <button
                  onClick={handleProceedOrder}
                  className="w-full rounded-2xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200"
                >
                  Proceed Order
                </button>
              </div>
            )}

            {!isSheetExpanded && (
              <p className="mt-3 text-center text-[11px] text-gray-400">
                Swipe up to view bus photos, pricing, and route details.
              </p>
            )}

            <div
              className="mt-4 transition-all duration-300"
              style={{
                maxHeight: isSheetExpanded ? '60vh' : '0px',
                opacity: isSheetExpanded ? 1 : 0,
                overflowY: isSheetExpanded ? 'auto' : 'hidden',
              }}
            >
              <div className="space-y-4 pr-1 pb-2">
                {busInfo.bus.images && busInfo.bus.images.length > 0 && (
                  <div className="overflow-hidden rounded-2xl">
                    <BusImageCarousel
                      images={busInfo.bus.images}
                      busName={busInfo.bus.name}
                      heightClass="h-44"
                    />
                  </div>
                )}

                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/80 p-4 text-xs">
                  <div className="text-indigo-900 text-sm font-semibold mb-3">Seat Pricing</div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase tracking-wide text-indigo-500">Lower Seater</span>
                      <span className="text-sm font-bold text-indigo-700">₹{formatAmount(
                        Math.abs(
                          busInfo.route.toStop.lowerSeaterPrice -
                            busInfo.route.fromStop.lowerSeaterPrice
                        )
                      )}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase tracking-wide text-indigo-500">Lower Sleeper</span>
                      <span className="text-sm font-bold text-indigo-700">₹{formatAmount(
                        Math.abs(
                          busInfo.route.toStop.lowerSleeperPrice -
                            busInfo.route.fromStop.lowerSleeperPrice
                        )
                      )}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase tracking-wide text-indigo-500">Upper Sleeper</span>
                      <span className="text-sm font-bold text-indigo-700">₹{formatAmount(
                        Math.abs(
                          busInfo.route.toStop.upperSleeperPrice -
                            busInfo.route.fromStop.upperSleeperPrice
                        )
                      )}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4 text-xs text-gray-600">
                  <div className="text-sm font-semibold text-gray-900 mb-3">Seat Legend</div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded border-2 border-gray-300 bg-white"></div>
                      <span>Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded border-2 border-green-600 bg-green-500"></div>
                      <span>Selected</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded border-2 border-red-500 bg-red-400"></div>
                      <span>Booked</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4 text-xs text-gray-600">
                  <div className="text-sm font-semibold text-gray-900 mb-3">Route Overview</div>
                  {renderRoutePath() || (
                    <div className="text-[11px] text-gray-400">Route details unavailable.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

  <div className="hidden md:block">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Seat Selection */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Seat Selection Grid */}
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Select Your Seats</h3>

              {/* Deck Tabs */}
              <div className="flex gap-2 mb-4 sm:mb-6">
                <button
                  onClick={() => setCurrentDeck('LOWER')}
                  className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-lg text-sm sm:text-base font-semibold ${
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
                    className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-lg text-sm sm:text-base font-semibold ${
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
              <div className="mb-4 sm:mb-6 space-y-3 sm:space-y-4">
                <div className="flex flex-wrap gap-3 sm:gap-6 text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white border-2 border-gray-300 rounded"></div>
                    <span>Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500 border-2 border-green-600 rounded"></div>
                    <span>Selected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-400 border-2 border-red-500 rounded"></div>
                    <span>Booked</span>
                  </div>
                </div>
                
                {/* Pricing Information */}
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 sm:p-4">
                  <div className="text-xs sm:text-sm font-semibold text-indigo-900 mb-2">Seat Pricing</div>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3 text-xs sm:text-sm">
                    <div className="flex flex-col">
                      <span className="text-gray-600 text-[10px] sm:text-xs">Lower Seater</span>
                      <span className="font-bold text-indigo-700 text-sm sm:text-base">₹{formatAmount(
                        Math.abs(
                          busInfo.route.toStop.lowerSeaterPrice -
                            busInfo.route.fromStop.lowerSeaterPrice
                        )
                      )}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-600 text-[10px] sm:text-xs">Lower Sleeper</span>
                      <span className="font-bold text-indigo-700 text-sm sm:text-base">₹{formatAmount(
                        Math.abs(
                          busInfo.route.toStop.lowerSleeperPrice -
                            busInfo.route.fromStop.lowerSleeperPrice
                        )
                      )}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-600 text-[10px] sm:text-xs">Upper Sleeper</span>
                      <span className="font-bold text-indigo-700 text-sm sm:text-base">₹{formatAmount(
                        Math.abs(
                          busInfo.route.toStop.upperSleeperPrice -
                            busInfo.route.fromStop.upperSleeperPrice
                        )
                      )}</span>
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

              <div className="mt-4 flex items-start gap-2 text-xs sm:text-sm text-gray-600">
                <FaInfoCircle className="mt-0.5 flex-shrink-0" />
                <p>Click on available seats to select. You can select up to 6 seats.</p>
              </div>

              <div className="mt-4 sm:mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs sm:text-sm text-gray-600">
                  {selectedSeats.length > 0
                    ? `Selected seats: ${selectedSeats.length}`
                    : 'Select seats to continue with booking.'}
                </div>
                <button
                  onClick={handleOpenBookingModal}
                  disabled={selectedSeats.length === 0}
                  className={`w-full sm:w-auto px-6 py-2.5 rounded-lg text-sm sm:text-base font-semibold transition-colors ${
                    selectedSeats.length === 0
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow'
                  }`}
                >
                  {isConfirmationReady ? 'Edit Booking Details' : 'Continue Booking'}
                </button>
              </div>
            </div>
          </div>

          {/* Booking Side Panel */}
          <div className="lg:col-span-1">
            {isConfirmationReady ? (
              <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:sticky lg:top-24 space-y-4 sm:space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">Confirm Booking</h3>
                  <span className="text-xs sm:text-sm text-gray-500">{selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''}</span>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  {seatDetails.map((seat) => (
                    <div
                      key={seat.id}
                      className="flex justify-between items-center px-3 py-2 rounded-lg border border-indigo-100 bg-indigo-50"
                    >
                      <div>
                        <div className="text-xs sm:text-sm font-semibold text-indigo-700">Seat {seat.seatNumber}</div>
                        <div className="text-[10px] sm:text-xs text-indigo-500">
                          {seat.level} • {seat.type}
                        </div>
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-indigo-700">₹{formatAmount(getSeatPrice(seat))}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 pt-3 sm:pt-4 space-y-2 sm:space-y-3">
                  <div>
                    <div className="text-[10px] sm:text-xs uppercase tracking-wide text-gray-500">Boarding Point</div>
                    <div className="text-xs sm:text-sm font-semibold text-gray-800">
                      {selectedBoardingPoint?.name || 'Not selected'}
                    </div>
                    {selectedBoardingPoint?.time && (
                      <div className="text-[10px] sm:text-xs text-gray-500">{selectedBoardingPoint.time}</div>
                    )}
                  </div>
                  <div>
                    <div className="text-[10px] sm:text-xs uppercase tracking-wide text-gray-500">Dropping Point</div>
                    <div className="text-xs sm:text-sm font-semibold text-gray-800">
                      {selectedDroppingPoint?.name || 'Not selected'}
                    </div>
                    {selectedDroppingPoint?.time && (
                      <div className="text-[10px] sm:text-xs text-gray-500">{selectedDroppingPoint.time}</div>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-xs sm:text-sm text-gray-600">
                  <div className="flex justify-between font-medium">
                    <span>Subtotal</span>
                    <span>₹{formatAmount(subtotal)}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({appliedCoupon.code})</span>
                      <span>
                        -₹{formatAmount(discountAmountValue)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm sm:text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
                    <span>Total</span>
                    <span className="text-indigo-600">₹{formatAmount(totalAmountValue)}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Select Payment Method
                    </span>
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('RAZORPAY')}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-colors ${
                          paymentMethod === 'RAZORPAY'
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 hover:border-indigo-300 text-gray-700'
                        }`}
                      >
                        <span className="flex items-center gap-2 text-sm sm:text-base font-medium">
                          <FaCreditCard className="hidden sm:block" /> Razorpay
                        </span>
                        <span className="text-xs text-gray-500">Pay in ₹</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('ESEWA')}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-colors ${
                          paymentMethod === 'ESEWA'
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-200 hover:border-green-300 text-gray-700'
                        }`}
                      >
                        <span className="flex items-center gap-2 text-sm sm:text-base font-medium">
                          <FaMobileAlt className="hidden sm:block" /> eSewa
                        </span>
                        <span className="text-xs text-gray-500">Pay in NPR</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Have a coupon?</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Enter code"
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        onClick={handleApplyCoupon}
                        className="px-3 sm:px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                      >
                        Apply
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleConfirmBooking}
                    disabled={bookingLoading || selectedSeats.length === 0}
                    className={`w-full py-3 rounded-lg text-sm sm:text-base font-semibold transition-colors ${
                      bookingLoading
                        ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow'
                    }`}
                  >
                    {bookingLoading ? 'Processing...' : 'Confirm Booking'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Bus Photos</h3>
                  <div className="rounded-xl overflow-hidden">
                    <BusImageCarousel
                      images={busInfo.bus.images || []}
                      busName={busInfo.bus.name}
                      heightClass="h-48 sm:h-64 lg:h-72"
                    />
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Route Overview</h3>
                  {renderRoutePath() || (
                    <div className="text-xs sm:text-sm text-gray-500">Route details unavailable.</div>
                  )}
                </div>
              </div>
            )}
          </div>
          </div>
        </div>
      </div>

  {!isMobile && showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 px-3 sm:px-4 py-4 sm:py-6 overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-auto">
            <button
              onClick={handleCloseBookingModal}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 text-gray-400 hover:text-gray-600 text-2xl sm:text-xl font-bold bg-white rounded-full w-8 h-8 flex items-center justify-center"
              aria-label="Close booking modal"
            >
              ×
            </button>

            <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-h-[90vh] overflow-y-auto">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div
                  className={`flex items-center gap-2 sm:gap-3 ${
                    modalStage === 'BOARDING' ? 'text-indigo-600' : 'text-gray-400'
                  }`}
                >
                  <div
                    className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold ${
                      modalStage === 'BOARDING' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    1
                  </div>
                  <span className="text-xs sm:text-sm font-semibold">Boarding & Dropping</span>
                </div>
                <span className="hidden sm:inline text-lg text-gray-300">→</span>
                <div
                  className={`flex items-center gap-2 sm:gap-3 ${
                    modalStage === 'PASSENGER' ? 'text-indigo-600' : 'text-gray-400'
                  }`}
                >
                  <div
                    className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold ${
                      modalStage === 'PASSENGER' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    2
                  </div>
                  <span className="text-xs sm:text-sm font-semibold">Passenger Details</span>
                </div>
              </div>

              {modalStage === 'BOARDING' ? (
                <div className="space-y-6">
                  <div className="text-lg font-semibold text-gray-900">
                    Choose your boarding and dropping points
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-3">Boarding Point</div>
                      <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                        {busInfo?.route.boardingPoints?.length ? (
                          busInfo.route.boardingPoints.map((point) => (
                            <label
                              key={point.id}
                              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                                selectedBoardingPointId === point.id
                                  ? 'border-indigo-500 bg-indigo-50'
                                  : 'border-gray-200 hover:border-indigo-200'
                              }`}
                            >
                              <input
                                type="radio"
                                name="boardingPoint"
                                value={point.id}
                                checked={selectedBoardingPointId === point.id}
                                onChange={() => setSelectedBoardingPointId(point.id)}
                                className="mt-1"
                              />
                              <div>
                                <div className="text-sm font-semibold text-gray-800">{point.name}</div>
                                <div className="text-xs text-gray-500">{point.time}</div>
                                {point.landmark && (
                                  <div className="text-xs text-gray-400 mt-1">{point.landmark}</div>
                                )}
                              </div>
                            </label>
                          ))
                        ) : (
                          <div className="text-sm text-gray-500">No boarding points available.</div>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-3">Dropping Point</div>
                      <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                        {busInfo?.route.droppingPoints?.length ? (
                          busInfo.route.droppingPoints.map((point) => (
                            <label
                              key={point.id}
                              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                                selectedDroppingPointId === point.id
                                  ? 'border-indigo-500 bg-indigo-50'
                                  : 'border-gray-200 hover:border-indigo-200'
                              }`}
                            >
                              <input
                                type="radio"
                                name="droppingPoint"
                                value={point.id}
                                checked={selectedDroppingPointId === point.id}
                                onChange={() => setSelectedDroppingPointId(point.id)}
                                className="mt-1"
                              />
                              <div>
                                <div className="text-sm font-semibold text-gray-800">{point.name}</div>
                                <div className="text-xs text-gray-500">{point.time}</div>
                                {point.landmark && (
                                  <div className="text-xs text-gray-400 mt-1">{point.landmark}</div>
                                )}
                              </div>
                            </label>
                          ))
                        ) : (
                          <div className="text-sm text-gray-500">No dropping points available.</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Seat</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {currentSeatDetails ? currentSeatDetails.seatNumber : 'N/A'}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      Seat {currentSeatStep + 1} of {selectedSeats.length}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Passenger Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={currentPassengerDetails?.name || ''}
                        onChange={(e) => {
                          if (!currentSeatId) return;
                          const value = e.target.value;
                          setPassengers((prev) => ({
                            ...prev,
                            [currentSeatId]: {
                              name: value,
                              age: prev[currentSeatId]?.age || 0,
                              gender: prev[currentSeatId]?.gender || 'MALE',
                            },
                          }));
                        }}
                        placeholder="Full name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Age <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={120}
                          value={currentPassengerDetails?.age || ''}
                          onChange={(e) => {
                            if (!currentSeatId) return;
                            const value = parseInt(e.target.value, 10) || 0;
                            setPassengers((prev) => ({
                              ...prev,
                              [currentSeatId]: {
                                name: prev[currentSeatId]?.name || '',
                                age: value,
                                gender: prev[currentSeatId]?.gender || 'MALE',
                              },
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="Age"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Gender
                        </label>
                        <select
                          value={currentPassengerDetails?.gender || 'MALE'}
                          onChange={(e) => {
                            if (!currentSeatId) return;
                            const value = e.target.value as 'MALE' | 'FEMALE' | 'OTHER';
                            setPassengers((prev) => ({
                              ...prev,
                              [currentSeatId]: {
                                name: prev[currentSeatId]?.name || '',
                                age: prev[currentSeatId]?.age || 0,
                                gender: value,
                              },
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {modalError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                  {modalError}
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <button
                  onClick={handlePassengerBack}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 font-medium"
                >
                  {modalStage === 'BOARDING' ? 'Cancel' : 'Back'}
                </button>
                <button
                  onClick={modalStage === 'BOARDING' ? handleBoardingNext : handlePassengerNext}
                  className="px-5 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow"
                >
                  {modalStage === 'BOARDING'
                    ? 'Next'
                    : currentSeatStep === selectedSeats.length - 1
                    ? 'Finish'
                    : 'Save & Next'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
