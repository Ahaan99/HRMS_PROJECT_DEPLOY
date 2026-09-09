import { db } from "../../../config/db.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { ENV } from "../../../config/env.js";

export const loginHRService = async ({ email, password }) => {
  if (!email || !password) {
    throw new Error("Email and password required");
  }

  // find HR employee — must belong to the HR department
  const [rows] = await db.query(
    `SELECT e.id, e.employeeCode, e.name, e.email, e.password_hash
     FROM employees e
     JOIN departments dep ON dep.id = e.departmentId
     WHERE e.email = ? AND e.isActive = 1 AND dep.name = 'HR'
     LIMIT 1`,
    [email],
  );

  if (!rows.length) {
    throw new Error("Invalid credentials");
  }

  const employee = rows[0];

  // compare password (never log passwords or hashes)
  const isMatch = await bcrypt.compare(password, employee.password_hash);
  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  // 🎫 generate token
  const token = jwt.sign(
    {
      id: employee.id,
      employee_id: employee.id,
      employee_code: employee.employeeCode,
      role: "hr",
    },
    ENV.JWT_SECRET,
    { expiresIn: "7d" },
  );

  return {
    message: "Login successful",
    token,
    employee: {
      id: employee.id,
      employee_code: employee.employee_code,
      name: employee.name,
      email: employee.email,
    },
  };
};
