import { asyncHandler } from "../../../utils/asyncHandler.js";
import * as service from "./attendance.service.js";

/* =========================================
GET ATTENDANCE
========================================= */
export const getAttendance = asyncHandler(async (req, res) => {
  const data = await service.getAttendance(req);

  res.json({
    success: true,
    data,
  });
});

/* =========================================
CHECK-IN
========================================= */
export const checkIn = asyncHandler(async (req, res) => {
  await service.checkIn(req);

  res.json({
    success: true,
    message: "Checked in successfully",
  });
});

/* =========================================
CHECK-OUT
========================================= */
export const checkOut = asyncHandler(async (req, res) => {
  await service.checkOut(req);

  res.json({
    success: true,
    message: "Checked out successfully",
  });
});

/* =========================================
SHIFT TIMINGS (GLOBAL SETTINGS)
========================================= */
export const getShiftTimings = asyncHandler(async (req, res) => {
  const data = await service.getShiftTimings();

  res.json({
    success: true,
    data,
  });
});

export const saveShiftTimings = asyncHandler(async (req, res) => {
  const shifts = Array.isArray(req.body) ? req.body : req.body?.shifts;
  const data = await service.saveShiftTimings(shifts || []);

  res.json({
    success: true,
    message: "Shift timings saved",
    data,
  });
});