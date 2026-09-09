import jwt from "jsonwebtoken";
import { db } from "../config/db.js";
import { ENV } from "../config/env.js";

export const clientAuthMiddleware = async (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Token missing",
      });
    }

    const token = header.split(" ")[1];

    // verify token
    const decoded = jwt.verify(token, ENV.JWT_SECRET);
    if (decoded.role !== "client_admin") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Admin access required",
      });
    }

    // extra safety — ensure client still active
    const [clients] = await db.query(
      `SELECT client_code, status
       FROM clients
       WHERE client_code = ?
       LIMIT 1`,
      [decoded.client_code],
    );

    if (!clients.length) {
      return res.status(401).json({
        success: false,
        message: "Client not found",
      });
    }

    if (clients[0].status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "Client account inactive",
      });
    }

    // attach to request (VERY IMPORTANT)
    req.client = {
      id: decoded.id,
      client_code: decoded.client_code,
      role: decoded.role,
    };

    next();
  } catch (error) {
    console.log(`${error}`);
    return res.status(401).json({
      success: false,
      message: `Invalid or expired token `,
    });
  }
};
