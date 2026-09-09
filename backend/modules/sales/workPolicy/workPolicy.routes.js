import express from "express";
import {
  getPolicies,
} from "./workPolicy.controller.js";

import { requireSalesAuth } from "../../../middleware/salesAuth.middleware.js";

const router = express.Router();

router.use(requireSalesAuth);

router.get("/", getPolicies);

export default router;