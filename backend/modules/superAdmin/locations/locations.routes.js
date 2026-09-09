import express from "express";
import {
  createLocation,
  getLocations,
} from "./locations.controller.js";
import { protect } from "../../../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect(["SUPER_ADMIN", "hr"]));

router.post("/", createLocation);
router.get("/", getLocations);

export default router;