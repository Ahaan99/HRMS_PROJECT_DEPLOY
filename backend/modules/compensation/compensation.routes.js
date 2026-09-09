import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import {
  applyReimbursement,
  myReimbursements,
  cancelMyReimbursement,
  allReimbursements,
  decideReimbursement,
  myRewards,
  allRewards,
  createReward,
  updateRewardStatus,
  deleteReward,
  myInsurance,
  allInsurance,
  createInsurance,
  updateInsuranceStatus,
  deleteInsurance,
} from "./compensation.controller.js";

const router = express.Router();

/* Reimbursements — employee self-service */
router.post("/reimbursements/apply", protect(["EMPLOYEE"]), applyReimbursement);
router.get("/reimbursements/my", protect(["EMPLOYEE"]), myReimbursements);
router.put("/reimbursements/cancel/:id", protect(["EMPLOYEE"]), cancelMyReimbursement);

/* Reimbursements — admin */
router.get("/reimbursements/all", protect(["SUPER_ADMIN", "MANAGER", "TL"]), allReimbursements);
router.put("/reimbursements/:id/decide", protect(["SUPER_ADMIN", "MANAGER", "TL"]), decideReimbursement);

/* Rewards (Incentives & Bonuses) */
router.get("/rewards/my", protect(["EMPLOYEE"]), myRewards);
router.get("/rewards/all", protect(["SUPER_ADMIN", "MANAGER", "TL"]), allRewards);
router.post("/rewards", protect(["SUPER_ADMIN", "MANAGER", "TL"]), createReward);
router.put("/rewards/:id/status", protect(["SUPER_ADMIN", "MANAGER", "TL"]), updateRewardStatus);
router.delete("/rewards/:id", protect(["SUPER_ADMIN", "MANAGER", "TL"]), deleteReward);

/* Insurance Tracking */
router.get("/insurance/my", protect(["EMPLOYEE"]), myInsurance);
router.get("/insurance/all", protect(["SUPER_ADMIN", "MANAGER", "TL"]), allInsurance);
router.post("/insurance", protect(["SUPER_ADMIN", "MANAGER", "TL"]), createInsurance);
router.put("/insurance/:id/status", protect(["SUPER_ADMIN", "MANAGER", "TL"]), updateInsuranceStatus);
router.delete("/insurance/:id", protect(["SUPER_ADMIN", "MANAGER", "TL"]), deleteInsurance);

export default router;
