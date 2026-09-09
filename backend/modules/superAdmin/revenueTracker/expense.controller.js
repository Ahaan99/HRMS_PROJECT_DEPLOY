import { db } from "../../../config/db.js";

export const createExpense = async (req, res) => {
  try {
    const { category_id, amount, expense_date, description } = req.body;

    const [result] = await db.query(
      `INSERT INTO expenses
      (category_id, source, amount, expense_date, description)
      VALUES (?, 'manual', ?, ?, ?)`,
      [category_id, amount, expense_date, description],
    );

    res.json({
      success: true,
      message: "Expense added successfully",
      id: result.insertId,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const getExpenses = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT e.*, c.name category
      FROM expenses e
      LEFT JOIN expense_categories c
      ON e.category_id = c.id
      ORDER BY expense_date DESC
    `);

    res.json(rows);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const getExpenseCategories = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, name
      FROM expense_categories
      ORDER BY name
    `);

    return res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error("getExpenseCategories error:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
