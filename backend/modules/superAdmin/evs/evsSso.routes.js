import express from "express";
import crypto from "crypto";
import { protect } from "../../../middleware/auth.middleware.js";

const router = express.Router();

// Shared secret with the EVS FastAPI backend (HRMS_SSO_KEY there).
// Keep this on the server only - it must NEVER be shipped to the browser.
const EVS_SSO_KEY = process.env.EVS_SSO_KEY || "hrms-evs-sso-2026";
// EVS React portal URL (dev: vite pinned to 5180; 5177 is the IT portal!)
const EVS_APP_URL = (
  process.env.EVS_APP_URL ||
  process.env.EVS_FRONTEND_URL ||
  "http://localhost:5180"
).replace(/\/$/, "");

// Fail loudly on misconfiguration instead of silently minting broken links.
if (!process.env.EVS_SSO_KEY) {
  console.warn(
    "[EVS SSO] EVS_SSO_KEY env var is not set - falling back to the dev default. " +
      "In production, set EVS_SSO_KEY to the same value as the EVS backend's HRMS_SSO_KEY, " +
      "otherwise SSO links will be rejected with 403."
  );
}
if (!process.env.EVS_APP_URL && !process.env.EVS_FRONTEND_URL) {
  console.warn(
    "[EVS SSO] EVS_APP_URL env var is not set - falling back to http://localhost:5180. " +
      "Set it to the deployed EVS frontend URL in production."
  );
}

/**
 * GET /api/super-admin/evs/sso-url
 *
 * Mints a short-lived signed SSO URL for the Employee Verification portal.
 * The EVS backend validates: sig = HMAC-SHA256(key, `${email}.${ts}`)
 * and rejects links older than its SSO_MAX_AGE_SECONDS window.
 */
router.get("/sso-url", protect(["SUPER_ADMIN"]), (req, res) => {
  const email = req.user?.email || "admin@hrms.com";
  const name = req.user?.name || "Super Admin";
  const ts = String(Math.floor(Date.now() / 1000));

  const sig = crypto
    .createHmac("sha256", EVS_SSO_KEY)
    .update(`${email}.${ts}`)
    .digest("hex");

  const params = new URLSearchParams({ sso: "1", email, ts, sig, name });

  res.json({
    success: true,
    url: `${EVS_APP_URL}/?${params.toString()}`,
    expiresInSeconds: 120,
  });
});

export default router;
