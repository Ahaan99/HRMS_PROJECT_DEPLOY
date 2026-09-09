import express from "express";
import { getAllDepartments } from "./hrDepartments.controller.js";
import { hrAuthMiddleware } from "../../../middleware/hrAuth.middleware.js";

const router = express.Router();

router.use(hrAuthMiddleware);

router.get("/", getAllDepartments);

export default router;
