import express from "express";
import { clientAuthMiddleware } from "../../middleware/clientAuth.middleware.js";
import {
  listMyProposals,
  getMyProposal,
  respondToProposal,
} from "./proposals.controller.js";
import { downloadMyProposalPdf } from "./proposalPdf.controller.js";

const router = express.Router();

router.use(clientAuthMiddleware);

router.get("/", listMyProposals);
router.get("/:id/pdf", downloadMyProposalPdf);
router.get("/:id", getMyProposal);
router.post("/:id/respond", respondToProposal);

export default router;
