import express from "express";
import { requestOtp, verifyOtp } from "./otpAuth.controller.js";

const router = express.Router();

/* Public passwordless login for HR / Employee / Client / Sales portals */
router.post("/request", requestOtp);
router.post("/verify", verifyOtp);

export default router;
