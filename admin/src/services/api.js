import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: false, // later we can make true if using cookies
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("hrms_admin_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
export default API;
