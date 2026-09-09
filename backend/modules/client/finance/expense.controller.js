import { db } from "../../../config/db.js";
import { getClientId } from "../utils/getClientId.js";

export const getClientExpenses = async (req, res) => {
  try {
    const { client_code } = req.client;

    const client_id = await getClientId(client_code);

    const [rows] = await db.query(
      `SELECT e.*, c.name as category
       FROM client_expenses e
       LEFT JOIN expense_categories c ON e.category_id = c.id
       WHERE e.client_id = ?
       ORDER BY e.expense_date DESC`,
      [client_id]
    );

    res.json(rows);

  } catch (err) {
    console.log("EXPENSE ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
};

export const addClientExpense = async (req, res) => {
  try {
    const { client_code } = req.client;

    const client_id = await getClientId(client_code);

    const { category_id, amount, expense_date, description } = req.body;

    await db.query(
      `INSERT INTO client_expenses  
       (client_id, category_id, amount, expense_date, description)
       VALUES (?, ?, ?, ?, ?)`,
      [client_id, category_id, amount, expense_date, description]
    );

    res.json({ msg: "Expense added" });

  } catch (err) {
    console.log("ADD EXPENSE ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
};

export const getExpenseCategories = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, name FROM expense_categories`
    );

    res.json({
      success: true,
      data: rows,
    });

  } catch (err) {
    console.log("CATEGORY ERROR:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

export const updateClientExpense = async (req, res) => {
  try {
    const { client_code } = req.client;
    const client_id = await getClientId(client_code);

    const { category_id, amount, expense_date, description } = req.body;

    const [result] = await db.query(
      `UPDATE client_expenses
       SET category_id = ?, amount = ?, expense_date = ?, description = ?
       WHERE id = ? AND client_id = ?`,
      [category_id || null, amount, expense_date, description || null, req.params.id, client_id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ msg: "Expense entry not found" });
    }

    res.json({ msg: "Expense updated" });
  } catch (err) {
    console.log("UPDATE EXPENSE ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
};

export const deleteClientExpense = async (req, res) => {
  try {
    const { client_code } = req.client;
    const client_id = await getClientId(client_code);

    const [result] = await db.query(
      `DELETE FROM client_expenses WHERE id = ? AND client_id = ?`,
      [req.params.id, client_id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ msg: "Expense entry not found" });
    }

    res.json({ msg: "Expense deleted" });
  } catch (err) {
    console.log("DELETE EXPENSE ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
};

export const getExpenseTotal = async (req, res) => {
  try {
    const { client_code } = req.client;
    const client_id = await getClientId(client_code);

    const [[row]] = await db.query(
      `SELECT COALESCE(SUM(amount), 0) AS total
       FROM client_expenses WHERE client_id = ?`,
      [client_id]
    );

    res.json(row);
  } catch (err) {
    console.log("EXPENSE TOTAL ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
};

export const getExpenseByCategory = async (req, res) => {
  try {
    const { client_code } = req.client;
    const client_id = await getClientId(client_code);

    const [rows] = await db.query(
      `SELECT COALESCE(c.name, 'Uncategorized') AS category,
              COALESCE(SUM(e.amount), 0) AS total
       FROM client_expenses e
       LEFT JOIN expense_categories c ON e.category_id = c.id
       WHERE e.client_id = ?
       GROUP BY c.name`,
      [client_id]
    );

    res.json(rows);
  } catch (err) {
    console.log("EXPENSE BY CATEGORY ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
};

export const getExpenseByDateRange = async (req, res) => {
  try {
    const { client_code } = req.client;
    const client_id = await getClientId(client_code);
    const { startDate, endDate } = req.query;

    const [rows] = await db.query(
      `SELECT e.*, c.name as category
       FROM client_expenses e
       LEFT JOIN expense_categories c ON e.category_id = c.id
       WHERE e.client_id = ? AND e.expense_date BETWEEN ? AND ?
       ORDER BY e.expense_date DESC`,
      [client_id, startDate, endDate]
    );

    res.json(rows);
  } catch (err) {
    console.log("EXPENSE DATE RANGE ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
};