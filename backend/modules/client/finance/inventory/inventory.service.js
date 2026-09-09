import { db } from "../../../../config/db.js";

// ✅ GET ALL
export const fetchAllInventory = async (clientId) => {
  const [rows] = await db.query(
    `SELECT * FROM inventory WHERE client_id = ? ORDER BY id DESC`,
    [clientId],
  );
  return rows;
};

// ✅ TOTAL VALUE
export const fetchTotalValue = async (clientId) => {
  const [rows] = await db.query(
    `SELECT SUM(quantity * price) AS total_value 
     FROM inventory 
     WHERE client_id = ?`,
    [clientId],
  );

  return rows[0]?.total_value || 0;
};

// ✅ CREATE
export const createItem = async (data) => {
  // const { client_id, item_name, quantity, price, category } = data;

  // const [result] = await db.query(
  //   `INSERT INTO inventory (client_id, item_name, quantity, price, category)
  //    VALUES (?, ?, ?, ?, ?)`,
  //   [client_id, item_name, quantity, price, category]
  // );

  const {
    client_id,
    item_name,
    quantity,
    price,
    category,
    mrp,
    discount_price,
    gst_percent,
  } = data;

  const [result] = await db.query(
    `INSERT INTO inventory 
  (client_id, item_name, quantity, price, category, mrp, discount_price, gst_percent)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      client_id,
      item_name,
      quantity,
      price,
      category,
      mrp,
      discount_price,
      gst_percent,
    ],
  );

  return { id: result.insertId, ...data };
};

// ✅ UPDATE
export const updateItem = async (id, clientId, data) => {
  const {
    item_name,
    quantity,
    price,
    category,
    mrp,
    discount_price,
    gst_percent,
  } = data;

  // await db.query(
  //   `UPDATE inventory
  //    SET item_name = ?, quantity = ?, price = ?, category = ?
  //    WHERE id = ? AND client_id = ?`,
  //   [item_name, quantity, price, category, id, clientId]
  // );

  await db.query(
    `UPDATE inventory 
   SET item_name = ?, quantity = ?, price = ?, category = ?, 
       mrp = ?, discount_price = ?, gst_percent = ?
   WHERE id = ? AND client_id = ?`,
    [
      item_name,
      quantity,
      price,
      category,
      mrp,
      discount_price,
      gst_percent,
      id,
      clientId,
    ],
  );
  return { id, ...data };
};

// ✅ DELETE
export const deleteItemById = async (id, clientId) => {
  await db.query(`DELETE FROM inventory WHERE id = ? AND client_id = ?`, [
    id,
    clientId,
  ]);
};

// ✅ LOW STOCK
export const fetchLowStock = async (clientId, threshold) => {
  const [rows] = await db.query(
    `SELECT * FROM inventory 
     WHERE client_id = ? AND quantity < ?`,
    [clientId, threshold],
  );

  return rows;
};

// ✅ UPDATE STOCK
export const updateItemStock = async (id, clientId, quantity) => {
  await db.query(
    `UPDATE inventory 
     SET quantity = ?
     WHERE id = ? AND client_id = ?`,
    [quantity, id, clientId],
  );

  return { id, quantity };
};
