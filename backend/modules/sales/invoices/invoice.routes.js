import express from "express";
import * as ctrl from "./invoice.controller.js";
import { requireSalesAuth } from "../../../middleware/salesAuth.middleware.js";

const router = express.Router();

router.use(requireSalesAuth);

router.post("/", ctrl.createInvoice);
router.get("/", ctrl.getInvoices);
router.get("/:id", ctrl.getInvoiceById);
router.get("/download/:id", ctrl.downloadInvoiceController);
export default router;
