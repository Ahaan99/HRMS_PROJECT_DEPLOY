import { db } from "../../config/db.js";

/* ================================================================== */
/* SALARY SYNC AUTOMATION + APPROVAL MATRIX                           */
/* ================================================================== */

const ADMIN_ROLES = ["SUPER_ADMIN", "MANAGER", "TL"];

const parseRoles = (v) => (typeof v === "string" ? JSON.parse(v) : v);

const pct = (oldS, newS) => {
  if (!oldS) return 100;
  return Math.round(((newS - oldS) / oldS) * 10000) / 100;
};

/* ------------------------- Approval Matrix ------------------------ */

// GET /api/salary/matrix
export const getMatrix = async (_req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM salary_approval_matrix ORDER BY min_percent ASC"
    );
    res.json({
      success: true,
      data: rows.map((r) => ({ ...r, approver_roles: parseRoles(r.approver_roles) })),
    });
  } catch (err) {
    console.error("getMatrix:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch approval matrix" });
  }
};

// PUT /api/salary/matrix/:id  (SUPER_ADMIN)
export const updateMatrixRule = async (req, res) => {
  try {
    const { min_percent, max_percent, approver_roles } = req.body;
    if (
      !Array.isArray(approver_roles) ||
      approver_roles.length === 0 ||
      approver_roles.some((r) => !ADMIN_ROLES.includes(r))
    ) {
      return res.status(400).json({
        success: false,
        message: `approver_roles must be a non-empty array of: ${ADMIN_ROLES.join(", ")}`,
      });
    }
    const minP = Number(min_percent);
    const maxP = max_percent == null || max_percent === "" ? null : Number(max_percent);
    if (!Number.isFinite(minP) || minP < 0 || (maxP !== null && (!Number.isFinite(maxP) || maxP <= minP))) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid min/max percent range" });
    }
    const [r] = await db.query(
      "UPDATE salary_approval_matrix SET min_percent = ?, max_percent = ?, approver_roles = ? WHERE id = ?",
      [minP, maxP, JSON.stringify(approver_roles), req.params.id]
    );
    if (!r.affectedRows) {
      return res.status(404).json({ success: false, message: "Matrix rule not found" });
    }
    res.json({ success: true, message: "Matrix rule updated" });
  } catch (err) {
    console.error("updateMatrixRule:", err.message);
    res.status(500).json({ success: false, message: "Failed to update matrix rule" });
  }
};

const pickMatrixRule = async (changePercent) => {
  const abs = Math.abs(changePercent);
  const [rules] = await db.query(
    "SELECT * FROM salary_approval_matrix ORDER BY min_percent ASC"
  );
  let match = null;
  for (const r of rules) {
    const max = r.max_percent == null ? Infinity : Number(r.max_percent);
    if (abs >= Number(r.min_percent) && abs < max) {
      match = r;
      break;
    }
  }
  if (!match && rules.length) match = rules[rules.length - 1];
  return match;
};

/* ------------------------- Revisions ------------------------------ */

// POST /api/salary/revisions  (SUPER_ADMIN/MANAGER/TL)
export const createRevision = async (req, res) => {
  try {
    const { employee_id, proposed_salary, reason } = req.body;
    const effective_from =
      req.body.effective_from || new Date().toISOString().slice(0, 10);
    if (!employee_id || proposed_salary == null) {
      return res.status(400).json({
        success: false,
        message: "employee_id and proposed_salary are required",
      });
    }
    const proposed = Number(proposed_salary);
    if (!Number.isFinite(proposed) || proposed <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "proposed_salary must be a positive number" });
    }

    const [[emp]] = await db.query(
      "SELECT id, name, salary FROM employees WHERE id = ? AND isActive = 1",
      [employee_id]
    );
    if (!emp) {
      return res.status(404).json({ success: false, message: "Active employee not found" });
    }
    if (Number(emp.salary) === proposed) {
      return res
        .status(400)
        .json({ success: false, message: "Proposed salary equals current salary" });
    }

    const [pending] = await db.query(
      "SELECT id FROM salary_revisions WHERE employee_id = ? AND status IN ('Pending','Approved')",
      [employee_id]
    );
    if (pending.length) {
      return res.status(409).json({
        success: false,
        message: "Employee already has a pending/approved unapplied revision",
      });
    }

    const changePercent = pct(Number(emp.salary), proposed);
    const rule = await pickMatrixRule(changePercent);
    if (!rule) {
      return res
        .status(500)
        .json({ success: false, message: "No approval matrix rule configured" });
    }
    const requiredRoles = parseRoles(rule.approver_roles);
    const requestedBy = req.user?.name || req.user?.email || req.user?.role || "Admin";

    const [r] = await db.query(
      `INSERT INTO salary_revisions
         (employee_id, current_salary, proposed_salary, change_percent, reason,
          effective_from, status, matrix_rule_id, required_roles, current_level, requested_by)
       VALUES (?, ?, ?, ?, ?, ?, 'Pending', ?, ?, 0, ?)`,
      [
        employee_id,
        emp.salary,
        proposed,
        changePercent,
        reason || null,
        effective_from,
        rule.id,
        JSON.stringify(requiredRoles),
        requestedBy,
      ]
    );

    res.status(201).json({
      success: true,
      data: { id: r.insertId, change_percent: changePercent, required_roles: requiredRoles },
    });
  } catch (err) {
    console.error("createRevision:", err.message);
    res.status(500).json({ success: false, message: "Failed to create salary revision" });
  }
};

// GET /api/salary/revisions  (SUPER_ADMIN/MANAGER/TL)
export const listRevisions = async (_req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.*, e.name AS employee_name, e.employeeCode AS employee_code
       FROM salary_revisions r
       LEFT JOIN employees e ON e.id = r.employee_id
       ORDER BY r.created_at DESC`
    );
    const ids = rows.map((r) => r.id);
    let approvals = [];
    if (ids.length) {
      [approvals] = await db.query(
        `SELECT * FROM salary_revision_approvals WHERE revision_id IN (?) ORDER BY level ASC`,
        [ids]
      );
    }
    const apMap = {};
    for (const a of approvals) {
      (apMap[a.revision_id] = apMap[a.revision_id] || []).push(a);
    }
    res.json({
      success: true,
      data: rows.map((r) => ({
        ...r,
        required_roles: parseRoles(r.required_roles),
        approvals: apMap[r.id] || [],
      })),
    });
  } catch (err) {
    console.error("listRevisions:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch salary revisions" });
  }
};

const applyRevision = async (rev) => {
  await db.query("UPDATE employees SET salary = ? WHERE id = ?", [
    rev.proposed_salary,
    rev.employee_id,
  ]);
  await db.query(
    "UPDATE salary_revisions SET status = 'Applied', applied_at = NOW() WHERE id = ?",
    [rev.id]
  );
  await db.query(
    `INSERT INTO salary_history (employee_id, old_salary, new_salary, revision_id, changed_by, change_source)
     VALUES (?, ?, ?, ?, ?, 'Revision')`,
    [rev.employee_id, rev.current_salary, rev.proposed_salary, rev.id, rev.requested_by]
  );
};

// PUT /api/salary/revisions/:id/decide  (SUPER_ADMIN/MANAGER/TL)
export const decideRevision = async (req, res) => {
  try {
    const { action, remarks } = req.body;
    const normalizedAction =
      action === "Approved" ? "Approve" : action === "Rejected" ? "Reject" : action;
    if (!["Approve", "Reject"].includes(normalizedAction)) {
      return res
        .status(400)
        .json({ success: false, message: "action must be 'Approve' or 'Reject'" });
    }

    const [[rev]] = await db.query("SELECT * FROM salary_revisions WHERE id = ?", [
      req.params.id,
    ]);
    if (!rev) {
      return res.status(404).json({ success: false, message: "Revision not found" });
    }
    if (rev.status !== "Pending") {
      return res
        .status(409)
        .json({ success: false, message: `Revision is already ${rev.status}` });
    }

    const requiredRoles =
      typeof rev.required_roles === "string"
        ? JSON.parse(rev.required_roles)
        : rev.required_roles;
    const expectedRole = requiredRoles[rev.current_level];
    const actorRole = req.user?.role;
    // SUPER_ADMIN can act at any level; others must match the expected level role
    if (actorRole !== "SUPER_ADMIN" && actorRole !== expectedRole) {
      return res.status(403).json({
        success: false,
        message: `This revision currently requires approval by: ${expectedRole}`,
      });
    }

    const approverName = req.user?.name || req.user?.email || actorRole;
    await db.query(
      `INSERT INTO salary_revision_approvals (revision_id, level, approver_role, approver_name, action, remarks)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [rev.id, rev.current_level, actorRole, approverName, normalizedAction === "Approve" ? "Approved" : "Rejected", remarks || null]
    );

    if (normalizedAction === "Reject") {
      await db.query(
        "UPDATE salary_revisions SET status = 'Rejected', decided_at = NOW() WHERE id = ?",
        [rev.id]
      );
      return res.json({ success: true, message: "Revision rejected" });
    }

    // Approve: SUPER_ADMIN approval short-circuits all remaining levels
    const nextLevel = actorRole === "SUPER_ADMIN" ? requiredRoles.length : rev.current_level + 1;
    if (nextLevel >= requiredRoles.length) {
      await db.query(
        "UPDATE salary_revisions SET status = 'Approved', current_level = ?, decided_at = NOW() WHERE id = ?",
        [nextLevel, rev.id]
      );
      const today = new Date().toISOString().slice(0, 10);
      const effDate =
        rev.effective_from instanceof Date
          ? rev.effective_from.toISOString().slice(0, 10)
          : String(rev.effective_from).slice(0, 10);
      if (!rev.effective_from || effDate <= today) {
        await applyRevision({ ...rev, status: "Approved" });
        return res.json({
          success: true,
          message: "Revision fully approved and salary applied",
        });
      }
      return res.json({
        success: true,
        message: "Revision fully approved; salary will auto-apply on the effective date",
      });
    }

    await db.query("UPDATE salary_revisions SET current_level = ? WHERE id = ?", [
      nextLevel,
      rev.id,
    ]);
    res.json({
      success: true,
      message: `Approved at level ${rev.current_level + 1}; next approver: ${requiredRoles[nextLevel]}`,
    });
  } catch (err) {
    console.error("decideRevision:", err.message);
    res.status(500).json({ success: false, message: "Failed to decide revision" });
  }
};

// PUT /api/salary/revisions/:id/cancel  (SUPER_ADMIN/MANAGER/TL)
export const cancelRevision = async (req, res) => {
  try {
    const [r] = await db.query(
      "UPDATE salary_revisions SET status = 'Cancelled', decided_at = NOW() WHERE id = ? AND status = 'Pending'",
      [req.params.id]
    );
    if (!r.affectedRows) {
      return res
        .status(404)
        .json({ success: false, message: "Pending revision not found" });
    }
    res.json({ success: true, message: "Revision cancelled" });
  } catch (err) {
    console.error("cancelRevision:", err.message);
    res.status(500).json({ success: false, message: "Failed to cancel revision" });
  }
};

/* ------------------------- Salary History ------------------------- */

// GET /api/salary/history  (SUPER_ADMIN/MANAGER/TL)
export const salaryHistory = async (_req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT h.*, e.name AS employee_name, e.employeeCode AS employee_code
       FROM salary_history h
       LEFT JOIN employees e ON e.id = h.employee_id
       ORDER BY h.created_at DESC
       LIMIT 500`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("salaryHistory:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch salary history" });
  }
};

/* --------------------- Sync Automation Scheduler ------------------ */

export const applyDueRevisions = async () => {
  const today = new Date().toISOString().slice(0, 10);
  const [due] = await db.query(
    "SELECT * FROM salary_revisions WHERE status = 'Approved' AND effective_from <= ?",
    [today]
  );
  let applied = 0;
  for (const rev of due) {
    try {
      await applyRevision(rev);
      applied++;
    } catch (err) {
      console.error(`[salary-sync] failed to apply revision #${rev.id}:`, err.message);
    }
  }
  return { checked: due.length, applied };
};

export const startSalarySyncScheduler = () => {
  const tick = async () => {
    try {
      const r = await applyDueRevisions();
      if (r.applied > 0) {
        console.log(`[salary-sync] Applied ${r.applied} due salary revision(s)`);
      }
    } catch (err) {
      console.error("[salary-sync] scheduler failed:", err.message);
    }
  };
  tick(); // run once on boot
  setInterval(tick, 60 * 60 * 1000); // hourly
};
