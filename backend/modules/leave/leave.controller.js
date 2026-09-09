import { db } from "../../config/db.js";

/* ------------------------------------------------------------------ */
/* Tables + seed (runs once at import)                                 */
/* ------------------------------------------------------------------ */
const ensureTables = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS leave_types (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      annual_quota INT DEFAULT 0,
      is_paid TINYINT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS holidays (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      holiday_date DATE NOT NULL,
      description VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS leave_balances (
      id INT AUTO_INCREMENT PRIMARY KEY,
      employee_id INT NOT NULL,
      leave_type_id INT NOT NULL,
      year INT NOT NULL,
      allocated DECIMAL(5,1) DEFAULT 0,
      used DECIMAL(5,1) DEFAULT 0,
      UNIQUE KEY uq_emp_type_year (employee_id, leave_type_id, year)
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS leave_applications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      employee_id INT NOT NULL,
      leave_type_id INT NOT NULL,
      from_date DATE NOT NULL,
      to_date DATE NOT NULL,
      days DECIMAL(5,1) NOT NULL,
      reason TEXT NULL,
      status ENUM('Pending','Approved','Rejected','Cancelled') DEFAULT 'Pending',
      approver_note VARCHAR(255) NULL,
      approved_by VARCHAR(120) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS comp_offs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      employee_id INT NOT NULL,
      worked_date DATE NOT NULL,
      reason VARCHAR(255) NULL,
      status ENUM('Pending','Approved','Rejected') DEFAULT 'Pending',
      approved_by VARCHAR(120) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed default leave types
  await db.query(`
    INSERT IGNORE INTO leave_types (id, name, annual_quota, is_paid) VALUES
      (1, 'Casual Leave', 12, 1),
      (2, 'Sick Leave', 8, 1),
      (3, 'Earned Leave', 15, 1),
      (4, 'Comp-Off', 0, 1),
      (5, 'Unpaid Leave', 0, 0)
  `);

  // Self-heal the cached used column: rows approved outside decideApplication (seed data,
  // the Team Dashboard path before it ensured a balance row) had drifted from the
  // Applications tab.
  await db.query(`
    UPDATE leave_balances lb
    SET lb.used = COALESCE((
      SELECT SUM(la.days) FROM leave_applications la
      WHERE la.employee_id = lb.employee_id AND la.leave_type_id = lb.leave_type_id
        AND la.status = 'Approved' AND YEAR(la.from_date) = lb.year), 0)
  `);
};

ensureTables().catch((e) => console.error("leave tables init error:", e.message));

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
const currentYear = () => new Date().getFullYear();

// "YYYY-MM-DD" parsed as LOCAL midnight. new Date("YYYY-MM-DD") is UTC midnight, which lands on
// the previous weekday on servers west of UTC and would miscount Sundays.
const localDate = (s) => {
  const [y, m, d] = String(s).slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
};
const isoDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

/* Working days in [from, to]: Sundays and company holidays are not charged */
const businessDays = async (from, to) => {
  const [hols] = await db.query(
    "SELECT holiday_date FROM holidays WHERE holiday_date BETWEEN ? AND ?",
    [from, to]
  );
  const holidaySet = new Set(hols.map((h) => String(h.holiday_date).slice(0, 10)));
  let days = 0;
  for (let d = localDate(from), end = localDate(to); d <= end; d.setDate(d.getDate() + 1)) {
    if (d.getDay() !== 0 && !holidaySet.has(isoDate(d))) days++;
  }
  return days;
};

/* Approved days for one balance row, always derived from leave_applications so the admin
   Balances tab, the employee dashboard and the quota check can never drift from the
   Applications tab (the cached leave_balances.used column is refreshed by syncUsed). */
const USED_SQL = `COALESCE((
  SELECT SUM(la.days) FROM leave_applications la
  WHERE la.employee_id = lb.employee_id AND la.leave_type_id = lb.leave_type_id
    AND la.status = 'Approved' AND YEAR(la.from_date) = lb.year), 0)`;

const PENDING_SQL = `COALESCE((
  SELECT SUM(p.days) FROM leave_applications p
  WHERE p.employee_id = lb.employee_id AND p.leave_type_id = lb.leave_type_id
    AND p.status = 'Pending' AND YEAR(p.from_date) = lb.year), 0)`;

export const ensureBalanceRow = async (employeeId, leaveTypeId, year) => {
  const [[type]] = await db.query(
    "SELECT annual_quota FROM leave_types WHERE id = ?",
    [leaveTypeId]
  );
  await db.query(
    `INSERT IGNORE INTO leave_balances (employee_id, leave_type_id, year, allocated, used)
     VALUES (?, ?, ?, ?, 0)`,
    [employeeId, leaveTypeId, year, type ? type.annual_quota : 0]
  );
};

/* Re-derive the cached used column for one (employee, type, year) after any status change */
export const syncUsed = async (employeeId, leaveTypeId, year) => {
  await ensureBalanceRow(employeeId, leaveTypeId, year);
  await db.query(
    `UPDATE leave_balances lb SET lb.used = ${USED_SQL}
     WHERE lb.employee_id = ? AND lb.leave_type_id = ? AND lb.year = ?`,
    [employeeId, leaveTypeId, year]
  );
};

/* ------------------------------------------------------------------ */
/* LEAVE TYPES (admin)                                                 */
/* ------------------------------------------------------------------ */
export const getLeaveTypes = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM leave_types ORDER BY id");
    res.json(rows);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const addLeaveType = async (req, res) => {
  try {
    const { name, annual_quota, is_paid } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "Name required" });
    const [r] = await db.query(
      "INSERT INTO leave_types (name, annual_quota, is_paid) VALUES (?, ?, ?)",
      [name, Number(annual_quota) || 0, is_paid ? 1 : 0]
    );
    res.json({ success: true, id: r.insertId });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const updateLeaveType = async (req, res) => {
  try {
    const { name, annual_quota, is_paid } = req.body;
    await db.query(
      "UPDATE leave_types SET name = ?, annual_quota = ?, is_paid = ? WHERE id = ?",
      [name, Number(annual_quota) || 0, is_paid ? 1 : 0, req.params.id]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const deleteLeaveType = async (req, res) => {
  try {
    await db.query("DELETE FROM leave_types WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

/* ------------------------------------------------------------------ */
/* HOLIDAYS                                                            */
/* ------------------------------------------------------------------ */
export const getHolidays = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM holidays ORDER BY holiday_date");
    res.json(rows);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const addHoliday = async (req, res) => {
  try {
    const { name, holiday_date, description } = req.body;
    if (!name || !holiday_date)
      return res.status(400).json({ success: false, message: "Name and date required" });
    const [r] = await db.query(
      "INSERT INTO holidays (name, holiday_date, description) VALUES (?, ?, ?)",
      [name, holiday_date, description || null]
    );
    res.json({ success: true, id: r.insertId });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const deleteHoliday = async (req, res) => {
  try {
    await db.query("DELETE FROM holidays WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

/* ------------------------------------------------------------------ */
/* APPLICATIONS — employee self-service                                */
/* ------------------------------------------------------------------ */
export const applyLeave = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { leave_type_id, from_date, to_date, reason } = req.body;
    if (!leave_type_id || !from_date || !to_date)
      return res.status(400).json({ success: false, message: "Type and dates required" });
    if (new Date(to_date) < new Date(from_date))
      return res.status(400).json({ success: false, message: "Invalid date range" });

    const days = await businessDays(from_date, to_date);
    if (days <= 0)
      return res.status(400).json({
        success: false,
        message: "No working days in range (Sundays and holidays are not counted)",
      });

    // One request per date range: a second application overlapping a Pending/Approved one
    // would double-charge the balance once both are approved.
    const [[overlap]] = await db.query(
      `SELECT id, status FROM leave_applications
       WHERE employee_id = ? AND status IN ('Pending','Approved')
         AND from_date <= ? AND to_date >= ?
       LIMIT 1`,
      [employeeId, to_date, from_date]
    );
    if (overlap)
      return res.status(409).json({
        success: false,
        message: `You already have ${
          overlap.status === "Approved" ? "an approved" : "a pending"
        } leave request covering these dates`,
      });

    const year = localDate(from_date).getFullYear();
    await ensureBalanceRow(employeeId, leave_type_id, year);

    const [[bal]] = await db.query(
      `SELECT lb.allocated, ${USED_SQL} AS used, ${PENDING_SQL} AS pending, lt.name, lt.annual_quota
       FROM leave_balances lb JOIN leave_types lt ON lt.id = lb.leave_type_id
       WHERE lb.employee_id = ? AND lb.leave_type_id = ? AND lb.year = ?`,
      [employeeId, leave_type_id, year]
    );

    // Quota check only for types with a quota (unpaid/comp-off can differ).
    // Pending requests are reserved too, so an employee cannot queue more than the quota.
    if (bal && Number(bal.annual_quota) > 0) {
      const pending = Number(bal.pending);
      const remaining = Math.max(0, Number(bal.allocated) - Number(bal.used) - pending);
      if (days > remaining)
        return res.status(400).json({
          success: false,
          message:
            `Insufficient balance: ${remaining} day(s) of ${bal.name} remaining` +
            (pending > 0 ? ` (${pending} day(s) already pending approval)` : ""),
        });
    }

    const [r] = await db.query(
      `INSERT INTO leave_applications (employee_id, leave_type_id, from_date, to_date, days, reason)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [employeeId, leave_type_id, from_date, to_date, days, reason || null]
    );
    res.json({ success: true, id: r.insertId, days });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const myApplications = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT la.*, lt.name AS leave_type
       FROM leave_applications la JOIN leave_types lt ON lt.id = la.leave_type_id
       WHERE la.employee_id = ? ORDER BY la.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const cancelMyApplication = async (req, res) => {
  try {
    const [[app]] = await db.query(
      "SELECT * FROM leave_applications WHERE id = ? AND employee_id = ?",
      [req.params.id, req.user.id]
    );
    if (!app) return res.status(404).json({ success: false, message: "Not found" });
    if (app.status === "Cancelled")
      return res.status(400).json({ success: false, message: "Already cancelled" });

    await db.query("UPDATE leave_applications SET status = 'Cancelled' WHERE id = ?", [app.id]);
    // Cancelling an approved leave gives the days back
    if (app.status === "Approved")
      await syncUsed(app.employee_id, app.leave_type_id, localDate(app.from_date).getFullYear());
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const myBalance = async (req, res) => {
  try {
    const year = Number(req.query.year) || currentYear();
    const [types] = await db.query("SELECT * FROM leave_types ORDER BY id");
    for (const t of types) await ensureBalanceRow(req.user.id, t.id, year);
    const [rows] = await db.query(
      `SELECT lb.id, lb.employee_id, lb.leave_type_id, lb.year, lb.allocated,
              ${USED_SQL} AS used, ${PENDING_SQL} AS pending,
              lt.name AS leave_type, lt.is_paid
       FROM leave_balances lb JOIN leave_types lt ON lt.id = lb.leave_type_id
       WHERE lb.employee_id = ? AND lb.year = ? ORDER BY lb.leave_type_id`,
      [req.user.id, year]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

/* ------------------------------------------------------------------ */
/* APPLICATIONS — admin                                                */
/* ------------------------------------------------------------------ */
export const allApplications = async (req, res) => {
  try {
    const { status } = req.query;
    let sql = `
      SELECT la.*, lt.name AS leave_type, e.name AS employee_name, e.employeeCode
      FROM leave_applications la
      JOIN leave_types lt ON lt.id = la.leave_type_id
      LEFT JOIN employees e ON e.id = la.employee_id`;
    const params = [];
    if (status) {
      sql += " WHERE la.status = ?";
      params.push(status);
    }
    sql += " ORDER BY la.created_at DESC";
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const decideApplication = async (req, res) => {
  try {
    const { status, approver_note } = req.body; // 'Approved' | 'Rejected'
    if (!["Approved", "Rejected"].includes(status))
      return res.status(400).json({ success: false, message: "Invalid status" });

    const [[app]] = await db.query("SELECT * FROM leave_applications WHERE id = ?", [
      req.params.id,
    ]);
    if (!app) return res.status(404).json({ success: false, message: "Not found" });
    if (app.status !== "Pending")
      return res.status(400).json({ success: false, message: `Already ${app.status}` });

    await db.query(
      "UPDATE leave_applications SET status = ?, approver_note = ?, approved_by = ? WHERE id = ?",
      [status, approver_note || null, req.user.name || "Admin", app.id]
    );
    if (status === "Approved")
      await syncUsed(app.employee_id, app.leave_type_id, localDate(app.from_date).getFullYear());
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const allBalances = async (req, res) => {
  try {
    const year = Number(req.query.year) || currentYear();
    const [rows] = await db.query(
      `SELECT lb.id, lb.employee_id, lb.leave_type_id, lb.year, lb.allocated,
              ${USED_SQL} AS used, ${PENDING_SQL} AS pending,
              lt.name AS leave_type, e.name AS employee_name, e.employeeCode
       FROM leave_balances lb
       JOIN leave_types lt ON lt.id = lb.leave_type_id
       LEFT JOIN employees e ON e.id = lb.employee_id
       WHERE lb.year = ? ORDER BY e.name, lb.leave_type_id`,
      [year]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

/* Leave calendar: approved leaves + holidays for a month */
export const leaveCalendar = async (req, res) => {
  try {
    const year = Number(req.query.year) || currentYear();
    const month = Number(req.query.month) || new Date().getMonth() + 1;
    const [leaves] = await db.query(
      `SELECT la.from_date, la.to_date, la.days, lt.name AS leave_type,
              e.name AS employee_name, e.employeeCode
       FROM leave_applications la
       JOIN leave_types lt ON lt.id = la.leave_type_id
       LEFT JOIN employees e ON e.id = la.employee_id
       WHERE la.status = 'Approved'
         AND ((YEAR(la.from_date) = ? AND MONTH(la.from_date) = ?)
           OR (YEAR(la.to_date) = ? AND MONTH(la.to_date) = ?))`,
      [year, month, year, month]
    );
    const [hols] = await db.query(
      "SELECT * FROM holidays WHERE YEAR(holiday_date) = ? AND MONTH(holiday_date) = ?",
      [year, month]
    );
    res.json({ leaves, holidays: hols });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

/* ------------------------------------------------------------------ */
/* COMP-OFF                                                            */
/* ------------------------------------------------------------------ */
export const requestCompOff = async (req, res) => {
  try {
    const { worked_date, reason } = req.body;
    if (!worked_date)
      return res.status(400).json({ success: false, message: "Worked date required" });
    const [r] = await db.query(
      "INSERT INTO comp_offs (employee_id, worked_date, reason) VALUES (?, ?, ?)",
      [req.user.id, worked_date, reason || null]
    );
    res.json({ success: true, id: r.insertId });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const myCompOffs = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM comp_offs WHERE employee_id = ? ORDER BY created_at DESC",
      [req.user.id]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const allCompOffs = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.*, e.name AS employee_name, e.employeeCode
       FROM comp_offs c LEFT JOIN employees e ON e.id = c.employee_id
       ORDER BY c.created_at DESC`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const decideCompOff = async (req, res) => {
  try {
    const { status } = req.body; // 'Approved' | 'Rejected'
    if (!["Approved", "Rejected"].includes(status))
      return res.status(400).json({ success: false, message: "Invalid status" });

    const [[co]] = await db.query("SELECT * FROM comp_offs WHERE id = ?", [req.params.id]);
    if (!co) return res.status(404).json({ success: false, message: "Not found" });
    if (co.status !== "Pending")
      return res.status(400).json({ success: false, message: `Already ${co.status}` });

    if (status === "Approved") {
      // Comp-off leave type id = 4; grant +1 day allocation
      const year = new Date(co.worked_date).getFullYear();
      await ensureBalanceRow(co.employee_id, 4, year);
      await db.query(
        `UPDATE leave_balances SET allocated = allocated + 1
         WHERE employee_id = ? AND leave_type_id = 4 AND year = ?`,
        [co.employee_id, year]
      );
    }

    await db.query("UPDATE comp_offs SET status = ?, approved_by = ? WHERE id = ?", [
      status,
      req.user.name || "Admin",
      co.id,
    ]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
