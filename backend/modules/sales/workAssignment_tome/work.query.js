import { db } from "../../../config/db.js";

export const getMyAssignments = async (
  employeeCode
) => {
  const [rows] = await db.query(
    `
    SELECT *
    FROM work_assignments
    WHERE assigned_to = ?
    ORDER BY id DESC
    `,
    [employeeCode]
  );

  return rows;
};

export const getAssignmentById = async (
  id
) => {
  const [rows] = await db.query(
    `
    SELECT *
    FROM work_assignments
    WHERE id = ?
    LIMIT 1
    `,
    [id]
  );

  return rows[0];
};

export const updateAssignment = async (
  id,
  data
) => {
  return db.query(
    `
    UPDATE work_assignments
    SET
      status = ?,
      progress = ?
    WHERE id = ?
    `,
    [
      data.status,
      data.progress,
      id,
    ]
  );
};