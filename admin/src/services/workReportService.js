import API from "./api";

export const getWorkAssignments = (params) =>
  API.get("/super-admin/work-assignments", { params });

export const createWorkAssignment = (payload) =>
  API.post("/super-admin/work-assignments", payload);

export const updateWorkAssignment = (id, payload) =>
  API.put(`/super-admin/work-assignments/${id}`, payload);

export const deleteWorkAssignment = (id) =>
  API.delete(`/super-admin/work-assignments/${id}`);

export const getEODReports = (params) =>
  API.get("/super-admin/eod-reports", { params });

export const submitEODReport = (payload) =>
  API.post("/super-admin/eod-reports", payload);

export const updateEODReport = (id, payload) =>
  API.put(`/super-admin/eod-reports/${id}`, payload);

export const getEODReportByEmployee = (employeeId, params) =>
  API.get(`/super-admin/eod-reports/employee/${employeeId}`, { params });

export const getAssignmentStats = () =>
  API.get("/super-admin/work-assignments/stats");

export const getEODStats = () =>
  API.get("/super-admin/eod-reports/stats");

export const getPendingReports = () =>
  API.get("/super-admin/eod-reports/pending");

export const approveEODReport = (id, payload) =>
  API.post(`/super-admin/eod-reports/${id}/approve`, payload);

export const getDepartments = () =>
  API.get("/super-admin/departments");

export const getEmployees = () =>
  API.get("/super-admin/employees");

export const deleteEODReport = (id) =>
  API.delete(`/super-admin/eod-reports/${id}`);

export const rejectEODReport = (id) =>
  API.post(`/super-admin/eod-reports/${id}/reject`);