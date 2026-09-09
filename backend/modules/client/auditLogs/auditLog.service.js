import { db } from "../../../config/db.js";

export const fetchLogs = async (clientId) => {
  const [rows] = await db.query(
    `SELECT * FROM audit_logs 
     WHERE client_id = ?
     ORDER BY timestamp DESC`,
    [clientId],
  );

  return rows.map((row) => ({
    ...row,
    details: (() => {
      if (typeof row.details !== "string") return row.details;

      try {
        return JSON.parse(row.details);
      } catch (err) {
        return row.details; // fallback if not JSON
      }
    })(),
  }));
};
