import jwt from "jsonwebtoken";
import { db } from "../config/db.js";
import { ENV } from "../config/env.js";

export const clientEmployeeAuthMiddleware = async (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Token missing",
      });
    }

    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, ENV.JWT_SECRET);

    // ✅ only allow employee tokens here
    if (decoded.role !== "CLIENT_EMPLOYEE") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Employee access required",
      });
    }

    // 🔍 verify employee still exists
    const [rows] = await db.query(
      `SELECT id, client_id, isActive
       FROM client_employees
       WHERE id = ?
       LIMIT 1`,
      [decoded.employee_id]
    );

    if (!rows.length || !rows[0].isActive) {
      return res.status(401).json({
        success: false,
        message: "Employee not active",
      });
    }

    // ✅ attach employee context
    req.employee = {
      employee_id: rows[0].id,
      client_id: rows[0].client_id,
      client_code: decoded.client_code,
      role: decoded.role,
    };

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

