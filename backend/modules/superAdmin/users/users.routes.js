import express from "express";
import { getPortalUsersController } from "./users.controller.js";
import { protect } from "../../../middleware/auth.middleware.js";

const router = express.Router();

/*
  GET /api/super-admin/users?portal=HR
  portal = ALL | HR | SALES | CLIENT

  Read-only endpoint: SUPER_ADMIN, MANAGER and TL may list portal users.
*/

router.get(
  "/",
  protect(["SUPER_ADMIN", "MANAGER", "TL"]),
  getPortalUsersController
);

export default router;
