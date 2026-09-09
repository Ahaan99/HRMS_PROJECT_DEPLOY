import {db} from "../../../config/db.js";

export const createInvoice = async (data) => {
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
    due_date,
    upi_id,
    items
  } = data;

  const [invoiceResult] = await db.query(
    `INSERT INTO invoices 
    (invoice_no, client_name, client_address, client_gstin, state, state_code,
     invoice_date, reference_no, terms_of_payment, buyers_order_no, terms_of_delivery,
     taxable_amount, cgst, sgst, total_amount, amount_in_words, due_date, upi_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
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
      due_date || null,
      upi_id || null
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

export const getInvoices = async () => {
  const [rows] = await db.query("SELECT * FROM invoices ORDER BY id DESC");
  return rows;
};

export const getInvoiceById = async (id) => {
  const [invoice] = await db.query("SELECT * FROM invoices WHERE id=?", [id]);
  const [items] = await db.query("SELECT * FROM invoice_items WHERE invoice_id=?", [id]);

  return { ...invoice[0], items };
};