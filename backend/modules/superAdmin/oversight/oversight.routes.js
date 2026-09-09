import express from "express";
import { protect } from "../../../middleware/auth.middleware.js";
import {
  salesCalls,
  salesInventory,
  fieldSalesLeads,
  salesSummary,
  clientOperations,
  clientInvoices,
  clientInvoiceItems,
} from "./oversight.controller.js";

const router = express.Router();

router.use(protect(["SUPER_ADMIN", "MANAGER"]));

/* Sales portal oversight */
router.get("/sales/summary", salesSummary);
router.get("/sales/calls", salesCalls);
router.get("/sales/inventory", salesInventory);
router.get("/sales/field-leads", fieldSalesLeads);

/* Client portal oversight */
router.get("/client-invoices", clientInvoices);
router.get("/client-invoices/:id", clientInvoiceItems);
router.get("/clients/:id/operations", clientOperations);

export default router;
