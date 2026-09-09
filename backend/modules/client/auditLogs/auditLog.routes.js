import express from "express";
import { getLogs } from "./auditLog.controller.js";
import {clientAuthMiddleware} from "../../../middleware/clientAuth.middleware.js";

const router = express.Router();

router.use(clientAuthMiddleware);

router.get("/", getLogs);

export default router;