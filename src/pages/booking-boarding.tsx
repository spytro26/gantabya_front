import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../lib/api';
import { API_ENDPOINTS } from '../config';
import { UserNavbar } from '../components/UserNavbar';
import {
  FaArrowLeft,
  FaBus,
  FaMapMarkerAlt,
  FaClock,
} from 'react-icons/fa';
import type { BusInfo, Seat, StopPointOption } from '../types/booking';

type BoardingPageState = {
  selectedSeats: string[];
  fromStopId: string;
  toStopId: string;
  searchParams?: any;
  boardingPointId?: string;
  droppingPointId?: string;
};

export function BookingBoardingPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as BoardingPageState) || {};

  const [busInfo, setBusInfo] = useState<BusInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedBoardingPointId, setSelectedBoardingPointId] = useState(
    state.boardingPointId || ''
  );
  const [selectedDroppingPointId, setSelectedDroppingPointId] = useState(
    state.droppingPointId || ''
  );

  const selectedSeats = state.selectedSeats || [];
  const fromStopId = state.fromStopId;
  const toStopId = state.toStopId;

  useEffect(() => {
    if (!tripId || !selectedSeats.length || !fromStopId || !toStopId) {
      navigate(`/book/${tripId ?? ''}`, { replace: true });
      return;
    }

    fetchUnreadCount();
    fetchBusInfo(fromStopId, toStopId);
  }, [tripId, selectedSeats.length, fromStopId, toStopId]);

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
      initializeDefaultPoints(response.data.route.boardingPoints, response.data.route.droppingPoints);
    } catch (err: any) {
      setError(
        err.response?.data?.errorMessage ||
          'Failed to load trip details. Please go back and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaultPoints = (
    boardingPoints: StopPointOption[],
    droppingPoints: StopPointOption[]
  ) => {
    if (!boardingPoints?.length) {
      setSelectedBoardingPointId('');
    } else if (!selectedBoardingPointId) {
      setSelectedBoardingPointId(boardingPoints[0].id);
    }

    if (!droppingPoints?.length) {
      setSelectedDroppingPointId('');
    } else if (!selectedDroppingPointId) {
      setSelectedDroppingPointId(droppingPoints[0].id);
    }
  };

  const allSeats: Seat[] = busInfo
    ? [...busInfo.seats.lowerDeck, ...busInfo.seats.upperDeck]
    : [];

  const getSeatPrice = (seat: Seat): number => {
    if (!busInfo) return 0;

    if (seat.level === 'LOWER' && seat.type === 'SEATER') {
      return Math.abs(
        busInfo.route.toStop.lowerSeaterPrice - busInfo.route.fromStop.lowerSeaterPrice
      );
    }
    if (seat.level === 'LOWER' && seat.type === 'SLEEPER') {
      return Math.abs(
        busInfo.route.toStop.lowerSleeperPrice - busInfo.route.fromStop.lowerSleeperPrice
      );
    }
    if (seat.level === 'UPPER' && seat.type === 'SLEEPER') {
      return Math.abs(
        busInfo.route.toStop.upperSleeperPrice - busInfo.route.fromStop.upperSleeperPrice
      );
    }

    return 0;
  };

  const selectedSeatDetails = selectedSeats
    .map((seatId) => allSeats.find((seat) => seat.id === seatId))
    .filter((seat): seat is Seat => Boolean(seat));

  const totalAmount = selectedSeatDetails.reduce(
    (sum, seat) => sum + getSeatPrice(seat),
    0
  );

  const handleContinue = () => {
    if (!selectedBoardingPointId || !selectedDroppingPointId) {
      alert('Please select both boarding and dropping points to continue.');
      return;
    }

    navigate(`/book/${tripId}/passengers`, {
      state: {
        selectedSeats,
        fromStopId,
        toStopId,
        boardingPointId: selectedBoardingPointId,
        droppingPointId: selectedDroppingPointId,
        searchParams: state.searchParams,
      },
    });
  };

  const handleBackToSeats = () => {
    navigate(`/book/${tripId}`, {
      state: {
        selectedSeats,
        fromStopId,
        toStopId,
        searchParams: state.searchParams,
        boardingPointId: selectedBoardingPointId,
        droppingPointId: selectedDroppingPointId,
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <UserNavbar unreadCount={unreadCount} currentPage="booking" />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading trip details...</p>
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
            <h2 className="text-lg font-semibold text-gray-900">Oops!</h2>
            <p className="mt-2 text-sm text-gray-600">{error || 'Trip information unavailable.'}</p>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <UserNavbar unreadCount={unreadCount} currentPage="booking" />

      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:py-10">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={handleBackToSeats}
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-indigo-600 shadow"
          >
            <FaArrowLeft />
            Back
          </button>
          <div className="text-right">
            <div className="text-xs font-semibold uppercase tracking-wide text-indigo-500">
              Step 1 of 2
            </div>
            <h1 className="text-lg font-bold text-gray-900">Choose boarding & dropping</h1>
          </div>
        </div>

        <div className="mb-5 rounded-3xl bg-white p-5 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-indigo-100 p-2 text-indigo-600">
              <FaBus />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">
                {busInfo.bus.name}
              </div>
              <div className="text-xs text-gray-500">{busInfo.route.fromStop.city} → {busInfo.route.toStop.city}</div>
              <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-500">
                <span className="inline-flex items-center gap-1">
                  <FaClock />
                  {busInfo.route.fromStop.departureTime || '--'}
                </span>
                <span className="inline-flex items-center gap-1">
                  <FaClock />
                  {busInfo.route.toStop.arrivalTime || '--'}
                </span>
                <span className="inline-flex items-center gap-1">
                  Seats selected:
                  <strong className="text-indigo-600">{selectedSeats.length}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-3xl bg-white p-5 shadow-lg">
            <h2 className="text-base font-semibold text-gray-900">Boarding point</h2>
            <p className="mt-1 text-xs text-gray-500">
              Choose where you will board the bus.
            </p>
            <div className="mt-4 space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {busInfo.route.boardingPoints?.length ? (
                busInfo.route.boardingPoints.map((point) => {
                  const isActive = selectedBoardingPointId === point.id;
                  return (
                    <label
                      key={point.id}
                      className={`block cursor-pointer rounded-2xl border p-4 transition-all ${
                        isActive
                          ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                          : 'border-gray-200 hover:border-indigo-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                          <FaMapMarkerAlt className="text-indigo-500" />
                          {point.name}
                        </span>
                        <input
                          type="radio"
                          className="h-4 w-4"
                          checked={isActive}
                          onChange={() => setSelectedBoardingPointId(point.id)}
                        />
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <FaClock />
                          {point.time || '--'}
                        </span>
                        {point.landmark && (
                          <div className="mt-1 text-[11px] text-gray-400">{point.landmark}</div>
                        )}
                      </div>
                    </label>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-300 p-4 text-center text-xs text-gray-400">
                  No boarding points available for this route.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-3xl bg-white p-5 shadow-lg">
            <h2 className="text-base font-semibold text-gray-900">Dropping point</h2>
            <p className="mt-1 text-xs text-gray-500">Select your preferred drop location.</p>
            <div className="mt-4 space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {busInfo.route.droppingPoints?.length ? (
                busInfo.route.droppingPoints.map((point) => {
                  const isActive = selectedDroppingPointId === point.id;
                  return (
                    <label
                      key={point.id}
                      className={`block cursor-pointer rounded-2xl border p-4 transition-all ${
                        isActive
                          ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                          : 'border-gray-200 hover:border-indigo-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                          <FaMapMarkerAlt className="text-indigo-500" />
                          {point.name}
                        </span>
                        <input
                          type="radio"
                          className="h-4 w-4"
                          checked={isActive}
                          onChange={() => setSelectedDroppingPointId(point.id)}
                        />
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <FaClock />
                          {point.time || '--'}
                        </span>
                        {point.landmark && (
                          <div className="mt-1 text-[11px] text-gray-400">{point.landmark}</div>
                        )}
                      </div>
                    </label>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-300 p-4 text-center text-xs text-gray-400">
                  No dropping points available for this route.
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="mt-6 rounded-3xl bg-white p-5 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Selected seats
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedSeatDetails.map((seat) => (
                  <span
                    key={seat.id}
                    className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-700"
                  >
                    {seat.seatNumber}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-wide text-gray-400">Estimated fare</div>
              <div className="text-lg font-bold text-indigo-600">₹{totalAmount}</div>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-gray-500">
              Boarding and dropping details can be edited later before confirming your booking.
            </p>
            <button
              onClick={handleContinue}
              className="w-full sm:w-auto rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-indigo-700"
            >
              Continue to passenger details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
