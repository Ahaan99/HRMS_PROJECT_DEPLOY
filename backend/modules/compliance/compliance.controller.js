import { db } from "../../config/db.js";

const err = (res, e) => res.status(500).json({ success: false, message: e.message });

export const logAudit = async (user_name, action, module, details) => {
  try {
    await db.query(
      "INSERT INTO admin_audit_logs (user_name, action, module, details) VALUES (?,?,?,?)",
      [user_name || "System", action, module, details || null]
    );
  } catch {
    /* audit failure must never break the main flow */
  }
};

/* ---------------- Compliance checklist ---------------- */
export const listCompliance = async (req, res) => {
  try {
    /* auto-mark overdue */
    await db.query(
      "UPDATE compliance_items SET status = 'Overdue' WHERE status = 'Pending' AND due_date < CURDATE()"
    );
    const [rows] = await db.query("SELECT * FROM compliance_items ORDER BY due_date ASC");
    const [[counts]] = await db.query(
      `SELECT SUM(status='Pending') pending, SUM(status='Overdue') overdue, SUM(status='Completed') completed,
              SUM(status='Pending' AND due_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)) due_soon
       FROM compliance_items`
    );
    res.json({ items: rows, counts });
  } catch (e) { err(res, e); }
};

export const createCompliance = async (req, res) => {
  try {
    const { title, category, frequency, due_date, notes } = req.body;
    if (!title || !due_date)
      return res.status(400).json({ success: false, message: "title and due date are required" });
    const [r] = await db.query(
      "INSERT INTO compliance_items (title, category, frequency, due_date, notes) VALUES (?,?,?,?,?)",
      [title, category || "Other", frequency || "Monthly", due_date, notes || null]
    );
    await logAudit(req.user?.name, "CREATE", "Compliance", `Added item: ${title}`);
    res.status(201).json({ success: true, id: r.insertId });
  } catch (e) { err(res, e); }
};

export const updateCompliance = async (req, res) => {
  try {
    const { status, title, category, frequency, due_date, notes } = req.body;
    const [[item]] = await db.query("SELECT * FROM compliance_items WHERE id = ?", [req.params.id]);
    if (!item) return res.status(404).json({ success: false, message: "Not found" });

    await db.query(
      `UPDATE compliance_items SET
        title = COALESCE(?, title), category = COALESCE(?, category),
        frequency = COALESCE(?, frequency), due_date = COALESCE(?, due_date),
        notes = COALESCE(?, notes),
        status = COALESCE(?, status),
        completed_at = CASE WHEN ? = 'Completed' THEN NOW() ELSE completed_at END
       WHERE id = ?`,
      [title || null, category || null, frequency || null, due_date || null, notes || null,
       status || null, status || null, req.params.id]
    );

    /* auto-create next cycle when a recurring item is completed */
    if (status === "Completed" && item.frequency !== "One-time") {
      const interval = { Monthly: "1 MONTH", Quarterly: "3 MONTH", Yearly: "1 YEAR" }[item.frequency];
      if (interval) {
        await db.query(
          `INSERT INTO compliance_items (title, category, frequency, due_date, notes)
           VALUES (?,?,?, DATE_ADD(?, INTERVAL ${interval}), ?)`,
          [item.title, item.category, item.frequency, item.due_date, item.notes]
        );
      }
    }
    await logAudit(req.user?.name, "UPDATE", "Compliance", `Item #${req.params.id}: ${status || "edited"}`);
    res.json({ success: true });
  } catch (e) { err(res, e); }
};

export const deleteCompliance = async (req, res) => {
  try {
    await db.query("DELETE FROM compliance_items WHERE id = ?", [req.params.id]);
    await logAudit(req.user?.name, "DELETE", "Compliance", `Deleted item #${req.params.id}`);
    res.json({ success: true });
  } catch (e) { err(res, e); }
};

/* ---------------- Audit trail ---------------- */
export const listAudit = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 200, 1000);
    const [rows] = await db.query("SELECT * FROM admin_audit_logs ORDER BY created_at DESC LIMIT ?", [limit]);
    res.json(rows);
  } catch (e) { err(res, e); }
};

/* ---------------- Salary sync ---------------- */
export const runSalarySync = async (req, res) => {
  try {
    const { month } = req.body; /* 'YYYY-MM' */
    if (!/^\d{4}-\d{2}$/.test(month || ""))
      return res.status(400).json({ success: false, message: "month must be YYYY-MM" });

    const otRate = Number(req.body.ot_rate_per_hour) || 0;

    const [employees] = await db.query(
      "SELECT id, name, salary FROM employees WHERE isActive = 1"
    );
    if (!employees.length) return res.status(400).json({ success: false, message: "No active employees" });

    /* working days = weekdays in month */
    const [[{ working_days }]] = await db.query(
      `WITH RECURSIVE d AS (
        SELECT STR_TO_DATE(CONCAT(?, '-01'), '%Y-%m-%d') AS dt
        UNION ALL SELECT dt + INTERVAL 1 DAY FROM d WHERE dt < LAST_DAY(STR_TO_DATE(CONCAT(?, '-01'), '%Y-%m-%d'))
      ) SELECT SUM(DAYOFWEEK(dt) NOT IN (1,7)) AS working_days FROM d`,
      [month, month]
    );

    const results = [];
    for (const emp of employees) {
      /* attendance summary */
      const [[att]] = await db.query(
        `SELECT
          COALESCE(SUM(status IN ('PRESENT','LATE','WFH')), 0) + COALESCE(SUM(status = 'HALF_DAY'), 0) * 0.5 AS present_days,
          COALESCE(SUM(
            CASE WHEN check_in IS NOT NULL AND check_out IS NOT NULL
                 AND TIME_TO_SEC(TIMEDIFF(check_out, check_in)) / 3600 > 9
            THEN TIME_TO_SEC(TIMEDIFF(check_out, check_in)) / 3600 - 9 ELSE 0 END), 0) AS ot_hours
         FROM super_admin_attendance
         WHERE is_active = 1 AND employee_id = ? AND DATE_FORMAT(date, '%Y-%m') = ?`,
        [emp.id, month]
      );

      /* approved paid leave days in month */
      const [[lv]] = await db.query(
        `SELECT COALESCE(SUM(days), 0) AS paid_leave_days
         FROM leave_applications
         WHERE employee_id = ? AND status = 'Approved' AND DATE_FORMAT(from_date, '%Y-%m') = ?`,
        [emp.id, month]
      );

      const wd = Number(working_days) || 22;
      const present = Number(att.present_days) || 0;
      const paidLeave = Math.min(Number(lv.paid_leave_days) || 0, wd - present);
      const unpaid = Math.max(wd - present - paidLeave, 0);
      const perDay = Number(emp.salary) / wd;
      const deductions = Math.round(perDay * unpaid * 100) / 100;
      const otHours = Math.round(Number(att.ot_hours) * 10) / 10;
      const otAmount = Math.round(otHours * otRate * 100) / 100;
      const net = Math.round((Number(emp.salary) - deductions + otAmount) * 100) / 100;

      await db.query(
        `INSERT INTO payroll_runs
          (month, employee_id, employee_name, base_salary, working_days, present_days, paid_leave_days, unpaid_leave_days, ot_hours, ot_amount, deductions, net_salary, status)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?, 'Draft')
         ON DUPLICATE KEY UPDATE
          base_salary = VALUES(base_salary), working_days = VALUES(working_days),
          present_days = VALUES(present_days), paid_leave_days = VALUES(paid_leave_days),
          unpaid_leave_days = VALUES(unpaid_leave_days), ot_hours = VALUES(ot_hours),
          ot_amount = VALUES(ot_amount), deductions = VALUES(deductions),
          net_salary = VALUES(net_salary), status = 'Draft'`,
        [month, emp.id, emp.name, emp.salary, wd, present, paidLeave, unpaid, otHours, otAmount, deductions, net]
      );
      results.push({ employee: emp.name, net_salary: net });
    }

    await logAudit(req.user?.name, "SYNC", "Payroll", `Salary sync for ${month} (${results.length} employees)`);
    res.json({ success: true, month, count: results.length });
  } catch (e) { err(res, e); }
};

export const listPayrollRuns = async (req, res) => {
  try {
    const { month } = req.query;
    const [rows] = await db.query(
      `SELECT * FROM payroll_runs ${month ? "WHERE month = ?" : ""} ORDER BY month DESC, employee_name`,
      month ? [month] : []
    );
    res.json(rows);
  } catch (e) { err(res, e); }
};

export const updatePayrollStatus = async (req, res) => {
  try {
    await db.query("UPDATE payroll_runs SET status = ? WHERE id = ?", [req.body.status, req.params.id]);
    await logAudit(req.user?.name, "UPDATE", "Payroll", `Run #${req.params.id} -> ${req.body.status}`);
    res.json({ success: true });
  } catch (e) { err(res, e); }
};
