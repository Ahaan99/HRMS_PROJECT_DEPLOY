import express from "express";
import * as ctrl from "./clientInvoice.controller.js";
import { clientUnifiedAuthMiddleware } from "../../../middleware/clientUnifiedAuth.middleware.js";

const router = express.Router();

router.use(clientUnifiedAuthMiddleware);

router.post("/", ctrl.createInvoice);
router.get("/", ctrl.getInvoices);
router.get("/:id", ctrl.getInvoiceById);

export default router;