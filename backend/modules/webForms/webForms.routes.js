import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import {
  submitForm,
  listSubmissions,
  updateStatus,
  convertToCandidate,
  listKeys,
  createKey,
  revokeKey,
} from "./webForms.controller.js";

const router = express.Router();

/* Public: external websites POST here with X-API-Key */
router.post("/submit", submitForm);

/* Admin inbox */
router.get("/submissions", protect(["SUPER_ADMIN", "MANAGER", "hr"]), listSubmissions);
router.patch("/submissions/:id/status", protect(["SUPER_ADMIN", "MANAGER", "hr"]), updateStatus);
router.post("/submissions/:id/convert", protect(["SUPER_ADMIN", "MANAGER", "hr"]), convertToCandidate);

/* API key management */
router.get("/keys", protect(["SUPER_ADMIN"]), listKeys);
router.post("/keys", protect(["SUPER_ADMIN"]), createKey);
router.delete("/keys/:id", protect(["SUPER_ADMIN"]), revokeKey);

export default router;
