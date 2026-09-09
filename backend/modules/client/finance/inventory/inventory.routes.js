import express from "express";
import {
  getAllInventory,
  getTotalInventoryValue,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  getLowStockItems,
  updateStock,
} from "./inventory.controller.js";
import auditMiddleware from "../../../../middleware/audit.middleware.js";
import { clientAuthMiddleware } from "../../../../middleware/clientAuth.middleware.js";
import { clientUnifiedAuthMiddleware } from "../../../../middleware/clientUnifiedAuth.middleware.js";

const router = express.Router();

// Reads are shared with client employees (Inventory is on the employee feature list).
router.get("/", clientUnifiedAuthMiddleware, getAllInventory);
router.get("/total-value", clientUnifiedAuthMiddleware, getTotalInventoryValue);
router.get("/low-stock", clientUnifiedAuthMiddleware, getLowStockItems);

// Every mutation stays admin-only.
router.use(clientAuthMiddleware);
router.post("/add", auditMiddleware("ADD_INVENTORY"), createInventoryItem);
router.put("/:id", auditMiddleware("UPDATE_INVENTORY"), updateInventoryItem);
router.put("/stock/:id", auditMiddleware("UPDATE_INVENTORY_STOCK"), updateStock);
router.delete("/:id", auditMiddleware("DELETE_INVENTORY"), deleteInventoryItem);

export default router;
