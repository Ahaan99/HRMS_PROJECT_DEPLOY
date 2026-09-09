import express from "express";
import { createJoining } from "./hrJoining.controller.js";
import upload from "../../../middleware/upload.middleware.js";

import { hrAuthMiddleware } from "../../../middleware/hrAuth.middleware.js";

const router = express.Router();

router.use(hrAuthMiddleware);

router.post(
  "/create",
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "signature", maxCount: 1 }
  ]),
  createJoining
);

export default router;