import { db } from "../../../config/db.js";
import { getClientId } from "../utils/getClientId.js";

export const getClientRevenue = async (req, res) => {
  try {
    const { client_code } = req.client;

    const client_id = await getClientId(client_code);

    const [rows] = await db.query(
      `SELECT r.*, c.name as category
       FROM client_revenue r
       LEFT JOIN revenue_categories c ON r.category_id = c.id
       WHERE r.client_id = ?
       ORDER BY r.revenue_date DESC`,
      [client_id]
    );

    res.json(rows);

  } catch (err) {
    console.log("REVENUE ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
};

export const addClientRevenue = async (req, res) => {
  try {
    const { client_code } = req.client;

    const client_id = await getClientId(client_code);

    const { category_id, amount, revenue_date, description } = req.body;

    await db.query(
      `INSERT INTO client_revenue  
       (client_id, category_id, amount, revenue_date, description)
       VALUES (?, ?, ?, ?, ?)`,
      [client_id, category_id || null, amount, revenue_date, description || null]
    );

    res.json({ msg: "Revenue added" });

  } catch (err) {
    console.log("ADD REVENUE ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
};

export const updateClientRevenue = async (req, res) => {
  try {
    const { client_code } = req.client;
    const client_id = await getClientId(client_code);

    const { category_id, amount, revenue_date, description } = req.body;

    const [result] = await db.query(
      `UPDATE client_revenue
       SET category_id = ?, amount = ?, revenue_date = ?, description = ?
       WHERE id = ? AND client_id = ?`,
      [category_id || null, amount, revenue_date, description || null, req.params.id, client_id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ msg: "Revenue entry not found" });
    }

    res.json({ msg: "Revenue updated" });

  } catch (err) {
    console.log("UPDATE REVENUE ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
};

export const deleteClientRevenue = async (req, res) => {
  try {
    const { client_code } = req.client;
    const client_id = await getClientId(client_code);

    const [result] = await db.query(
      `DELETE FROM client_revenue WHERE id = ? AND client_id = ?`,
      [req.params.id, client_id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ msg: "Revenue entry not found" });
    }

    res.json({ msg: "Revenue deleted" });

  } catch (err) {
    console.log("DELETE REVENUE ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
};

export const getRevenueCategories = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, name FROM revenue_categories`
    );

    res.json(rows);

  } catch (err) {
    console.log("REVENUE CATEGORY ERROR:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getRevenueTotal = async (req, res) => {
  try {
    const { client_code } = req.client;
    const client_id = await getClientId(client_code);

    const [[row]] = await db.query(
      `SELECT COALESCE(SUM(amount), 0) AS total
       FROM client_revenue WHERE client_id = ?`,
      [client_id]
    );

    res.json(row);
  } catch (err) {
    console.log("REVENUE TOTAL ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
};

export const getRevenueByDateRange = async (req, res) => {
  try {
    const { client_code } = req.client;
    const client_id = await getClientId(client_code);
    const { startDate, endDate } = req.query;

    const [rows] = await db.query(
      `SELECT r.*, c.name as category
       FROM client_revenue r
       LEFT JOIN revenue_categories c ON r.category_id = c.id
       WHERE r.client_id = ? AND r.revenue_date BETWEEN ? AND ?
       ORDER BY r.revenue_date DESC`,
      [client_id, startDate, endDate]
    );

    res.json(rows);
  } catch (err) {
    console.log("REVENUE DATE RANGE ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
};
