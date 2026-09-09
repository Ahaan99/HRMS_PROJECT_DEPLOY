import express from "express";
import {loginEmployee,getMe} from "./employeeAuth.controller.js";

import { employeeAuthMiddleware } from "../../../middleware/employeeAuth.middleware.js";

const router = express.Router();



router.post(
  "/login",
  (req, res, next) => {
    console.log("🔥 ROUTE HIT");
    next();
  },
  loginEmployee
);

router.get("/me", employeeAuthMiddleware, getMe);

export default router;

