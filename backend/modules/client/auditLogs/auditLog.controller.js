import { fetchLogs } from "./auditLog.service.js";
import { db } from "../../../config/db.js";

const getClientId = async (client_code) => {
  const [rows] = await db.query(
    `SELECT id FROM clients WHERE client_code = ? LIMIT 1`,
    [client_code]
  );
  return rows[0]?.id;
};

export const getLogs = async (req, res) => {
  try {
    const clientId = await getClientId(req.client.client_code);

    const logs = await fetchLogs(clientId);

    res.json(logs);
  } catch (error) {
    console.error("getLogs:", error);
    res.status(500).json({ message: "Failed to fetch logs" });
  }
};
