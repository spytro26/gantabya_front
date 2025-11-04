// API Configuration
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000";

export const API_ENDPOINTS = {
  // User Auth
  USER_SIGNUP: "/user/signup",
  USER_SIGNIN: "/user/signin",
  USER_VERIFY_EMAIL: "/user/verifyEmail",
  USER_PROFILE: "/user/profile",

  // User Booking
  SEARCH_BUSES: "/user/showbus",
  BOOK_TICKET: "/user/bookticket",
  MY_BOOKINGS: "/user/mybookings",
  CANCEL_TICKET: "/user/cancelticket",

  // User Notifications
  GET_NOTIFICATIONS: "/user/notifications",
  UNREAD_COUNT: "/user/notifications/unread-count",
  MARK_ALL_READ: "/user/notifications/read-all",

  // User Offers (Public)
  GET_PUBLIC_OFFERS: "/user/offers",
  GET_TRIP_SEATS: "/user/trip", // + /:tripId/seats

  // Admin Auth
  ADMIN_SIGNUP: "/admin/signup",
  ADMIN_SIGNIN: "/admin/signin",

  // Admin Bus Management
  ADMIN_CREATE_BUS: "/admin/createbus",
  ADMIN_UPDATE_BUS: "/admin/updatebus",
  ADMIN_GET_BUSES: "/admin/buses",
  ADMIN_DELETE_BUS: "/admin/deletebus",

  // Admin Stops
  ADMIN_ADD_STOP: "/admin/addstop",
  ADMIN_UPDATE_STOP: "/admin/updatestop",
  ADMIN_DELETE_STOP: "/admin/deletestop",

  // Admin Trips
  ADMIN_CREATE_TRIP: "/admin/createtrip",
  ADMIN_GET_TRIPS: "/admin/trips",
  ADMIN_CANCEL_TRIP: "/admin/canceltrip",

  // Admin Offers
  ADMIN_CREATE_OFFER: "/admin/offers",
  ADMIN_GET_OFFERS: "/admin/offers",
  ADMIN_UPDATE_OFFER: "/admin/offers",
  ADMIN_DELETE_OFFER: "/admin/offers",

  // Admin Amenities
  ADMIN_UPDATE_AMENITIES: "/admin/updateamenities",
};

export const APP_NAME = "Go Gantabya";
export const APP_TAGLINE = "Your Journey, Our Priority";
