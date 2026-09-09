import { db } from "../../../config/db.js";
import bcrypt from "bcryptjs";

const EMPLOYEE_SELECT = `
SELECT 
  e.id,
  e.employeeCode,
  e.joiningId,
  e.name,
  d.name as departmentName,
  e.email,
  e.phone,
  e.departmentId,
  e.designationId,
  DATE_FORMAT(e.joiningDate,'%Y-%m-%d') as joiningDate,
  e.salary,
  e.statusId,
  e.isActive,
  e.createdAt,
  e.updatedAt,

  jf.dob,
  jf.photo as profile_image

FROM employees e
LEFT JOIN joining_forms jf 
ON jf.id = e.joiningId
LEFT JOIN departments d 
ON d.id = e.departmentId

`;

export const createEmployee = async (payload) => {
  const {
    employeeCode,
    joiningId,
    name,
    email,
    phone,
    departmentId,
    designationId,
    joiningDate,
    salary,
    statusId,
    isActive,
  } = payload;

  const finalJoiningDate = joiningDate
    ? String(joiningDate).slice(0, 10)
    : null;

  if (!name) throw new Error("Name is required");
  if (!email) throw new Error("Email is required");
  if (!departmentId) throw new Error("departmentId is required");
  if (!designationId) throw new Error("designationId is required");
  if (!finalJoiningDate) throw new Error("joiningDate is required");

  const finalEmployeeCode =
    employeeCode || `EMP${Math.floor(1000 + Math.random() * 9000)}`;

  const [existing] = await db.query(
    "SELECT id FROM employees WHERE email = ?",
    [email],
  );

  if (existing.length > 0) throw new Error("Email already exists");

  // 🔐 hash password if provided
  let passwordHash = null;
  if (payload?.password) {
    passwordHash = await bcrypt.hash(payload.password, 10);
  }

  const [result] = await db.query(
    `INSERT INTO employees 
    (employeeCode, joiningId, name, email, phone, departmentId, designationId, joiningDate, salary, statusId, isActive, password_hash)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      finalEmployeeCode,
      joiningId || null,
      name,
      email,
      phone || null,
      departmentId,
      designationId,
      finalJoiningDate,
      salary || 0,
      statusId || 1,
      isActive === false ? 0 : 1,
      passwordHash,
    ],
  );

  const [rows] = await db.query(`${EMPLOYEE_SELECT} WHERE e.id = ?`, [
    result.insertId,
  ]);

  return rows[0];
};

export const getAllEmployees = async () => {
  const [rows] = await db.query(`${EMPLOYEE_SELECT} ORDER BY e.id DESC`);
  return rows;
};

export const getEmployeeById = async (id) => {
  const [rows] = await db.query(`${EMPLOYEE_SELECT} WHERE e.id = ?`, [id]);

  if (rows.length === 0) throw new Error("Employee not found");

  return rows[0];
};

export const updateEmployee = async (id, payload) => {
  const [existing] = await db.query("SELECT * FROM employees WHERE id = ?", [
    id,
  ]);

  if (existing.length === 0) throw new Error("Employee not found");

  const old = existing[0];

  // 🔐 password reset (optional)
  let passwordHash = null;
  if (payload?.password) {
    passwordHash = await bcrypt.hash(payload.password, 10);
  }

  const updated = {
    employeeCode: payload.employeeCode ?? old.employeeCode,
    joiningId: payload.joiningId ?? old.joiningId,
    name: payload.name ?? old.name,
    email: payload.email ?? old.email,
    phone: payload.phone ?? old.phone,
    departmentId: payload.departmentId ?? old.departmentId,
    designationId: payload.designationId ?? old.designationId,
    joiningDate: payload.joiningDate
      ? String(payload.joiningDate).slice(0, 10)
      : old.joiningDate,
    salary: payload.salary ?? old.salary,
    statusId: payload.statusId ?? old.statusId,
    isActive: payload.isActive ?? old.isActive,
  };

  if (updated.email !== old.email) {
    const [dup] = await db.query("SELECT id FROM employees WHERE email = ?", [
      updated.email,
    ]);
    if (dup.length > 0) throw new Error("Email already exists");
  }

  let updateQuery = `
  UPDATE employees SET
    employeeCode = ?,
    joiningId = ?,
    name = ?,
    email = ?,
    phone = ?,
    departmentId = ?,
    designationId = ?,
    joiningDate = ?,
    salary = ?,
    statusId = ?,
    isActive = ?
`;

  const updateValues = [
    updated.employeeCode,
    updated.joiningId,
    updated.name,
    updated.email,
    updated.phone,
    updated.departmentId,
    updated.designationId,
    updated.joiningDate,
    updated.salary,
    updated.statusId,
    updated.isActive,
  ];

  // 🔐 only update password if provided
  if (passwordHash) {
    updateQuery += `, password_hash = ?`;
    updateValues.push(passwordHash);
  }

  updateQuery += ` WHERE id = ?`;
  updateValues.push(id);

  await db.query(updateQuery, updateValues);

  const [rows] = await db.query(`${EMPLOYEE_SELECT} WHERE e.id = ?`, [id]);
  return rows[0];
};

export const deleteEmployee = async (id) => {
  const [existing] = await db.query("SELECT id FROM employees WHERE id = ?", [
    id,
  ]);

  if (existing.length === 0) throw new Error("Employee not found");

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Clean up NO ACTION foreign-key dependents that block employee deletion
    await conn.query("DELETE FROM admin_payroll WHERE employee_id = ?", [id]);
    await conn.query(
      "UPDATE leads SET assigned_to = NULL WHERE assigned_to = ?",
      [id]
    );

    // Remaining dependents (attendance, targets, etc.) cascade automatically
    await conn.query("DELETE FROM employees WHERE id = ?", [id]);

    await conn.commit();
    return true;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const getEmployeesByDepartment = async (departmentId) => {
  const [rows] = await db.query(
    `${EMPLOYEE_SELECT} WHERE e.departmentId = ? ORDER BY e.id DESC`,
    [departmentId],
  );

  return rows;
};
