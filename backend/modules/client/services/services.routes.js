import express from "express";
import {
  getAllServices,
  createService,
  updateService,
  deleteService,
} from "./services.controller.js";

import auditMiddleware from "../../../middleware/audit.middleware.js";
import { clientAuthMiddleware } from "../../../middleware/clientAuth.middleware.js";


// import { clientUnifiedAuthMiddleware } from "../../../middleware/clientUnifiedAuth.middleware.js";

// const router = express.Router();

// // ✅ apply ONCE
// router.use(clientUnifiedAuthMiddleware);

const router = express.Router();

router.use(clientAuthMiddleware);

// GET
router.get("/", getAllServices);

// POST
router.post("/add", auditMiddleware("ADD_SERVICE"), createService);

// PUT
router.put("/:id", auditMiddleware("UPDATE_SERVICE"), updateService);

// DELETE
router.delete("/:id", auditMiddleware("DELETE_SERVICE"), deleteService);

export default router;