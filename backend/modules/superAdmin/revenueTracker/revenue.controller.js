import {db} from "../../../config/db.js";

export const createRevenue = async (req, res) => {
  try {

    const {
      category_id,
      amount,
      revenue_date,
      description
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO revenues
      (category_id, source, amount, revenue_date, description)
      VALUES (?, 'manual', ?, ?, ?)`,
      [category_id, amount, revenue_date, description]
    );

    res.json({
      success: true,
      message: "Revenue added",
      id: result.insertId
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

export const getRevenues = async (req, res) => {
  try {

    const [rows] = await db.query(`
      SELECT r.*, c.name category
      FROM revenues r
      LEFT JOIN revenue_categories c
      ON r.category_id = c.id
      ORDER BY revenue_date DESC
    `);

    res.json(rows);

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message
    });

  }
};

export const getRevenueCategories = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, name FROM revenue_categories ORDER BY name"
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};