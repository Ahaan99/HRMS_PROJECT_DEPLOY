import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import { checkIn, checkOut, listVisitors } from "./visitors.controller.js";

const router = express.Router();
const staff = protect(["SUPER_ADMIN", "MANAGER", "hr"]);

router.get("/", staff, listVisitors);
router.post("/", staff, checkIn);
router.patch("/:id/checkout", staff, checkOut);

export default router;
