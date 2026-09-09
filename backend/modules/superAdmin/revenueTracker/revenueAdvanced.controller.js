import { db } from "../../../config/db.js";

/* ------------------------------------------------------------------ */
/* Tables                                                              */
/* ------------------------------------------------------------------ */
const ensureTables = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS revenue_targets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      year INT NOT NULL,
      month INT NOT NULL,
      target_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
      incentive_rate DECIMAL(5,2) NOT NULL DEFAULT 5,
      notes VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_year_month (year, month)
    )
  `);
};
ensureTables().catch((e) => console.error("revenue_targets init error:", e.message));

const ym = (req) => {
  const now = new Date();
  return {
    year: Number(req.query.year) || now.getFullYear(),
    month: Number(req.query.month) || now.getMonth() + 1,
  };
};

/* ------------------------------------------------------------------ */
/* Targets CRUD                                                        */
/* ------------------------------------------------------------------ */
export const getTargets = async (req, res) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();
    const [rows] = await db.query(
      "SELECT * FROM revenue_targets WHERE year = ? ORDER BY month",
      [year]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const setTarget = async (req, res) => {
  try {
    const { year, month, target_amount, incentive_rate, notes } = req.body;
    if (!year || !month || target_amount === undefined)
      return res.status(400).json({ success: false, message: "year, month, target_amount required" });
    await db.query(
      `INSERT INTO revenue_targets (year, month, target_amount, incentive_rate, notes)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE target_amount = VALUES(target_amount),
         incentive_rate = VALUES(incentive_rate), notes = VALUES(notes)`,
      [year, month, Number(target_amount), Number(incentive_rate) || 5, notes || null]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const deleteTarget = async (req, res) => {
  try {
    await db.query("DELETE FROM revenue_targets WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

/* ------------------------------------------------------------------ */
/* Combined dashboard summary                                          */
/* ------------------------------------------------------------------ */
export const advancedSummary = async (req, res) => {
  try {
    const { year, month } = ym(req);

    /* Daily revenue for the month (manual revenues + invoiced amounts) */
    const [daily] = await db.query(
      `SELECT d.day, SUM(d.amount) AS amount FROM (
         SELECT DATE(revenue_date) AS day, amount FROM revenues
         WHERE YEAR(revenue_date) = ? AND MONTH(revenue_date) = ?
         UNION ALL
         SELECT DATE(invoice_date) AS day, total_amount AS amount FROM invoices
         WHERE YEAR(invoice_date) = ? AND MONTH(invoice_date) = ?
           AND status <> 'Cancelled'
       ) d GROUP BY d.day ORDER BY d.day`,
      [year, month, year, month]
    );

    const monthRevenue = daily.reduce((s, r) => s + Number(r.amount), 0);

    /* Target progress */
    const [[target]] = await db.query(
      "SELECT * FROM revenue_targets WHERE year = ? AND month = ?",
      [year, month]
    );

    /* Client-wise revenue (invoices, year scope) */
    const [clientWise] = await db.query(
      `SELECT client_name, COUNT(*) AS invoices,
              SUM(total_amount) AS billed, SUM(paid_amount) AS collected
       FROM invoices
       WHERE YEAR(invoice_date) = ? AND status <> 'Cancelled'
       GROUP BY client_name ORDER BY billed DESC LIMIT 15`,
      [year]
    );

    /* Recruiter-wise billing (invoices.employee_id, year scope) */
    const [recruiterWise] = await db.query(
      `SELECT i.employee_id, COALESCE(e.name, CONCAT('Employee #', i.employee_id), 'Unassigned') AS recruiter,
              COUNT(*) AS invoices, SUM(i.total_amount) AS billed, SUM(i.paid_amount) AS collected
       FROM invoices i
       LEFT JOIN employees e ON e.id = i.employee_id
       WHERE YEAR(i.invoice_date) = ? AND i.status <> 'Cancelled'
       GROUP BY i.employee_id, recruiter ORDER BY billed DESC`,
      [year]
    );

    /* Incentives on collected amounts */
    const rate = target ? Number(target.incentive_rate) : 5;
    const incentives = recruiterWise
      .filter((r) => r.employee_id)
      .map((r) => ({
        recruiter: r.recruiter,
        collected: Number(r.collected) || 0,
        rate,
        incentive: Math.round(((Number(r.collected) || 0) * rate) / 100),
      }));

    /* Pending invoices */
    const [pending] = await db.query(
      `SELECT id, invoice_no, client_name, total_amount, paid_amount, due_date, status
       FROM invoices
       WHERE status NOT IN ('Paid','Cancelled')
       ORDER BY due_date IS NULL, due_date`
    );
    const pendingAmount = pending.reduce(
      (s, r) => s + (Number(r.total_amount) - Number(r.paid_amount || 0)),
      0
    );

    /* Collections by month (year) */
    const [collections] = await db.query(
      `SELECT MONTH(paid_date) AS month, SUM(paid_amount) AS collected
       FROM invoices
       WHERE paid_date IS NOT NULL AND YEAR(paid_date) = ?
       GROUP BY MONTH(paid_date) ORDER BY month`,
      [year]
    );

    /* Profitability by month: revenue vs expenses */
    const [revByMonth] = await db.query(
      `SELECT m.month, SUM(m.amount) AS revenue FROM (
         SELECT MONTH(revenue_date) AS month, amount FROM revenues WHERE YEAR(revenue_date) = ?
         UNION ALL
         SELECT MONTH(invoice_date) AS month, total_amount FROM invoices
         WHERE YEAR(invoice_date) = ? AND status <> 'Cancelled'
       ) m GROUP BY m.month ORDER BY m.month`,
      [year, year]
    );
    const [expByMonth] = await db.query(
      `SELECT m.month, SUM(m.amount) AS expense FROM (
         SELECT MONTH(expense_date) AS month, amount FROM expenses WHERE YEAR(expense_date) = ?
         UNION ALL
         SELECT MONTH(expense_date) AS month, amount FROM finance_expenses WHERE YEAR(expense_date) = ?
       ) m GROUP BY m.month ORDER BY m.month`,
      [year, year]
    );
    const profitability = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const revenue = Number(revByMonth.find((r) => r.month === m)?.revenue || 0);
      const expense = Number(expByMonth.find((r) => r.month === m)?.expense || 0);
      return { month: m, revenue, expense, profit: revenue - expense };
    });

    /* Sales conversion: leads vs converted clients (year) */
    const [[leadStats]] = await db.query(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) AS accepted
       FROM leads WHERE YEAR(created_at) = ?`,
      [year]
    );
    const [[clientStats]] = await db.query(
      "SELECT COUNT(*) AS newClients FROM clients WHERE YEAR(created_at) = ?",
      [year]
    );

    res.json({
      period: { year, month },
      daily,
      monthRevenue,
      target: target || null,
      targetProgress: target && Number(target.target_amount) > 0
        ? Math.round((monthRevenue / Number(target.target_amount)) * 100)
        : null,
      clientWise,
      recruiterWise,
      incentives,
      pending: { count: pending.length, amount: pendingAmount, invoices: pending.slice(0, 20) },
      collections,
      profitability,
      conversion: {
        leads: Number(leadStats?.total || 0),
        accepted: Number(leadStats?.accepted || 0),
        newClients: Number(clientStats?.newClients || 0),
        rate:
          Number(leadStats?.total) > 0
            ? Math.round((Number(leadStats.accepted) / Number(leadStats.total)) * 100)
            : 0,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
