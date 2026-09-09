import express from "express";
import { getTeamSummary, decideLeave } from "./teamDashboard.controller.js";
import { protect } from "../../../middleware/auth.middleware.js";

const router = express.Router();

const TEAM_ROLES = ["SUPER_ADMIN", "MANAGER", "TL"];

router.get("/summary", protect(TEAM_ROLES), getTeamSummary);
router.patch("/leaves/:id", protect(TEAM_ROLES), decideLeave);

export default router;
