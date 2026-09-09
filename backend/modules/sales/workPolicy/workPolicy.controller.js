import { db } from "../../../config/db.js";

/* =========================================
GET POLICIES (SALES - VIEW ONLY)
========================================= */
export const getPolicies = async (req, res) => {
  try {
    const { category, status } = req.query;

    let query = `
      SELECT 
        wp.id,
        wp.title,
        wp.category,
        wp.description,
        wp.status,
        wp.effective_date,
        wp.policy_code,
        wp.departmentId,
        wp.createdAt,
        d.name AS department_name
      FROM work_policies wp
      LEFT JOIN departments d ON d.id = wp.departmentId
      WHERE wp.isActive = 1
    `;

    const params = [];

    // filters
    if (category) {
      query += " AND wp.category = ?";
      params.push(category);
    }

    if (status) {
      query += " AND wp.status = ?";
      params.push(status);
    }

    query += " ORDER BY wp.createdAt DESC";

    const [rows] = await db.query(query, params);

    // 🔥 map for frontend compatibility
    const formatted = rows.map((r) => ({
      id: r.id,
      title: r.title,
      category: r.category,
      description: r.description,
      status: r.status,

      // mapping
      effectiveDate: r.effective_date,
      policyId: r.policy_code,
      department: r.department_name || r.departmentId,

      createdAt: r.createdAt,

      // safe defaults (frontend expects)
      rules: [],
      violations: [],
    }));

    res.json({
      success: true,
      data: formatted,
    });
  } catch (err) {
    console.error("GET POLICIES ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};