import {db} from "../../../config/db.js";

export const createInvoice = async (data, employee_id) => {
  const {
    invoice_no,
    client_name,
    client_address,
    client_gstin,
    state,
    state_code,
    invoice_date,
    reference_no,
    terms_of_payment,
    buyers_order_no,
    terms_of_delivery,
    taxable_amount,
    cgst,
    sgst,
    total_amount,
    amount_in_words,
    items,
    client_code,
  } = data;

  // Optional link to a registered client so the Client portal can see this invoice.
  let client_id = null;
  if (client_code) {
    const [c] = await db.query(
      `SELECT id FROM clients WHERE client_code = ? LIMIT 1`,
      [String(client_code).trim()]
    );
    if (!c.length) {
      const err = new Error("Client code not found");
      err.status = 404;
      throw err;
    }
    client_id = c[0].id;
  }

  const [invoiceResult] = await db.query(
    `INSERT INTO invoices 
    (employee_id, client_id, invoice_no, client_name, client_address, client_gstin, state, state_code,
     invoice_date, reference_no, terms_of_payment, buyers_order_no, terms_of_delivery,
     taxable_amount, cgst, sgst, total_amount, amount_in_words)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      employee_id,
      client_id,
      invoice_no,
      client_name,
      client_address,
      client_gstin,
      state,
      state_code,
      invoice_date,
      reference_no,
      terms_of_payment,
      buyers_order_no,
      terms_of_delivery,
      taxable_amount,
      cgst,
      sgst,
      total_amount,
      amount_in_words
    ]
  );

  const invoiceId = invoiceResult.insertId;

  for (const item of items) {
    await db.query(
      `INSERT INTO invoice_items
      (invoice_id, description, hsn_sac, gst_rate, quantity, rate, amount)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        invoiceId,
        item.description,
        item.hsn_sac,
        item.gst_rate,
        item.quantity,
        item.rate,
        item.amount
      ]
    );
  }

  return { invoiceId };
};

export const getInvoices = async (employeeId) => {
  const [rows] = await db.query( 
    `SELECT *
     FROM invoices
     WHERE employee_id = ?
     ORDER BY id DESC`,
    [employeeId]);
  return rows;
};

export const getInvoiceById = async (
  id,
  employeeId
) => {
  const [invoice] = await db.query(
    `SELECT *
     FROM invoices
     WHERE id = ?
     AND employee_id = ?
     LIMIT 1`,
    [id, employeeId]
  );

  if (!invoice.length) {
    return null;
  }

  const [items] = await db.query(
    `SELECT *
     FROM invoice_items
     WHERE invoice_id = ?`,
    [id]
  );

  return {
    ...invoice[0],
    items,
  };
};