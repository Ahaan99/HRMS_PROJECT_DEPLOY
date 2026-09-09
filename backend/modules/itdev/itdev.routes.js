import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import {
  listTasks,
  createTask,
  updateTask,
  deleteTask,
  listBugs,
  createBug,
  updateBug,
  deleteBug,
  listTimesheets,
  logTime,
  deleteTimesheet,
  listDeployments,
  logDeployment,
  deleteDeployment,
  listMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  performanceSummary,
  listCodeReviews,
  listDailyWork,
} from "./itdev.controller.js";

const router = express.Router();

const BOTH = ["SUPER_ADMIN", "EMPLOYEE"];

/* Tasks */
router.get("/tasks", protect(BOTH), listTasks);
router.post("/tasks", protect(["SUPER_ADMIN"]), createTask);
router.put("/tasks/:id", protect(BOTH), updateTask);
router.delete("/tasks/:id", protect(["SUPER_ADMIN"]), deleteTask);

/* Bugs */
router.get("/bugs", protect(BOTH), listBugs);
router.post("/bugs", protect(BOTH), createBug);
router.put("/bugs/:id", protect(BOTH), updateBug);
router.delete("/bugs/:id", protect(["SUPER_ADMIN"]), deleteBug);

/* Timesheets */
// Timesheets are the developer's own record: management reviews them read-only.
router.get("/timesheets", protect(BOTH), listTimesheets);

/* Deployments */
router.get("/deployments", protect(BOTH), listDeployments);
router.post("/deployments", protect(BOTH), logDeployment);
router.delete("/deployments/:id", protect(["SUPER_ADMIN"]), deleteDeployment);

/* Milestones */
router.get("/milestones", protect(BOTH), listMilestones);
router.post("/milestones", protect(["SUPER_ADMIN"]), createMilestone);
router.put("/milestones/:id", protect(["SUPER_ADMIN"]), updateMilestone);
router.delete("/milestones/:id", protect(["SUPER_ADMIN"]), deleteMilestone);

/* Code reviews + daily work (read-only mirror of the IT portal) */
router.get("/code-reviews", protect(["SUPER_ADMIN"]), listCodeReviews);
router.get("/daily-work", protect(["SUPER_ADMIN"]), listDailyWork);

/* Performance */
router.get("/performance", protect(["SUPER_ADMIN"]), performanceSummary);

export default router;
