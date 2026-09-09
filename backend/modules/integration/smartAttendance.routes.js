import express from "express";
import { db } from "../../config/db.js";

/*
  Smart_Attendance -> HRMS integration receiver.

  Smart_Attendance (Flask, port 5000) pushes verified punches
  (face / OTP+GPS / WiFi) here. Records are upserted into
  super_admin_attendance keyed by (employee_id, date), matching
  the employee via employees.employeeCode === Smart emp_id.

  Auth: shared key in the x-integration-key header, configured as
  SMART_ATTENDANCE_KEY in the HRMS backend .env.
*/

const router = express.Router();

const VALID_STATUS = new Set(["PRESENT", "LATE", "HALF_DAY", "ABSENT", "LEAVE", "WFH"]);

router.post("/smart-attendance", async (req, res) => {
  try {
    const configured = process.env.SMART_ATTENDANCE_KEY;
    if (!configured) {
      return res.status(503).json({
        success: false,
        message: "SMART_ATTENDANCE_KEY not set in HRMS .env",
      });
    }
    if (req.headers["x-integration-key"] !== configured) {
      return res.status(401).json({ success: false, message: "Invalid integration key" });
    }

    const {
      employeeCode,
      date,
      check_in = null,
      check_out = null,
      status = "PRESENT",
      employee_name = "",
    } = req.body || {};

    if (!employeeCode || !date) {
      return res
        .status(400)
        .json({ success: false, message: "employeeCode and date required" });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date))) {
      return res.status(400).json({ success: false, message: "date must be YYYY-MM-DD" });
    }
    const timeRe = /^\d{2}:\d{2}(:\d{2})?$/;
    const checkIn = check_in && timeRe.test(String(check_in)) ? String(check_in) : null;
    const checkOut = check_out && timeRe.test(String(check_out)) ? String(check_out) : null;
    const safeStatus = VALID_STATUS.has(String(status)) ? String(status) : "PRESENT";

    const [emps] = await db.query(
      "SELECT id, name FROM employees WHERE employeeCode = ? AND isActive = 1 LIMIT 1",
      [String(employeeCode)]
    );
    if (!emps.length) {
      return res.status(404).json({
        success: false,
        message: `No active HRMS employee with employeeCode '${employeeCode}'`,
      });
    }
    const employeeId = emps[0].id;
    const employeeName = emps[0].name || String(employee_name).slice(0, 100);

    const [existing] = await db.query(
      "SELECT id FROM super_admin_attendance WHERE employee_id = ? AND date = ? LIMIT 1",
      [employeeId, date]
    );

    if (existing.length) {
      await db.query(
        `UPDATE super_admin_attendance
           SET check_in  = COALESCE(?, check_in),
               check_out = COALESCE(?, check_out),
               status    = ?
         WHERE id = ?`,
        [checkIn, checkOut, safeStatus, existing[0].id]
      );
      return res.json({ success: true, action: "updated", id: existing[0].id });
    }

    const [r] = await db.query(
      `INSERT INTO super_admin_attendance
         (employee_id, employee_name, date, check_in, check_out, status)
       VALUES (?,?,?,?,?,?)`,
      [employeeId, employeeName, date, checkIn, checkOut, safeStatus]
    );
    return res.json({ success: true, action: "created", id: r.insertId });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

/* Health check so Smart_Attendance admins can test connectivity */
router.get("/smart-attendance/health", (req, res) => {
  const keyOk = Boolean(process.env.SMART_ATTENDANCE_KEY);
  res.json({
    success: true,
    ready: keyOk,
    message: keyOk ? "Integration ready" : "Set SMART_ATTENDANCE_KEY in .env",
  });
});

export default router;
