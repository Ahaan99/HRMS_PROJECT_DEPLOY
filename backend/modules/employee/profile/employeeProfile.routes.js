import express from "express";
import upload from "../../../middleware/upload.middleware.js";
import { employeeAuthMiddleware } from "../../../middleware/employeeAuth.middleware.js";
import { getMyProfile, updateMyProfile, updateMyAvatar, changeMyPassword } from "./employeeProfile.controller.js";

const router = express.Router();

router.use(employeeAuthMiddleware);

router.get("/", getMyProfile);
router.patch("/", updateMyProfile);
// field name "photo" routes the file into uploads/profile via the shared multer storage
router.post("/avatar", upload.single("photo"), updateMyAvatar);
router.put("/password", changeMyPassword);

export default router;
