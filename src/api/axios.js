import axios from "axios";
import { getToken } from "../utils/token";
import { clearStudentCaches } from "../utils/studentCache";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor (attach token)
api.interceptors.request.use(
  (config) => {
    const token = getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor (global error handling)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // token expired or invalid
      localStorage.removeItem("lms_token");
      localStorage.removeItem("uniosun_lms_auth");
      localStorage.removeItem("uniosun_lms_lecturer_workspace_v1");
      clearStudentCaches();
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;