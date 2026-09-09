// ledger.routes.js
import express from "express";
import {
  getLedger,
  getLedgerBalances,
  getLedgerByDateRange,
  addLedgerEntry,
  deleteLedgerEntry,
} from "./ledger.controller.js";

import { clientAuthMiddleware } from "../../../middleware/clientAuth.middleware.js";

const router = express.Router();

router.use(clientAuthMiddleware);

router.get("/", getLedger);
router.get("/balances", getLedgerBalances);
router.get("/by-date-range", getLedgerByDateRange);
router.post("/add", addLedgerEntry);
router.delete("/:id", deleteLedgerEntry);

export default router;
