import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import {
  getDocTypes,
  generateDocument,
  listDocuments,
  deleteDocument,
  emailDocument,
  signDocument,
} from "./documents.controller.js";

const router = express.Router();

router.use(protect(["SUPER_ADMIN"]));

router.get("/types", getDocTypes);
router.post("/generate", generateDocument);
router.get("/", listDocuments);
router.delete("/:id", deleteDocument);
router.post("/:id/email", emailDocument);
router.post("/:id/sign", signDocument);

export default router;
