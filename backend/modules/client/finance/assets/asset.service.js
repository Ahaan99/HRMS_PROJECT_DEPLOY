import { db } from "../../../../config/db.js";

// ✅ GET ALL
export const fetchAllAssets = async (clientId) => {
  const [rows] = await db.query(
    `SELECT * FROM assets 
     WHERE client_id = ? 
     ORDER BY id DESC`,
    [clientId]
  );

  return rows;
};

// ✅ TOTAL VALUE
export const fetchTotalAssetValue = async (clientId) => {
  const [rows] = await db.query(
    `SELECT SUM(value) AS total_value 
     FROM assets 
     WHERE client_id = ?`,
    [clientId]
  );

  return rows[0]?.total_value || 0;
};

// ✅ FILTER BY STATUS
export const fetchAssetsByStatus = async (clientId, status) => {
  const [rows] = await db.query(
    `SELECT * FROM assets 
     WHERE client_id = ? AND status = ?`,
    [clientId, status]
  );

  return rows;
};

// ✅ CREATE
export const createAssetItem = async (data) => {
  const {
    client_id,
    asset_name,
    category,
    value,
    purchase_date,
    status,
    description,
  } = data;

  const [result] = await db.query(
    `INSERT INTO assets 
     (client_id, asset_name, category, value, purchase_date, status, description)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      client_id,
      asset_name,
      category,
      value,
      purchase_date,
      status || "ACTIVE",
      description,
    ]
  );

  return {
    id: result.insertId,
    ...data,
    status: status || "ACTIVE",
  };
};

// ✅ UPDATE FULL
export const updateAssetItem = async (id, clientId, data) => {
  const {
    asset_name,
    category,
    value,
    purchase_date,
    status,
    description,
  } = data;

  await db.query(
    `UPDATE assets 
     SET asset_name = ?, category = ?, value = ?, purchase_date = ?, status = ?, description = ?
     WHERE id = ? AND client_id = ?`,
    [
      asset_name,
      category,
      value,
      purchase_date,
      status,
      description,
      id,
      clientId,
    ]
  );

  return { id, ...data };
};

// ✅ UPDATE STATUS ONLY
export const updateAssetItemStatus = async (id, clientId, status) => {
  await db.query(
    `UPDATE assets 
     SET status = ?
     WHERE id = ? AND client_id = ?`,
    [status, id, clientId]
  );

  return { id, status };
};

// ✅ DELETE
export const deleteAssetById = async (id, clientId) => {
  await db.query(
    `DELETE FROM assets 
     WHERE id = ? AND client_id = ?`,
    [id, clientId]
  );
};
