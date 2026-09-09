import express from "express";
import { protect } from "../../../middleware/auth.middleware.js";
import {
  getRevenue,
  addRevenue,
  updateRevenue,
  deleteRevenue,
  getExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  getInvoices,
  getEmployeesForExpense,
} from "./finance.controller.js";

const router = express.Router();

router.use(protect(["SUPER_ADMIN"]));

// Revenue
router.get("/revenue", getRevenue);
router.post("/revenue", addRevenue);
router.put("/revenue/:id", updateRevenue);
router.delete("/revenue/:id", deleteRevenue);

// Expenses
router.get("/expenses", getExpenses);
router.post("/expenses", addExpense);
router.put("/expenses/:id", updateExpense);
router.delete("/expenses/:id", deleteExpense);

// Supporting lists
router.get("/invoices", getInvoices);
router.get("/employees-expense", getEmployeesForExpense);

export default router;
