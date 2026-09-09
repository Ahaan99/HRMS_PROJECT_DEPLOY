import API from "./api";

export const getSubscriptionPlans = (params) =>
  API.get("/super-admin/subscription/plans", { params });

export const createSubscriptionPlan = (payload) =>
  API.post("/super-admin/subscription/plans", payload);

export const updateSubscriptionPlan = (id, payload) =>
  API.put(`/super-admin/subscription/plans/${id}`, payload);

export const deleteSubscriptionPlan = (id) =>
  API.delete(`/super-admin/subscription/plans/${id}`);

export const getActiveSubscriptions = (params) =>
  API.get("/super-admin/subscription/active", { params });

export const getSubscription = (id) =>
  API.get(`/super-admin/subscription/${id}`);

export const createSubscription = (payload) =>
  API.post("/super-admin/subscription", payload);

export const updateSubscription = (id, payload) =>
  API.put(`/super-admin/subscription/${id}`, payload);

export const cancelSubscription = (id) =>
  API.post(`/super-admin/subscription/${id}/cancel`);

export const renewSubscription = (id) =>
  API.post(`/super-admin/subscription/${id}/renew`);

export const upgradePlan = (id, planId) =>
  API.post(`/super-admin/subscription/${id}/upgrade`, { planId });

export const getSubscriptionStats = () =>
  API.get("/super-admin/subscription/stats");

export const getPaymentHistory = (subscriptionId) =>
  API.get(`/super-admin/subscription/${subscriptionId}/payments`);

export const exportSubscriptions = (params) =>
  API.get("/super-admin/subscription/export", { params, responseType: "blob" });
