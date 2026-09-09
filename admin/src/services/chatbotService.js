import API from "./api";

export const getConversations = (params) =>
  API.get("/super-admin/chatbot/conversations", { params });

export const getConversationMessages = (conversationId) =>
  API.get(`/super-admin/chatbot/conversations/${conversationId}/messages`);

export const sendMessage = (conversationId, payload) =>
  API.post(`/super-admin/chatbot/conversations/${conversationId}/messages`, payload);

export const createConversation = (payload) =>
  API.post("/super-admin/chatbot/conversations", payload);

export const getChatStats = () =>
  API.get("/super-admin/chatbot/stats");

export const getUnreadCount = () =>
  API.get("/super-admin/chatbot/unread");

export const markAsRead = (conversationId) =>
  API.post(`/super-admin/chatbot/conversations/${conversationId}/read`);

export const closeConversation = (conversationId) =>
  API.post(`/super-admin/chatbot/conversations/${conversationId}/close`);

export const getChatbotSettings = () =>
  API.get("/super-admin/chatbot/settings");

export const updateChatbotSettings = (payload) =>
  API.put("/super-admin/chatbot/settings", payload);

export const getQuickReplies = () =>
  API.get("/super-admin/chatbot/quick-replies");

export const createQuickReply = (payload) =>
  API.post("/super-admin/chatbot/quick-replies", payload);

export const deleteQuickReply = (id) =>
  API.delete(`/super-admin/chatbot/quick-replies/${id}`);
