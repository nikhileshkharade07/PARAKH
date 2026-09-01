import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
  timeout: 30000
});

export const getStoredToken = () => localStorage.getItem("parakh_token");
export const setStoredToken = (token) => localStorage.setItem("parakh_token", token);
export const clearStoredToken = () => localStorage.removeItem("parakh_token");

// Attach JWT token automatically if logged in
api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});
