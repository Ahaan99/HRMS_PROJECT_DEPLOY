import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../../../config/db.js";
import { ENV } from "../../../config/env.js";

const SALES_DEPT_ID = Number(ENV.SALES_DEPT_ID);

// ==============================
// SALES LOGIN
// ==============================
export const salesLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ find employee
    const [rows] = await db.query(
      `SELECT * FROM employees
       WHERE email = ? LIMIT 1`,
      [email]
    );

    const employee = rows[0];

    if (!employee) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 2️⃣ check department (IMPORTANT)
    if (employee.departmentId !== SALES_DEPT_ID) {
      return res.status(403).json({ message: "Access denied for this portal" });
    }

    // 3️⃣ check active
    if (!employee.isActive) {
      return res.status(403).json({ message: "Employee is inactive" });
    }

    // 4️⃣ verify password
    if (!employee.password_hash) {
      return res.status(401).json({
        message:
          "No password set for this account. Ask your admin to set one via Edit Employee > Reset Password.",
      });
    }

    const isMatch = await bcrypt.compare(password, employee.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 5️⃣ generate sales token
    const token = jwt.sign(
      {
        employeeId: employee.id,
        employeeCode: employee.employeeCode,
        email: employee.email,
        role: "sales",
      },
      ENV.JWT_SECRET,
      { expiresIn: ENV.JWT_EXPIRES_IN }
    );

    return res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
      },
    });
  } catch (err) {
    console.error("Sales login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
