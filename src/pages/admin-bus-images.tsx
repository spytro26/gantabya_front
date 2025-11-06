import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FaUpload,
  FaTrash,
  FaArrowLeft,
  FaImage,
  FaCheckCircle,
  FaExclamationTriangle,
} from 'react-icons/fa';
import AdminLayout from '../components/AdminLayout';
import api from '../lib/api';

interface BusImage {
  id: string;
  imageUrl: string;
  createdAt: string;
}

interface Bus {
  id: string;
  name: string;
  busNumber: string;
}

const AdminBusImages: React.FC = () => {
  const { busId } = useParams<{ busId: string }>();
  const navigate = useNavigate();

  const [bus, setBus] = useState<Bus | null>(null);
  const [images, setImages] = useState<BusImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchBusDetails();
    fetchImages();
  }, [busId]);

  const fetchBusDetails = async () => {
    try {
      const response = await api.get(`/admin/buses`);
      const foundBus = response.data.buses.find((b: any) => b.id === busId);
      if (foundBus) {
        setBus({
          id: foundBus.id,
          name: foundBus.name,
          busNumber: foundBus.busNumber,
        });
      }
    } catch (err) {
      console.error('Failed to fetch bus details');
    }
  };

  const fetchImages = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/buses/${busId}/images`);
      console.log('📸 Fetched images:', response.data.images);
      setImages(response.data.images || []);
    } catch (err: any) {
      console.error('❌ Failed to fetch images:', err);
      setError(err.response?.data?.errorMessage || 'Failed to load images');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Validate file count
    if (images.length + files.length > 10) {
      setError(
        `Cannot upload ${files.length} images. Maximum 10 images allowed. Current: ${images.length}`
      );
      return;
    }

    // Validate file types and size
    const validFiles: File[] = [];
    let totalSize = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Check file type
      if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
        setError(`File "${file.name}" is not a valid JPG or PNG image`);
        return;
      }

      // Check individual file size (max 5MB total, so roughly 1MB per file)
      if (file.size > 2 * 1024 * 1024) {
        setError(`File "${file.name}" is too large. Max 2MB per image`);
        return;
      }

      validFiles.push(file);
      totalSize += file.size;
    }

    // Check total size
    if (totalSize > 5 * 1024 * 1024) {
      setError('Total file size exceeds 5MB');
      return;
    }

    setSelectedFiles(files);

    // Create preview URLs
    const urls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      urls.push(URL.createObjectURL(files[i]));
    }
    setPreviewUrls(urls);
    setError('');
  };

  const handleUpload = async () => {
    if (!selectedFiles) return;

    try {
      setUploading(true);
      setError('');
      setSuccess('');

      const formData = new FormData();
      for (let i = 0; i < selectedFiles.length; i++) {
        formData.append('images', selectedFiles[i]);
      }

      const response = await api.post(`/admin/buses/${busId}/images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess(response.data.message);
      setSelectedFiles(null);
      setPreviewUrls([]);

      // Refresh images list
      await fetchImages();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(
        err.response?.data?.errorMessage || 'Failed to upload images'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageId: string) => {
    if (deleteConfirm !== imageId) {
      setDeleteConfirm(imageId);
      return;
    }

    try {
      setError('');
      await api.delete(`/admin/buses/${busId}/images/${imageId}`);
      setImages(images.filter((img) => img.id !== imageId));
      setDeleteConfirm(null);
      setSuccess('Image deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.errorMessage || 'Failed to delete image');
      setDeleteConfirm(null);
    }
  };

  const clearSelection = () => {
    setSelectedFiles(null);
    setPreviewUrls([]);
    setError('');
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/admin/buses')}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <FaArrowLeft className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Bus Images</h1>
              {bus && (
                <p className="text-gray-600 mt-1">
                  {bus.name} ({bus.busNumber})
                </p>
              )}
            </div>
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-semibold text-gray-800">{images.length}</span> / 10 images
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded flex items-center space-x-2">
            <FaCheckCircle />
            <span>{success}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center space-x-2">
            <FaExclamationTriangle />
            <span>{error}</span>
          </div>
        )}

        {/* Upload Section */}
        {images.length < 10 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
              <FaUpload />
              <span>Upload Images</span>
            </h2>

            <div className="space-y-4">
              {/* File Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Images (JPG or PNG, max 5MB total, {10 - images.length} remaining)
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleFileSelect}
                  disabled={uploading}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100 disabled:opacity-50"
                />
                <p className="mt-1 text-xs text-gray-500">
                  You can select multiple images at once. Max 2MB per image.
                </p>
              </div>

              {/* Preview */}
              {previewUrls.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preview ({previewUrls.length} selected)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {previewUrls.map((url, index) => (
                      <div
                        key={index}
                        className="relative aspect-video rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-100"
                      >
                        <img
                          src={url}
                          alt={`Preview ${index + 1}`}
                          className="block w-full h-full object-cover"
                          loading="lazy"
                          onError={() => {
                            console.error('Failed to load preview:', url);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Buttons */}
              {selectedFiles && (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <FaUpload />
                        <span>Upload {selectedFiles.length} Image(s)</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={clearSelection}
                    disabled={uploading}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Current Images */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
            <FaImage />
            <span>Current Images ({images.length})</span>
          </h2>

          {images.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FaImage className="text-6xl mx-auto mb-4 text-gray-300" />
              <p>No images uploaded yet</p>
              <p className="text-sm">Upload images to showcase your bus to customers</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="relative group rounded-lg overflow-hidden border-2 border-gray-200 hover:border-yellow-400 transition"
                >
                  <div className="aspect-video bg-gray-100">
                    <img
                      src={image.imageUrl}
                      alt="Bus"
                      className="block w-full h-full object-cover"
                      crossOrigin="anonymous"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        console.error('Failed to load image:', image.imageUrl);
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%239ca3af"%3EImage Load Error%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  </div>

                  {/* Delete Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center pointer-events-none">
                    <button
                      onClick={() => handleDelete(image.id)}
                      className={`opacity-0 group-hover:opacity-100 transition px-4 py-2 rounded-lg flex items-center space-x-2 ${
                        deleteConfirm === image.id
                          ? 'bg-red-600 text-white'
                          : 'bg-white text-red-600 hover:bg-red-50'
                      }`}
                      style={{ pointerEvents: 'auto' }}
                    >
                      <FaTrash />
                      <span>
                        {deleteConfirm === image.id ? 'Click to Confirm' : 'Delete'}
                      </span>
                    </button>
                  </div>

                  {/* Upload Date */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                    <p className="text-xs text-white">
                      {new Date(image.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Tips for Best Results:</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Upload high-quality images showing interior and exterior of the bus</li>
            <li>Images should be clear, well-lit, and in focus</li>
            <li>Recommended size: 1200x800 pixels or larger</li>
            <li>Formats: JPG or PNG only</li>
            <li>Maximum 10 images per bus</li>
            <li>Images will be automatically optimized for web display</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminBusImages;
