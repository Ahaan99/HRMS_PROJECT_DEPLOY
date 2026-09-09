import express from "express";
import {
  createCall,
  getMyCalls,
  updateCall,
} from "./salesCalls.controller.js";
import { requireSalesAuth } from "../../../middleware/salesAuth.middleware.js";

const router = express.Router();

router.use(requireSalesAuth);

router.post("/", createCall);
router.get("/", getMyCalls);
router.put("/:id", updateCall);

export default router;