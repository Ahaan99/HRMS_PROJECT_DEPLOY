import { db } from "../../../config/db.js";

/* =========================================
GET POLICIES
========================================= */
export const getPolicies = async (req, res) => {
  try {
    const { category, status, department } = req.query;

    let query = `
      SELECT 
        p.*,
        d.name AS department
      FROM work_policies p
      LEFT JOIN departments d ON d.id = p.departmentId
      WHERE 1=1
    `;

    const params = [];

    if (category) {
      query += " AND p.category = ?";
      params.push(category);
    }

    if (status) {
      query += " AND p.status = ?";
      params.push(status);
    }

    if (department && department !== "All") {
      query += " AND d.name = ?";
      params.push(department);
    }

    query += " ORDER BY p.createdAt DESC";

    const [rows] = await db.query(query, params);

    // 🔥 mapping for frontend
    const formatted = rows.map((r) => ({
      id: r.id,
      policyId: r.policy_code,
      title: r.title,
      category: r.category,
      department: r.department || "All",
      effectiveDate: r.effective_date,
      lastUpdated: r.updatedAt,
      status: r.status,
      description: r.description,
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    console.error("GET POLICY ERROR:", err);
    res.status(500).json({ success: false });
  }
};

/* =========================================
CREATE POLICY
========================================= */
export const createPolicy = async (req, res) => {
  try {
    const { title, category, department, status, effectiveDate, description } =
      req.body;

    if (!title || !category || !effectiveDate) {
      return res.status(400).json({
        success: false,
        message: "Title, Category, Effective Date required",
      });
    }

    // 🔥 generate policy code
    const [[last]] = await db.query(
      "SELECT id FROM work_policies ORDER BY id DESC LIMIT 1"
    );

    const nextId = last ? last.id + 1 : 1;
    const policyCode = `POL${String(nextId).padStart(3, "0")}`;

    // 🔥 departmentId from name
    let departmentId = 0;
    if (department && department !== "All") {
      const [[dept]] = await db.query(
        "SELECT id FROM departments WHERE name = ? LIMIT 1",
        [department]
      );
      if (dept) departmentId = dept.id;
    }

    // work_policies.client_id is NOT NULL — tokens from HR/IT/Super Admin
    // portals don't carry a tenant id, so fall back to 0 (= company-wide).
    const clientId =
      Number(req.user?.client_id ?? req.user?.clientId ?? req.client?.id ?? 0) || 0;

    await db.query(
      `INSERT INTO work_policies
      (client_id, policy_code, title, category, departmentId, status, effective_date, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        clientId,
        policyCode,
        title,
        category,
        departmentId,
        status || "draft",
        effectiveDate,
        description || "",
      ]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("CREATE POLICY ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* =========================================
UPDATE POLICY
========================================= */
export const updatePolicy = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, department, status, effectiveDate, description } =
      req.body;

    let departmentId = 0;
    if (department && department !== "All") {
      const [[dept]] = await db.query(
        "SELECT id FROM departments WHERE name = ? LIMIT 1",
        [department]
      );
      if (dept) departmentId = dept.id;
    }

    await db.query(
      `UPDATE work_policies SET
        title=?,
        category=?,
        departmentId=?,
        status=?,
        effective_date=?,
        description=?
      WHERE id=?`,
      [title, category, departmentId, status, effectiveDate, description, id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("UPDATE POLICY ERROR:", err);
    res.status(500).json({ success: false });
  }
};

/* =========================================
DELETE POLICY
========================================= */
export const deletePolicy = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query("DELETE FROM work_policies WHERE id=?", [id]);

    res.json({ success: true });
  } catch (err) {
    console.error("DELETE POLICY ERROR:", err);
    res.status(500).json({ success: false });
  }
};