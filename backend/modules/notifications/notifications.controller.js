import { db } from "../../config/db.js";

const audienceFor = (role) => (role === "EMPLOYEE" ? "EMPLOYEE" : "ADMIN");

export const listNotifications = async (req, res) => {
  try {
    const audience = audienceFor(req.user.role);
    const [rows] = await db.query(
      `SELECT * FROM notifications
       WHERE audience = ? AND (user_id IS NULL OR user_id = ?)
       ORDER BY created_at DESC LIMIT 100`,
      [audience, req.user.id],
    );
    const [[c]] = await db.query(
      `SELECT COUNT(*) AS unread FROM notifications
       WHERE audience = ? AND (user_id IS NULL OR user_id = ?) AND is_read = 0`,
      [audience, req.user.id],
    );
    res.json({ success: true, notifications: rows, unread: c.unread });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const markRead = async (req, res) => {
  try {
    await db.query("UPDATE notifications SET is_read = 1 WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const markAllRead = async (req, res) => {
  try {
    const audience = audienceFor(req.user.role);
    await db.query(
      "UPDATE notifications SET is_read = 1 WHERE audience = ? AND (user_id IS NULL OR user_id = ?)",
      [audience, req.user.id],
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
