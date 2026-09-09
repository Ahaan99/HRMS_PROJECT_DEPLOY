import express from "express";
import { protect } from "../../../middleware/auth.middleware.js";
import {
  createExpense,
  getExpenses,
  getExpenseCategories,
} from "./expense.controller.js";

const router = express.Router();

router.use(protect(["SUPER_ADMIN"]));

router.post("/", createExpense);
router.get("/", getExpenses);
router.get("/categories", getExpenseCategories);

export default router;