import express from "express";
import { getAllCandidateStatuses } from "./superAdminCandidateStatuses.controller.js";

import { protect } from "../../../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect(["SUPER_ADMIN", "MANAGER"]));

router.get("/", getAllCandidateStatuses);

export default router;
