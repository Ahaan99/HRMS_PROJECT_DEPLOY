import axios from "axios";

const API = axios.create({
  // EVS now runs inside the unified HRMS Node backend (port 5000) under /api/evs
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api/evs",
});

// REQUEST INTERCEPTOR
API.interceptors.request.use((config) => {

  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// RESPONSE INTERCEPTOR (AUTO LOGOUT)
API.interceptors.response.use(
  (response) => response,
  (error) => {

    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/";
    }

    return Promise.reject(error);
  }
);

export default API;