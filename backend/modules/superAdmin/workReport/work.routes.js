import express from "express";
import * as controller from "./work.controller.js";
import { protect } from "../../../middleware/auth.middleware.js";
const router = express.Router();

router.use(protect(["SUPER_ADMIN", "MANAGER"]));
// ASSIGNMENTS
router.get("/work-assignments", controller.getAssignments);
router.post("/work-assignments", controller.createAssignment);
router.put("/work-assignments/:id", controller.updateAssignment);
router.delete("/work-assignments/:id", controller.deleteAssignment);
router.get("/work-assignments/stats", controller.getAssignmentStats);

// EOD
router.get("/eod-reports", controller.getEODReports);
router.post("/eod-reports", controller.createEOD);
router.put("/eod-reports/:id", controller.updateEOD);
router.get("/eod-reports/stats", controller.getEODStats);
router.get("/eod-reports/pending", controller.getPendingEOD);
router.post("/eod-reports/:id/approve", controller.approveEOD);
router.post("/eod-reports/:id/reject", controller.rejectEOD);
router.delete("/eod-reports/:id", controller.deleteEOD);

//Department 
router.get("/departments", controller.getDepartments);
router.get("/employees", controller.getEmployees);
export default router;
