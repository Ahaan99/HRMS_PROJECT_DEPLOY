import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import {
  listCompliance, createCompliance, updateCompliance, deleteCompliance,
  listAudit, runSalarySync, listPayrollRuns, updatePayrollStatus,
} from "./compliance.controller.js";

const router = express.Router();
const admin = protect(["SUPER_ADMIN"]);

router.get("/", admin, listCompliance);
router.post("/", admin, createCompliance);
router.put("/:id", admin, updateCompliance);
router.delete("/:id", admin, deleteCompliance);

router.get("/audit/logs", admin, listAudit);

router.post("/payroll/sync", admin, runSalarySync);
router.get("/payroll/runs", admin, listPayrollRuns);
router.put("/payroll/runs/:id", admin, updatePayrollStatus);

export default router;
