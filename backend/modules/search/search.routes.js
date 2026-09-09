import express from "express";
import { verifyToken } from "../../utils/jwt.js";
import { clientAuthMiddleware } from "../../middleware/clientAuth.middleware.js";
import { advancedSearch, searchFilters, clientEmployeeSearch } from "./search.controller.js";

/* Accept either a SUPER_ADMIN token or an HR-portal token (same JWT secret) */
const adminOrHr = (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const decoded = verifyToken(header.split(" ")[1]);
    const role = (decoded.role || "").toUpperCase();
    const isHrToken = Boolean(decoded.employee_id); // HR portal token shape
    if (role !== "SUPER_ADMIN" && role !== "HR" && !isHrToken) {
      return res.status(403).json({ success: false, message: "Access Denied" });
    }
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
};

/* Admin + HR portals */
export const searchRouter = express.Router();
searchRouter.get("/advanced", adminOrHr, advancedSearch);
searchRouter.get("/filters", adminOrHr, searchFilters);

/* Client portal (scoped to the logged-in client) */
export const clientSearchRouter = express.Router();
clientSearchRouter.get("/employees", clientAuthMiddleware, clientEmployeeSearch);
