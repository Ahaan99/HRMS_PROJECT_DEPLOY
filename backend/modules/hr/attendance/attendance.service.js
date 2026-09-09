import { db } from "../../../config/db.js";
import { resolveShiftForEmployee, checkInStatus } from "./shift.helper.js";

export const getAttendance = async (req) => { 
  const { date, status, search, department } = req.query; // ✅ added department

  const selectedDate = date || new Date().toISOString().split("T")[0];

  let query = `
    SELECT 
      e.id,
      e.employeeCode,
      e.name AS employee,
      d.name AS department,

      ls.default_login_time AS expectedLogin,
      a.check_in AS actualLogin,

      ls.default_logout_time AS expectedLogout,
      a.check_out AS actualLogout,

      IFNULL(
        ROUND(TIMESTAMPDIFF(MINUTE, a.check_in, a.check_out)/60, 2),
        0
      ) AS hours,

      CASE 
        WHEN a.status = 'PRESENT' THEN 'present'
        WHEN a.status = 'ABSENT' THEN 'absent'
        WHEN a.status = 'LATE' THEN 'late'
        WHEN a.status = 'HALF_DAY' THEN 'half_day'
        WHEN a.status = 'LEAVE' THEN 'on_leave'
        WHEN a.status = 'WFH' THEN 'wfh'
        ELSE 'absent'
      END AS status

    FROM employees e

    LEFT JOIN super_admin_attendance a 
      ON e.id = a.employee_id 
      AND a.date = ?

    LEFT JOIN departments d 
      ON e.departmentId = d.id

    LEFT JOIN login_settings ls 
      ON 1=1

    WHERE e.isActive = 1
  `;

  const params = [selectedDate];

  // 🔍 SEARCH
  if (search) {
    query += ` AND (e.name LIKE ? OR e.employeeCode LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  // 🎯 STATUS FILTER
  if (status) {
    query += ` AND a.status = ?`;
    params.push(status.toUpperCase());
  }

  // 🔥 DEPARTMENT FILTER (THIS WAS MISSING)
  if (department) {
    query += ` AND e.departmentId = ?`;   // ✅ use ID
    params.push(department);
  }

  query += ` ORDER BY e.name ASC`;

  const [rows] = await db.query(query, params);

  return rows;
};


/* =========================================
CHECK-IN
========================================= */
export const checkIn = async (req) => {
  const { employee_id } = req.body;

  const today = new Date().toISOString().split("T")[0];
  const now = new Date().toTimeString().slice(0, 8);

  const [existing] = await db.query(
    "SELECT id FROM super_admin_attendance WHERE employee_id=? AND date=?",
    [employee_id, today]
  );

  if (existing.length) {
    throw new Error("Already checked in today");
  }

  const shift = await resolveShiftForEmployee(employee_id);
  await db.query(
    `INSERT INTO super_admin_attendance
     (employee_id, employee_name, date, check_in, status, shift_id)
     SELECT id, name, ?, ?, ?, ?
     FROM employees WHERE id=?`,
    [today, now, checkInStatus(shift, now), shift?.id ?? null, employee_id]
  );
};

/* =========================================
CHECK-OUT
========================================= */
export const checkOut = async (req) => {
  const { employee_id } = req.body;

  const today = new Date().toISOString().split("T")[0];
  const now = new Date().toTimeString().slice(0, 8);

  const [rows] = await db.query(
    "SELECT id FROM super_admin_attendance WHERE employee_id=? AND date=?",
    [employee_id, today]
  );

  if (!rows.length) {
    throw new Error("No check-in found");
  }

  await db.query(
    "UPDATE super_admin_attendance SET check_out=? WHERE id=?",
    [now, rows[0].id]
  );
};

/* =========================================
SHIFT TIMINGS (LOGIN SETTINGS)
========================================= */
const toHHMM = (t) => (t ? String(t).slice(0, 5) : "");

export const getShiftTimings = async () => {
  const [rows] = await db.query(
    `SELECT * FROM shift_timings ORDER BY id ASC`
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    checkInStart: toHHMM(r.check_in_start),
    checkInEnd: toHHMM(r.check_in_end),
    checkOutStart: toHHMM(r.check_out_start),
    checkOutEnd: toHHMM(r.check_out_end),
    graceMinutes: r.grace_minutes,
  }));
};

export const saveShiftTimings = async (shifts) => {
  if (!Array.isArray(shifts)) {
    throw new Error("Shifts must be an array");
  }

  const isTime = (t) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t || "");

  for (const s of shifts) {
    if (!s.name || !String(s.name).trim()) {
      throw new Error("Each shift needs a name");
    }
    for (const k of ["checkInStart", "checkInEnd", "checkOutStart", "checkOutEnd"]) {
      if (!isTime(s[k])) {
        throw new Error(`Invalid time for ${k} in shift "${s.name}"`);
      }
    }
    const grace = Number(s.graceMinutes);
    if (!Number.isInteger(grace) || grace < 0 || grace > 120) {
      throw new Error(`Invalid grace period in shift "${s.name}"`);
    }
  }

  const [existingRows] = await db.query(`SELECT id FROM shift_timings`);
  const existingIds = new Set(existingRows.map((r) => r.id));
  const keptIds = [];

  for (const s of shifts) {
    const values = [
      String(s.name).trim(),
      s.checkInStart,
      s.checkInEnd,
      s.checkOutStart,
      s.checkOutEnd,
      Number(s.graceMinutes),
    ];
    const id = Number(s.id);
    if (Number.isInteger(id) && existingIds.has(id)) {
      await db.query(
        `UPDATE shift_timings
         SET name=?, check_in_start=?, check_in_end=?, check_out_start=?, check_out_end=?, grace_minutes=?
         WHERE id=?`,
        [...values, id]
      );
      keptIds.push(id);
    } else {
      const [ins] = await db.query(
        `INSERT INTO shift_timings
          (name, check_in_start, check_in_end, check_out_start, check_out_end, grace_minutes)
         VALUES (?,?,?,?,?,?)`,
        values
      );
      keptIds.push(ins.insertId);
    }
  }

  const removedIds = [...existingIds].filter((id) => !keptIds.includes(id));
  if (removedIds.length) {
    await db.query(`UPDATE employees SET shift_id = NULL WHERE shift_id IN (?)`, [removedIds]);
    await db.query(`DELETE FROM shift_timings WHERE id IN (?)`, [removedIds]);
  }

  /* keep login_settings defaults in sync with the first shift */
  if (shifts.length > 0) {
    const first = shifts[0];
    const [existing] = await db.query(`SELECT id FROM login_settings LIMIT 1`);
    if (existing.length) {
      await db.query(
        `UPDATE login_settings
         SET default_login_time=?, default_logout_time=?, grace_period=?
         WHERE id=?`,
        [first.checkInStart, first.checkOutStart, Number(first.graceMinutes), existing[0].id]
      );
    } else {
      await db.query(
        `INSERT INTO login_settings (default_login_time, default_logout_time, grace_period)
         VALUES (?,?,?)`,
        [first.checkInStart, first.checkOutStart, Number(first.graceMinutes)]
      );
    }
  }

  return getShiftTimings();
};