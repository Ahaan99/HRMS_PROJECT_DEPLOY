 import { db } from "../../../config/db.js";

// helper
const getClientId = async (client_code) => {
  const [rows] = await db.query(
    `SELECT id FROM clients WHERE client_code = ? LIMIT 1`,
    [client_code],
  );

  if (!rows.length) throw new Error("Client not found");

  return rows[0].id;
};

// ================= GET
export const getClientInterviewsService = async (client_code) => {
  const client_id = await getClientId(client_code);

  const [rows] = await db.query(
    `SELECT *
     FROM client_interviews
     WHERE client_id = ?
     AND call_status_id = 6
     ORDER BY created_at DESC`,
    [client_id],
  );
  return rows;
};

// ================= UPDATE
export const updateClientDecisionService = async (client_code, id, payload) => {
  const client_id = await getClientId(client_code);

  const { client_status, client_remarks } = payload;

  if (!["accepted", "rejected"].includes(client_status)) {
    throw new Error("Invalid status");
  }

  await db.query(
    `UPDATE client_interviews
     SET client_status = ?, client_remarks = ?
     WHERE id = ? AND client_id = ?`,
    [client_status, client_remarks || null, id, client_id],
  );
};
