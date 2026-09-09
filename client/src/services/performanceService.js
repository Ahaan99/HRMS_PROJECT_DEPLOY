import API from "./api";

export const getPerformances = () =>
  API.get("/client/performance");

export const createPerformance = (payload) =>
  API.post("/client/performance", payload);

export const updatePerformance = (id, payload) =>
  API.put(`/client/performance/${id}`, payload);

export const deletePerformance = (id) =>
  API.delete(`/client/performance/${id}`);
