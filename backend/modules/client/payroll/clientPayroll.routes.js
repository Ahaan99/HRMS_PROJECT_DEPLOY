import express from "express";
import {
  upsertPayrollController,
  getPayrollListController,
  deletePayrollController,
  downloadPayrollPdfController,
  generatePayrollController,
  getPayrollMonthsController ,
} from "./clientPayroll.controller.js";
import { clientAuthMiddleware } from "../../../middleware/clientAuth.middleware.js";

const router = express.Router();

router.use(clientAuthMiddleware);

router.post("/", upsertPayrollController);
router.get("/", getPayrollListController);
router.delete("/:id", deletePayrollController);

router.post("/generate", generatePayrollController);
router.get("/pdf/:employeeCode", downloadPayrollPdfController);
router.get("/months/:employeeCode", getPayrollMonthsController);

export default router;
