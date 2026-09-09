import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import { listOnboardings, createOnboarding, updateOnboarding, deleteOnboarding } from "./onboarding.controller.js";

const router = express.Router();
const admin = protect(["SUPER_ADMIN"]);

router.get("/", admin, listOnboardings);
router.post("/", admin, createOnboarding);
router.put("/:id", admin, updateOnboarding);
router.delete("/:id", admin, deleteOnboarding);

export default router;
