import express from "express";
import {
  createFieldSalesController,
  getFieldSalesListController,
  updateFieldSalesController,
  updateLeadLocation,
} from "./fieldSales.controller.js";

import { requireSalesAuth } from "../../../middleware/salesAuth.middleware.js";

const router = express.Router();

// ✅ SALES AUTH
router.use(requireSalesAuth);

router.get("/", getFieldSalesListController);
router.post("/", createFieldSalesController);
router.put("/:id", updateFieldSalesController);
router.put("/location/:id", updateLeadLocation);
export default router;
