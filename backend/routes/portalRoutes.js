import express from "express";
import {
  getPortalSettings,
  updatePortal,
} from "../controllers/portalController.js";
// import { protect } from "../middleware/auth.middleware.js";
const router = express.Router();

// router.use(protect(["SUPER_ADMIN"]));

router.get("/", getPortalSettings);
router.put("/update", updatePortal);

export default router;