import { db } from "../../../../config/db.js";

// GET
export const fetchOrders = async (clientId) => {
  const [rows] = await db.query(
    `SELECT * FROM purchase_orders WHERE client_id = ? ORDER BY id DESC`,
    [clientId],
  );

  // parse JSON
  return rows.map((row) => ({
    ...row,
    items:
      typeof row.items === "string" ? JSON.parse(row.items) : row.items || [],
  }));
};

// CREATE
export const createNewOrder = async (data) => {
  const { client_id, vendor_name, items, total_amount, order_date } = data;

  const [result] = await db.query(
    `INSERT INTO purchase_orders 
     (client_id, vendor_name, items, total_amount, order_date)
     VALUES (?, ?, ?, ?, ?)`,
    [client_id, vendor_name, JSON.stringify(items), total_amount, order_date],
  );

  return { id: result.insertId, ...data };
};

// UPDATE STATUS
export const ALLOWED_STATUS_TRANSITIONS = {
  pending: ["approved", "rejected"],
  approved: ["completed"],
};

export const updateStatus = async (id, clientId, status) => {
  const [rows] = await db.query(
    `SELECT status FROM purchase_orders WHERE id = ? AND client_id = ? LIMIT 1`,
    [id, clientId],
  );
  if (!rows.length) {
    const err = new Error("Purchase order not found");
    err.status = 404;
    throw err;
  }

  const current = String(rows[0].status || "pending").toLowerCase();
  const next = String(status || "").toLowerCase();
  const allowed = ALLOWED_STATUS_TRANSITIONS[current] || [];
  if (!allowed.includes(next)) {
    const err = new Error(`Cannot move order from "${current}" to "${next}"`);
    err.status = 409;
    throw err;
  }

  await db.query(
    `UPDATE purchase_orders SET status = ?
     WHERE id = ? AND client_id = ?`,
    [next, id, clientId],
  );

  return { id, status: next };
};

// DELETE
export const deleteOrderById = async (id, clientId) => {
  await db.query(`DELETE FROM purchase_orders WHERE id = ? AND client_id = ?`, [
    id,
    clientId,
  ]);
};
