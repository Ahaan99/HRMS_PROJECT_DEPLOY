import express from "express";
import {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  getEmployeesByDepartmentController,
} from "./superAdminEmployees.controller.js";

import { protect } from "../../../middleware/auth.middleware.js";
import upload from "../../../middleware/upload.middleware.js";

const router = express.Router();

const READ_ROLES = ["SUPER_ADMIN", "MANAGER", "hr", "TL"];
const WRITE_ROLES = ["SUPER_ADMIN", "MANAGER", "hr"];

// ✅ CREATE EMPLOYEE (IMAGE FIELD = profile_image)
router.post(
  "/",
  protect(WRITE_ROLES),
  upload.single("profile_image"),   // 👈 MUST MATCH FRONTEND
  createEmployee
);


// READ (TL has read-only access)
router.get("/", protect(READ_ROLES), getAllEmployees);
router.get("/by-department", protect(READ_ROLES), getEmployeesByDepartmentController);
router.get("/:id", protect(READ_ROLES), getEmployeeById);

// ✅ UPDATE EMPLOYEE (FIXED: Added multer middleware to parse multi-part form data)
router.put(
  "/:id",
  protect(WRITE_ROLES),
  upload.single("profile_image"),
  updateEmployee
);

// DELETE
router.delete("/:id", protect(WRITE_ROLES), deleteEmployee);

export default router;
