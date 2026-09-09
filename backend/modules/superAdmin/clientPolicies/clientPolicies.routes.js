import express from "express";
import {
  getClientPolicies,
  createClientPolicy,
  deleteClientPolicy,
  toggleClientPolicy,
} from "./clientPolicies.controller.js";

import { protect } from "../../../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect(["SUPER_ADMIN", "MANAGER"]));

router.get("/", getClientPolicies);
router.post("/", createClientPolicy);
router.patch("/toggle/:id", toggleClientPolicy);
router.delete("/:id", deleteClientPolicy);

export default router;