import express from "express";
import {
  getTargets,
  createTarget,
  updateTarget,
  deleteTarget,
  updateProgress,
} from "./targets.controller.js";

import { protect } from "../../../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect(["SUPER_ADMIN", "MANAGER", "hr", "sales", "it"]));

router.get("/", getTargets);
router.post("/", createTarget);
router.put("/:id", updateTarget);
router.delete("/:id", deleteTarget);

router.patch("/progress/:id", updateProgress);

export default router;