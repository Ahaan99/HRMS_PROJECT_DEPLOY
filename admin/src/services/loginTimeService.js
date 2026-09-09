import API from "./api";

export const getLoginSettings = () =>
  API.get("/super-admin/login-settings");

export const updateLoginSettings = (payload) =>
  API.put("/super-admin/login-settings", payload);

export const getEmployeeLoginTimes = (params) =>
  API.get("/super-admin/employee-login-times", { params });

export const getEmployeeLoginTime = (employeeId) =>
  API.get(`/super-admin/employee-login-times/${employeeId}`);

export const setEmployeeLoginTime = (employeeId, payload) =>
  API.post(`/super-admin/employee-login-times/${employeeId}`, payload);

export const updateEmployeeLoginTime = (employeeId, payload) =>
  API.put(`/super-admin/employee-login-times/${employeeId}`, payload);

export const getTodayLoginLogs = (params) =>
  API.get("/super-admin/login-logs/today", { params });

export const getLoginLogs = (params) =>
  API.get("/super-admin/login-logs", { params });

export const recordLogin = (payload) =>
  API.post("/super-admin/login-logs/login", payload);

export const recordLogout = (payload) =>
  API.post("/super-admin/login-logs/logout", payload);

export const getLoginStats = () =>
  API.get("/super-admin/login-logs/stats");
