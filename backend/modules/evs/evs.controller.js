/**
 * Employee Verification System - main controller.
 *
 * Node/Express port of the standalone FastAPI backend. Every endpoint keeps
 * the same path and JSON shape the EVS React frontend already consumes,
 * while fixing the old bugs (200-on-not-found, unsanitised uploads, dead
 * localhost email links, no auth).
 *
 * Tables live in hrms_db with the evs_ prefix (see evs.schema.sql).
 */
import crypto from "crypto";

import { db } from "../../config/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendEmail } from "../../utils/mailer.js";
import { listCountries, validateDoc, maskDoc, COUNTRY_REGISTRY } from "./evs.countries.js";

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */
const actorOf = (req) => req.user?.email || req.user?.name || "system";

async function audit(action, documentId = 0, actor = "system") {
  try {
    await db.query(
      "INSERT INTO evs_audit_logs (document_id, action, actor) VALUES (?, ?, ?)",
      [documentId, String(action).slice(0, 100), actor],
    );
  } catch (e) {
    console.error("[EVS] audit log failed:", e.message);
  }
}

const intId = (v) => {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
};

async function employeeExists(id) {
  const [[row]] = await db.query("SELECT id FROM evs_employees WHERE id = ? LIMIT 1", [id]);
  return Boolean(row);
}

/* ================================================================== */
/* EMPLOYEES                                                           */
/* ================================================================== */
export const addEmployee = asyncHandler(async (req, res) => {
  const { name, email, phone = "", department = "", designation = "" } = req.body || {};
  if (!name?.trim() || !email?.trim()) {
    return res.status(400).json({ detail: "Name and email are required" });
  }

  const [[dup]] = await db.query("SELECT id FROM evs_employees WHERE email = ? LIMIT 1", [email.trim()]);
  if (dup) return res.status(400).json({ detail: "Employee already exists" });

  const [r] = await db.query(
    "INSERT INTO evs_employees (name, email, phone, department, designation) VALUES (?, ?, ?, ?, ?)",
    [name.trim(), email.trim(), phone, department, designation],
  );
  await audit(`Employee ${r.insertId} added`, 0, actorOf(req));
  res.json({ message: "Employee Added Successfully", employee_id: r.insertId });
});

export const getEmployees = asyncHandler(async (_req, res) => {
  const [rows] = await db.query("SELECT * FROM evs_employees ORDER BY id");
  res.json(rows);
});

export const getEmployee = asyncHandler(async (req, res) => {
  const id = intId(req.params.id);
  const [[row]] = await db.query("SELECT * FROM evs_employees WHERE id = ?", [id]);
  if (!row) return res.status(404).json({ message: "Employee Not Found" });
  res.json(row);
});

export const updateEmployee = asyncHandler(async (req, res) => {
  const id = intId(req.params.id);
  const { name, email, phone = "", department = "", designation = "" } = req.body || {};
  if (!(await employeeExists(id))) return res.status(404).json({ message: "Employee Not Found" });

  await db.query(
    "UPDATE evs_employees SET name=?, email=?, phone=?, department=?, designation=? WHERE id=?",
    [name, email, phone, department, designation, id],
  );
  res.json({ message: "Employee Updated Successfully" });
});

export const deleteEmployee = asyncHandler(async (req, res) => {
  const id = intId(req.params.id);
  if (!(await employeeExists(id))) return res.status(404).json({ message: "Employee Not Found" });
  await db.query("DELETE FROM evs_employees WHERE id = ?", [id]);
  await audit(`Employee ${id} deleted`, 0, actorOf(req));
  res.json({ message: "Employee Deleted Successfully" });
});

/* ================================================================== */
/* DOCUMENTS                                                           */
/* ================================================================== */
export const uploadDocument = asyncHandler(async (req, res) => {
  const employeeId = intId(req.body?.employee_id);
  const documentName = String(req.body?.document_name || "").trim();

  if (!req.file) return res.status(400).json({ detail: "File is required" });
  if (!employeeId || !documentName) {
    return res.status(400).json({ detail: "employee_id and document_name are required" });
  }
  if (!(await employeeExists(employeeId))) {
    return res.status(404).json({ detail: "Employee not found" });
  }

  const filePath = `uploads/evs/${req.file.filename}`;
  const [r] = await db.query(
    "INSERT INTO evs_documents (employee_id, document_name, file_path, status) VALUES (?, ?, ?, 'Pending')",
    [employeeId, documentName, filePath],
  );
  await audit("Document Uploaded", r.insertId, actorOf(req));
  res.json({ message: "Document Uploaded Successfully", document_id: r.insertId });
});

export const getDocuments = asyncHandler(async (_req, res) => {
  const [rows] = await db.query("SELECT * FROM evs_documents ORDER BY id DESC");
  res.json(rows);
});

export const sendVerificationEmail = asyncHandler(async (req, res) => {
  const documentId = intId(req.params.id);
  const email = String(req.query.email || req.body?.email || "").trim();
  if (!email) return res.status(400).json({ detail: "Recipient email is required" });

  const [[doc]] = await db.query("SELECT * FROM evs_documents WHERE id = ?", [documentId]);
  if (!doc) return res.status(404).json({ message: "Document Not Found" });

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
  await db.query(
    "INSERT INTO evs_verification_tokens (document_id, token, expires_at, used) VALUES (?, ?, ?, 0)",
    [documentId, token, expiresAt],
  );

  const base = (process.env.EVS_FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
  const verifyLink = `${base}/verify/${token}?action=verify`;
  const rejectLink = `${base}/verify/${token}?action=reject`;

  await sendEmail(
    email,
    "Document Verification",
    `
      <h2>Document Verification Request</h2>
      <p>Please verify the document <strong>${doc.document_name}</strong>.</p>
      <p><a href="${verifyLink}">Verify Document</a></p>
      <p><a href="${rejectLink}">Reject Document</a></p>
      <p style="color:#888;font-size:12px">This link expires in 30 minutes.</p>
    `,
  );

  await audit("Verification email sent", documentId, actorOf(req));
  res.json({ message: "Verification Email Sent Successfully" });
});

/* Direct decision by a logged-in verifier: GET /verify-document/:id?status=Verified|Rejected */
export const verifyDocument = asyncHandler(async (req, res) => {
  const documentId = intId(req.params.id);
  const status = req.query.status === "Rejected" ? "Rejected" : "Verified";

  const [[doc]] = await db.query("SELECT id FROM evs_documents WHERE id = ?", [documentId]);
  if (!doc) return res.status(404).json({ message: "Document Not Found" });

  await db.query("UPDATE evs_documents SET status = ? WHERE id = ?", [status, documentId]);
  await audit(status, documentId, actorOf(req));
  res.json({ message: `Document ${status}` });
});

/* Public - opened from the email link */
export const verifyToken = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const action = req.query.action === "reject" ? "reject" : "verify";

  const [[rec]] = await db.query("SELECT * FROM evs_verification_tokens WHERE token = ?", [token]);
  if (!rec) return res.status(400).json({ message: "Invalid Token" });
  if (rec.used) return res.status(400).json({ message: "Token Already Used" });
  if (new Date(rec.expires_at) < new Date()) return res.status(400).json({ message: "Token Expired" });

  const status = action === "reject" ? "Rejected" : "Verified";
  await db.query("UPDATE evs_documents SET status = ? WHERE id = ?", [status, rec.document_id]);
  await db.query("UPDATE evs_verification_tokens SET used = 1 WHERE id = ?", [rec.id]);
  await audit(status, rec.document_id, "email-link");

  res.json({ message: `Document ${status}` });
});

/* ================================================================== */
/* DASHBOARD + AUDIT                                                   */
/* ================================================================== */
export const dashboard = asyncHandler(async (_req, res) => {
  const [[r]] = await db.query(`
    SELECT
      (SELECT COUNT(*) FROM evs_employees)                                AS total_employees,
      (SELECT COUNT(*) FROM evs_documents)                                AS total_documents,
      (SELECT COUNT(*) FROM evs_documents WHERE status = 'Verified')      AS verified_documents,
      (SELECT COUNT(*) FROM evs_documents WHERE status = 'Pending')       AS pending_documents,
      (SELECT COUNT(*) FROM evs_documents WHERE status = 'Rejected')      AS rejected_documents
  `);
  res.json(r);
});

export const auditLogs = asyncHandler(async (_req, res) => {
  const [rows] = await db.query("SELECT * FROM evs_audit_logs ORDER BY id DESC LIMIT 1000");
  res.json(rows);
});

/* ================================================================== */
/* IDENTITY (Aadhaar / PAN)                                            */
/* ================================================================== */
const VERHOEFF_D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4, 0, 6, 7, 8, 9, 5], [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7], [4, 0, 1, 2, 3, 9, 5, 6, 7, 8], [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2], [7, 6, 5, 9, 8, 2, 1, 0, 4, 3], [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];
const VERHOEFF_P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 5, 7, 6, 2, 8, 3, 0, 9, 4], [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7], [9, 4, 5, 3, 1, 2, 6, 8, 7, 0], [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5], [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

function verhoeffValid(num) {
  let c = 0;
  const digits = num.split("").reverse();
  for (let i = 0; i < digits.length; i++) {
    c = VERHOEFF_D[c][VERHOEFF_P[i % 8][Number(digits[i])]];
  }
  return c === 0;
}

function validateAadhaar(raw) {
  const a = String(raw || "").replace(/[\s-]/g, "");
  if (!/^\d{12}$/.test(a)) return { error: "Aadhaar must be exactly 12 digits" };
  if (a[0] === "0" || a[0] === "1") return { error: "Aadhaar cannot start with 0 or 1" };
  if (!verhoeffValid(a)) return { error: "Invalid Aadhaar number (checksum failed)" };
  return { value: a };
}

function validatePan(raw) {
  const p = String(raw || "").trim().toUpperCase();
  if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(p)) return { error: "PAN must match format AAAAA9999A" };
  if (!"ABCFGHLJPTK".includes(p[3])) return { error: "Invalid PAN holder-type character" };
  return { value: p };
}

const maskAadhaar = (a) => `XXXX-XXXX-${a.slice(-4)}`;
const maskPan = (p) => `${p.slice(0, 2)}XXXXXXX${p.slice(-1)}`;

export const submitIdentity = asyncHandler(async (req, res) => {
  const employeeId = intId(req.body?.employee_id);
  const { aadhaar_number = "", pan_number = "" } = req.body || {};

  if (!employeeId || !(await employeeExists(employeeId))) {
    return res.status(404).json({ detail: "Employee not found" });
  }
  if (!aadhaar_number && !pan_number) {
    return res.status(400).json({ detail: "Provide an Aadhaar number, a PAN number, or both" });
  }

  const sets = [];
  const params = [];
  const results = {};

  if (aadhaar_number) {
    const { value, error } = validateAadhaar(aadhaar_number);
    if (error) return res.status(400).json({ detail: error });
    sets.push("aadhaar_masked = ?", "aadhaar_status = 'Pending Approval'");
    params.push(maskAadhaar(value));
    results.aadhaar = "Format valid - pending approval";
  }
  if (pan_number) {
    const { value, error } = validatePan(pan_number);
    if (error) return res.status(400).json({ detail: error });
    sets.push("pan_masked = ?", "pan_status = 'Pending Approval'");
    params.push(maskPan(value));
    results.pan = "Format valid - pending approval";
  }

  const [[existing]] = await db.query(
    "SELECT id FROM evs_identity_verifications WHERE employee_id = ?",
    [employeeId],
  );
  let recordId;
  if (existing) {
    await db.query(`UPDATE evs_identity_verifications SET ${sets.join(", ")} WHERE id = ?`, [
      ...params,
      existing.id,
    ]);
    recordId = existing.id;
  } else {
    const [r] = await db.query("INSERT INTO evs_identity_verifications (employee_id) VALUES (?)", [employeeId]);
    await db.query(`UPDATE evs_identity_verifications SET ${sets.join(", ")} WHERE id = ?`, [
      ...params,
      r.insertId,
    ]);
    recordId = r.insertId;
  }

  await audit(`Identity submitted for employee ${employeeId}`, 0, actorOf(req));
  res.json({ message: "Identity details validated and submitted", record_id: recordId, results });
});

export const listIdentity = asyncHandler(async (_req, res) => {
  const [rows] = await db.query(`
    SELECT i.id, i.employee_id, e.name AS employee_name, i.aadhaar_masked, i.pan_masked,
           i.aadhaar_status, i.pan_status, i.remarks, CAST(i.updated_at AS CHAR) AS updated_at
    FROM evs_identity_verifications i
    JOIN evs_employees e ON e.id = i.employee_id
    ORDER BY i.id DESC
  `);
  res.json(rows);
});

export const decideIdentity = asyncHandler(async (req, res) => {
  const id = intId(req.params.id);
  const { field, action, remarks = "" } = req.body || {};

  const [[rec]] = await db.query("SELECT * FROM evs_identity_verifications WHERE id = ?", [id]);
  if (!rec) return res.status(404).json({ detail: "Record not found" });
  if (!["aadhaar", "pan"].includes(field)) return res.status(400).json({ detail: "Invalid field" });
  if (!["approve", "reject"].includes(action)) return res.status(400).json({ detail: "Invalid action" });

  const newStatus = action === "approve" ? "Verified" : "Rejected";
  const column = field === "aadhaar" ? "aadhaar_status" : "pan_status";
  await db.query(
    `UPDATE evs_identity_verifications SET ${column} = ?, remarks = COALESCE(NULLIF(?, ''), remarks) WHERE id = ?`,
    [newStatus, remarks, id],
  );

  await audit(`${field.toUpperCase()} ${newStatus} for employee ${rec.employee_id}`, 0, actorOf(req));
  res.json({ message: `${field.toUpperCase()} ${newStatus}` });
});

/* ================================================================== */
/* INTERNATIONAL                                                       */
/* ================================================================== */
export const internationalCountries = asyncHandler(async (_req, res) => {
  res.json(listCountries());
});

export const submitInternational = asyncHandler(async (req, res) => {
  const employeeId = intId(req.body?.employee_id);
  const code = String(req.body?.country_code || "").trim().toUpperCase();
  const docType = String(req.body?.doc_type || "");

  if (!employeeId || !(await employeeExists(employeeId))) {
    return res.status(404).json({ detail: "Employee not found" });
  }

  const { cleaned, doc, error } = validateDoc(code, docType, req.body?.doc_number);
  if (error) return res.status(400).json({ detail: error });
  const country = COUNTRY_REGISTRY[code];

  const [[existing]] = await db.query(
    "SELECT id FROM evs_international_verifications WHERE employee_id=? AND country_code=? AND doc_type=?",
    [employeeId, code, docType],
  );

  let recordId;
  if (existing) {
    await db.query(
      "UPDATE evs_international_verifications SET doc_masked=?, status='Pending Approval' WHERE id=?",
      [maskDoc(cleaned), existing.id],
    );
    recordId = existing.id;
  } else {
    const [r] = await db.query(
      `INSERT INTO evs_international_verifications
         (employee_id, country_code, country_name, doc_type, doc_label, doc_masked, status)
       VALUES (?, ?, ?, ?, ?, ?, 'Pending Approval')`,
      [employeeId, code, country.name, docType, doc.label, maskDoc(cleaned)],
    );
    recordId = r.insertId;
  }

  await audit(`Intl ${code} ${docType} submitted e${employeeId}`, 0, actorOf(req));
  res.json({ message: `${country.name} ${doc.label} validated - pending approval`, record_id: recordId });
});

export const listInternational = asyncHandler(async (_req, res) => {
  const [rows] = await db.query(`
    SELECT v.id, v.employee_id, e.name AS employee_name, v.country_code, v.country_name,
           v.doc_type, v.doc_label, v.doc_masked, v.status, v.remarks,
           CAST(v.updated_at AS CHAR) AS updated_at
    FROM evs_international_verifications v
    JOIN evs_employees e ON e.id = v.employee_id
    ORDER BY v.id DESC
  `);
  res.json(rows);
});

export const decideInternational = asyncHandler(async (req, res) => {
  const id = intId(req.params.id);
  const { action, remarks = "" } = req.body || {};

  const [[rec]] = await db.query("SELECT * FROM evs_international_verifications WHERE id = ?", [id]);
  if (!rec) return res.status(404).json({ detail: "Record not found" });
  if (!["approve", "reject"].includes(action)) return res.status(400).json({ detail: "Invalid action" });

  const status = action === "approve" ? "Verified" : "Rejected";
  await db.query(
    "UPDATE evs_international_verifications SET status=?, remarks=COALESCE(NULLIF(?, ''), remarks) WHERE id=?",
    [status, remarks, id],
  );
  await audit(`Intl ${rec.country_code} ${rec.doc_type} ${status} e${rec.employee_id}`, 0, actorOf(req));
  res.json({ message: `${rec.doc_label} ${status}` });
});

/* ================================================================== */
/* BACKGROUND VERIFICATION                                             */
/* ================================================================== */
export const createBackground = asyncHandler(async (req, res) => {
  const employeeId = intId(req.body?.employee_id);
  const {
    previous_company = "",
    hr_email = "",
    feedback = "",
    rehire_eligible = false,
    criminal_record = false,
  } = req.body || {};

  if (!employeeId || !(await employeeExists(employeeId))) {
    return res.status(404).json({ detail: "Employee not found" });
  }

  const [r] = await db.query(
    `INSERT INTO evs_background_verifications
       (employee_id, previous_company, hr_email, feedback, rehire_eligible, criminal_record, status)
     VALUES (?, ?, ?, ?, ?, ?, 'Pending')`,
    [employeeId, previous_company, hr_email, feedback, rehire_eligible ? 1 : 0, criminal_record ? 1 : 0],
  );
  await audit(`Background verification opened for employee ${employeeId}`, 0, actorOf(req));
  res.json({ message: "Background verification created (Pending)", id: r.insertId });
});

export const listBackground = asyncHandler(async (_req, res) => {
  const [rows] = await db.query(`
    SELECT b.id, b.employee_id, e.name AS employee_name, b.previous_company, b.hr_email,
           b.feedback, b.rehire_eligible = 1 AS rehire_eligible,
           b.criminal_record = 1 AS criminal_record, b.status
    FROM evs_background_verifications b
    JOIN evs_employees e ON e.id = b.employee_id
    ORDER BY b.id DESC
  `);
  res.json(rows.map((r) => ({ ...r, rehire_eligible: Boolean(r.rehire_eligible), criminal_record: Boolean(r.criminal_record) })));
});

export const updateBackground = asyncHandler(async (req, res) => {
  const id = intId(req.params.id);
  const { action, remarks = "" } = req.body || {};
  const map = { start: "In Progress", verify: "Verified", reject: "Rejected" };

  const [[rec]] = await db.query("SELECT * FROM evs_background_verifications WHERE id = ?", [id]);
  if (!rec) return res.status(404).json({ detail: "Record not found" });
  if (!map[action]) return res.status(400).json({ detail: "Invalid action" });

  await db.query(
    "UPDATE evs_background_verifications SET status=?, feedback=COALESCE(NULLIF(?, ''), feedback) WHERE id=?",
    [map[action], remarks, id],
  );
  await audit(`Background verification ${map[action]} for employee ${rec.employee_id}`, 0, actorOf(req));
  res.json({ message: `Background verification ${map[action]}` });
});

/* ================================================================== */
/* EMPLOYMENT HISTORY                                                  */
/* ================================================================== */
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const addHistory = asyncHandler(async (req, res) => {
  const employeeId = intId(req.body?.employee_id);
  const {
    company_name = "",
    designation = "",
    start_date = "",
    end_date = "",
    hr_contact_email = "",
  } = req.body || {};

  if (!employeeId || !(await employeeExists(employeeId))) {
    return res.status(404).json({ detail: "Employee not found" });
  }
  if (!company_name.trim()) return res.status(400).json({ detail: "Company name required" });
  if (!DATE_RE.test(start_date) || !DATE_RE.test(end_date)) {
    return res.status(400).json({ detail: "Dates must be YYYY-MM-DD" });
  }
  if (end_date < start_date) {
    return res.status(400).json({ detail: "End date cannot be before start date" });
  }

  const [r] = await db.query(
    `INSERT INTO evs_employment_history
       (employee_id, company_name, designation, start_date, end_date, hr_contact_email, status)
     VALUES (?, ?, ?, ?, ?, ?, 'Pending')`,
    [employeeId, company_name.trim(), designation.trim(), start_date, end_date, hr_contact_email.trim()],
  );
  await audit(`Employment history added for employee ${employeeId}`, 0, actorOf(req));
  res.json({ message: "Employment history saved", id: r.insertId });
});

export const listHistory = asyncHandler(async (_req, res) => {
  const [rows] = await db.query(`
    SELECT h.id, h.employee_id, e.name AS employee_name, h.company_name, h.designation,
           h.start_date, h.end_date, h.hr_contact_email, h.status, h.remarks
    FROM evs_employment_history h
    JOIN evs_employees e ON e.id = h.employee_id
    ORDER BY h.id DESC
  `);
  res.json(rows);
});

export const decideHistory = asyncHandler(async (req, res) => {
  const id = intId(req.params.id);
  const { action, remarks = "" } = req.body || {};
  const map = { validate: "Validated", reject: "Rejected", in_progress: "In Progress" };

  const [[rec]] = await db.query("SELECT * FROM evs_employment_history WHERE id = ?", [id]);
  if (!rec) return res.status(404).json({ detail: "Record not found" });
  if (!map[action]) return res.status(400).json({ detail: "Invalid action" });

  await db.query(
    "UPDATE evs_employment_history SET status=?, remarks=COALESCE(NULLIF(?, ''), remarks) WHERE id=?",
    [map[action], remarks, id],
  );
  await audit(`Employment history ${map[action]} for employee ${rec.employee_id}`, 0, actorOf(req));
  res.json({ message: `Employment history ${map[action]}` });
});

/* ================================================================== */
/* VERIFICATION STATUS (per-employee roll-up)                          */
/* ================================================================== */
function overall(statuses) {
  const meaningful = statuses.filter((s) => s && s !== "Not Submitted");
  if (!meaningful.length) return "Not Started";
  if (meaningful.some((s) => s === "Rejected")) return "Action Required";
  if (meaningful.every((s) => s === "Verified" || s === "Validated")) return "Fully Verified";
  return "In Progress";
}

function rollup(items, verifiedLabel) {
  if (!items.length) return "Not Submitted";
  if (items.some((s) => s === "Rejected")) return "Rejected";
  if (items.every((s) => s === verifiedLabel)) return verifiedLabel;
  return "Pending";
}

export const verificationStatus = asyncHandler(async (_req, res) => {
  const [employees] = await db.query("SELECT id, name, department FROM evs_employees ORDER BY id");
  const [docs] = await db.query("SELECT employee_id, status FROM evs_documents");
  const [ids] = await db.query("SELECT employee_id, aadhaar_status, pan_status FROM evs_identity_verifications");
  const [bgs] = await db.query("SELECT employee_id, status FROM evs_background_verifications ORDER BY id");
  const [hist] = await db.query("SELECT employee_id, status FROM evs_employment_history");

  const group = (rows) => {
    const m = new Map();
    for (const r of rows) {
      if (!m.has(r.employee_id)) m.set(r.employee_id, []);
      m.get(r.employee_id).push(r);
    }
    return m;
  };
  const docsBy = group(docs);
  const idBy = new Map(ids.map((r) => [r.employee_id, r]));
  const bgBy = group(bgs);
  const histBy = group(hist);

  const result = employees.map((emp) => {
    const docStatus = rollup((docsBy.get(emp.id) || []).map((d) => d.status), "Verified");
    const identity = idBy.get(emp.id);
    const aadhaar = identity?.aadhaar_status || "Not Submitted";
    const pan = identity?.pan_status || "Not Submitted";
    const bgList = bgBy.get(emp.id) || [];
    const bg = bgList.length ? bgList[bgList.length - 1].status : "Not Submitted";
    const history = rollup((histBy.get(emp.id) || []).map((h) => h.status), "Validated");

    return {
      employee_id: emp.id,
      employee_name: emp.name,
      department: emp.department,
      documents: docStatus,
      aadhaar,
      pan,
      background: bg,
      employment_history: history,
      overall: overall([docStatus, aadhaar, pan, bg, history]),
    };
  });

  const count = (label) => result.filter((r) => r.overall === label).length;
  res.json({
    summary: {
      total: result.length,
      fully_verified: count("Fully Verified"),
      in_progress: count("In Progress"),
      action_required: count("Action Required"),
      not_started: count("Not Started"),
    },
    employees: result,
  });
});

/* ================================================================== */
/* HRMS INTEGRATION (now same database - no cross-DB connection)       */
/* ================================================================== */
const HRMS_EMPLOYEES_SQL = `
  SELECT e.id AS hrms_id, e.employeeCode, e.name, e.email, e.phone,
         COALESCE(d.name, 'Others')   AS department,
         COALESCE(g.name, 'Employee') AS designation,
         e.isActive
  FROM employees e
  LEFT JOIN departments  d ON d.id = e.departmentId
  LEFT JOIN designations g ON g.id = e.designationId
`;

export const hrmsStatus = asyncHandler(async (_req, res) => {
  const [[{ local }]] = await db.query("SELECT COUNT(*) AS local FROM evs_employees");
  try {
    const [rows] = await db.query(HRMS_EMPLOYEES_SQL);
    const [localEmails] = await db.query("SELECT email FROM evs_employees WHERE email IS NOT NULL");
    const local_set = new Set(localEmails.map((r) => r.email));
    const hrms_set = new Set(rows.map((r) => r.email).filter(Boolean));
    let synced = 0;
    for (const e of hrms_set) if (local_set.has(e)) synced++;

    res.json({
      connected: true,
      hrms_database: process.env.DB_NAME || "hrms_db",
      hrms_employees: rows.length,
      local_employees: local,
      synced,
      not_synced: hrms_set.size - synced,
    });
  } catch (exc) {
    res.json({
      connected: false,
      hrms_database: process.env.DB_NAME || "hrms_db",
      error: String(exc.message).slice(0, 200),
      local_employees: local,
    });
  }
});

export const hrmsSync = asyncHandler(async (req, res) => {
  let rows;
  try {
    [rows] = await db.query(HRMS_EMPLOYEES_SQL);
  } catch (exc) {
    return res.json({ synced: 0, error: `HRMS DB not reachable: ${exc.message}`.slice(0, 200) });
  }

  let created = 0;
  let updated = 0;
  for (const row of rows) {
    if (!row.email) continue;
    const [[existing]] = await db.query("SELECT id, phone FROM evs_employees WHERE email = ?", [row.email]);
    if (existing) {
      await db.query(
        "UPDATE evs_employees SET name=?, phone=?, department=?, designation=? WHERE id=?",
        [row.name, row.phone || existing.phone, row.department, row.designation, existing.id],
      );
      updated++;
    } else {
      await db.query(
        "INSERT INTO evs_employees (name, email, phone, department, designation) VALUES (?, ?, ?, ?, ?)",
        [row.name, row.email, row.phone || "", row.department, row.designation],
      );
      created++;
    }
  }

  await audit(`HRMS Sync: ${created} added, ${updated} updated`, 0, actorOf(req));
  res.json({
    synced: created + updated,
    created,
    updated,
    message: `Synced from HRMS: ${created} new, ${updated} updated`,
  });
});

export const hrmsDocuments = asyncHandler(async (_req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT vd.id, vd.employee_id AS hrms_employee_id, vd.employee_name, e.email,
             vd.doc_type, vd.status, vd.remarks, vd.verified_by,
             CAST(vd.created_at AS CHAR) AS created_at
      FROM verification_documents vd
      LEFT JOIN employees e ON e.id = vd.employee_id
      ORDER BY vd.id DESC
    `);
    res.json({ connected: true, documents: rows });
  } catch (exc) {
    res.json({ connected: false, documents: [], error: String(exc.message).slice(0, 200) });
  }
});

/* ================================================================== */
/* REPORTS SUMMARY                                                     */
/* ================================================================== */
function tally(items, key) {
  const out = { Verified: 0, Pending: 0, Rejected: 0 };
  for (const it of items) {
    let v = it[key] || "Pending";
    if (v === "Validated" || v === "Approved") v = "Verified";
    if (v === "In Progress" || v === "Submitted") v = "Pending";
    out[v in out ? v : "Pending"]++;
  }
  return out;
}

export const reportsSummary = asyncHandler(async (_req, res) => {
  const [employees] = await db.query("SELECT id, department FROM evs_employees");
  const [docCounts] = await db.query("SELECT status, COUNT(*) AS n FROM evs_documents GROUP BY status");
  const [identity] = await db.query("SELECT employee_id, aadhaar_status, pan_status FROM evs_identity_verifications");
  const [history] = await db.query("SELECT status FROM evs_employment_history");
  const [background] = await db.query("SELECT employee_id, status FROM evs_background_verifications");

  const docs = { Verified: 0, Pending: 0, Rejected: 0 };
  for (const r of docCounts) if (r.status in docs) docs[r.status] = r.n;

  const idByEmp = new Map(identity.map((r) => [r.employee_id, r]));
  const bgByEmp = new Map();
  for (const b of background) {
    if (!bgByEmp.has(b.employee_id)) bgByEmp.set(b.employee_id, []);
    bgByEmp.get(b.employee_id).push(b);
  }

  const departments = new Map();
  for (const emp of employees) {
    const dept = emp.department || "Others";
    if (!departments.has(dept)) {
      departments.set(dept, { department: dept, employees: 0, identity_done: 0, background_done: 0 });
    }
    const d = departments.get(dept);
    d.employees++;
    const rec = idByEmp.get(emp.id);
    if (rec && rec.aadhaar_status === "Verified" && rec.pan_status === "Verified") d.identity_done++;
    if ((bgByEmp.get(emp.id) || []).some((b) => b.status === "Verified")) d.background_done++;
  }

  res.json({
    total_employees: employees.length,
    by_type: {
      documents: docs,
      aadhaar: tally(identity, "aadhaar_status"),
      pan: tally(identity, "pan_status"),
      background: tally(background, "status"),
      employment_history: tally(history, "status"),
    },
    by_department: [...departments.values()].sort((a, b) => b.employees - a.employees),
  });
});
