import express from "express";
import {
getExitRequests,
createExitRequest,
updateExitStatus,
deleteExitRequest,
getExitStats,
} from "./superAdminExit.controller.js";

import { protect } from "../../../middleware/auth.middleware.js";
const router = express.Router();

// Protect all routes
router.use(protect(["SUPER_ADMIN"]));

router.get("/", getExitRequests);
router.post("/", createExitRequest);
router.put("/:id/status", updateExitStatus);
router.delete("/:id", deleteExitRequest);
router.get("/stats", getExitStats);

export default router;
