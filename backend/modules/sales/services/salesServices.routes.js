
import express from "express";
import {
  getAllAdminServices,
  createAdminService,
  updateAdminService,
  deleteAdminService,
  generateServicePDF,
} from "./salesServices.controller.js";

import { requireSalesAuth } from "../../../middleware/salesAuth.middleware.js";

const router = express.Router();

router.use(requireSalesAuth);

router.get("/", getAllAdminServices);
router.get("/pdf/:id", generateServicePDF);
router.post("/add", createAdminService);
router.put("/:id", updateAdminService);
router.delete("/:id", deleteAdminService);

export default router;
