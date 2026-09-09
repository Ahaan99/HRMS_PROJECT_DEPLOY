import { db } from "../../../config/db.js";

// GET ALL Department
export const getAllDepartmentsService = async () => {
  const [rows] = await db.query(`
    SELECT
      d.id,
      d.name,
      d.isActive,
      COUNT(e.id) AS totalEmployees,
      SUM(CASE WHEN e.isActive = 1 THEN 1 ELSE 0 END) AS activeEmployees
    FROM departments d
    LEFT JOIN employees e ON e.departmentId = d.id
    GROUP BY d.id
    ORDER BY d.id DESC
  `);

  return rows;
};
