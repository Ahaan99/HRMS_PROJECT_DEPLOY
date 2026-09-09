import express from "express";
import { salesLogin } from "./salesAuth.controller.js";

const router = express.Router();

router.post("/login", salesLogin);

export default router;