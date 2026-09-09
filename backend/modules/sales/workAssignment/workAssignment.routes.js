import express from "express";
import {
  getMyAssignments,
  updateProgress,
  updateStatus,
} from "./workAssignment.controller.js";

import { requireSalesAuth } from "../../../middleware/salesAuth.middleware.js";

const router = express.Router();

router.use(requireSalesAuth);

router.get("/", getMyAssignments);
router.patch("/progress/:id", updateProgress);
router.patch("/status/:id", updateStatus);

export default router;
