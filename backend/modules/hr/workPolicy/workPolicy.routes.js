import express from "express";
import {
  getPolicies,
  createPolicy,
  updatePolicy,
  deletePolicy,
} from "./workPolicy.controller.js";

import { hrAuthMiddleware } from "../../../middleware/hrAuth.middleware.js";

const router = express.Router();

router.use(hrAuthMiddleware);

router.get("/", getPolicies);
router.post("/", createPolicy);
router.put("/:id", updatePolicy);
router.delete("/:id", deletePolicy);

export default router;