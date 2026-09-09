import express from "express";
import jwt from "jsonwebtoken";
import { ENV } from "../../config/env.js";
import { askAI } from "./aiChat.controller.js";

const router = express.Router();

/*
  SECURITY FIX: /ask was completely unauthenticated, allowing anyone
  on the internet to consume the AI backend. Now requires a valid HRMS
  JWT from any portal (superadmin, HR, client, employee, sales).
*/
const anyPortalAuth = (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const decoded = jwt.verify(header.split(" ")[1], ENV.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

router.post("/ask", anyPortalAuth, askAI);

export default router;