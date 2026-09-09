import { db } from "../../../config/db.js";

export const getClientId = async (client_code) => {
  const [rows] = await db.query(
    `SELECT id FROM clients WHERE client_code = ? LIMIT 1`,
    [client_code]
  );

  if (!rows.length) throw new Error("Client not found");

  return rows[0].id;
};