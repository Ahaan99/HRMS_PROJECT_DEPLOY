import { db } from "../../config/db.js";

/* ================================================================== */
/* REIMBURSEMENTS                                                     */
/* ================================================================== */

// POST /api/compensation/reimbursements/apply  (EMPLOYEE)
export const applyReimbursement = async (req, res) => {
  try {
    const { category, amount, expense_date, description } = req.body;
    const amt = Number(amount);

    if (!category || !amount || !expense_date) {
      return res
        .status(400)
        .json({ success: false, message: "category, amount and expense_date are required" });
    }
    if (!Number.isFinite(amt) || amt <= 0 || amt > 1000000) {
      return res
        .status(400)
        .json({ success: false, message: "amount must be a positive number up to 10,00,000" });
    }

    const [r] = await db.query(
      `INSERT INTO reimbursements (employee_id, category, amount, expense_date, description)
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, category, amt, expense_date, description || null]
    );

    res.status(201).json({ success: true, data: { id: r.insertId } });
  } catch (err) {
    console.error("applyReimbursement:", err.message);
    res.status(500).json({ success: false, message: "Failed to submit reimbursement" });
  }
};

// GET /api/compensation/reimbursements/my  (EMPLOYEE)
export const myReimbursements = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, category, amount, DATE_FORMAT(expense_date, '%Y-%m-%d') AS expense_date,
              description, status, remarks, created_at
       FROM reimbursements
       WHERE employee_id = ?
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("myReimbursements:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch reimbursements" });
  }
};

// PUT /api/compensation/reimbursements/cancel/:id  (EMPLOYEE, only while Pending)
export const cancelMyReimbursement = async (req, res) => {
  try {
    const [r] = await db.query(
      `DELETE FROM reimbursements WHERE id = ? AND employee_id = ? AND status = 'Pending'`,
      [req.params.id, req.user.id]
    );
    if (!r.affectedRows) {
      return res
        .status(404)
        .json({ success: false, message: "Pending reimbursement not found" });
    }
    res.json({ success: true, message: "Reimbursement cancelled" });
  } catch (err) {
    console.error("cancelMyReimbursement:", err.message);
    res.status(500).json({ success: false, message: "Failed to cancel reimbursement" });
  }
};

// GET /api/compensation/reimbursements/all  (SUPER_ADMIN/MANAGER/TL)
export const allReimbursements = async (req, res) => {
  try {
    const { status } = req.query;
    const params = [];
    let where = "";
    if (status) {
      where = "WHERE o.status = ?";
      params.push(status);
    }
    const [rows] = await db.query(
      `SELECT o.id, o.employee_id, e.name AS employee_name, d.name AS department,
              o.category, o.amount, DATE_FORMAT(o.expense_date, '%Y-%m-%d') AS expense_date,
              o.description, o.status, o.decided_by, o.decided_at, o.remarks, o.created_at
       FROM reimbursements o
       LEFT JOIN employees e ON e.id = o.employee_id
       LEFT JOIN departments d ON d.id = e.departmentId
       ${where}
       ORDER BY o.created_at DESC`,
      params
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("allReimbursements:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch reimbursements" });
  }
};

// PUT /api/compensation/reimbursements/:id/decide  (SUPER_ADMIN/MANAGER/TL)
export const decideReimbursement = async (req, res) => {
  try {
    const { status, remarks } = req.body;
    if (!["Approved", "Rejected", "Paid"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "status must be Approved, Rejected or Paid" });
    }
    const decidedBy = req.user?.name || req.user?.email || "Admin";
    const [r] = await db.query(
      `UPDATE reimbursements
       SET status = ?, decided_by = ?, decided_at = NOW(), remarks = ?
       WHERE id = ?`,
      [status, decidedBy, remarks || null, req.params.id]
    );
    if (!r.affectedRows) {
      return res.status(404).json({ success: false, message: "Reimbursement not found" });
    }
    res.json({ success: true, message: `Reimbursement ${status.toLowerCase()}` });
  } catch (err) {
    console.error("decideReimbursement:", err.message);
    res.status(500).json({ success: false, message: "Failed to update reimbursement" });
  }
};

/* ================================================================== */
/* REWARDS (Incentives & Bonuses)                                     */
/* ================================================================== */

// GET /api/compensation/rewards/my  (EMPLOYEE)
export const myRewards = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, reward_type, title, amount,
              DATE_FORMAT(award_date, '%Y-%m-%d') AS award_date,
              period, status, notes, created_at
       FROM employee_rewards
       WHERE employee_id = ?
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("myRewards:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch rewards" });
  }
};

// GET /api/compensation/rewards/all  (SUPER_ADMIN/MANAGER/TL)
export const allRewards = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT o.id, o.employee_id, e.name AS employee_name, d.name AS department,
              o.reward_type, o.title, o.amount,
              DATE_FORMAT(o.award_date, '%Y-%m-%d') AS award_date,
              o.period, o.status, o.notes, o.created_by, o.created_at
       FROM employee_rewards o
       LEFT JOIN employees e ON e.id = o.employee_id
       LEFT JOIN departments d ON d.id = e.departmentId
       ORDER BY o.created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("allRewards:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch rewards" });
  }
};

// POST /api/compensation/rewards  (SUPER_ADMIN/MANAGER/TL)
export const createReward = async (req, res) => {
  try {
    const { employee_id, reward_type, title, amount, award_date, period, notes, status } = req.body;
    const amt = Number(amount);

    if (!employee_id || !reward_type || !title || !amount) {
      return res.status(400).json({
        success: false,
        message: "employee_id, reward_type, title and amount are required",
      });
    }
    if (!["Incentive", "Bonus"].includes(reward_type)) {
      return res
        .status(400)
        .json({ success: false, message: "reward_type must be Incentive or Bonus" });
    }
    if (!Number.isFinite(amt) || amt <= 0) {
      return res.status(400).json({ success: false, message: "amount must be a positive number" });
    }

    const [emp] = await db.query("SELECT id FROM employees WHERE id = ?", [employee_id]);
    if (!emp.length) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    const createdBy = req.user?.name || req.user?.email || "Admin";
    const [r] = await db.query(
      `INSERT INTO employee_rewards
         (employee_id, reward_type, title, amount, award_date, period, status, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        employee_id,
        reward_type,
        title,
        amt,
        award_date || null,
        period || null,
        status === "Paid" ? "Paid" : "Pending",
        notes || null,
        createdBy,
      ]
    );

    res.status(201).json({ success: true, data: { id: r.insertId } });
  } catch (err) {
    console.error("createReward:", err.message);
    res.status(500).json({ success: false, message: "Failed to create reward" });
  }
};

// PUT /api/compensation/rewards/:id/status  (SUPER_ADMIN/MANAGER/TL)
export const updateRewardStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["Pending", "Paid"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "status must be Pending or Paid" });
    }
    const [r] = await db.query("UPDATE employee_rewards SET status = ? WHERE id = ?", [
      status,
      req.params.id,
    ]);
    if (!r.affectedRows) {
      return res.status(404).json({ success: false, message: "Reward not found" });
    }
    res.json({ success: true, message: "Reward updated" });
  } catch (err) {
    console.error("updateRewardStatus:", err.message);
    res.status(500).json({ success: false, message: "Failed to update reward" });
  }
};

// DELETE /api/compensation/rewards/:id  (SUPER_ADMIN/MANAGER/TL)
export const deleteReward = async (req, res) => {
  try {
    const [r] = await db.query("DELETE FROM employee_rewards WHERE id = ?", [req.params.id]);
    if (!r.affectedRows) {
      return res.status(404).json({ success: false, message: "Reward not found" });
    }
    res.json({ success: true, message: "Reward deleted" });
  } catch (err) {
    console.error("deleteReward:", err.message);
    res.status(500).json({ success: false, message: "Failed to delete reward" });
  }
};

/* ================================================================== */
/* INSURANCE TRACKING                                                 */
/* ================================================================== */

const INSURANCE_TYPES = ["Health", "Life", "Accident", "Term", "Other"];
const INSURANCE_STATUSES = ["Active", "Expired", "Cancelled"];

// GET /api/compensation/insurance/my  (EMPLOYEE)
export const myInsurance = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, policy_type, provider, policy_number, coverage_amount, premium_amount,
              DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
              DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date,
              nominee, status, notes, created_at
       FROM employee_insurance
       WHERE employee_id = ?
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("myInsurance:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch insurance policies" });
  }
};

// GET /api/compensation/insurance/all  (SUPER_ADMIN/MANAGER/TL)
export const allInsurance = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT o.id, o.employee_id, e.name AS employee_name, d.name AS department,
              o.policy_type, o.provider, o.policy_number, o.coverage_amount, o.premium_amount,
              DATE_FORMAT(o.start_date, '%Y-%m-%d') AS start_date,
              DATE_FORMAT(o.end_date, '%Y-%m-%d') AS end_date,
              o.nominee, o.status, o.notes, o.created_by, o.created_at
       FROM employee_insurance o
       LEFT JOIN employees e ON e.id = o.employee_id
       LEFT JOIN departments d ON d.id = e.departmentId
       ORDER BY o.created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("allInsurance:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch insurance policies" });
  }
};

// POST /api/compensation/insurance  (SUPER_ADMIN/MANAGER/TL)
export const createInsurance = async (req, res) => {
  try {
    const {
      employee_id,
      policy_type,
      provider,
      policy_number,
      coverage_amount,
      premium_amount,
      start_date,
      end_date,
      nominee,
      notes,
    } = req.body;

    if (!employee_id || !policy_type || !provider || !coverage_amount) {
      return res.status(400).json({
        success: false,
        message: "employee_id, policy_type, provider and coverage_amount are required",
      });
    }
    if (!INSURANCE_TYPES.includes(policy_type)) {
      return res
        .status(400)
        .json({ success: false, message: `policy_type must be one of: ${INSURANCE_TYPES.join(", ")}` });
    }
    const coverage = Number(coverage_amount);
    if (!Number.isFinite(coverage) || coverage <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "coverage_amount must be a positive number" });
    }
    const premium = premium_amount == null || premium_amount === "" ? null : Number(premium_amount);
    if (premium !== null && (!Number.isFinite(premium) || premium < 0)) {
      return res
        .status(400)
        .json({ success: false, message: "premium_amount must be a non-negative number" });
    }

    const [emp] = await db.query("SELECT id FROM employees WHERE id = ?", [employee_id]);
    if (!emp.length) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    const createdBy = req.user?.name || req.user?.email || "Admin";
    const [r] = await db.query(
      `INSERT INTO employee_insurance
         (employee_id, policy_type, provider, policy_number, coverage_amount, premium_amount,
          start_date, end_date, nominee, status, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?, ?)`,
      [
        employee_id,
        policy_type,
        provider,
        policy_number || null,
        coverage,
        premium,
        start_date || null,
        end_date || null,
        nominee || null,
        notes || null,
        createdBy,
      ]
    );

    res.status(201).json({ success: true, data: { id: r.insertId } });
  } catch (err) {
    console.error("createInsurance:", err.message);
    res.status(500).json({ success: false, message: "Failed to create insurance policy" });
  }
};

// PUT /api/compensation/insurance/:id/status  (SUPER_ADMIN/MANAGER/TL)
export const updateInsuranceStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!INSURANCE_STATUSES.includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: `status must be one of: ${INSURANCE_STATUSES.join(", ")}` });
    }
    const [r] = await db.query("UPDATE employee_insurance SET status = ? WHERE id = ?", [
      status,
      req.params.id,
    ]);
    if (!r.affectedRows) {
      return res.status(404).json({ success: false, message: "Insurance policy not found" });
    }
    res.json({ success: true, message: "Insurance policy updated" });
  } catch (err) {
    console.error("updateInsuranceStatus:", err.message);
    res.status(500).json({ success: false, message: "Failed to update insurance policy" });
  }
};

// DELETE /api/compensation/insurance/:id  (SUPER_ADMIN/MANAGER/TL)
export const deleteInsurance = async (req, res) => {
  try {
    const [r] = await db.query("DELETE FROM employee_insurance WHERE id = ?", [req.params.id]);
    if (!r.affectedRows) {
      return res.status(404).json({ success: false, message: "Insurance policy not found" });
    }
    res.json({ success: true, message: "Insurance policy deleted" });
  } catch (err) {
    console.error("deleteInsurance:", err.message);
    res.status(500).json({ success: false, message: "Failed to delete insurance policy" });
  }
};
