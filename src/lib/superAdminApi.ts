import axios from "axios";
import { API_BASE_URL } from "../config";

const superAdminApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

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
