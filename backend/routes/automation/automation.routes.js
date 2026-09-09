import express from "express";
import { getAttendance, checkIn, checkOut, getWorkSchedule, updateWorkSchedule } from "../../controllers/automation/attendanceController.js";
import { getPerformance, calculatePerformance, getPerformanceReports, getEmployeePerformance, getPerformanceMetrics, createPerformanceMetric, updatePerformanceMetric } from "../../controllers/automation/performanceController.js";
import { getPolicies, createPolicy, updatePolicy, deletePolicy, sendPolicyEmail, getPolicyLogs } from "../../controllers/automation/policyController.js";
import { getTargets, createTarget, updateTarget, getAssignments, createAssignment, updateAssignment, submitEodReport, getEodReports, getDashboardStats } from "../../controllers/automation/workController.js";
import { sendMessage, getConversations, getSettings, updateSettings, getResponseTemplates, createResponseTemplate, updateResponseTemplate, deleteResponseTemplate } from "../../controllers/automation/chatbotController.js";
import { createTicket, getTickets, updateTicket, getTicketStats } from "../../controllers/automation/supportController.js";
import { submitClientRating, submitCandidateRating, getRatingAnalytics } from "../../controllers/automation/ratingController.js";
import { blacklistCandidate, getBlacklist, appealBlacklist, checkBlacklist } from "../../controllers/automation/blacklistController.js";
import { protect } from "../../middleware/auth.middleware.js";

const router = express.Router();

// Attendance Routes
router.get("/attendance", protect(), getAttendance);
router.post("/attendance/checkin", protect(), checkIn);
router.post("/attendance/checkout", protect(), checkOut);
router.get("/work-schedule", protect(), getWorkSchedule);
router.put("/work-schedule", protect(), updateWorkSchedule);

// Performance Routes
router.get("/performance", protect(), getPerformance);
router.post("/performance/calculate", protect(), calculatePerformance);
router.get("/performance/reports", protect(), getPerformanceReports);
router.get("/performance/employees/:id", protect(), getEmployeePerformance);
router.get("/performance/metrics", protect(), getPerformanceMetrics);
router.post("/performance/metrics", protect(), createPerformanceMetric);
router.put("/performance/metrics/:id", protect(), updatePerformanceMetric);

// Policy Routes
router.get("/policies", protect(), getPolicies);
router.post("/policies", protect(), createPolicy);
router.put("/policies/:id", protect(), updatePolicy);
router.delete("/policies/:id", protect(), deletePolicy);
router.post("/policies/send", protect(), sendPolicyEmail);
router.get("/policies/logs", protect(), getPolicyLogs);

// Work Management Routes
router.get("/work/targets", protect(), getTargets);
router.post("/work/targets", protect(), createTarget);
router.put("/work/targets/:id", protect(), updateTarget);
router.get("/work/assignments", protect(), getAssignments);
router.post("/work/assignments", protect(), createAssignment);
router.put("/work/assignments/:id", protect(), updateAssignment);
router.post("/work/eod", protect(), submitEodReport);
router.get("/work/eod", protect(), getEodReports);
router.get("/work/dashboard-stats", protect(), getDashboardStats);

// Chatbot Routes
router.post("/chatbot/message", protect(), sendMessage);
router.get("/chatbot/conversations", protect(), getConversations);
router.get("/chatbot/settings", protect(), getSettings);
router.put("/chatbot/settings", protect(), updateSettings);
router.get("/chatbot/templates", protect(), getResponseTemplates);
router.post("/chatbot/templates", protect(), createResponseTemplate);
router.put("/chatbot/templates/:id", protect(), updateResponseTemplate);
router.delete("/chatbot/templates/:id", protect(), deleteResponseTemplate);

// Support Routes
router.get("/support/tickets", protect(), getTickets);
router.post("/support/tickets", protect(), createTicket);
router.put("/support/tickets/:id", protect(), updateTicket);
router.get("/support/stats", protect(), getTicketStats);

// Rating Routes
router.post("/ratings/client", protect(), submitClientRating);
router.post("/ratings/candidate", protect(), submitCandidateRating);
router.get("/ratings/analytics", protect(), getRatingAnalytics);

// Blacklist Routes
router.get("/blacklist", protect(), getBlacklist);
router.post("/blacklist", protect(), blacklistCandidate);
router.put("/blacklist/:id/appeal", protect(), appealBlacklist);
router.get("/blacklist/check", checkBlacklist);

export default router;
