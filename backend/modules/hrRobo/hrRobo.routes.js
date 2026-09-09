/**
 * HR Robo (AI Interview) routes - mounted at /api/hr-robo in app.js.
 *
 * Path layout mirrors the old FastAPI service exactly, so the HR / Super Admin
 * React portals (VITE_AI_ROBO_URL = <backend>/api/hr-robo) and the static
 * interview UI keep working without changes:
 *
 *   GET  /                              -> interview UI (modules/hrRobo/ui)
 *   GET  /health
 *   POST /api/v1/auth/login             (public)  HRMS Super Admin / HR / legacy
 *   GET  /api/v1/auth/me                (protected)
 *   POST /api/v1/interviews/chat        (public - candidate browser, Groq)
 *   POST /api/v1/tts                    (public - candidate browser)
 *   POST /api/v1/stt                    (public - candidate browser, Whisper)
 *   GET  /api/v1/test-groq
 *   POST /api/integration/sync          (public - pushed by interview UI)
 *   GET  /api/integration/summary|reports|proctor-logs  (protected)
 *   GET  /api/integration/health
 *   POST /api/videos/upload/:candidate_id  (public - raw video body)
 *   GET  /api/videos                    (protected)
 *   GET  /api/videos/:candidate_id      (stream, Range supported)
 */
import express from "express";
import path from "path";
import multer from "multer";

import { protect } from "../../middleware/auth.middleware.js";
import * as c from "./hrRobo.controller.js";

const router = express.Router();
const UI_DIR = path.join(process.cwd(), "modules", "hrRobo", "ui");

/* audio for STT arrives as multipart "audio" field -> memory */
const audioUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });
/* raw video body (Content-Type: video/*) up to 500 MB */
const rawVideo = express.raw({ type: () => true, limit: "500mb" });

/* ------------------------------------------------------------------ */
/* health                                                              */
/* ------------------------------------------------------------------ */
router.get("/health", c.health);
router.get("/api/health", c.health);
router.get("/api/integration/health", c.integrationHealth);

/* ------------------------------------------------------------------ */
/* auth                                                                */
/* ------------------------------------------------------------------ */
router.post("/api/v1/auth/login", express.urlencoded({ extended: true }), c.roboLogin);
router.get("/api/v1/auth/me", protect(c.ROBO_ROLES), c.roboMe);

/* ------------------------------------------------------------------ */
/* candidate-side (public - the interview UI has no HRMS session)      */
/* ------------------------------------------------------------------ */
router.post("/api/v1/interviews/chat", c.interviewChat);
router.post("/api/v1/tts", c.textToSpeech);
router.post("/api/v1/stt", audioUpload.single("audio"), c.speechToText);
router.get("/api/v1/test-groq", c.testGroq);
router.post("/api/integration/sync", c.syncSnapshot);
router.post("/api/videos/upload/:candidate_id", rawVideo, c.uploadVideo);
router.get("/api/videos/:candidate_id", c.streamVideo);

/* ------------------------------------------------------------------ */
/* shared UI store - single dataset for every browser / laptop          */
/*   GET /api/store        (public)  full dataset                       */
/*   PUT /api/store/:key   candidate keys public, admin keys need JWT   */
/*   candidates carry base64 resumes, so allow a large JSON body        */
/* ------------------------------------------------------------------ */
const storeJson = express.json({ limit: "60mb" });
const storeGuard = (req, res, next) =>
  c.UI_ADMIN_KEYS.includes(req.params.key) ? protect(c.ROBO_ROLES)(req, res, next) : next();
router.get("/api/store", c.uiStoreGetAll);
router.put("/api/store/:key", storeGuard, storeJson, c.uiStorePut);

/* ------------------------------------------------------------------ */
/* HR / Super Admin read side (protected with the HRMS JWT)            */
/* ------------------------------------------------------------------ */
router.get("/api/integration/summary", protect(c.ROBO_ROLES), c.summary);
router.get("/api/integration/reports", protect(c.ROBO_ROLES), c.reports);
router.get("/api/integration/proctor-logs", protect(c.ROBO_ROLES), c.proctorLogs);
router.get("/api/videos", protect(c.ROBO_ROLES), c.listVideos);

/* ------------------------------------------------------------------ */
/* static interview UI                                                 */
/* ------------------------------------------------------------------ */
/* /api/hr-robo -> /api/hr-robo/  (UI uses relative asset paths) */
router.get("/", (req, res, next) => {
  const [p, q] = req.originalUrl.split("?");
  if (!p.endsWith("/")) return res.redirect(301, `${p}/${q ? `?${q}` : ""}`);
  next();
});
router.use(express.static(UI_DIR, { index: "index.html", fallthrough: true }));
router.get("/", (_req, res) => res.sendFile(path.join(UI_DIR, "index.html")));

/* multer / body errors -> JSON (FastAPI style { detail }) */
router.use((err, _req, res, _next) => {
  const status = err instanceof multer.MulterError ? 400 : err.status || 500;
  res.status(status).json({ detail: err.message || "HR Robo request failed" });
});

export default router;
