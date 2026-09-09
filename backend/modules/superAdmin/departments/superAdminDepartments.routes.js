import express from "express";
import {
  createDepartmentController,
  getAllDepartments ,
  getDepartmentEmployeesController,
  updateDepartmentController,
  deleteDepartmentController,
} from "./superAdminDepartments.controller.js";
import { protect } from "../../../middleware/auth.middleware.js";
const router = express.Router();

// Read access: SUPER_ADMIN, MANAGER and TL
router.get("/", protect(["SUPER_ADMIN", "MANAGER", "TL"]), getAllDepartments);
router.get(
  "/:id/employees",
  protect(["SUPER_ADMIN", "MANAGER", "TL"]),
  getDepartmentEmployeesController
);

// Write access: SUPER_ADMIN only
router.post("/", protect(["SUPER_ADMIN"]), createDepartmentController);
router.put("/:id", protect(["SUPER_ADMIN"]), updateDepartmentController);
router.delete("/:id", protect(["SUPER_ADMIN"]), deleteDepartmentController);

export default router;
