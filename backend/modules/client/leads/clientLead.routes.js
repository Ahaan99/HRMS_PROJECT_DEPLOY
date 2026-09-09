import express from "express";
import { upload } from "../../../config/multer.js";
import {
  uploadClientLeads,
  getClientBatches,
  getClientLeadsByBatch,
  getEmployeeLeads,
  updateClientLead,
} from "./clientLead.controller.js";

import { clientUnifiedAuthMiddleware } from "../../../middleware/clientUnifiedAuth.middleware.js";

const router = express.Router();

router.use(clientUnifiedAuthMiddleware);

// CLIENT ADMIN
router.post("/upload", upload.single("file"), uploadClientLeads);
router.get("/batches", getClientBatches);
router.get("/batch/:id", getClientLeadsByBatch);

// EMPLOYEE
router.get("/my", getEmployeeLeads);
router.put("/update/:id", updateClientLead);

export default router;