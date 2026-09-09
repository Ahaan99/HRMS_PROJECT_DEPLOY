import express from "express";
import { loginClientAdmin } from "./clientAuth.controller.js";
import { clientUnifiedAuthMiddleware } from "../../../middleware/clientUnifiedAuth.middleware.js";
import { db } from "../../../config/db.js";
const router = express.Router();

// POST /api/client/auth/login-admin
router.post("/login-admin", loginClientAdmin);

// GET /api/client/auth/features - live enabled features (Master Control)
// Both the client admin and their employees poll this, so Master Control
// toggles reach every open session without a re-login.
router.get("/features", clientUnifiedAuthMiddleware, async (req, res) => {
  try {
    const clientId = req.employee?.client_id ?? req.client?.id;
    if (!clientId) return res.status(401).json({ success: false, message: "Unauthorized" });
    const [rows] = await db.query(
      `SELECT feature_key FROM client_features WHERE client_id = ? AND is_enabled = 1`,
      [clientId],
    );
    return res.json({
      success: true,
      enabledFeatures: rows.map((r) => r.feature_key),
    });
  } catch (err) {
    console.error("client features error:", err);
    return res
      .status(500)
      .json({ success: false, message: `Server error: ${err.message}` });
  }
});

export default router;