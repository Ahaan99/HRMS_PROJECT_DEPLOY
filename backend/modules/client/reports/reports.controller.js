// reports.controller.js
import { db } from "../../../config/db.js";
import { getClientId } from "../utils/getClientId.js";

const getTotals = async (client_id) => {
  const [[rev]] = await db.query(
    `SELECT COALESCE(SUM(amount), 0) AS total FROM client_revenue WHERE client_id = ?`,
    [client_id]
  );
  const [[exp]] = await db.query(
    `SELECT COALESCE(SUM(amount), 0) AS total FROM client_expenses WHERE client_id = ?`,
    [client_id]
  );
  return { revenue: Number(rev.total) || 0, expenses: Number(exp.total) || 0 };
};

// GET /api/client/reports/profit-loss
export const getProfitLoss = async (req, res) => {
  try {
    const { client_code } = req.client;
    const client_id = await getClientId(client_code);

    const { revenue, expenses } = await getTotals(client_id);
    const profit = revenue - expenses;
    const profitMargin =
      revenue > 0 ? Number(((profit / revenue) * 100).toFixed(2)) : 0;

    res.json({ revenue, expenses, profit, profitMargin });
  } catch (err) {
    console.log("REPORT P&L ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
};

// GET /api/client/reports/balance-sheet
export const getBalanceSheet = async (req, res) => {
  try {
    const { client_code } = req.client;
    const client_id = await getClientId(client_code);

    const [[inv]] = await db.query(
      `SELECT COALESCE(SUM(quantity * price), 0) AS total
       FROM inventory WHERE client_id = ?`,
      [client_id]
    );
    const [[ast]] = await db.query(
      `SELECT COALESCE(SUM(value), 0) AS total
       FROM assets WHERE client_id = ?`,
      [client_id]
    );
    const [[tax]] = await db.query(
      `SELECT COALESCE(SUM(amount), 0) AS total
       FROM tax_records WHERE client_id = ?`,
      [client_id]
    );

    const inventoryValue = Number(inv.total) || 0;
    const assetValue = Number(ast.total) || 0;
    const assets = inventoryValue + assetValue;
    const liabilities = Number(tax.total) || 0;
    const equity = assets - liabilities;

    res.json({ assets, liabilities, equity, inventoryValue, assetValue });
  } catch (err) {
    console.log("REPORT BALANCE SHEET ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
};

// GET /api/client/reports/cash-flow
export const getCashFlow = async (req, res) => {
  try {
    const { client_code } = req.client;
    const client_id = await getClientId(client_code);

    const { revenue, expenses } = await getTotals(client_id);

    res.json({
      inflow: revenue,
      outflow: expenses,
      cashFlow: revenue - expenses,
    });
  } catch (err) {
    console.log("REPORT CASH FLOW ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
};

// GET /api/client/reports/summary
export const getSummary = async (req, res) => {
  try {
    const { client_code } = req.client;
    const client_id = await getClientId(client_code);

    const { revenue, expenses } = await getTotals(client_id);

    const [[inv]] = await db.query(
      `SELECT COALESCE(SUM(quantity * price), 0) AS total
       FROM inventory WHERE client_id = ?`,
      [client_id]
    );
    const [[ast]] = await db.query(
      `SELECT COALESCE(SUM(value), 0) AS total
       FROM assets WHERE client_id = ?`,
      [client_id]
    );

    res.json({
      revenue,
      expenses,
      profit: revenue - expenses,
      inventoryValue: Number(inv.total) || 0,
      assetValue: Number(ast.total) || 0,
    });
  } catch (err) {
    console.log("REPORT SUMMARY ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
};
