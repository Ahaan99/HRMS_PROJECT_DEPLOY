import express from "express";
import { protect } from "../../../middleware/auth.middleware.js";

import {
  createDesignation,
  getAllDesignations,
  getDesignationById,
  updateDesignation,
  deleteDesignation,
} from "./superAdminDesignations.controller.js";

const router = express.Router();

const READ_ROLES = ["SUPER_ADMIN", "MANAGER", "TL"];
const WRITE_ROLES = ["SUPER_ADMIN"];

// Read access
router.get("/", protect(READ_ROLES), getAllDesignations);
router.get("/:id", protect(READ_ROLES), getDesignationById);

// Write access: SUPER_ADMIN only
router.post("/", protect(WRITE_ROLES), createDesignation);
router.put("/:id", protect(WRITE_ROLES), updateDesignation);
router.delete("/:id", protect(WRITE_ROLES), deleteDesignation);

export default router;
