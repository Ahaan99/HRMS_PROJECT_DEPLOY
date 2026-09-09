import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import { chat } from "./assistant.controller.js";

const router = express.Router();

/* Any authenticated user may talk to the assistant */
router.post("/chat", protect([]), chat);

export default router;
