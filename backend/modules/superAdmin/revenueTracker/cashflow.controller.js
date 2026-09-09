import { db } from "../../../config/db.js";

export const getCashFlow = async (req, res) => {
  try {

    const [[row]] = await db.query(`
      SELECT backup, monthly_expense
      FROM cash_flow
      LIMIT 1
    `);

    const backup = Number(row?.backup || 0);
    const monthlyExpense = Number(row?.monthly_expense || 0);

    const runway = monthlyExpense
      ? (backup / monthlyExpense).toFixed(1)
      : 0;

    res.json({
      backup,
      monthlyExpense,
      runway,
    });

  } catch (err) {
    console.error("CashFlow error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const saveCashFlow = async (req, res) => {
  try {
    const { backup, monthlyExpense } = req.body;

    // delete old data (keep only 1 row)
    await db.query(`DELETE FROM cash_flow`);

    // insert new values
    await db.query(
      `INSERT INTO cash_flow (backup, monthly_expense)
       VALUES (?, ?)`,
      [backup || 0, monthlyExpense || 0]
    );

    res.json({ success: true });

  } catch (e) {
    console.log("CashFlow Error:", e);
    res.status(500).json({ message: e.message });
  }
};