import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import { downloadProposalPdf } from "./proposalPdf.controller.js";
import {
  createProposal,
  listProposals,
  getProposal,
  updateProposal,
  updateProposalStatus,
  deleteProposal,
  getPlanCatalog,
  approveProposal,
  returnProposal,
} from "./proposals.controller.js";

const router = express.Router();

router.use(protect(["SUPER_ADMIN"]));

router.post("/", createProposal);
router.get("/", listProposals);
/* /catalog MUST be registered before /:id */
router.get("/catalog", getPlanCatalog);
router.get("/:id/pdf", downloadProposalPdf);
router.get("/:id", getProposal);
router.put("/:id", updateProposal);
router.put("/:id/status", updateProposalStatus);
/* review of sales-rep submissions */
router.patch("/:id/approve", approveProposal);
router.patch("/:id/return", returnProposal);
router.delete("/:id", deleteProposal);

export default router;
