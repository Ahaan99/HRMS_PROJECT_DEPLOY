import express from "express";

import {
  getMyPerformance,
} from "./performance.controller.js";

import { requireSalesAuth } from "../../../middleware/salesAuth.middleware.js";

const router = express.Router();

router.use(requireSalesAuth);

router.get("/", getMyPerformance);

export default router;
