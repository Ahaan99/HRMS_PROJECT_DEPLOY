import express from "express";
import { hrAuthMiddleware } from "../../../middleware/hrAuth.middleware.js";
import {
  getAttendance,
  checkIn,
  checkOut,
  getShiftTimings,
  saveShiftTimings
} from "./attendance.controller.js";

const router = express.Router();

router.use(hrAuthMiddleware);

// Attendance
router.get("/", getAttendance);

// Actions
router.post("/check-in", checkIn);
router.post("/check-out", checkOut);

// Settings
router.get("/shift-timings", getShiftTimings);
router.post("/shift-timings", saveShiftTimings);

export default router;