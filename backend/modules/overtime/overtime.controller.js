import { db } from "../../config/db.js";

/* ------------------------------------------------------------------ */
/* Ensure table (runs once at import)                                  */
/* ------------------------------------------------------------------ */
const ensureTables = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS overtime_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      employee_id INT NOT NULL,
      ot_date DATE NOT NULL,
      hours DECIMAL(4,2) NOT NULL,
      reason VARCHAR(500) DEFAULT NULL,
      status ENUM('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
      decided_by VARCHAR(100) DEFAULT NULL,
      decided_at DATETIME DEFAULT NULL,
      remarks VARCHAR(500) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_ot_employee (employee_id),
      INDEX idx_ot_status (status),
      INDEX idx_ot_date (ot_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
};
ensureTables().catch((e) => console.error("overtime ensureTables:", e.message));

/* ------------------------------------------------------------------ */
/* Employee self-service                                               */
/* ------------------------------------------------------------------ */

// POST /api/overtime/apply
export const applyOvertime = async (req, res) => {
  try {
    const { ot_date, hours, reason } = req.body;
    const h = Number(hours);

    if (!ot_date || !hours) {
      return res.status(400).json({ success: false, message: "ot_date and hours are required" });
    }
    if (!Number.isFinite(h) || h <= 0 || h > 16) {
      return res.status(400).json({ success: false, message: "hours must be between 0 and 16" });
    }

    // Prevent duplicate pending/approved request for the same date
    const [dupes] = await db.query(
      `SELECT id FROM overtime_requests
       WHERE employee_id = ? AND ot_date = ? AND status IN ('Pending','Approved')`,
      [req.user.id, ot_date]
    );
    if (dupes.length) {
      return res.status(409).json({
        success: false,
        message: "An overtime request for this date already exists",
      });
    }

    const [r] = await db.query(
      `INSERT INTO overtime_requests (employee_id, ot_date, hours, reason)
       VALUES (?, ?, ?, ?)`,
      [req.user.id, ot_date, h, reason || null]
    );

    res.status(201).json({ success: true, data: { id: r.insertId } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// GET /api/overtime/my
export const myOvertime = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, DATE_FORMAT(ot_date, '%Y-%m-%d') AS ot_date, hours, reason,
              status, decided_by, decided_at, remarks, created_at
       FROM overtime_requests
       WHERE employee_id = ?
       ORDER BY ot_date DESC, id DESC`,
      [req.user.id]
    );

    const [[totals]] = await db.query(
      `SELECT
         COALESCE(SUM(CASE WHEN status = 'Approved' THEN hours END), 0) AS approvedHours,
         COALESCE(SUM(CASE WHEN status = 'Pending' THEN hours END), 0) AS pendingHours
       FROM overtime_requests WHERE employee_id = ?`,
      [req.user.id]
    );

    res.json({ success: true, data: { requests: rows, totals } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// PUT /api/overtime/cancel/:id  (only own + Pending)
export const cancelMyOvertime = async (req, res) => {
  try {
    const [r] = await db.query(
      `DELETE FROM overtime_requests
       WHERE id = ? AND employee_id = ? AND status = 'Pending'`,
      [req.params.id, req.user.id]
    );
    if (!r.affectedRows) {
      return res.status(404).json({ success: false, message: "Pending request not found" });
    }
    res.json({ success: true, message: "Overtime request cancelled" });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

/* ------------------------------------------------------------------ */
/* Admin / Manager / TL                                                */
/* ------------------------------------------------------------------ */

// GET /api/overtime/all?status=Pending
export const allOvertime = async (req, res) => {
  try {
    const { status } = req.query;
    const params = [];
    let where = "";
    if (status && ["Pending", "Approved", "Rejected"].includes(status)) {
      where = "WHERE o.status = ?";
      params.push(status);
    }

    const [rows] = await db.query(
      `SELECT o.id, o.employee_id, e.name AS employee_name, d.name AS department,
              DATE_FORMAT(o.ot_date, '%Y-%m-%d') AS ot_date, o.hours, o.reason,
              o.status, o.decided_by, o.decided_at, o.remarks, o.created_at
       FROM overtime_requests o
       LEFT JOIN employees e ON e.id = o.employee_id
       LEFT JOIN departments d ON d.id = e.departmentId
       ${where}
       ORDER BY o.status = 'Pending' DESC, o.ot_date DESC, o.id DESC
       LIMIT 200`,
      params
    );

    const [[totals]] = await db.query(
      `SELECT
         COUNT(*) AS total,
         SUM(status = 'Pending') AS pending,
         SUM(status = 'Approved') AS approved,
         SUM(status = 'Rejected') AS rejected,
         COALESCE(SUM(CASE WHEN status = 'Approved' THEN hours END), 0) AS approvedHours
       FROM overtime_requests`
    );

    res.json({ success: true, data: { requests: rows, totals } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// PUT /api/overtime/:id/decide  { status: 'Approved'|'Rejected', remarks }
export const decideOvertime = async (req, res) => {
  try {
    const { status, remarks } = req.body;
    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "status must be Approved or Rejected" });
    }

    const [r] = await db.query(
      `UPDATE overtime_requests
       SET status = ?, remarks = ?, decided_by = ?, decided_at = NOW()
       WHERE id = ? AND status = 'Pending'`,
      [status, remarks || null, req.user.name || req.user.role || "Admin", req.params.id]
    );
    if (!r.affectedRows) {
      return res.status(404).json({ success: false, message: "Pending request not found" });
    }
    res.json({ success: true, message: `Overtime ${status.toLowerCase()}` });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
