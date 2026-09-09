import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import {
  getLeaveTypes,
  addLeaveType,
  updateLeaveType,
  deleteLeaveType,
  getHolidays,
  addHoliday,
  deleteHoliday,
  applyLeave,
  myApplications,
  cancelMyApplication,
  myBalance,
  allApplications,
  decideApplication,
  allBalances,
  leaveCalendar,
  requestCompOff,
  myCompOffs,
  allCompOffs,
  decideCompOff,
} from "./leave.controller.js";
import {
  adminListClientLeaves,
  adminDecideClientLeave,
} from "../client/leaveOffer/leaveOffer.controller.js";

const router = express.Router();

/* Admin: leave requests raised inside client portals */
router.get("/client-leaves", protect(["SUPER_ADMIN"]), adminListClientLeaves);
router.put("/client-leaves/:id/decide", protect(["SUPER_ADMIN"]), adminDecideClientLeave);

/* Shared (any authenticated user) */
router.get("/types", protect(), getLeaveTypes);
router.get("/holidays", protect(), getHolidays);
router.get("/calendar", protect(), leaveCalendar);

/* Employee self-service */
router.post("/apply", protect(["EMPLOYEE"]), applyLeave);
router.get("/my-applications", protect(["EMPLOYEE"]), myApplications);
router.put("/cancel/:id", protect(["EMPLOYEE"]), cancelMyApplication);
router.get("/my-balance", protect(["EMPLOYEE"]), myBalance);
router.post("/comp-off", protect(["EMPLOYEE"]), requestCompOff);
router.get("/my-comp-offs", protect(["EMPLOYEE"]), myCompOffs);

/* Admin */
router.get("/applications", protect(["SUPER_ADMIN"]), allApplications);
router.put("/applications/:id/decide", protect(["SUPER_ADMIN"]), decideApplication);
router.get("/balances", protect(["SUPER_ADMIN"]), allBalances);
router.post("/types", protect(["SUPER_ADMIN"]), addLeaveType);
router.put("/types/:id", protect(["SUPER_ADMIN"]), updateLeaveType);
router.delete("/types/:id", protect(["SUPER_ADMIN"]), deleteLeaveType);
router.post("/holidays", protect(["SUPER_ADMIN"]), addHoliday);
router.delete("/holidays/:id", protect(["SUPER_ADMIN"]), deleteHoliday);
router.get("/comp-offs", protect(["SUPER_ADMIN"]), allCompOffs);
router.put("/comp-offs/:id/decide", protect(["SUPER_ADMIN"]), decideCompOff);

export default router;
