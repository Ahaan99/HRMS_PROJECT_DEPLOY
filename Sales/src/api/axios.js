import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const axiosInstance = axios.create({
  baseURL: BASE_URL,
});

// attach sales token automatically
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("hrms_sales_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosInstance;