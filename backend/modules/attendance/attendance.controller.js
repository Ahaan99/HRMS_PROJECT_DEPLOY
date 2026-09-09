/**
 * Smart Attendance - Node/Express port of the Flask (:5050) service.
 *
 * Same URL paths + JSON shapes the existing HTML pages use, mounted at
 * /api/smart-attendance.  Auth: JWT in an httpOnly cookie (sa_token, path
 * scoped to this module) or Authorization: Bearer.  HRMS Super Admin / HR
 * tokens are accepted as attendance admins.
 *
 * Face recognition now runs in the BROWSER (face-api.js): the page sends a
 * 128-d descriptor; the server only stores / compares vectors.
 * HRMS sync is a direct upsert into super_admin_attendance (same DB).
 */
import crypto from "crypto";
import os from "os";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { db } from "../../config/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendEmail } from "../../utils/mailer.js";

/* ------------------------------------------------------------------ */
/* constants                                                           */
/* ------------------------------------------------------------------ */
export const MOUNT = "/api/smart-attendance";
const COOKIE = "sa_token";
const OTP_DEBUG = /^(1|true|yes)$/i.test(process.env.OTP_DEBUG || "");
const OTP_TTL_SEC = 300;
const OTP_RESEND_SEC = 45;
const OTP_MAX_ATTEMPTS = 5;
const DEFAULT_OFFICE = {
  lat: Number(process.env.OFFICE_LAT || 28.626001),
  lng: Number(process.env.OFFICE_LNG || 77.378001),
  radius: Number(process.env.OFFICE_RADIUS || 32),
};
const DEFAULT_SHIFT = {
  start: "09:30",
  end: "18:30",
  grace_min: 15,
  half_day_hours: 4.0,
  full_day_hours: 8.0,
  overtime_after_hours: 8.5,
};
const STATUS_MAP = { Present: "PRESENT", Late: "LATE", "Half Day": "HALF_DAY" };

/* ------------------------------------------------------------------ */
/* small helpers                                                       */
/* ------------------------------------------------------------------ */
const pad = (n) => String(n).padStart(2, "0");
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const nowTime = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};
const nowStamp = (sec = true) => `${today()} ${sec ? nowTime() : nowTime().slice(0, 5)}`;
const bad = (res, error, code = 200) => res.status(code).json({ ok: false, error });
const isMobile = (m) => /^\d{10}$/.test(m);
const isDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(d));
const isHHMM = (t) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t);

const hashPassword = (p) => bcrypt.hashSync(p, 10);
const verifyPassword = (plain, stored) => {
  if (!stored) return false;
  if (stored.startsWith("$2")) {
    try {
      return bcrypt.compareSync(plain, stored);
    } catch {
      return false;
    }
  }
  /* legacy sha256 hex */
  return crypto.createHash("sha256").update(plain).digest("hex") === stored;
};

function clientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (fwd) return String(fwd).split(",")[0].trim();
  const real = req.headers["x-real-ip"];
  if (real) return String(real).trim();
  return (req.socket?.remoteAddress || "").replace(/^::ffff:/, "");
}

function serverLocalIp() {
  for (const list of Object.values(os.networkInterfaces())) {
    for (const i of list || []) {
      if (i.family === "IPv4" && !i.internal) return i.address;
    }
  }
  return null;
}

/* settings key/value */
async function getSetting(key) {
  const [[row]] = await db.query("SELECT data FROM attendance_settings WHERE skey = ?", [key]);
  if (!row || !row.data) return null;
  try {
    return JSON.parse(row.data);
  } catch {
    return null;
  }
}
async function setSetting(key, value) {
  await db.query(
    "INSERT INTO attendance_settings (skey, data) VALUES (?, ?) ON DUPLICATE KEY UPDATE data = VALUES(data)",
    [key, value === null ? null : JSON.stringify(value)],
  );
}

async function getOffice() {
  const doc = (await getSetting("office")) || {};
  return {
    lat: Number(doc.lat ?? DEFAULT_OFFICE.lat),
    lng: Number(doc.lng ?? DEFAULT_OFFICE.lng),
    radius: Number(doc.radius ?? DEFAULT_OFFICE.radius),
    configured: Boolean(doc.lat),
  };
}
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (x) => (x * Math.PI) / 180;
  const dphi = toRad(lat2 - lat1);
  const dlam = toRad(lng2 - lng1);
  const a =
    Math.sin(dphi / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dlam / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
async function isInOffice(lat, lng) {
  const la = Number(lat);
  const ln = Number(lng);
  const o = await getOffice();
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return { inOffice: false, noLocation: true, distance: 0, radius: o.radius };
  const dist = haversine(la, ln, o.lat, o.lng);
  return { inOffice: dist <= o.radius, distance: Math.round(dist * 10) / 10, radius: o.radius };
}

async function getShift() {
  return { ...DEFAULT_SHIFT, ...((await getSetting("shift")) || {}) };
}
function checkinStatus(timeStr, shift) {
  try {
    const [h, m] = timeStr.slice(0, 5).split(":").map(Number);
    const [sh, sm] = shift.start.split(":").map(Number);
    return h * 60 + m > sh * 60 + sm + Number(shift.grace_min || 0) ? "Late" : "Present";
  } catch {
    return "Present";
  }
}
function computeHours(tIn, tOut) {
  try {
    const [a, b] = [tIn, tOut].map((t) => {
      const [h, m, s = 0] = t.split(":").map(Number);
      return h * 3600 + m * 60 + s;
    });
    return Math.max(0, Math.round(((b - a) / 3600) * 100) / 100);
  } catch {
    return 0;
  }
}

/* wifi subnet check (same 2-layer logic as wifi_attendance.py) */
function isOfficeIp(ip) {
  const serverIp = serverLocalIp();
  if (!serverIp) return [false, "Server IP could not be detected. Please contact the admin."];
  const serverSubnet = serverIp.split(".").slice(0, 3).join(".");
  const officeSubnet = process.env.OFFICE_SUBNET || serverSubnet;
  if (!ip || ip === "127.0.0.1" || ip === "::1") {
    return serverSubnet === officeSubnet
      ? [true, `Server PC verified (Office IP: ${serverIp})`]
      : [false, `Server is not on the office WiFi (${serverIp}). Please connect to the office WiFi.`];
  }
  if (serverSubnet !== officeSubnet) return [false, `Server is not on the office WiFi (${serverIp}).`];
  const clientSubnet = ip.split(".").slice(0, 3).join(".");
  if (clientSubnet !== officeSubnet) return [false, `Device is not connected to the office WiFi (${ip}).`];
  return [true, `Office WiFi verified | Server: ${serverIp} | Device: ${ip}`];
}

/* ------------------------------------------------------------------ */
/* HRMS sync - direct upsert into super_admin_attendance               */
/* ------------------------------------------------------------------ */
async function pushToHrms(recordId) {
  const [[rec]] = await db.query("SELECT * FROM attendance_records WHERE id = ?", [recordId]);
  if (!rec) return;
  const hrms = (await getSetting("hrms")) || {};
  if (hrms.enabled === false) return; /* default enabled (same DB) */
  const stamp = nowStamp();
  try {
    const [emps] = await db.query(
      "SELECT id, name FROM employees WHERE employeeCode = ? AND isActive = 1 LIMIT 1",
      [String(rec.emp_id)],
    );
    if (!emps.length) throw new Error(`No active HRMS employee with employeeCode '${rec.emp_id}'`);
    const status = STATUS_MAP[rec.status] || "PRESENT";
    const [ex] = await db.query(
      "SELECT id FROM super_admin_attendance WHERE employee_id = ? AND date = ? LIMIT 1",
      [emps[0].id, rec.date],
    );
    if (ex.length) {
      await db.query(
        `UPDATE super_admin_attendance SET check_in = COALESCE(?, check_in), check_out = COALESCE(?, check_out), status = ? WHERE id = ?`,
        [rec.time, rec.check_out, status, ex[0].id],
      );
    } else {
      await db.query(
        `INSERT INTO super_admin_attendance (employee_id, employee_name, date, check_in, check_out, status) VALUES (?,?,?,?,?,?)`,
        [emps[0].id, emps[0].name || rec.name, rec.date, rec.time, rec.check_out, status],
      );
    }
    await db.query(
      "UPDATE attendance_records SET hrms_sync='synced', hrms_sync_error=NULL, hrms_sync_at=? WHERE id=?",
      [stamp, recordId],
    );
  } catch (e) {
    await db.query(
      "UPDATE attendance_records SET hrms_sync='failed', hrms_sync_error=?, hrms_sync_at=? WHERE id=?",
      [String(e.message).slice(0, 200), stamp, recordId],
    );
  }
}
const pushAsync = (id) => setImmediate(() => pushToHrms(id).catch(() => {}));

async function insertAttendance(doc) {
  const shift = await getShift();
  const [r] = await db.query(
    `INSERT INTO attendance_records (emp_id, name, date, time, status, method, ip, approval, check_out, hours, overtime, lat, lng)
     VALUES (?,?,?,?,?,?,?,'pending',NULL,0,0,?,?)`,
    [doc.emp_id, doc.name, doc.date, doc.time, checkinStatus(doc.time, shift), doc.method, doc.ip, doc.lat ?? null, doc.lng ?? null],
  );
  pushAsync(r.insertId);
  return r.insertId;
}
const findToday = async (empId) =>
  (await db.query("SELECT * FROM attendance_records WHERE emp_id = ? AND date = ? LIMIT 1", [empId, today()]))[0][0];

/* ------------------------------------------------------------------ */
/* AUTH                                                                */
/* ------------------------------------------------------------------ */
function readCookie(req) {
  const raw = req.headers.cookie || "";
  for (const part of raw.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === COOKIE) return decodeURIComponent(v.join("="));
  }
  return null;
}
function setCookie(req, res, token) {
  const secure = req.secure || req.headers["x-forwarded-proto"] === "https";
  res.setHeader(
    "Set-Cookie",
    `${COOKIE}=${encodeURIComponent(token)}; Path=${MOUNT}; HttpOnly; SameSite=Lax; Max-Age=${12 * 3600}${secure ? "; Secure" : ""}`,
  );
}
function clearCookie(res) {
  res.setHeader("Set-Cookie", `${COOKIE}=; Path=${MOUNT}; HttpOnly; SameSite=Lax; Max-Age=0`);
}

/** Resolve the attendance user from Bearer / cookie. Returns null if none. */
export async function resolveUser(req) {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : readCookie(req);
  if (!token) return null;
  let p;
  try {
    p = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
  if (p.sa) {
    const [[u]] = await db.query(
      "SELECT id, name, mobile, role, emp_id, created FROM attendance_users WHERE id = ? LIMIT 1",
      [p.id],
    );
    return u || null;
  }
  /* HRMS token -> Super Admin / HR act as attendance admin */
  if (["SUPER_ADMIN", "hr"].includes(p.role)) {
    return { id: `hrms-${p.id}`, name: p.name || "HRMS Admin", mobile: "", role: "admin", emp_id: "", hrms: true };
  }
  /* HRMS employee token -> attendance employee keyed by employeeCode */
  if (String(p.role).toUpperCase() === "EMPLOYEE" && p.id) {
    const [[e]] = await db.query("SELECT id, employeeCode, name, email, phone FROM employees WHERE id = ? AND isActive = 1 LIMIT 1", [p.id]);
    if (!e?.employeeCode) return null;
    return { id: `hrms-emp-${e.id}`, name: e.name, mobile: e.phone || "", email: e.email || "", role: "employee", emp_id: e.employeeCode, hrms: true };
  }
  return null;
}

export const requireLogin = (role) =>
  asyncHandler(async (req, res, next) => {
    const user = await resolveUser(req);
    if (!user) return bad(res, "Login required", 401);
    if (role && user.role !== role) return bad(res, "Access denied", 403);
    req.saUser = user;
    next();
  });

export const login = asyncHandler(async (req, res) => {
  const mobile = String(req.body?.mobile || "").trim();
  const password = String(req.body?.password || "").trim();
  const role = String(req.body?.role || "").trim();
  if (!mobile || !password || !role) return bad(res, "All fields are required");

  const [[user]] = await db.query("SELECT * FROM attendance_users WHERE mobile = ? AND role = ? LIMIT 1", [mobile, role]);
  if (!user || !verifyPassword(password, user.password)) return bad(res, "Incorrect password or mobile number");
  if (!String(user.password).startsWith("$2")) {
    await db.query("UPDATE attendance_users SET password = ? WHERE id = ?", [hashPassword(password), user.id]);
  }
  const token = jwt.sign(
    { sa: true, id: user.id, role: `attendance_${user.role}`, name: user.name, emp_id: user.emp_id || "" },
    process.env.JWT_SECRET,
    { expiresIn: "12h" },
  );
  setCookie(req, res, token);
  res.json({ ok: true, token, role: user.role, name: user.name || "", emp_id: user.emp_id || "", mobile: user.mobile || "" });
});

export const logout = asyncHandler(async (_req, res) => {
  clearCookie(res);
  res.json({ ok: true });
});

export const registerAccount = asyncHandler(async (req, res) => {
  const b = req.body || {};
  const role = String(b.role || "employee");
  const name = String(b.name || "").trim();
  const mobile = String(b.mobile || "").trim();
  const password = String(b.password || "").trim();
  const empId = String(b.emp_id || "").trim();

  if (!name || !mobile || !password) return bad(res, "Please fill all fields");
  if (!isMobile(mobile)) return bad(res, "Enter a valid 10-digit mobile number");
  if (password.length < 6) return bad(res, "Password must be at least 6 characters");
  if (role === "employee" && !empId) return bad(res, "Employee ID is required");
  if (!["employee", "admin"].includes(role)) return bad(res, "Invalid role");

  const [[dupM]] = await db.query("SELECT id FROM attendance_users WHERE mobile = ?", [mobile]);
  if (dupM) return bad(res, "This mobile number is already registered");
  if (role === "employee") {
    const [[dupE]] = await db.query("SELECT id FROM attendance_users WHERE emp_id = ?", [empId]);
    if (dupE) return bad(res, `Employee ID '${empId}' already exists`);
  }
  if (role === "admin") {
    const [[existing]] = await db.query("SELECT id, mobile FROM attendance_users WHERE role = 'admin' LIMIT 1");
    if (existing && existing.mobile !== "9999999999") return bad(res, "An admin account already exists");
    if (existing) await db.query("DELETE FROM attendance_users WHERE id = ?", [existing.id]);
  }
  await db.query(
    "INSERT INTO attendance_users (name, mobile, password, role, emp_id, created) VALUES (?,?,?,?,?,?)",
    [name, mobile, hashPassword(password), role, role === "employee" ? empId : null, nowStamp(false)],
  );
  res.json({ ok: true, message: `Account created for ${name}` });
});

/* ------------------------------------------------------------------ */
/* LOCATION / WIFI                                                     */
/* ------------------------------------------------------------------ */
export const locationStatus = asyncHandler(async (req, res) => {
  const r = await isInOffice(req.body?.lat, req.body?.lng);
  res.json({ in_office: r.inOffice, distance: r.distance, radius: r.radius });
});

export const officeLocationGet = asyncHandler(async (_req, res) => {
  res.json(await getOffice());
});

export const officeLocationSet = asyncHandler(async (req, res) => {
  const lat = Number(req.body?.lat);
  const lng = Number(req.body?.lng);
  const radius = Number(req.body?.radius ?? 100);
  if (![lat, lng, radius].every(Number.isFinite)) return bad(res, "lat, lng, and radius must be valid numbers");
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return bad(res, "Invalid coordinates");
  if (radius < 5 || radius > 10000) return bad(res, "Radius must be between 5 and 10000 meters");
  await setSetting("office", { lat, lng, radius, updated: nowStamp(false) });
  res.json({ ok: true, message: `Office location saved (${lat.toFixed(6)}, ${lng.toFixed(6)}, ${Math.trunc(radius)}m radius)` });
});

export const wifiCheck = asyncHandler(async (req, res) => {
  const ip = clientIp(req);
  const [on, reason] = isOfficeIp(ip);
  res.json({ on_office_wifi: on, client_ip: ip, server_ip: serverLocalIp(), reason });
});

/* alias used by admin.html */
export const networkStatus = wifiCheck;

export const wifiAttendance = asyncHandler(async (req, res) => {
  const u = req.saUser;
  const ip = clientIp(req);
  const [on, reason] = isOfficeIp(ip);
  if (!on) return bad(res, `You are not connected to the office WiFi - ${reason}`);
  const existing = await findToday(u.emp_id);
  if (existing)
    return res.json({ ok: true, status: "already_marked", time: existing.time, message: `Attendance already marked for today. Time: ${existing.time}` });
  const t = nowTime();
  await insertAttendance({ emp_id: u.emp_id, name: u.name, date: today(), time: t, method: "WiFi", ip });
  res.json({ ok: true, status: "marked", time: t, message: `WiFi attendance marked! Time: ${t}` });
});

/* ------------------------------------------------------------------ */
/* OTP                                                                 */
/* ------------------------------------------------------------------ */
const maskEmail = (e = "") => {
  const [user = "", domain = ""] = String(e).split("@");
  if (!domain) return "";
  return `${user.slice(0, 2)}${"*".repeat(Math.max(2, user.length - 2))}@${domain}`;
};
const maskMobile = (m = "") => (m ? `${m.slice(0, 2)}****${m.slice(-2)}` : "");

/** Email of the attendance user: HRMS employees carry it; legacy accounts are looked up by emp_id. */
async function otpEmailFor(u) {
  if (u.email) return u.email;
  const [[e]] = await db.query("SELECT email FROM employees WHERE employeeCode = ? LIMIT 1", [u.emp_id]);
  return e?.email || "";
}

export const otpSend = asyncHandler(async (req, res) => {
  const u = req.saUser;
  if (await findToday(u.emp_id)) return bad(res, "Attendance already marked for today");
  const key = `otp_${u.emp_id}`;
  const prev = await getSetting(key);
  const nowSec = Date.now() / 1000;
  if (prev?.sent_at && nowSec - Number(prev.sent_at) < OTP_RESEND_SEC) {
    const wait = Math.ceil(OTP_RESEND_SEC - (nowSec - Number(prev.sent_at)));
    return res.json({ ok: false, error: `Please wait ${wait}s before requesting another OTP`, retry_in: wait });
  }
  const otp = String(crypto.randomInt(100000, 1000000));
  const email = await otpEmailFor(u);
  await setSetting(key, { otp, expires: nowSec + OTP_TTL_SEC, sent_at: nowSec, attempts: 0, mobile: u.mobile, email });
  if (OTP_DEBUG) console.log(`[smart-attendance] OTP for ${u.name} (${u.emp_id}) ${email || u.mobile}: ${otp}`);

  let delivered = false;
  if (email) {
    const r = await sendEmail(
      email,
      "Your attendance OTP",
      `<div style="font-family:Arial,sans-serif;max-width:420px;margin:auto;padding:24px;border:1px solid #eee;border-radius:12px">
        <h2 style="margin:0 0 8px;color:#111">Attendance check-in code</h2>
        <p style="color:#555;margin:0 0 16px">Hi ${u.name || ""}, use this one-time code to mark your attendance. It expires in ${OTP_TTL_SEC / 60} minutes.</p>
        <div style="font-size:32px;font-weight:bold;letter-spacing:8px;text-align:center;padding:16px;background:#f6f7f9;border-radius:8px;color:#111">${otp}</div>
        <p style="color:#999;font-size:12px;margin:16px 0 0">If you did not request this, ignore this email.</p>
      </div>`,
    );
    delivered = Boolean(r.delivered);
  }
  const where = email ? maskEmail(email) : maskMobile(u.mobile);
  const payload = {
    ok: true,
    delivered,
    channel: email ? "email" : "none",
    expires_in: OTP_TTL_SEC,
    retry_in: OTP_RESEND_SEC,
    message: delivered
      ? `OTP sent to ${where}`
      : email
        ? `OTP generated for ${where} (email delivery unavailable - contact HR)`
        : "No email on file - ask HR to add your email to receive OTPs",
  };
  if (OTP_DEBUG) payload.otp_dev = otp;
  res.json(payload);
});

export const otpVerify = asyncHandler(async (req, res) => {
  const u = req.saUser;
  const entered = String(req.body?.otp || "").trim();
  if (!entered) return bad(res, "Please enter the OTP");
  const stored = await getSetting(`otp_${u.emp_id}`);
  if (!stored?.otp) return bad(res, "No OTP found. Please request a new one");
  if (Date.now() / 1000 > Number(stored.expires)) {
    await setSetting(`otp_${u.emp_id}`, null);
    return bad(res, "OTP has expired. Please request a new one");
  }
  if (entered !== stored.otp) {
    const attempts = Number(stored.attempts || 0) + 1;
    if (attempts >= OTP_MAX_ATTEMPTS) {
      await setSetting(`otp_${u.emp_id}`, null);
      return bad(res, "Too many incorrect attempts. Please request a new OTP");
    }
    await setSetting(`otp_${u.emp_id}`, { ...stored, attempts });
    return bad(res, `Incorrect OTP (${OTP_MAX_ATTEMPTS - attempts} attempts left)`);
  }
  const loc = await isInOffice(req.body?.lat, req.body?.lng);
  if (!loc.inOffice)
    return bad(
      res,
      loc.noLocation
        ? "Location unavailable. Allow location access in your browser and try again"
        : `You are outside the office boundary (${loc.distance}m away). Maximum allowed: ${Math.trunc(loc.radius)}m`,
    );
  await setSetting(`otp_${u.emp_id}`, null);
  const existing = await findToday(u.emp_id);
  if (existing)
    return res.json({ ok: true, status: "already_marked", time: existing.time, message: `Attendance already marked for today. Time: ${existing.time}` });
  const t = nowTime();
  await insertAttendance({ emp_id: u.emp_id, name: u.name, date: today(), time: t, method: "OTP", ip: clientIp(req), lat: req.body?.lat, lng: req.body?.lng });
  res.json({ ok: true, status: "marked", time: t, message: `OTP attendance marked! Time: ${t}` });
});

/* ------------------------------------------------------------------ */
/* FACE (browser face-api.js descriptors)                              */
/* ------------------------------------------------------------------ */
const parseDescriptor = (d) =>
  Array.isArray(d) && d.length === 128 && d.every((x) => Number.isFinite(Number(x))) ? d.map(Number) : null;
const euclid = (a, b) => Math.sqrt(a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0));
const NO_ENGINE_MSG = "Face engine now runs in your browser - please reload the page and allow the camera.";

export const registerFace = asyncHandler(async (req, res) => {
  const empId = String(req.body?.emp_id || "").trim();
  const name = String(req.body?.name || "").trim();
  if (!empId || !name) return bad(res, "emp_id, name, and image are all required");
  const desc = parseDescriptor(req.body?.descriptor);
  if (!desc) return bad(res, req.body?.image ? NO_ENGINE_MSG : "No face detected in image");

  const [[row]] = await db.query("SELECT encoding, face_engine FROM attendance_employees WHERE emp_id = ?", [empId]);
  let samples = [];
  if (row?.face_engine === "face-api" && row.encoding) {
    try {
      samples = JSON.parse(row.encoding);
    } catch {
      samples = [];
    }
  }
  samples = [...samples.filter((s) => parseDescriptor(s)), desc].slice(-5);
  await db.query(
    `INSERT INTO attendance_employees (emp_id, name, encoding, face_engine, registered_at) VALUES (?,?,?,'face-api',?)
     ON DUPLICATE KEY UPDATE name=VALUES(name), encoding=VALUES(encoding), face_engine='face-api', registered_at=VALUES(registered_at)`,
    [empId, name, JSON.stringify(samples), nowStamp(false)],
  );
  res.json({ ok: true, message: `${empId} | ${name} registered successfully!`, samples: samples.length });
});

export const markAttendance = asyncHandler(async (req, res) => {
  const b = req.body || {};
  let tol = Number(b.tolerance ?? 0.55);
  if (!Number.isFinite(tol)) tol = 0.55;
  tol = Math.min(Math.max(tol, 0.35), 0.7);

  const loc = await isInOffice(b.lat, b.lng);
  if (!loc.inOffice)
    return bad(
      res,
      loc.noLocation
        ? "Location unavailable. Allow location access in your browser and try again"
        : `You are outside the office boundary (${loc.distance}m away). Maximum allowed distance: ${Math.trunc(loc.radius)}m`,
    );

  const incoming = (Array.isArray(b.descriptors) ? b.descriptors : [b.descriptor]).map(parseDescriptor).filter(Boolean);
  if (!incoming.length) return bad(res, b.image ? NO_ENGINE_MSG : "No image received");

  const [emps] = await db.query("SELECT emp_id, name, encoding FROM attendance_employees WHERE face_engine = 'face-api' AND encoding IS NOT NULL");
  if (!emps.length) return bad(res, "No faces registered yet (employees must re-register their face once)");
  const gallery = emps.map((e) => {
    let s = [];
    try {
      s = JSON.parse(e.encoding);
    } catch {
      s = [];
    }
    return { emp_id: e.emp_id, name: e.name, samples: s.map(parseDescriptor).filter(Boolean) };
  });

  const results = incoming.map((d) => {
    let best = { emp_id: "Unknown", name: "Unknown", dist: Infinity };
    for (const g of gallery) {
      for (const s of g.samples) {
        const dist = euclid(d, s);
        if (dist < best.dist) best = { emp_id: g.emp_id, name: g.name, dist };
      }
    }
    return best.dist <= tol ? best : { emp_id: "Unknown", name: "Unknown", dist: best.dist };
  });

  /* employee self-mark may only mark themselves */
  const u = req.saUser;
  const ip = clientIp(req);
  const t = nowTime();
  const marked = [];
  for (const r of results) {
    if (r.emp_id === "Unknown") continue;
    if (u.role === "employee" && r.emp_id !== u.emp_id) {
      marked.push({ emp_id: r.emp_id, name: r.name, status: "not_you", time: "" });
      continue;
    }
    const existing = await findToday(r.emp_id);
    if (existing) {
      marked.push({ emp_id: r.emp_id, name: r.name, status: "already_marked", time: existing.time });
      continue;
    }
    await insertAttendance({ emp_id: r.emp_id, name: r.name, date: today(), time: t, method: "Face", ip, lat: b.lat, lng: b.lng });
    marked.push({ emp_id: r.emp_id, name: r.name, status: "marked", time: t });
  }
  res.json({
    ok: true,
    marked,
    unknown: results.filter((r) => r.emp_id === "Unknown").length,
    total_faces: results.length,
  });
});

/* ------------------------------------------------------------------ */
/* STATS / REPORTS                                                     */
/* ------------------------------------------------------------------ */
export const stats = asyncHandler(async (_req, res) => {
  const d = today();
  const [[{ present }]] = await db.query("SELECT COUNT(*) present FROM attendance_records WHERE date = ?", [d]);
  const [[{ registered }]] = await db.query("SELECT COUNT(*) registered FROM attendance_employees");
  res.json({ present, absent: Math.max(0, registered - present), registered, date: d });
});

export const todayLog = asyncHandler(async (_req, res) => {
  const [rows] = await db.query("SELECT * FROM attendance_records WHERE date = ? ORDER BY time", [today()]);
  res.json({ ok: true, rows: rows.map(({ id, ...r }) => r) });
});

export const report = asyncHandler(async (req, res) => {
  const date = String(req.query.date || today());
  const [rows] = await db.query("SELECT * FROM attendance_records WHERE date = ? ORDER BY time", [date]);
  res.json({ ok: true, date, rows: rows.map((r) => ({ ...r, _id: String(r.id) })) });
});

export const downloadCsv = asyncHandler(async (req, res) => {
  const period = String(req.query.period || "today");
  const t = today();
  let where = "";
  let args = [];
  let fname = "attendance_all_time.csv";
  if (period === "today") [where, args, fname] = ["WHERE date = ?", [t], `attendance_today_${t}.csv`];
  else if (period === "month") [where, args, fname] = ["WHERE date LIKE ?", [`${t.slice(0, 7)}%`], `attendance_month_${t.slice(0, 7)}.csv`];
  else if (period === "year") [where, args, fname] = ["WHERE date LIKE ?", [`${t.slice(0, 4)}%`], `attendance_year_${t.slice(0, 4)}.csv`];
  else if (period === "custom") {
    const d = String(req.query.date || t);
    [where, args, fname] = ["WHERE date = ?", [d], `attendance_${d}.csv`];
  }
  const [rows] = await db.query(`SELECT emp_id,name,date,time,status,method,ip FROM attendance_records ${where} ORDER BY date, time`, args);
  // An empty period is not an error: still deliver a header-only CSV so the
  // Download button always produces a file. The row count travels in a header
  // so the UI can tell the admin "0 records" instead of failing silently.
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = ["emp_id,name,date,time,status,method,ip", ...rows.map((r) => Object.values(r).map(esc).join(","))].join("\r\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${fname}"`);
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Row-Count", String(rows.length));
  res.send("\uFEFF" + csv);
});

export const registeredEmployees = asyncHandler(async (_req, res) => {
  const [rows] = await db.query(
    "SELECT emp_id, name, registered_at, face_engine, (face_engine='face-api') AS face_ready FROM attendance_employees ORDER BY emp_id",
  );
  res.json({ ok: true, employees: rows.map((r) => ({ ...r, face_ready: Boolean(r.face_ready) })) });
});

/* ------------------------------------------------------------------ */
/* EMPLOYEE / ACCOUNT MANAGEMENT                                       */
/* ------------------------------------------------------------------ */
export const deleteEmployee = asyncHandler(async (req, res) => {
  const q = String(req.body?.query || "").trim();
  if (!q) return bad(res, "Employee not found");
  const [r] = await db.query("DELETE FROM attendance_employees WHERE emp_id = ? OR name = ? LIMIT 1", [q, q]);
  if (!r.affectedRows) return bad(res, "Employee not found");
  res.json({ ok: true, message: "Employee deleted successfully" });
});

export const accountsList = asyncHandler(async (_req, res) => {
  const [rows] = await db.query("SELECT name, mobile, role, emp_id, created FROM attendance_users WHERE role = 'employee' ORDER BY id");
  res.json({ ok: true, accounts: rows });
});

export const accountsCreate = asyncHandler(async (req, res) => {
  const b = req.body || {};
  const [name, empId, mobile, password] = ["name", "emp_id", "mobile", "password"].map((k) => String(b[k] || "").trim());
  if (!name || !empId || !mobile || !password) return bad(res, "All fields are required");
  if (!isMobile(mobile)) return bad(res, "Enter a valid 10-digit mobile number");
  const [[dupM]] = await db.query("SELECT id FROM attendance_users WHERE mobile = ?", [mobile]);
  if (dupM) return bad(res, "This mobile number is already registered");
  const [[dupE]] = await db.query("SELECT id FROM attendance_users WHERE emp_id = ?", [empId]);
  if (dupE) return bad(res, `Employee ID '${empId}' is already in use`);
  await db.query("INSERT INTO attendance_users (name, emp_id, mobile, password, role, created) VALUES (?,?,?,?,'employee',?)", [
    name,
    empId,
    mobile,
    hashPassword(password),
    nowStamp(false),
  ]);
  res.json({ ok: true, message: `Account created for ${name} (${empId})` });
});

export const accountsDelete = asyncHandler(async (req, res) => {
  const q = String(req.body?.query || "").trim();
  if (!q) return bad(res, "Account not found");
  const [r] = await db.query("DELETE FROM attendance_users WHERE role = 'employee' AND (mobile = ? OR emp_id = ?) LIMIT 1", [q, q]);
  if (!r.affectedRows) return bad(res, "Account not found");
  res.json({ ok: true });
});

export const accountsUpdateAdmin = asyncHandler(async (req, res) => {
  if (req.saUser.hrms) return bad(res, "Log in with the attendance admin account to change it");
  const mob = String(req.body?.mobile || "").trim();
  const pass = String(req.body?.password || "").trim();
  const sets = [];
  const args = [];
  if (mob) {
    if (!isMobile(mob)) return bad(res, "Enter a valid 10-digit mobile number");
    sets.push("mobile = ?");
    args.push(mob);
  }
  if (pass) {
    if (pass.length < 6) return bad(res, "Password must be at least 6 characters");
    sets.push("password = ?");
    args.push(hashPassword(pass));
  }
  if (!sets.length) return bad(res, "No changes provided");
  await db.query(`UPDATE attendance_users SET ${sets.join(", ")} WHERE role = 'admin'`, args);
  res.json({ ok: true, message: "Admin details updated successfully!" });
});

export const myStatus = asyncHandler(async (req, res) => {
  const u = req.saUser;
  const rec = await findToday(u.emp_id);
  if (rec) delete rec.id;
  res.json({ ok: true, marked: Boolean(rec), record: rec || null, name: u.name, emp_id: u.emp_id });
});

/* ------------------------------------------------------------------ */
/* ATTENDANCE DELETE                                                   */
/* ------------------------------------------------------------------ */
export const deleteRecord = asyncHandler(async (req, res) => {
  const date = req.query.date;
  if (!date) return bad(res, "Date parameter is required");
  const [r] = await db.query("DELETE FROM attendance_records WHERE emp_id = ? AND date = ? LIMIT 1", [req.params.emp_id, date]);
  if (!r.affectedRows) return bad(res, "Record not found");
  res.json({ ok: true, deleted: r.affectedRows });
});

export const deleteByDate = asyncHandler(async (req, res) => {
  const [r] = await db.query("DELETE FROM attendance_records WHERE date = ?", [req.params.date]);
  res.json({ ok: true, deleted: r.affectedRows });
});

export const bulkDelete = asyncHandler(async (req, res) => {
  const ids = (req.body?.record_ids || []).map((x) => Number.parseInt(x, 10)).filter(Number.isFinite);
  if (!ids.length) return bad(res, "record_ids list is required");
  const [r] = await db.query("DELETE FROM attendance_records WHERE id IN (?)", [ids]);
  res.json({ ok: true, deleted: r.affectedRows });
});

/* ------------------------------------------------------------------ */
/* SHIFT / CHECK-OUT / HISTORY / SUMMARY                               */
/* ------------------------------------------------------------------ */
export const shiftGet = asyncHandler(async (_req, res) => res.json({ ok: true, shift: await getShift() }));

export const shiftSet = asyncHandler(async (req, res) => {
  const d = req.body || {};
  const upd = {};
  for (const k of ["start", "end"]) {
    if (k in d) {
      if (!isHHMM(String(d[k]))) return bad(res, "Invalid shift values (times HH:MM, numbers for hours)");
      upd[k] = String(d[k]);
    }
  }
  if ("grace_min" in d) {
    const v = Number.parseInt(d.grace_min, 10);
    if (!Number.isFinite(v) || v < 0 || v > 240) return bad(res, "grace_min must be 0-240");
    upd.grace_min = v;
  }
  for (const k of ["half_day_hours", "full_day_hours", "overtime_after_hours"]) {
    if (k in d) {
      const v = Number(d[k]);
      if (!Number.isFinite(v) || v < 0.5 || v > 24) return bad(res, `${k} must be 0.5-24`);
      upd[k] = v;
    }
  }
  if (!Object.keys(upd).length) return bad(res, "Nothing to update");
  await setSetting("shift", { ...((await getSetting("shift")) || {}), ...upd });
  res.json({ ok: true, shift: await getShift(), message: "Shift settings saved" });
});

export const checkOut = asyncHandler(async (req, res) => {
  const u = req.saUser;
  const rec = await findToday(u.emp_id);
  if (!rec) return bad(res, "No check-in found for today - mark attendance first");
  if (rec.check_out) return bad(res, `Already checked out at ${rec.check_out}`);
  const shift = await getShift();
  const t = nowTime();
  const hours = computeHours(rec.time || t, t);
  const overtime = Math.max(0, Math.round((hours - Number(shift.overtime_after_hours)) * 100) / 100);
  const status = hours < Number(shift.half_day_hours) ? "Half Day" : rec.status || "Present";
  await db.query("UPDATE attendance_records SET check_out=?, hours=?, overtime=?, status=? WHERE id=?", [t, hours, overtime, status, rec.id]);
  pushAsync(rec.id);
  res.json({
    ok: true,
    check_out: t,
    hours,
    overtime,
    status,
    message: `Checked out at ${t} - ${hours}h worked${overtime > 0 ? ` (+${overtime}h overtime)` : ""}`,
  });
});

export const myHistory = asyncHandler(async (req, res) => {
  const month = String(req.query.month || today().slice(0, 7));
  if (!/^\d{4}-\d{2}$/.test(month)) return bad(res, "month must be YYYY-MM");
  const [rows] = await db.query("SELECT * FROM attendance_records WHERE emp_id = ? AND date LIKE ? ORDER BY date DESC", [req.saUser.emp_id, `${month}%`]);
  const records = rows.map(({ id, ...r }) => r);
  const sum = (k) => Math.round(records.reduce((a, r) => a + Number(r[k] || 0), 0) * 100) / 100;
  res.json({
    ok: true,
    records,
    summary: {
      days_present: records.length,
      late_days: records.filter((r) => r.status === "Late").length,
      half_days: records.filter((r) => r.status === "Half Day").length,
      total_hours: sum("hours"),
      total_overtime: sum("overtime"),
    },
  });
});

export const adminSummary = asyncHandler(async (req, res) => {
  const month = String(req.query.month || today().slice(0, 7));
  if (!/^\d{4}-\d{2}$/.test(month)) return bad(res, "month must be YYYY-MM");
  const [rows] = await db.query(
    `SELECT emp_id, MIN(name) name, COUNT(*) days_present,
            SUM(status='Late') late_days, SUM(status='Half Day') half_days,
            ROUND(SUM(COALESCE(hours,0)),2) total_hours, ROUND(SUM(COALESCE(overtime,0)),2) total_overtime
     FROM attendance_records WHERE date LIKE ? GROUP BY emp_id ORDER BY emp_id`,
    [`${month}%`],
  );
  res.json({ ok: true, month, rows: rows.map((r) => ({ ...r, late_days: Number(r.late_days), half_days: Number(r.half_days), total_hours: Number(r.total_hours), total_overtime: Number(r.total_overtime) })) });
});

/* ------------------------------------------------------------------ */
/* CORRECTIONS                                                         */
/* ------------------------------------------------------------------ */
export const correctionRequest = asyncHandler(async (req, res) => {
  const u = req.saUser;
  const b = req.body || {};
  const date = String(b.date || "").trim();
  const reason = String(b.reason || "").trim();
  const cin = String(b.check_in || "").trim();
  const cout = String(b.check_out || "").trim();
  if (!isDate(date)) return bad(res, "date must be YYYY-MM-DD");
  if (reason.length < 5) return bad(res, "Reason required (min 5 characters)");
  for (const t of [cin, cout]) if (t && !isHHMM(t)) return bad(res, "Times must be HH:MM");
  if (!cin && !cout) return bad(res, "Provide check_in or check_out time");
  const [[dup]] = await db.query("SELECT id FROM attendance_corrections WHERE emp_id = ? AND date = ? AND state = 'pending'", [u.emp_id, date]);
  if (dup) return bad(res, "A pending request already exists for this date");
  await db.query(
    "INSERT INTO attendance_corrections (emp_id, name, date, check_in, check_out, reason, state, requested_at) VALUES (?,?,?,?,?,?,'pending',?)",
    [u.emp_id, u.name, date, cin || null, cout || null, reason, nowStamp()],
  );
  res.json({ ok: true, message: "Correction request submitted - admin will approve" });
});

export const correctionsList = asyncHandler(async (req, res) => {
  const u = req.saUser;
  let rows;
  if (u.role === "admin") {
    const state = String(req.query.state || "pending");
    [rows] =
      state === "all"
        ? await db.query("SELECT * FROM attendance_corrections ORDER BY requested_at DESC LIMIT 200")
        : await db.query("SELECT * FROM attendance_corrections WHERE state = ? ORDER BY requested_at DESC LIMIT 200", [state]);
  } else {
    [rows] = await db.query("SELECT * FROM attendance_corrections WHERE emp_id = ? ORDER BY requested_at DESC LIMIT 50", [u.emp_id]);
  }
  res.json({ ok: true, corrections: rows.map((r) => ({ ...r, id: String(r.id) })) });
});

export const correctionDecide = asyncHandler(async (req, res) => {
  const decision = req.body?.decision;
  if (!["approve", "reject"].includes(decision)) return bad(res, "decision must be approve|reject");
  const cid = Number.parseInt(req.params.cid, 10);
  const [[cor]] = await db.query("SELECT * FROM attendance_corrections WHERE id = ?", [cid]);
  if (!cor) return bad(res, "Correction not found");
  if (cor.state !== "pending") return bad(res, `Already ${cor.state}`);
  const stamp = nowStamp();
  const admin = req.saUser.name;

  if (decision === "reject") {
    await db.query("UPDATE attendance_corrections SET state='rejected', decided_by=?, decided_at=? WHERE id=?", [admin, stamp, cid]);
    return res.json({ ok: true, message: "Correction rejected" });
  }

  const [[rec]] = await db.query("SELECT * FROM attendance_records WHERE emp_id = ? AND date = ? LIMIT 1", [cor.emp_id, cor.date]);
  const shift = await getShift();
  const newIn = cor.check_in ? `${cor.check_in}:00` : rec?.time || null;
  const newOut = cor.check_out ? `${cor.check_out}:00` : rec?.check_out || null;
  const hours = newIn && newOut ? computeHours(newIn, newOut) : Number(rec?.hours || 0);
  const overtime = hours ? Math.max(0, Math.round((hours - Number(shift.overtime_after_hours)) * 100) / 100) : 0;
  let status = newIn ? checkinStatus(newIn, shift) : "Present";
  if (newIn && newOut && hours < Number(shift.half_day_hours)) status = "Half Day";
  const original = JSON.stringify({ time: rec?.time || null, check_out: rec?.check_out || null });

  let recId;
  if (rec) {
    await db.query(
      `UPDATE attendance_records SET time=COALESCE(?,time), check_out=COALESCE(?,check_out), status=?, hours=?, overtime=?, approval='approved',
         corrected=1, corrected_by=?, corrected_at=?, correction_reason=?, original=? WHERE id=?`,
      [newIn, newOut, status, hours, overtime, admin, stamp, cor.reason, original, rec.id],
    );
    recId = rec.id;
  } else {
    const [r] = await db.query(
      `INSERT INTO attendance_records (emp_id, name, date, time, check_out, status, method, approval, hours, overtime, corrected, corrected_by, corrected_at, correction_reason, original)
       VALUES (?,?,?,?,?,?,'Correction','approved',?,?,1,?,?,?,?)`,
      [cor.emp_id, cor.name, cor.date, newIn || "00:00:00", newOut, status, hours, overtime, admin, stamp, cor.reason, original],
    );
    recId = r.insertId;
  }
  await db.query("UPDATE attendance_corrections SET state='approved', decided_by=?, decided_at=? WHERE id=?", [admin, stamp, cid]);
  pushAsync(recId);
  res.json({ ok: true, message: "Correction approved and attendance updated" });
});

/* ------------------------------------------------------------------ */
/* APPROVAL                                                            */
/* ------------------------------------------------------------------ */
export const attendancePending = asyncHandler(async (_req, res) => {
  const [rows] = await db.query("SELECT * FROM attendance_records WHERE approval = 'pending' ORDER BY date DESC, time DESC LIMIT 300");
  res.json({ ok: true, records: rows.map((r) => ({ ...r, id: String(r.id) })) });
});

export const attendanceApprove = asyncHandler(async (req, res) => {
  const decision = req.body?.decision || "approved";
  if (!["approved", "rejected"].includes(decision)) return bad(res, "decision must be approved|rejected");
  const ids = (Array.isArray(req.body?.ids) ? req.body.ids : []).map((x) => Number.parseInt(x, 10)).filter(Number.isFinite);
  if (!ids.length || ids.length > 500) return bad(res, "ids list required (max 500)");
  const [r] = await db.query("UPDATE attendance_records SET approval=?, approved_by=?, approved_at=? WHERE id IN (?) AND approval='pending'", [
    decision,
    req.saUser.name,
    nowStamp(),
    ids,
  ]);
  res.json({ ok: true, updated: r.affectedRows, message: `${r.affectedRows} record(s) ${decision}` });
});

/* ------------------------------------------------------------------ */
/* HRMS SETTINGS / RETRY                                               */
/* ------------------------------------------------------------------ */
export const hrmsGet = asyncHandler(async (_req, res) => {
  const s = (await getSetting("hrms")) || {};
  res.json({ ok: true, hrms: { enabled: s.enabled !== false, url: "same-database (unified backend)", key: "not required", mode: "direct" } });
});

export const hrmsSet = asyncHandler(async (req, res) => {
  if (!("enabled" in (req.body || {}))) return bad(res, "Nothing to update");
  await setSetting("hrms", { enabled: Boolean(req.body.enabled) });
  res.json({ ok: true, message: "HRMS sync settings saved" });
});

export const hrmsRetry = asyncHandler(async (_req, res) => {
  const [rows] = await db.query("SELECT id FROM attendance_records WHERE hrms_sync = 'failed' OR hrms_sync IS NULL LIMIT 100");
  for (const r of rows) pushAsync(r.id);
  res.json({ ok: true, message: `Retrying ${rows.length} record(s) in background` });
});

export const health = asyncHandler(async (_req, res) => {
  let database = "ok";
  try {
    await db.query("SELECT 1");
  } catch (e) {
    database = `error: ${e.message}`;
  }
  res.json({ status: "healthy", system: "Smart Attendance (Node)", face_engine: "browser face-api.js", database });
});
