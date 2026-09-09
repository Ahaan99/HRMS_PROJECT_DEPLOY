import { db } from "../../../config/db.js";
import { getClientId } from "../utils/getClientId.js";

export const getClientProfitSummary = async (req, res) => {
  try {
    const { client_code } = req.client;
    
    const client_id = await getClientId(client_code);    

    const [[rev]] = await db.query(
      `SELECT SUM(amount) as total FROM client_revenue WHERE client_id = ?`,
      [client_id],
    );

    const [[exp]] = await db.query(
      `SELECT SUM(amount) as total FROM client_expenses WHERE client_id = ?`,
      [client_id],
    );

    const totalRevenue = rev.total || 0;
    const totalExpenses = exp.total || 0;

    res.json({
      revenue: totalRevenue,
      expenses: totalExpenses,
      profit: totalRevenue - totalExpenses,
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
