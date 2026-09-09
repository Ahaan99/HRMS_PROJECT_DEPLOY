import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import {
  getMatrix,
  updateMatrixRule,
  createRevision,
  listRevisions,
  decideRevision,
  cancelRevision,
  salaryHistory,
} from "./salary.controller.js";

const router = express.Router();

/* Approval Matrix */
router.get("/matrix", protect(["SUPER_ADMIN", "MANAGER", "TL"]), getMatrix);
router.put("/matrix/:id", protect(["SUPER_ADMIN"]), updateMatrixRule);

/* Salary Revisions */
router.get("/revisions", protect(["SUPER_ADMIN", "MANAGER", "TL"]), listRevisions);
router.post("/revisions", protect(["SUPER_ADMIN", "MANAGER", "TL"]), createRevision);
router.put("/revisions/:id/decide", protect(["SUPER_ADMIN", "MANAGER", "TL"]), decideRevision);
router.put("/revisions/:id/cancel", protect(["SUPER_ADMIN", "MANAGER", "TL"]), cancelRevision);

/* Salary History */
router.get("/history", protect(["SUPER_ADMIN", "MANAGER", "TL"]), salaryHistory);

export default router;
