import express from "express";
import { requireSalesAuth } from "../../../middleware/salesAuth.middleware.js";
import {
  getMyClients,
  getPlanCatalog,
  listMine,
  getMine,
  createMine,
  updateMine,
  deleteMine,
  submitMine,
  withdrawMine,
} from "./salesProposals.controller.js";
import { downloadSalesProposalPdf } from "../../proposals/proposalPdf.controller.js";

const router = express.Router();

router.use(requireSalesAuth);

/* static paths MUST be registered before /:id */
router.get("/my-clients", getMyClients);
router.get("/catalog", getPlanCatalog);

router.get("/", listMine);
router.post("/", createMine);
router.get("/:id/pdf", downloadSalesProposalPdf);
router.get("/:id", getMine);
router.put("/:id", updateMine);
router.delete("/:id", deleteMine);
router.patch("/:id/submit", submitMine);
router.patch("/:id/withdraw", withdrawMine);

export default router;
