import React, { useEffect, useState } from 'react';
import { FaTags, FaPlus, FaTrash } from 'react-icons/fa';
import AdminLayout from '../components/AdminLayout';
import api from '../lib/api';

interface Offer {
  id: string;
  code: string;
  description: string;
  discountType: string;
  discountValue: number;
  maxDiscount: number | null;
  validFrom: string;
  validUntil: string;
  minBookingAmount: number | null;
  usageLimit: number | null;
  usageCount: number;
  isActive: boolean;
}

const OfferManagement: React.FC = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: 0,
    maxDiscount: '',
    validFrom: '',
    validUntil: '',
    minBookingAmount: '',
    usageLimit: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const response = await api.get('/admin/offers');
      setOffers(response.data.offers);
    } catch (err: any) {
      setError('Failed to load offers');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/admin/offers', {
        ...formData,
        discountValue: parseFloat(formData.discountValue.toString()),
        maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : null,
        minBookingAmount: formData.minBookingAmount ? parseFloat(formData.minBookingAmount) : null,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
      });
      setSuccess('Offer created successfully!');
      setShowForm(false);
      resetForm();
      fetchOffers();
    } catch (err: any) {
      setError(err.response?.data?.errorMessage || 'Failed to create offer');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discountType: 'PERCENTAGE',
      discountValue: 0,
      maxDiscount: '',
      validFrom: '',
      validUntil: '',
      minBookingAmount: '',
      usageLimit: '',
    });
  };

  const handleDelete = async (offerId: string) => {
    if (!window.confirm('Delete this offer?')) return;

    try {
      await api.delete(`/admin/offers/${offerId}`);
      setSuccess('Offer deleted successfully');
      fetchOffers();
    } catch (err: any) {
      alert(err.response?.data?.errorMessage || 'Failed to delete offer');
    }
  };

  const handleToggleActive = async (offerId: string, currentStatus: boolean) => {
    try {
      if (currentStatus) {
        await api.patch(`/admin/offers/${offerId}/deactivate`);
      } else {
        await api.patch(`/admin/offers/${offerId}`, { isActive: true });
      }
      fetchOffers();
    } catch (err: any) {
      alert(err.response?.data?.errorMessage || 'Failed to update offer');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center space-x-3">
              <FaTags className="text-yellow-600" />
              <span>Offer Management</span>
            </h1>
            <p className="text-gray-600 mt-1">Create and manage discount coupons</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition flex items-center space-x-2"
          >
            <FaPlus />
            <span>{showForm ? 'Cancel' : 'Create Offer'}</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">{error}</div>
        )}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">{success}</div>
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
          <h2 className="text-xl font-bold text-gray-800 mb-4">Active Offers</h2>
          {offers.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No offers created yet</p>
          ) : (
            <div className="space-y-3">
              {offers.map((offer) => (
                <div
                  key={offer.id}
                  className={`p-4 border-2 rounded-lg ${
                    offer.isActive ? 'border-green-300 bg-green-50' : 'border-gray-300 bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="px-3 py-1 bg-yellow-500 text-white font-bold rounded-lg">{offer.code}</span>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded ${
                            offer.isActive ? 'bg-green-200 text-green-800' : 'bg-gray-300 text-gray-700'
                          }`}
                        >
                          {offer.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
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
                          <strong>Valid:</strong> {new Date(offer.validFrom).toLocaleDateString()} to{' '}
                          {new Date(offer.validUntil).toLocaleDateString()}
                        </p>
                        <p>
                          <strong>Usage:</strong> {offer.usageCount} / {offer.usageLimit || '∞'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
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
    </AdminLayout>
  );
};

export default OfferManagement;
