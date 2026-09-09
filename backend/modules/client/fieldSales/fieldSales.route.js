import express from "express";
import {
  createFieldSalesController,
  getFieldSalesListController,
  updateFieldSalesController,
} from "./fieldSales.controller.js";

import { clientUnifiedAuthMiddleware } from "../../../middleware/clientUnifiedAuth.middleware.js";

const router = express.Router();

// ✅ SAME PATTERN
router.use(clientUnifiedAuthMiddleware);

router.get("/", getFieldSalesListController);
router.post("/", createFieldSalesController);
router.put("/:id", updateFieldSalesController);

export default router;