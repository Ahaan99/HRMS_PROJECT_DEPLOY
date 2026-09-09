import express from "express";
import {
  addPayrollController,
  getAllPayrollController,
  deletePayrollController,
  downloadAdminPayrollPdfController,
  autoGeneratePayrollController,
} from "./adminPayroll.controller.js";

import { protect } from "../../../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect(["SUPER_ADMIN", "MANAGER"]));

router.get("/", getAllPayrollController);
router.get("/pdf/:employeeCode", downloadAdminPayrollPdfController);
router.post("/add", addPayrollController);
router.post("/auto-generate", autoGeneratePayrollController);

router.delete("/:id", deletePayrollController);


export default router;

