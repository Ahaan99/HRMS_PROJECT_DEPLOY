import { db } from "../../../config/db.js";
import bcrypt from "bcryptjs";

// Number(undefined) is NaN, which mysql2 serialises unquoted and MySQL rejects as
// "Unknown column 'NaN'"; optional FK selects must become NULL instead.
const toIdOrNull = (v) => {
  const n = Number(v);
  return v === undefined || v === null || v === "" || Number.isNaN(n) ? null : n;
};

// helper → get client_id from client_code
const getClientId = async (client_code) => {
  const [rows] = await db.query(
    `SELECT id FROM clients WHERE client_code = ? LIMIT 1`,
    [client_code]
  );

  if (!rows.length) throw new Error("Client not found");
  return rows[0].id;
};

// ===============================
// CREATE
// ===============================
export const createEmployeeService = async (client_code, payload) => {
  const client_id = await getClientId(client_code);

  let {
    employeeCode,
    name,
    email,
    phone,
    departmentId,
    designationId,
    statusId,
    joiningDate,
    salary,
    password,
  } = payload;

  if (!name?.trim()) throw new Error("Name is required");
  if (password !== undefined && password !== "" && String(password).length < 6) {
    throw new Error("Login password must be at least 6 characters");
  }
  if (!email?.trim()) throw new Error("Email is required");
  if (toIdOrNull(departmentId) === null) throw new Error("Department is required");
  if (toIdOrNull(designationId) === null) throw new Error("Designation is required");
  if (!joiningDate) throw new Error("Joining date is required");

  // =====================================================
  // 🔥 AUTO GENERATE EMPLOYEE CODE (per client)
  // =====================================================
  if (!employeeCode) {
    const [last] = await db.query(
      `SELECT employeeCode
       FROM client_employees
       WHERE client_id = ?
       ORDER BY id DESC
       LIMIT 1`,
      [client_id]
    );

    let nextNumber = 1;

    if (last.length && last[0].employeeCode) {
      const match = last[0].employeeCode.match(/(\d+)$/);
      if (match) nextNumber = Number(match[1]) + 1;
    }

    employeeCode = `EMP-${String(nextNumber).padStart(4, "0")}`;
  }

  // =====================================================
  // INSERT
  // =====================================================
  const password_hash = password ? await bcrypt.hash(String(password), 10) : null;

  const [result] = await db.query(
    `INSERT INTO client_employees
     (client_id, employeeCode, name, email, phone,
      departmentId, designationId, statusId,
      joiningDate, salary, password_hash, isActive)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [
      client_id,
      employeeCode,
      name,
      email,
      phone,
      toIdOrNull(departmentId),
      toIdOrNull(designationId),
      toIdOrNull(statusId),
      joiningDate || null,
      salary ?? null,
      password_hash,
    ]
  );

  return { id: result.insertId, employeeCode };
};
// ===============================
// LIST
// ===============================
export const listEmployeesService = async (client_code) => {
  const client_id = await getClientId(client_code);

  const [rows] = await db.query(
    `SELECT 
        e.*,
        d.name AS departmentName,
        des.name AS designationName,
        s.name AS statusName
     FROM client_employees e
     LEFT JOIN departments d ON e.departmentId = d.id
     LEFT JOIN designations des ON e.designationId = des.id
     LEFT JOIN employee_statuses s ON e.statusId = s.id
     WHERE e.client_id = ?
     ORDER BY e.id DESC`,
    [client_id]
  );

  return rows;
};

// ===============================
// UPDATE
// ===============================
export const updateEmployeeService = async (
  client_code,
  employeeId,
  payload
) => {
  const client_id = await getClientId(client_code);

  const fields = [];
  const values = [];

  // 🔹 clone payload
  const data = { ...payload };

  // 🔐 PASSWORD HANDLING (NEW)
  if (data.password !== undefined) {
    const hashed = await bcrypt.hash(data.password, 10);
    fields.push("password_hash = ?");
    values.push(hashed);
  }

  // remove password from normal update
  delete data.password;

  // NORMAL FIELD UPDATE
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  });

  if (!fields.length) return;

  values.push(employeeId, client_id);

  await db.query(
    `UPDATE client_employees
     SET ${fields.join(", ")}
     WHERE id = ? AND client_id = ?`,
    values
  );
};

// ===============================
// TOGGLE ACTIVE
// ===============================
export const toggleEmployeeService = async (client_code, employeeId) => {
  const client_id = await getClientId(client_code);

  await db.query(
    `UPDATE client_employees
     SET isActive = NOT isActive
     WHERE id = ? AND client_id = ?`,
    [employeeId, client_id]
  );
};

// ===============================
// DELETE (ARCHIVE + DELETE)
// ===============================
export const deleteEmployeeService = async (client_code, employeeId) => {
  const client_id = await getClientId(client_code);

  // 1️⃣ get employee
  const [rows] = await db.query(
    `SELECT *
     FROM client_employees
     WHERE id = ? AND client_id = ?`,
    [employeeId, client_id]
  );

  if (!rows.length) throw new Error("Employee not found");

  const emp = rows[0];

  // 2️⃣ archive (agar archive table missing hai to delete ko block mat karo)
  try {
    await db.query(
      `INSERT INTO client_employee_deleted
       (original_employee_id, client_id, employeeCode, name, email,
        phone, departmentId, designationId, statusId,
        joiningDate, salary, isActive)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        emp.id,
        emp.client_id,
        emp.employeeCode,
        emp.name,
        emp.email,
        emp.phone,
        emp.departmentId,
        emp.designationId,
        emp.statusId,
        emp.joiningDate,
        emp.salary,
        emp.isActive,
      ]
    );
  } catch (archiveErr) {
    if (archiveErr && archiveErr.code === "ER_NO_SUCH_TABLE") {
      console.error(
        "client_employee_deleted table missing - skipping archive:",
        archiveErr.message
      );
    } else {
      throw archiveErr;
    }
  }

  // 3️⃣ leads/lead batches ke assignments detach karo warna FK (NO ACTION) delete block kar deta hai
  for (const table of ["client_leads", "client_lead_batches"]) {
    try {
      await db.query(
        `UPDATE ${table} SET assigned_to = NULL
         WHERE assigned_to = ? AND client_id = ?`,
        [employeeId, client_id]
      );
    } catch (detachErr) {
      // Table ya column production par missing ho sakta hai - delete ko block mat karo
      if (
        detachErr &&
        (detachErr.code === "ER_NO_SUCH_TABLE" ||
          detachErr.code === "ER_BAD_FIELD_ERROR")
      ) {
        console.error(`Skipping detach on ${table}:`, detachErr.message);
      } else {
        throw detachErr;
      }
    }
  }

  // 4️⃣ delete from main
  await db.query(
    `DELETE FROM client_employees
     WHERE id = ? AND client_id = ?`,
    [employeeId, client_id]
  );
};