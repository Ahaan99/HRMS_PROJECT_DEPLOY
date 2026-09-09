import express from "express";
import { getCashFlow, saveCashFlow} from "./cashflow.controller.js";
import { protect } from "../../../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect(["SUPER_ADMIN"]));

router.get("/", getCashFlow);
router.post("/", saveCashFlow);

export default router;
