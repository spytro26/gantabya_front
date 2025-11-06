import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  FaBus,
  FaChartLine,
  FaRoute,
  FaCalendarAlt,
  FaTags,
  FaWifi,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaShieldAlt,
} from 'react-icons/fa';
import buslogo from '../assets/buslogo.jpg';
import { APP_NAME, API_ENDPOINTS } from '../config';
import api from '../lib/api';

interface AdminLayoutProps {
  children?: React.ReactNode;
}

interface MenuItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [serviceName, setServiceName] = useState('Ankush Travels');

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchServiceName = async () => {
      try {
  const response = await api.get(API_ENDPOINTS.ADMIN_SERVICE_NAME);
        if (response.data?.serviceName) {
          setServiceName(response.data.serviceName);
        }
      } catch (error) {
        console.error('Failed to fetch service name', error);
      }
    };

    fetchServiceName();
  }, []);

  useEffect(() => {
    const handleServiceNameUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      if (typeof customEvent.detail === 'string' && customEvent.detail.trim()) {
        setServiceName(customEvent.detail);
      }
    };

    window.addEventListener('service-name-updated', handleServiceNameUpdated);
    return () => {
      window.removeEventListener('service-name-updated', handleServiceNameUpdated);
    };
  }, []);

  const menuItems: MenuItem[] = [
    {
      name: 'Dashboard',
      path: '/admin/dashboard',
      icon: <FaChartLine />,
    },
    {
      name: 'Bus Management',
      path: '/admin/buses',
      icon: <FaBus />,
    },
    {
      name: 'Routes & Stops',
      path: '/admin/routes',
      icon: <FaRoute />,
    },
    {
      name: 'Trip Management',
      path: '/admin/trips',
      icon: <FaCalendarAlt />,
    },
    {
      name: 'Offers & Coupons',
      path: '/admin/offers',
      icon: <FaTags />,
    },
    {
      name: 'Amenities',
      path: '/admin/amenities',
      icon: <FaWifi />,
    },
  ];

  const handleLogout = () => {
    // Clear cookies (token will be cleared by the server)
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    navigate('/admin/signin');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation Bar */}
      <nav className="bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-lg fixed w-full top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo and Menu Toggle */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-white hover:text-yellow-400 transition"
            >
              {isSidebarOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <img
                  src={buslogo}
                  alt={APP_NAME}
                  className="h-10 w-10 rounded-full border-2 border-yellow-500"
                />
                <div className="absolute -top-1 -right-1 bg-yellow-500 text-slate-900 rounded-full p-1">
                  <FaShieldAlt className="text-xs" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold">{APP_NAME}</h1>
                <p className="text-xs text-gray-400">{serviceName}</p>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
          >
            <FaSignOutAlt />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </nav>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-16 h-full bg-slate-800 text-white transition-transform duration-300 z-40 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isMobile ? 'w-64' : 'w-64'}`}
      >
        <div className="p-4">
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => isMobile && setIsSidebarOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                  isActive(item.path)
                    ? 'bg-yellow-500 text-slate-900 font-bold'
                    : 'hover:bg-slate-700 text-gray-300'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 top-16"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main
        className={`pt-20 transition-all duration-300 ${
          isSidebarOpen && !isMobile ? 'ml-64' : 'ml-0'
        }`}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
};

export default AdminLayout;
