import React, { useEffect, useState } from 'react';
import { FaRoute, FaPlus, FaMinus, FaSave, FaCalculator, FaMapMarkerAlt } from 'react-icons/fa';
import AdminLayout from '../components/AdminLayout';
import api from '../lib/api';

interface Bus {
  id: string;
  busNumber: string;
  name: string;
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
}

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
        setStops(response.data.stops);
      }
    } catch (err: any) {
      // No stops yet, keep default
    }
  };

  const handleBusChange = (busId: string) => {
    setSelectedBus(busId);
    setStops([
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
      },
    ]);
  };

  const addStop = () => {
    setStops([
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
      },
    ]);
  };

  const removeStop = (index: number) => {
    if (stops.length <= 2) {
      alert('Route must have at least 2 stops');
      return;
    }
    setStops(stops.filter((_, i) => i !== index).map((stop, i) => ({ ...stop, stopIndex: i })));
  };

  const updateStop = (index: number, field: keyof Stop, value: any) => {
    const newStops = [...stops];
    newStops[index] = { ...newStops[index], [field]: value };
    setStops(newStops);
  };

  // Helper to parse number input - returns empty string if invalid, otherwise the number
  const parseNumberInput = (value: string): number => {
    if (value === '' || value === null || value === undefined) {
      return 0;
    }
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  const handleSave = async () => {
    if (!selectedBus) {
      setError('Please select a bus');
      return;
    }

    if (stops.length < 2) {
      setError('Route must have at least 2 stops');
      return;
    }

    // Validate all stops
    for (let i = 0; i < stops.length; i++) {
      const stop = stops[i];
      
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
      if (i > 0 && stop.arrivalTime && stops[i - 1].departureTime) {
        if (stop.arrivalTime <= stops[i - 1].departureTime) {
          setError(`Stop ${i + 1}: Arrival time (${stop.arrivalTime}) must be after Stop ${i}'s departure time (${stops[i - 1].departureTime})`);
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
        if (stop.lowerSeaterPrice < stops[i - 1].lowerSeaterPrice) {
          setError(`Stop ${i + 1}: Lower Seater price (₹${stop.lowerSeaterPrice}) must be >= previous stop's price (₹${stops[i - 1].lowerSeaterPrice})`);
          return;
        }
        if (stop.lowerSleeperPrice < stops[i - 1].lowerSleeperPrice) {
          setError(`Stop ${i + 1}: Lower Sleeper price (₹${stop.lowerSleeperPrice}) must be >= previous stop's price (₹${stops[i - 1].lowerSleeperPrice})`);
          return;
        }
        if (stop.upperSleeperPrice < stops[i - 1].upperSleeperPrice) {
          setError(`Stop ${i + 1}: Upper Sleeper price (₹${stop.upperSleeperPrice}) must be >= previous stop's price (₹${stops[i - 1].upperSleeperPrice})`);
          return;
        }
      }
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.post(`/admin/bus/${selectedBus}/stops`, { stops });
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

        {/* Messages */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

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
              <button
                onClick={addStop}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center space-x-2"
              >
                <FaPlus />
                <span>Add Stop</span>
              </button>
            </div>

            {stops.map((stop, index) => (
              <div key={index} className="border-2 border-gray-200 rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-gray-700 flex items-center space-x-2">
                    <FaMapMarkerAlt className={index === 0 ? 'text-green-600' : index === stops.length - 1 ? 'text-red-600' : 'text-blue-600'} />
                    <span>
                      Stop {index + 1}{' '}
                      {index === 0 && '(Origin)'}
                      {index === stops.length - 1 && '(Destination)'}
                    </span>
                  </h3>
                  {stops.length > 2 && (
                    <button
                      onClick={() => removeStop(index)}
                      className="text-red-600 hover:text-red-700 flex items-center space-x-1"
                    >
                      <FaMinus />
                      <span className="text-sm">Remove</span>
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
                      value={stop.distanceFromOrigin === 0 ? '' : stop.distanceFromOrigin}
                      onChange={(e) => updateStop(index, 'distanceFromOrigin', parseNumberInput(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="Enter distance (e.g., 150)"
                      min="0"
                      step="0.1"
                    />
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
                        value={stop.lowerSeaterPrice === 0 ? '' : stop.lowerSeaterPrice}
                        onChange={(e) => updateStop(index, 'lowerSeaterPrice', parseNumberInput(e.target.value))}
                        className="w-full px-3 py-2 border-2 border-blue-300 bg-blue-50 rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold"
                        placeholder="e.g., 500"
                        min="0"
                        step="0.01"
                      />
                      <p className="text-xs text-gray-500 mt-1">Lower deck seater cumulative price</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-purple-700 mb-1">
                        Lower Sleeper (₹) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={stop.lowerSleeperPrice === 0 ? '' : stop.lowerSleeperPrice}
                        onChange={(e) => updateStop(index, 'lowerSleeperPrice', parseNumberInput(e.target.value))}
                        className="w-full px-3 py-2 border-2 border-purple-300 bg-purple-50 rounded-lg focus:ring-2 focus:ring-purple-500 font-semibold"
                        placeholder="e.g., 700"
                        min="0"
                        step="0.01"
                      />
                      <p className="text-xs text-gray-500 mt-1">Lower deck sleeper cumulative price</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-orange-700 mb-1">
                        Upper Sleeper (₹) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={stop.upperSleeperPrice === 0 ? '' : stop.upperSleeperPrice}
                        onChange={(e) => updateStop(index, 'upperSleeperPrice', parseNumberInput(e.target.value))}
                        className="w-full px-3 py-2 border-2 border-orange-300 bg-orange-50 rounded-lg focus:ring-2 focus:ring-orange-500 font-semibold"
                        placeholder="e.g., 650"
                        min="0"
                        step="0.01"
                      />
                      <p className="text-xs text-gray-500 mt-1">Upper deck sleeper cumulative price</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={handleSave}
              disabled={loading || !selectedBus}
              className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              <FaSave />
              <span>{loading ? 'Saving...' : 'Save Route & Pricing'}</span>
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default RouteManagement;
