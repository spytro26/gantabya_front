import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { API_ENDPOINTS } from '../config';
import { UserNavbar } from '../components/UserNavbar';
import {
  FaCheckCircle,
  FaInfoCircle,
  FaExclamationTriangle,
  FaGift,
  FaBell,
} from 'react-icons/fa';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(API_ENDPOINTS.GET_NOTIFICATIONS);
      setNotifications(response.data.notifications || []);
      
      const unread = response.data.notifications?.filter((n: Notification) => !n.isRead).length || 0;
      setUnreadCount(unread);
    } catch (err: any) {
      if (err.response?.status === 401) {
        navigate('/signin');
      } else {
        setError(
          err.response?.data?.errorMessage ||
            'Failed to fetch notifications. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await api.patch(`/user/notifications/${notificationId}/read`);
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch(API_ENDPOINTS.MARK_ALL_READ);
      fetchNotifications();
    } catch (err: any) {
      alert(
        err.response?.data?.errorMessage ||
          'Failed to mark all as read. Please try again.'
      );
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'BOOKING_CONFIRMED':
        return <FaCheckCircle className="text-green-500 text-2xl" />;
      case 'BOOKING_CANCELLED':
        return <FaExclamationTriangle className="text-red-500 text-2xl" />;
      case 'OFFER_APPLIED':
        return <FaGift className="text-yellow-500 text-2xl" />;
      default:
        return <FaInfoCircle className="text-blue-500 text-2xl" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'BOOKING_CONFIRMED':
        return 'bg-green-50 border-green-200';
      case 'BOOKING_CANCELLED':
        return 'bg-red-50 border-red-200';
      case 'OFFER_APPLIED':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header/Navbar */}
      <UserNavbar unreadCount={unreadCount} currentPage="notifications" />

      {/* Page Header */}
      <div className="bg-indigo-600 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Notifications</h1>
              <p className="text-indigo-100 mt-2">
                {unreadCount > 0
                  ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                  : 'All caught up!'}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="px-6 py-2 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-indigo-50"
              >
                Mark All Read
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading notifications...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <p className="text-red-700 text-lg">{error}</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <FaBell className="mx-auto text-6xl text-gray-300 mb-4" />
            <p className="text-gray-600 text-lg mb-4">No notifications yet</p>
            <p className="text-gray-500">
              We'll notify you about important updates here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`rounded-lg shadow p-6 border ${
                  notification.isRead ? 'bg-white border-gray-200' : getNotificationColor(notification.type)
                }`}
              >
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {notification.title}
                      </h3>
                      {!notification.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                    <p className="text-gray-700 mb-3">{notification.message}</p>
                    <div className="text-sm text-gray-500">
                      {new Date(notification.createdAt).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
