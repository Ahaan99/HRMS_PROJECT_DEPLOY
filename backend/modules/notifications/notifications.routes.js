import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import { listNotifications, markRead, markAllRead } from "./notifications.controller.js";

const router = express.Router();

router.get("/", protect(["SUPER_ADMIN", "MANAGER", "TL"]), listNotifications);
router.patch("/read-all", protect(["SUPER_ADMIN", "MANAGER", "TL"]), markAllRead);
router.patch("/:id/read", protect(["SUPER_ADMIN", "MANAGER", "TL"]), markRead);

export default router;
