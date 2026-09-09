import express from "express";

import {
  getMyEODReports,
  createEOD,
  updateEOD,
} from "./eod.controller.js";

import { requireSalesAuth } from "../../../middleware/salesAuth.middleware.js";

const router = express.Router();

router.use(requireSalesAuth);

router.get("/", getMyEODReports);

router.post("/", createEOD);

router.patch("/:id", updateEOD);

export default router;