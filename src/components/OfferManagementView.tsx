import React, { useEffect, useMemo, useState } from 'react';
import { FaPlus, FaTags, FaTrash } from 'react-icons/fa';
import type { AxiosInstance } from 'axios';
import DualDatePicker from './DualDatePicker';
import { getDualDateDisplay } from '../utils/nepaliDateConverter';

interface Offer {
  id: string;
  code: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  maxDiscount: number | null;
  validFrom: string;
  validUntil: string;
  minBookingAmount: number | null;
  usageLimit: number | null;
  usageCount: number;
  isActive: boolean;
  creatorRole?: 'ADMIN' | 'SUPERADMIN';
  createdBy?: string;
}

interface OfferFormState {
  code: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number | string;
  maxDiscount: string;
  validFrom: string;
  validUntil: string;
  minBookingAmount: string;
  usageLimit: string;
}

interface OfferManagementViewProps {
  LayoutComponent: React.ComponentType<React.PropsWithChildren>;
  apiClient: AxiosInstance;
  apiPrefix: string;
  title: string;
  subtitle: string;
  role: 'ADMIN' | 'SUPERADMIN';
}

const initialFormState: OfferFormState = {
  code: '',
  description: '',
  discountType: 'PERCENTAGE',
  discountValue: 0,
  maxDiscount: '',
  validFrom: '',
  validUntil: '',
  minBookingAmount: '',
  usageLimit: '',
};

const parseOptionalNumber = (value: string): number | null => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

export const OfferManagementView: React.FC<OfferManagementViewProps> = ({
  LayoutComponent,
  apiClient,
  apiPrefix,
  title,
  subtitle,
  role,
}) => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<OfferFormState>(initialFormState);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const scopeNote = useMemo(() => {
    if (role === 'ADMIN') {
      return 'Your coupons automatically target the buses registered under your service. Riders will only see them when booking your buses.';
    }
    return 'Super admin coupons are global by default and apply to every bus across the platform unless deactivated.';
  }, [role]);

  const fetchOffers = async () => {
    setFetching(true);
    setError('');
    try {
      const response = await apiClient.get(`${apiPrefix}/offers`);
      setOffers(response.data.offers || []);
    } catch (err) {
      console.error('Failed to load offers', err);
      setError('Failed to load offers');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchOffers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiPrefix]);

  const resetForm = () => {
    setFormData(initialFormState);
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await apiClient.post(`${apiPrefix}/offers`, {
        ...formData,
        discountValue: Number(formData.discountValue),
        maxDiscount: parseOptionalNumber(formData.maxDiscount),
        minBookingAmount: parseOptionalNumber(formData.minBookingAmount),
        usageLimit: parseOptionalNumber(formData.usageLimit),
      });

      setSuccess('Offer created successfully!');
      setShowForm(false);
      resetForm();
      fetchOffers();
    } catch (err: any) {
      console.error('Failed to create offer', err);
      setError(err.response?.data?.errorMessage || 'Failed to create offer');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (offerId: string) => {
    if (!window.confirm('Deactivate this offer?')) return;

    try {
      await apiClient.delete(`${apiPrefix}/offers/${offerId}`);
      setSuccess('Offer deactivated successfully');
      fetchOffers();
    } catch (err: any) {
      console.error('Failed to deactivate offer', err);
      setError(err.response?.data?.errorMessage || 'Failed to deactivate offer');
    }
  };

  const handleToggleActive = async (offerId: string, currentStatus: boolean) => {
    try {
      if (currentStatus) {
        await apiClient.delete(`${apiPrefix}/offers/${offerId}`);
        setSuccess('Offer deactivated');
      } else {
        await apiClient.patch(`${apiPrefix}/offers/${offerId}`, {
          isActive: true,
        });
        setSuccess('Offer activated');
      }
      fetchOffers();
    } catch (err: any) {
      console.error('Failed to toggle offer', err);
      setError(err.response?.data?.errorMessage || 'Failed to update offer');
    }
  };

  const Layout = LayoutComponent;

  // Different color schemes for admin vs superadmin
  const isDarkTheme = role === 'SUPERADMIN';

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className={`text-3xl font-bold flex items-center space-x-3 ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
              <FaTags className={isDarkTheme ? 'text-red-500' : 'text-yellow-600'} />
              <span>{title}</span>
            </h1>
            <p className={`mt-1 ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>{subtitle}</p>
            <p className={`mt-2 text-sm rounded-lg px-3 py-2 max-w-3xl ${
              isDarkTheme 
                ? 'text-purple-100 bg-gradient-to-r from-purple-900/50 to-indigo-900/50 border border-purple-500/50' 
                : 'text-gray-500 bg-yellow-50 border border-yellow-200'
            }`}>
              {scopeNote}
            </p>
          </div>
          <button
            onClick={() => setShowForm((prev) => !prev)}
            className={`w-full sm:w-auto px-6 py-3 text-white rounded-lg transition flex items-center justify-center space-x-2 ${
              isDarkTheme 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-yellow-500 hover:bg-yellow-600'
            }`}
          >
            <FaPlus />
            <span>{showForm ? 'Cancel' : 'Create Offer'}</span>
          </button>
        </div>

        {error && (
          <div className={`px-4 py-3 rounded-lg ${isDarkTheme ? 'bg-red-900/50 border border-red-500 text-red-200' : 'bg-red-100 border border-red-400 text-red-700'}`}>
            {error}
          </div>
        )}
        {success && (
          <div className={`px-4 py-3 rounded-lg ${isDarkTheme ? 'bg-green-900/50 border border-green-500 text-green-200' : 'bg-green-100 border border-green-400 text-green-700'}`}>
            {success}
          </div>
        )}

        {showForm && (
          <div className={`rounded-xl shadow-md p-6 ${isDarkTheme ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
            <h2 className={`text-xl font-bold mb-4 ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>Create New Offer</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                    Coupon Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 rounded-lg uppercase ${isDarkTheme ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-red-500' : 'border-gray-300 focus:ring-yellow-500'} border focus:ring-2`}
                    placeholder="SAVE50"
                    required
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                    Discount Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="discountType"
                    value={formData.discountType}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 rounded-lg ${isDarkTheme ? 'bg-gray-700 border-gray-600 text-white focus:ring-red-500' : 'border-gray-300 focus:ring-yellow-500'} border focus:ring-2`}
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED_AMOUNT">Fixed Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                    Discount Value <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="discountValue"
                    value={formData.discountValue}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 rounded-lg ${isDarkTheme ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-red-500' : 'border-gray-300 focus:ring-yellow-500'} border focus:ring-2`}
                    placeholder="10"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>Max Discount (₹)</label>
                  <input
                    type="number"
                    name="maxDiscount"
                    value={formData.maxDiscount}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 rounded-lg ${isDarkTheme ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-red-500' : 'border-gray-300 focus:ring-yellow-500'} border focus:ring-2`}
                    placeholder="Leave empty for no limit"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                    Valid From <span className="text-red-500">*</span>
                  </label>
                  <DualDatePicker
                    value={formData.validFrom}
                    onChange={(date) => setFormData((prev) => ({ ...prev, validFrom: date }))}
                    className={isDarkTheme ? 'dark' : ''}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                    Valid Until <span className="text-red-500">*</span>
                  </label>
                  <DualDatePicker
                    value={formData.validUntil}
                    onChange={(date) => setFormData((prev) => ({ ...prev, validUntil: date }))}
                    className={isDarkTheme ? 'dark' : ''}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>Min Booking Amount (₹)</label>
                  <input
                    type="number"
                    name="minBookingAmount"
                    value={formData.minBookingAmount}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 rounded-lg ${isDarkTheme ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-red-500' : 'border-gray-300 focus:ring-yellow-500'} border focus:ring-2`}
                    placeholder="Leave empty for no minimum"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>Usage Limit</label>
                  <input
                    type="number"
                    name="usageLimit"
                    value={formData.usageLimit}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 rounded-lg ${isDarkTheme ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-red-500' : 'border-gray-300 focus:ring-yellow-500'} border focus:ring-2`}
                    placeholder="Leave empty for unlimited"
                    min="1"
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 rounded-lg ${isDarkTheme ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-red-500' : 'border-gray-300 focus:ring-yellow-500'} border focus:ring-2`}
                  rows={3}
                  placeholder="Offer description"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 text-white rounded-lg transition disabled:opacity-50 ${isDarkTheme ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-500 hover:bg-yellow-600'}`}
              >
                {loading ? 'Creating...' : 'Create Offer'}
              </button>
            </form>
          </div>
        )}

        <div className={`rounded-xl shadow-md p-6 ${isDarkTheme ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>Active Offers</h2>
            {fetching && <span className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>Refreshing...</span>}
          </div>
          {offers.length === 0 ? (
            <p className={`text-center py-8 ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>No offers created yet</p>
          ) : (
            <div className="space-y-3">
              {offers.map((offer) => (
                <div
                  key={offer.id}
                  className={`p-4 border-2 rounded-lg ${
                    isDarkTheme
                      ? (offer.isActive ? 'border-green-600 bg-green-900/30' : 'border-gray-600 bg-gray-700/50')
                      : (offer.isActive ? 'border-green-300 bg-green-50' : 'border-gray-300 bg-gray-50')
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center flex-wrap gap-3 mb-2">
                        <span className={`px-3 py-1 font-bold rounded-lg ${isDarkTheme ? 'bg-red-600 text-white' : 'bg-yellow-500 text-white'}`}>
                          {offer.code}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded ${
                            isDarkTheme
                              ? (offer.isActive ? 'bg-green-700 text-green-200' : 'bg-gray-600 text-gray-300')
                              : (offer.isActive ? 'bg-green-200 text-green-800' : 'bg-gray-300 text-gray-700')
                          }`}
                        >
                          {offer.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                        {offer.creatorRole && (
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${isDarkTheme ? 'bg-indigo-900 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>
                            {offer.creatorRole}
                          </span>
                        )}
                      </div>
                      <p className={`mb-2 ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>{offer.description}</p>
                      <div className={`text-sm space-y-1 ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>
                        <p>
                          <strong>Discount:</strong>{' '}
                          {offer.discountType === 'PERCENTAGE'
                            ? `${offer.discountValue}%`
                            : `₹${offer.discountValue}`}
                          {offer.maxDiscount && ` (Max: ₹${offer.maxDiscount})`}
                        </p>
                        <p>
                          <strong>Valid:</strong>{' '}
                          {getDualDateDisplay(offer.validFrom).ad} to{' '}
                          {getDualDateDisplay(offer.validUntil).ad}
                        </p>
                        <p className="text-xs opacity-75">
                          ({getDualDateDisplay(offer.validFrom).bs} - {getDualDateDisplay(offer.validUntil).bs})
                        </p>
                        <p>
                          <strong>Usage:</strong> {offer.usageCount} /{' '}
                          {offer.usageLimit || '∞'}
                        </p>
                        {offer.minBookingAmount && (
                          <p>
                            <strong>Min Booking:</strong> ₹{offer.minBookingAmount}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleActive(offer.id, offer.isActive)}
                        className={`px-3 py-2 rounded-lg transition ${
                          offer.isActive
                            ? 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                            : 'bg-green-500 text-white hover:bg-green-600'
                        }`}
                      >
                        {offer.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDelete(offer.id)}
                        className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};
