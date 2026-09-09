// jobPositions.routes.js

import express from "express";
import {
  createJobPosition,
  getJobPositions,
} from "./jobPositions.controller.js";
import { protect } from "../../../middleware/auth.middleware.js";

const router = express.Router();

// // Protect all routes
router.use(protect(["SUPER_ADMIN", "hr"]));

router.post("/", createJobPosition);
router.get("/", getJobPositions);

export default router;
