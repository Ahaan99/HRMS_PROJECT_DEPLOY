import API from "./api";

export const getLeads = () =>
  API.get("/client/field-sales");

export const createLead = (payload) =>
  API.post("/client/field-sales", payload);

export const updateLead = (id, payload) =>
  API.put(`/client/field-sales/${id}`, payload);

export const deleteLead = (id) =>
  API.delete(`/client/field-sales/${id}`);