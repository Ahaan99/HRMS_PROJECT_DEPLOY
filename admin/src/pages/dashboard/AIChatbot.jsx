import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { PageHero } from "../../components/common/Premium";
import {
  Send,
  Bot,
  User,
  Database,
  BookOpen,
  Sparkles,
  Trash2,
  Users,
  CalendarDays,
  Wallet,
  Briefcase,
} from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

/* capability tiles shown in the empty state — each doubles as a shortcut */
const CAPABILITIES = [
  {
    icon: Users,
    title: "People",
    desc: "Headcount, departments, profiles",
    prompt: "How many employees do we have?",
    accent: "#4f63f0",
    soft: "#eef0fe",
  },
  {
    icon: CalendarDays,
    title: "Leave",
    desc: "Requests, balances, policy",
    prompt: "Pending leave requests",
    accent: "#148662",
    soft: "#e7f5f0",
  },
  {
    icon: Wallet,
    title: "Payroll",
    desc: "Runs, payslips, deductions",
    prompt: "Latest payroll run",
    accent: "#b45309",
    soft: "#fdf3e3",
  },
  {
    icon: Briefcase,
    title: "Recruitment",
    desc: "Pipeline, jobs, AI interviews",
    prompt: "Recruitment pipeline status",
    accent: "#c73e4c",
    soft: "#fdeef0",
  },
];

const SUGGESTIONS = [
  "What is the leave policy?",
  "AI interview results",
  "Open job positions",
  "New web form submissions",
  "Office working hours",
];

const SOURCE_BADGE = {
  live_data: { label: "Live data", icon: Database, cls: "bg-[#e7f5f0] text-[#148662]" },
  faq: { label: "HR FAQ", icon: BookOpen, cls: "bg-[#eef0fe] text-[#4f63f0]" },
  llm: { label: "AI", icon: Sparkles, cls: "bg-[#f3effe] text-[#7c5cf0]" },
};

export default function AIChatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef(null);
  const sessionRef = useRef(`admin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

  const fresh = messages.length === 0;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const send = async (text) => {
    const q = (text ?? input).trim();
    if (!q || typing) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: q }]);
    setTyping(true);
    try {
      const token = localStorage.getItem("hrms_admin_token");
      const { data } = await axios.post(
        `${BASE_URL}/ai-chat/ask`,
        {
          message: q,
          session_id: sessionRef.current,
          user_type: "ADMIN",
        },
        { headers: token ? { Authorization: `Bearer ${token}` } : {}, timeout: 30000 },
      );
      setMessages((m) => [...m, { role: "bot", text: data.answer, source: data.source }]);
    } catch (err) {
      const status = err?.response?.status;
      const text =
        status === 401
          ? "Your session has expired. Please sign in again to use the assistant."
          : err?.response?.data?.message ||
            "Sorry — I couldn't reach the server. Please try again.";
      setMessages((m) => [...m, { role: "bot", text, source: "fallback" }]);
    } finally {
      setTyping(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex h-full flex-col p-4 sm:p-6" style={{ maxHeight: "calc(100vh - 80px)" }}>
      {/* header */}
      <div className="mb-4">
        <PageHero
          eyebrow="AI Assistant"
          title="HR Assistant"
          subtitle="Answers grounded in your live HRMS data"
          icon={Bot}
          actions={
            !fresh ? (
              <button
                onClick={() => setMessages([])}
                className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-bold text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                <Trash2 size={13} /> Clear chat
              </button>
            ) : null
          }
        />
      </div>

      {/* chat surface — everything lives inside one card */}
      <div className="card-premium flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {fresh ? (
            /* ═══ welcome / empty state ═══ */
            <div className="mx-auto flex min-h-full max-w-2xl flex-col justify-center py-4">
              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0b1220] text-white shadow-[0_10px_28px_-10px_rgba(11,18,32,0.5)]">
                  <Bot size={26} />
                </div>
                <h2 className="mt-4 text-xl font-bold tracking-tight text-[#0b1220]">
                  What do you want to know?
                </h2>
                <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-[#7b8698]">
                  I answer with live data straight from your system — employees, leave,
                  payroll, recruitment, SOPs and more.
                </p>
              </div>

              {/* capability tiles */}
              <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {CAPABILITIES.map((c) => (
                  <button
                    key={c.title}
                    onClick={() => send(c.prompt)}
                    className="group flex items-start gap-3 rounded-xl border border-[#e6e9f0] bg-white p-4 text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-[#d5dae4] hover:shadow-[0_10px_24px_-12px_rgba(11,18,32,0.18)]"
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-transform duration-150 group-hover:scale-105"
                      style={{ background: c.soft, color: c.accent }}
                    >
                      <c.icon size={17} />
                    </span>
                    <span>
                      <span className="block text-[13px] font-bold text-[#0b1220]">{c.title}</span>
                      <span className="mt-0.5 block text-[11px] leading-relaxed text-[#7b8698]">
                        {c.desc}
                      </span>
                    </span>
                  </button>
                ))}
              </div>

              {/* quick questions */}
              <div className="mt-6">
                <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7b8698]">
                  Or try one of these
                </p>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="rounded-full border border-[#e6e9f0] bg-[#f7f8fb] px-3 py-1.5 text-xs font-medium text-[#33405c] transition hover:border-[#4f63f0] hover:bg-[#eef0fe] hover:text-[#4f63f0]"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* ═══ conversation ═══ */
            <div className="space-y-4">
              {messages.map((m, i) => {
                const badge = SOURCE_BADGE[m.source];
                return (
                  <div key={i} className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : ""}`}>
                    {m.role === "bot" && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0b1220] text-white">
                        <Bot size={15} />
                      </div>
                    )}
                    <div className={`max-w-[75%] ${m.role === "user" ? "order-first" : ""}`}>
                      <div
                        className={`whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                          m.role === "user"
                            ? "rounded-br-sm bg-[#4f63f0] text-white"
                            : "rounded-bl-sm border border-[#eceff4] bg-[#f7f8fb] text-[#33405c]"
                        }`}
                      >
                        {m.text}
                      </div>
                      {badge && (
                        <span
                          className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${badge.cls}`}
                        >
                          <badge.icon size={10} /> {badge.label}
                        </span>
                      )}
                    </div>
                    {m.role === "user" && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eef0fe] text-[#4f63f0]">
                        <User size={15} />
                      </div>
                    )}
                  </div>
                );
              })}
              {typing && (
                <div className="flex gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0b1220] text-white">
                    <Bot size={15} />
                  </div>
                  <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-[#eceff4] bg-[#f7f8fb] px-4 py-3">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#7b8698]" />
                    <span
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#7b8698]"
                      style={{ animationDelay: "120ms" }}
                    />
                    <span
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#7b8698]"
                      style={{ animationDelay: "240ms" }}
                    />
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>
          )}
        </div>

        {/* composer — attached to the card, send button never obscured */}
        <div className="border-t border-[#e6e9f0] bg-[#fbfcfe] p-3 sm:p-4">
          <div className="flex items-end gap-2">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask about employees, leave, payroll, recruitment…"
              className="input-premium flex-1 resize-none !py-3"
            />
            <button
              onClick={() => send()}
              disabled={typing || !input.trim()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#4f63f0] text-white shadow-[0_6px_16px_-6px_rgba(79,99,240,0.55)] transition hover:bg-[#3f51d6] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
              aria-label="Send message"
            >
              <Send size={17} />
            </button>
          </div>
          <p className="mt-1.5 text-center text-[10px] text-[#7b8698]">
            Enter to send · Shift+Enter for a new line
          </p>
        </div>
      </div>
    </div>
  );
}
