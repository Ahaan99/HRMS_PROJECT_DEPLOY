import express from "express";
import {
  getPolicies,
  createPolicy,
  updatePolicy,
  togglePolicy,
  deletePolicy,
  getPolicyLogs,
} from "./policies.controller.js";

import { protect } from "../../../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect(["SUPER_ADMIN", "MANAGER"]));

router.get("/", getPolicies);
router.post("/", createPolicy);
router.put("/:id", updatePolicy);
router.patch("/toggle/:id", togglePolicy);
router.delete("/:id", deletePolicy);

router.get("/logs", getPolicyLogs);

export default router;