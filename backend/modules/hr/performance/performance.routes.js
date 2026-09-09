import express from "express";

import {
  getMyPerformance,
} from "./performance.controller.js";

import { hrAuthMiddleware } from "../../../middleware/hrAuth.middleware.js";

const router = express.Router();

router.use(hrAuthMiddleware);

router.get("/", getMyPerformance);

export default router;