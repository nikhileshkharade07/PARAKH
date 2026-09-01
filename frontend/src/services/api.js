import axios from "axios";

export const getStoredToken = () => localStorage.getItem("parakh_token") || localStorage.getItem("token");
export const setStoredToken = (token) => {
  localStorage.setItem("parakh_token", token);
  localStorage.setItem("token", token);
};
export const clearStoredToken = () => {
  localStorage.removeItem("parakh_token");
  localStorage.removeItem("token");
  localStorage.removeItem("parakh_user");
};

/**
 * Base Axios Client for PARAKH Intelligence Platform.
 * Configured with configurable baseURL, timeout, auth interceptors, and standard error handling.
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Attach JWT Bearer Token if available in localStorage
api.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Extract clean data and format errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Standardize error message extraction
    const customError = {
      status: error.response?.status || 500,
      message:
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        "An unexpected network error occurred",
      details: error.response?.data || null,
      isNetworkError: !error.response,
    };

    // Auto-clear token on unauthorized 401 if needed
    if (error.response?.status === 401) {
      window.dispatchEvent(new CustomEvent("parakh:unauthorized", { detail: customError }));
    }

    return Promise.reject(customError);
  }
);

/**
 * Standard API error extraction helper.
 * @param {Error|Object} error
 * @returns {string} User-friendly error message string
 */
export function formatApiError(error) {
  if (typeof error === "string") return error;
  if (error?.message) return error.message;
  if (error?.detail) return typeof error.detail === "string" ? error.detail : JSON.stringify(error.detail);
  return "An unknown error occurred while communicating with the server.";
}

export default api;
