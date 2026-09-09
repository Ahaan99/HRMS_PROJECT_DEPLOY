import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import {
  listBranches,
  createBranch,
  updateBranch,
  assignEmployee,
  branchEmployees,
  unassignedEmployees,
} from "./branches.controller.js";

const router = express.Router();
const admin = protect(["SUPER_ADMIN", "MANAGER"]);

router.get("/", admin, listBranches);
router.post("/", admin, createBranch);
router.put("/:id", admin, updateBranch);
router.post("/assign", admin, assignEmployee);
router.get("/unassigned", admin, unassignedEmployees);
router.get("/:id/employees", admin, branchEmployees);

export default router;
