import express from "express";
import {
  getMyAssignments,
  updateMyAssignment,
} from "./work.controller.js";

import { hrAuthMiddleware } from "../../../middleware/hrAuth.middleware.js";

const router = express.Router();

router.use(hrAuthMiddleware);

router.get("/", getMyAssignments);

router.patch("/:id", updateMyAssignment);

export default router;