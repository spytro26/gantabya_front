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

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // iOS Safari may block third-party cookies; use token fallback if present
    try {
      const token = localStorage.getItem("auth_token");
      if (token) {
        config.headers = config.headers || {};
        (config.headers as any)["Authorization"] = `Bearer ${token}`;
      }
    } catch {}
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
      // Redirect to signin on unauthorized
      const isAdmin = window.location.pathname.startsWith("/admin");
      try {
        localStorage.removeItem("auth_token");
      } catch {}
      window.location.href = isAdmin ? "/admin/signin" : "/signin";
    }
    return Promise.reject(error);
  }
);

export default api;
