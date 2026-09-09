import { db } from "../../../config/db.js";

const toSec = (t) => {
  const [h = 0, m = 0, s = 0] = String(t || "0:0:0").split(":").map(Number);
  return h * 3600 + m * 60 + s;
};

const normalize = (r) => ({
  id: r.id,
  name: r.name,
  checkInStart: r.check_in_start,
  checkInEnd: r.check_in_end,
  checkOutStart: r.check_out_start,
  checkOutEnd: r.check_out_end,
  graceMinutes: Number(r.grace_minutes ?? 0),
});

/**
 * The shift an employee is judged against, in priority order:
 *   1. the shift assigned to them (employees.shift_id)
 *   2. the first configured shift (company default)
 *   3. the legacy login_settings row (installs with no shifts yet)
 */
export const resolveShiftForEmployee = async (employeeId) => {
  if (employeeId) {
    const [[assigned]] = await db.query(
      `SELECT s.* FROM employees e JOIN shift_timings s ON s.id = e.shift_id WHERE e.id = ?`,
      [employeeId],
    );
    if (assigned) return normalize(assigned);
  }

  const [[first]] = await db.query(`SELECT * FROM shift_timings ORDER BY id ASC LIMIT 1`);
  if (first) return normalize(first);

  const [[ls]] = await db.query(
    `SELECT default_login_time, default_logout_time, grace_period FROM login_settings LIMIT 1`,
  );
  if (ls?.default_login_time) {
    return {
      id: null,
      name: "Default",
      checkInStart: ls.default_login_time,
      checkInEnd: ls.default_login_time,
      checkOutStart: ls.default_logout_time,
      checkOutEnd: ls.default_logout_time,
      graceMinutes: Number(ls.grace_period ?? 0),
    };
  }
  return null;
};

/** PRESENT while the login window is open (plus grace); LATE after that. */
export const checkInStatus = (shift, nowHHMMSS) => {
  if (!shift) return "PRESENT";
  const deadline = toSec(shift.checkInEnd) + shift.graceMinutes * 60;
  return toSec(nowHHMMSS) > deadline ? "LATE" : "PRESENT";
};
