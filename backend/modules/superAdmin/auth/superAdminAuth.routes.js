import express from "express";
import { protect } from "../../../middleware/auth.middleware.js";
import {
  loginSuperAdmin,
  loginManager,
  loginTL,
  verifySuperAdminOtp,
  get2FA,
  toggle2FA,
  listSessions,
  revokeSession,
  revokeOtherSessions,
  getOtpSettings,
  updateOtpSettings,
  changePassword,
} from "./superAdminAuth.controller.js";

const router = express.Router();

router.post("/login", loginSuperAdmin);
router.post("/verify-otp", verifySuperAdminOtp);
router.post("/change-password", protect(["SUPER_ADMIN"]), changePassword);
router.get("/2fa", protect(["SUPER_ADMIN"]), get2FA);
router.put("/2fa", protect(["SUPER_ADMIN"]), toggle2FA);

/* OTP channel (EMAIL / SMS) settings */
router.get("/otp-settings", protect(["SUPER_ADMIN"]), getOtpSettings);
router.put("/otp-settings", protect(["SUPER_ADMIN"]), updateOtpSettings);

/* Device / session management */
router.get("/sessions", protect(["SUPER_ADMIN"]), listSessions);
router.delete("/sessions/others", protect(["SUPER_ADMIN"]), revokeOtherSessions);
router.delete("/sessions/:id", protect(["SUPER_ADMIN"]), revokeSession);

router.post("/login-manager", loginManager);
router.post("/login-tl", loginTL);
export default router;
