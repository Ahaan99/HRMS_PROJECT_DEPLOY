import { db } from "../../../config/db.js";

/* =========================================
GET TARGETS
========================================= */
export const getTargets = async (req, res) => {
  try {
    const { quarter, year, status, department } = req.query;

    let query = `
      SELECT 
        t.*,
        e.name AS employee,
        e.employeeCode,
        d.name AS department
      FROM super_admin_targets t
      JOIN employees e ON e.id = t.employee_id
      LEFT JOIN departments d ON d.id = e.departmentId
      WHERE t.assigned_by = ?
    `;

    const params = [req.employee.id];

    if (quarter) {
      query += " AND t.quarter = ?";
      params.push(quarter);
    }

    if (year) {
      query += " AND t.year = ?";
      params.push(year);
    }

    if (status) {
      query += " AND t.status = ?";
      params.push(status);
    }

    if (department) {
      query += " AND d.name = ?";
      params.push(department);
    }

    query += " ORDER BY t.created_at DESC";

    const [rows] = await db.query(query, params);

    // 🔥 FORMAT FOR FRONTEND
    const formatted = rows.map((r) => {
      const progress = r.target_value
        ? Math.min(Math.round((r.current_value / r.target_value) * 100), 100)
        : 0;

      return {
        id: r.id,
        targetId: `TGT${String(r.id).padStart(3, "0")}`,
        title: r.title,
        employee: r.employee,
        employeeId: r.employeeCode,
        department: r.department || "-",
        quarter: r.quarter,
        year: r.year,
        targetValue: r.target_value,
        currentValue: r.current_value,
        unit: r.unit,
        progress,
        status: r.status,
        deadline: r.deadline,
      };
    });

    res.json({ success: true, data: formatted });
  } catch (err) {
    console.error("GET TARGET ERROR:", err);
    res.status(500).json({ success: false });
  }
};

/* =========================================
CREATE TARGET
========================================= */
export const createTarget = async (req, res) => {
  try {
    const {
      title,
      employeeId,
      targetValue,
      unit,
      deadline,
      quarter,
      year,
    } = req.body;

    if (!title || !employeeId || !targetValue || !deadline) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing",
      });
    }

    await db.query(
      `INSERT INTO super_admin_targets
      (title, employee_id, target_value, unit, deadline, priority, assigned_by, quarter, year)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        employeeId,
        targetValue || 0,
        unit || "",
        deadline || null,
        "medium", // same as assignment
        req.employee.id, // 🔥 HR ID
        quarter || null,
        year || null,
      ],
    );

    res.json({ success: true });
  } catch (err) {
    console.error("CREATE TARGET ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
