import express from "express";
import { clientAuthMiddleware } from "../../../middleware/clientAuth.middleware.js";
import {
  createLeave, listLeaves, decideLeave,
  listOfferTemplates, listOfferLetters, generateClientOffer,
} from "./leaveOffer.controller.js";

const router = express.Router();
router.use(clientAuthMiddleware);

router.get("/leaves", listLeaves);
router.post("/leaves", createLeave);
router.patch("/leaves/:id", decideLeave);

router.get("/offers/templates", listOfferTemplates);
router.get("/offers", listOfferLetters);
router.post("/offers/generate", generateClientOffer);

export default router;
