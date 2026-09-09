import express from "express";
import { hrAuthMiddleware } from "../../middleware/hrAuth.middleware.js";
import { loginIT } from "./auth/itAuth.controller.js";
import {
  getItEmployees,
  getTasks,
  createTask,
  updateTaskStatus,
  deleteTask,
  getDailyWork,
  submitDailyWork,
  getTimesheet,
  addTimesheetEntry,
  deleteTimesheetEntry,
  getCodeReviews,
  createCodeReview,
  updateCodeReview,
  getMilestones,
  createMilestone,
  updateMilestone,
  getBugs,
  reportBug,
  updateBugStatus,
  getPerformanceReport,
  getDeployments,
  logDeployment,
  deleteDeployment,
} from "./it.controller.js";

const router = express.Router();

// Public: IT-portal password login (IT department only). Must be declared
// before the auth middleware below.  -> POST /api/it/auth/login
router.post("/auth/login", loginIT);

router.use(hrAuthMiddleware);

router.get("/employees", getItEmployees);

router.get("/tasks", getTasks);
router.post("/tasks", createTask);
router.patch("/tasks/:id/status", updateTaskStatus);
router.delete("/tasks/:id", deleteTask);

router.get("/daily-work", getDailyWork);
router.post("/daily-work", submitDailyWork);

router.get("/timesheet", getTimesheet);
router.post("/timesheet", addTimesheetEntry);
router.delete("/timesheet/:id", deleteTimesheetEntry);

router.get("/code-reviews", getCodeReviews);
router.post("/code-reviews", createCodeReview);
router.patch("/code-reviews/:id", updateCodeReview);

router.get("/milestones", getMilestones);
router.post("/milestones", createMilestone);
router.patch("/milestones/:id", updateMilestone);

router.get("/bugs", getBugs);
router.post("/bugs", reportBug);
router.patch("/bugs/:id/status", updateBugStatus);

router.get("/deployments", getDeployments);
router.post("/deployments", logDeployment);
router.delete("/deployments/:id", deleteDeployment);

router.get("/performance", getPerformanceReport);

export default router;
