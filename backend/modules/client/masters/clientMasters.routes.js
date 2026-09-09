import express from "express";
import { clientAuthMiddleware } from "../../../middleware/clientAuth.middleware.js";
import {
  getDepartments,
  getDesignations,
  getStatuses,
} from "./clientMasters.controller.js";

const router = express.Router();

// 🔐 protect all
router.use(clientAuthMiddleware);

// 📦 masters
router.get("/departments", getDepartments);
router.get("/designations", getDesignations);
router.get("/statuses", getStatuses);

export default router;