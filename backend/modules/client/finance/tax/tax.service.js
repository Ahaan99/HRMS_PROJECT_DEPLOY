import { db } from "../../../../config/db.js";

// GET ALL
export const fetchAllTaxes = async (clientId) => {
  const [rows] = await db.query(
    `SELECT * FROM tax_records WHERE client_id = ? ORDER BY id DESC`,
    [clientId]
  );

  return rows;
};

// TOTALS
export const fetchTotals = async (clientId) => {
  const [rows] = await db.query(
    `SELECT 
      SUM(CASE WHEN type = 'GST' THEN amount ELSE 0 END) AS gstTotal,
      SUM(CASE WHEN type = 'TDS' THEN amount ELSE 0 END) AS tdsTotal
     FROM tax_records
     WHERE client_id = ?`,
    [clientId]
  );

  return {
    gstTotal: rows[0]?.gstTotal || 0,
    tdsTotal: rows[0]?.tdsTotal || 0,
  };
};

// FILTER
export const fetchByType = async (clientId, type) => {
  const [rows] = await db.query(
    `SELECT * FROM tax_records WHERE client_id = ? AND type = ?`,
    [clientId, type]
  );

  return rows;
};

// CREATE
export const createTax = async (data) => {
  const { client_id, type, amount, date, description } = data;

  const [result] = await db.query(
    `INSERT INTO tax_records (client_id, type, amount, date, description)
     VALUES (?, ?, ?, ?, ?)`,
    [client_id, type, amount, date, description]
  );

  return { id: result.insertId, ...data };
};

// DELETE
export const deleteTaxById = async (id, clientId) => {
  await db.query(
    `DELETE FROM tax_records WHERE id = ? AND client_id = ?`,
    [id, clientId]
  );
};
