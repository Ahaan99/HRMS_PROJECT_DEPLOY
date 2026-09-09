import { asyncHandler } from "../../../utils/asyncHandler.js";
import { db } from "../../../config/db.js";

/* ---------- login_logs table (lazy ensure, runs once) ---------- */
let logsTableReady = false;
const ensureLoginLogsTable = async () => {
  if (logsTableReady) return;
  await db.query(`
    CREATE TABLE IF NOT EXISTS login_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user VARCHAR(150) NOT NULL,
      role VARCHAR(50) NULL,
      ip VARCHAR(100) NULL,
      action VARCHAR(50) NOT NULL DEFAULT 'Login',
      status ENUM('success','failed') NOT NULL DEFAULT 'success',
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_ll_time (timestamp),
      INDEX idx_ll_status (status)
    )
  `);
  logsTableReady = true;
};

/* Helper used by auth controllers to record login attempts.
   Never throws — logging must not break login. */
export const logLoginEvent = async (req, { user, role, action = "Login", status = "success" }) => {
  try {
    await ensureLoginLogsTable();
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket?.remoteAddress ||
      null;
    await db.query(
      "INSERT INTO login_logs (user, role, ip, action, status) VALUES (?,?,?,?,?)",
      [String(user || "unknown").slice(0, 150), role || null, ip, action, status],
    );
  } catch (e) {
    console.error("logLoginEvent failed:", e.message);
  }
};

/* ================= SECURITY STATS ================= */
export const getStats = asyncHandler(async (req, res) => {
  await ensureLoginLogsTable();

  const [[logins]] = await db.query(`
    SELECT
      COUNT(*) AS totalLogins,
      SUM(DATE(timestamp) = CURDATE()) AS todayLogins,
      SUM(status = 'failed') AS failedLogins
    FROM login_logs
  `);
  const [[sessions]] = await db.query(
    "SELECT SUM(revoked = 0) AS active, SUM(revoked = 1) AS revoked FROM user_sessions",
  );
  const [[portals]] = await db.query(
    "SELECT COUNT(*) AS total, SUM(is_enabled = 1) AS enabled FROM portal_settings",
  );
  const [[twofa]] = await db.query(
    "SELECT SUM(two_factor_enabled = 1) AS enabled, COUNT(*) AS total FROM super_admins",
  );

  res.json({
    success: true,
    data: {
      totalLogins: Number(logins.totalLogins) || 0,
      todayLogins: Number(logins.todayLogins) || 0,
      failedLogins: Number(logins.failedLogins) || 0,
      activeSessions: Number(sessions.active) || 0,
      revokedSessions: Number(sessions.revoked) || 0,
      portalsEnabled: Number(portals.enabled) || 0,
      portalsTotal: Number(portals.total) || 0,
      twoFactorAdmins: Number(twofa.enabled) || 0,
      totalAdmins: Number(twofa.total) || 0,
      lastBackup: null,
      systemUptime: process.uptime
        ? `${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m`
        : "N/A",
    },
  });
});

/* ================= LOGIN LOGS ================= */
export const getLoginLogs = asyncHandler(async (req, res) => {
  await ensureLoginLogsTable();
  const limit = Math.min(Number(req.query.limit) || 200, 1000);
  const [rows] = await db.query(
    "SELECT id, user, role, ip, action, status, timestamp FROM login_logs ORDER BY timestamp DESC LIMIT ?",
    [limit],
  );
  res.json({ success: true, data: rows });
});

export const clearLoginLogs = asyncHandler(async (req, res) => {
  await ensureLoginLogsTable();
  await db.query("DELETE FROM login_logs");
  res.json({ success: true, message: "Login logs cleared" });
});

/* ================= PORTAL MASTER CONTROL ================= */
export const listPortals = asyncHandler(async (req, res) => {
  const [rows] = await db.query(
    "SELECT id, portal_name, is_enabled, updated_at FROM portal_settings ORDER BY portal_name",
  );
  res.json({ success: true, data: rows });
});

export const togglePortal = asyncHandler(async (req, res) => {
  const { is_enabled } = req.body;
  if (is_enabled === undefined)
    return res.status(400).json({ success: false, message: "is_enabled is required" });
  const [result] = await db.query(
    "UPDATE portal_settings SET is_enabled = ? WHERE id = ?",
    [is_enabled ? 1 : 0, req.params.id],
  );
  if (!result.affectedRows)
    return res.status(404).json({ success: false, message: "Portal not found" });
  res.json({ success: true, message: `Portal ${is_enabled ? "enabled" : "disabled"}` });
});

/* ================= GLOBAL DEVICE SESSIONS ================= */
export const listAllSessions = asyncHandler(async (req, res) => {
  const { role, status } = req.query;
  const where = [];
  const params = [];
  if (role) {
    where.push("role = ?");
    params.push(role);
  }
  if (status === "active") where.push("revoked = 0");
  if (status === "revoked") where.push("revoked = 1");
  const [rows] = await db.query(
    `SELECT id, user_id, role, device, ip, revoked, created_at, last_seen
     FROM user_sessions
     ${where.length ? "WHERE " + where.join(" AND ") : ""}
     ORDER BY last_seen DESC
     LIMIT 500`,
    params,
  );
  res.json({ success: true, data: rows });
});

export const revokeAnySession = asyncHandler(async (req, res) => {
  const [result] = await db.query(
    "UPDATE user_sessions SET revoked = 1 WHERE id = ? AND revoked = 0",
    [req.params.id],
  );
  if (!result.affectedRows)
    return res
      .status(404)
      .json({ success: false, message: "Session not found or already revoked" });
  res.json({ success: true, message: "Session revoked" });
});
