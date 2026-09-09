import { db } from "../../../config/db.js";

/* =========================================
GET ASSIGNMENTS (HR specific)
========================================= */
export const getAssignments = async (req, res) => {
  try {
    const { status, priority, employeeId } = req.query;

    let query = `
      SELECT 
        t.*,
        e.name AS employee_name,
        e.employeeCode,
        d.name AS department_name
      FROM super_admin_targets t
      JOIN employees e ON e.id = t.employee_id
      LEFT JOIN departments d ON d.id = e.departmentId
      WHERE t.assigned_by = ?
    `;

    const params = [req.employee.id];

    if (status) {
      query += " AND t.status = ?";
      params.push(status);
    }

    if (priority) {
      query += " AND t.priority = ?";
      params.push(priority);
    }

    if (employeeId) {
      query += " AND t.employee_id = ?";
      params.push(employeeId);
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
    const { title, employeeId, targetValue, unit, deadline, priority } =
      req.body;

    if (!title || !employeeId) {
      return res.status(400).json({
        success: false,
        message: "Title & Employee required",
      });
    }

    await db.query(
      `INSERT INTO super_admin_targets
      (title, employee_id, target_value, unit, deadline, priority, assigned_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        employeeId,
        targetValue || 0,
        unit || "",
        deadline || null,
        priority || "medium",
        req.employee.id, // 🔥 HR ID
      ],
    );

    res.json({ success: true });
  } catch (err) {
    console.error("CREATE ASSIGNMENT ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* =========================================
UPDATE ASSIGNMENT
========================================= */
export const updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    const { title, targetValue, unit, deadline, priority } = req.body;

    await db.query(
      `UPDATE super_admin_targets SET
        title=?,
        target_value=?,
        unit=?,
        deadline=?,
        priority=?
      WHERE id=? AND assigned_by=?`,
      [title, targetValue, unit, deadline, priority, id, req.employee.id],
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
    const { status } = req.body;

    await db.query(
      `UPDATE super_admin_targets SET status=? 
       WHERE id=? AND assigned_by=?`,
      [status, id, req.employee.id],
    );

    res.json({ success: true });
  } catch (err) {
    console.error("STATUS ERROR:", err);
    res.status(500).json({ success: false });
  }
};

/* =========================================
DELETE
========================================= */
export const deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      `DELETE FROM super_admin_targets 
       WHERE id=? AND assigned_by=?`,
      [id, req.employee.id],
    );

    res.json({ success: true });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ success: false });
  }
};
