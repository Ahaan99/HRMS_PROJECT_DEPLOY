import express from "express";
import {
  sendEmailController,
  getEmailTemplatesController,
  saveEmailTemplateController,
  updateEmailTemplateController,
  deleteEmailTemplateController,
  getEmailLogsController,
  getEmailStatsController,
  sendBulkEmailController
} from "./email.controller.js";
import { protect } from "../../../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect(["SUPER_ADMIN"]));

router.post("/send", sendEmailController);
router.post("/send-bulk", sendBulkEmailController);
router.get("/templates", getEmailTemplatesController);
router.post("/templates", saveEmailTemplateController);
router.put("/templates/:id", updateEmailTemplateController);
router.delete("/templates/:id", deleteEmailTemplateController);
router.get("/logs", getEmailLogsController);
router.get("/stats", getEmailStatsController);

export default router;
