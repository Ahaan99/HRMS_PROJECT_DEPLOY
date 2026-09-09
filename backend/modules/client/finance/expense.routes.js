import express from "express";
import {
  getClientExpenses,
  addClientExpense,
  getExpenseCategories,
  updateClientExpense,
  deleteClientExpense,
  getExpenseTotal,
  getExpenseByCategory,
  getExpenseByDateRange,
} from "./expense.controller.js";

import { clientAuthMiddleware } from "../../../middleware/clientAuth.middleware.js";

const router = express.Router();

router.use(clientAuthMiddleware);

router.get("/", getClientExpenses);
router.get("/total", getExpenseTotal);
router.get("/by-category", getExpenseByCategory);
router.get("/by-date-range", getExpenseByDateRange);
router.get("/categories", getExpenseCategories);
router.post("/", addClientExpense);
router.post("/add", addClientExpense);
router.put("/:id", updateClientExpense);
router.delete("/:id", deleteClientExpense);

export default router;
