import express from "express";
import {
  createClientSalesReport,
  getClientSalesReport,
  updateClientSalesReport,
} from "./clientSalesReport.controller.js";

import { clientUnifiedAuthMiddleware } from "../../../middleware/clientUnifiedAuth.middleware.js";

const router = express.Router();

router.use(clientUnifiedAuthMiddleware);

router.get("/", getClientSalesReport);
router.post("/", createClientSalesReport);
router.put("/:id", updateClientSalesReport);

export default router;