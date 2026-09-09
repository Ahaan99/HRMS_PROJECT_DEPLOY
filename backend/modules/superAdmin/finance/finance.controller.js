import { db } from "../../../config/db.js";

/* ------------------------------------------------------------------ */
/* Ensure tables exist (runs once at import)                           */
/* ------------------------------------------------------------------ */
const ensureTables = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS finance_revenue (
      id INT AUTO_INCREMENT PRIMARY KEY,
      invoice_id INT NULL,
      client_name VARCHAR(255) NULL,
      invoice_number VARCHAR(100) NULL,
      invoice_date DATE NULL,
      due_date DATE NULL,
      amount DECIMAL(12,2) DEFAULT 0,
      gst DECIMAL(12,2) DEFAULT 0,
      status VARCHAR(50) DEFAULT 'Pending',
      description TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS finance_expenses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      category VARCHAR(100) NULL,
      sub_category VARCHAR(100) NULL,
      employee_id INT NULL,
      employee_name VARCHAR(255) NULL,
      amount DECIMAL(12,2) DEFAULT 0,
      expense_date DATE NULL,
      description TEXT NULL,
      payment_method VARCHAR(50) DEFAULT 'cash',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
};

ensureTables().catch((err) =>
  console.error("finance tables init error:", err.message)
);

/* ------------------------------------------------------------------ */
/* REVENUE                                                             */
/* ------------------------------------------------------------------ */
export const getRevenue = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM finance_revenue ORDER BY invoice_date DESC, id DESC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const addRevenue = async (req, res) => {
  try {
    const {
      invoice_id,
      client_name,
      invoice_number,
      invoice_date,
      due_date,
      amount,
      gst,
      status,
      description,
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO finance_revenue
        (invoice_id, client_name, invoice_number, invoice_date, due_date, amount, gst, status, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invoice_id || null,
        client_name || null,
        invoice_number || null,
        invoice_date || null,
        due_date || null,
        Number(amount) || 0,
        Number(gst) || 0,
        status || "Pending",
        description || null,
      ]
    );

    res.json({ success: true, message: "Revenue added", id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateRevenue = async (req, res) => {
  try {
    const {
      invoice_id,
      client_name,
      invoice_number,
      invoice_date,
      due_date,
      amount,
      gst,
      status,
      description,
    } = req.body;

    await db.query(
      `UPDATE finance_revenue SET
        invoice_id = ?, client_name = ?, invoice_number = ?, invoice_date = ?,
        due_date = ?, amount = ?, gst = ?, status = ?, description = ?
       WHERE id = ?`,
      [
        invoice_id || null,
        client_name || null,
        invoice_number || null,
        invoice_date || null,
        due_date || null,
        Number(amount) || 0,
        Number(gst) || 0,
        status || "Pending",
        description || null,
        req.params.id,
      ]
    );

    res.json({ success: true, message: "Revenue updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteRevenue = async (req, res) => {
  try {
    await db.query("DELETE FROM finance_revenue WHERE id = ?", [
      req.params.id,
    ]);
    res.json({ success: true, message: "Revenue deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ------------------------------------------------------------------ */
/* EXPENSES                                                            */
/* ------------------------------------------------------------------ */
export const getExpenses = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM finance_expenses ORDER BY expense_date DESC, id DESC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const addExpense = async (req, res) => {
  try {
    const {
      category,
      sub_category,
      employee_id,
      employee_name,
      amount,
      expense_date,
      description,
      payment_method,
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO finance_expenses
        (category, sub_category, employee_id, employee_name, amount, expense_date, description, payment_method)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        category || null,
        sub_category || null,
        employee_id || null,
        employee_name || null,
        Number(amount) || 0,
        expense_date || null,
        description || null,
        payment_method || "cash",
      ]
    );

    res.json({ success: true, message: "Expense added", id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateExpense = async (req, res) => {
  try {
    const {
      category,
      sub_category,
      employee_id,
      employee_name,
      amount,
      expense_date,
      description,
      payment_method,
    } = req.body;

    await db.query(
      `UPDATE finance_expenses SET
        category = ?, sub_category = ?, employee_id = ?, employee_name = ?,
        amount = ?, expense_date = ?, description = ?, payment_method = ?
       WHERE id = ?`,
      [
        category || null,
        sub_category || null,
        employee_id || null,
        employee_name || null,
        Number(amount) || 0,
        expense_date || null,
        description || null,
        payment_method || "cash",
        req.params.id,
      ]
    );

    res.json({ success: true, message: "Expense updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    await db.query("DELETE FROM finance_expenses WHERE id = ?", [
      req.params.id,
    ]);
    res.json({ success: true, message: "Expense deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ------------------------------------------------------------------ */
/* SUPPORTING LISTS                                                    */
/* ------------------------------------------------------------------ */
export const getInvoices = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, invoice_no, client_name, invoice_date, taxable_amount,
              cgst, sgst, total_amount
       FROM invoices ORDER BY invoice_date DESC, id DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getEmployeesForExpense = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, name, employeeCode FROM employees
       WHERE isActive = 1 ORDER BY name`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
