import express from "express";
import {
  getMyAssignments,
  updateMyAssignment,
} from "./work.controller.js";

import { requireSalesAuth } from "../../../middleware/salesAuth.middleware.js";

const router = express.Router();

router.use(requireSalesAuth);

router.get("/", getMyAssignments);

router.patch("/:id", updateMyAssignment);

export default router;