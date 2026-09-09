import { db } from "../config/db.js";

export const logAudit = async ({
  client_id,
  user_name,
  action,
  details,
}) => {
  try {
    await db.query(
      `INSERT INTO audit_logs (client_id, user_name, action, details)
       VALUES (?, ?, ?, ?)`,
      [
        client_id,
        user_name || "System",
        action,
        JSON.stringify(details || {}),
      ]
    );
  } catch (error) {
    console.error("Audit log error:", error);
  }
};