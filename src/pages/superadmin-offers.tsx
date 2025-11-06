import { useState } from "react";
import type { PropsWithChildren } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaShieldAlt, FaUsers, FaTags, FaSignOutAlt, FaBars, FaTimes } from "react-icons/fa";
import superAdminApi from "../lib/superAdminApi";
import { OfferManagementView } from "../components/OfferManagementView";

const navItems = [
  { label: "Dashboard", to: "/superadmin/dashboard", icon: <FaUsers className="text-lg" /> },
  { label: "Offers", to: "/superadmin/offers", icon: <FaTags className="text-lg" /> },
];

function SuperAdminLayout({ children }: PropsWithChildren) {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const activePath = location.pathname;

  const handleLogout = async () => {
    try {
      await superAdminApi.post("/superadmin/logout");
    } catch (error) {
      console.error("Failed to logout super admin", error);
    } finally {
      setMenuOpen(false);
      navigate("/superadmin");
    }
  };

  const handleNavigate = () => {
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <header className="bg-gray-900 border-b border-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
            <div className="bg-red-600 p-3 rounded-xl shadow-lg">
              <FaShieldAlt className="text-3xl text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Super Admin Control</h1>
              <p className="text-sm text-gray-400">Manage platform-wide policies and offers</p>
            </div>
          </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 self-end rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-200 transition hover:bg-gray-700 md:hidden"
                aria-expanded={menuOpen}
                aria-controls="superadmin-nav"
              >
                {menuOpen ? <FaTimes /> : <FaBars />}
                <span>Menu</span>
              </button>

              <nav
                id="superadmin-nav"
                className={`mt-3 flex flex-col gap-2 md:mt-0 md:flex-row md:items-center ${
                  menuOpen
                    ? "visible opacity-100 translate-y-0"
                    : "invisible opacity-0 -translate-y-2 pointer-events-none md:visible md:opacity-100 md:translate-y-0 md:pointer-events-auto"
                } transition-all duration-200 md:space-x-2`}
              >
                {navItems.map((item) => {
                  const isActive = activePath === item.to;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={handleNavigate}
                      className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                        isActive
                          ? "bg-red-600 border-red-500 text-white shadow-lg"
                          : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-300 transition hover:bg-red-600 hover:border-red-500 hover:text-white"
                >
                  <FaSignOutAlt className="text-lg" />
                  <span>Logout</span>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

const SuperAdminOffers = () => (
  <OfferManagementView
    LayoutComponent={SuperAdminLayout}
    apiClient={superAdminApi}
    apiPrefix="/superadmin"
    title="Global Offer Management"
    subtitle="Create and manage coupons that apply to every bus across the network"
    role="SUPERADMIN"
  />
);

export default SuperAdminOffers;
