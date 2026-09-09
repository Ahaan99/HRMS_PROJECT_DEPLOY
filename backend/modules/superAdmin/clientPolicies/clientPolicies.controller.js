import { db } from "../../../config/db.js";

/* GET */
export const getClientPolicies = async (req, res) => {
  try {
    const [policies] = await db.query(
      `SELECT * FROM client_policies ORDER BY id DESC`
    );

    // 🔥 get all rules (no filter)
    const [rules] = await db.query(`SELECT * FROM policy_rules`);

    // 🔥 map rules
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
      id: p.id,
      title: p.title,
      category: p.category,
      priority: p.priority,
      description: p.description,
      isActive: p.is_active,
      rules: map[p.id] || [],
    }));

    res.json({ success: true, data: final });

  } catch (err) {
    console.error("CLIENT POLICY ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
/* CREATE */
export const createClientPolicy = async (req, res) => {
  try {
    const { title, category, priority, description, isActive, rules } = req.body;

    const [result] = await db.query(
      `INSERT INTO client_policies (title, category, priority, description, is_active)
       VALUES (?, ?, ?, ?, ?)`,
      [title, category, priority, description, isActive]
    );

    const policyId = result.insertId;

    if (rules?.length) {
      const values = rules.map((r) => [
        policyId,
        "client",
        r.label,
        r.value,
        r.type || "text",
      ]);

      await db.query(
        `INSERT INTO policy_rules (policy_id, policy_type, label, value, type)
         VALUES ?`,
        [values]
      );
    }

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* TOGGLE */
export const toggleClientPolicy = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      `UPDATE client_policies SET is_active = NOT is_active WHERE id=?`,
      [id]
    );

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ success: false });
  }
};

/* DELETE */
export const deleteClientPolicy = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(`DELETE FROM policy_rules WHERE policy_id=? AND policy_type='client'`, [id]);
    await db.query(`DELETE FROM client_policies WHERE id=?`, [id]);

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ success: false });
  }
};