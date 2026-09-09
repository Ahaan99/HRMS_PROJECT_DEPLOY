import API from "./api";

export const getDepartments = () =>
  API.get("/client/masters/departments");

export const getDesignations = () =>
  API.get("/client/masters/designations");

export const getStatuses = () =>
  API.get("/client/masters/statuses");