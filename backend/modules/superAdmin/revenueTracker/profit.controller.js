import {db} from "../../../config/db.js";

export const getProfitSummary = async (req, res) => {

  try {

    const [rev] = await db.query(
      "SELECT SUM(amount) total FROM revenues"
    );

    const [exp] = await db.query(
      "SELECT SUM(amount) total FROM expenses"
    );

    const revenue = rev[0].total || 0;
    const expenses = exp[0].total || 0;

    res.json({
      revenue,
      expenses,
      profit: revenue - expenses
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};


export const generateMonthlyProfit = async (req, res) => {

  try {

    const { month, year } = req.body;

    const [rev] = await db.query(
      `SELECT SUM(amount) total
       FROM revenues
       WHERE MONTH(revenue_date)=?
       AND YEAR(revenue_date)=?`,
      [month, year]
    );

    const [exp] = await db.query(
      `SELECT SUM(amount) total
       FROM expenses
       WHERE MONTH(expense_date)=?
       AND YEAR(expense_date)=?`,
      [month, year]
    );

    const revenue = rev[0].total || 0;
    const expenses = exp[0].total || 0;
    const profit = revenue - expenses;

    await db.query(
      `INSERT INTO profit_reports
      (month, year, total_revenue, total_expenses, net_profit)
      VALUES (?, ?, ?, ?, ?)`,
      [month, year, revenue, expenses, profit]
    );

    res.json({
      revenue,
      expenses,
      profit
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message
    });

  }

};