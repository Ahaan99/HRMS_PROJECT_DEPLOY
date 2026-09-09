import express from "express";

import {
  getMyPerformance,
} from "./performance.controller.js";

import { employeeAuthMiddleware } from "../../../middleware/employeeAuth.middleware.js";

const router = express.Router();

router.use(employeeAuthMiddleware);

router.get("/", getMyPerformance);

export default router;
