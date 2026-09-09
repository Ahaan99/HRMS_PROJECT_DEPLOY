import express from "express";
import {
  triggerEmergency,
  listEmergencies,
  emergencySummary,
  resolveEmergency,
} from "./emergency.controller.js";
import { protect } from "../../../middleware/auth.middleware.js";

const router = express.Router();

// Role strings are case-sensitive and mixed-case across portals (see each *Auth.controller):
// SUPER_ADMIN / MANAGER / TL (admin), "hr", "it", "sales", "EMPLOYEE", "client_admin".
const TRIGGER_ROLES = ["SUPER_ADMIN", "MANAGER", "TL", "hr", "it", "sales", "EMPLOYEE", "client_admin"];
const RESPONDER_ROLES = ["SUPER_ADMIN", "MANAGER", "hr"];

router.post("/", protect(TRIGGER_ROLES), triggerEmergency);

router.get("/", protect(RESPONDER_ROLES), listEmergencies);
router.get("/summary", protect(RESPONDER_ROLES), emergencySummary);
router.patch("/:id/resolve", protect(RESPONDER_ROLES), resolveEmergency);

export default router;
