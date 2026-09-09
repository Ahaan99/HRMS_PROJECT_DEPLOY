import express from "express";
import { protect } from "../../../middleware/auth.middleware.js";
import { getProfitSummary,generateMonthlyProfit } from "./profit.controller.js";

const router = express.Router();

router.use(protect(["SUPER_ADMIN"]));

router.get("/summary", getProfitSummary);
router.post("/generate", generateMonthlyProfit);

export default router;