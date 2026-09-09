import React, { useEffect, useState, useRef } from "react";
import API from "../api/axios";
import { Send, Bot, User, Loader2 } from "lucide-react";

export default function ChatPage() {
  const [messages, setMessages] = useState([
    { role: "bot", content: "Hello! I am your HR Assistant. How can I help you today?", time: new Date() }
  ]);
  const [sessionId, setSessionId] = useState(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!text.trim()) return;
    const userText = text.trim();
    setMessages(prev => [...prev, { role: "user", content: userText, time: new Date() }]);
    setText("");
    setLoading(true);
    try {
      const res = await API.post("/automation/chatbot/message", {
        message: userText,
        session_id: sessionId,
        user_type: "EMPLOYEE",
      });
      const aiText = res.data?.data?.response || "Sorry, could not get a response.";
      setSessionId(res.data?.data?.session_id);
      setMessages(prev => [...prev, { role: "bot", content: aiText, time: new Date() }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "bot", content: "Connection error. Please try again.", time: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const fmt = (d) => new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col items-center p-4 bg-gray-50">
      <div className="flex-1 flex flex-col w-full max-w-3xl min-h-0 bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Bot className="text-white" size={22} />
          </div>
          <div>
            <h3 className="text-white font-semibold">HR Assistant</h3>
            <p className="text-blue-100 text-xs flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full inline-block"></span> Online
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`flex gap-2 max-w-[75%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === "user" ? "bg-blue-600" : "bg-green-600"}`}>
                  {msg.role === "user" ? <User className="text-white" size={16} /> : <Bot className="text-white" size={16} />}
                </div>
                <div className={`rounded-2xl px-4 py-2 ${msg.role === "user" ? "bg-blue-600 text-white rounded-br-sm" : "bg-white text-gray-800 rounded-bl-sm shadow border border-gray-100"}`}>
                  <p className="text-sm whitespace-pre-line">{msg.content}</p>
                  <p className={`text-xs mt-1 ${msg.role === "user" ? "text-blue-200" : "text-gray-400"}`}>{fmt(msg.time)}</p>
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
                  <Bot className="text-white" size={16} />
                </div>
                <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow border border-gray-100 flex gap-1 items-center">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:"0ms"}}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:"150ms"}}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:"300ms"}}></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-gray-100 bg-white">
          <div className="flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyPress={handleKey}
              placeholder="Type your question..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={sendMessage}
              disabled={!text.trim() || loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white p-3 rounded-xl transition"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">Ask about leave, salary, attendance, or company policies</p>
        </div>
      </div>
    </div>
  );
}
