import { db } from "../../../config/db.js";

/* =========================================
GET ASSIGNMENTS (HR specific)
========================================= */
export const getAssignments = async (req, res) => {
  try {
    const clientCode =
      req.client?.client_code || req.employee?.client_code;

    if (!clientCode) {
      return res.status(401).json({ success: false });
    }

    const [clientRows] = await db.query(
      `SELECT id FROM clients WHERE client_code = ? LIMIT 1`,
      [clientCode]
    );

    const clientId = clientRows[0].id;

    const { status, priority } = req.query;

    let query = `
      SELECT 
        t.*,
        e.name AS employee_name,
        e.employeeCode,
        d.name AS department_name
      FROM client_work_assignments t
      JOIN client_employees e ON e.id = t.employee_id
      LEFT JOIN departments d ON d.id = e.departmentId
      WHERE t.client_id = ?
    `;

    const params = [clientId];

    // ✅ employee → only own data
    if (req.employee) {
      query += " AND t.employee_id = ?";
      params.push(req.employee.employee_id);
    }

    if (status) {
      query += " AND t.status = ?";
      params.push(status);
    }

    if (priority) {
      query += " AND t.priority = ?";
      params.push(priority);
    }

    query += " ORDER BY t.created_at DESC";

    const [rows] = await db.query(query, params);

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("GET ASSIGNMENTS ERROR:", err);
    res.status(500).json({ success: false });
  }
};

/* =========================================
CREATE ASSIGNMENT
========================================= */
export const createAssignment = async (req, res) => {
  try {
    const clientCode = req.client?.client_code;

    if (!clientCode) {
      return res.status(403).json({ success: false });
    }

    const [clientRows] = await db.query(
      `SELECT id FROM clients WHERE client_code = ? LIMIT 1`,
      [clientCode],
    );

    const clientId = clientRows[0].id;

    const { title, employeeId, targetValue, unit, deadline, priority } =
      req.body;

    await db.query(
      `INSERT INTO client_work_assignments
      (client_id, employee_id, title, target_value, unit, deadline, priority, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        clientId,
        employeeId,
        title,
        targetValue || 0,
        unit || "",
        deadline || null,
        priority || "medium",
        clientId,
      ],
    );
  

    res.json({ success: true });
  } catch (err) {
    console.error("CREATE ERROR:", err);
    res.status(500).json({ success: false });
  }
};

/* =========================================
UPDATE ASSIGNMENT
========================================= */
export const updateAssignment = async (req, res) => {
  try {
    const clientCode = req.client?.client_code;

    if (!clientCode) {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    const [clientRows] = await db.query(
      `SELECT id FROM clients WHERE client_code = ? LIMIT 1`,
      [clientCode],
    );

    const clientId = clientRows[0].id;

    const { id } = req.params;
    const { title, targetValue, unit, deadline, priority } = req.body;

    await db.query(
      `UPDATE client_work_assignments SET
        title = ?,
        target_value = ?,
        unit = ?,
        deadline = ?,
        priority = ?
      WHERE id = ? AND client_id = ?`,
      [title, targetValue, unit, deadline, priority, id, clientId],
    );

    res.json({ success: true });
  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.status(500).json({ success: false });
  }
};

/* =========================================
UPDATE STATUS
========================================= */
export const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { current_value, status } = req.body;

    if (!req.employee) {
      return res.status(403).json({
        success: false,
        message: "Employee access only",
      });
    }

    await db.query(
      `UPDATE client_work_assignments 
       SET current_value = ?, status = ?
       WHERE id = ? AND employee_id = ?`,
      [
        current_value || 0,
        status || "in_progress",
        id,
        req.employee.employee_id,
      ]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("UPDATE PROGRESS ERROR:", err);
    res.status(500).json({ success: false });
  }
};
/* =========================================
DELETE
========================================= */
export const deleteAssignment = async (req, res) => {
  try {
    const clientCode = req.client?.client_code;

    if (!clientCode) {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    const [clientRows] = await db.query(
      `SELECT id FROM clients WHERE client_code = ? LIMIT 1`,
      [clientCode],
    );

    const clientId = clientRows[0].id;

    const { id } = req.params;

    await db.query(
      `DELETE FROM client_work_assignments 
       WHERE id = ? AND client_id = ?`,
      [id, clientId],
    );

    res.json({ success: true });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ success: false });
  }
};
