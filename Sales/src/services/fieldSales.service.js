import API from "../api/axios";

export const getLeads = () =>
  API.get("/sales/field-sales");

export const createLead = (payload) =>
  API.post("/sales/field-sales", payload);

export const updateLead = (id, payload) =>
  API.put(`/sales/field-sales/${id}`, payload);

export const updateLocation = (id, payload) =>
  API.put(`/sales/field-sales/location/${id}`, payload);