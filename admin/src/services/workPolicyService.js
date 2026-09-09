import API from "./api";

export const getWorkPolicies = (params) =>
  API.get("/super-admin/work-policies", { params });

export const createWorkPolicy = (payload) =>
  API.post("/super-admin/work-policies", payload);

export const updateWorkPolicy = (id, payload) =>
  API.put(`/super-admin/work-policies/${id}`, payload);

export const deleteWorkPolicy = (id) =>
  API.delete(`/super-admin/work-policies/${id}`);

export const toggleWorkPolicy = (id) =>
  API.post(`/super-admin/work-policies/${id}/toggle`);

export const getWorkTargets = (params) =>
  API.get("/super-admin/work-targets", { params });

export const getEmployeeTargets = (employeeId) =>
  API.get(`/super-admin/work-targets/employee/${employeeId}`);

export const createWorkTarget = (payload) =>
  API.post("/super-admin/work-targets", payload);

export const updateWorkTarget = (id, payload) =>
  API.put(`/super-admin/work-targets/${id}`, payload);

export const deleteWorkTarget = (id) =>
  API.delete(`/super-admin/work-targets/${id}`);

export const updateTargetProgress = (id, progress) =>
  API.post(`/super-admin/work-targets/${id}/progress`, { progress });

export const getTargetStats = () =>
  API.get("/super-admin/work-targets/stats");

export const getTargetHistory = (targetId) =>
  API.get(`/super-admin/work-targets/${targetId}/history`);

export const approveTarget = (id) =>
  API.post(`/super-admin/work-targets/${id}/approve`);

export const bulkAssignTargets = (payload) =>
  API.post("/super-admin/work-targets/bulk-assign", payload);
