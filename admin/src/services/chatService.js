import API from "./api";

export const getConversations = () => {
  return API.get("/automation/chatbot/conversations", { params: { limit: 50 } });
};

export const getMessages = (conversationId) => {
  return API.get(`/chat/messages/${conversationId}`);
};

export const sendMessage = (data) => {
  return API.post("/automation/chatbot/message", data);
};
