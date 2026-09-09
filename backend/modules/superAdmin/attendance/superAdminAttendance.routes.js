import express from "express";
import {
  getAllAttendance,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  getEmployeesList,
} from "./superAdminAttendance.controller.js";

import { protect } from "../../../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect(["SUPER_ADMIN", "MANAGER", "TL"]));

router.get("/", getAllAttendance);
router.get("/employees", getEmployeesList);
router.post("/", createAttendance);
router.put("/:id", updateAttendance);
router.delete("/:id", deleteAttendance);

export default router;