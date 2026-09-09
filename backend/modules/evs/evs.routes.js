/**
 * Employee Verification System routes - mounted at /api/evs in app.js.
 *
 * Public:     POST /login, POST /sso-login, GET /verify-token/:token
 * Protected:  everything else (Super Admin, HR, Client roles)
 */
import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import crypto from "crypto";

import { protect } from "../../middleware/auth.middleware.js";
import { evsLogin, evsSsoLogin, evsMe, EVS_ROLES } from "./evs.auth.controller.js";
import * as c from "./evs.controller.js";

const router = express.Router();

/* ------------------------------------------------------------------ */
/* Sanitised upload storage: uploads/evs/<timestamp>-<random>.<ext>    */
/* (fixes path-traversal + overwrite bugs of the old backend)          */
/* ------------------------------------------------------------------ */
const UPLOAD_DIR = path.join(process.cwd(), "uploads", "evs");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_EXT = new Set([".pdf", ".png", ".jpg", ".jpeg", ".webp", ".doc", ".docx"]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    if (!ALLOWED_EXT.has(ext)) {
      return cb(new Error("Only PDF, image and Word files are allowed"));
    }
    cb(null, true);
  },
});

/* multipart login form (the EVS UI posts FormData to /login) */
const formFields = multer().none();

/* ------------------------------------------------------------------ */
/* Public                                                              */
/* ------------------------------------------------------------------ */
router.post("/login", formFields, evsLogin);
router.post("/sso-login", evsSsoLogin);
router.get("/verify-token/:token", c.verifyToken);

/* ------------------------------------------------------------------ */
/* Protected                                                           */
/* ------------------------------------------------------------------ */
router.use(protect(EVS_ROLES));

router.get("/me", evsMe);

/* employees */
router.post("/add-employee", c.addEmployee);
router.get("/employees", c.getEmployees);
router.get("/employee/:id", c.getEmployee);
router.put("/update-employee/:id", c.updateEmployee);
router.delete("/delete-employee/:id", c.deleteEmployee);

/* documents */
router.post("/upload-document", upload.single("file"), c.uploadDocument);
router.get("/documents", c.getDocuments);
router.post("/send-verification-email/:id", c.sendVerificationEmail);

/* dashboard + audit */
router.get("/dashboard", c.dashboard);
router.get("/audit-logs", c.auditLogs);

/* identity */
router.post("/identity/submit", c.submitIdentity);
router.get("/identity/list", c.listIdentity);
router.put("/identity/:id/decide", c.decideIdentity);

/* international */
router.get("/international/countries", c.internationalCountries);
router.post("/international/submit", c.submitInternational);
router.get("/international/list", c.listInternational);
router.put("/international/:id/decide", c.decideInternational);

/* background */
router.post("/background/create", c.createBackground);
router.get("/background/list", c.listBackground);
router.put("/background/:id/update", c.updateBackground);

/* employment history */
router.post("/history/add", c.addHistory);
router.get("/history/list", c.listHistory);
router.put("/history/:id/decide", c.decideHistory);

/* roll-ups */
router.get("/verification-status", c.verificationStatus);
router.get("/reports-summary", c.reportsSummary);

/* HRMS integration (same DB now) */
router.get("/hrms-status", c.hrmsStatus);
router.post("/hrms-sync", c.hrmsSync);
router.get("/hrms-documents", c.hrmsDocuments);

/* ------------------------------------------------------------------ */
/* REST-style aliases used by the EVS React frontend                   */
/* ------------------------------------------------------------------ */
router.put("/employees/:id", c.updateEmployee);
router.delete("/employees/:id", c.deleteEmployee);
router.get("/verify-document/:id", c.verifyDocument);

router.get("/identity-verification", c.listIdentity);
router.post("/identity-verification", c.submitIdentity);
router.put("/identity-verification/:id", c.decideIdentity);

router.get("/international-verification/countries", c.internationalCountries);
router.get("/international-verification", c.listInternational);
router.post("/international-verification", c.submitInternational);
router.put("/international-verification/:id", c.decideInternational);

router.get("/background-verification", c.listBackground);
router.post("/background-verification", c.createBackground);
router.put("/background-verification/:id", c.updateBackground);

router.get("/employment-history", c.listHistory);
router.post("/employment-history", c.addHistory);
router.put("/employment-history/:id", c.decideHistory);

/* multer / validation errors -> JSON instead of HTML stack trace */
router.use((err, _req, res, _next) => {
  const status = err instanceof multer.MulterError ? 400 : err.status || 500;
  res.status(status).json({ detail: err.message || "EVS request failed" });
});

export default router;
