// workTarget.routes.js
import express from "express";
import {
  getWorkTargets,
  createWorkTarget,
  updateWorkTarget,
  deleteWorkTarget,
} from "./workTarget.controller.js";

import { clientAuthMiddleware } from "../../../middleware/clientAuth.middleware.js";
import { clientUnifiedAuthMiddleware } from "../../../middleware/clientUnifiedAuth.middleware.js";

const router = express.Router();

// Employees read the targets that apply to them; only the client admin manages them.
router.get("/", clientUnifiedAuthMiddleware, getWorkTargets);
router.post("/", clientAuthMiddleware, createWorkTarget);
router.put("/:id", clientAuthMiddleware, updateWorkTarget);
router.delete("/:id", clientAuthMiddleware, deleteWorkTarget);

export default router;
