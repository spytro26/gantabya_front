import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../lib/api';
import { API_ENDPOINTS } from '../config';
import { UserNavbar } from '../components/UserNavbar';
import { roundToTwo, formatAmount } from '../utils/currency';
import {
  FaArrowLeft,
  FaUser,
  FaTicketAlt,
  FaMapMarkerAlt,
  FaClock,
} from 'react-icons/fa';
import type { BusInfo, Seat } from '../types/booking';

type PassengerPageState = {
  selectedSeats: string[];
  fromStopId: string;
  toStopId: string;
  boardingPointId: string;
  droppingPointId: string;
  searchParams?: any;
};

type PassengerForm = {
  name: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
};

export function BookingPassengerPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as PassengerPageState) || {};

  const [busInfo, setBusInfo] = useState<BusInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [passengers, setPassengers] = useState<Record<string, PassengerForm>>({});
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  const selectedSeats = state.selectedSeats || [];
  const fromStopId = state.fromStopId;
  const toStopId = state.toStopId;
  const boardingPointId = state.boardingPointId;
  const droppingPointId = state.droppingPointId;

  useEffect(() => {
    if (
      !tripId ||
      !selectedSeats.length ||
      !fromStopId ||
      !toStopId ||
      !boardingPointId ||
      !droppingPointId
    ) {
      navigate(`/book/${tripId ?? ''}`, { replace: true });
      return;
    }

    fetchUnreadCount();
    fetchBusInfo(fromStopId, toStopId);
  }, [tripId, selectedSeats.length, fromStopId, toStopId, boardingPointId, droppingPointId]);

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.UNREAD_COUNT);
      setUnreadCount(response.data.unreadCount);
    } catch (err) {
      console.error('Failed to fetch notifications');
    }
  };

  const fetchBusInfo = async (fromId: string, toId: string) => {
    if (!tripId) return;

    setLoading(true);
    setError('');
    try {
      const response = await api.get(
        `/user/showbusinfo/${tripId}?fromStopId=${fromId}&toStopId=${toId}`
      );
      setBusInfo(response.data);
      initializePassengerForms(response.data);
    } catch (err: any) {
      setError(
        err.response?.data?.errorMessage ||
          'Failed to load passenger form. Please go back and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const initializePassengerForms = (info: BusInfo) => {
    const allSeats = [...info.seats.lowerDeck, ...info.seats.upperDeck];
    const initialPassengers: Record<string, PassengerForm> = {};

    selectedSeats.forEach((seatId) => {
      const seatExists = allSeats.some((seat) => seat.id === seatId);
      if (!seatExists) {
        return;
      }
      initialPassengers[seatId] = {
        name: '',
        age: 0,
        gender: 'MALE',
      };
    });

    setPassengers(initialPassengers);
  };

  const getSeatPrice = (seat: Seat): number => {
    if (!busInfo) return 0;

    if (seat.level === 'LOWER' && seat.type === 'SEATER') {
      return roundToTwo(
        Math.abs(
          busInfo.route.toStop.lowerSeaterPrice -
            busInfo.route.fromStop.lowerSeaterPrice
        )
      );
    }
    if (seat.level === 'LOWER' && seat.type === 'SLEEPER') {
      return roundToTwo(
        Math.abs(
          busInfo.route.toStop.lowerSleeperPrice -
            busInfo.route.fromStop.lowerSleeperPrice
        )
      );
    }
    if (seat.level === 'UPPER' && seat.type === 'SLEEPER') {
      return roundToTwo(
        Math.abs(
          busInfo.route.toStop.upperSleeperPrice -
            busInfo.route.fromStop.upperSleeperPrice
        )
      );
    }

    return 0;
  };

  const allSeats: Seat[] = busInfo
    ? [...busInfo.seats.lowerDeck, ...busInfo.seats.upperDeck]
    : [];

  const selectedSeatDetails = selectedSeats
    .map((seatId) => allSeats.find((seat) => seat.id === seatId))
    .filter((seat): seat is Seat => Boolean(seat));

  const baseAmount = roundToTwo(
    selectedSeatDetails.reduce(
      (sum, seat) => roundToTwo(sum + getSeatPrice(seat)),
      0
    )
  );
  const discountAmount = roundToTwo(appliedCoupon?.discountAmount ?? 0);
  const totalAmount = roundToTwo(
    appliedCoupon?.finalAmount !== undefined ? appliedCoupon.finalAmount : baseAmount
  );

  const handleApplyCoupon = async () => {
    const trimmedCode = couponCode.trim().toUpperCase();

    if (!trimmedCode || !tripId) return;

    if (baseAmount <= 0) {
      alert('Please select seats before applying a coupon.');
      return;
    }

    try {
      const response = await api.post('/user/booking/apply-coupon', {
        code: trimmedCode,
        tripId,
        totalAmount: roundToTwo(baseAmount),
      });

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
    if (!tripId) return;

    for (const seatId of selectedSeats) {
      const passenger = passengers[seatId];
      if (!passenger || !passenger.name.trim() || !passenger.age || passenger.age < 1) {
        alert('Please fill valid passenger details for each seat.');
        return;
      }
    }

    setBookingLoading(true);
    try {
      const passengersArray = selectedSeats.map((seatId) => ({
        seatId,
        name: passengers[seatId].name.trim(),
        age: passengers[seatId].age,
        gender: passengers[seatId].gender,
      }));

      await api.post(API_ENDPOINTS.BOOK_TICKET, {
        tripId,
        fromStopId,
        toStopId,
        seatIds: selectedSeats,
        passengers: passengersArray,
        boardingPointId,
        droppingPointId,
        couponCode: appliedCoupon?.code || undefined,
      });

      alert('Booking confirmed successfully!');
      navigate('/my-bookings');
    } catch (err: any) {
      alert(err.response?.data?.errorMessage || 'Booking failed. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <UserNavbar unreadCount={unreadCount} currentPage="booking" />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Preparing passenger forms...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !busInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <UserNavbar unreadCount={unreadCount} currentPage="booking" />
        <div className="flex flex-1 items-center justify-center px-4">
          <div className="max-w-md rounded-2xl bg-white p-6 text-center shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900">Something went wrong</h2>
            <p className="mt-2 text-sm text-gray-600">{error || 'Unable to load passenger details.'}</p>
            <button
              onClick={() => navigate(`/book/${tripId}`)}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700"
            >
              <FaArrowLeft />
              Back to seats
            </button>
          </div>
        </div>
      </div>
    );
  }

  const boardingPoint = busInfo.route.boardingPoints.find((point) => point.id === boardingPointId);
  const droppingPoint = busInfo.route.droppingPoints.find((point) => point.id === droppingPointId);

  const handleBackToBoarding = () => {
    navigate(`/book/${tripId}/boarding`, {
      state: {
        selectedSeats,
        fromStopId,
        toStopId,
        boardingPointId,
        droppingPointId,
        searchParams: state.searchParams,
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <UserNavbar unreadCount={unreadCount} currentPage="booking" />

      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:py-10">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={handleBackToBoarding}
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-indigo-600 shadow"
          >
            <FaArrowLeft />
            Back
          </button>
          <div className="text-right">
            <div className="text-xs font-semibold uppercase tracking-wide text-indigo-500">
              Step 2 of 2
            </div>
            <h1 className="text-lg font-bold text-gray-900">Passenger details & confirmation</h1>
          </div>
        </div>

        <div className="mb-6 rounded-3xl bg-white p-5 shadow-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-400">Route</div>
              <div className="text-sm font-semibold text-gray-900">
                {busInfo.route.fromStop.city} → {busInfo.route.toStop.city}
              </div>
              <div className="mt-1 flex flex-wrap gap-4 text-xs text-gray-500">
                <span className="inline-flex items-center gap-1">
                  <FaClock />
                  {busInfo.route.fromStop.departureTime || '--'}
                </span>
                <span className="inline-flex items-center gap-1">
                  <FaClock />
                  {busInfo.route.toStop.arrivalTime || '--'}
                </span>
              </div>
            </div>
            <div className="rounded-2xl bg-indigo-50 px-4 py-3 text-sm text-indigo-700 shadow-inner">
              <div className="flex items-center gap-2 font-semibold">
                <FaTicketAlt />
                Total Fare
              </div>
              <div className="mt-1 text-lg font-bold text-indigo-600">₹{formatAmount(totalAmount)}</div>
              {appliedCoupon && (
                <div className="text-xs text-green-600">Saved ₹{formatAmount(discountAmount)}</div>
              )}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 text-xs text-gray-500">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Boarding</div>
              <div className="mt-1 text-sm font-semibold text-gray-900">
                {boardingPoint?.name || 'N/A'}
              </div>
              <div className="mt-1 inline-flex items-center gap-1">
                <FaMapMarkerAlt className="text-indigo-500" />
                {boardingPoint?.landmark || '--'}
              </div>
              <div className="mt-1 inline-flex items-center gap-1">
                <FaClock className="text-indigo-500" />
                {boardingPoint?.time || '--'}
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Dropping</div>
              <div className="mt-1 text-sm font-semibold text-gray-900">
                {droppingPoint?.name || 'N/A'}
              </div>
              <div className="mt-1 inline-flex items-center gap-1">
                <FaMapMarkerAlt className="text-indigo-500" />
                {droppingPoint?.landmark || '--'}
              </div>
              <div className="mt-1 inline-flex items-center gap-1">
                <FaClock className="text-indigo-500" />
                {droppingPoint?.time || '--'}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {selectedSeatDetails.map((seat) => {
            const passenger = passengers[seat.id] || {
              name: '',
              age: 0,
              gender: 'MALE' as const,
            };

            return (
              <div key={seat.id} className="rounded-3xl bg-white p-5 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-gray-900">
                    Seat {seat.seatNumber} • {seat.level} {seat.type}
                  </div>
                  <div className="text-sm font-semibold text-indigo-600">₹{formatAmount(getSeatPrice(seat))}</div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Passenger Name
                    </label>
                    <div className="mt-2 flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2">
                      <FaUser className="text-gray-400" />
                      <input
                        type="text"
                        value={passenger.name}
                        onChange={(event) =>
                          setPassengers((prev) => ({
                            ...prev,
                            [seat.id]: {
                              ...prev[seat.id],
                              name: event.target.value,
                            },
                          }))
                        }
                        placeholder="Full name as per ID"
                        className="w-full bg-transparent text-sm text-gray-800 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Age
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={120}
                      value={passenger.age || ''}
                      onChange={(event) =>
                        setPassengers((prev) => ({
                          ...prev,
                          [seat.id]: {
                            ...prev[seat.id],
                            age: parseInt(event.target.value || '0', 10),
                          },
                        }))
                      }
                      className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                      placeholder="Age"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Gender
                    </label>
                    <select
                      value={passenger.gender}
                      onChange={(event) =>
                        setPassengers((prev) => ({
                          ...prev,
                          [seat.id]: {
                            ...prev[seat.id],
                            gender: event.target.value as PassengerForm['gender'],
                          },
                        }))
                      }
                      className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 rounded-3xl bg-white p-5 shadow-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="sm:w-2/3">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Have a coupon?
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
                  placeholder="Enter coupon code"
                  className="flex-1 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
                <button
                  onClick={handleApplyCoupon}
                  className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-100"
                >
                  Apply
                </button>
              </div>
              {appliedCoupon && (
                <div className="mt-2 text-xs text-green-600">
                  Coupon {appliedCoupon.code} applied! You saved ₹{formatAmount(discountAmount)}.
                </div>
              )}
            </div>
            <div className="sm:text-right">
              <div className="text-xs uppercase tracking-wide text-gray-400">Total amount</div>
              <div className="text-2xl font-bold text-indigo-600">₹{formatAmount(totalAmount)}</div>
              {appliedCoupon && (
                <div className="text-xs text-gray-500">Discount applied: ₹{formatAmount(discountAmount)}</div>
              )}
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-gray-500">
              By confirming, you agree to the cancellation policy and terms of service.
            </p>
            <button
              onClick={handleConfirmBooking}
              disabled={bookingLoading}
              className={`w-full sm:w-auto rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg transition-colors ${
                bookingLoading
                  ? 'bg-gray-300 text-gray-500'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {bookingLoading ? 'Processing...' : 'Confirm booking'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
