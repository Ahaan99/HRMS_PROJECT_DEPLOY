import { db } from "../../../config/db.js";

// helper
const getClientId = async (client_code) => {
  const [rows] = await db.query(
    `SELECT id FROM clients WHERE client_code=? LIMIT 1`,
    [client_code]
  );
  if (!rows.length) throw new Error("Client not found");
  return rows[0].id;
};

// CREATE
export const createInvoice = async (
  client_code,
  employee_id,
  data
) => {
  const client_id = await getClientId(client_code);

  const {
    invoice_no,
    client_name,
    client_address,
    client_gstin,
    invoice_date,
    taxable_amount,
    cgst,
    sgst,
    total_amount,
    items,
  } = data;

  const [invoiceResult] = await db.query(
    `INSERT INTO client_invoices
     (client_id, employee_id, invoice_no, client_name, client_address,
      client_gstin, invoice_date, taxable_amount, cgst, sgst, total_amount)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [
      client_id,
      employee_id || null,
      invoice_no,
      client_name,
      client_address,
      client_gstin,
      invoice_date,
      taxable_amount,
      cgst,
      sgst,
      total_amount,
    ]
  );

  const invoiceId = invoiceResult.insertId;

  for (const item of items) {
    await db.query(
      `INSERT INTO client_invoice_items
       (invoice_id, description, hsn_sac, gst_rate, quantity, rate, amount)
       VALUES (?,?,?,?,?,?,?)`,
      [
        invoiceId,
        item.description,
        item.hsn_sac,
        item.gst_rate,
        item.quantity,
        item.rate,
        item.amount,
      ]
    );
  }

  return { invoiceId };
};

// GET ALL
export const getInvoices = async (
  client_code,
  employee_id
) => {
  const client_id = await getClientId(client_code);

  let where = `WHERE client_id=?`;
  const params = [client_id];

  if (employee_id) {
    where += ` AND employee_id=?`;
    params.push(employee_id);
  }

  const [rows] = await db.query(
    `SELECT *, 'client' AS source FROM client_invoices ${where} ORDER BY id DESC`,
    params
  );

  // Invoices raised by the Sales team against this client (invoices.client_id).
  // Only shown on the client-admin view (no employee filter) since they are
  // company-level billing documents, not per-employee.
  if (employee_id) return rows;

  const [salesRows] = await db.query(
    `SELECT id, client_id, employee_id, invoice_no, client_name, client_address,
            client_gstin, state, state_code, invoice_date, taxable_amount, cgst, sgst,
            total_amount, amount_in_words, created_at, status, due_date, paid_amount,
            'sales' AS source
       FROM invoices WHERE client_id = ? ORDER BY id DESC`,
    [client_id]
  );

  return [...rows, ...salesRows].sort(
    (a, b) => new Date(b.invoice_date || b.created_at) - new Date(a.invoice_date || a.created_at)
  );
};

// GET BY ID
export const getInvoiceById = async (client_code, id, source = "client") => {
  const client_id = await getClientId(client_code);

  if (source === "sales") {
    const [inv] = await db.query(
      `SELECT *, 'sales' AS source FROM invoices WHERE id=? AND client_id=?`,
      [id, client_id]
    );
    if (!inv.length) throw new Error("Not found");
    const [items] = await db.query(
      `SELECT * FROM invoice_items WHERE invoice_id=?`,
      [id]
    );
    return { ...inv[0], items };
  }

  const [invoice] = await db.query(
    `SELECT * FROM client_invoices WHERE id=? AND client_id=?`,
    [id, client_id]
  );

  if (!invoice.length) throw new Error("Not found");

  const [items] = await db.query(
    `SELECT * FROM client_invoice_items WHERE invoice_id=?`,
    [id]
  );

  return { ...invoice[0], items };
};
