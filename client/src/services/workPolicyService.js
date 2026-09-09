import API from "./api";

// GET
export const getWorkPolicies = () =>
  API.get("/client/work-policy");

// CREATE
export const createWorkPolicy = (payload) =>
  API.post("/client/work-policy", payload);

// UPDATE
export const updateWorkPolicy = (id, payload) =>
  API.put(`/client/work-policy/${id}`, payload);

// DELETE
export const deleteWorkPolicy = (id) =>
  API.delete(`/client/work-policy/${id}`);