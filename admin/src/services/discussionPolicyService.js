import API from "./api";

export const getDiscussionPolicies = (params) =>
  API.get("/super-admin/discussion-policies", { params });

export const createDiscussionPolicy = (payload) =>
  API.post("/super-admin/discussion-policies", payload);

export const updateDiscussionPolicy = (id, payload) =>
  API.put(`/super-admin/discussion-policies/${id}`, payload);

export const deleteDiscussionPolicy = (id) =>
  API.delete(`/super-admin/discussion-policies/${id}`);

export const toggleDiscussionPolicy = (id) =>
  API.post(`/super-admin/discussion-policies/${id}/toggle`);

export const getDiscussionRequests = (params) =>
  API.get("/super-admin/discussion-requests", { params });

export const createDiscussionRequest = (payload) =>
  API.post("/super-admin/discussion-requests", payload);

export const updateDiscussionRequest = (id, payload) =>
  API.put(`/super-admin/discussion-requests/${id}`, payload);

export const getDiscussionLogs = (params) =>
  API.get("/super-admin/discussion-logs", { params });

export const escalateDiscussion = (id, payload) =>
  API.post(`/super-admin/discussion-requests/${id}/escalate`, payload);

export const resolveDiscussion = (id, payload) =>
  API.post(`/super-admin/discussion-requests/${id}/resolve`, payload);

export const getPolicyStats = () =>
  API.get("/super-admin/discussion-policies/stats");
