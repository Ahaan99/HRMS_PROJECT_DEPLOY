import express from "express";

import {
  getRevenue,
  createRevenue,
  updateRevenue,
  deleteRevenue,
  getInvoicesForRevenue,

  getExpenses,
  getEmployeesForExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  

} from "../controllers/fnanceController.js";
import {protect} from "../middleware/auth.middleware.js"

const router = express.Router();

// Revenue
router.get("/revenue", protect(), getRevenue);
router.get("/invoices",protect(), getInvoicesForRevenue);
router.post("/revenue",protect(), createRevenue);
router.put("/revenue/:id", protect(), updateRevenue);
router.delete("/revenue/:id",protect(), deleteRevenue);

// Expenses
router.get("/expenses",protect(), getExpenses);
router.get("/employees-expense", protect(), getEmployeesForExpense);
router.post("/expenses",protect(), createExpense);
router.put("/expenses/:id", protect(), updateExpense);
router.delete("/expenses/:id", protect(), deleteExpense);


export default router;