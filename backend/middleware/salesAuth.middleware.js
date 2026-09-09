import jwt from "jsonwebtoken";
import { ENV } from "../config/env.js";

export const requireSalesAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, ENV.JWT_SECRET);

    req.salesUser = decoded; // 🔥 contains employeeId

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
