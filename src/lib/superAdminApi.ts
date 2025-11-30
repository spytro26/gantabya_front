import axios from "axios";
import { API_BASE_URL } from "../config";

const superAdminApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request interceptor - Add Authorization header if token exists in localStorage
superAdminApi.interceptors.request.use(
  (config) => {
    // Get token from localStorage (iOS/mobile fallback)
    const token = localStorage.getItem("superAdminToken");

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
superAdminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear stored token on 401
      localStorage.removeItem("superAdminToken");
      window.location.href = "/superadmin";
    }
    return Promise.reject(error);
  }
);

export default superAdminApi;
