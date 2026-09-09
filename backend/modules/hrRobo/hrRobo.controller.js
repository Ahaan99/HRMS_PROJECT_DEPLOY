/**
 * HR Robo (AI Interview Portal) - Node/Express port of the FastAPI service.
 *
 * Keeps the exact paths + JSON shapes the interview UI (modules/hrRobo/ui)
 * and the HR / Super Admin React portals already consume:
 *   /api/v1/auth/login, /api/v1/tts, /api/v1/stt, /api/v1/interviews/chat
 *   /api/integration/{sync,summary,reports,proctor-logs,health}
 *   /api/videos, /api/videos/upload/:id, /api/videos/:id
 *
 * Storage: robo_* tables in hrms_db (see hrRobo.schema.sql); recordings in
 * uploads/hr-robo/video/.  Auth: HRMS Super Admin / HR credentials first,
 * legacy robo_admin_users second - always issues a standard HRMS JWT.
 */
import fs from "fs";
import path from "path";
import crypto from "crypto";
import bcrypt from "bcryptjs";

import { db } from "../../config/db.js";
import { signToken } from "../../utils/jwt.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { loginHRService } from "../hr/auth/hrAuth.service.js";

export const ROBO_ROLES = ["SUPER_ADMIN", "hr"];

/* ------------------------------------------------------------------ */
/* paths                                                               */
/* ------------------------------------------------------------------ */
export const VIDEO_DIR = path.join(process.cwd(), "uploads", "hr-robo", "video");
fs.mkdirSync(VIDEO_DIR, { recursive: true });

const MAX_VIDEO_BYTES = 500 * 1024 * 1024;
const MIME_EXT = {
  "video/webm": "webm",
  "video/mp4": "mp4",
  "video/x-matroska": "mkv",
  "video/ogg": "ogv",
};
const extFor = (mime) => MIME_EXT[String(mime || "").split(";")[0].trim().toLowerCase()] || "webm";
const groqKey = () => (process.env.GROQ_API_KEY || "").trim();

/* ================================================================== */
/* AUTH                                                                */
/* ================================================================== */
export const roboLogin = asyncHandler(async (req, res) => {
  const email = String(req.body?.email || req.body?.username || "").trim();
  const password = String(req.body?.password || "");
  if (!email || !password) return res.status(400).json({ detail: "Email and password required" });

  /* 1. HRMS Super Admin */
  const [[admin]] = await db.query(
    "SELECT id, name, email, password_hash, status FROM super_admins WHERE email = ? LIMIT 1",
    [email],
  );
  if (admin) {
    if (admin.status !== "ACTIVE") return res.status(403).json({ detail: "Account blocked" });
    if (!(await bcrypt.compare(password, admin.password_hash)))
      return res.status(401).json({ detail: "Invalid credentials" });
    const token = signToken({ id: admin.id, name: admin.name, email: admin.email, role: "SUPER_ADMIN" });
    return res.json({
      access_token: token,
      token_type: "bearer",
      user: { name: admin.name, role: "super_admin", email: admin.email },
    });
  }

  /* 2. HRMS HR account */
  try {
    const hr = await loginHRService({ email, password });
    return res.json({
      access_token: hr.token,
      token_type: "bearer",
      user: { name: hr.employee?.name || "HR", role: "hr_admin", email },
    });
  } catch {
    /* fall through */
  }

  /* 3. Legacy standalone HR Robo admin (migrated from hr_robo_db.admin_users) */
  const [[legacy]] = await db.query(
    "SELECT id, name, email, hashed_password, role, is_active FROM robo_admin_users WHERE email = ? LIMIT 1",
    [email],
  );
  if (legacy && legacy.is_active && (await bcrypt.compare(password, legacy.hashed_password))) {
    await db.query("UPDATE robo_admin_users SET last_login = NOW() WHERE id = ?", [legacy.id]);
    const token = signToken({ id: legacy.id, name: legacy.name, email: legacy.email, role: "hr" });
    return res.json({
      access_token: token,
      token_type: "bearer",
      user: { name: legacy.name, role: legacy.role, email: legacy.email },
    });
  }

  res.status(401).json({ detail: "Invalid credentials" });
});

export const roboMe = asyncHandler(async (req, res) => {
  const u = req.user || {};
  res.json({ sub: u.email, id: u.id, name: u.name, role: u.role === "SUPER_ADMIN" ? "super_admin" : "hr_admin", email: u.email });
});

/* ================================================================== */
/* INTEGRATION STORE (snapshots pushed by the interview UI)            */
/* ================================================================== */
const SNAP_KEYS = ["reports", "proctor_logs", "candidates", "schedules", "config"];

async function loadStore() {
  const store = { reports: [], proctor_logs: [], candidates: [], schedules: [], config: {}, synced_at: null };
  const [rows] = await db.query("SELECT snap_key, data, updated_at FROM robo_snapshots");
  let latest = null;
  for (const r of rows) {
    /* mysql2 auto-parses JSON columns; a JSON string value (synced_at) arrives as a plain string */
    let val = r.data;
    if (typeof val === "string") {
      try {
        val = JSON.parse(val);
      } catch {
        /* already the decoded scalar */
      }
    }
    if (r.snap_key === "synced_at") store.synced_at = val;
    else if (SNAP_KEYS.includes(r.snap_key)) store[r.snap_key] = val ?? store[r.snap_key];
    if (!latest || r.updated_at > latest) latest = r.updated_at;
  }
  if (!store.synced_at && latest) store.synced_at = new Date(latest).toISOString();
  return store;
}

async function saveKey(key, value) {
  await db.query(
    "INSERT INTO robo_snapshots (snap_key, data) VALUES (?, ?) ON DUPLICATE KEY UPDATE data = VALUES(data)",
    [key, JSON.stringify(value)],
  );
}

export const syncSnapshot = asyncHandler(async (req, res) => {
  const body = req.body || {};
  for (const k of SNAP_KEYS) {
    if (k in body && body[k] !== null && body[k] !== undefined) await saveKey(k, body[k]);
  }
  const syncedAt = new Date().toISOString();
  await saveKey("synced_at", syncedAt);
  const store = await loadStore();
  res.json({
    ok: true,
    synced_at: syncedAt,
    counts: {
      reports: store.reports.length,
      proctor_logs: store.proctor_logs.length,
      candidates: store.candidates.length,
      schedules: store.schedules.length,
    },
  });
});

/* ================================================================== */
/* SHARED UI STORE                                                     */
/* The interview UI used to keep candidates / results / schedules in    */
/* browser localStorage, so an admin on laptop A could never see a      */
/* candidate who registered on laptop B.  These endpoints make the      */
/* backend the single source of truth: every browser pulls the dataset  */
/* on load and pushes each change back.  Rows live in robo_snapshots    */
/* under a "ui_" prefix so they never collide with the HRMS-portal      */
/* integration snapshots above.                                         */
/* ================================================================== */
const UI_PREFIX = "ui_";
/* keys the candidate browser (no HRMS session) may write */
export const UI_PUBLIC_KEYS = ["candidates", "results", "schedules", "proctor_logs", "ai_reports", "interview_logs"];
/* keys only an HR / Super Admin JWT may write */
export const UI_ADMIN_KEYS = ["positions", "proctor_config", "emailjs_config"];
const UI_ALL_KEYS = [...UI_PUBLIC_KEYS, ...UI_ADMIN_KEYS];

function parseJsonCol(val) {
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  }
  return val;
}

/** GET /api/store  -> { ok, data:{key:value}, updated:{key:iso}, server_time } */
export const uiStoreGetAll = asyncHandler(async (_req, res) => {
  const [rows] = await db.query(
    "SELECT snap_key, data, updated_at FROM robo_snapshots WHERE snap_key LIKE ?",
    [UI_PREFIX + "%"],
  );
  const data = {};
  const updated = {};
  for (const r of rows) {
    const key = r.snap_key.slice(UI_PREFIX.length);
    if (!UI_ALL_KEYS.includes(key)) continue;
    data[key] = parseJsonCol(r.data);
    updated[key] = r.updated_at ? new Date(r.updated_at).toISOString() : null;
  }
  res.set("Cache-Control", "no-store");
  res.json({ ok: true, data, updated, server_time: new Date().toISOString() });
});

/* ------------------------------------------------------------------
   Identity of one list item, used to MERGE instead of REPLACE.
   Bug this fixes: every browser used to PUT its whole cached array
   (last-writer-wins). Admin on laptop A, holding a stale copy, would
   overwrite the candidate that had just registered on laptop B the
   moment A touched the list (approve / reject / schedule).  Now the
   server unions its own list with the client's, client wins conflicts,
   and only ids the client explicitly removed are dropped.
   The client computes the same identity (see ui/index.html itemKey).
   ------------------------------------------------------------------ */
export function storeItemKey(key, it) {
  if (it === null || typeof it !== "object") return "v:" + JSON.stringify(it);
  if (key === "results") return "c:" + String(it.candidate_id ?? it.id ?? JSON.stringify(it));
  if (it.id !== undefined && it.id !== null) return "i:" + String(it.id);
  if (it.candidate_id !== undefined && it.candidate_id !== null)
    return "c:" + String(it.candidate_id) + ":" + String(it.ts ?? it.timestamp ?? it.time ?? it.created_at ?? "");
  return "j:" + JSON.stringify(it);
}

export function mergeStoreLists(key, serverList, clientList, removed) {
  const rm = new Set((Array.isArray(removed) ? removed : []).map(String));
  const out = new Map();
  for (const it of Array.isArray(serverList) ? serverList : []) {
    const k = storeItemKey(key, it);
    if (rm.has(k)) continue;
    out.set(k, it);
  }
  for (const it of Array.isArray(clientList) ? clientList : []) {
    out.set(storeItemKey(key, it), it); // client's copy wins on conflict
  }
  return [...out.values()];
}

/** PUT /api/store/:key  body { value, removed?:string[], replace?:boolean }
 *  (admin keys are protected in the router).  List keys are merged by item
 *  identity unless replace:true is sent explicitly. */
export const uiStorePut = asyncHandler(async (req, res) => {
  const key = String(req.params.key || "");
  if (!UI_ALL_KEYS.includes(key)) return res.status(400).json({ ok: false, detail: "Unknown store key" });
  if (!req.body || !("value" in req.body)) return res.status(400).json({ ok: false, detail: "Body must be { value }" });
  let value = req.body.value;
  /* list keys must stay lists so a corrupted client can never wipe the shape */
  if (UI_PUBLIC_KEYS.includes(key) && !Array.isArray(value))
    return res.status(400).json({ ok: false, detail: `${key} must be an array` });

  let merged = false;
  if (Array.isArray(value) && req.body.replace !== true) {
    const [[cur]] = await db.query("SELECT data FROM robo_snapshots WHERE snap_key = ? LIMIT 1", [UI_PREFIX + key]);
    const serverList = cur ? parseJsonCol(cur.data) : [];
    if (Array.isArray(serverList)) {
      value = mergeStoreLists(key, serverList, value, req.body.removed);
      merged = true;
    }
  }
  await saveKey(UI_PREFIX + key, value);
  const [[row]] = await db.query("SELECT updated_at FROM robo_snapshots WHERE snap_key = ?", [UI_PREFIX + key]);
  res.json({
    ok: true,
    key,
    merged,
    value,
    count: Array.isArray(value) ? value.length : undefined,
    updated_at: row ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
  });
});

export const summary = asyncHandler(async (_req, res) => {
  const s = await loadStore();
  const verdicts = {};
  for (const r of s.reports) {
    const v = r?.recommendation?.verdict || r?.verdict || "PENDING";
    verdicts[v] = (verdicts[v] || 0) + 1;
  }
  const logs = s.proctor_logs;
  res.json({
    synced_at: s.synced_at,
    total_interviews: s.reports.length,
    total_candidates: s.candidates.length,
    scheduled: s.schedules.filter((x) => x?.status === "scheduled").length,
    terminated: logs.filter((l) => l?.terminated).length,
    avg_integrity: logs.length
      ? Math.round((logs.reduce((a, l) => a + (Number(l?.integrity ?? 100) || 0), 0) / logs.length) * 10) / 10
      : null,
    verdicts,
  });
});

export const reports = asyncHandler(async (_req, res) => {
  const s = await loadStore();
  res.json({ synced_at: s.synced_at, reports: s.reports, candidates: s.candidates, schedules: s.schedules });
});

async function videosIndex() {
  const [rows] = await db.query("SELECT * FROM robo_videos");
  const out = {};
  for (const r of rows) {
    if (r.file && path.basename(r.file) === r.file && fs.existsSync(path.join(VIDEO_DIR, r.file))) {
      out[String(r.candidate_id)] = {
        candidate_id: r.candidate_id,
        candidate_name: r.candidate_name,
        file: r.file,
        mime: r.mime,
        duration: r.duration,
        size: Number(r.size),
        uploaded_at: r.uploaded_at ? new Date(r.uploaded_at).toISOString() : null,
      };
    }
  }
  return out;
}

export const proctorLogs = asyncHandler(async (_req, res) => {
  const s = await loadStore();
  const videos = await videosIndex();
  const meta = (cid) => {
    const m = cid === null || cid === undefined ? null : videos[String(cid)];
    if (!m) return { has_video: false, video_url: null };
    return {
      has_video: true,
      /* relative to the HR Robo base (same contract as the Python service);
         consumers prepend their ROBO_URL, e.g. <api>/hr-robo + /api/videos/1 */
      video_url: `/api/videos/${cid}`,
      video_duration: m.duration || 0,
      video_size: m.size || 0,
      video_uploaded_at: m.uploaded_at,
    };
  };
  res.json({
    synced_at: s.synced_at,
    proctor_logs: s.proctor_logs.map((l) => ({ ...l, ...meta(l?.candidate_id) })),
    config: s.config,
    candidates: s.candidates.map((c) => ({ ...c, ...meta(c?.id) })),
  });
});

export const integrationHealth = asyncHandler(async (_req, res) => {
  const s = await loadStore();
  res.json({ status: "ok", module: "hrms-integration", synced_at: s.synced_at });
});

/* ================================================================== */
/* VIDEOS                                                              */
/* ================================================================== */
export const uploadVideo = asyncHandler(async (req, res) => {
  const cid = Number.parseInt(req.params.candidate_id, 10);
  if (!Number.isFinite(cid) || cid <= 0) return res.status(400).json({ detail: "Invalid candidate id" });

  const body = req.body;
  if (!Buffer.isBuffer(body) || !body.length) return res.status(400).json({ detail: "Empty video body" });
  if (body.length > MAX_VIDEO_BYTES) return res.status(413).json({ detail: "Video too large (max 500MB)" });

  const mime = String(req.query.mime || req.headers["content-type"] || "video/webm").split(";")[0].trim();
  const duration = Number.parseInt(Number.parseFloat(req.query.duration || 0), 10) || 0;
  const name = String(req.query.name || "").slice(0, 120);

  const ext = extFor(mime);
  const filename = `candidate_${cid}.${ext}`;
  const filepath = path.join(VIDEO_DIR, filename);
  const tmp = `${filepath}.${crypto.randomBytes(4).toString("hex")}.tmp`;
  await fs.promises.writeFile(tmp, body);
  await fs.promises.rename(tmp, filepath);
  for (const other of Object.values(MIME_EXT)) {
    if (other !== ext) fs.promises.unlink(path.join(VIDEO_DIR, `candidate_${cid}.${other}`)).catch(() => {});
  }

  await db.query(
    `INSERT INTO robo_videos (candidate_id, candidate_name, file, mime, duration, size, uploaded_at)
     VALUES (?, ?, ?, ?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE candidate_name=VALUES(candidate_name), file=VALUES(file), mime=VALUES(mime),
       duration=VALUES(duration), size=VALUES(size), uploaded_at=NOW()`,
    [cid, name, filename, mime, duration, body.length],
  );

  res.json({ ok: true, candidate_id: cid, size: body.length, duration, url: `/api/hr-robo/api/videos/${cid}` });
});

export const listVideos = asyncHandler(async (_req, res) => {
  res.json({ videos: await videosIndex() });
});

export const streamVideo = asyncHandler(async (req, res) => {
  const cid = Number.parseInt(req.params.candidate_id, 10);
  const [[meta]] = await db.query("SELECT file, mime FROM robo_videos WHERE candidate_id = ?", [cid]);
  if (!meta) return res.status(404).json({ detail: "No recording for this candidate" });
  const fname = meta.file || "";
  if (!fname || path.basename(fname) !== fname || !/^[\w.-]+$/.test(fname))
    return res.status(404).json({ detail: "Recording not found" });
  const filepath = path.join(VIDEO_DIR, fname);
  if (!fs.existsSync(filepath)) return res.status(404).json({ detail: "Recording file missing" });

  const size = fs.statSync(filepath).size;
  const mime = meta.mime || "video/webm";
  const range = req.headers.range;
  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", mime);

  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range.trim());
    if (m && (m[1] || m[2])) {
      let start;
      let end;
      if (m[1]) {
        start = Number.parseInt(m[1], 10);
        end = m[2] ? Number.parseInt(m[2], 10) : size - 1;
      } else {
        start = Math.max(0, size - Number.parseInt(m[2], 10));
        end = size - 1;
      }
      end = Math.min(end, size - 1);
      if (start > end || start >= size) {
        res.setHeader("Content-Range", `bytes */${size}`);
        return res.status(416).end();
      }
      res.status(206);
      res.setHeader("Content-Range", `bytes ${start}-${end}/${size}`);
      res.setHeader("Content-Length", end - start + 1);
      return fs.createReadStream(filepath, { start, end }).pipe(res);
    }
  }
  res.setHeader("Content-Length", size);
  fs.createReadStream(filepath).pipe(res);
});

/* ================================================================== */
/* GROQ - chat + Whisper STT                                           */
/* ================================================================== */
function cleanMessages(msgs) {
  const out = [];
  let last = null;
  for (const m of msgs || []) {
    const role = m?.role;
    const content = String(m?.content ?? "").trim();
    if (!content || !["user", "assistant"].includes(role) || role === last) continue;
    out.push({ role, content });
    last = role;
  }
  if (out.length && out[0].role !== "user") out.shift();
  return out;
}

export const interviewChat = asyncHandler(async (req, res) => {
  const key = groqKey();
  if (!key)
    return res.status(500).json({ detail: "GROQ_API_KEY missing in backend .env. Get a free key from https://console.groq.com" });
  const messages = req.body?.messages || [];
  if (!messages.length) return res.status(400).json({ detail: "messages required" });

  const payload = {
    model: process.env.GROQ_CHAT_MODEL || "llama-3.3-70b-versatile",
    messages: [{ role: "system", content: req.body?.system || "You are an AI interview robot." }, ...cleanMessages(messages)],
    max_tokens: 800,
    temperature: 0.8,
  };
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30000),
  });
  const text = await r.text();
  if (!r.ok) return res.status(500).json({ detail: `Groq ${r.status}: ${text.slice(0, 300)}` });
  const reply = JSON.parse(text)?.choices?.[0]?.message?.content ?? "";
  res.json({ reply, success: true });
});

export const testGroq = asyncHandler(async (_req, res) => {
  const key = groqKey();
  if (!key) return res.json({ status: "GROQ_API_KEY not found in backend .env" });
  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: "Say: Groq working!" }],
        max_tokens: 20,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (r.ok) return res.json({ status: "Groq working!", reply: (await r.json()).choices[0].message.content });
    res.json({ status: `Error ${r.status}`, detail: (await r.text()).slice(0, 300) });
  } catch (e) {
    res.json({ status: String(e.message) });
  }
});

/* multer memory upload -> req.file */
export const speechToText = asyncHandler(async (req, res) => {
  const key = groqKey();
  if (!key) return res.status(503).json({ detail: "GROQ_API_KEY missing - using browser transcript" });
  const f = req.file;
  if (!f || !f.buffer || f.buffer.length < 1000) return res.status(400).json({ detail: "audio too short" });
  if (f.buffer.length > 24 * 1024 * 1024) return res.status(413).json({ detail: "audio too large" });

  const lang = String(req.body?.lang || "en");
  const form = new FormData();
  form.append("file", new Blob([f.buffer], { type: f.mimetype || "audio/webm" }), f.originalname || "answer.webm");
  form.append("model", "whisper-large-v3");
  form.append("response_format", "json");
  form.append("temperature", "0");
  form.append("prompt", "Job interview answer by an Indian candidate. May mix English and Hindi (Hinglish).");
  form.append("language", lang.startsWith("hi") ? "hi" : "en");

  try {
    const r = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: form,
      signal: AbortSignal.timeout(60000),
    });
    if (!r.ok) return res.status(502).json({ detail: `whisper error ${r.status}: ${(await r.text()).slice(0, 120)}` });
    const text = String((await r.json()).text || "").trim();
    if (!text) return res.status(502).json({ detail: "empty transcript" });
    res.json({ text, engine: "whisper-large-v3" });
  } catch (e) {
    res.status(503).json({ detail: `stt unavailable: ${String(e.message).slice(0, 120)}` });
  }
});

/* ================================================================== */
/* TTS - Microsoft Edge neural voices (msedge-tts)                     */
/* ================================================================== */
const TTS_CACHE = new Map();
const TTS_CACHE_MAX = 60;

async function edgeTts(text, voice) {
  const { MsEdgeTTS, OUTPUT_FORMAT } = await import("msedge-tts");
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  const result = tts.toStream(text, { rate: "-6%", pitch: "-2Hz" });
  const stream = result?.audioStream || result;
  const chunks = [];
  await new Promise((resolve, reject) => {
    stream.on("data", (c) => chunks.push(c));
    stream.on("end", resolve);
    stream.on("close", resolve);
    stream.on("error", reject);
  });
  try {
    tts.close?.();
  } catch {
    /* ignore */
  }
  return Buffer.concat(chunks);
}

export const textToSpeech = asyncHandler(async (req, res) => {
  let text = String(req.body?.text || "").trim();
  if (!text) return res.status(400).json({ detail: "text required" });
  text = text.slice(0, 1200);
  const lang = String(req.body?.lang || "en").toLowerCase();
  const voice = lang.startsWith("hi") ? "hi-IN-SwaraNeural" : "en-IN-NeerjaNeural";
  const key = crypto.createHash("sha256").update(`${voice}|${text}`).digest("hex");

  if (TTS_CACHE.has(key)) {
    res.setHeader("Content-Type", "audio/mpeg");
    return res.send(TTS_CACHE.get(key));
  }
  try {
    const audio = await edgeTts(text, voice);
    if (!audio.length) throw new Error("empty audio from edge-tts");
    if (TTS_CACHE.size >= TTS_CACHE_MAX) TTS_CACHE.delete(TTS_CACHE.keys().next().value);
    TTS_CACHE.set(key, audio);
    res.setHeader("Content-Type", "audio/mpeg");
    res.send(audio);
  } catch (e) {
    res.status(503).json({ detail: `tts unavailable: ${String(e.message).slice(0, 150)}` });
  }
});

/* ================================================================== */
/* HEALTH                                                              */
/* ================================================================== */
export const health = asyncHandler(async (_req, res) => {
  let database = "ok";
  try {
    await db.query("SELECT 1");
  } catch (e) {
    database = `error: ${e.message}`;
  }
  res.json({ status: "healthy", system: "Ardhnarishvar HR (Node)", database, timestamp: new Date().toISOString() });
});
