import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import { workforce, recruitment, attendance, leaves, financial } from "./analytics.controller.js";

const router = express.Router();

router.get("/workforce", protect(["SUPER_ADMIN"]), workforce);
router.get("/recruitment", protect(["SUPER_ADMIN"]), recruitment);
router.get("/attendance", protect(["SUPER_ADMIN"]), attendance);
router.get("/leaves", protect(["SUPER_ADMIN"]), leaves);
router.get("/financial", protect(["SUPER_ADMIN"]), financial);

export default router;
