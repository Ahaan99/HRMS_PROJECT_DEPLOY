import { db } from "../../config/db.js";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "phi3";

/* ------------------------------------------------------------------ */
/* Live HRMS context injected into every conversation                   */
/* ------------------------------------------------------------------ */
const buildContext = async () => {
  const q = async (sql) => {
    try {
      const [[row]] = await db.query(sql);
      return row?.c ?? 0;
    } catch {
      return "n/a";
    }
  };
  const [employees, candidates, pendingLeaves, todayAttendance, openBugs, visitors] =
    await Promise.all([
      q("SELECT COUNT(*) c FROM employees WHERE isActive = 1"),
      q("SELECT COUNT(*) c FROM candidates"),
      q("SELECT COUNT(*) c FROM leave_applications WHERE status = 'Pending'"),
      q("SELECT COUNT(*) c FROM attendance WHERE DATE(date) = CURDATE()"),
      q("SELECT COUNT(*) c FROM it_bugs WHERE status != 'Closed'"),
      q("SELECT COUNT(*) c FROM visitors WHERE DATE(check_in) = CURDATE()"),
    ]);
  return { employees, candidates, pendingLeaves, todayAttendance, openBugs, visitors };
};

const SYSTEM_PROMPT = (ctx) => `You are the HRMS Voice Assistant for Recruweb HRMS.
Answer briefly (1-3 sentences), in plain language, suitable for text-to-speech.
Live system stats right now: active employees: ${ctx.employees}, candidates in ATS: ${ctx.candidates}, pending leave requests: ${ctx.pendingLeaves}, attendance punches today: ${ctx.todayAttendance}, open IT bugs: ${ctx.openBugs}, visitors today: ${ctx.visitors}.
You can also guide users to portal pages: leave (/dashboard/leave), attendance (/dashboard/attendance), payroll (/dashboard/payroll), invoices, analytics, master control, advanced search, documents (/dashboard/hr-documents).
If asked something outside HRMS, politely decline.`;

/* Rule-based fallback when no LLM is reachable */
const ruleAnswer = (msg, ctx) => {
  const m = msg.toLowerCase();
  if (/employee|headcount|staff/.test(m))
    return `There are ${ctx.employees} active employees in the system.`;
  if (/leave/.test(m))
    return `There are ${ctx.pendingLeaves} pending leave requests. You can review them on the Leave Management page.`;
  if (/attendance|punch/.test(m))
    return `${ctx.todayAttendance} attendance punches have been recorded today.`;
  if (/candidate|recruit|ats/.test(m))
    return `There are ${ctx.candidates} candidates in the ATS pipeline.`;
  if (/bug|issue|ticket/.test(m))
    return `There are ${ctx.openBugs} open IT bugs right now.`;
  if (/visitor/.test(m))
    return `${ctx.visitors} visitors have checked in today.`;
  if (/hello|hi|hey/.test(m))
    return "Hello! Ask me about employees, leaves, attendance, candidates, bugs, or visitors.";
  return "I can report live HRMS stats: employees, pending leaves, attendance, candidates, IT bugs and visitors. (AI model offline — using quick answers.)";
};

/* Try OpenAI-compatible API first (if key set), then Ollama */
const llmAnswer = async (messages) => {
  const key = process.env.OPENAI_API_KEY;
  if (key) {
    try {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          messages,
          max_tokens: 220,
          temperature: 0.4,
        }),
        // Timeout zaroori hai: Hostinger par outbound request hang ho sakti hai,
        // bina timeout ke assistant kabhi reply nahi karta
        signal: AbortSignal.timeout(20000),
      });
      if (r.ok) {
        const j = await r.json();
        const text = j.choices?.[0]?.message?.content?.trim();
        if (text) return { text, engine: "openai" };
      }
    } catch (e) {
      console.error("[assistant] openai:", e.message);
    }
  }
  try {
    const r = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: OLLAMA_MODEL, messages, stream: false }),
      signal: AbortSignal.timeout(25000),
    });
    if (r.ok) {
      const j = await r.json();
      const text = j.message?.content?.trim();
      if (text) return { text, engine: "ollama" };
    }
  } catch (e) {
    console.error("[assistant] ollama:", e.message);
  }
  return null;
};

/* POST /chat  { message, history?: [{role, content}] } */
export const chat = async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message?.trim())
      return res
        .status(400)
        .json({ success: false, message: "message is required" });

    const ctx = await buildContext();
    const messages = [
      { role: "system", content: SYSTEM_PROMPT(ctx) },
      ...history.slice(-6).map((h) => ({
        role: h.role === "assistant" ? "assistant" : "user",
        content: String(h.content).slice(0, 500),
      })),
      { role: "user", content: message.trim().slice(0, 1000) },
    ];

    const llm = await llmAnswer(messages);
    res.json({
      success: true,
      reply: llm ? llm.text : ruleAnswer(message, ctx),
      engine: llm ? llm.engine : "rules",
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
