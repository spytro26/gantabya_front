import React, { useEffect, useMemo, useState } from 'react';
import { FaPlus, FaTags, FaTrash } from 'react-icons/fa';
import type { AxiosInstance } from 'axios';

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

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center space-x-3">
              <FaTags className="text-yellow-600" />
              <span>{title}</span>
            </h1>
            <p className="text-gray-600 mt-1">{subtitle}</p>
            <p className="mt-2 text-sm text-gray-500 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 max-w-3xl">
              {scopeNote}
            </p>
          </div>
          <button
            onClick={() => setShowForm((prev) => !prev)}
            className="w-full sm:w-auto px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition flex items-center justify-center space-x-2"
          >
            <FaPlus />
            <span>{showForm ? 'Cancel' : 'Create Offer'}</span>
          </button>
        </div>

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

        {showForm && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Create New Offer</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Coupon Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 uppercase"
                    placeholder="SAVE50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="discountType"
                    value={formData.discountType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED_AMOUNT">Fixed Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Value <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="discountValue"
                    value={formData.discountValue}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                    placeholder="10"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount (₹)</label>
                  <input
                    type="number"
                    name="maxDiscount"
                    value={formData.maxDiscount}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                    placeholder="Leave empty for no limit"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valid From <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="validFrom"
                    value={formData.validFrom}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valid Until <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="validUntil"
                    value={formData.validUntil}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Booking Amount (₹)</label>
                  <input
                    type="number"
                    name="minBookingAmount"
                    value={formData.minBookingAmount}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                    placeholder="Leave empty for no minimum"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Usage Limit</label>
                  <input
                    type="number"
                    name="usageLimit"
                    value={formData.usageLimit}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                    placeholder="Leave empty for unlimited"
                    min="1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                  rows={3}
                  placeholder="Offer description"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Offer'}
              </button>
            </form>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Active Offers</h2>
            {fetching && <span className="text-sm text-gray-500">Refreshing...</span>}
          </div>
          {offers.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No offers created yet</p>
          ) : (
            <div className="space-y-3">
              {offers.map((offer) => (
                <div
                  key={offer.id}
                  className={`p-4 border-2 rounded-lg ${
                    offer.isActive
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-300 bg-gray-50'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center flex-wrap gap-3 mb-2">
                        <span className="px-3 py-1 bg-yellow-500 text-white font-bold rounded-lg">
                          {offer.code}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded ${
                            offer.isActive
                              ? 'bg-green-200 text-green-800'
                              : 'bg-gray-300 text-gray-700'
                          }`}
                        >
                          {offer.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                        {offer.creatorRole && (
                          <span className="px-2 py-1 text-xs font-semibold rounded bg-indigo-100 text-indigo-700">
                            {offer.creatorRole}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 mb-2">{offer.description}</p>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          <strong>Discount:</strong>{' '}
                          {offer.discountType === 'PERCENTAGE'
                            ? `${offer.discountValue}%`
                            : `₹${offer.discountValue}`}
                          {offer.maxDiscount && ` (Max: ₹${offer.maxDiscount})`}
                        </p>
                        <p>
                          <strong>Valid:</strong>{' '}
                          {new Date(offer.validFrom).toLocaleDateString()} to{' '}
                          {new Date(offer.validUntil).toLocaleDateString()}
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
