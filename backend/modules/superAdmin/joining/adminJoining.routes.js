import express from "express";
import {
  createJoining,
  getJoinings,
  getJoiningById,
  updateJoining,
  deleteJoining,
} from "./adminJoining.controller.js";


import upload from "../../../middleware/upload.middleware.js";

const router = express.Router();

router.get("/", getJoinings);
router.get("/:id", getJoiningById);

router.post(
  "/",
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "signature", maxCount: 1 },
  ]),
  createJoining
);

router.put(
  "/:id",
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "signature", maxCount: 1 },
  ]),
  updateJoining
);

router.delete("/:id", deleteJoining);

export default router;