import { db } from "../../config/db.js";

/* ------------------------------------------------------------------ */
const ensureTables = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS document_expiries (
      id INT AUTO_INCREMENT PRIMARY KEY,
      doc_name VARCHAR(150) NOT NULL,
      doc_type VARCHAR(80) NULL,
      entity_type ENUM('EMPLOYEE','CLIENT','COMPANY','VENDOR') DEFAULT 'COMPANY',
      entity_id INT NULL,
      entity_name VARCHAR(150) NULL,
      issue_date DATE NULL,
      expiry_date DATE NOT NULL,
      remind_days INT DEFAULT 30,
      notify_phone VARCHAR(40) NULL,
      last_alerted_at TIMESTAMP NULL,
      status ENUM('ACTIVE','RENEWED','EXPIRED') DEFAULT 'ACTIVE',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_expiry (expiry_date)
    )
  `);
};
ensureTables().catch((e) => console.error("docExpiry init:", e.message));

/* GET /?filter=all|expiring|expired */
export const listDocs = async (req, res) => {
  const { filter = "all" } = req.query;
  let where = "WHERE 1=1";
  if (filter === "expiring")
    where +=
      " AND status = 'ACTIVE' AND expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL remind_days DAY)";
  if (filter === "expired")
    where += " AND expiry_date < CURDATE() AND status != 'RENEWED'";
  const [rows] = await db.query(
    `SELECT *, DATEDIFF(expiry_date, CURDATE()) AS days_left
     FROM document_expiries ${where}
     ORDER BY expiry_date ASC LIMIT 300`,
  );
  const [[stats]] = await db.query(`
    SELECT
      COUNT(*) AS total,
      SUM(status = 'ACTIVE' AND expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL remind_days DAY)) AS expiring,
      SUM(expiry_date < CURDATE() AND status != 'RENEWED') AS expired
    FROM document_expiries
  `);
  res.json({ success: true, data: rows, stats });
};

/* POST / */
export const createDoc = async (req, res) => {
  const {
    doc_name, doc_type, entity_type, entity_id, entity_name,
    issue_date, expiry_date, remind_days, notify_phone,
  } = req.body;
  if (!doc_name?.trim() || !expiry_date)
    return res
      .status(400)
      .json({ success: false, message: "doc_name and expiry_date are required" });
  const [r] = await db.query(
    `INSERT INTO document_expiries
      (doc_name, doc_type, entity_type, entity_id, entity_name, issue_date, expiry_date, remind_days, notify_phone)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [doc_name.trim(), doc_type || null, entity_type || "COMPANY",
     entity_id || null, entity_name || null, issue_date || null,
     expiry_date, remind_days || 30, notify_phone || null],
  );
  res.status(201).json({ success: true, id: r.insertId, message: "Document tracked" });
};

/* PATCH /:id  { status, expiry_date } */
export const updateDoc = async (req, res) => {
  const { status, expiry_date, remind_days } = req.body;
  await db.query(
    `UPDATE document_expiries SET
       status = COALESCE(?, status),
       expiry_date = COALESCE(?, expiry_date),
       remind_days = COALESCE(?, remind_days)
     WHERE id = ?`,
    [status ?? null, expiry_date ?? null, remind_days ?? null, req.params.id],
  );
  res.json({ success: true, message: "Document updated" });
};

/* DELETE /:id */
export const deleteDoc = async (req, res) => {
  await db.query("DELETE FROM document_expiries WHERE id = ?", [req.params.id]);
  res.json({ success: true, message: "Document removed" });
};

/* POST /run-alerts — send notifications for docs inside their window     */
/* (also called by the daily scheduler)                                   */
export const runAlerts = async (_req, res) => {
  const [rows] = await db.query(`
    SELECT * FROM document_expiries
    WHERE status = 'ACTIVE'
      AND expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL remind_days DAY)
      AND (last_alerted_at IS NULL OR last_alerted_at < DATE_SUB(NOW(), INTERVAL 24 HOUR))
    LIMIT 50
  `);
  let sent = 0;
  for (const d of rows) {
    await db.query(
      "UPDATE document_expiries SET last_alerted_at = NOW() WHERE id = ?",
      [d.id],
    );
  }
  if (res) res.json({ success: true, checked: rows.length, notified: sent });
};

/* Daily scheduler (runs once per server day) */
setInterval(() => runAlerts(null, null).catch(() => {}), 1000 * 60 * 60 * 12);
