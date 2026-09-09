/**
 * Smart Attendance routes - mounted at /api/smart-attendance in app.js.
 *
 * Keeps the exact paths the existing HTML pages call (/api/login, /api/stats,
 * /api/otp/send ...) so the pages only needed their fetch base prefixed.
 * HTML pages + face-api.js models are served from modules/attendance/ui/.
 */
import path from "path";
import { fileURLToPath } from "url";
import express from "express";

import * as c from "./attendance.controller.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UI_DIR = path.join(__dirname, "ui");

const router = express.Router();
const admin = c.requireLogin("admin");
const employee = c.requireLogin("employee");
const anyUser = c.requireLogin();

/* -------- pages (login.html, admin.html, employee.html ...) -------- */
// HTML pages are never cached: after a deploy the browser must pick up the new
// inline JS immediately (a stale admin.html kept the old CSV download code).
const page = (file) => (_req, res) => {
  res.setHeader("Cache-Control", "no-store, must-revalidate");
  res.sendFile(path.join(UI_DIR, file));
};
router.get("/", page("login.html"));
router.get("/register-account", page("register.html"));
router.get("/admin", page("admin.html"));
router.get("/admin/advanced", page("admin_advanced.html"));
router.get("/employee", page("employee.html"));
router.get("/employee/face", page("face_attendance.html"));
router.get("/employee/otp", page("otp_attendance.html"));
router.get("/employee/wifi", page("wifi_attendance.html"));
router.use("/static", express.static(UI_DIR, { index: false, maxAge: "1d" }));

/* -------- health / auth -------- */
router.get("/health", c.health);
router.get("/api/health", c.health);
router.post("/api/login", c.login);
router.post("/api/logout", c.logout);
router.post("/api/register-account", c.registerAccount);

/* -------- location / wifi (public checks, same as Flask) -------- */
router.post("/api/location-status", c.locationStatus);
router.get("/api/office-location", c.officeLocationGet);
router.post("/api/office-location", admin, c.officeLocationSet);
router.get("/api/wifi-check", c.wifiCheck);
router.get("/api/network-status", c.networkStatus);
router.post("/api/wifi-attendance", employee, c.wifiAttendance);

/* -------- otp -------- */
router.post("/api/otp/send", employee, c.otpSend);
router.post("/api/otp/verify", employee, c.otpVerify);

/* -------- face (browser descriptors) -------- */
router.post("/api/register-face", admin, c.registerFace);
router.post("/api/mark-attendance", anyUser, c.markAttendance);

/* -------- stats / reports (admin) -------- */
router.get("/api/stats", admin, c.stats);
router.get("/api/today-log", admin, c.todayLog);
router.get("/api/report", admin, c.report);
router.get("/api/download-csv", admin, c.downloadCsv);
router.get("/api/registered-employees", admin, c.registeredEmployees);
router.post("/api/delete-employee", admin, c.deleteEmployee);

/* -------- accounts (admin) -------- */
router.get("/api/accounts/list", admin, c.accountsList);
router.post("/api/accounts/create", admin, c.accountsCreate);
router.post("/api/accounts/delete", admin, c.accountsDelete);
router.post("/api/accounts/update-admin", admin, c.accountsUpdateAdmin);

/* -------- attendance record deletes (admin) -------- */
router.delete("/api/attendance/delete-by-date/:date", admin, c.deleteByDate);
router.delete("/api/attendance/:emp_id", admin, c.deleteRecord);
router.post("/api/attendance/bulk-delete", admin, c.bulkDelete);

/* -------- employee self-service -------- */
router.get("/api/my-status", employee, c.myStatus);
router.get("/api/my-history", employee, c.myHistory);
router.post("/api/check-out", employee, c.checkOut);

/* -------- attendance_plus: shift / approval / corrections / summary / hrms -------- */
router.get("/api/shift-settings", anyUser, c.shiftGet);
router.post("/api/shift-settings", admin, c.shiftSet);
router.get("/api/summary", admin, c.adminSummary);
router.get("/api/attendance/pending", admin, c.attendancePending);
router.post("/api/attendance/approve", admin, c.attendanceApprove);
router.get("/api/corrections", anyUser, c.correctionsList);
router.post("/api/corrections", employee, c.correctionRequest);
router.post("/api/corrections/:cid", admin, c.correctionDecide);
router.get("/api/hrms-settings", admin, c.hrmsGet);
router.post("/api/hrms-settings", admin, c.hrmsSet);
router.post("/api/hrms-sync/retry", admin, c.hrmsRetry);

export default router;
