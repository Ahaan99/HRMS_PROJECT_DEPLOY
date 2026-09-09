import { db } from "../../../config/db.js";
import PDFDocument from "pdfkit";

import {
  upsertPayrollService,
  getPayrollListService,
  deletePayrollService,
} from "./clientPayroll.service.js";

const getClientId = async (client_code) => {
  const [rows] = await db.query(
    `SELECT id FROM clients WHERE client_code = ? LIMIT 1`,
    [client_code],
  );

  if (!rows.length) throw new Error("Client not found");

  return rows[0].id;
};

// CREATE / UPDATE
export const upsertPayrollController = async (req, res) => {
  try {
    const client_id = await getClientId(req.client.client_code);
    const result = await upsertPayrollService(client_id, req.body);

    res.json({
      success: true,
      message: "Payroll saved successfully",
      data: result,
    });
  } catch (err) {
    console.error("Payroll upsert error:", err);
    const status = err.statusCode || 500;
    res.status(status).json({
      success: false,
      message: err.statusCode ? err.message : "Server error",
    });
  }
};

// LIST
export const getPayrollListController = async (req, res) => {
  try {
    const client_id = await getClientId(req.client.client_code);
    const rows = await getPayrollListService(client_id);

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("Payroll list error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE
export const deletePayrollController = async (req, res) => {
  try {
    const client_id = await getClientId(req.client.client_code);
    const result = await deletePayrollService(client_id, req.params.id);

    res.json({
      success: true,
      message: "Payroll deleted",
      data: result,
    });
  } catch (err) {
    console.error("Payroll delete error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ==============================
// GET PAYROLL MONTH
// ==============================

export const getPayrollMonthsController = async (req, res) => {
  try {
    const client_id = await getClientId(req.client.client_code);
    const { employeeCode } = req.params;

    // ✅ STEP 1 — get employee id
    const [[emp]] = await db.query(
      `
      SELECT id
      FROM client_employees
      WHERE client_id = ?
        AND employeeCode = ?
      LIMIT 1
      `,
      [client_id, employeeCode],
    );

    if (!emp) {
      return res.json({ success: true, data: [] });
    }

    // ✅ STEP 2 — get months using employee_id
    const [rows] = await db.query(
      `
      SELECT DISTINCT payroll_month
      FROM client_payroll
      WHERE client_id = ?
        AND employee_id = ?
      ORDER BY payroll_month DESC
      `,
      [client_id, emp.id],
    );

    const months = rows.map((r) => r.payroll_month);

    res.json({
      success: true,
      data: months,
    });
  } catch (err) {
    console.error("Payroll months error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ==============================
// GENERATE PAYROLL (basic)
// ==============================
export const generatePayrollController = async (req, res) => {
  try {
    return res.json({
      success: true,
      message: "Payroll generation ready",
    });
  } catch (err) {
    console.error("Generate payroll error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ==============================
// DOWNLOAD EMPLOYEE PDF
// ==============================
export const downloadPayrollPdfController = async (req, res) => {
  try {
    const client_id = await getClientId(req.client.client_code);
    const { employeeCode } = req.params;
    const { month } = req.query;

    console.log("params:", req.params);
    console.log("query:", req.query);
    console.log("client:", req.client);

    // 🔥 get company details
    const [clientRows] = await db.query(
      `SELECT company_name, business_address
      FROM clients
      WHERE id = ?`,
      [client_id],
    );

    const companyName = clientRows?.[0]?.company_name || "Company Name";
    const companyAddress =
      clientRows?.[0]?.business_address || "Company Address";

    // 🔍 get employee
    const [[emp]] = await db.query(
      `
      SELECT id, name
      FROM client_employees
      WHERE client_id = ?
        AND employeeCode = ?
      LIMIT 1
      `,
      [client_id, employeeCode],
    );

    if (!emp) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // 🔍 get payroll
    const [rows] = await db.query(
      `
      SELECT *
      FROM client_payroll
      WHERE client_id = ?
        AND employee_id = ?
        AND payroll_month = ?
      LIMIT 1
      `,
      [client_id, emp.id, month],
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "Payroll not found for this month",
      });
    }

    const payroll = rows[0];

    // ================= PDF =================
    const doc = new PDFDocument({ margin: 40, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=payroll-${employeeCode}.pdf`,
    );

    doc.pipe(res);

    // helpers
    const safe = (v) => (v === null || v === undefined ? "" : v);
    const money = (v) => Number(v || 0).toFixed(2);

    // ================= HEADER =================
    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .text(companyName, { align: "center" });

    doc
      .fontSize(9)
      .font("Helvetica")
      .text(companyAddress, { align: "center" });

    doc.moveDown(1.5);

    // ================= EMPLOYEE INFO BOX =================
    const startX = 40;
    let y = doc.y;
    const boxWidth = 515;
    const rowHeight = 22;

    // outer box
    doc.rect(startX, y, boxWidth, 90).stroke();

    // left column
    doc.fontSize(10).font("Helvetica-Bold");

    doc.text("Employee Name:", startX + 10, y + 10);
    doc.text("Employee Code:", startX + 10, y + 32);
    doc.text("Month:", startX + 10, y + 54);

    // right values
    doc.font("Helvetica");

    doc.text(safe(emp.name), startX + 150, y + 10);
    doc.text(employeeCode, startX + 150, y + 32);
    doc.text(month, startX + 150, y + 54);

    doc.moveDown(5);

    // ================= TABLE HEADER =================
    y = doc.y;

    doc.rect(startX, y, boxWidth, 25).stroke();

    doc.font("Helvetica-Bold").fontSize(11);

    doc.text("Particulars", startX + 10, y + 7);
    doc.text("Earnings (+)", startX + 280, y + 7);
    doc.text("Deductions (-)", startX + 420, y + 7);

    doc.moveDown(1.5);

    // ================= TABLE ROW HELPER =================
    const drawRow = (label, earn, deduct) => {
      const rowY = doc.y;

      doc.rect(startX, rowY, boxWidth, 22).stroke();

      doc.font("Helvetica").fontSize(10);

      doc.text(label, startX + 10, rowY + 6);

      if (earn !== "") {
        doc.text(money(earn), startX + 300, rowY + 6, {
          width: 100,
          align: "right",
        });
      }

      if (deduct !== "") {
        doc.text(money(deduct), startX + 440, rowY + 6, {
          width: 60,
          align: "right",
        });
      }

      doc.moveDown(1.1);
    };

    // ================= EARNINGS =================
    doc.font("Helvetica-Bold").text("Salary Breakups");
    doc.moveDown(0.3);

    drawRow("Basic", payroll.basic_salary, "");
    drawRow("HRA", payroll.hra, "");
    drawRow("TA", payroll.ta, "");
    drawRow("DA", payroll.da, "");
    drawRow("Overtime", payroll.overtime_amount, "");

    // ================= DEDUCTIONS =================
    doc.moveDown(0.5);
    doc.font("Helvetica-Bold").text("Deductions");
    doc.moveDown(0.3);

    drawRow("PF", "", payroll.pf);
    drawRow("ESIC", "", payroll.esic);

    // ================= SUMMARY BOX =================
    doc.moveDown(1);

    const sumY = doc.y;

    doc.rect(startX, sumY, boxWidth, 60).stroke();

    doc.font("Helvetica-Bold").fontSize(11);

    doc.text("Salary Summary", startX + 10, sumY + 8);

    doc.font("Helvetica");

    doc.text(
      `Gross Salary: ${money(payroll.gross_salary)}`,
      startX + 10,
      sumY + 28,
    );

    doc.text(
      `Net Salary: ${money(payroll.net_salary)}`,
      startX + 300,
      sumY + 28,
    );

    // ================= FOOTER =================
    doc.moveDown(4);

    doc
      .fontSize(9)
      .fillColor("gray")
      .text("This is a system generated payslip.", {
        align: "center",
      });

    doc.end();
  } catch (err) {
    console.error("PDF error:", err);
    res.status(500).json({ success: false, message: `Server error: ${err}`});
  }
};
