import { db } from "../../config/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import {
  syncClientAttendanceToSuperAdmin,
  getClientAttendanceRow,
} from "../../modules/client/attendance/attendanceSync.service.js";

const getAttendance = asyncHandler(async (req, res) => {
  const { employee_id, date, status } = req.query;
  
  let query = `
    SELECT ca.*, ce.name as employee_name, ce.employeeCode
    FROM client_attendance ca
    JOIN client_employees ce ON ca.employee_id = ce.id
    WHERE ca.client_id = ?
  `;
  const params = [req.user.clientId];

  if (employee_id) {
    query += " AND ca.employee_id = ?";
    params.push(employee_id);
  }
  if (date) {
    query += " AND ca.attendance_date = ?";
    params.push(date);
  }
  if (status) {
    query += " AND ca.status = ?";
    params.push(status);
  }

  query += " ORDER BY ca.attendance_date DESC, ca.check_in DESC";

  const [rows] = await db.query(query, params);
  res.json({ success: true, data: rows });
});

const checkIn = asyncHandler(async (req, res) => {
  const { employee_id } = req.body;
  const today = new Date().toISOString().split("T")[0];
  const now = new Date();

  const [existing] = await db.query(
    "SELECT id FROM client_attendance WHERE employee_id = ? AND attendance_date = ?",
    [employee_id, today]
  );

  if (existing.length > 0) {
    return res.status(400).json({ success: false, message: "Already checked in today" });
  }

  const [schedule] = await db.query(
    "SELECT start_time, grace_minutes FROM work_schedules WHERE client_id = ? AND isActive = 1",
    [req.user.clientId]
  );

  let status = "PRESENT";
  if (schedule.length > 0) {
    const [hours, minutes] = schedule[0].start_time.split(":").map(Number);
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0);
    scheduledTime.setMinutes(scheduledTime.getMinutes() + schedule[0].grace_minutes);

    if (now > scheduledTime) {
      status = "PRESENT";
    }
  }

  const [result] = await db.query(
    `INSERT INTO client_attendance (client_id, employee_id, attendance_date, check_in, status)
     VALUES (?, ?, ?, ?, ?)`,
    [req.user.clientId, employee_id, today, now, status]
  );

  await db.query(
    "INSERT INTO attendance_logs (employee_id, log_type, log_time) VALUES (?, 'LOGIN', ?)",
    [employee_id, now]
  );

  // one-way sync into super_admin_attendance (fail-safe)
  const syncedRow = await getClientAttendanceRow(result.insertId);
  if (syncedRow) await syncClientAttendanceToSuperAdmin(syncedRow);

  res.json({ success: true, message: "Checked in successfully", data: { id: result.insertId } });
});

const checkOut = asyncHandler(async (req, res) => {
  const { employee_id } = req.body;
  const today = new Date().toISOString().split("T")[0];
  const now = new Date();

  const [attendance] = await db.query(
    "SELECT id, check_in FROM client_attendance WHERE employee_id = ? AND attendance_date = ?",
    [employee_id, today]
  );

  if (attendance.length === 0) {
    return res.status(400).json({ success: false, message: "No check-in record found" });
  }

  await db.query(
    "UPDATE client_attendance SET check_out = ? WHERE id = ?",
    [now, attendance[0].id]
  );

  await db.query(
    "INSERT INTO attendance_logs (employee_id, log_type, log_time) VALUES (?, 'LOGOUT', ?)",
    [employee_id, now]
  );

  // re-sync updated row into super_admin_attendance (fail-safe)
  const syncedRow = await getClientAttendanceRow(attendance[0].id);
  if (syncedRow) await syncClientAttendanceToSuperAdmin(syncedRow);

  res.json({ success: true, message: "Checked out successfully" });
});

const getWorkSchedule = asyncHandler(async (req, res) => {
  const [rows] = await db.query(
    "SELECT * FROM work_schedules WHERE client_id = ? AND isActive = 1",
    [req.user.clientId]
  );
  res.json({ success: true, data: rows });
});

const updateWorkSchedule = asyncHandler(async (req, res) => {
  const { shift_name, start_time, end_time, lunch_start, lunch_end, grace_minutes } = req.body;

  await db.query(
    "UPDATE work_schedules SET isActive = 0 WHERE client_id = ?",
    [req.user.clientId]
  );

  const [result] = await db.query(
    `INSERT INTO work_schedules (client_id, shift_name, start_time, end_time, lunch_start, lunch_end, grace_minutes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [req.user.clientId, shift_name, start_time, end_time, lunch_start, lunch_end, grace_minutes || 15]
  );

  res.json({ success: true, message: "Work schedule updated", data: { id: result.insertId } });
});

export { getAttendance, checkIn, checkOut, getWorkSchedule, updateWorkSchedule };
