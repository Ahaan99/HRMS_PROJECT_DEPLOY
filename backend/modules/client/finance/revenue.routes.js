import express from "express";

import {
  getClientRevenue,
  addClientRevenue,
  updateClientRevenue,
  deleteClientRevenue,
  getRevenueCategories,
  getRevenueTotal,
  getRevenueByDateRange,
} from "./revenue.controller.js";

import { clientAuthMiddleware } from "../../../middleware/clientAuth.middleware.js";

const router = express.Router();

router.use(clientAuthMiddleware);

router.get("/", getClientRevenue);
router.get("/total", getRevenueTotal);
router.get("/by-date-range", getRevenueByDateRange);
router.get("/categories", getRevenueCategories);
router.post("/", addClientRevenue);
router.post("/add", addClientRevenue);
router.put("/:id", updateClientRevenue);
router.delete("/:id", deleteClientRevenue);

export default router;
