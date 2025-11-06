import React, { useEffect, useState } from 'react';
import { FaRoute, FaPlus, FaMinus, FaSave, FaCalculator, FaMapMarkerAlt } from 'react-icons/fa';
import AdminLayout from '../components/AdminLayout';
import api from '../lib/api';

interface Bus {
  id: string;
  busNumber: string;
  name: string;
}

interface BoardingPoint {
  id?: string;
  name: string;
  time: string;
  landmark: string;
  address: string;
  pointOrder?: number;
}

interface Stop {
  name: string;
  city: string;
  state: string;
  stopIndex: number;
  arrivalTime: string;
  departureTime: string;
  returnArrivalTime: string;
  returnDepartureTime: string;
  distanceFromOrigin: number;
  priceFromOrigin: number;
  lowerSeaterPrice: number;
  lowerSleeperPrice: number;
  upperSleeperPrice: number;
  boardingPoints: BoardingPoint[];
}

const createEmptyBoardingPoint = (): BoardingPoint => ({
  id: undefined,
  name: '',
  time: '',
  landmark: '',
  address: '',
  pointOrder: 0,
});

const RouteManagement: React.FC = () => {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [selectedBus, setSelectedBus] = useState<string>('');
  const [stops, setStops] = useState<Stop[]>([
    {
      name: '',
      city: '',
      state: '',
      stopIndex: 0,
      arrivalTime: '',
      departureTime: '',
      returnArrivalTime: '',
      returnDepartureTime: '',
      distanceFromOrigin: 0,
      priceFromOrigin: 0,
      lowerSeaterPrice: 0,
      lowerSleeperPrice: 0,
      upperSleeperPrice: 0,
        boardingPoints: [createEmptyBoardingPoint()],
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchBuses();
  }, []);

  useEffect(() => {
    if (selectedBus) {
      fetchBusStops();
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

  const fetchBusStops = async () => {
    try {
      const response = await api.get(`/admin/bus/${selectedBus}/stops`);
      if (response.data.stops.length > 0) {
        setStops(normalizeStops(response.data.stops));
      }
    } catch (err: any) {
      // No stops yet, keep default
    }
  };

  const handleBusChange = (busId: string) => {
    setSelectedBus(busId);
    setStops(
      normalizeStops([
        {
          name: '',
          city: '',
          state: '',
          stopIndex: 0,
          arrivalTime: '',
          departureTime: '',
          returnArrivalTime: '',
          returnDepartureTime: '',
          distanceFromOrigin: 0,
          priceFromOrigin: 0,
          lowerSeaterPrice: 0,
          lowerSleeperPrice: 0,
          upperSleeperPrice: 0,
          boardingPoints: [createEmptyBoardingPoint()],
        },
      ])
    );
  };

  const addStop = () => {
    setStops(
      normalizeStops([
        ...stops,
        {
          name: '',
          city: '',
          state: '',
          stopIndex: stops.length,
          arrivalTime: '',
          departureTime: '',
          returnArrivalTime: '',
          returnDepartureTime: '',
          distanceFromOrigin: 0,
          priceFromOrigin: 0,
          lowerSeaterPrice: 0,
          lowerSleeperPrice: 0,
          upperSleeperPrice: 0,
          boardingPoints: [createEmptyBoardingPoint()],
        },
      ])
    );
  };

  const removeStop = (index: number) => {
    if (stops.length <= 2) {
      alert('Route must have at least 2 stops');
      return;
    }
    setStops(
      normalizeStops(
        stops
          .filter((_, i) => i !== index)
          .map((stop, i) => ({ ...stop, stopIndex: i }))
      )
    );
  };

  const updateStop = (index: number, field: keyof Stop, value: any) => {
    const newStops = [...stops];
    newStops[index] = { ...newStops[index], [field]: value };
    setStops(normalizeStops(newStops));
  };

  const updateBoardingPoint = (
    stopIndex: number,
    pointIndex: number,
    field: keyof BoardingPoint,
    value: string
  ) => {
    const newStops = [...stops];
    const stop = { ...newStops[stopIndex] };
    const points = [...stop.boardingPoints];
    const point = { ...points[pointIndex], [field]: value };
    points[pointIndex] = point;
    stop.boardingPoints = points;
    newStops[stopIndex] = stop;
    setStops(newStops);
  };

  const addBoardingPoint = (stopIndex: number) => {
    const newStops = [...stops];
    const stop = { ...newStops[stopIndex] };
    stop.boardingPoints = [...stop.boardingPoints, createEmptyBoardingPoint()];
    newStops[stopIndex] = stop;
    setStops(normalizeStops(newStops));
  };

  const removeBoardingPoint = (stopIndex: number, pointIndex: number) => {
    const newStops = [...stops];
    const stop = { ...newStops[stopIndex] };
    if (stop.boardingPoints.length <= 1) {
      return;
    }
    stop.boardingPoints = stop.boardingPoints.filter((_, idx) => idx !== pointIndex);
    newStops[stopIndex] = stop;
    setStops(normalizeStops(newStops));
  };

  // Helper to parse number input - returns empty string if invalid, otherwise the number
  const parseNumberInput = (value: string): number => {
    if (value === '' || value === null || value === undefined) {
      return 0;
    }
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  const normalizeStops = (inputStops: Stop[]): Stop[] =>
    inputStops.map((stop, index) => {
      const distance = index === 0 ? 0 : Number(stop.distanceFromOrigin ?? 0);
      const lowerSeater = index === 0 ? 0 : Number(stop.lowerSeaterPrice ?? 0);
      const lowerSleeper = index === 0 ? 0 : Number(stop.lowerSleeperPrice ?? 0);
      const upperSleeper = index === 0 ? 0 : Number(stop.upperSleeperPrice ?? 0);
      const normalizedBoardingPoints = Array.isArray(stop.boardingPoints)
        ? stop.boardingPoints.map((point, pointIndex) => ({
            id: point.id,
            name:
              typeof point.name === 'string' ? point.name.trim() : '',
            time:
              typeof point.time === 'string' ? point.time.trim() : '',
            landmark:
              typeof point.landmark === 'string' ? point.landmark.trim() : '',
            address:
              typeof point.address === 'string' ? point.address.trim() : '',
            pointOrder:
              typeof point.pointOrder === 'number' ? point.pointOrder : pointIndex,
          }))
        : [createEmptyBoardingPoint()];

      if (normalizedBoardingPoints.length === 0) {
        normalizedBoardingPoints.push(createEmptyBoardingPoint());
      }

      return {
        ...stop,
        stopIndex: index,
        distanceFromOrigin: Number.isFinite(distance) ? distance : 0,
        lowerSeaterPrice: Number.isFinite(lowerSeater) ? lowerSeater : 0,
        lowerSleeperPrice: Number.isFinite(lowerSleeper) ? lowerSleeper : 0,
        upperSleeperPrice: Number.isFinite(upperSleeper) ? upperSleeper : 0,
        boardingPoints: normalizedBoardingPoints.map((point, order) => ({
          ...point,
          pointOrder: order,
        })),
        priceFromOrigin:
          index === 0
            ? 0
            : Number.isFinite(lowerSeater)
            ? lowerSeater
            : 0,
      };
    });

  const handleSave = async () => {
    if (!selectedBus) {
      setError('Please select a bus');
      return;
    }

    if (stops.length < 2) {
      setError('Route must have at least 2 stops');
      return;
    }

    const normalizedStops = normalizeStops(stops);

    // Validate all stops
    for (let i = 0; i < normalizedStops.length; i++) {
      const stop = normalizedStops[i];
      
      // Basic validation
      if (!stop.name || !stop.city) {
        setError(`Stop ${i + 1}: Name and city are required`);
        return;
      }
      
      // Time validation
      if (i > 0 && !stop.arrivalTime) {
        setError(`Stop ${i + 1}: Arrival time is required`);
        return;
      }
      if (i < stops.length - 1 && !stop.departureTime) {
        setError(`Stop ${i + 1}: Departure time is required`);
        return;
      }
      
      // Check arrival is after previous departure
      if (i > 0 && stop.arrivalTime && normalizedStops[i - 1].departureTime) {
        if (stop.arrivalTime <= normalizedStops[i - 1].departureTime) {
          setError(`Stop ${i + 1}: Arrival time (${stop.arrivalTime}) must be after Stop ${i}'s departure time (${normalizedStops[i - 1].departureTime})`);
          return;
        }
      }
      
      // Check departure is after arrival for same stop
      if (stop.arrivalTime && stop.departureTime) {
        if (stop.departureTime <= stop.arrivalTime) {
          setError(`Stop ${i + 1}: Departure time (${stop.departureTime}) must be after arrival time (${stop.arrivalTime})`);
          return;
        }
      }

      // Validate seat-type-specific pricing (cumulative from origin)
      if (stop.lowerSeaterPrice < 0 || stop.lowerSleeperPrice < 0 || stop.upperSleeperPrice < 0) {
        setError(`Stop ${i + 1}: Prices cannot be negative`);
        return;
      }

      if (i > 0) {
        // Each stop's prices must be >= previous stop's prices (cumulative)
        if (stop.lowerSeaterPrice < normalizedStops[i - 1].lowerSeaterPrice) {
          setError(`Stop ${i + 1}: Lower Seater price (₹${stop.lowerSeaterPrice}) must be >= previous stop's price (₹${normalizedStops[i - 1].lowerSeaterPrice})`);
          return;
        }
        if (stop.lowerSleeperPrice < normalizedStops[i - 1].lowerSleeperPrice) {
          setError(`Stop ${i + 1}: Lower Sleeper price (₹${stop.lowerSleeperPrice}) must be >= previous stop's price (₹${normalizedStops[i - 1].lowerSleeperPrice})`);
          return;
        }
        if (stop.upperSleeperPrice < normalizedStops[i - 1].upperSleeperPrice) {
          setError(`Stop ${i + 1}: Upper Sleeper price (₹${stop.upperSleeperPrice}) must be >= previous stop's price (₹${normalizedStops[i - 1].upperSleeperPrice})`);
          return;
        }
        if (stop.distanceFromOrigin <= normalizedStops[i - 1].distanceFromOrigin) {
          setError(`Stop ${i + 1}: Distance (${stop.distanceFromOrigin} km) must be greater than previous stop's distance (${normalizedStops[i - 1].distanceFromOrigin} km)`);
          return;
        }
      }

      if (i > 0 && !stop.distanceFromOrigin) {
        setError(`Stop ${i + 1}: Distance from origin is required`);
        return;
      }

      if (!Array.isArray(stop.boardingPoints) || stop.boardingPoints.length === 0) {
        setError(`Stop ${i + 1}: Add at least one boarding point`);
        return;
      }

      for (let j = 0; j < stop.boardingPoints.length; j++) {
        const point = stop.boardingPoints[j];
        if (!point.name) {
          setError(`Stop ${i + 1}: Boarding point ${j + 1} name is required`);
          return;
        }
        if (!point.time) {
          setError(`Stop ${i + 1}: Boarding point ${j + 1} time is required`);
          return;
        }
      }
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.post(`/admin/bus/${selectedBus}/stops`, { stops: normalizedStops });
      setStops(normalizedStops);
      setSuccess('Route saved successfully! Trips are auto-generated, just add holiday exceptions.');
    } catch (err: any) {
      setError(err.response?.data?.errorMessage || 'Failed to save route');
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
            <FaRoute className="text-green-600" />
            <span>Route & Pricing Management</span>
          </h1>
          <p className="text-gray-600 mt-1">
            Set up stops with cumulative pricing. System auto-calculates point-to-point fares.
          </p>
        </div>

        {/* Bus Selector */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Bus <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedBus}
            onChange={(e) => handleBusChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">-- Choose a bus --</option>
            {buses.map((bus) => (
              <option key={bus.id} value={bus.id}>
                {bus.busNumber} - {bus.name}
              </option>
            ))}
          </select>
        </div>

        {/* Pricing Explanation */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <FaCalculator className="text-blue-600 text-xl mt-1" />
            <div className="text-sm text-blue-800 space-y-2">
              <p><strong>Seat-Type-Specific Point-to-Point Pricing:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>Enter <strong>3 cumulative prices from origin</strong> for each stop (Lower Seater, Lower Sleeper, Upper Sleeper)</li>
                <li>System automatically calculates fare for ANY two stops based on seat type</li>
                <li>Example: Stop A (₹0/₹0/₹0) → Stop B (₹500/₹700/₹650) → Stop C (₹1200/₹1500/₹1300)</li>
                <li>User booking Lower Seater B to C pays: ₹1200 - ₹500 = <strong>₹700</strong></li>
                <li>User booking Upper Sleeper B to C pays: ₹1300 - ₹650 = <strong>₹650</strong></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Stops Form */}
        {selectedBus && (
          <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Route Stops</h2>
            </div>

            {/* Stops List with Visual Separation */}
            <div className="space-y-6">
              {stops.map((stop, index) => {
                // Color scheme based on stop position
                const isOrigin = index === 0;
                const isDestination = index === stops.length - 1;
                const isIntermediate = !isOrigin && !isDestination;
                
                let borderColor = 'border-gray-300';
                let bgColor = 'bg-white';
                let iconColor = 'text-gray-600';
                let labelBg = 'bg-gray-100';
                
                if (isOrigin) {
                  borderColor = 'border-green-400';
                  bgColor = 'bg-green-50/30';
                  iconColor = 'text-green-600';
                  labelBg = 'bg-green-100';
                } else if (isDestination) {
                  borderColor = 'border-red-400';
                  bgColor = 'bg-red-50/30';
                  iconColor = 'text-red-600';
                  labelBg = 'bg-red-100';
                } else {
                  borderColor = 'border-blue-400';
                  bgColor = 'bg-blue-50/30';
                  iconColor = 'text-blue-600';
                  labelBg = 'bg-blue-100';
                }

                return (
                  <div key={index} className={`border-2 ${borderColor} ${bgColor} rounded-xl p-6 space-y-4 shadow-sm`}>
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-gray-800 flex items-center space-x-3">
                        <FaMapMarkerAlt className={`${iconColor} text-xl`} />
                        <span className={`px-3 py-1 rounded-lg ${labelBg} text-sm font-semibold`}>
                          Stop {index + 1}{' '}
                          {isOrigin && '(Origin)'}
                          {isDestination && '(Destination)'}
                          {isIntermediate && '(Via)'}
                        </span>
                      </h3>
                      {stops.length > 2 && (
                        <button
                          onClick={() => removeStop(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-100 px-3 py-1 rounded-lg transition flex items-center space-x-1"
                        >
                          <FaMinus />
                          <span className="text-sm font-medium">Remove Stop</span>
                        </button>
                      )}
                    </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stop Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={stop.name}
                      onChange={(e) => updateStop(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="Bus Stand Name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={stop.city}
                      onChange={(e) => updateStop(index, 'city', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="City Name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      value={stop.state}
                      onChange={(e) => updateStop(index, 'state', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="State (Optional)"
                    />
                  </div>

                  {index > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Arrival Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        value={stop.arrivalTime}
                        onChange={(e) => updateStop(index, 'arrivalTime', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  )}

                  {index < stops.length - 1 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Departure Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        value={stop.departureTime}
                        onChange={(e) => updateStop(index, 'departureTime', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  )}
                </div>

                {/* Return Trip Timings */}
                <div className="border-t border-blue-200 pt-4">
                  <h4 className="text-sm font-semibold text-blue-700 mb-3 flex items-center space-x-2">
                    <span>🔄 Return Trip Timings</span>
                    <span className="text-xs font-normal text-gray-600">(Optional - For bidirectional routes)</span>
                  </h4>
                  <p className="text-xs text-gray-600 mb-3">
                    Configure return trip timings to allow buses to run in both directions (e.g., A→B and B→A). Price and distance remain the same.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {index < stops.length - 1 && (
                      <div>
                        <label className="block text-sm font-medium text-blue-700 mb-1">
                          Return Arrival Time
                        </label>
                        <input
                          type="time"
                          value={stop.returnArrivalTime}
                          onChange={(e) => updateStop(index, 'returnArrivalTime', e.target.value)}
                          className="w-full px-3 py-2 border border-blue-300 bg-blue-50 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Return arrival"
                        />
                        <p className="text-xs text-gray-500 mt-1">Arrival time when traveling in reverse</p>
                      </div>
                    )}
                    
                    {index > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-blue-700 mb-1">
                          Return Departure Time
                        </label>
                        <input
                          type="time"
                          value={stop.returnDepartureTime}
                          onChange={(e) => updateStop(index, 'returnDepartureTime', e.target.value)}
                          className="w-full px-3 py-2 border border-blue-300 bg-blue-50 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Return departure"
                        />
                        <p className="text-xs text-gray-500 mt-1">Departure time when traveling in reverse</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Distance from Origin (km)
                    </label>
                    <input
                      type="number"
                      value={index === 0 ? 0 : stop.distanceFromOrigin > 0 ? stop.distanceFromOrigin : ''}
                      onChange={(e) => updateStop(index, 'distanceFromOrigin', parseNumberInput(e.target.value))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${index === 0 ? 'border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed' : 'border-gray-300'}`}
                      placeholder={index === 0 ? 'Origin auto-set to 0 km' : 'Enter distance (e.g., 150)'}
                      min="0"
                      step="0.1"
                      disabled={index === 0}
                    />
                    {index === 0 && (
                      <p className="text-xs text-gray-500 mt-1">Origin distance is always 0 km.</p>
                    )}
                  </div>
                </div>

                {/* Boarding Points */}
                <div className="border-t border-green-200 pt-4 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-semibold text-green-700">🚌 Boarding Points</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Add one or more pickup locations for this stop. Drop location for passengers will use the boarding point of their destination stop automatically.
                      </p>
                    </div>
                    <button
                      onClick={() => addBoardingPoint(index)}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                    >
                      <FaPlus className="text-sm" />
                      <span>Add Boarding Point</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {stop.boardingPoints.map((point, pointIndex) => (
                      <div key={point.id || pointIndex} className="border border-green-100 rounded-lg p-4 bg-green-50/40">
                        <div className="flex justify-between items-center mb-4">
                          <h5 className="text-sm font-semibold text-green-700">
                            Boarding Point {pointIndex + 1}
                          </h5>
                          {stop.boardingPoints.length > 1 && (
                            <button
                              onClick={() => removeBoardingPoint(index, pointIndex)}
                              className="text-red-600 text-xs font-semibold hover:text-red-700 flex items-center space-x-1"
                            >
                              <FaMinus />
                              <span>Remove</span>
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={point.name}
                              onChange={(e) => updateBoardingPoint(index, pointIndex, 'name', e.target.value)}
                              className="w-full px-3 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500"
                              placeholder="e.g., Baner Orange Square"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Time <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="time"
                              value={point.time}
                              onChange={(e) => updateBoardingPoint(index, pointIndex, 'time', e.target.value)}
                              className="w-full px-3 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Landmark
                            </label>
                            <input
                              type="text"
                              value={point.landmark}
                              onChange={(e) => updateBoardingPoint(index, pointIndex, 'landmark', e.target.value)}
                              className="w-full px-3 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500"
                              placeholder="Near Metro Station"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Address
                            </label>
                            <textarea
                              value={point.address}
                              onChange={(e) => updateBoardingPoint(index, pointIndex, 'address', e.target.value)}
                              className="w-full px-3 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500"
                              placeholder="Full pickup address"
                              rows={3}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Seat-Type-Specific Pricing */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    💺 Cumulative Pricing by Seat Type <span className="text-red-500">*</span>
                  </h4>
                  <p className="text-xs text-gray-600 mb-3">
                    Enter cumulative prices from origin for each seat type. System calculates point-to-point fares automatically.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-1">
                        Lower Seater (₹) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={index === 0 ? 0 : stop.lowerSeaterPrice > 0 ? stop.lowerSeaterPrice : ''}
                        onChange={(e) => updateStop(index, 'lowerSeaterPrice', parseNumberInput(e.target.value))}
                        className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold ${
                          index === 0
                            ? 'border-blue-200 bg-blue-50 text-gray-500 cursor-not-allowed'
                            : 'border-blue-300 bg-blue-50'
                        }`}
                        placeholder={index === 0 ? 'Origin auto-set to ₹0' : 'e.g., 500'}
                        min="0"
                        step="0.01"
                        disabled={index === 0}
                      />
                      <p className="text-xs text-gray-500 mt-1">Lower deck seater cumulative price</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-purple-700 mb-1">
                        Lower Sleeper (₹) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={index === 0 ? 0 : stop.lowerSleeperPrice > 0 ? stop.lowerSleeperPrice : ''}
                        onChange={(e) => updateStop(index, 'lowerSleeperPrice', parseNumberInput(e.target.value))}
                        className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 font-semibold ${
                          index === 0
                            ? 'border-purple-200 bg-purple-50 text-gray-500 cursor-not-allowed'
                            : 'border-purple-300 bg-purple-50'
                        }`}
                        placeholder={index === 0 ? 'Origin auto-set to ₹0' : 'e.g., 700'}
                        min="0"
                        step="0.01"
                        disabled={index === 0}
                      />
                      <p className="text-xs text-gray-500 mt-1">Lower deck sleeper cumulative price</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-orange-700 mb-1">
                        Upper Sleeper (₹) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={index === 0 ? 0 : stop.upperSleeperPrice > 0 ? stop.upperSleeperPrice : ''}
                        onChange={(e) => updateStop(index, 'upperSleeperPrice', parseNumberInput(e.target.value))}
                        className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 font-semibold ${
                          index === 0
                            ? 'border-orange-200 bg-orange-50 text-gray-500 cursor-not-allowed'
                            : 'border-orange-300 bg-orange-50'
                        }`}
                        placeholder={index === 0 ? 'Origin auto-set to ₹0' : 'e.g., 650'}
                        min="0"
                        step="0.01"
                        disabled={index === 0}
                      />
                      <p className="text-xs text-gray-500 mt-1">Upper deck sleeper cumulative price</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
            </div>

            {/* Add Stop Button - After all stops */}
            <div className="flex justify-center pt-4">
              <button
                onClick={addStop}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg flex items-center space-x-2 font-semibold"
              >
                <FaPlus className="text-lg" />
                <span>Add Another Stop After {stops[stops.length - 1]?.city || 'Destination'}</span>
              </button>
            </div>

            {/* Messages - Above Save Button */}
            {error && (
              <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-lg font-medium">
                ⚠️ {error}
              </div>
            )}
            {success && (
              <div className="bg-green-100 border-2 border-green-400 text-green-700 px-4 py-3 rounded-lg font-medium">
                ✅ {success}
              </div>
            )}

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={loading || !selectedBus}
              className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg"
            >
              <FaSave className="text-xl" />
              <span>{loading ? 'Saving Route...' : 'Save Complete Route & Pricing'}</span>
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default RouteManagement;
