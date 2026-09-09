// ledger.controller.js
import { db } from "../../../config/db.js";
import { getClientId } from "../utils/getClientId.js";

export const getLedger = async (req, res) => {
  try {
    const { client_code } = req.client;
    const client_id = await getClientId(client_code);

    const [rows] = await db.query(
      `SELECT id, clientId, date, account, LOWER(type) AS type, amount, description
       FROM general_ledger
       WHERE clientId = ?
       ORDER BY date DESC, id DESC`,
      [client_id]
    );

    res.json(rows);
  } catch (err) {
    console.log("LEDGER ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
};

export const getLedgerByDateRange = async (req, res) => {
  try {
    const { client_code } = req.client;
    const client_id = await getClientId(client_code);

    const startDate = req.query.startDate || req.query.start;
    const endDate = req.query.endDate || req.query.end;

    if (!startDate || !endDate)
      return res
        .status(400)
        .json({ msg: "startDate and endDate are required" });

    const [rows] = await db.query(
      `SELECT id, clientId, date, account, LOWER(type) AS type, amount, description
       FROM general_ledger
       WHERE clientId = ? AND DATE(date) BETWEEN ? AND ?
       ORDER BY date DESC, id DESC`,
      [client_id, startDate, endDate]
    );

    res.json(rows);
  } catch (err) {
    console.log("LEDGER DATE RANGE ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
};

export const getLedgerBalances = async (req, res) => {
  try {
    const { client_code } = req.client;
    const client_id = await getClientId(client_code);

    const [[row]] = await db.query(
      `SELECT
         COALESCE(SUM(CASE WHEN type = 'CREDIT' THEN amount ELSE 0 END), 0) AS total_credit,
         COALESCE(SUM(CASE WHEN type = 'DEBIT' THEN amount ELSE 0 END), 0) AS total_debit,
         COALESCE(SUM(CASE WHEN type = 'CREDIT' THEN amount ELSE -amount END), 0) AS balance
       FROM general_ledger
       WHERE clientId = ?`,
      [client_id]
    );

    res.json(row);
  } catch (err) {
    console.log("LEDGER BALANCES ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
};

export const addLedgerEntry = async (req, res) => {
  try {
    const { client_code } = req.client;
    const client_id = await getClientId(client_code);

    const { type, amount, description, date, account } = req.body;

    const cleanType = String(type || "").toUpperCase();
    if (!["DEBIT", "CREDIT"].includes(cleanType))
      return res.status(400).json({ msg: "Type must be debit or credit" });

    const cleanAmount = Number(amount);
    if (!cleanAmount || cleanAmount <= 0)
      return res
        .status(400)
        .json({ msg: "A valid positive amount is required" });

    if (!date) return res.status(400).json({ msg: "Date is required" });

    await db.query(
      `INSERT INTO general_ledger (clientId, date, account, type, amount, description)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        client_id,
        date,
        account || null,
        cleanType,
        cleanAmount,
        description || null,
      ]
    );

    res.json({ msg: "Ledger entry added" });
  } catch (err) {
    console.log("ADD LEDGER ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
};

export const deleteLedgerEntry = async (req, res) => {
  try {
    const { client_code } = req.client;
    const client_id = await getClientId(client_code);

    const [result] = await db.query(
      `DELETE FROM general_ledger WHERE id = ? AND clientId = ?`,
      [req.params.id, client_id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ msg: "Ledger entry not found" });

    res.json({ msg: "Ledger entry deleted" });
  } catch (err) {
    console.log("DELETE LEDGER ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
};
