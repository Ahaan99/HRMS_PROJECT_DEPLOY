import {
  fetchAllAssets,
  fetchTotalAssetValue,
  fetchAssetsByStatus,
  createAssetItem,
  updateAssetItem,
  updateAssetItemStatus,
  deleteAssetById,
} from "./asset.service.js";

import { db } from "../../../../config/db.js";

// ✅ helper (same as inventory)
const getClientId = async (client_code) => {
  const [rows] = await db.query(
    `SELECT id FROM clients WHERE client_code = ? LIMIT 1`,
    [client_code]
  );

  if (!rows.length) throw new Error("Client not found");

  return rows[0].id;
};

// ✅ GET ALL
export const getAllAssets = async (req, res) => {
  try {
    const clientId = await getClientId(req.client.client_code);

    const data = await fetchAllAssets(clientId);

    res.json(data);
  } catch (error) {
    console.error("getAllAssets:", error);
    res.status(500).json({ message: "Failed to fetch assets" });
  }
};

// ✅ TOTAL VALUE
export const getTotalAssetValue = async (req, res) => {
  try {
    const clientId = await getClientId(req.client.client_code);

    const total = await fetchTotalAssetValue(clientId);

    res.json({ total_value: total || 0 });
  } catch (error) {
    console.error("getTotalAssetValue:", error);
    res.status(500).json({ message: "Failed to fetch total value" });
  }
};

// ✅ FILTER BY STATUS
export const getAssetsByStatus = async (req, res) => {
  try {
    const clientId = await getClientId(req.client.client_code);
    const { status } = req.params;

    const data = await fetchAssetsByStatus(clientId, status);

    res.json(data);
  } catch (error) {
    console.error("getAssetsByStatus:", error);
    res.status(500).json({ message: "Failed to fetch assets by status" });
  }
};

// ✅ CREATE
export const createAsset = async (req, res) => {
  try {
    const clientId = await getClientId(req.client.client_code);

    const {
      asset_name,
      category,
      value,
      purchase_date,
      status,
      description,
    } = req.body;

    if (!asset_name || value < 0) {
      return res.status(400).json({ message: "Invalid data" });
    }

    const newAsset = await createAssetItem({
      client_id: clientId,
      asset_name,
      category,
      value: Number(value),
      purchase_date,
      status,
      description,
    });

    res.status(201).json(newAsset);
  } catch (error) {
    console.error("createAsset:", error);
    res.status(500).json({ message: "Failed to create asset" });
  }
};

// ✅ UPDATE FULL
export const updateAsset = async (req, res) => {
  try {
    const clientId = await getClientId(req.client.client_code);
    const { id } = req.params;

    const {
      asset_name,
      category,
      value,
      purchase_date,
      status,
      description,
    } = req.body;

    const updated = await updateAssetItem(id, clientId, {
      asset_name,
      category,
      value: Number(value),
      purchase_date,
      status,
      description,
    });

    res.json(updated);
  } catch (error) {
    console.error("updateAsset:", error);
    res.status(500).json({ message: "Failed to update asset" });
  }
};

// ✅ UPDATE STATUS ONLY
export const updateAssetStatus = async (req, res) => {
  try {
    const clientId = await getClientId(req.client.client_code);
    const { id } = req.params;
    const { status } = req.body;

    const updated = await updateAssetItemStatus(id, clientId, status);

    res.json(updated);
  } catch (error) {
    console.error("updateAssetStatus:", error);
    res.status(500).json({ message: "Failed to update status" });
  }
};

// ✅ DELETE
export const deleteAsset = async (req, res) => {
  try {
    const clientId = await getClientId(req.client.client_code);
    const { id } = req.params;

    await deleteAssetById(id, clientId);

    res.json({ message: "Asset deleted successfully" });
  } catch (error) {
    console.error("deleteAsset:", error);
    res.status(500).json({ message: "Failed to delete asset" });
  }
};