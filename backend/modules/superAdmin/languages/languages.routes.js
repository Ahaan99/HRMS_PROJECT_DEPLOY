import express from "express";
import {
  createLanguage,
  getLanguages,
} from "./languages.controller.js";
import { protect } from "../../../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect(["SUPER_ADMIN", "hr"]));

router.post("/", createLanguage);
router.get("/", getLanguages);

export default router;