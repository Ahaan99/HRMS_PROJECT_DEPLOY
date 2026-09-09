import { useEffect, useState, useRef } from "react";
import API from "../../services/api";
import { Send, Loader2, Search, MessageCircle, ArrowLeft } from "lucide-react";

export default function ClientChatPage() {
  const [hrList, setHrList] = useState([]);
  const [search, setSearch] = useState("");
  const [activeHR, setActiveHR] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const firstLoadRef = useRef(true);

  /* load HR directory */
  useEffect(() => {
    API.get("/chat/client/hrs")
      .then((res) => setHrList(res.data.data || []))
      .catch((err) => console.error(err));
  }, []);

  /* start / open conversation when an HR is selected */
  useEffect(() => {
    if (!activeHR) return;
    setConversationId(null);
    setMessages([]);
    firstLoadRef.current = true;
    API.post("/chat/client/start", { hrId: activeHR.id })
      .then((res) => setConversationId(res.data.conversationId))
      .catch((err) => console.error(err));
  }, [activeHR]);

  /* load + poll messages */
  useEffect(() => {
    if (!conversationId) return;
    const load = () =>
      API.get(`/chat/messages/${conversationId}`)
        .then((res) => setMessages(res.data.data || []))
        .catch(() => {});
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [conversationId]);

  useEffect(() => {
    if (firstLoadRef.current) {
      bottomRef.current?.scrollIntoView();
      firstLoadRef.current = false;
      return;
    }
    const container = bottomRef.current?.parentElement;
    if (!container) return;
    const nearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      120;
    if (nearBottom) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!text.trim() || sending || !conversationId) return;
    setSending(true);
    try {
      await API.post("/chat/client/send", {
        conversationId,
        message: text.trim(),
      });
      setMessages((prev) => [
        ...prev,
        {
          sender_type: "client",
          message: text.trim(),
          created_at: new Date().toISOString(),
        },
      ]);
      setText("");
    } catch (err) {
      console.error("Send error:", err);
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      if (e.nativeEvent.isComposing || e.keyCode === 229) return;
      e.preventDefault();
      sendMessage();
    }
  };

  const fmt = (d) =>
    new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const dayLabel = (d) => {
    const date = new Date(d);
    const today = new Date();
    const yest = new Date();
    yest.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yest.toDateString()) return "Yesterday";
    return date.toLocaleDateString([], {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const filtered = hrList.filter((h) =>
    h.name?.toLowerCase().includes(search.toLowerCase()),
  );

  let lastDay = null;

  return (
    <div className="h-[calc(100vh-110px)] flex p-2 sm:p-4">
      <div className="flex-1 flex card-premium overflow-hidden">
        {/* HR list — full width on mobile when no chat open, hidden when chat open */}
        <div
          className={`${
            activeHR ? "hidden md:flex" : "flex"
          } w-full md:w-72 md:border-r border-gray-100 dark:border-gray-700 flex-col shrink-0`}
        >
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="font-bold text-gray-800 dark:text-gray-100">HR Support</h3>
            <div className="mt-2 relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search HR..."
                className="w-full bg-gray-100 dark:bg-gray-700 dark:text-gray-100 rounded-full pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-800"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {filtered.map((hr) => {
              const isActive = activeHR?.id === hr.id;
              return (
                <div
                  key={hr.id}
                  onClick={() => setActiveHR(hr)}
                  className={`p-3.5 border-b border-gray-50 dark:border-gray-700/60 cursor-pointer transition-all flex items-center gap-3 ${
                    isActive
                      ? "bg-violet-50 dark:bg-violet-900/20 border-l-4 border-l-violet-500"
                      : "hover:bg-gray-50 dark:hover:bg-gray-700/40 border-l-4 border-l-transparent"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
                    {hr.name?.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-800 dark:text-gray-100 text-sm truncate">
                      {hr.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">HR Team</div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="p-6 text-center text-sm text-gray-400 dark:text-gray-500">
                No HR found
              </div>
            )}
          </div>
        </div>

        {/* chat window */}
        {!activeHR ? (
          <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-gray-50 dark:bg-gray-800/60 text-gray-400 dark:text-gray-500">
            <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/40 dark:to-indigo-900/40 rounded-full flex items-center justify-center mb-4">
              <MessageCircle size={40} className="text-violet-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-1">
              Select HR to start chatting
            </h3>
            <p className="text-sm">Choose an HR member from the list</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 min-w-0">
            <div className="h-16 flex items-center px-3 sm:px-5 border-b border-gray-100 dark:border-gray-700 gap-2 sm:gap-3 shrink-0">
              <button
                onClick={() => setActiveHR(null)}
                aria-label="Back to HR list"
                className="md:hidden p-2 -ml-1 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 flex items-center justify-center text-white font-bold shrink-0">
                {activeHR.name?.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-gray-800 dark:text-gray-100 truncate">
                  {activeHR.name}
                </div>
                <div className="text-xs text-green-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block"></span>
                  Online
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-10 py-4 bg-gradient-to-b from-gray-50 to-violet-50/40 dark:from-gray-800/60 dark:to-gray-800/30 scrollbar-thin-premium">
              {messages.map((msg, index) => {
                const isMine = msg.sender_type === "client";
                const day = dayLabel(msg.created_at);
                const showDay = day !== lastDay;
                lastDay = day;
                return (
                  <div key={msg.id || `${msg.created_at}-${index}`}>
                    {showDay && (
                      <div className="flex justify-center my-3">
                        <span className="bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-300 text-[11px] font-medium px-3 py-1 rounded-lg shadow-sm">
                          {day}
                        </span>
                      </div>
                    )}
                    <div
                      className={`flex mb-1.5 ${isMine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`relative max-w-[85%] sm:max-w-[70%] px-3 py-1.5 shadow-sm text-sm leading-relaxed ${
                          isMine
                            ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-2xl rounded-tr-md shadow-md shadow-indigo-600/15"
                            : "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-2xl rounded-tl-md border border-gray-100 dark:border-gray-600"
                        }`}
                      >
                        {!isMine && (
                          <div className="text-[11px] text-indigo-600 dark:text-indigo-300 font-semibold mb-0.5">
                            {activeHR.name}
                          </div>
                        )}
                        <span className="whitespace-pre-line break-words align-middle">
                          {msg.message}
                        </span>
                        <span className="inline-block float-right ml-2 mt-2 text-[10px] opacity-60 select-none">
                          {fmt(msg.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <div className="px-3 sm:px-4 py-3 border-t border-gray-100 dark:border-gray-700 shrink-0">
              <div className="flex items-center gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Type a message"
                  className="flex-1 min-w-0 bg-white dark:bg-gray-700 dark:text-gray-100 border rounded-full px-4 sm:px-5 py-2.5 outline-none border-gray-200 dark:border-gray-600 focus:border-violet-400 focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-800 text-sm shadow-sm"
                />
                <button
                  onClick={sendMessage}
                  disabled={!text.trim() || sending || !conversationId}
                  aria-label="Send message"
                  className="w-11 h-11 rounded-full flex items-center justify-center bg-gradient-to-br from-violet-600 to-indigo-600 disabled:from-gray-300 disabled:to-gray-300 dark:disabled:from-gray-600 dark:disabled:to-gray-600 text-white shadow-md shadow-indigo-600/25 hover:shadow-lg transition shrink-0"
                >
                  {sending ? (
                    <Loader2 className="animate-spin" size={19} />
                  ) : (
                    <Send size={19} />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
