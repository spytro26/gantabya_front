import axios from "axios";
import { API_BASE_URL } from "../config";

const superAdminApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Attach Authorization token from localStorage (iOS cookie fallback)
superAdminApi.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem("auth_token");
      if (token) {
        config.headers = config.headers || {};
        (config.headers as any)["Authorization"] = `Bearer ${token}`;
      }
    } catch {}
    return config;
  },
  (error) => Promise.reject(error)
);

superAdminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = "/superadmin";
    }
    return Promise.reject(error);
  }
);

export default superAdminApi;
