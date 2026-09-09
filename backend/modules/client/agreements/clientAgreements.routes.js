import express from "express";
import { db } from "../../../config/db.js";
import { clientAuthMiddleware } from "../../../middleware/clientAuth.middleware.js";

const router = express.Router();
router.use(clientAuthMiddleware);

/** Agreements that belong to the logged-in client (scoped by client_id from the token). */
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, agreement_title, agreement_type, agreement_number, start_date, expiry_date,
              agreement_pdf, status, remarks, created_at
         FROM client_agreements
        WHERE client_id = ?
        ORDER BY created_at DESC`,
      [req.client.id],
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

export default router;
