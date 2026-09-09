import express from "express";
import { protect } from "../../../middleware/auth.middleware.js";
import {
  getAllInterviews,
  getAllScheduledInterviews,
  getInterviewById,
  createInterview,
  updateInterview,
  deleteInterview,
  getAllHRNames,
  updateJoinedStatus,
} from "./superAdminInterviews.controller.js";

const router = express.Router();

router.use(protect(["SUPER_ADMIN", "TL", "MANAGER"]));

router.get("/hr-list", getAllHRNames);

router.post("/", createInterview);
router.get("/", getAllInterviews);
router.get("/scheduled", getAllScheduledInterviews);
router.get("/:id", getInterviewById);
router.put("/:id", updateInterview);
router.delete("/:id", deleteInterview);
router.patch("/joined/:id", updateJoinedStatus);

export default router;