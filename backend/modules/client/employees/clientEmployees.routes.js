import express from "express";
import * as ctrl from "./clientEmployees.controller.js";
import { clientAuthMiddleware } from "../../../middleware/clientAuth.middleware.js";

const router = express.Router();

router.use(clientAuthMiddleware);

router.post("/", ctrl.createEmployee);
router.get("/", ctrl.listEmployees);
router.put("/:id", ctrl.updateEmployee);
router.patch("/:id/toggle", ctrl.toggleEmployee);
router.delete("/:id", ctrl.deleteEmployee);

export default router;