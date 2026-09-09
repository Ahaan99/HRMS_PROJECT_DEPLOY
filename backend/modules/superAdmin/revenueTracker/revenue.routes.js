import express from "express";
import { protect } from "../../../middleware/auth.middleware.js";
import {
  createRevenue,
  getRevenues,
  getRevenueCategories
} from "./revenue.controller.js";
import {
  advancedSummary,
  getTargets,
  setTarget,
  deleteTarget,
} from "./revenueAdvanced.controller.js";

const router = express.Router();

router.use(protect(["SUPER_ADMIN"]));

router.post("/", createRevenue);
router.get("/", getRevenues);
router.get("/categories", getRevenueCategories);

// Advanced tracker
router.get("/advanced/summary", advancedSummary);
router.get("/advanced/targets", getTargets);
router.post("/advanced/targets", setTarget);
router.delete("/advanced/targets/:id", deleteTarget);

export default router;