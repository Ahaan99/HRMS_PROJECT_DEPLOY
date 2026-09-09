import { db } from "../../../config/db.js";
import QRCode from "qrcode";

/* ------------------------------------------------------------------ */
/* Schema upgrades (idempotent)                                        */
/* ------------------------------------------------------------------ */
const addColumnIfMissing = async (table, column, definition) => {
  const [[row]] = await db.query(
    `SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  if (!row.c) await db.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
};

const ensureSchema = async () => {
  await addColumnIfMissing("invoices", "status", "VARCHAR(30) DEFAULT 'Pending'");
  await addColumnIfMissing("invoices", "due_date", "DATE NULL");
  await addColumnIfMissing("invoices", "paid_amount", "DECIMAL(12,2) DEFAULT 0");
  await addColumnIfMissing("invoices", "paid_date", "DATE NULL");
  await addColumnIfMissing("invoices", "receipt_path", "VARCHAR(255) NULL");
  await addColumnIfMissing("invoices", "upi_id", "VARCHAR(120) NULL");

  await db.query(`
    CREATE TABLE IF NOT EXISTS credit_debit_notes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      invoice_id INT NOT NULL,
      note_type ENUM('Credit','Debit') NOT NULL,
      note_no VARCHAR(50) NOT NULL,
      amount DECIMAL(12,2) NOT NULL,
      reason VARCHAR(255) NULL,
      note_date DATE NULL,
      created_by VARCHAR(120) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};
ensureSchema().catch((e) => console.error("invoicePlus schema error:", e.message));

/* ------------------------------------------------------------------ */
/* Status tracking                                                     */
/* ------------------------------------------------------------------ */
const VALID_STATUSES = ["Pending", "Sent", "Partially Paid", "Paid", "Overdue", "Cancelled"];

export const updateInvoiceStatus = async (req, res) => {
  try {
    const { status, paid_amount, due_date, upi_id } = req.body;
    if (status && !VALID_STATUSES.includes(status))
      return res.status(400).json({ success: false, message: "Invalid status" });

    const [[inv]] = await db.query("SELECT * FROM invoices WHERE id = ?", [req.params.id]);
    if (!inv) return res.status(404).json({ success: false, message: "Invoice not found" });

    const fields = [];
    const params = [];
    if (status) {
      fields.push("status = ?");
      params.push(status);
      if (status === "Paid") {
        fields.push("paid_date = CURDATE()", "paid_amount = ?");
        params.push(
          paid_amount !== undefined ? Number(paid_amount) : Number(inv.total_amount)
        );
      }
    }
    if (paid_amount !== undefined && status !== "Paid") {
      fields.push("paid_amount = ?");
      params.push(Number(paid_amount) || 0);
    }
    if (due_date !== undefined) {
      fields.push("due_date = ?");
      params.push(due_date || null);
    }
    if (upi_id !== undefined) {
      fields.push("upi_id = ?");
      params.push(upi_id || null);
    }
    if (!fields.length)
      return res.status(400).json({ success: false, message: "Nothing to update" });

    params.push(req.params.id);
    await db.query(`UPDATE invoices SET ${fields.join(", ")} WHERE id = ?`, params);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

/* ------------------------------------------------------------------ */
/* Due-date alerts (auto-marks overdue)                                */
/* ------------------------------------------------------------------ */
export const dueAlerts = async (req, res) => {
  try {
    // Auto-mark overdue
    await db.query(
      `UPDATE invoices SET status = 'Overdue'
       WHERE due_date IS NOT NULL AND due_date < CURDATE()
         AND status NOT IN ('Paid','Cancelled','Overdue')`
    );

    const [overdue] = await db.query(
      `SELECT id, invoice_no, client_name, total_amount, paid_amount, due_date, status,
              DATEDIFF(CURDATE(), due_date) AS days_overdue
       FROM invoices
       WHERE status = 'Overdue'
       ORDER BY due_date`
    );

    const [dueSoon] = await db.query(
      `SELECT id, invoice_no, client_name, total_amount, paid_amount, due_date, status,
              DATEDIFF(due_date, CURDATE()) AS days_left
       FROM invoices
       WHERE due_date IS NOT NULL
         AND due_date >= CURDATE()
         AND due_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
         AND status NOT IN ('Paid','Cancelled')
       ORDER BY due_date`
    );

    res.json({ overdue, dueSoon });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

/* ------------------------------------------------------------------ */
/* Payment receipt upload                                              */
/* ------------------------------------------------------------------ */
export const uploadReceipt = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ success: false, message: "No file uploaded" });

    const relPath = `others/${req.file.filename}`;
    await db.query("UPDATE invoices SET receipt_path = ? WHERE id = ?", [
      relPath,
      req.params.id,
    ]);
    res.json({ success: true, file: `/api/uploads/${relPath}` });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

/* ------------------------------------------------------------------ */
/* UPI payment QR                                                      */
/* ------------------------------------------------------------------ */
export const paymentQr = async (req, res) => {
  try {
    const [[inv]] = await db.query("SELECT * FROM invoices WHERE id = ?", [req.params.id]);
    if (!inv) return res.status(404).json({ success: false, message: "Invoice not found" });

    const [[settings]] = await db.query("SELECT * FROM company_settings LIMIT 1");
    const upi = inv.upi_id || req.query.upi;
    if (!upi)
      return res.status(400).json({
        success: false,
        message: "No UPI ID set on this invoice. Update the invoice with a UPI ID first.",
      });

    const payee = encodeURIComponent(settings?.company_name || "Company");
    const balanceDue = Number(inv.total_amount) - Number(inv.paid_amount || 0);
    const amount = balanceDue > 0 ? balanceDue.toFixed(2) : Number(inv.total_amount).toFixed(2);
    const upiString = `upi://pay?pa=${upi}&pn=${payee}&am=${amount}&cu=INR&tn=${encodeURIComponent(
      "Invoice " + inv.invoice_no
    )}`;

    const qrDataUrl = await QRCode.toDataURL(upiString, { width: 300, margin: 1 });
    res.json({
      success: true,
      qr: qrDataUrl,
      upiString,
      amount,
      bank: settings
        ? {
            bank_name: settings.bank_name,
            account_number: settings.account_number,
            ifsc: settings.ifsc,
            branch: settings.branch,
          }
        : null,
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

/* ------------------------------------------------------------------ */
/* Credit / Debit notes                                                */
/* ------------------------------------------------------------------ */
export const addNote = async (req, res) => {
  try {
    const { note_type, amount, reason, note_date } = req.body;
    if (!["Credit", "Debit"].includes(note_type))
      return res.status(400).json({ success: false, message: "note_type must be Credit or Debit" });
    if (!amount || Number(amount) <= 0)
      return res.status(400).json({ success: false, message: "Valid amount required" });

    const [[inv]] = await db.query("SELECT id FROM invoices WHERE id = ?", [req.params.id]);
    if (!inv) return res.status(404).json({ success: false, message: "Invoice not found" });

    const prefix = note_type === "Credit" ? "CN" : "DN";
    const [[{ c }]] = await db.query(
      "SELECT COUNT(*) AS c FROM credit_debit_notes WHERE note_type = ?",
      [note_type]
    );
    const note_no = `${prefix}-${String(c + 1).padStart(4, "0")}`;

    const [r] = await db.query(
      `INSERT INTO credit_debit_notes (invoice_id, note_type, note_no, amount, reason, note_date, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.params.id,
        note_type,
        note_no,
        Number(amount),
        reason || null,
        note_date || new Date().toISOString().slice(0, 10),
        req.user.name || "Admin",
      ]
    );
    res.json({ success: true, id: r.insertId, note_no });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const getInvoiceNotes = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM credit_debit_notes WHERE invoice_id = ? ORDER BY created_at DESC",
      [req.params.id]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const getAllNotes = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT n.*, i.invoice_no, i.client_name
       FROM credit_debit_notes n
       LEFT JOIN invoices i ON i.id = n.invoice_id
       ORDER BY n.created_at DESC`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const deleteNote = async (req, res) => {
  try {
    await db.query("DELETE FROM credit_debit_notes WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
