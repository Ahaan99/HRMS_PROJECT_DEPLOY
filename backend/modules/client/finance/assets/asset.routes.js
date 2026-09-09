import express from "express";
import {
  getAllAssets,
  getTotalAssetValue,
  getAssetsByStatus,
  createAsset,
  updateAsset,
  updateAssetStatus,
  deleteAsset,
} from "./asset.controller.js";
import auditMiddleware from "../../../../middleware/audit.middleware.js";

import { clientAuthMiddleware } from "../../../../middleware/clientAuth.middleware.js";

const router = express.Router();

// 🔒 protect all routes
router.use(clientAuthMiddleware);

// GET
router.get("/", getAllAssets);
router.get("/total-value", getTotalAssetValue);
router.get("/by-status/:status", getAssetsByStatus);

// POST
router.post("/add", auditMiddleware("ADD_ASSET"), createAsset);

// PUT
router.put("/:id", auditMiddleware("UPDATE_ASSET"), updateAsset);
router.put("/status/:id", updateAssetStatus);

// DELETE
router.delete("/:id", auditMiddleware("DELETE_ASSET"), deleteAsset);

export default router;
