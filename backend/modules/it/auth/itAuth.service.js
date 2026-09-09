import { db } from "../../../config/db.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { ENV } from "../../../config/env.js";

/**
 * IT portal password login.
 * Mirrors hrAuth.service.js but only accepts employees whose department is IT.
 * (Previously the IT portal reused /api/hr/auth/login, whose query is hard
 *  filtered to dep.name = 'HR', so IT-department employees could never log in.)
 */
export const loginITService = async ({ email, password }) => {
  if (!email || !password) {
    throw new Error("Email and password required");
  }

  const [rows] = await db.query(
    `SELECT e.id, e.employeeCode, e.name, e.email, e.password_hash
     FROM employees e
     JOIN departments dep ON dep.id = e.departmentId
     WHERE e.email = ? AND e.isActive = 1 AND UPPER(dep.name) = 'IT'
     LIMIT 1`,
    [email],
  );

  if (!rows.length) {
    throw new Error("Invalid credentials");
  }

  const employee = rows[0];

  if (!employee.password_hash) {
    throw new Error("Password not set for this account");
  }

  const isMatch = await bcrypt.compare(password, employee.password_hash);
  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  const token = jwt.sign(
    {
      id: employee.id,
      employee_id: employee.id,
      employee_code: employee.employeeCode,
      role: "it",
    },
    ENV.JWT_SECRET,
    { expiresIn: "7d" },
  );

  return {
    message: "Login successful",
    token,
    employee: {
      id: employee.id,
      employee_code: employee.employeeCode,
      name: employee.name,
      email: employee.email,
    },
  };
};
