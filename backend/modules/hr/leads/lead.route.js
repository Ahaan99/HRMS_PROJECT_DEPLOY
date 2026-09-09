import express from "express";
import {
  updateLead,
  getMyLeads,
  getLeadsByBatch,
  getAllBatches,
} from "./lead.controller.js";
import { protect } from "../../../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect(["hr", "sales"]))


// HR , Sales

router.get("/batches", getAllBatches);
router.get("/my", getMyLeads);
router.get("/batch/:id", getLeadsByBatch);
router.put("/update/:id", updateLead);
export default router;

