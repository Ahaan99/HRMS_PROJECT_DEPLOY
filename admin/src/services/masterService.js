import API from "./api";

export const getDepartments = () => API.get("/super-admin/departments");
export const getDesignations = () => API.get("/super-admin/designations");
export const getStatuses = () => API.get("/super-admin/statuses");


