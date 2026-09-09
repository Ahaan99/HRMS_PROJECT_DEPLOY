import express from "express";
import {
  createComplaint,
  getComplaints,
  addReply,
  getSingleComplaint, updateStatus,
} from "./complaint.controller.js";

// import { complaintAuth } from "../../middleware/complaintAuth.middleware.js";
import { protect } from "../../middleware/auth.middleware.js";


const router = express.Router();

// router.use(complaintAuth);
// allow all roles
router.use(protect(["SUPER_ADMIN", "MANAGER", "hr", "client_admin", "sales", "it"]));

router.get("/", getComplaints);
router.post("/", createComplaint);
router.post("/:id/reply", addReply);
router.get("/:id", getSingleComplaint);
router.put("/:id/status", updateStatus);

export default router;

