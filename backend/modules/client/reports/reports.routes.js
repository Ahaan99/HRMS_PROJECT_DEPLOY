// reports.routes.js
import express from "express";
import {
  getProfitLoss,
  getBalanceSheet,
  getCashFlow,
  getSummary,
} from "./reports.controller.js";

import { clientAuthMiddleware } from "../../../middleware/clientAuth.middleware.js";

const router = express.Router();

router.use(clientAuthMiddleware);

router.get("/profit-loss", getProfitLoss);
router.get("/balance-sheet", getBalanceSheet);
router.get("/cash-flow", getCashFlow);
router.get("/summary", getSummary);

export default router;
