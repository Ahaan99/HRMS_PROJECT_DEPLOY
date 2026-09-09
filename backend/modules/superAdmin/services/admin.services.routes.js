import express from "express";
import {
  getAllAdminServices,
  createAdminService,
  updateAdminService,
  deleteAdminService,
  generateServicePDF,
} from "./admin.services.controller.js";

import { protect } from "../../../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect(["SUPER_ADMIN", "TL"]));

router.get("/", getAllAdminServices);
router.get("/pdf/:id", generateServicePDF);
router.post("/add", createAdminService);
router.put("/:id", updateAdminService);
router.delete("/:id", deleteAdminService);

export default router;