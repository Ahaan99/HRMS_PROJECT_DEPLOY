import { db } from "../../config/db.js";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "phi3";

const FALLBACK_RESPONSES = {
  leave: "Employees get 12 casual leaves per year. If you want, I can also tell you how to apply for leave.",
  attendance: "Attendance timing is 9:30 AM to 6:30 PM. If you need the attendance policy details, I can share that too.",
  salary: "Salary cycles are processed at the end of each month. Please check payroll for the exact payment date.",
  default: "I am your HR assistant. Please provide more details so I can help you accurately.",
};

const detectIntent = (message) => {
  const text = message.toLowerCase();

  if (text.includes("leave") || text.includes("vacation") || text.includes("holiday")) {
    return "leave";
  }

  if (text.includes("attendance") || text.includes("time") || text.includes("shift")) {
    return "attendance";
  }

  if (text.includes("salary") || text.includes("pay") || text.includes("payroll")) {
    return "salary";
  }

  return "default";
};

const getConversationHistory = async (conversationId) => {
  const [rows] = await db.query(
    `SELECT sender_type, sender_id, message, created_at FROM messages WHERE conversation_id = ? ORDER BY id DESC LIMIT 10`,
    [conversationId],
  );

  return rows.reverse();
};

const buildPrompt = (message, intent, history) => {
  const historyText = history
    .map((item) => {
      const sender = item.sender_type === "ai" ? "Assistant" : item.sender_type === "hr" ? "HR" : "Client";
      return `${sender}: ${item.message}`;
    })
    .join("\n");

  return `You are an HRMS assistant for a client-to-HR conversation. Use the conversation history and answer clearly.
Conversation history:
${historyText}

Current user message:
${message}

Respond as a helpful HR assistant focused on the intent: ${intent}.`;
};

const callOllama = async (prompt) => {
  try {
    const response = await fetch(`${OLLAMA_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama request failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data?.choices?.[0]?.message?.content?.trim() || null;
  } catch (error) {
    console.error("Ollama error:", error);
    return null;
  }
};

const fallbackResponse = (intent) => {
  return FALLBACK_RESPONSES[intent] || FALLBACK_RESPONSES.default;
};

export const generateAIResponse = async ({ conversationId, message }) => {
  const intent = detectIntent(message);
  const history = await getConversationHistory(conversationId);
  const prompt = buildPrompt(message, intent, history);

  const ollamaReply = await callOllama(prompt);
  if (ollamaReply) {
    return ollamaReply;
  }

  return fallbackResponse(intent);
};
