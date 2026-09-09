import express from "express";
import {
  createStatus,
  getAllStatuses,
  getStatusById,
  updateStatus,
  deleteStatus,
} from "./superAdminStatuses.controller.js";

import { protect } from "../../../middleware/auth.middleware.js";

const router = express.Router();

const READ_ROLES = ["SUPER_ADMIN", "MANAGER", "TL"];
const WRITE_ROLES = ["SUPER_ADMIN"];

// Read access
router.get("/", protect(READ_ROLES), getAllStatuses);
router.get("/:id", protect(READ_ROLES), getStatusById);

// Write access: SUPER_ADMIN only
router.post("/", protect(WRITE_ROLES), createStatus);
router.put("/:id", protect(WRITE_ROLES), updateStatus);
router.delete("/:id", protect(WRITE_ROLES), deleteStatus);

export default router;
