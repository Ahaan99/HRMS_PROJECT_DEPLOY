import express from "express";
import * as ctrl from "./invoice.controller.js";
import * as plus from "./invoicePlus.controller.js";
import upload from "../../../middleware/upload.middleware.js";
import { protect } from "../../../middleware/auth.middleware.js";

const router = express.Router();

// // Protect all routes
router.use(protect(["SUPER_ADMIN"]));

router.post("/", ctrl.createInvoice);
router.get("/", ctrl.getInvoices);

// Invoice Plus: alerts + notes list (must be before /:id)
router.get("/alerts/due", plus.dueAlerts);
router.get("/notes/all", plus.getAllNotes);
router.delete("/notes/:id", plus.deleteNote);

router.put("/:id/status", plus.updateInvoiceStatus);
router.post("/:id/receipt", upload.single("receipt"), plus.uploadReceipt);
router.get("/:id/qr", plus.paymentQr);
router.post("/:id/notes", plus.addNote);
router.get("/:id/notes", plus.getInvoiceNotes);

router.get("/:id", ctrl.getInvoiceById);
router.get("/download/:id", ctrl.downloadInvoiceController);
export default router;
