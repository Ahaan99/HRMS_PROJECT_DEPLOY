import { db } from "../../../config/db.js";

/* =========================================
GET MY TARGETS
========================================= */
export const getMyTargets = async (
  req,
  res
) => {
  try {
    const employeeId =
      req.employee.id;

    const [rows] = await db.query(
      `
      SELECT 
        t.*,
        e.name AS employee_name,
        e.employeeCode,
        d.name AS department_name

      FROM super_admin_targets t

      JOIN employees e
      ON e.id = t.employee_id

      LEFT JOIN departments d
      ON d.id = e.departmentId

      WHERE t.employee_id = ?

      ORDER BY t.created_at DESC
      `,
      [employeeId]
    );

    res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* =========================================
UPDATE TARGET PROGRESS
========================================= */
export const updateProgress = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const { currentValue } =
      req.body;

    const employeeId =
      req.employee.id;

    // CHECK TARGET OWNERSHIP
    const [[target]] =
      await db.query(
        `
      SELECT *
      FROM super_admin_targets
      WHERE id = ?
      AND employee_id = ?
      `,
        [id, employeeId]
      );

    if (!target) {
      return res.status(404).json({
        success: false,
        message:
          "Target not found",
      });
    }

    let status = "pending";

    if (
      currentValue >=
      target.target_value
    ) {
      status = "completed";
    } else if (currentValue > 0) {
      status = "in_progress";
    }

    // OVERDUE
    const today = new Date()
      .toISOString()
      .split("T")[0];

    if (
      target.deadline &&
      today > target.deadline &&
      status !== "completed"
    ) {
      status = "overdue";
    }

    await db.query(
      `
      UPDATE super_admin_targets
      SET
        current_value = ?,
        status = ?
      WHERE id = ?
      `,
      [currentValue, status, id]
    );

    res.json({
      success: true,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};