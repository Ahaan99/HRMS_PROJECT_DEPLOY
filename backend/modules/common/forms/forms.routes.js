import express from "express";
import {
  submitClientForm,
  submitCandidateForm,
  getForms,
  getForm,
  updateForm,
  deleteFormHandler,
} from "./forms.controller.js";
import { upload } from "../../../config/multer.js";

const router = express.Router();

// Public endpoints (no auth required for form submission)
router.post("/client", upload.single("company_logo"), submitClientForm);
router.post("/candidate", upload.single("resume"), submitCandidateForm);

// Protected endpoints (optional - can add auth later)
router.get("/", getForms);
router.get("/:id", getForm);
router.put("/:id", updateForm);
router.delete("/:id", deleteFormHandler);

export default router;
