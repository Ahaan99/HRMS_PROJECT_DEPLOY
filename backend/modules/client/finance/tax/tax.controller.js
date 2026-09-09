import {
  fetchAllTaxes,
  fetchTotals,
  fetchByType,
  createTax,
  deleteTaxById,
} from "./tax.service.js";

import { db } from "../../../../config/db.js";

// helper
const getClientId = async (client_code) => {
  const [rows] = await db.query(
    `SELECT id FROM clients WHERE client_code = ? LIMIT 1`,
    [client_code]
  );

  if (!rows.length) throw new Error("Client not found");

  return rows[0].id;
};

// GET ALL
export const getAllTaxRecords = async (req, res) => {
  try {
    const clientId = await getClientId(req.client.client_code);

    const data = await fetchAllTaxes(clientId);

    res.json(data);
  } catch (error) {
    console.error("getAllTaxRecords:", error);
    res.status(500).json({ message: "Failed to fetch tax records" });
  }
};

// TOTALS
export const getTaxTotals = async (req, res) => {
  try {
    const clientId = await getClientId(req.client.client_code);

    const totals = await fetchTotals(clientId);

    res.json(totals);
  } catch (error) {
    console.error("getTaxTotals:", error);
    res.status(500).json({ message: "Failed to fetch totals" });
  }
};

// FILTER
export const getByType = async (req, res) => {
  try {
    const clientId = await getClientId(req.client.client_code);
    const { type } = req.params;

    const data = await fetchByType(clientId, type);

    res.json(data);
  } catch (error) {
    console.error("getByType:", error);
    res.status(500).json({ message: "Failed to fetch by type" });
  }
};

// CREATE
export const createTaxRecord = async (req, res) => {
  try {
    const clientId = await getClientId(req.client.client_code);

    const { type, amount, date, description } = req.body;

    if (!type || !amount || amount < 0) {
      return res.status(400).json({ message: "Invalid data" });
    }

    const record = await createTax({
      client_id: clientId,
      type,
      amount: Number(amount),
      date,
      description,
    });

    res.status(201).json(record);
  } catch (error) {
    console.error("createTaxRecord:", error);
    res.status(500).json({ message: "Failed to create record" });
  }
};

// DELETE
export const deleteTaxRecord = async (req, res) => {
  try {
    const clientId = await getClientId(req.client.client_code);
    const { id } = req.params;

    await deleteTaxById(id, clientId);

    res.json({ message: "Record deleted successfully" });
  } catch (error) {
    console.error("deleteTaxRecord:", error);
    res.status(500).json({ message: "Failed to delete record" });
  }
};