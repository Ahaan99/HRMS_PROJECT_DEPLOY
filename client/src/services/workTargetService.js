import API from "./api";

export const getWorkTargets = () =>
  API.get("/client/work-target");

export const createWorkTarget = (payload) =>
  API.post("/client/work-target", payload);

export const updateWorkTarget = (id, payload) =>
  API.put(`/client/work-target/${id}`, payload);

export const deleteWorkTarget = (id) =>
  API.delete(`/client/work-target/${id}`);
