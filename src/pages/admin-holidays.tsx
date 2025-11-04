import React, { useEffect, useState } from 'react';
import { FaCalendarTimes, FaPlus, FaTrash } from 'react-icons/fa';
import AdminLayout from '../components/AdminLayout';
import api from '../lib/api';

interface Bus {
  id: string;
  busNumber: string;
  name: string;
}

interface Holiday {
  id: string;
  date: string;
  reason: string | null;
  createdAt: string;
}

const HolidayManagement: React.FC = () => {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [selectedBus, setSelectedBus] = useState<string>('');
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchBuses();
  }, []);

  useEffect(() => {
    if (selectedBus) {
      fetchHolidays();
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

  const fetchHolidays = async () => {
    if (!selectedBus) return;
    try {
      const response = await api.get(`/admin/bus/${selectedBus}/holidays`);
      setHolidays(response.data.holidays || []);
    } catch (err: any) {
      setError('Failed to load holidays');
    }
  };

  const handleBusChange = (busId: string) => {
    setSelectedBus(busId);
    setHolidays([]);
    setSelectedDates([]);
    setReason('');
    setError('');
    setSuccess('');
  };

  const handleDateToggle = (date: string) => {
    if (selectedDates.includes(date)) {
      setSelectedDates(selectedDates.filter(d => d !== date));
    } else {
      setSelectedDates([...selectedDates, date]);
    }
  };

  const handleAddHolidays = async () => {
    if (!selectedBus) {
      setError('Please select a bus');
      return;
    }

    if (selectedDates.length === 0) {
      setError('Please select at least one date');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.post(`/admin/bus/${selectedBus}/holidays`, {
        dates: selectedDates,
        reason: reason || null,
      });
      setSuccess(`Added ${selectedDates.length} holiday(s) successfully!`);
      setSelectedDates([]);
      setReason('');
      await fetchHolidays();
    } catch (err: any) {
      setError(err.response?.data?.errorMessage || 'Failed to add holidays');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHoliday = async (holidayId: string) => {
    if (!confirm('Are you sure you want to delete this holiday?')) {
      return;
    }

    try {
      await api.delete(`/admin/holiday/${holidayId}`);
      setSuccess('Holiday deleted successfully!');
      await fetchHolidays();
    } catch (err: any) {
      setError(err.response?.data?.errorMessage || 'Failed to delete holiday');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center space-x-3">
            <FaCalendarTimes className="text-red-600" />
            <span>Holiday Management</span>
          </h1>
          <p className="text-gray-600 mt-1">
            Mark dates when buses don't run. Trips are auto-generated for all other dates.
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

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm text-blue-800 space-y-2">
            <p><strong>How It Works:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>By default, all buses run every day (trips auto-created when users search)</li>
              <li>Add holidays to mark specific dates when a bus won't run</li>
              <li>Users won't see that bus when searching for trips on holiday dates</li>
              <li>Use this for festivals, maintenance, or any other exceptions</li>
            </ul>
          </div>
        </div>

        {/* Bus Selector */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Bus <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedBus}
            onChange={(e) => handleBusChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="">-- Choose a bus --</option>
            {buses.map((bus) => (
              <option key={bus.id} value={bus.id}>
                {bus.busNumber} - {bus.name}
              </option>
            ))}
          </select>
        </div>

        {/* Add Holidays Form */}
        {selectedBus && (
          <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Add Holidays</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => {
                    const dateStr = e.target.value;
                    if (dateStr && !holidays.some(h => h.date.split('T')[0] === dateStr)) {
                      handleDateToggle(dateStr);
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                {selectedDates.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Selected Dates:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedDates.map((dateStr) => (
                        <div
                          key={dateStr}
                          className="inline-flex items-center bg-red-100 text-red-800 px-3 py-1 rounded-lg text-sm"
                        >
                          <span>
                            {new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                          <button
                            onClick={() => handleDateToggle(dateStr)}
                            className="ml-2 text-red-600 hover:text-red-800 font-bold"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Select dates from the calendar. You can add multiple dates.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason (Optional)
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder="e.g., Diwali, Maintenance, etc."
                />
              </div>

              {selectedDates.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Selected:</strong> {selectedDates.length} date(s)
                  </p>
                </div>
              )}

              <button
                onClick={handleAddHolidays}
                disabled={loading || selectedDates.length === 0}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                <FaPlus />
                <span>{loading ? 'Adding...' : `Add ${selectedDates.length || ''} Holiday(s)`}</span>
              </button>
            </div>
          </div>
        )}

        {/* Existing Holidays List */}
        {selectedBus && holidays.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-800">Existing Holidays ({holidays.length})</h2>
            <div className="space-y-2">
              {holidays.map((holiday) => (
                <div
                  key={holiday.id}
                  className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  <div>
                    <p className="font-semibold text-gray-800">
                      {formatDate(holiday.date)}
                    </p>
                    {holiday.reason && (
                      <p className="text-sm text-gray-600">{holiday.reason}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteHoliday(holiday.id)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition flex items-center space-x-1"
                  >
                    <FaTrash />
                    <span>Delete</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedBus && holidays.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <FaCalendarTimes className="text-gray-300 text-6xl mx-auto mb-4" />
            <p className="text-gray-600">No holidays added yet. This bus runs every day.</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default HolidayManagement;
