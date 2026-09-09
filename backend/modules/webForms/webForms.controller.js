import crypto from "crypto";
import { db } from "../../config/db.js";

/* ---------- PUBLIC: website form submission (X-API-Key protected) ---------- */
export const submitForm = async (req, res) => {
  try {
    const apiKey = req.headers["x-api-key"];
    if (!apiKey)
      return res.status(401).json({ success: false, message: "Missing X-API-Key header" });
    const [[key]] = await db.query(
      "SELECT id FROM web_form_keys WHERE api_key = ? AND is_active = 1",
      [apiKey],
    );
    if (!key)
      return res.status(401).json({ success: false, message: "Invalid API key" });

    const { form_type = "contact", name, email, phone, subject, message, ...rest } = req.body;
    if (!name?.trim())
      return res.status(400).json({ success: false, message: "name is required" });
    if (!email?.trim() && !phone?.trim())
      return res.status(400).json({ success: false, message: "email or phone required" });

    const allowedTypes = [
      "contact",
      "job_application",
      "enquiry",
      "demo_request",
      "vendor_registration",
      "employee_new_joining",
    ];
    const type = allowedTypes.includes(form_type) ? form_type : "contact";
    const source = req.headers.origin || req.headers.referer || "api";

    const [r] = await db.query(
      `INSERT INTO web_form_submissions
       (form_type, name, email, phone, subject, message, payload, source)
       VALUES (?,?,?,?,?,?,?,?)`,
      [
        type,
        name.trim().slice(0, 150),
        email?.trim().slice(0, 150) || null,
        phone?.trim().slice(0, 30) || null,
        subject?.trim().slice(0, 200) || null,
        message?.trim() || null,
        Object.keys(rest).length ? JSON.stringify(rest) : null,
        String(source).slice(0, 150),
      ],
    );
    res.json({ success: true, id: r.insertId, message: "Submission received" });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

/* ---------- ADMIN: inbox ---------- */
export const listSubmissions = async (req, res) => {
  try {
    const { status, form_type } = req.query;
    const where = [];
    const params = [];
    if (status) {
      where.push("status = ?");
      params.push(status);
    }
    if (form_type) {
      where.push("form_type = ?");
      params.push(form_type);
    }
    const [rows] = await db.query(
      `SELECT * FROM web_form_submissions
       ${where.length ? "WHERE " + where.join(" AND ") : ""}
       ORDER BY created_at DESC LIMIT 500`,
      params,
    );
    const [[counts]] = await db.query(
      "SELECT COUNT(*) AS total, SUM(status='New') AS unread FROM web_form_submissions",
    );
    res.json({ success: true, submissions: rows, counts });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["New", "Read", "Converted", "Archived"].includes(status))
      return res.status(400).json({ success: false, message: "Invalid status" });
    await db.query("UPDATE web_form_submissions SET status = ? WHERE id = ?", [
      status,
      req.params.id,
    ]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

/* Convert a job_application submission into a candidate record */
export const convertToCandidate = async (req, res) => {
  try {
    const [[sub]] = await db.query(
      "SELECT * FROM web_form_submissions WHERE id = ?",
      [req.params.id],
    );
    if (!sub) return res.status(404).json({ success: false, message: "Not found" });

    const payload = sub.payload
      ? typeof sub.payload === "string"
        ? JSON.parse(sub.payload)
        : sub.payload
      : {};
    const candidateId = "WEB-" + Date.now().toString(36).toUpperCase();
    await db.query(
      `INSERT INTO candidates (candidateId, name, email, phone, jobTitle, note)
       VALUES (?,?,?,?,?,?)`,
      [
        candidateId,
        sub.name,
        sub.email || `${candidateId.toLowerCase()}@no-email.local`,
        sub.phone,
        payload.position || sub.subject || "General Application",
        `From website form #${sub.id}${sub.message ? ": " + sub.message.slice(0, 400) : ""}`,
      ],
    );
    await db.query(
      "UPDATE web_form_submissions SET status = 'Converted' WHERE id = ?",
      [sub.id],
    );
    res.json({ success: true, message: "Converted to candidate" });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

/* ---------- ADMIN: API keys ---------- */
export const listKeys = async (_req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, api_key, label, is_active, created_at FROM web_form_keys ORDER BY id",
    );
    res.json({ success: true, keys: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const createKey = async (req, res) => {
  try {
    const { label } = req.body;
    if (!label?.trim())
      return res.status(400).json({ success: false, message: "label required" });
    const apiKey = crypto.randomBytes(32).toString("hex");
    await db.query("INSERT INTO web_form_keys (api_key, label) VALUES (?,?)", [
      apiKey,
      label.trim(),
    ]);
    res.json({ success: true, api_key: apiKey });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const revokeKey = async (req, res) => {
  try {
    await db.query("UPDATE web_form_keys SET is_active = 0 WHERE id = ?", [
      req.params.id,
    ]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
