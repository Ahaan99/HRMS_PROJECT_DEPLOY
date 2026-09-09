import { db } from "../../../config/db.js";

// CREATE
export const createDepartmentService = async (payload) => {
  const { name } = payload;

  const [result] = await db.query(
    `
    INSERT INTO departments (name)
    VALUES (?)
    `,
    [name]
  );

  const [rows] = await db.query(
    `SELECT * FROM departments WHERE id = ?`,
    [result.insertId]
  );

  return rows[0];
};

// GET ALL WITH EMPLOYEE COUNTS
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

// GET EMPLOYEES BY DEPARTMENT
export const getDepartmentEmployeesService = async (departmentId) => {
  const [rows] = await db.query(
    `
    SELECT 
      id,
      employeeCode,
      name,
      email,
      isActive,
      createdAt
    FROM employees
    WHERE departmentId = ?
    ORDER BY id DESC
    `,
    [departmentId]
  );

  return rows;
};

// UPDATE
export const updateDepartmentService = async (id, payload) => {
  const { name, isActive } = payload;

  await db.query(
    `
    UPDATE departments
    SET name = ?, isActive = ?
    WHERE id = ?
    `,
    [name, isActive, id]
  );

  const [rows] = await db.query(
    `SELECT * FROM departments WHERE id = ?`,
    [id]
  );

  return rows[0];
};

// DELETE
export const deleteDepartmentService = async (id) => {
  const [result] = await db.query(
    `DELETE FROM departments WHERE id = ?`,
    [id]
  );

  return result;
}; 
