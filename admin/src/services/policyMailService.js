import API from "./api";

export const getPolicyTemplates = () =>
  API.get("/super-admin/policy-mail/templates");

export const createPolicyTemplate = (payload) =>
  API.post("/super-admin/policy-mail/templates", payload);

export const updatePolicyTemplate = (id, payload) =>
  API.put(`/super-admin/policy-mail/templates/${id}`, payload);

export const deletePolicyTemplate = (id) =>
  API.delete(`/super-admin/policy-mail/templates/${id}`);

export const sendPolicyMail = (payload) =>
  API.post("/super-admin/policy-mail/send", payload);

export const sendBulkPolicyMail = (payload) =>
  API.post("/super-admin/policy-mail/send-bulk", payload);

export const schedulePolicyMail = (payload) =>
  API.post("/super-admin/policy-mail/schedule", payload);

export const getPolicyMailLogs = (params) =>
  API.get("/super-admin/policy-mail/logs", { params });

export const getPolicyMailStats = () =>
  API.get("/super-admin/policy-mail/stats");

export const getEmployeesForPolicy = () =>
  API.get("/super-admin/employees");

export const cancelScheduledMail = (id) =>
  API.delete(`/super-admin/policy-mail/schedule/${id}`);
