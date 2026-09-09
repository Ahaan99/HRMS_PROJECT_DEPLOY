import express from "express";

import { getEODReports } from "./eodReports.controller.js";

import { hrAuthMiddleware } from "../../../middleware/hrAuth.middleware.js";

const router = express.Router();

router.use(hrAuthMiddleware);

router.get("/", getEODReports);

export default router;
