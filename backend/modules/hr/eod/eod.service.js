import * as query from "./eod.query.js";
import { db } from "../../../config/db.js";

export const getMyEODReports = (
  employeeId
) => {
  return query.getMyEODReports(
    employeeId
  );
};

export const createEOD = async (
  data,
  employeeId
) => {
  // GET EMPLOYEE DETAILS
  const [rows] = await db.query(
    `
    SELECT
      e.id,
      e.name,
      e.departmentId,
      d.name AS departmentName
    FROM employees e
    LEFT JOIN departments d
      ON d.id = e.departmentId
    WHERE e.id = ?
    LIMIT 1
    `,
    [employeeId]
  );

  const employee = rows[0];

  if (!employee) {
    throw new Error(
      "Employee not found"
    );
  }

  const payload = {
    employee_id: employee.id,

    employee_name: employee.name,

    department:
      employee.departmentName || "",

    department_id:
      employee.departmentId,

    report_date: data.date,

    tasks_completed:
      data.tasksCompleted,

    tasks_in_progress:
      data.tasksInProgress,

    blockers: data.blockers,

    tomorrow_plan:
      data.tomorrowPlan,

    notes: data.notes,

    status: "submitted",
  };

  return query.createEOD(payload);
};

export const updateEOD = async (
  id,
  data,
  employeeId
) => {
  const existing =
    await query.getEODById(id);

  if (!existing) {
    throw new Error(
      "EOD not found"
    );
  }

  if (
    existing.employee_id !== employeeId
  ) {
    throw new Error(
      "Access denied"
    );
  }

  if (
    existing.status === "approved"
  ) {
    throw new Error(
      "Approved EOD cannot be edited"
    );
  }

  const payload = {
    tasks_completed:
      data.tasksCompleted,

    tasks_in_progress:
      data.tasksInProgress,

    blockers: data.blockers,

    tomorrow_plan:
      data.tomorrowPlan,

    notes: data.notes,
  };

  return query.updateEOD(
    id,
    payload
  );
};