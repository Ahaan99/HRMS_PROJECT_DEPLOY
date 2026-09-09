import { db } from "../../../config/db.js";

// helper
const getClientId = async (client_code) => {
  const [rows] = await db.query(
    `SELECT id FROM clients WHERE client_code = ? LIMIT 1`,
    [client_code],
  );

  if (!rows.length) throw new Error("Client not found");

  return rows[0].id;
};


// ===============================
// CREATE SALE
// ===============================
export const createClientSaleService = async (payload) => {
  const {
    client_code,
    plan_name,
    billing_months,
    amount,
    amount_paid,
    payment_status,
    payment_method,
    purchase_date,
    start_date,
    end_date,
    due_date,
    subscription_status,
    remarks,
  } = payload;

  const client_id = await getClientId(client_code)

// auto-calc end_date if not provided
let calculatedEndDate = end_date;

if (!end_date && start_date && billing_months) {
  const d = new Date(start_date);
  d.setMonth(d.getMonth() + Number(billing_months));

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  calculatedEndDate = `${year}-${month}-${day}`;
}

if (!calculatedEndDate) {
  throw new Error("Unable to calculate end_date");
}

const safeAmountPaid = amount_paid ?? 0;
const safePaymentStatus = payment_status ?? "unpaid";
const safePaymentMethod = payment_method ?? "online";
const safeSubscriptionStatus = subscription_status ?? "active";

  const [result] = await db.query(
    `INSERT INTO sales_report
     (client_id, plan_name, billing_months, amount, amount_paid,
      payment_status, payment_method, purchase_date, start_date,
      end_date, due_date, subscription_status, remarks)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      client_id,
      plan_name,
      billing_months,
      amount,
      safeAmountPaid,
      safePaymentStatus,
      safePaymentMethod,
      purchase_date,
      start_date,
      calculatedEndDate,
      due_date,
      safeSubscriptionStatus,
      remarks,
    ],
  );

  return result;
};

// ===============================
// GET ALL SALES (SUPER ADMIN)
// ===============================
export const getAllClientSalesService = async () => {
  const [rows] = await db.query(
    `SELECT cs.*, c.client_name
     FROM sales_report cs
     LEFT JOIN clients c ON c.id = cs.client_id
     ORDER BY cs.id DESC`,
  );

  return rows;
};

// ===============================
// UPDATE SALE
// ===============================
export const updateClientSaleService = async (id, payload) => {
  const {
    client_code,
    plan_name,
    billing_months,
    amount,
    amount_paid,
    payment_status,
    payment_method,
    purchase_date,
    start_date,
    end_date,
    due_date,
    subscription_status,
    remarks,
  } = payload;

  const client_id = await getClientId(client_code)

  // auto-calc end_date if not provided
let calculatedEndDate = end_date;

if (!end_date && start_date && billing_months) {
  const d = new Date(start_date);
  d.setMonth(d.getMonth() + Number(billing_months));

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  calculatedEndDate = `${year}-${month}-${day}`;
}

const safeAmountPaid = amount_paid ?? 0;
const safePaymentStatus = payment_status ?? "unpaid";
const safePaymentMethod = payment_method ?? "online";
const safeSubscriptionStatus = subscription_status ?? "active";

  const [result] = await db.query(
    `UPDATE sales_report SET
      client_id=?,
      plan_name=?,
      billing_months=?,
      amount=?,
      amount_paid=?,
      payment_status=?,
      payment_method=?,
      purchase_date=?,
      start_date=?,
      end_date=?,
      due_date=?,
      subscription_status=?,
      remarks=?
     WHERE id=?`,
    [
      client_id,
      plan_name,
      billing_months,
      amount,
      safeAmountPaid,
      safePaymentStatus,
      safePaymentMethod,
      purchase_date,
      start_date,
      calculatedEndDate,
      due_date,
      safeSubscriptionStatus,
      remarks,
      id,
    ],
  );

  return result;
};

// ===============================
// DELETE SALE
// ===============================
export const deleteClientSaleService = async (id) => {
  const [result] = await db.query(`DELETE FROM sales_report WHERE id=?`, [id]);

  return result;
};
