import { db } from "../../../config/db.js";

/* Read-only oversight for Super Admin / Manager over data that other portals
   write but that previously had no admin-side reader. Every query is scoped by
   explicit parameters; no request value is interpolated into SQL. */

const clampLimit = (v, dflt = 200, max = 1000) => Math.min(Math.max(Number(v) || dflt, 1), max);

const fail = (res, label, error) => {
  console.error(`${label} error:`, error);
  res.status(500).json({ success: false, message: `Failed to load ${label}` });
};

/* ---------------- Sales portal ---------------- */

export const salesCalls = async (req, res) => {
  try {
    const { status, from, to, employee_id, q } = req.query;
    const where = [];
    const params = [];
    if (status && ["hold", "accepted", "rejected"].includes(status)) { where.push("c.status = ?"); params.push(status); }
    if (from) { where.push("c.call_date >= ?"); params.push(from); }
    if (to) { where.push("c.call_date <= ?"); params.push(to); }
    if (employee_id) { where.push("c.employee_id = ?"); params.push(Number(employee_id)); }
    if (q) { where.push("(c.customer_name LIKE ? OR c.phone LIKE ? OR c.call_id LIKE ?)"); params.push(`%${q}%`, `%${q}%`, `%${q}%`); }
    params.push(clampLimit(req.query.limit));
    const [rows] = await db.query(
      `SELECT c.id, c.call_id, c.customer_name, c.phone, c.email, c.language, c.call_date, c.call_time,
              c.status, c.follow_up_datetime, c.remarks, c.sold_date, c.salary, c.ctc, c.lpa, c.created_at,
              c.employee_id, e.name AS employee_name, e.employeeCode AS employee_code,
              c.client_id, cl.company_name AS client_company, cl.client_code
         FROM superadmin_sales_calls c
         LEFT JOIN employees e ON e.id = c.employee_id
         LEFT JOIN clients cl ON cl.id = c.client_id
        ${where.length ? "WHERE " + where.join(" AND ") : ""}
        ORDER BY c.call_date DESC, c.id DESC
        LIMIT ?`,
      params,
    );
    res.json({ success: true, data: rows });
  } catch (error) { fail(res, "sales calls", error); }
};

export const salesInventory = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT i.id, i.item_name, i.category, i.quantity, i.price, i.mrp, i.discount_price, i.gst_percent,
              i.low_stock_threshold, (i.quantity <= COALESCE(i.low_stock_threshold, 0)) AS low_stock,
              i.created_by, e.name AS created_by_name, i.createdAt, i.updatedAt
         FROM sales_inventory i
         LEFT JOIN employees e ON e.id = i.created_by
        ORDER BY low_stock DESC, i.item_name ASC
        LIMIT ?`,
      [clampLimit(req.query.limit, 500)],
    );
    res.json({ success: true, data: rows });
  } catch (error) { fail(res, "sales inventory", error); }
};

export const fieldSalesLeads = async (req, res) => {
  try {
    const { status, q } = req.query;
    const where = [];
    const params = [];
    if (status && ["new", "contacted", "interested", "not_interested", "closed"].includes(status)) { where.push("f.status = ?"); params.push(status); }
    if (q) { where.push("(f.company_name LIKE ? OR f.owner_name LIKE ? OR f.phone LIKE ? OR f.city LIKE ?)"); params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`); }
    params.push(clampLimit(req.query.limit));
    const [rows] = await db.query(
      `SELECT f.*, e.name AS created_by_name, e.employeeCode AS employee_code
         FROM field_sales_leads f
         LEFT JOIN employees e ON e.id = f.created_by
        ${where.length ? "WHERE " + where.join(" AND ") : ""}
        ORDER BY f.created_at DESC
        LIMIT ?`,
      params,
    );
    res.json({ success: true, data: rows });
  } catch (error) { fail(res, "field sales leads", error); }
};

export const salesSummary = async (_req, res) => {
  try {
    const [[calls]] = await db.query(
      `SELECT COUNT(*) AS total,
              SUM(status='accepted') AS accepted, SUM(status='hold') AS on_hold, SUM(status='rejected') AS rejected,
              SUM(call_date = CURDATE()) AS today,
              SUM(follow_up_datetime IS NOT NULL AND follow_up_datetime >= NOW() AND follow_up_datetime < NOW() + INTERVAL 1 DAY) AS followups_24h
         FROM superadmin_sales_calls`,
    );
    const [[inv]] = await db.query(
      `SELECT COUNT(*) AS items, COALESCE(SUM(quantity),0) AS units,
              COALESCE(SUM(quantity * price),0) AS stock_value,
              SUM(quantity <= COALESCE(low_stock_threshold,0)) AS low_stock
         FROM sales_inventory`,
    );
    const [[fl]] = await db.query(
      `SELECT COUNT(*) AS total, SUM(status='new') AS new_leads, SUM(status='interested') AS interested,
              SUM(status='closed') AS closed,
              SUM(next_followup_date IS NOT NULL AND next_followup_date <= CURDATE() AND status NOT IN ('closed','not_interested')) AS followups_due
         FROM field_sales_leads`,
    );
    const num = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Number(v || 0)]));
    res.json({ success: true, data: { calls: num(calls), inventory: num(inv), fieldLeads: num(fl) } });
  } catch (error) { fail(res, "sales summary", error); }
};

/* ---------------- Client portal (per client) ---------------- */

const q = (sql, params) => db.query(sql, params).then(([r]) => r).catch((e) => {
  /* A missing optional table must not break the whole drill-down */
  if (e.code === "ER_NO_SUCH_TABLE") return [];
  throw e;
});

export const clientOperations = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: "Invalid client id" });
    const [[client]] = await db.query("SELECT id, client_code, company_name, client_name, status FROM clients WHERE id = ? LIMIT 1", [id]);
    if (!client) return res.status(404).json({ success: false, message: "Client not found" });

    const L = 300;
    const [
      expenses, revenue, ledger, tax, purchaseOrders, assets, inventory, services,
      invoices, leads, leadBatches, salesCalls, salesReports,
      assignments, targets, performances, policies,
      finTotals,
    ] = await Promise.all([
      q(`SELECT e.id, e.amount, e.expense_date, e.description, e.category_id, c.name AS category
           FROM client_expenses e LEFT JOIN expense_categories c ON c.id = e.category_id
          WHERE e.client_id = ? ORDER BY e.expense_date DESC LIMIT ${L}`, [id]),
      q(`SELECT r.id, r.amount, r.revenue_date, r.description, r.category_id, c.name AS category
           FROM client_revenue r LEFT JOIN revenue_categories c ON c.id = r.category_id
          WHERE r.client_id = ? ORDER BY r.revenue_date DESC LIMIT ${L}`, [id]),
      q(`SELECT id, date, account, type, amount, description FROM general_ledger WHERE clientId = ? ORDER BY date DESC, id DESC LIMIT ${L}`, [id]),
      q(`SELECT id, type, amount, date, description FROM tax_records WHERE client_id = ? ORDER BY date DESC LIMIT ${L}`, [id]),
      q(`SELECT id, vendor_name, total_amount, order_date, status, items FROM purchase_orders WHERE client_id = ? ORDER BY order_date DESC LIMIT ${L}`, [id]),
      q(`SELECT id, asset_name, category, value, purchase_date, status, description FROM assets WHERE client_id = ? ORDER BY purchase_date DESC LIMIT ${L}`, [id]),
      q(`SELECT id, item_name, category, quantity, price, mrp, discount_price, gst_percent FROM inventory WHERE client_id = ? ORDER BY item_name LIMIT ${L}`, [id]),
      q(`SELECT id, service_name, plan_name, mrp, pricing_type, pricing_value, replacement_months, token_amount, payment_terms, is_active FROM client_services WHERE client_id = ? ORDER BY id DESC LIMIT ${L}`, [id]),
      q(`SELECT i.id, i.invoice_no, i.client_name AS billed_to, i.client_gstin, i.state, i.invoice_date, i.taxable_amount, i.cgst, i.sgst, i.total_amount,
                (SELECT COUNT(*) FROM client_invoice_items it WHERE it.invoice_id = i.id) AS item_count
           FROM client_invoices i WHERE i.client_id = ? ORDER BY i.invoice_date DESC, i.id DESC LIMIT ${L}`, [id]),
      q(`SELECT l.id, l.name, l.phone, l.status, l.remarks, l.assigned_date, l.response_date, l.batch_id, l.assigned_to, ce.name AS assigned_to_name
           FROM client_leads l LEFT JOIN client_employees ce ON ce.id = l.assigned_to
          WHERE l.client_id = ? ORDER BY l.id DESC LIMIT ${L}`, [id]),
      q(`SELECT b.id, b.file_name, b.total_records, b.created_at, ce.name AS assigned_to_name
           FROM client_lead_batches b LEFT JOIN client_employees ce ON ce.id = b.assigned_to
          WHERE b.client_id = ? ORDER BY b.id DESC LIMIT 100`, [id]),
      q(`SELECT c.id, c.call_id, c.customer_name, c.phone, c.email, c.call_date, c.call_time, c.status, c.follow_up_datetime, c.remarks, c.sold_date, ce.name AS employee_name
           FROM client_sales_calls c LEFT JOIN client_employees ce ON ce.id = c.employee_id
          WHERE c.client_id = ? ORDER BY c.call_date DESC, c.id DESC LIMIT ${L}`, [id]),
      q(`SELECT s.id, s.plan_name, s.billing_months, s.amount, s.amount_paid, s.payment_status, s.payment_method, s.purchase_date, s.start_date, s.end_date, s.due_date, s.subscription_status, s.remarks, ce.name AS employee_name
           FROM client_sales_report s LEFT JOIN client_employees ce ON ce.id = s.employee_id
          WHERE s.client_id = ? ORDER BY s.purchase_date DESC LIMIT ${L}`, [id]),
      q(`SELECT a.id, a.title, a.description, a.target_value, a.current_value, a.unit, a.deadline, a.priority, a.status, a.updated_at, ce.name AS employee_name
           FROM client_work_assignments a LEFT JOIN client_employees ce ON ce.id = a.employee_id
          WHERE a.client_id = ? ORDER BY a.deadline ASC LIMIT ${L}`, [id]),
      q(`SELECT t.id, t.target_title, t.target_type, t.target_value, t.start_date, t.end_date, t.is_active, ce.name AS employee_name
           FROM client_work_targets t LEFT JOIN client_employees ce ON ce.id = t.employee_id
          WHERE t.client_id = ? ORDER BY t.end_date DESC LIMIT ${L}`, [id]),
      q(`SELECT p.id, p.score, p.review, p.reviewDate, p.month, p.year, ce.name AS employee_name
           FROM performances p LEFT JOIN client_employees ce ON ce.id = p.employeeId
          WHERE p.client_id = ? ORDER BY p.reviewDate DESC LIMIT ${L}`, [id]),
      q(`SELECT id, title, type, category, status, effective_date, policy_code, isActive FROM work_policies WHERE client_id = ? ORDER BY id DESC LIMIT ${L}`, [id]),
      q(`SELECT
           (SELECT COALESCE(SUM(amount),0) FROM client_expenses WHERE client_id = ?) AS expenses,
           (SELECT COALESCE(SUM(amount),0) FROM client_revenue  WHERE client_id = ?) AS revenue,
           (SELECT COALESCE(SUM(total_amount),0) FROM client_invoices WHERE client_id = ?) AS invoiced`, [id, id, id]),
    ]);

    const totals = finTotals[0] || { expenses: 0, revenue: 0, invoiced: 0 };
    res.json({
      success: true,
      data: {
        client,
        totals: {
          expenses: Number(totals.expenses || 0),
          revenue: Number(totals.revenue || 0),
          invoiced: Number(totals.invoiced || 0),
          profit: Number(totals.revenue || 0) - Number(totals.expenses || 0),
          openLeads: leads.filter((l) => l.status === "pending").length,
          openAssignments: assignments.filter((a) => a.status !== "completed").length,
        },
        finance: { expenses, revenue, ledger, tax, purchaseOrders, assets, inventory },
        services,
        invoices,
        leads: { rows: leads, batches: leadBatches },
        sales: { calls: salesCalls, reports: salesReports },
        work: { assignments, targets, performances, policies },
      },
    });
  } catch (error) { fail(res, "client operations", error); }
};

/* All client-issued invoices across clients (for the admin Invoices page tab) */
export const clientInvoices = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT i.id, i.invoice_no, i.invoice_date, i.client_name AS billed_to, i.client_gstin, i.state,
              i.taxable_amount, i.cgst, i.sgst, i.total_amount, i.created_at,
              i.client_id, cl.company_name AS issued_by, cl.client_code,
              ce.name AS employee_name,
              (SELECT COUNT(*) FROM client_invoice_items it WHERE it.invoice_id = i.id) AS item_count
         FROM client_invoices i
         LEFT JOIN clients cl ON cl.id = i.client_id
         LEFT JOIN client_employees ce ON ce.id = i.employee_id
        ORDER BY i.invoice_date DESC, i.id DESC
        LIMIT ?`,
      [clampLimit(req.query.limit, 500)],
    );
    res.json({ success: true, data: rows });
  } catch (error) { fail(res, "client invoices", error); }
};

export const clientInvoiceItems = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: "Invalid invoice id" });
    const [[inv]] = await db.query(
      `SELECT i.*, cl.company_name AS issued_by FROM client_invoices i LEFT JOIN clients cl ON cl.id = i.client_id WHERE i.id = ? LIMIT 1`, [id]);
    if (!inv) return res.status(404).json({ success: false, message: "Invoice not found" });
    const [items] = await db.query("SELECT id, description, hsn_sac, gst_rate, quantity, rate, amount FROM client_invoice_items WHERE invoice_id = ? ORDER BY id", [id]);
    res.json({ success: true, data: { ...inv, items } });
  } catch (error) { fail(res, "client invoice", error); }
};
