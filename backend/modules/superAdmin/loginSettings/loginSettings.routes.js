import express from "express";
import {
  getLoginSettings,
  updateGlobalSettings,
  saveEmployeeSettings,
  getTodayLogs,
  getHistory,
  getShifts,
  assignEmployeeShift,
} from "./loginSettings.controller.js";

import { protect } from "../../../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect(["SUPER_ADMIN", "MANAGER"]));

router.get("/", getLoginSettings);
router.put("/global", updateGlobalSettings);
router.post("/employee", saveEmployeeSettings);

router.get("/shifts", getShifts);
router.put("/employee/:id/shift", assignEmployeeShift);

router.get("/today", getTodayLogs);
router.get("/history", getHistory);

export default router;
