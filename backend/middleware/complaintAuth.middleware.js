import jwt from "jsonwebtoken";
import { ENV } from "../config/env.js";

export const complaintAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, ENV.JWT_SECRET);

    // 🔥 normalize for complaint system
    if (decoded.role === "hr") {
      req.complaintUser = {
        id: decoded.employee_id,
        role: "hr",
      };
    }

    // 👉 future ready (don’t break anything)
    else if (decoded.role === "client") {
      req.complaintUser = {
        id: decoded.client_id,
        role: "client",
      };
    }

    else if (decoded.role === "sales") {
      req.complaintUser = {
        id: decoded.sales_id,
        role: "sales",
      };
    }

    else if (decoded.role === "admin") {
      req.complaintUser = {
        id: decoded.admin_id,
        role: "admin",
      };
    }

    else {
      return res.status(401).json({ message: "Invalid role" });
    }

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};