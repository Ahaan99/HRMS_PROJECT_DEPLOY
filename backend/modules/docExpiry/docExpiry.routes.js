import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import {
  listDocs,
  createDoc,
  updateDoc,
  deleteDoc,
  runAlerts,
} from "./docExpiry.controller.js";

const router = express.Router();
const admin = protect(["SUPER_ADMIN", "MANAGER", "hr"]);

router.get("/", admin, listDocs);
router.post("/", admin, createDoc);
router.patch("/:id", admin, updateDoc);
router.delete("/:id", admin, deleteDoc);
router.post("/run-alerts", admin, runAlerts);

export default router;
