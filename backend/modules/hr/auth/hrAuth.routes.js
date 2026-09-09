import express from "express";
import { loginHR } from "./hrAuth.controller.js";

const router = express.Router();

router.post("/login", loginHR);

export default router;