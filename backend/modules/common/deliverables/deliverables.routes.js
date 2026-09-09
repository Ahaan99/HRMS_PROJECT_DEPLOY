import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { hrAuthMiddleware } from "../../../middleware/hrAuth.middleware.js";
import {
  listDeliverables,
  createDeliverable,
  deleteDeliverable,
} from "./deliverables.controller.js";

const router = express.Router();

/* ---------- upload rules per deliverable type ---------- */
const TYPE_RULES = {
  video: {
    exts: [".mp4", ".webm", ".mkv", ".avi", ".mov"],
    maxBytes: 500 * 1024 * 1024,
    label: "Video (MP4/WEBM/MKV/AVI/MOV, max 500MB)",
  },
  project_report: {
    exts: [".pdf", ".doc", ".docx"],
    maxBytes: 200 * 1024 * 1024,
    label: "Project Report (PDF/DOC/DOCX, max 200MB)",
  },
  source_code: {
    exts: [".zip", ".rar", ".7z"],
    maxBytes: 500 * 1024 * 1024,
    label: "Source code (ZIP/RAR/7Z, max 500MB)",
  },
};

const DEST = "uploads/deliverables";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(DEST, { recursive: true });
    cb(null, DEST);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname).toLowerCase());
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const rule = TYPE_RULES[req.body.type];
    if (!rule) {
      return cb(new Error("Invalid or missing deliverable type"));
    }
    const ext = path.extname(file.originalname).toLowerCase();
    if (!rule.exts.includes(ext)) {
      return cb(new Error(`Invalid file for this type. Expected ${rule.label}`));
    }
    cb(null, true);
  },
});

/* enforce per-type size limit after multer stores the file */
const validateSize = (req, res, next) => {
  const rule = TYPE_RULES[req.body.type];
  if (rule && req.file && req.file.size > rule.maxBytes) {
    try {
      fs.unlinkSync(req.file.path);
    } catch {}
    return res.status(400).json({
      success: false,
      message: `File too large. ${rule.label}`,
    });
  }
  next();
};

const uploadErrors = (err, req, res, next) => {
  if (err) {
    return res
      .status(400)
      .json({ success: false, message: err.message || "Upload failed" });
  }
  next();
};

router.get("/", hrAuthMiddleware, listDeliverables);
router.post(
  "/",
  hrAuthMiddleware,
  upload.single("file"),
  uploadErrors,
  validateSize,
  createDeliverable,
);
router.delete("/:id", hrAuthMiddleware, deleteDeliverable);

export default router;
