import { db } from "../../config/db.js";

/* ------------------------------------------------------------------ */
/* Workforce & Attrition                                               */
/* ------------------------------------------------------------------ */
export const workforce = async (req, res) => {
  try {
    const [[headcount]] = await db.query(
      `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN isActive = 1 THEN 1 ELSE 0 END) AS active,
        SUM(CASE WHEN statusId = 2 THEN 1 ELSE 0 END) AS on_notice,
        SUM(CASE WHEN statusId IN (3,4) THEN 1 ELSE 0 END) AS exited
       FROM employees`
    );

    const [byDept] = await db.query(
      `SELECT d.name AS department,
              COUNT(e.id) AS headcount,
              COALESCE(SUM(e.salary), 0) AS salary_cost
       FROM departments d
       LEFT JOIN employees e ON e.departmentId = d.id AND e.isActive = 1
       WHERE d.isActive = 1
       GROUP BY d.id, d.name
       ORDER BY headcount DESC`
    );

    const [byStatus] = await db.query(
      `SELECT s.name AS status, COUNT(e.id) AS count
       FROM employee_statuses s
       LEFT JOIN employees e ON e.statusId = s.id
       GROUP BY s.id, s.name`
    );

    /* Joiners per month (last 12 months) */
    const [joiners] = await db.query(
      `SELECT DATE_FORMAT(joiningDate, '%Y-%m') AS month, COUNT(*) AS joined
       FROM employees
       WHERE joiningDate >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
       GROUP BY month ORDER BY month`
    );

    /* Exits per month from exit_requests (last 12 months) */
    const [exits] = await db.query(
      `SELECT DATE_FORMAT(COALESCE(exit_date, resignation_date), '%Y-%m') AS month,
              COUNT(*) AS exited
       FROM exit_requests
       WHERE status IN ('approved','processing','completed')
         AND COALESCE(exit_date, resignation_date) >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
       GROUP BY month ORDER BY month`
    );

    /* Merge joiners + exits into one timeline */
    const map = {};
    for (const j of joiners) map[j.month] = { month: j.month, joined: Number(j.joined), exited: 0 };
    for (const x of exits) {
      if (!map[x.month]) map[x.month] = { month: x.month, joined: 0, exited: 0 };
      map[x.month].exited = Number(x.exited);
    }
    const timeline = Object.values(map).sort((a, b) => a.month.localeCompare(b.month));

    /* Attrition rate: exits (12m) / average headcount */
    const totalExits12m = exits.reduce((s, r) => s + Number(r.exited), 0);
    const avgHeadcount = Number(headcount.active) + totalExits12m / 2;
    const attritionRate = avgHeadcount > 0 ? Number(((totalExits12m / avgHeadcount) * 100).toFixed(1)) : 0;

    /* Exit reasons */
    const [exitTypes] = await db.query(
      `SELECT exit_type, COUNT(*) AS count FROM exit_requests GROUP BY exit_type`
    );

    /* Tenure buckets */
    const [tenure] = await db.query(
      `SELECT
        SUM(CASE WHEN TIMESTAMPDIFF(MONTH, joiningDate, CURDATE()) < 6 THEN 1 ELSE 0 END) AS 'lt6m',
        SUM(CASE WHEN TIMESTAMPDIFF(MONTH, joiningDate, CURDATE()) BETWEEN 6 AND 12 THEN 1 ELSE 0 END) AS 'm6to12',
        SUM(CASE WHEN TIMESTAMPDIFF(MONTH, joiningDate, CURDATE()) BETWEEN 13 AND 36 THEN 1 ELSE 0 END) AS 'y1to3',
        SUM(CASE WHEN TIMESTAMPDIFF(MONTH, joiningDate, CURDATE()) > 36 THEN 1 ELSE 0 END) AS 'gt3y'
       FROM employees WHERE isActive = 1`
    );

    res.json({
      headcount,
      byDept,
      byStatus,
      timeline,
      attritionRate,
      totalExits12m,
      exitTypes,
      tenure: tenure[0],
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

/* ------------------------------------------------------------------ */
/* Recruitment                                                         */
/* ------------------------------------------------------------------ */
export const recruitment = async (req, res) => {
  try {
    const [funnel] = await db.query(
      `SELECT s.name AS stage, COUNT(c.id) AS count
       FROM candidate_statuses s
       LEFT JOIN candidates c ON c.statusId = s.id AND c.isActive = 1
       GROUP BY s.id, s.name
       ORDER BY s.id`
    );

    const [byMonth] = await db.query(
      `SELECT DATE_FORMAT(createdAt, '%Y-%m') AS month, COUNT(*) AS applications
       FROM candidates
       WHERE createdAt >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
       GROUP BY month ORDER BY month`
    );

    const [byJob] = await db.query(
      `SELECT jobTitle, COUNT(*) AS candidates,
              SUM(CASE WHEN statusId = 4 THEN 1 ELSE 0 END) AS selected
       FROM candidates WHERE isActive = 1
       GROUP BY jobTitle ORDER BY candidates DESC LIMIT 10`
    );

    const applied = funnel.reduce((s, f) => s + Number(f.count), 0);
    const selected = Number(funnel.find((f) => f.stage === "SELECTED")?.count || 0);
    const conversionRate = applied > 0 ? Number(((selected / applied) * 100).toFixed(1)) : 0;

    res.json({ funnel, byMonth, byJob, totals: { applied, selected, conversionRate } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

/* ------------------------------------------------------------------ */
/* Attendance                                                          */
/* ------------------------------------------------------------------ */
export const attendance = async (req, res) => {
  try {
    const days = Math.min(Number(req.query.days) || 30, 90);

    const [byDay] = await db.query(
      `SELECT DATE_FORMAT(date, '%Y-%m-%d') AS day,
              SUM(status = 'PRESENT') AS present,
              SUM(status = 'ABSENT') AS absent,
              SUM(status = 'LATE') AS late,
              SUM(status = 'HALF_DAY') AS half_day,
              SUM(status = 'WFH') AS wfh,
              SUM(status = 'LEAVE') AS on_leave
       FROM super_admin_attendance
       WHERE is_active = 1 AND date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY day ORDER BY day`,
      [days]
    );

    const [byStatus] = await db.query(
      `SELECT status, COUNT(*) AS count
       FROM super_admin_attendance
       WHERE is_active = 1 AND date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY status`,
      [days]
    );

    /* Late arrivals leaderboard */
    const [lateByEmp] = await db.query(
      `SELECT employee_name, COUNT(*) AS late_days
       FROM super_admin_attendance
       WHERE is_active = 1 AND status = 'LATE' AND date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY employee_name ORDER BY late_days DESC LIMIT 10`,
      [days]
    );

    /* Average working hours */
    const [[avgHours]] = await db.query(
      `SELECT ROUND(AVG(TIME_TO_SEC(TIMEDIFF(check_out, check_in)) / 3600), 1) AS avg_hours
       FROM super_admin_attendance
       WHERE is_active = 1 AND check_in IS NOT NULL AND check_out IS NOT NULL
         AND date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
      [days]
    );

    const total = byStatus.reduce((s, r) => s + Number(r.count), 0);
    const present = byStatus
      .filter((r) => ["PRESENT", "LATE", "HALF_DAY", "WFH"].includes(r.status))
      .reduce((s, r) => s + Number(r.count), 0);
    const attendanceRate = total > 0 ? Number(((present / total) * 100).toFixed(1)) : 0;

    res.json({ byDay, byStatus, lateByEmp, avgHours: avgHours.avg_hours, attendanceRate, days });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

/* ------------------------------------------------------------------ */
/* Leave patterns                                                      */
/* ------------------------------------------------------------------ */
export const leaves = async (req, res) => {
  try {
    const [byType] = await db.query(
      `SELECT lt.name AS type, COUNT(la.id) AS applications, COALESCE(SUM(la.days), 0) AS days
       FROM leave_types lt
       LEFT JOIN leave_applications la ON la.leave_type_id = lt.id AND la.status = 'Approved'
       GROUP BY lt.id, lt.name`
    );
    const [byMonth] = await db.query(
      `SELECT DATE_FORMAT(from_date, '%Y-%m') AS month, COALESCE(SUM(days), 0) AS days
       FROM leave_applications
       WHERE status = 'Approved' AND from_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
       GROUP BY month ORDER BY month`
    );
    const [byStatus] = await db.query(
      `SELECT status, COUNT(*) AS count FROM leave_applications GROUP BY status`
    );
    res.json({ byType, byMonth, byStatus });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

/* ------------------------------------------------------------------ */
/* Financial overview                                                  */
/* ------------------------------------------------------------------ */
export const financial = async (req, res) => {
  try {
    const [byMonth] = await db.query(
      `SELECT m.month,
              COALESCE(r.revenue, 0) AS revenue,
              COALESCE(x.expense, 0) AS expense,
              COALESCE(r.revenue, 0) - COALESCE(x.expense, 0) AS profit
       FROM (
         SELECT DATE_FORMAT(revenue_date, '%Y-%m') AS month FROM revenues
         UNION SELECT DATE_FORMAT(expense_date, '%Y-%m') FROM expenses
       ) m
       LEFT JOIN (SELECT DATE_FORMAT(revenue_date, '%Y-%m') mo, SUM(amount) revenue FROM revenues GROUP BY mo) r ON r.mo = m.month
       LEFT JOIN (SELECT DATE_FORMAT(expense_date, '%Y-%m') mo, SUM(amount) expense FROM expenses GROUP BY mo) x ON x.mo = m.month
       WHERE m.month >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 12 MONTH), '%Y-%m')
       GROUP BY m.month, r.revenue, x.expense
       ORDER BY m.month`
    );

    const [[totals]] = await db.query(
      `SELECT
        (SELECT COALESCE(SUM(amount), 0) FROM revenues) AS total_revenue,
        (SELECT COALESCE(SUM(amount), 0) FROM expenses) AS total_expense,
        (SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE status IN ('Pending','Sent','Partially Paid','Overdue')) AS outstanding_invoices,
        (SELECT COALESCE(SUM(salary), 0) FROM employees WHERE isActive = 1) AS monthly_salary_cost`
    );

    res.json({ byMonth, totals });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
