import {
  fetchAllInventory,
  fetchTotalValue,
  createItem,
  updateItem,
  deleteItemById,
  fetchLowStock,
  updateItemStock,
} from "./inventory.service.js";

import { db } from "../../../../config/db.js";

// Admin tokens carry client_code; employee tokens are resolved to client_id by the unified middleware.
// NB: req.client is also the raw socket on IncomingMessage, so test req.employee first.
const resolveClientId = async (req) =>
  req.employee ? req.employee.client_id : getClientId(req.client.client_code);

const getClientId = async (client_code) => {
  const [rows] = await db.query(
    `SELECT id FROM clients WHERE client_code = ? LIMIT 1`,
    [client_code],
  );

  if (!rows.length) throw new Error("Client not found");

  return rows[0].id;};

export const getAllInventory = async (req, res) => {
  try {
    const clientId = await resolveClientId(req);

    const data = await fetchAllInventory(clientId);

    res.json(data);
  } catch (error) {
    console.error("getAllInventory:", error);
    res.status(500).json({ message: "Failed to fetch inventory" });
  }
};

export const getTotalInventoryValue = async (req, res) => {
  try {
    const clientId = await resolveClientId(req);

    const total = await fetchTotalValue(clientId);

    res.json({ total_value: total || 0 });
  } catch (error) {
    console.error("getTotalInventoryValue:", error);
    res.status(500).json({ message: "Failed to fetch total value" });
  }
};

export const createInventoryItem = async (req, res) => {
  try {
    const clientId = await resolveClientId(req);

    // const { item_name, quantity, price, category } = req.body;

    const {
      item_name,
      quantity,
      price,
      category,
      mrp,
      discount_price,
      gst_percent,
    } = req.body;

    const qty = Number(quantity);
    const prc = Number(price);

    if (
      !item_name ||
      Number.isNaN(qty) ||
      qty < 0 ||
      Number.isNaN(prc) ||
      prc < 0
    ) {
      return res
        .status(400)
        .json({ message: "Item name, valid quantity and price are required" });
    }

    const newItem = await createItem({
      client_id: clientId,
      item_name,
      quantity: qty,
      price: prc,
      category: category || null,
      mrp: Number(mrp) || 0,
      discount_price: Number(discount_price) || 0,
      gst_percent: Number(gst_percent) || 0,
    });

    res.status(201).json(newItem);
  } catch (error) {
    console.error("createInventoryItem:", error);
    res.status(500).json({ message: "Failed to create item" });
  }
};

export const updateInventoryItem = async (req, res) => {
  try {
    const clientId = await resolveClientId(req);

    const { id } = req.params;
    // const { item_name, quantity, price, category } = req.body;

    const {
      item_name,
      quantity,
      price,
      category,
      mrp,
      discount_price,
      gst_percent,
    } = req.body;

    const updated = await updateItem(id, clientId, {
      item_name,
      quantity: Number(quantity),
      price: Number(price),
      category,
      mrp,
      discount_price,
      gst_percent,
    });

    res.json(updated);
  } catch (error) {
    console.error("updateInventoryItem:", error);
    res.status(500).json({ message: "Failed to update item" });
  }
};

export const deleteInventoryItem = async (req, res) => {
  try {
    const clientId = await resolveClientId(req);

    const { id } = req.params;

    await deleteItemById(id, clientId);

    res.json({ message: "Item deleted successfully" });
  } catch (error) {
    console.error("deleteInventoryItem:", error);
    res.status(500).json({ message: "Failed to delete item" });
  }
};

export const getLowStockItems = async (req, res) => {
  try {
    const clientId = await resolveClientId(req);

    const threshold = Number(req.query.threshold) || 10;

    const data = await fetchLowStock(clientId, threshold);

    res.json(data);
  } catch (error) {
    console.error("getLowStockItems:", error);
    res.status(500).json({ message: "Failed to fetch low stock" });
  }
};

export const updateStock = async (req, res) => {
  try {
    const clientId = await resolveClientId(req);

    const { id } = req.params;
    const { quantity } = req.body;

    const updated = await updateItemStock(id, clientId, Number(quantity));

    res.json(updated);
  } catch (error) {
    console.error("updateStock:", error);
    res.status(500).json({ message: "Failed to update stock" });
  }
};
