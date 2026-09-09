import API from "./api";

export const getClientPolicies = (params) =>
  API.get("/super-admin/client-policies", { params });

export const createClientPolicy = (payload) =>
  API.post("/super-admin/client-policies", payload);

export const updateClientPolicy = (id, payload) =>
  API.put(`/super-admin/client-policies/${id}`, payload);

export const deleteClientPolicy = (id) =>
  API.delete(`/super-admin/client-policies/${id}`);

export const toggleClientPolicy = (id) =>
  API.post(`/super-admin/client-policies/${id}/toggle`);

export const getCandidatePolicies = (params) =>
  API.get("/super-admin/candidate-policies", { params });

export const createCandidatePolicy = (payload) =>
  API.post("/super-admin/candidate-policies", payload);

export const updateCandidatePolicy = (id, payload) =>
  API.put(`/super-admin/candidate-policies/${id}`, payload);

export const deleteCandidatePolicy = (id) =>
  API.delete(`/super-admin/candidate-policies/${id}`);

export const toggleCandidatePolicy = (id) =>
  API.post(`/super-admin/candidate-policies/${id}/toggle`);

export const getPolicyStats = () =>
  API.get("/super-admin/work-policies/stats");

export const getPolicyLogs = (params) =>
  API.get("/super-admin/work-policies/logs", { params });
