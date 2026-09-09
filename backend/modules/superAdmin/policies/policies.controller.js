import { db } from "../../../config/db.js";

/* =========================================
GET ALL POLICIES (OPTIMIZED)
========================================= */
export const getPolicies = async (req, res) => {
  try {
    const [policies] = await db.query(
      `SELECT * FROM policies ORDER BY id DESC`
    );

    const [rules] = await db.query(
      `SELECT * FROM policy_rules`
    );

    const map = {};
    rules.forEach((r) => {
      if (!map[r.policy_id]) map[r.policy_id] = [];
      map[r.policy_id].push({
        label: r.label,
        value: r.value,
        type: r.type,
      });
    });

    const final = policies.map((p) => ({
      ...p,
      rules: map[p.id] || [],
    }));

    res.json({ success: true, data: final });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* =========================================
CREATE POLICY
========================================= */
export const createPolicy = async (req, res) => {
  try {
    const {
      title,
      category,
      priority = "medium",
      description = "",
      isActive = true,
      autoApply = true,
      rules = [],
    } = req.body;

    if (!title || !category) {
      return res.status(400).json({
        success: false,
        message: "Title and category required",
      });
    }

    const [result] = await db.query(
      `INSERT INTO policies 
      (title, category, priority, description, is_active, auto_apply)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [title, category, priority, description, isActive, autoApply]
    );

    const policyId = result.insertId;

    if (rules.length > 0) {
      const values = rules
        .filter((r) => r.label && r.value)
        .map((r) => [
          policyId,
          r.label,
          r.value,
          r.type || "text",
        ]);

      if (values.length) {
        await db.query(
          `INSERT INTO policy_rules (policy_id, label, value, type)
           VALUES ?`,
          [values]
        );
      }
    }

    res.json({
      success: true,
      message: "Policy created",
      id: policyId,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* =========================================
UPDATE POLICY
========================================= */
export const updatePolicy = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      title,
      category,
      priority = "medium",
      description = "",
      isActive = true,
      autoApply = true,
      rules = [],
    } = req.body;

    await db.query(
      `UPDATE policies SET
       title=?, category=?, priority=?, description=?, is_active=?, auto_apply=?
       WHERE id=?`,
      [title, category, priority, description, isActive, autoApply, id]
    );

    await db.query(`DELETE FROM policy_rules WHERE policy_id=?`, [id]);

    if (rules.length > 0) {
      const values = rules
        .filter((r) => r.label && r.value)
        .map((r) => [
          id,
          r.label,
          r.value,
          r.type || "text",
        ]);

      if (values.length) {
        await db.query(
          `INSERT INTO policy_rules (policy_id, label, value, type)
           VALUES ?`,
          [values]
        );
      }
    }

    res.json({ success: true, message: "Policy updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* =========================================
TOGGLE POLICY (FIXED RESPONSE)
========================================= */
export const togglePolicy = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      `UPDATE policies SET is_active = NOT is_active WHERE id=?`,
      [id]
    );

    const [updated] = await db.query(
      `SELECT is_active FROM policies WHERE id=?`,
      [id]
    );

    res.json({
      success: true,
      isActive: updated[0]?.is_active,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* =========================================
DELETE POLICY (SAFE)
========================================= */
export const deletePolicy = async (req, res) => {
  try {
    const { id } = req.params;

    // 🔥 delete child first
    await db.query(`DELETE FROM policy_rules WHERE policy_id=?`, [id]);

    await db.query(`DELETE FROM policies WHERE id=?`, [id]);

    res.json({
      success: true,
      message: "Policy deleted",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* =========================================
GET LOGS
========================================= */
export const getPolicyLogs = async (req, res) => {
  try {
    const [logs] = await db.query(
      `SELECT * FROM policy_logs ORDER BY id DESC`
    );

    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};