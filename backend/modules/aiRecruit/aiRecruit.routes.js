import express from "express";
import multer from "multer";
import path from "path";
import { protect } from "../../middleware/auth.middleware.js";
import {
  createInterview,
  listInterviews,
  getInterviewByToken,
  submitAnswers,
  screenResume,
  screenResumeUpload,
  listScreenings,
} from "./aiRecruit.controller.js";

const router = express.Router();

const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = [".pdf", ".docx", ".txt", ".md"].includes(
      path.extname(file.originalname).toLowerCase(),
    );
    cb(ok ? null : new Error("Only PDF, DOCX, or TXT resumes are allowed"), ok);
  },
});

/* Admin */
router.post("/interviews", protect(["SUPER_ADMIN", "MANAGER"]), createInterview);
router.get("/interviews", protect(["SUPER_ADMIN", "MANAGER"]), listInterviews);
router.post("/screen-resume", protect(["SUPER_ADMIN", "MANAGER"]), screenResume);
router.post(
  "/screen-resume-upload",
  protect(["SUPER_ADMIN", "MANAGER"]),
  resumeUpload.single("resume"),
  (err, _req, res, next) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    next();
  },
  screenResumeUpload,
);
router.get("/screenings", protect(["SUPER_ADMIN", "MANAGER"]), listScreenings);

/* Public (token-based candidate access) */
router.get("/public/:token", getInterviewByToken);
router.post("/public/:token/answers", submitAnswers);

export default router;
