import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../../../config/db.js";
import { ENV } from "../../../config/env.js";

// helper → get client_id from client_code
const getClientId = async (client_code) => {
  const [rows] = await db.query(
    `SELECT id FROM clients WHERE client_code = ? LIMIT 1`,
    [client_code],
  );

  if (!rows.length) throw new Error("Client not found");
  return rows[0].id;
};

export const loginClientEmployeeService = async ({
  email,
  password,
  client_code,
}) => {

   console.log("🔥 LOGIN SERVICE HIT");
    console.log("📦 INPUT:", { email, client_code });
  // 1️⃣ get client_id
  const client_id = await getClientId(client_code);

  // 2️⃣ find employee
  const [rows] = await db.query(
    `SELECT id, client_id, email, password_hash, isActive, name
     FROM client_employees
     WHERE email = ? AND client_id = ?
     LIMIT 1`,
    [email, client_id],
  );

  if (!rows.length) {
    const [admin] = await db.query(
      `SELECT id FROM clients WHERE email = ? AND id = ? LIMIT 1`,
      [email, client_id],
    );
    if (admin.length) {
      const err = new Error(
        "This email is the client administrator account. Switch to the Client tab to sign in.",
      );
      err.code = "WRONG_LOGIN_TYPE";
      err.loginType = "admin";
      throw err;
    }
    throw new Error("Invalid credentials");
  }

  const employee = rows[0];

  // 🔴 password not set yet
  if (!employee.password_hash) {
    throw new Error("User password not created yet");
  }

  // 🔴 inactive check
  if (!employee.isActive) {
    throw new Error("Employee account is inactive");
  }

  // 3️⃣ compare password
  const isMatch = await bcrypt.compare(password, employee.password_hash);
  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  // 4️⃣ create JWT
  const token = jwt.sign(
    {
      client_code,
      employee_id: employee.id,
      role: "CLIENT_EMPLOYEE",
    },
    ENV.JWT_SECRET,
    { expiresIn: ENV.JWT_EXPIRES_IN || "1d" },
  );

  return {
    token,
    user: {
      id: employee.id,
      name: employee.name,
      email: employee.email,
      role: "CLIENT_EMPLOYEE",
    },
    enabledFeatures: [
      "SALES_REPORT",
      "PERFORMANCE_TRACKER",
      "WORK_POLICY",
      "WORK_TARGET",
      "WORK_ASSIGNMENT",
      "LEADS",
      "INVENTORY",
    ],
  };
};
