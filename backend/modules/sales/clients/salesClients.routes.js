import express from "express";

import {
  createSalesClient,
} from "./salesClients.controller.js";

import {
  requireSalesAuth,
} from "../../../middleware/salesAuth.middleware.js";

const router = express.Router();

router.use(requireSalesAuth);

/* =========================================
CREATE CLIENT
========================================= */
router.post("/", createSalesClient);

export default router;
