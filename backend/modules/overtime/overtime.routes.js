import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import {
  applyOvertime,
  myOvertime,
  cancelMyOvertime,
  allOvertime,
  decideOvertime,
} from "./overtime.controller.js";

const router = express.Router();

/* Employee self-service */
router.post("/apply", protect(["EMPLOYEE"]), applyOvertime);
router.get("/my", protect(["EMPLOYEE"]), myOvertime);
router.put("/cancel/:id", protect(["EMPLOYEE"]), cancelMyOvertime);

/* Admin / Manager / TL */
router.get("/all", protect(["SUPER_ADMIN", "MANAGER", "TL"]), allOvertime);
router.put("/:id/decide", protect(["SUPER_ADMIN", "MANAGER", "TL"]), decideOvertime);

export default router;
