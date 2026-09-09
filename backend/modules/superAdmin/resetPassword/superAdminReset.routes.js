import express from "express";
import { resetPasswordController } from "./superAdminReset.controller.js";
import { resetTLPasswordController } from "./resetTLPassword.controller.js";
import { protect } from "../../../middleware/auth.middleware.js";

const router = express.Router();
router.use(protect(["SUPER_ADMIN"]));

router.put("/", resetPasswordController);
router.put("/tl", resetTLPasswordController);

export default router;
