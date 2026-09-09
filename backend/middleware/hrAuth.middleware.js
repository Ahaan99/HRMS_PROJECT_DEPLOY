import jwt from "jsonwebtoken";
import {ENV} from "../config/env.js";
export const hrAuthMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, ENV.JWT_SECRET);

    // 🔥 HR identity
    req.employee = {
      id: decoded.employee_id,
      code: decoded.employee_code,
      role: decoded.role,
    };

    next();
  } catch (err) {
    console.error("HR auth error:", err);
    return res
      .status(401)
      .json({ success: false, message: "Invalid token" });
  }
};