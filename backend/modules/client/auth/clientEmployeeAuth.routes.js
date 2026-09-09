import express from "express";
import { loginClientEmployee } from "./clientEmployeeAuth.controller.js";

const router = express.Router();

// POST /api/client/auth/login-employee
router.post("/login-employee", loginClientEmployee);

export default router;