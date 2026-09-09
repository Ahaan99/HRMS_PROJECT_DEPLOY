import express from "express";

import {
  createClientAgreement,
  getAllClientAgreements,
  deleteClientAgreement,
  generateAgreementPDF,
  generateProfessionalAgreement,
} from "./clientAgreements.controller.js";




import upload from "../../../middleware/upload.middleware.js";

import { protect } from "../../../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect(["SUPER_ADMIN"]));

/* =========================================
CREATE AGREEMENT

========================================= */
router.post(
  "/",
  upload.fields([
    {
      name: "agreementPdf",
      maxCount: 1,
    },
  ]),
  createClientAgreement
);



/* =========================================
GET ALL AGREEMENTS
========================================= */
router.get("/", getAllClientAgreements);

/* =========================================
DELETE AGREEMENT
========================================= */
router.delete("/:id", deleteClientAgreement);

router.post(
  "/generate",
  upload.none(), // 👈 THIS IS THE FIX
  generateAgreementPDF
);

router.post("/generate-professional", upload.none(), generateProfessionalAgreement);

export default router;