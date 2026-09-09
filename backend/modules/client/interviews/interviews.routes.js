import express from "express";
import { clientAuthMiddleware } from "../../../middleware/clientAuth.middleware.js";
import {
  getClientInterviews,
  updateClientDecision,
} from "./interviews.controller.js";

const router = express.Router();

// same pattern as employees
router.use(clientAuthMiddleware);

router.get("/", getClientInterviews);
router.put("/:id/decision", updateClientDecision);

export default router;