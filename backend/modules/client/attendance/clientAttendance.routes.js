import express from "express";
import { protect } from "../../../middleware/auth.middleware.js";

import {
  createAttendance,
  listAttendance,
  updateAttendance,
  deleteAttendance,
} from "./clientAttendance.controller.js";

const router = express.Router();

// 🔐 IMPORTANT — must match your client admin auth
router.use(protect(["client_admin"]));

router.get("/", listAttendance);
router.post("/", createAttendance);
router.put("/:id", updateAttendance);
router.delete("/:id", deleteAttendance);

export default router;