import express from "express";
import { requireSalesAuth } from "../../../middleware/salesAuth.middleware.js";
import { createSale, getMySales, updateSale  } from "./salesReport.controller.js";

const router = express.Router();

router.use(requireSalesAuth)
router.post("/", createSale);
router.get("/", getMySales);
router.put("/:id", updateSale);

export default router;