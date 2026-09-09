import express from "express";

import {
  getEODReports,
  createEODReport,
} from "./eodReports.controller.js";

import { requireSalesAuth } from "../../../middleware/salesAuth.middleware.js";

const router = express.Router();

router.use(requireSalesAuth);

router.get("/", getEODReports);

router.post("/", createEODReport);

export default router;
