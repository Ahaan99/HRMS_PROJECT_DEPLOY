import express from "express";
import {
  createClientSale,
  getAllClientSales,
  updateClientSale,
  deleteClientSale,
} from "./superAdminSales.controller.js";

import { protect } from "../../../middleware/auth.middleware.js";


const router = express.Router();

// Protect all routes
router.use(protect(["SUPER_ADMIN"]));

router.post("/", createClientSale);
router.get("/", getAllClientSales);
router.put("/:id", updateClientSale);
// router.delete("/:id", deleteClientSale);

export default router;