import express from "express";

import {
  getMyTargets,
  updateProgress,
} from "./targets.controller.js";

import { employeeAuthMiddleware } from "../../../middleware/employeeAuth.middleware.js";

const router = express.Router();

router.use(employeeAuthMiddleware);

router.get("/", getMyTargets);

router.patch(
  "/progress/:id",
  updateProgress
);

export default router;