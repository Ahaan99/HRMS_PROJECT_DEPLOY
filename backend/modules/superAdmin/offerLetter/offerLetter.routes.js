import express from "express";
import {
  generateOfferLetterPdfController,
  previewOfferLetterController,
  getOfferLetterTemplatesController,
  saveOfferLetterTemplateController,
  updateOfferLetterTemplateController,
  deleteOfferLetterTemplateController,
  getOfferLettersController,
  deleteOfferLetterController
} from "./offerLetter.controller.js";
import { protect } from "../../../middleware/auth.middleware.js";

const router = express.Router();

// Offer letters are a Super Admin portal feature (admin token family).
router.use(protect(["SUPER_ADMIN", "MANAGER", "TL"]));

router.get("/test", (req, res) => {
  res.json({ success: true, message: "Offer Letter Route Working" });
});

router.post("/generate", generateOfferLetterPdfController);
router.post("/preview", previewOfferLetterController);

router.get("/templates", getOfferLetterTemplatesController);
router.post("/templates", saveOfferLetterTemplateController);
router.put("/templates/:id", updateOfferLetterTemplateController);
router.delete("/templates/:id", deleteOfferLetterTemplateController);

router.get("/", getOfferLettersController);
router.delete("/:id", deleteOfferLetterController);

export default router;
