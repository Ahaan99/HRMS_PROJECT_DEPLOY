import express from "express";
import {
  createClient,
  getAllClients,
  getClientProfile,
  toggleClientFeature,
  getFeatureMatrix,
  bulkToggleClientFeatures,
  updateClient,
  deleteClient,
  toggleClientHR,
} from "./superAdminClients.controller.js";


import { protect } from "../../../middleware/auth.middleware.js";

const router = express.Router();


/* =====================================================
CLIENT MANAGEMENT (Super Admin & Manager)
===================================================== */

router.use(protect(["SUPER_ADMIN", "MANAGER"]));

// Create client
router.post("/", createClient);

// Get all clients
router.get("/", getAllClients);

// Master Control: full feature matrix (must be before /:id)
router.get("/features/matrix", getFeatureMatrix);

// Master Control: bulk toggle all features for a client
router.patch("/feature/toggle-bulk", bulkToggleClientFeatures);

// Assign / unassign an HR to a client (toggle) — used by the Client Profile drawer
router.patch("/assign-hr", toggleClientHR);

// Get single client profile (control center)
router.get("/:id", getClientProfile);

// Update client basic info
router.put("/:id", updateClient);

// Delete client
router.delete("/:id", deleteClient);

// Toggle client feature
router.patch("/feature/toggle", toggleClientFeature);

export default router;