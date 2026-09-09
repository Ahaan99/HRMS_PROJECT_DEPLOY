import express from "express";
import {
  getPerformances,
  createPerformance,
  updatePerformance,
  deletePerformance,
} from "./clientPerformance.controller.js";
import { clientUnifiedAuthMiddleware } from "../../../middleware/clientUnifiedAuth.middleware.js";
import { clientAuthMiddleware } from "../../../middleware/clientAuth.middleware.js";

// ✅ apply ONCE
// router.use(clientUnifiedAuthMiddleware);

const router = express.Router();

router.get("/",clientUnifiedAuthMiddleware, getPerformances);
router.post("/",clientAuthMiddleware, createPerformance);
router.put("/:id",clientAuthMiddleware, updatePerformance);
router.delete("/:id",clientAuthMiddleware, deletePerformance);

export default router;
