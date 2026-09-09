import express from "express";
import {
  uploadLeads,
  assignLead,
  getAllLeads,
  getAllBatches,
} from "./lead.controller.js";
import { upload } from "../../../config/multer.js";
import { protect } from "../../../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect(["SUPER_ADMIN"]))

// SUPER ADMIN
router.post("/upload",  upload.single("file"), uploadLeads);
router.put("/assign/:id", assignLead);
router.get("/batches", getAllBatches);
router.get("/", getAllLeads);

export default router;
