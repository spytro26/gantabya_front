import axios from "axios";
import { API_BASE_URL } from "../config";

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important for cookies
});

// Request interceptor - Add Authorization header if token exists in localStorage
api.interceptors.request.use(
  (config) => {
    // Check for admin token first (for admin routes), then user token
    const adminToken = localStorage.getItem("adminToken");
    const authToken = localStorage.getItem("authToken");

    // Use admin token for admin routes, user token for user routes
    const isAdminRoute = config.url?.includes("/admin");
    const token = isAdminRoute
      ? adminToken || authToken
      : authToken || adminToken;

    // Add token to Authorization header if it exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Clear stored tokens on 401
      const isAdmin = window.location.pathname.startsWith("/admin");

      if (isAdmin) {
        localStorage.removeItem("adminToken");
        window.location.href = "/admin/signin";
      } else {
        localStorage.removeItem("authToken");
        window.location.href = "/signin";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
