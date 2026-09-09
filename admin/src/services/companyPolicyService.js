import API from "./api";

export const getPolicies = (params) =>
  API.get("/super-admin/policies", { params });

export const getPolicy = (id) =>
  API.get(`/super-admin/policies/${id}`);

export const createPolicy = (payload) =>
  API.post("/super-admin/policies", payload);

export const updatePolicy = (id, payload) =>
  API.put(`/super-admin/policies/${id}`, payload);

export const deletePolicy = (id) =>
  API.delete(`/super-admin/policies/${id}`);

export const getPolicyCategories = () =>
  API.get("/super-admin/policies/categories");

export const getPolicyByCategory = (category) =>
  API.get(`/super-admin/policies/category/${category}`);

export const togglePolicy = (id) =>
  API.post(`/super-admin/policies/${id}/toggle`);

export const getPolicyLogs = (params) =>
  API.get("/super-admin/policies/logs", { params });

export const importPolicies = (formData) =>
  API.post("/super-admin/policies/import", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const exportPolicies = (params) =>
  API.get("/super-admin/policies/export", { params, responseType: "blob" });
