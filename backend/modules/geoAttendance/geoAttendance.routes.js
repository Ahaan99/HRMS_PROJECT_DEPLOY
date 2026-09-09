import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import { employeeAuthMiddleware } from "../../middleware/employeeAuth.middleware.js";
import {
  listOffices,
  createOffice,
  deleteOffice,
  listGeoPunches,
  geoPunch,
  geoToday,
} from "./geoAttendance.controller.js";

const router = express.Router();

/* Employee endpoints */
router.post("/punch", employeeAuthMiddleware, geoPunch);
router.get("/today", employeeAuthMiddleware, geoToday);

/* Admin endpoints */
router.get("/offices", protect(["SUPER_ADMIN", "MANAGER", "TL"]), listOffices);
router.post("/offices", protect(["SUPER_ADMIN"]), createOffice);
router.delete("/offices/:id", protect(["SUPER_ADMIN"]), deleteOffice);
router.get("/punches", protect(["SUPER_ADMIN", "MANAGER", "TL"]), listGeoPunches);

export default router;
