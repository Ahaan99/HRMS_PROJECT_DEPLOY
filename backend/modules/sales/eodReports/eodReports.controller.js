import { db } from "../../../config/db.js";

/*
 * GET /api/sales/eod-reports?date=YYYY-MM-DD&status=&department=
 * Returns the logged-in sales employee's EOD reports, shaped for the
 * Sales portal EODReport page / EODTable component.
 */
export const getEODReports = async (req, res) => {
  try {
    const employeeId = req.salesUser.employeeId;
    const { date, status, department } = req.query;

    const where = ["employee_id = ?"];
    const params = [employeeId];

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
       WHERE ${where.join(" AND ")}
       ORDER BY id DESC`,
      params
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.log("SALES EOD REPORTS ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/*
 * POST /api/sales/eod-reports
 * Body: { tasksCompleted: number, tasksInProgress: number,
 *         hoursWorked: number, summary: string }
 * Sent by the Sales portal EODForm component.
 */
export const createEODReport = async (req, res) => {
  try {
    const employeeId = req.salesUser.employeeId;
    const { tasksCompleted, tasksInProgress, hoursWorked, summary } = req.body;

    if (
      tasksCompleted === undefined ||
      tasksCompleted === null ||
      hoursWorked === undefined ||
      hoursWorked === null
    ) {
      return res.status(400).json({
        success: false,
        message: "tasksCompleted and hoursWorked are required",
      });
    }

    const [rows] = await db.query(
      `SELECT
         e.id,
         e.name,
         e.departmentId,
         d.name AS departmentName
       FROM employees e
       LEFT JOIN departments d ON d.id = e.departmentId
       WHERE e.id = ?
       LIMIT 1`,
      [employeeId]
    );

    const employee = rows[0];

    if (!employee) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }

    const payload = {
      employee_id: employee.id,
      employee_name: employee.name,
      department: employee.departmentName || "",
      department_id: employee.departmentId,
      report_date: new Date().toISOString().split("T")[0],
      tasks_completed: Number(tasksCompleted) || 0,
      tasks_in_progress: Number(tasksInProgress) || 0,
      hours_worked: Number(hoursWorked) || 0,
      notes: summary || "",
      status: "submitted",
    };

    await db.query(`INSERT INTO eod_reports SET ?`, [payload]);

    res.json({ success: true });
  } catch (err) {
    console.log("SALES EOD REPORT CREATE ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
