import { db } from "../../../config/db.js";

/* =========================================
GET ASSIGNMENTS (HR specific)
========================================= */
export const getMyAssignments = async (req, res) => {
  try {
    const { status, priority } = req.query;

    let query = `
      SELECT 
        t.*
      FROM super_admin_targets t
      WHERE t.employee_id = ?
    `;
    const params = [req.salesUser.employeeId]; // 🔥 from token

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
    console.error("GET MY ASSIGNMENTS ERROR:", err);
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
      `UPDATE super_admin_targets 
       SET status=? 
       WHERE id=? AND employee_id=?`,
      [status, id, req.salesUser.employeeId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("STATUS ERROR:", err);
    res.status(500).json({ success: false });
  }
};


export const updateProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentValue } = req.body;

    await db.query(
      `UPDATE super_admin_targets 
       SET current_value = ?
       WHERE id = ? AND employee_id = ?`,
      [currentValue, id, req.salesUser.employeeId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("PROGRESS ERROR:", err);
    res.status(500).json({ success: false });
  }
};
