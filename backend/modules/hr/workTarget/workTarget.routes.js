import express from "express";
import {
  getTargets,
  createTarget,
} from "./workTarget.controller.js";

import { hrAuthMiddleware } from "../../../middleware/hrAuth.middleware.js";

const router = express.Router();

router.use(hrAuthMiddleware);

router.get("/", getTargets);
router.post("/", createTarget);

export default router;