import express from "express";
import {
  createClientSalesController,
  getClientSalesListController,
  getClientSalesStatsController,
  updateClientSalesController,
} from "./clientSales.controller.js";
import { clientUnifiedAuthMiddleware } from "../../../middleware/clientUnifiedAuth.middleware.js";

const router = express.Router();

// ✅ apply ONCE
router.use(clientUnifiedAuthMiddleware);

// routes
router.get("/", getClientSalesListController);
router.post("/", createClientSalesController);
router.put("/:id", updateClientSalesController);
router.get("/stats", getClientSalesStatsController);

export default router;