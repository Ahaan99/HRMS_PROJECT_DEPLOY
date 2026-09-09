import API from "./api";

export const getPerformanceRecords = (params) =>
  API.get("/super-admin/performance", { params });

export const createPerformanceRecord = (payload) =>
  API.post("/super-admin/performance", payload);

export const updatePerformanceRecord = (id, payload) =>
  API.put(`/super-admin/performance/${id}`, payload);

export const deletePerformanceRecord = (id) =>
  API.delete(`/super-admin/performance/${id}`);

export const getPerformanceStats = () =>
  API.get("/super-admin/performance/stats");

export const getPerformanceByEmployee = (employeeId) =>
  API.get(`/super-admin/performance/employee/${employeeId}`);

export const bulkUpdatePerformance = (payload) =>
  API.post("/super-admin/performance/bulk-update", payload);

export const exportPerformanceReport = (params) =>
  API.get("/super-admin/performance/export", { params, responseType: "blob" });

export const getEmployees = () =>
  API.get("/super-admin/performance/employees");