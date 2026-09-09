import jwt from "jsonwebtoken";
import { db } from "../config/db.js";
import { ENV } from "../config/env.js";

export const clientUnifiedAuthMiddleware = async (req, res, next) => {
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
    // ===============================
    // ADMIN FLOW
    // ===============================
    if (decoded.role === "client_admin") {
      const [clients] = await db.query(
        `SELECT id, client_code, status
         FROM clients
         WHERE client_code = ?
         LIMIT 1`,
        [decoded.client_code]
      );

      if (!clients.length || clients[0].status !== "ACTIVE") {
        return res.status(403).json({
          success: false,
          message: "Client account inactive",
        });
      }

      req.client = {
        id: clients[0].id,  
        client_code: decoded.client_code,
        role: decoded.role,
      };

      return next();
    }

    // ===============================
    // EMPLOYEE FLOW
    // ===============================
    if (decoded.role === "CLIENT_EMPLOYEE") {
      const [rows] = await db.query(
        `SELECT id, client_id, isActive
         FROM client_employees
         WHERE id = ?
         LIMIT 1`,
        [decoded.employee_id]
      );

      if (!rows.length || !rows[0].isActive) {
        return res.status(403).json({
          success: false,
          message: "Employee inactive",
        });
      }

      req.employee = {
        employee_id: rows[0].id,
        client_id: rows[0].client_id,
        client_code: decoded.client_code,
        role: decoded.role,
      };

      return next();
    }

    // ===============================
    // UNKNOWN ROLE
    // ===============================
    return res.status(403).json({
      success: false,
      message: "Invalid role",
    });
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};
