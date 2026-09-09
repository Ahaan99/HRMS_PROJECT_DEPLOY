import { db } from "../../config/db.js";

/* ------------------------------------------------------------------ */
const ensureTables = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS visitors (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      phone VARCHAR(40) NULL,
      company VARCHAR(150) NULL,
      purpose VARCHAR(255) NOT NULL,
      host_employee_id INT NULL,
      host_name VARCHAR(150) NULL,
      badge_no VARCHAR(20) NULL,
      check_in TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      check_out TIMESTAMP NULL,
      INDEX idx_checkin (check_in)
    )
  `);
};
ensureTables().catch((e) => console.error("visitors init:", e.message));

/* POST /  { name, phone, company, purpose, host_employee_id } */
export const checkIn = async (req, res) => {
  try {
    const { name, phone, company, purpose, host_employee_id } = req.body;
    if (!name?.trim() || !purpose?.trim())
      return res
        .status(400)
        .json({ success: false, message: "name and purpose are required" });

    let hostName = null;
    let hostPhone = null;
    if (host_employee_id) {
      const [[host]] = await db.query(
        "SELECT name, phone FROM employees WHERE id = ?",
        [host_employee_id],
      );
      hostName = host?.name || null;
      hostPhone = host?.phone || null;
    }

    const badge = "V" + String(Date.now()).slice(-6);
    const [r] = await db.query(
      `INSERT INTO visitors (name, phone, company, purpose, host_employee_id, host_name, badge_no)
       VALUES (?,?,?,?,?,?,?)`,
      [name.trim(), phone || null, company || null, purpose.trim(),
       host_employee_id || null, hostName, badge],
    );

    res.status(201).json({
      success: true,
      id: r.insertId,
      badge_no: badge,
      message: "Visitor checked in" + (hostPhone ? " — host notified" : ""),
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

/* PATCH /:id/checkout */
export const checkOut = async (req, res) => {
  const [r] = await db.query(
    "UPDATE visitors SET check_out = NOW() WHERE id = ? AND check_out IS NULL",
    [req.params.id],
  );
  if (!r.affectedRows)
    return res
      .status(404)
      .json({ success: false, message: "Visitor not found or already checked out" });
  res.json({ success: true, message: "Visitor checked out" });
};

/* GET /?scope=today|inside|all&search= */
export const listVisitors = async (req, res) => {
  const { scope = "today", search = "" } = req.query;
  const params = [];
  let where = "WHERE 1=1";
  if (scope === "today") where += " AND DATE(check_in) = CURDATE()";
  if (scope === "inside") where += " AND check_out IS NULL";
  if (search.trim()) {
    where += " AND (name LIKE ? OR company LIKE ? OR host_name LIKE ?)";
    const s = `%${search.trim()}%`;
    params.push(s, s, s);
  }
  const [rows] = await db.query(
    `SELECT * FROM visitors ${where} ORDER BY id DESC LIMIT 200`,
    params,
  );
  const [[stats]] = await db.query(
    `SELECT
       COUNT(*) AS today,
       SUM(check_out IS NULL) AS inside
     FROM visitors WHERE DATE(check_in) = CURDATE()`,
  );
  res.json({ success: true, data: rows, stats });
};
