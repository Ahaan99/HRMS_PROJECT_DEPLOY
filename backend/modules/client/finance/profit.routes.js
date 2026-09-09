import express from "express";

import {getClientProfitSummary} from "./profit.controller.js"

import { clientAuthMiddleware } from "../../../middleware/clientAuth.middleware.js";



const router = express.Router();

router.use(clientAuthMiddleware);

router.get("/", getClientProfitSummary);

export default router;