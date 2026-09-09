import express from "express";
import { protect } from "../../../middleware/auth.middleware.js";
import {
  getStats,
  getLoginLogs,
  clearLoginLogs,
  listPortals,
  togglePortal,
  listAllSessions,
  revokeAnySession,
} from "./security.controller.js";

const router = express.Router();

router.use(protect(["SUPER_ADMIN"]));

/* Security dashboard stats */
router.get("/stats", getStats);

/* Login logs */
router.get("/login-logs", getLoginLogs);
router.delete("/login-logs", clearLoginLogs);

/* Portal master control */
router.get("/portals", listPortals);
router.put("/portals/:id", togglePortal);

/* Global device sessions */
router.get("/sessions", listAllSessions);
router.put("/sessions/:id/revoke", revokeAnySession);

export default router;
