import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaBell, FaTicketAlt, FaUser, FaBars, FaTimes, FaHome } from 'react-icons/fa';
import busLogo from '../assets/buslogo.jpg';
import { APP_NAME } from '../config';

interface UserNavbarProps {
  user?: any;
  unreadCount?: number;
  currentPage?: string;
}

export function UserNavbar({ user, unreadCount = 0, currentPage = 'home' }: UserNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: '/home', label: 'Home', icon: FaHome },
    { to: '/my-bookings', label: 'My Bookings', icon: FaTicketAlt },
    { to: '/notifications', label: 'Notifications', icon: FaBell, badge: unreadCount },
    { to: '/profile', label: 'Profile', icon: FaUser, userName: user?.name },
  ];

  return (
    <nav className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-600 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16 lg:h-20">
          {/* Logo Section */}
          <Link to="/home" className="flex items-center space-x-1.5 sm:space-x-2 lg:space-x-3 group flex-shrink-0 min-w-0">
            <div className="relative flex-shrink-0">
              {/* Logo with better sizing - crop white space */}
              <div className="w-9 h-9 sm:w-10 sm:h-10 lg:w-14 lg:h-14 bg-white rounded-full flex items-center justify-center shadow-md group-hover:shadow-xl transition-shadow duration-300">
                <img
                  src={busLogo}
                  alt="Logo"
                  className="w-7 h-7 sm:w-8 sm:h-8 lg:w-12 lg:h-12 object-cover rounded-full scale-150"
                  style={{ objectPosition: 'center' }}
                />
              </div>
              {/* Animated ring on hover */}
              <div className="absolute inset-0 rounded-full border-2 border-white opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300"></div>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm sm:text-base lg:text-xl xl:text-2xl font-bold text-white tracking-tight truncate">
                {APP_NAME}
              </span>
              <span className="text-[9px] sm:text-[10px] lg:text-xs text-indigo-200 font-medium hidden sm:block truncate">
                Your Journey Partner
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`
                  relative px-2 lg:px-4 py-2 rounded-lg font-medium transition-all duration-200
                  flex items-center gap-1 lg:gap-2 text-sm lg:text-base
                  ${
                    currentPage === link.to.slice(1)
                      ? 'bg-white text-indigo-700 shadow-md'
                      : 'text-white hover:bg-white/20 hover:shadow-md'
                  }
                `}
              >
                <link.icon className="text-base lg:text-lg" />
                <span className="hidden lg:inline whitespace-nowrap">
                  {link.userName ? link.userName : link.label}
                </span>
                {link.badge && link.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                    {link.badge > 9 ? '9+' : link.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white p-1.5 sm:p-2 rounded-lg hover:bg-white/20 transition-colors flex-shrink-0"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-3 border-t border-white/20">
            <div className="flex flex-col space-y-1.5 mt-2">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    relative px-3 py-2.5 rounded-lg font-medium transition-all duration-200
                    flex items-center gap-2.5 text-sm
                    ${
                      currentPage === link.to.slice(1)
                        ? 'bg-white text-indigo-700 shadow-md'
                        : 'text-white hover:bg-white/20'
                    }
                  `}
                >
                  <link.icon className="text-base flex-shrink-0" />
                  <span className="flex-1 truncate">{link.userName ? link.userName : link.label}</span>
                  {link.badge && link.badge > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 flex-shrink-0">
                      {link.badge > 9 ? '9+' : link.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
