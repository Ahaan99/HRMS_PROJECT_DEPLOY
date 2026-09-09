import express from "express";
import {
  createCandidate,
  getAllCandidates,
  getCandidateById,
  updateCandidate,
  deleteCandidate,
} from "./superAdminCandidates.controller.js";

import { protect } from "../../../middleware/auth.middleware.js";

const router = express.Router();

/* =====================================================
CLIENT MANAGEMENT (Super Admin & Manager)
===================================================== */

router.use(protect(["SUPER_ADMIN", "MANAGER"]));


router.post("/", createCandidate);
router.get("/", getAllCandidates);
router.get("/:id", getCandidateById);
router.put("/:id", updateCandidate);
router.delete("/:id", deleteCandidate);

export default router;
