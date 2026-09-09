import { db } from "../../config/db.js";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "phi3";

/* ---------------- live data intents (answers come from the real DB) ---------------- */

const fmtINR = (n) =>
  n === null || n === undefined ? "—" : "₹" + Number(n).toLocaleString("en-IN");

const INTENTS = [
  {
    name: "employee_count",
    match: /\b(how many|total|count|number of)\b.*\bemployees?\b|\bemployees?\b.*\b(count|total|how many)\b|\bheadcount\b/i,
    run: async () => {
      const [[{ total }]] = await db.query(
        "SELECT COUNT(*) AS total FROM employees WHERE isActive = 1",
      );
      const [byDept] = await db.query(
        `SELECT d.name, COUNT(e.id) AS c FROM employees e
         LEFT JOIN departments d ON d.id = e.departmentId
         WHERE e.isActive = 1 GROUP BY d.name ORDER BY c DESC`,
      );
      const parts = byDept.map((r) => `• ${r.name || "Unassigned"}: ${r.c}`).join("\n");
      return `We currently have ${total} active employees.\n\nBy department:\n${parts}`;
    },
  },
  {
    name: "leave_pending",
    match: /\b(pending|open|awaiting|unapproved)\b.*\bleaves?\b|\bleaves?\b.*\b(pending|approval)\b/i,
    run: async () => {
      const [rows] = await db.query(
        `SELECT la.status, COUNT(*) AS c FROM leave_applications la GROUP BY la.status`,
      );
      const pending = rows.find((r) => /pending/i.test(r.status))?.c || 0;
      const summary = rows.map((r) => `• ${r.status}: ${r.c}`).join("\n");
      const [recent] = await db.query(
        `SELECT e.name, lt.name AS type, la.from_date, la.days FROM leave_applications la
         LEFT JOIN employees e ON e.id = la.employee_id
         LEFT JOIN leave_types lt ON lt.id = la.leave_type_id
         WHERE la.status LIKE '%pending%' ORDER BY la.created_at DESC LIMIT 3`,
      );
      const list = recent
        .map(
          (r) =>
            `• ${r.name || "Unknown"} — ${r.type || "Leave"}, ${r.days} day(s) from ${new Date(r.from_date).toLocaleDateString()}`,
        )
        .join("\n");
      return `There are ${pending} leave application(s) awaiting approval.\n\nAll applications by status:\n${summary}${list ? `\n\nOldest pending:\n${list}` : ""}`;
    },
  },
  {
    name: "leave_policy",
    match: /\bleave (policy|types?|quota|entitlement|balance)\b|\bhow (many|much).*(leave|leaves)\b|\bcasual leave\b|\bsick leave\b|\bearned leave\b/i,
    run: async () => {
      const [types] = await db.query(
        "SELECT name, annual_quota, is_paid FROM leave_types ORDER BY id",
      );
      if (!types.length) return "No leave types are configured in the system yet.";
      const list = types
        .map(
          (t) =>
            `• ${t.name}: ${t.annual_quota} days/year (${t.is_paid ? "paid" : "unpaid"})`,
        )
        .join("\n");
      return `Leave entitlement configured in the system:\n${list}\n\nEmployees can apply from their portal; approvals show under Leave Management.`;
    },
  },
  {
    name: "payroll",
    match: /\b(payroll|salary|salaries|net pay|payslip)\b/i,
    run: async () => {
      const [[latest]] = await db.query(
        `SELECT month, COUNT(*) AS employees, SUM(net_salary) AS total,
                SUM(status = 'Paid') AS paid
         FROM payroll_runs GROUP BY month ORDER BY month DESC LIMIT 1`,
      );
      if (!latest) return "No payroll runs exist in the system yet.";
      return `Latest payroll run — ${latest.month}:\n• Employees processed: ${latest.employees}\n• Total net payout: ${fmtINR(latest.total)}\n• Marked paid: ${latest.paid}/${latest.employees}\n\nFull details are in Payroll Management.`;
    },
  },
  {
    name: "recruitment",
    match: /\b(candidates?|recruitment|hiring|pipeline)\b/i,
    run: async () => {
      const [[{ total }]] = await db.query(
        "SELECT COUNT(*) AS total FROM candidates WHERE isActive = 1",
      );
      const [statuses] = await db.query(
        `SELECT cs.name, COUNT(c.id) AS c FROM candidates c
         LEFT JOIN candidate_statuses cs ON cs.id = c.statusId
         WHERE c.isActive = 1 GROUP BY cs.name ORDER BY c DESC`,
      );
      const list = statuses.map((s) => `• ${s.name || "No status"}: ${s.c}`).join("\n");
      return `Recruitment pipeline: ${total} active candidate(s).\n\nBy stage:\n${list}`;
    },
  },
  {
    name: "interviews",
    match: /\b(ai )?interviews?\b/i,
    run: async () => {
      const [rows] = await db.query(
        `SELECT status, COUNT(*) AS c, AVG(score) AS avg_score FROM ai_interviews GROUP BY status`,
      );
      if (!rows.length) return "No AI interviews have been created yet.";
      const list = rows
        .map(
          (r) =>
            `• ${r.status}: ${r.c}${r.avg_score !== null ? ` (avg score ${Number(r.avg_score).toFixed(1)}/10)` : ""}`,
        )
        .join("\n");
      const [top] = await db.query(
        `SELECT candidate_name, job_title, score FROM ai_interviews
         WHERE score IS NOT NULL ORDER BY score DESC LIMIT 1`,
      );
      return `AI interviews:\n${list}${top.length ? `\n\nTop scorer: ${top[0].candidate_name} — ${Number(top[0].score).toFixed(1)}/10 (${top[0].job_title})` : ""}`;
    },
  },
  {
    name: "screenings",
    match: /\b(resume|ats|screening)\b/i,
    run: async () => {
      const [[{ total, avg }]] = await db.query(
        "SELECT COUNT(*) AS total, AVG(ats_score) AS avg FROM resume_screenings",
      );
      const [recent] = await db.query(
        `SELECT candidate_name, job_title, ats_score FROM resume_screenings
         ORDER BY created_at DESC LIMIT 3`,
      );
      const list = recent
        .map(
          (r) =>
            `• ${r.candidate_name || "Unknown"}${r.job_title ? ` (${r.job_title})` : ""}: ${r.ats_score !== null ? Number(r.ats_score).toFixed(0) + "/100" : "no ATS score"}`,
        )
        .join("\n");
      return `${total} resume(s) screened${avg !== null ? `, average ATS score ${Number(avg).toFixed(0)}/100` : ""}.\n\nMost recent:\n${list}`;
    },
  },
  {
    name: "jobs",
    match: /\b(open (positions?|roles?|jobs?)|job (board|post|opening)s?|vacanc)/i,
    run: async () => {
      const [jobs] = await db.query(
        `SELECT title, department, location, status FROM job_board_posts
         ORDER BY created_at DESC LIMIT 10`,
      );
      if (!jobs.length) return "There are no job posts on the job board yet.";
      const open = jobs.filter((j) => /open|active|published/i.test(j.status || ""));
      const list = jobs
        .map((j) => `• ${j.title} — ${j.department || "General"}, ${j.location || "N/A"} (${j.status})`)
        .join("\n");
      return `Job board has ${jobs.length} post(s), ${open.length} open:\n${list}`;
    },
  },
  {
    name: "webforms",
    match: /\bweb ?forms?\b|\bsubmissions?\b|\benquir(y|ies)\b/i,
    run: async () => {
      const [rows] = await db.query(
        `SELECT status, COUNT(*) AS c FROM web_form_submissions GROUP BY status`,
      );
      if (!rows.length) return "No web form submissions yet.";
      const newCount = rows.find((r) => /new/i.test(r.status))?.c || 0;
      const list = rows.map((r) => `• ${r.status}: ${r.c}`).join("\n");
      return `Web form inbox:\n${list}\n\n${newCount ? `${newCount} new submission(s) need attention in Web Forms.` : "Inbox is fully processed."}`;
    },
  },
  {
    name: "sops",
    match: /\bsops?\b|\bstandard operating\b/i,
    run: async () => {
      const [[{ total }]] = await db.query(
        "SELECT COUNT(*) AS total FROM sops WHERE is_active = 1",
      );
      const [[{ acks }]] = await db.query(
        "SELECT COUNT(*) AS acks FROM sop_acknowledgements",
      );
      return `There are ${total} active SOP(s) in the library with ${acks} employee acknowledgement(s) recorded. Manage them under SOP Management.`;
    },
  },
  {
    name: "exits",
    match: /\b(exit|resignation|attrition|notice period)s?\b/i,
    run: async () => {
      const [rows] = await db.query(
        `SELECT status, COUNT(*) AS c FROM exit_requests GROUP BY status`,
      );
      const [faq] = await db.query(
        `SELECT answer FROM hr_robo_faqs WHERE question LIKE '%notice period%' LIMIT 1`,
      );
      const list = rows.length
        ? "Exit requests:\n" + rows.map((r) => `• ${r.status}: ${r.c}`).join("\n")
        : "There are no exit requests in the system.";
      return `${list}${faq.length ? `\n\nNotice period policy: ${faq[0].answer}` : ""}`;
    },
  },
  {
    name: "holidays",
    match: /\bholidays?\b|\bholiday calendar\b/i,
    run: async () => {
      const [rows] = await db.query(
        `SELECT name, holiday_date FROM holidays
         WHERE holiday_date >= CURDATE() ORDER BY holiday_date LIMIT 5`,
      );
      if (!rows.length)
        return "No upcoming holidays are configured in the system yet. An admin can add them in company settings.";
      return (
        "Upcoming holidays:\n" +
        rows
          .map((r) => `• ${r.name} — ${new Date(r.holiday_date).toLocaleDateString()}`)
          .join("\n")
      );
    },
  },
  {
    name: "office_hours",
    match: /\b(office|work(ing)?) (hours|timings?)\b|\bshift( timing)?s?\b|\bcheck.?in\b/i,
    run: async () => {
      const [rows] = await db.query(
        `SELECT name, check_in_start, check_in_end, check_out_start, grace_minutes
         FROM shift_timings ORDER BY id`,
      );
      if (!rows.length) return "No shift timings are configured yet.";
      return (
        "Configured shifts:\n" +
        rows
          .map(
            (r) =>
              `• ${r.name}: check-in ${r.check_in_start}–${r.check_in_end}, check-out from ${r.check_out_start} (grace ${r.grace_minutes} min)`,
          )
          .join("\n")
      );
    },
  },
  {
    name: "departments",
    match: /\bdepartments?\b|\bdesignations?\b/i,
    run: async () => {
      const [deps] = await db.query(
        "SELECT name FROM departments WHERE isActive = 1 ORDER BY name",
      );
      const [[{ desigs }]] = await db.query(
        "SELECT COUNT(*) AS desigs FROM designations",
      );
      return `Active departments (${deps.length}): ${deps.map((d) => d.name).join(", ")}.\nDesignations configured: ${desigs}.`;
    },
  },
];

/* ---------------- FAQ knowledge base (hr_robo_faqs table) ---------------- */

const STOPWORDS = new Set([
  "what", "when", "where", "which", "who", "how", "does", "did", "the", "and",
  "for", "are", "was", "were", "can", "could", "will", "would", "should", "you",
  "your", "our", "have", "has", "had", "get", "much", "many", "with", "about",
  "there", "this", "that", "please", "tell",
]);

const searchFaqs = async (message) => {
  const [faqs] = await db.query("SELECT question, answer, keywords FROM hr_robo_faqs");
  const msgWords = message
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
  let best = null;
  let bestScore = 0;
  for (const f of faqs) {
    const hay = `${f.question} ${f.keywords || ""}`.toLowerCase();
    const score = msgWords.reduce((s, w) => s + (hay.includes(w) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      best = f;
    }
  }
  const needed = Math.min(2, Math.max(1, msgWords.length));
  return bestScore >= needed ? best : null;
};

/* ---------------- optional local LLM (only if actually running) ---------------- */

const callOllama = async (userMessage, userType) => {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 15000);
    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: false,
        messages: [
          {
            role: "system",
            content: `You are an HRMS assistant helping a ${userType}. Answer concisely and professionally. If the question needs company-specific data you don't have, say so and point to the relevant HRMS section.`,
          },
          { role: "user", content: userMessage },
        ],
      }),
    });
    clearTimeout(t);
    if (!response.ok) return null;
    const data = await response.json();
    return data?.message?.content?.trim() || null;
  } catch {
    return null;
  }
};

const HELP_TEXT = `I answer from your live HRMS data. Try asking:
• "How many employees do we have?"
• "Pending leave requests"
• "What is the leave policy?"
• "Latest payroll run"
• "Recruitment pipeline status"
• "AI interview results"
• "Resume screening summary"
• "Open job positions"
• "New web form submissions"
• "Office working hours"
• "Upcoming holidays"`;

/* ---------------- main handler ---------------- */

export const askAI = async (req, res) => {
  try {
    const { message, session_id, user_type } = req.body;
    if (!message?.trim())
      return res.status(400).json({ success: false, message: "Message is required" });

    let answer = null;
    let source = null;

    /* 1. greetings / help */
    if (/^\s*(hi|hello|hey|good (morning|afternoon|evening))\b/i.test(message)) {
      answer = `Hello! I'm your HRMS assistant — I answer with live data from your system.\n\n${HELP_TEXT}`;
      source = "assistant";
    } else if (/\b(help|what can you do|capabilities)\b/i.test(message)) {
      answer = HELP_TEXT;
      source = "assistant";
    }

    /* 2. live database intents */
    if (!answer) {
      for (const intent of INTENTS) {
        if (intent.match.test(message)) {
          try {
            answer = await intent.run();
            source = "live_data";
          } catch (e) {
            console.error(`Intent ${intent.name} failed:`, e.message);
          }
          break;
        }
      }
    }

    /* 3. FAQ knowledge base */
    if (!answer) {
      const faq = await searchFaqs(message);
      if (faq) {
        answer = faq.answer;
        source = "faq";
      }
    }

    /* 4. local LLM if available */
    if (!answer) {
      const llm = await callOllama(message, user_type || "employee");
      if (llm) {
        answer = llm;
        source = "llm";
      }
    }

    /* 5. honest fallback — never invent facts */
    if (!answer) {
      answer = `I couldn't find that in the HRMS data or the FAQ knowledge base, and I won't guess.\n\n${HELP_TEXT}`;
      source = "fallback";
    }

    if (session_id) {
      try {
        await db.query(
          `INSERT INTO chatbot_conversations
           (session_id, user_type, message, response, is_ai_response)
           VALUES (?, ?, ?, ?, 1)`,
          [session_id, user_type || "GENERAL", message, answer],
        );
      } catch (dbErr) {
        console.error("DB save error (non-fatal):", dbErr.message);
      }
    }

    res.json({ success: true, answer, source });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
