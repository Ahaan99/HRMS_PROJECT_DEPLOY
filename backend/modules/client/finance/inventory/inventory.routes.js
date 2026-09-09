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

const router = express.Router();

router.use(clientAuthMiddleware);



// import { clientUnifiedAuthMiddleware } from "../../../../middleware/clientUnifiedAuth.middleware.js";

// const router = express.Router();

// // ✅ apply ONCE
// router.use(clientUnifiedAuthMiddleware);


// GET
router.get("/", getAllInventory);
router.get("/total-value", getTotalInventoryValue);
router.get("/low-stock", getLowStockItems);

// POST
router.post("/add", auditMiddleware("ADD_INVENTORY"),createInventoryItem);

// PUT
router.put("/:id", auditMiddleware("UPDATE_INVENTORY"), updateInventoryItem);
router.put("/stock/:id", updateStock);

// DELETE
router.delete("/:id", auditMiddleware("DELETE_INVENTORY"), deleteInventoryItem);

export default router;