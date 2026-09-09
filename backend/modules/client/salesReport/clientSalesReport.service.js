import { db } from "../../../config/db.js";

// helper
const getClientId = async (client_code) => {
  const [rows] = await db.query(
    `SELECT id FROM clients WHERE client_code = ? LIMIT 1`,
    [client_code]
  );
  if (!rows.length) throw new Error("Client not found");
  return rows[0].id;
};

// ================= CREATE =================
export const createClientSalesReportService = async (
  client_code,
  employee_id,
  payload
) => {
  const client_id = await getClientId(client_code);

  const {
    plan_name,
    billing_months,
    amount,
    amount_paid,
    payment_status,
    payment_method,
    purchase_date,
    start_date,
    due_date,
    subscription_status,
    remarks,
  } = payload;

  // auto end_date
  let end_date = null;
  if (start_date && billing_months) {
    const d = new Date(start_date);
    d.setMonth(d.getMonth() + Number(billing_months));
    end_date = d.toISOString().slice(0, 10);
  }

  const [result] = await db.query(
    `INSERT INTO client_sales_report
     (client_id, employee_id, plan_name, billing_months, amount, amount_paid,
      payment_status, payment_method, purchase_date, start_date, end_date,
      due_date, subscription_status, remarks)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      client_id,
      employee_id || null,
      plan_name,
      billing_months,
      amount,
      amount_paid || 0,
      payment_status || "unpaid",
      payment_method || "online",
      purchase_date,
      start_date,
      end_date,
      due_date,
      subscription_status || "active",
      remarks || null,
    ]
  );

  return result.insertId;
};

// ================= GET =================
export const getClientSalesReportService = async (
  client_code,
  employee_id
) => {
  const client_id = await getClientId(client_code);

  let where = `WHERE client_id = ?`;
  const params = [client_id];

  if (employee_id) {
    where += ` AND employee_id = ?`;
    params.push(employee_id);
  }

  const [rows] = await db.query(
    `SELECT * FROM client_sales_report
     ${where}
     ORDER BY id DESC`,
    params
  );

  return rows;
};

// ================= UPDATE =================
export const updateClientSalesReportService = async (
  client_code,
  id,
  payload
) => {
  const client_id = await getClientId(client_code);

  const {
    plan_name,
    billing_months,
    amount,
    amount_paid,
    payment_status,
    payment_method,
    purchase_date,
    start_date,
    due_date,
    subscription_status,
    remarks,
  } = payload;

  await db.query(
    `UPDATE client_sales_report SET
      plan_name=?,
      billing_months=?,
      amount=?,
      amount_paid=?,
      payment_status=?,
      payment_method=?,
      purchase_date=?,
      start_date=?,
      due_date=?,
      subscription_status=?,
      remarks=?
     WHERE id=? AND client_id=?`,
    [
      plan_name,
      billing_months,
      amount,
      amount_paid,
      payment_status,
      payment_method,
      purchase_date,
      start_date,
      due_date,
      subscription_status,
      remarks,
      id,
      client_id,
    ]
  );
};