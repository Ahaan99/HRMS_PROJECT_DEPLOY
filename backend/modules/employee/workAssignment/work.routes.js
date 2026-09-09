import express from "express";
import {
  getMyAssignments,
  updateMyAssignment,
} from "./work.controller.js";

import { employeeAuthMiddleware } from "../../../middleware/employeeAuth.middleware.js";

const router = express.Router();

router.use(employeeAuthMiddleware);

router.get("/", getMyAssignments);

router.patch("/:id", updateMyAssignment);

export default router;