import express from "express";
import {
  getAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  updateStatus,
} from "./workAssignment.controller.js";

import { clientUnifiedAuthMiddleware } from "../../../middleware/clientUnifiedAuth.middleware.js";
import { clientAuthMiddleware } from "../../../middleware/clientAuth.middleware.js";

const router = express.Router();

router.use(clientUnifiedAuthMiddleware);

router.get("/", getAssignments);
router.post("/", clientAuthMiddleware, createAssignment);
router.put("/:id", clientAuthMiddleware, updateAssignment);
router.delete("/:id", clientAuthMiddleware, deleteAssignment);
router.patch("/status/:id", updateStatus);

export default router;