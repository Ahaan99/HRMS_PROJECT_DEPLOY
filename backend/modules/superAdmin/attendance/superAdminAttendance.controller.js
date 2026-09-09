import { db } from "../../../config/db.js";

const VALID_STATUSES = [
  "PRESENT",
  "ABSENT",
  "LATE",
  "HALF_DAY",
  "WFH",
  "LEAVE",
];

const normalizeStatus = (status) => {
  if (!status) return null;
  const s = String(status).trim().toUpperCase().replace(/\s+/g, "_");
  return VALID_STATUSES.includes(s) ? s : null;
};

/* =========================================
GET ALL ATTENDANCE
========================================= */
export const getAllAttendance = async (req, res) => {
  try {
    const { search = "", status = "" } = req.query;

    // Internal attendance + client-portal attendance in a single feed.
    // Client rows are tagged with source='client' and the client_code so the
    // tracker can show where they came from.
    let query = `
      SELECT * FROM (
        SELECT a.id, a.employee_id, a.date, a.check_in, a.check_out, a.status,
               a.method, a.geo_status, a.created_at, a.updated_at,
               LOWER(COALESCE(a.source, 'internal')) AS source, a.client_id,
               NULL AS client_code,
               e.employeeCode, COALESCE(e.name, a.employee_name) AS name
          FROM super_admin_attendance a
          LEFT JOIN employees e ON a.employee_id = e.id
        UNION ALL
        SELECT ca.id, ca.employee_id, ca.attendance_date AS date,
               ca.check_in, ca.check_out, UPPER(ca.status) AS status,
               'client_portal' AS method, NULL AS geo_status,
               ca.createdAt AS created_at, ca.updatedAt AS updated_at,
               'client' AS source, ca.client_id, c.client_code,
               ce.employeeCode, ce.name
          FROM client_attendance ca
          LEFT JOIN client_employees ce ON ce.id = ca.employee_id
          LEFT JOIN clients c ON c.id = ca.client_id
      ) t
      WHERE 1=1
    `;

    const params = [];

    if (search) {
      query += ` AND (t.name LIKE ? OR t.employeeCode LIKE ? OR t.client_code LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const normalizedFilter = normalizeStatus(status);
    if (normalizedFilter) {
      query += ` AND t.status = ?`;
      params.push(normalizedFilter);
    }

    query += ` ORDER BY t.date DESC, t.created_at DESC`;

    const [rows] = await db.query(query, params);

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* =========================================
GET EMPLOYEES (FOR DROPDOWN 🔥)
========================================= */
export const getEmployeesList = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, employeeCode, name 
      FROM employees 
      WHERE isActive = 1
      ORDER BY name ASC
    `);

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* =========================================
CREATE
========================================= */
export const createAttendance = async (req, res) => {
  try {
    const {
      employee_id,
      date,
      check_in,
      check_out,
    } = req.body;

    const status = normalizeStatus(req.body.status) || "PRESENT";

    await db.query(
      `INSERT INTO super_admin_attendance 
      (employee_id, employee_name, date, check_in, check_out, status)
      SELECT id, name, ?, ?, ?, ?
      FROM employees
      WHERE id = ?`,
      [date, check_in, check_out, status, employee_id]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* =========================================
UPDATE
========================================= */
export const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { check_in, check_out, is_active, date, employee_name } = req.body;

    const status = normalizeStatus(req.body.status);

    const sets = ["check_in=?", "check_out=?", "is_active=?"];
    const params = [check_in, check_out, is_active];

    if (status) {
      sets.push("status=?");
      params.push(status);
    }

    if (date) {
      sets.push("date=?");
      params.push(date);
    }
    if (employee_name) {
      sets.push("employee_name=?");
      params.push(employee_name);
    }

    params.push(id);

    await db.query(
      `UPDATE super_admin_attendance 
       SET ${sets.join(", ")}
       WHERE id=?`,
      params
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* =========================================
DELETE
========================================= */
export const deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      `DELETE FROM super_admin_attendance WHERE id=?`,
      [id]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};