import { db } from "../../../config/db.js";
import {
  getClientAttendanceRow,
  syncClientAttendanceToSuperAdmin,
  removeClientSyncedAttendance,
} from "./attendanceSync.service.js";

const STATUSES = ["PRESENT", "ABSENT", "HALF_DAY", "LEAVE"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

const httpError = (status, message) => Object.assign(new Error(message), { status });

// ===============================
// helpers
// ===============================
const getClientId = async (client_code) => {
  const [rows] = await db.query(
    `SELECT id FROM clients WHERE client_code = ? LIMIT 1`,
    [client_code],
  );
  if (!rows.length) throw httpError(404, "Client not found");
  return rows[0].id;
};

// Only this tenant's employees may be logged against.
const assertOwnEmployee = async (client_id, employee_id) => {
  const id = Number(employee_id);
  if (!Number.isInteger(id) || id <= 0) throw httpError(400, "Please select an employee");

  const [rows] = await db.query(
    `SELECT id FROM client_employees WHERE id = ? AND client_id = ? LIMIT 1`,
    [id, client_id],
  );
  if (!rows.length) throw httpError(400, "Employee not found for this client");
  return id;
};

const normalizeDate = (value) => {
  const s = String(value ?? "").trim().slice(0, 10);
  if (!DATE_RE.test(s)) throw httpError(400, "Attendance date is required (YYYY-MM-DD)");
  return s;
};

const normalizeStatus = (value, fallback = "PRESENT") => {
  if (value === undefined || value === null || value === "") return fallback;
  const s = String(value).trim().toUpperCase().replace(/\s+/g, "_");
  if (!STATUSES.includes(s)) throw httpError(400, `Status must be one of ${STATUSES.join(", ")}`);
  return s;
};

// "HH:MM" | "HH:MM:SS" | "YYYY-MM-DD HH:MM:SS" | "" | null  ->  "HH:MM:SS" | null
const timePart = (value, label) => {
  if (value === undefined || value === null) return null;
  let s = String(value).trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}[ T]/.test(s)) s = s.slice(11, 19);
  if (!TIME_RE.test(s)) throw httpError(400, `${label} must be a valid time (HH:MM)`);
  return s.length === 5 ? `${s}:00` : s;
};

// Blank times become NULL instead of '' (which MySQL rejects for DATETIME).
const toDateTime = (date, time) => (time ? `${date} ${time}` : null);

const friendlyDbError = (err, date) => {
  if (err?.code === "ER_DUP_ENTRY") {
    return httpError(409, `Attendance for this employee on ${date} already exists. Edit the existing record instead.`);
  }
  if (err?.code === "ER_NO_REFERENCED_ROW_2") {
    return httpError(400, "Employee not found for this client");
  }
  return err;
};

// ===============================
// CREATE
// ===============================
export const createAttendanceService = async (client_code, payload = {}) => {
  const client_id = await getClientId(client_code);

  const employee_id = await assertOwnEmployee(client_id, payload.employee_id);
  const attendance_date = normalizeDate(payload.attendance_date);
  const status = normalizeStatus(payload.status);
  const check_in = toDateTime(attendance_date, timePart(payload.check_in, "Check-in"));
  const check_out = toDateTime(attendance_date, timePart(payload.check_out, "Check-out"));
  const remarks = payload.remarks ? String(payload.remarks).trim() || null : null;

  let result;
  try {
    [result] = await db.query(
      `INSERT INTO client_attendance
       (client_id, employee_id, attendance_date, check_in, check_out, status, remarks)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [client_id, employee_id, attendance_date, check_in, check_out, status, remarks],
    );
  } catch (err) {
    throw friendlyDbError(err, attendance_date);
  }

  // one-way sync: client -> super_admin_attendance (fail-safe)
  await syncClientAttendanceToSuperAdmin({
    client_id,
    employee_id,
    attendance_date,
    check_in,
    check_out,
    status,
  });

  return result.insertId;
};

// ===============================
// LIST
// ===============================
export const listAttendanceService = async (client_code) => {
  const client_id = await getClientId(client_code);

  const [rows] = await db.query(
    `SELECT
        a.*,
        e.name AS employeeName,
        e.employeeCode
     FROM client_attendance a
     LEFT JOIN client_employees e ON a.employee_id = e.id
     WHERE a.client_id = ?
     ORDER BY a.attendance_date DESC, a.id DESC`,
    [client_id],
  );

  return rows;
};

// ===============================
// UPDATE (whitelisted fields, merged over the existing row)
// ===============================
export const updateAttendanceService = async (client_code, id, payload = {}) => {
  const client_id = await getClientId(client_code);

  const [existingRows] = await db.query(
    `SELECT * FROM client_attendance WHERE id = ? AND client_id = ? LIMIT 1`,
    [Number(id), client_id],
  );
  if (!existingRows.length) throw httpError(404, "Attendance record not found");
  const existing = existingRows[0];

  const has = (key) => Object.prototype.hasOwnProperty.call(payload, key) && payload[key] !== undefined;

  const employee_id = has("employee_id")
    ? await assertOwnEmployee(client_id, payload.employee_id)
    : existing.employee_id;

  const attendance_date = has("attendance_date")
    ? normalizeDate(payload.attendance_date)
    : normalizeDate(existing.attendance_date);

  const status = normalizeStatus(has("status") ? payload.status : existing.status, existing.status);

  // A time sent as "" clears the value; an omitted key keeps the stored time
  // (re-anchored to the possibly changed date).
  const check_in = toDateTime(
    attendance_date,
    timePart(has("check_in") ? payload.check_in : existing.check_in, "Check-in"),
  );
  const check_out = toDateTime(
    attendance_date,
    timePart(has("check_out") ? payload.check_out : existing.check_out, "Check-out"),
  );

  const remarks = has("remarks")
    ? (String(payload.remarks ?? "").trim() || null)
    : existing.remarks;

  try {
    await db.query(
      `UPDATE client_attendance
       SET employee_id = ?, attendance_date = ?, check_in = ?, check_out = ?, status = ?, remarks = ?
       WHERE id = ? AND client_id = ?`,
      [employee_id, attendance_date, check_in, check_out, status, remarks, existing.id, client_id],
    );
  } catch (err) {
    throw friendlyDbError(err, attendance_date);
  }

  // employee/date changed -> drop the old mirror row, then re-sync the new state
  if (employee_id !== existing.employee_id || attendance_date !== String(existing.attendance_date).slice(0, 10)) {
    await removeClientSyncedAttendance(existing);
  }
  const updatedRow = await getClientAttendanceRow(existing.id);
  if (updatedRow && updatedRow.client_id === client_id) {
    await syncClientAttendanceToSuperAdmin(updatedRow);
  }

  return updatedRow;
};

// ===============================
// DELETE
// ===============================
export const deleteAttendanceService = async (client_code, id) => {
  const client_id = await getClientId(client_code);

  // capture the row before deleting so we can clean up the synced copy
  const rowToDelete = await getClientAttendanceRow(Number(id));
  if (!rowToDelete || rowToDelete.client_id !== client_id) {
    throw httpError(404, "Attendance record not found");
  }

  await db.query(
    `DELETE FROM client_attendance
     WHERE id = ? AND client_id = ?`,
    [rowToDelete.id, client_id],
  );

  // remove the CLIENT-sourced mirror row (fail-safe, never touches
  // GEO / SMART / Admin / HR records)
  await removeClientSyncedAttendance(rowToDelete);
};
