import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { Signup } from './pages/signup';
import { Signin } from './pages/user-signin';
import { AdminSignin } from './pages/admin-signin';
import AdminSignup from './pages/admin-signup';
import AdminDashboard from './pages/admin-dashboard';
import BusManagement from './pages/admin-buses';
import BusForm from './pages/admin-bus-form';
import SeatLayoutDesigner from './pages/admin-seat-layout';
import AdminBusImages from './pages/admin-bus-images';
import RouteManagement from './pages/admin-routes';
import TripManagement from './pages/admin-trips';
import HolidayManagement from './pages/admin-holidays';
import OfferManagement from './pages/admin-offers';
import AmenityManagement from './pages/admin-amenities';
import AdminVerifyEmail from './pages/admin-verify-email';
import AdminVerificationPending from './pages/admin-verification-pending';
import AdminForgotPassword from './pages/admin-forgot-password';
import { UserHome } from './pages/user-home';
import { SearchResults } from './pages/search-results';
import { BookingPage } from './pages/booking-page';
import { MyBookings } from './pages/my-bookings';
import { UserProfile } from './pages/user-profile';
import { Notifications } from './pages/notifications';
import SuperAdminSignin from './pages/superadmin-signin';
import SuperAdminDashboard from './pages/superadmin-dashboard';
import SuperAdminAdminProfile from './pages/superadmin-admin-profile';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing - Redirect to home */}
        <Route path="/" element={<Navigate to="/home" replace />} />
        
        {/* User Routes */}
        <Route path="/signup" element={<Signup />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/home" element={<UserHome />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/book/:tripId" element={<BookingPage />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/notifications" element={<Notifications />} />
        
        {/* Admin Routes */}
        <Route path="/admin/signup" element={<AdminSignup />} />
        <Route path="/admin/signin" element={<AdminSignin />} />
        <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />
        <Route path="/admin/verify-email" element={<AdminVerifyEmail />} />
        <Route path="/admin/verification-pending" element={<AdminVerificationPending />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/buses" element={<BusManagement />} />
        <Route path="/admin/buses/:busId" element={<BusForm />} />
        <Route path="/admin/buses/:busId/edit" element={<BusForm />} />
        <Route path="/admin/buses/:busId/seats" element={<SeatLayoutDesigner />} />
        <Route path="/admin/buses/:busId/images" element={<AdminBusImages />} />
        <Route path="/admin/routes" element={<RouteManagement />} />
        <Route path="/admin/trips" element={<TripManagement />} />
        <Route path="/admin/holidays" element={<HolidayManagement />} />
        <Route path="/admin/offers" element={<OfferManagement />} />
        <Route path="/admin/amenities" element={<AmenityManagement />} />

        {/* Super Admin Routes */}
        <Route path="/superadmin" element={<SuperAdminSignin />} />
        <Route path="/superadmin/dashboard" element={<SuperAdminDashboard />} />
        <Route path="/superadmin/admin/:adminId" element={<SuperAdminAdminProfile />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;








