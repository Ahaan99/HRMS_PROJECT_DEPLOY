import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import upload from "../../middleware/upload.middleware.js";
import { listDocs, uploadDoc, reviewDoc, deleteDoc } from "./verification.controller.js";

const router = express.Router();
const admin = protect(["SUPER_ADMIN"]);

router.get("/", admin, listDocs);
router.post("/", admin, upload.single("file"), uploadDoc);
router.put("/:id/review", admin, reviewDoc);
router.delete("/:id", admin, deleteDoc);

export default router;
