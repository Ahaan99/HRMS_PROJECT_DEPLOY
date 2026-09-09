import express from "express";
import {
  getAllInventory,
  getInventoryStats,
  createInventoryItem,
  updateInventoryItem,
  adjustStock,
  deleteInventoryItem,
} from "./salesInventory.controller.js";

import { requireSalesAuth } from "../../../middleware/salesAuth.middleware.js";

const router = express.Router();

router.use(requireSalesAuth);

router.get("/", getAllInventory);
router.get("/stats", getInventoryStats);
router.post("/add", createInventoryItem);
router.put("/:id", updateInventoryItem);
router.patch("/stock/:id", adjustStock);
router.delete("/:id", deleteInventoryItem);

export default router;
