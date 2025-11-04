import React, { useEffect, useState } from 'react';
import { FaWifi, FaBolt, FaSnowflake, FaToilet, FaBed, FaTint, FaCookie, FaTv, FaSave } from 'react-icons/fa';
import AdminLayout from '../components/AdminLayout';
import api from '../lib/api';

interface Bus {
  id: string;
  busNumber: string;
  name: string;
}

interface Amenities {
  hasWifi: boolean;
  hasCharging: boolean;
  hasAC: boolean;
  hasRestroom: boolean;
  hasBlanket: boolean;
  hasWaterBottle: boolean;
  hasSnacks: boolean;
  hasTV: boolean;
}

const AmenityManagement: React.FC = () => {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [selectedBus, setSelectedBus] = useState<string>('');
  const [amenities, setAmenities] = useState<Amenities>({
    hasWifi: false,
    hasCharging: false,
    hasAC: true,
    hasRestroom: false,
    hasBlanket: false,
    hasWaterBottle: false,
    hasSnacks: false,
    hasTV: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchBuses();
  }, []);

  useEffect(() => {
    if (selectedBus) {
      fetchAmenities();
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

  const fetchAmenities = async () => {
    try {
      const response = await api.get(`/admin/bus/${selectedBus}/amenities`);
      setAmenities(response.data.amenities);
    } catch (err: any) {
      // No amenities yet, use defaults
      setAmenities({
        hasWifi: false,
        hasCharging: false,
        hasAC: true,
        hasRestroom: false,
        hasBlanket: false,
        hasWaterBottle: false,
        hasSnacks: false,
        hasTV: false,
      });
    }
  };

  const handleToggle = (key: keyof Amenities) => {
    setAmenities((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    if (!selectedBus) {
      alert('Please select a bus');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.post(`/admin/bus/${selectedBus}/amenities`, amenities);
      setSuccess('Amenities updated successfully!');
    } catch (err: any) {
      setError(err.response?.data?.errorMessage || 'Failed to update amenities');
    } finally {
      setLoading(false);
    }
  };

  const amenityList = [
    { key: 'hasWifi' as keyof Amenities, label: 'WiFi', icon: FaWifi, color: 'blue' },
    { key: 'hasCharging' as keyof Amenities, label: 'Charging Ports', icon: FaBolt, color: 'yellow' },
    { key: 'hasAC' as keyof Amenities, label: 'Air Conditioning', icon: FaSnowflake, color: 'cyan' },
    { key: 'hasRestroom' as keyof Amenities, label: 'Restroom', icon: FaToilet, color: 'purple' },
    { key: 'hasBlanket' as keyof Amenities, label: 'Blankets', icon: FaBed, color: 'pink' },
    { key: 'hasWaterBottle' as keyof Amenities, label: 'Water Bottles', icon: FaTint, color: 'blue' },
    { key: 'hasSnacks' as keyof Amenities, label: 'Snacks', icon: FaCookie, color: 'orange' },
    { key: 'hasTV' as keyof Amenities, label: 'TV/Entertainment', icon: FaTv, color: 'indigo' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center space-x-3">
            <FaWifi className="text-blue-600" />
            <span>Amenities Management</span>
          </h1>
          <p className="text-gray-600 mt-1">Configure amenities for each bus</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">{error}</div>
        )}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">{success}</div>
        )}

        <div className="bg-white rounded-xl shadow-md p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Bus <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedBus}
            onChange={(e) => setSelectedBus(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Choose a bus --</option>
            {buses.map((bus) => (
              <option key={bus.id} value={bus.id}>
                {bus.busNumber} - {bus.name}
              </option>
            ))}
          </select>
        </div>

        {selectedBus && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Toggle Amenities</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {amenityList.map((amenity) => {
                const Icon = amenity.icon;
                const isActive = amenities[amenity.key];
                return (
                  <button
                    key={amenity.key}
                    onClick={() => handleToggle(amenity.key)}
                    className={`p-6 rounded-xl border-2 transition ${
                      isActive
                        ? `bg-${amenity.color}-50 border-${amenity.color}-400`
                        : 'bg-gray-50 border-gray-300'
                    } hover:shadow-lg`}
                  >
                    <div className="flex flex-col items-center space-y-3">
                      <Icon
                        className={`text-4xl ${
                          isActive ? `text-${amenity.color}-600` : 'text-gray-400'
                        }`}
                      />
                      <span className={`font-semibold ${isActive ? 'text-gray-800' : 'text-gray-500'}`}>
                        {amenity.label}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          isActive ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                        }`}
                      >
                        {isActive ? 'ENABLED' : 'DISABLED'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full mt-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <FaSave />
              <span>{loading ? 'Saving...' : 'Save Amenities'}</span>
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AmenityManagement;
