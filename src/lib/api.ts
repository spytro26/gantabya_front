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
      window.location.href = isAdmin ? "/admin/signin" : "/signin";
    }
    return Promise.reject(error);
  }
);

export default api;
