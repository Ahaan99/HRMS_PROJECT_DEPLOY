import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import upload from "../../middleware/upload.middleware.js";
import {
  createSop,
  listSops,
  uploadNewVersion,
  sopVersions,
  updateSop,
  deleteSop,
  ackReport,
  mySops,
  acknowledgeSop,
} from "./sop.controller.js";

const router = express.Router();

/* Employee self-service */
router.get("/my", protect(["EMPLOYEE"]), mySops);
router.post("/:id/acknowledge", protect(["EMPLOYEE"]), acknowledgeSop);

/* Admin */
router.get("/", protect(["SUPER_ADMIN"]), listSops);
router.post("/", protect(["SUPER_ADMIN"]), upload.single("file"), createSop);
router.post("/:id/version", protect(["SUPER_ADMIN"]), upload.single("file"), uploadNewVersion);
router.get("/:id/versions", protect(["SUPER_ADMIN"]), sopVersions);
router.get("/:id/acks", protect(["SUPER_ADMIN"]), ackReport);
router.put("/:id", protect(["SUPER_ADMIN"]), updateSop);
router.delete("/:id", protect(["SUPER_ADMIN"]), deleteSop);

export default router;
