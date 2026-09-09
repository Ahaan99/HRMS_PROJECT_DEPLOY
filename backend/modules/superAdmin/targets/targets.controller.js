import { db } from "../../../config/db.js";

/* =========================================
GET TARGETS (WITH JOIN 🔥)
========================================= */
// export const getTargets = async (req, res) => {
//   try {
//     const [rows] = await db.query(`
//       SELECT 
//         t.*,
//         e.name AS employee_name,
//         e.employeeCode,
//         d.name AS department_name
//       FROM super_admin_targets t
//       JOIN employees e ON e.id = t.employee_id
//       LEFT JOIN departments d ON d.id = e.departmentId
//       ORDER BY t.created_at DESC
//     `);

//     res.json({ success: true, data: rows });

//   } catch (err) {
//     console.error("GET TARGETS ERROR:", err);
//     res.status(500).json({ success: false });
//   }
// };

export const getTargets = async (req, res) => {
  try {
    // HR and IT developers see only the targets assigned to them; admins see all
    const isOwnOnly = ["hr", "it"].includes(req.user.role);
    const ownId = req.user.employee_id || req.user.id;

    const query = `
      SELECT 
        t.*,
        e.name AS employee_name,
        e.employeeCode,
        d.name AS department_name
      FROM super_admin_targets t
      JOIN employees e ON e.id = t.employee_id
      LEFT JOIN departments d ON d.id = e.departmentId
      ${isOwnOnly ? "WHERE t.employee_id = ?" : ""}
      ORDER BY t.created_at DESC
    `;

    const params = isOwnOnly ? [ownId] : [];

    const [rows] = await db.query(query, params);

    res.json({ success: true, data: rows });

  } catch (err) {
    console.error("GET TARGETS ERROR:", err);
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
      priority,
    } = req.body;

    if (!title || !employeeId) {
      return res.status(400).json({
        success: false,
        message: "Title & Employee required",
      });
    }

    await db.query(
      `INSERT INTO super_admin_targets
      (title, employee_id, target_value, unit, deadline, priority)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        title,
        employeeId,
        targetValue || 0,
        unit || "",
        deadline || null,
        priority || "medium",
      ]
    );

    res.json({ success: true });

  } catch (err) {
    console.error("CREATE TARGET ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* =========================================
UPDATE TARGET
========================================= */
export const updateTarget = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      title,
      targetValue,
      unit,
      deadline,
      priority,
    } = req.body;

    await db.query(
      `UPDATE super_admin_targets SET
        title=?,
        target_value=?,
        unit=?,
        deadline=?,
        priority=?
      WHERE id=?`,
      [title, targetValue, unit, deadline, priority, id]
    );

    res.json({ success: true });

  } catch (err) {
    console.error("UPDATE TARGET ERROR:", err);
    res.status(500).json({ success: false });
  }
};

/* =========================================
UPDATE PROGRESS
========================================= */
export const updateProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentValue } = req.body;

    const [[target]] = await db.query(
      `SELECT employee_id, target_value, deadline FROM super_admin_targets WHERE id=?`,
      [id]
    );

    if (!target) {
      return res.status(404).json({ success: false });
    }

    // HR / IT developers may only update progress on their own targets
    if (["hr", "it"].includes(req.user.role)) {
      const ownId = Number(req.user.employee_id || req.user.id);
      if (Number(target.employee_id) !== ownId) {
        return res.status(403).json({ success: false, message: "Not your target" });
      }
    }

    let status = "pending";

    if (currentValue >= target.target_value) {
      status = "completed";
    } else if (currentValue > 0) {
      status = "in_progress";
    }

    // 🔥 overdue check
    const today = new Date().toISOString().split("T")[0];
    if (target.deadline && today > target.deadline && status !== "completed") {
      status = "overdue";
    }

    await db.query(
      `UPDATE super_admin_targets 
       SET current_value=?, status=?
       WHERE id=?`,
      [currentValue, status, id]
    );

    res.json({ success: true });

  } catch (err) {
    console.error("PROGRESS ERROR:", err);
    res.status(500).json({ success: false });
  }
};

/* =========================================
DELETE TARGET
========================================= */
export const deleteTarget = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      `DELETE FROM super_admin_targets WHERE id=?`,
      [id]
    );

    res.json({ success: true });

  } catch (err) {
    console.error("DELETE TARGET ERROR:", err);
    res.status(500).json({ success: false });
  }
};