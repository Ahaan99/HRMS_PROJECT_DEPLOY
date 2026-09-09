import express from "express";
import {
  getCandidatePolicies,
  createCandidatePolicy,
  deleteCandidatePolicy,
  toggleCandidatePolicy,
} from "./candidatePolicies.controller.js";

import { protect } from "../../../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect(["SUPER_ADMIN", "MANAGER"]));

router.get("/", getCandidatePolicies);
router.post("/", createCandidatePolicy);
router.patch("/toggle/:id", toggleCandidatePolicy);
router.delete("/:id", deleteCandidatePolicy);

export default router;