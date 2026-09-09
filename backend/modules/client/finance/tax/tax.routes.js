import express from "express";
import {
  getAllTaxRecords,
  getTaxTotals,
  getByType,
  createTaxRecord,
  deleteTaxRecord,
} from "./tax.controller.js";

import {clientAuthMiddleware} from "../../../../middleware/clientAuth.middleware.js";

const router = express.Router();

router.use(clientAuthMiddleware);

// GET
router.get("/", getAllTaxRecords);
router.get("/totals", getTaxTotals);
router.get("/by-type/:type", getByType);

// POST
router.post("/add", createTaxRecord);

// DELETE
router.delete("/:id", deleteTaxRecord);

export default router;