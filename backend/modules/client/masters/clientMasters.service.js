import { db } from "../../../config/db.js";

// ===============================
// DEPARTMENTS
// ===============================
export const getDepartmentsService = async () => {
  const [rows] = await db.query(
    `SELECT id, name
     FROM departments
     WHERE isActive = 1
     ORDER BY name ASC`
  );
  return rows;
};

// ===============================
// DESIGNATIONS
// ===============================
export const getDesignationsService = async () => {
  const [rows] = await db.query(
    `SELECT id, name
     FROM designations
     WHERE isActive = 1
     ORDER BY name ASC`
  );
  return rows;
};

// ===============================
// STATUSES
// ===============================
export const getStatusesService = async () => {
  const [rows] = await db.query(
    `SELECT id, name
     FROM employee_statuses
     WHERE isActive = 1
     ORDER BY name ASC`
  );
  return rows;
};

