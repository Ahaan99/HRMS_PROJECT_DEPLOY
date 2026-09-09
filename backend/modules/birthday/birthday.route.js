import express from "express";
import {
  getTodayBirthdays,
  getNotifications,
  markNotificationsRead,
} from "./birthday.controller.js";

import { protect } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect(["SUPER_ADMIN", "hr", "client", "sales", "it"]));

router.get("/today", getTodayBirthdays);
router.get("/notifications", getNotifications);
router.put("/read", markNotificationsRead);

export default router;
