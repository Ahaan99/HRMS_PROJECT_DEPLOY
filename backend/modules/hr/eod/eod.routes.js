import express from "express";

import {
  getMyEODReports,
  createEOD,
  updateEOD,
} from "./eod.controller.js";

import { hrAuthMiddleware } from "../../../middleware/hrAuth.middleware.js";

const router = express.Router();

router.use(hrAuthMiddleware);

router.get("/", getMyEODReports);

router.post("/", createEOD);

router.patch("/:id", updateEOD);

export default router;
