import API from "./api";

export const getEmployees = () => 
  API.get("/client/employees");

export const createEmployee = (payload) =>
  API.post("/client/employees", payload);

export const updateEmployee = (id, payload) =>
  API.put(`/client/employees/${id}`, payload);

export const deleteEmployee = (id) =>
  API.delete(`/client/employees/${id}`);

