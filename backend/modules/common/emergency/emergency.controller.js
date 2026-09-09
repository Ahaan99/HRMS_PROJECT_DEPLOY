import { db } from "../../../config/db.js";

/* A "step 1 / step 2" escalation only makes sense inside a short window.
   Previously click_count was computed from the user's LAST EVER row, so after
   two lifetime clicks every further press returned "Already triggered". */
const ESCALATION_WINDOW_MIN = 30;

const userIdOf = (u) => Number(u?.employee_id || u?.id || u?.admin_id || u?.client_id || 0);

const resolveIdentity = async (user) => {
  const id = userIdOf(user);
  const role = String(user?.role || "").toLowerCase();
  let name = user?.name || null;
  let email = user?.email || null;
  if ((!name || !email) && id) {
    try {
      const table = role === "super_admin" ? "super_admins" : "employees";
      const [[row]] = await db.query(`SELECT name, email FROM ${table} WHERE id = ? LIMIT 1`, [id]);
      if (row) { name = name || row.name; email = email || row.email; }
    } catch { /* identity is best-effort; the alert still gets stored */ }
  }
  return { id, role: user?.role || null, name, email };
};

export const triggerEmergency = async (req, res) => {
  try {
    const who = await resolveIdentity(req.user);
    const note = typeof req.body?.note === "string" ? req.body.note.slice(0, 500) : null;

    const [[last]] = await db.query(
      `SELECT click_count, created_at, resolved_at FROM emergency_logs
        WHERE user_id = ? ORDER BY id DESC LIMIT 1`,
      [who.id],
    );

    let clickCount = 1;
    if (last && !last.resolved_at) {
      const ageMin = (Date.now() - new Date(last.created_at).getTime()) / 60000;
      if (ageMin < ESCALATION_WINDOW_MIN) clickCount = Number(last.click_count) + 1;
    }

    const status = clickCount >= 2 ? "escalated" : "triggered";
    const [ins] = await db.query(
      `INSERT INTO emergency_logs (user_id, click_count, status, user_role, user_name, user_email, note)
       VALUES (?,?,?,?,?,?,?)`,
      [who.id, clickCount, status, who.role, who.name, who.email, note],
    );

    if (clickCount === 1) {
      return res.json({ success: true, id: ins.insertId, msg: "Emergency alert sent to Super Admin and HR (Step 1)" });
    }
    if (clickCount === 2) {
      return res.json({ success: true, id: ins.insertId, msg: "Emergency escalated - responders notified (Step 2)" });
    }
    return res.json({
      success: true,
      id: ins.insertId,
      msg: `Alert already escalated. Responders have been notified (${clickCount} presses).`,
    });
  } catch (error) {
    console.error("Emergency Error:", error);
    res.status(500).json({ success: false, msg: "Something went wrong" });
  }
};

/* GET /api/emergency?status=open|resolved|all&limit=100  (SUPER_ADMIN, MANAGER, hr) */
export const listEmergencies = async (req, res) => {
  try {
    const status = String(req.query.status || "open");
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);
    const where =
      status === "open" ? "WHERE e.resolved_at IS NULL"
      : status === "resolved" ? "WHERE e.resolved_at IS NOT NULL"
      : "";
    const [rows] = await db.query(
      `SELECT e.id, e.user_id, e.click_count, e.status, e.created_at,
              e.user_role, e.user_name, e.user_email, e.note,
              e.resolved_at, e.resolved_by, e.resolution_note,
              COALESCE(e.user_name, emp.name) AS display_name,
              COALESCE(e.user_email, emp.email) AS display_email,
              emp.phone AS phone, d.name AS department
         FROM emergency_logs e
         LEFT JOIN employees emp ON emp.id = e.user_id AND (e.user_role IS NULL OR e.user_role <> 'SUPER_ADMIN')
         LEFT JOIN departments d ON d.id = emp.departmentId
         ${where}
        ORDER BY e.resolved_at IS NOT NULL, e.id DESC
        LIMIT ${limit}`,
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Emergency list error:", error);
    res.status(500).json({ success: false, message: "Failed to load emergency alerts" });
  }
};

/* GET /api/emergency/summary -> { open, escalated, today, resolved7d } */
export const emergencySummary = async (_req, res) => {
  try {
    const [[s]] = await db.query(
      `SELECT
         SUM(resolved_at IS NULL) AS open,
         SUM(resolved_at IS NULL AND click_count >= 2) AS escalated,
         SUM(DATE(created_at) = CURDATE()) AS today,
         SUM(resolved_at IS NOT NULL AND resolved_at >= NOW() - INTERVAL 7 DAY) AS resolved7d
       FROM emergency_logs`,
    );
    res.json({ success: true, data: { open: Number(s.open || 0), escalated: Number(s.escalated || 0), today: Number(s.today || 0), resolved7d: Number(s.resolved7d || 0) } });
  } catch (error) {
    console.error("Emergency summary error:", error);
    res.status(500).json({ success: false, message: "Failed to load summary" });
  }
};

/* PATCH /api/emergency/:id/resolve  { note }  (SUPER_ADMIN, MANAGER, hr) */
export const resolveEmergency = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: "Invalid id" });
    const who = await resolveIdentity(req.user);
    const note = typeof req.body?.note === "string" ? req.body.note.slice(0, 500) : null;
    const [r] = await db.query(
      `UPDATE emergency_logs
          SET resolved_at = NOW(), resolved_by = ?, resolution_note = ?, status = 'resolved'
        WHERE id = ? AND resolved_at IS NULL`,
      [who.name || who.email || `${who.role || "user"}#${who.id}`, note, id],
    );
    if (!r.affectedRows) return res.status(404).json({ success: false, message: "Alert not found or already resolved" });
    res.json({ success: true, message: "Alert resolved" });
  } catch (error) {
    console.error("Emergency resolve error:", error);
    res.status(500).json({ success: false, message: "Failed to resolve alert" });
  }
};
