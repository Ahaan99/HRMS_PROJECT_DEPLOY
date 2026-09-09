import express from "express";
import { loginClientAdmin } from "./clientAuth.controller.js";
import { clientAuthMiddleware } from "../../../middleware/clientAuth.middleware.js";
import { db } from "../../../config/db.js";
const router = express.Router();

// POST /api/client/auth/login-admin
router.post("/login-admin", loginClientAdmin);

// GET /api/client/auth/features - live enabled features (Master Control)
router.get("/features", clientAuthMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT feature_key FROM client_features WHERE client_id = ? AND is_enabled = 1`,
      [req.client.id],
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