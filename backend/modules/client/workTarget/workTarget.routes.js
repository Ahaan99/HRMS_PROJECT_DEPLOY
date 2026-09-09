// workTarget.routes.js
import express from "express";
import {
  getWorkTargets,
  createWorkTarget,
  updateWorkTarget,
  deleteWorkTarget,
} from "./workTarget.controller.js";

import { clientAuthMiddleware } from "../../../middleware/clientAuth.middleware.js";

const router = express.Router();

router.use(clientAuthMiddleware);

router.get("/", getWorkTargets);
router.post("/", createWorkTarget);
router.put("/:id", updateWorkTarget);
router.delete("/:id", deleteWorkTarget);

export default router;
