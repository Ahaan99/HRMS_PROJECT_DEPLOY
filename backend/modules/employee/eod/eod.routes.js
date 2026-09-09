import express from "express";

import {
  getMyEODReports,
  createEOD,
  updateEOD,
} from "./eod.controller.js";

import { employeeAuthMiddleware } from "../../../middleware/employeeAuth.middleware.js";

const router = express.Router();

router.use(employeeAuthMiddleware);

router.get("/", getMyEODReports);

router.post("/", createEOD);

router.patch("/:id", updateEOD);

export default router;
