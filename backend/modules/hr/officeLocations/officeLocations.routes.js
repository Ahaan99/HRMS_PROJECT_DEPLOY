import express from "express";

import {
  getOfficeLocations,
  saveOfficeLocations,
} from "./officeLocations.controller.js";

import { hrAuthMiddleware } from "../../../middleware/hrAuth.middleware.js";

const router = express.Router();

router.use(hrAuthMiddleware);

router.get("/", getOfficeLocations);

router.post("/", saveOfficeLocations);

export default router;
