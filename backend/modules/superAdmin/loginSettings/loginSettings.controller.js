import { db } from "../../../config/db.js";

/* =========================================
GET ALL SETTINGS
========================================= */
export const getLoginSettings = async (req, res) => {
  try {
    // GLOBAL
    const [global] = await db.query(`SELECT * FROM login_settings LIMIT 1`);

    // EMPLOYEE SETTINGS (JOIN)
    const [employees] = await db.query(`
      SELECT e.id, e.employeeCode, e.name, d.name as department,
      e.shift_id, s.name AS shift_name,
      els.login_time, els.logout_time, els.is_custom, els.is_flexible,
      els.flexi_start_time, els.flexi_end_time, els.updated_at
      FROM employees e
      LEFT JOIN departments d ON e.departmentId = d.id
      LEFT JOIN employee_login_settings els ON e.id = els.employee_id
      LEFT JOIN shift_timings s ON s.id = e.shift_id
      WHERE e.isActive = 1
    `);

    res.json({
      success: true,
      global: global[0] || {},
      employeeSettings: employees,
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


/* =========================================
UPDATE GLOBAL SETTINGS
========================================= */
export const updateGlobalSettings = async (req, res) => {
  try {
    const data = req.body;

    const [existing] = await db.query(`SELECT id FROM login_settings LIMIT 1`);

    if (existing.length) {
      await db.query(
        `UPDATE login_settings SET
        default_login_time=?,
        default_logout_time=?,
        grace_period=?,
        late_threshold=?,
        allow_late_login=?,
        allow_early_logout=?,
        overtime_approval_required=?,
        flexi_hours_enabled=?,
        flexi_start_time=?,
        flexi_end_time=?`,
        [
          data.defaultLoginTime,
          data.defaultLogoutTime,
          data.gracePeriod,
          data.lateThreshold,
          data.allowLateLogin,
          data.allowEarlyLogout,
          data.overtimeApprovalRequired,
          data.flexiHoursEnabled,
          data.flexiStartTime,
          data.flexiEndTime,
        ]
      );
    } else {
      await db.query(
        `INSERT INTO login_settings 
        (default_login_time, default_logout_time, grace_period, late_threshold,
         allow_late_login, allow_early_logout, overtime_approval_required,
         flexi_hours_enabled, flexi_start_time, flexi_end_time)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.defaultLoginTime,
          data.defaultLogoutTime,
          data.gracePeriod,
          data.lateThreshold,
          data.allowLateLogin,
          data.allowEarlyLogout,
          data.overtimeApprovalRequired,
          data.flexiHoursEnabled,
          data.flexiStartTime,
          data.flexiEndTime,
        ]
      );
    }

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


/* =========================================
SAVE EMPLOYEE SETTINGS
========================================= */
export const saveEmployeeSettings = async (req, res) => {
  try {
    const { employee_id, loginTime, logoutTime, isFlexible, flexiStartTime, flexiEndTime, notes } = req.body;

    const [existing] = await db.query(
      `SELECT id FROM employee_login_settings WHERE employee_id=?`,
      [employee_id]
    );

    if (existing.length) {
      await db.query(
        `UPDATE employee_login_settings SET
        login_time=?, logout_time=?, is_custom=1, is_flexible=?,
        flexi_start_time=?, flexi_end_time=?, notes=?
        WHERE employee_id=?`,
        [loginTime, logoutTime, isFlexible, flexiStartTime, flexiEndTime, notes, employee_id]
      );
    } else {
      await db.query(
        `INSERT INTO employee_login_settings
        (employee_id, login_time, logout_time, is_custom, is_flexible, flexi_start_time, flexi_end_time, notes)
        VALUES (?, ?, ?, 1, ?, ?, ?, ?)`,
        [employee_id, loginTime, logoutTime, isFlexible, flexiStartTime, flexiEndTime, notes]
      );
    }

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* =========================================
TODAY LOGS
========================================= */
export const getTodayLogs = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT a.*, e.name, e.employeeCode
      FROM super_admin_attendance a
      JOIN employees e ON e.id = a.employee_id
      WHERE a.date = CURDATE()
    `);

    res.json({ success: true, data: rows });

  } catch (err) {
    res.status(500).json({ success: false,  message: err.message  });
  }
};

/* =========================================
HISTORY
========================================= */
export const getHistory = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT a.*, e.name, e.employeeCode
      FROM super_admin_attendance a
      JOIN employees e ON e.id = a.employee_id
      ORDER BY a.date DESC
    `);

    res.json({ success: true, data: rows });

  } catch (err) {
    res.status(500).json({ success: false,  message: err.message });
  }
};

/* =========================================
SHIFTS (read-only here; edited by IT/HR under Automated Attendance)
========================================= */
const hhmm = (t) => (t ? String(t).slice(0, 5) : "");

export const getShifts = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT s.*, COUNT(e.id) AS assigned_count
      FROM shift_timings s
      LEFT JOIN employees e ON e.shift_id = s.id AND e.isActive = 1
      GROUP BY s.id
      ORDER BY s.id ASC
    `);
    const [[{ unassigned }]] = await db.query(
      `SELECT COUNT(*) AS unassigned FROM employees WHERE isActive = 1 AND shift_id IS NULL`
    );
    res.json({
      success: true,
      unassigned,
      data: rows.map((r) => ({
        id: r.id,
        name: r.name,
        check_in_start: hhmm(r.check_in_start),
        check_in_end: hhmm(r.check_in_end),
        check_out_start: hhmm(r.check_out_start),
        check_out_end: hhmm(r.check_out_end),
        grace_minutes: r.grace_minutes,
        assigned_count: r.assigned_count,
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const assignEmployeeShift = async (req, res) => {
  try {
    const employeeId = Number(req.params.id);
    const raw = req.body?.shift_id;
    const shiftId = raw === null || raw === undefined || raw === "" ? null : Number(raw);

    if (!Number.isInteger(employeeId) || (shiftId !== null && !Number.isInteger(shiftId))) {
      return res.status(400).json({ success: false, message: "Invalid employee or shift id" });
    }
    if (shiftId !== null) {
      const [[shift]] = await db.query(`SELECT id FROM shift_timings WHERE id = ?`, [shiftId]);
      if (!shift) return res.status(404).json({ success: false, message: "Shift not found" });
    }

    const [r] = await db.query(`UPDATE employees SET shift_id = ? WHERE id = ? AND isActive = 1`, [shiftId, employeeId]);
    if (!r.affectedRows) return res.status(404).json({ success: false, message: "Employee not found" });

    res.json({ success: true, shift_id: shiftId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
