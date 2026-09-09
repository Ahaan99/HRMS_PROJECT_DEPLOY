import API from "./api";

export const getAIConversations = (params) =>
  API.get("/super-admin/ai-chat/conversations", { params });

export const getAIConversation = (id) =>
  API.get(`/super-admin/ai-chat/conversations/${id}`);

export const sendAIMessage = (conversationId, payload) =>
  API.post(
    `/super-admin/ai-chat/conversations/${conversationId}/message`,
    payload
  );

export const createAIConversation = (payload) =>
  API.post("/super-admin/ai-chat/conversations", payload);

export const getAIChatStats = () =>
  API.get("/super-admin/ai-chat/stats");

export const getAIChatLogs = (params) =>
  API.get("/super-admin/ai-chat/logs", { params });

export const getAIResponses = () =>
  API.get("/super-admin/ai-chat/responses");

export const createAIResponse = (payload) =>
  API.post("/super-admin/ai-chat/responses", payload);

export const updateAIResponse = (id, payload) =>
  API.put(`/super-admin/ai-chat/responses/${id}`, payload);

export const deleteAIResponse = (id) =>
  API.delete(`/super-admin/ai-chat/responses/${id}`);

export const getAIAnalytics = () =>
  API.get("/super-admin/ai-chat/analytics");

export const trainAI = (payload) =>
  API.post("/super-admin/ai-chat/train", payload);

export const getAIInsights = () =>
  API.get("/super-admin/ai-chat/insights");
