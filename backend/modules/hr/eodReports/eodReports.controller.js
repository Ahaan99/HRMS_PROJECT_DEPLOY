import { db } from "../../../config/db.js";

/*
 * GET /api/hr/eod-reports?date=YYYY-MM-DD&status=&department=
 * Admin-style view across all employees, consumed by the IT portal
 * EODReport page (expects rows with reportId, employee, employeeId,
 * department, tasksCompleted, tasksInProgress, hoursWorked,
 * submittedAt, status).
 */
export const getEODReports = async (req, res) => {
  try {
    const { date, status, department } = req.query;

    const where = [];
    const params = [];

    if (date) {
      where.push("DATE(report_date) = ?");
      params.push(date);
    }
    if (status) {
      where.push("status = ?");
      params.push(status);
    }
    if (department) {
      where.push("department = ?");
      params.push(department);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [rows] = await db.query(
      `SELECT
         id,
         CONCAT('EOD-', LPAD(id, 5, '0')) AS reportId,
         employee_name AS employee,
         employee_id AS employeeId,
         department,
         report_date AS date,
         tasks_completed AS tasksCompleted,
         tasks_in_progress AS tasksInProgress,
         COALESCE(hours_worked, 0) AS hoursWorked,
         blockers,
         tomorrow_plan AS tomorrowPlan,
         notes,
         status,
         submitted_at AS submittedAt,
         approved_by AS approvedBy
       FROM eod_reports
       ${whereSql}
       ORDER BY id DESC`,
      params
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.log("HR EOD REPORTS ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
