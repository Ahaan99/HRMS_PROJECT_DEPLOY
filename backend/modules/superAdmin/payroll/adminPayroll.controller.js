import { db } from "../../../config/db.js";
import PDFDocument from "pdfkit";
import { runAutoPayroll } from "./adminPayroll.service.js";
import { COMPANY, LOGO_PATH } from "../../../config/branding.js";

const num = (v) => Number(v || 0);

// ======================
// GET ALL PAYROLL
// ======================
export const getAllPayrollController = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        ap.id,
        ap.payroll_month,
        ap.gross_salary,
        ap.net_salary,
        e.employeeCode,
        e.name
      FROM admin_payroll ap
      JOIN employees e ON e.id = ap.employee_id
      ORDER BY ap.created_at DESC
    `);

    res.json({ success: true, payroll: rows });
  } catch (err) {
    console.error(`Payroll fetch error`);
    res.status(500).json({ success: false, message: `Server error ${err}` });
  }
};

// ======================
// ADD PAYROLL
// ======================
export const addPayrollController = async (req, res) => {
  console.log("REQ BODY:", req.body);
  try {
    const {
      employeeCode,
      payroll_month,
      hra,
      ta,
      da,
      overtime_amount,
      pf,
      esic,
    } = req.body;

    if (!employeeCode || !payroll_month) {
      return res.status(400).json({
        success: false,
        message: "employeeCode and payroll_month required",
      });
    }

    const [[employee]] = await db.query(
      `SELECT id, salary FROM employees WHERE employeeCode = ? LIMIT 1`,
      [employeeCode],
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const basic_salary = num(employee.salary);
    console.log( basic_salary, num(hra), num(ta), num(da), num(overtime_amount));
    const gross_salary =
      basic_salary + num(hra) + num(ta) + num(da) + num(overtime_amount);

    const net_salary = gross_salary - num(pf) - num(esic);

    await db.query(
      `
      INSERT INTO admin_payroll (
        employee_id,
        payroll_month,
        basic_salary,
        hra,
        ta,
        da,
        overtime_amount,
        gross_salary,
        pf,
        esic,
        net_salary
      )
      VALUES (?,?,?,?,?,?,?,?,?,?,?)
      `,
      [
        employee.id,
        payroll_month,
        basic_salary,
        num(hra),
        num(ta),
        num(da),
        num(overtime_amount),
        gross_salary,
        num(pf),
        num(esic),
        net_salary,
      ],
    );

    res.json({
      success: true,
      message: "Payroll added successfully",
    });
  } catch (err) {
    console.error("Payroll add error:", err);

    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        success: false,
        message: "Payroll already exists for this employee and month",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ======================
// DELETE PAYROLL
// ======================
export const deletePayrollController = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(`DELETE FROM admin_payroll WHERE id = ?`, [id]);

    res.json({
      success: true,
      message: "Payroll deleted",
    });
  } catch (err) {
    console.error("Payroll delete error:", err);
    res.status(500).json({ success: false });
  }
};

// ======================
// DOWNLOAD PDF
// ======================
export const downloadAdminPayrollPdfController = async (req, res) => {
  try {
    const { employeeCode } = req.params;
    const { month } = req.query;

    const [[emp]] = await db.query(
      `SELECT e.id, e.name, e.email, e.joiningDate,
              d.name AS department, g.name AS designation
       FROM employees e
       LEFT JOIN departments d ON d.id = e.departmentId
       LEFT JOIN designations g ON g.id = e.designationId
       WHERE e.employeeCode = ? LIMIT 1`,
      [employeeCode],
    );

    if (!emp) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const [[payroll]] = await db.query(
      `SELECT * FROM admin_payroll WHERE employee_id = ? AND payroll_month = ?`,
      [emp.id, month],
    );

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "Payroll not found",
      });
    }

    /* ---------- helpers ---------- */
    const money = (v) =>
      "Rs. " +
      Number(v || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

    const numberToWords = (n) => {
      const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
      const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
      const two = (x) => (x < 20 ? ones[x] : tens[Math.floor(x / 10)] + (x % 10 ? " " + ones[x % 10] : ""));
      const three = (x) => (x >= 100 ? ones[Math.floor(x / 100)] + " Hundred" + (x % 100 ? " " + two(x % 100) : "") : two(x));
      if (!n) return "Zero";
      let out = "";
      const crore = Math.floor(n / 10000000); n %= 10000000;
      const lakh = Math.floor(n / 100000); n %= 100000;
      const thousand = Math.floor(n / 1000); n %= 1000;
      if (crore) out += three(crore) + " Crore ";
      if (lakh) out += two(lakh) + " Lakh ";
      if (thousand) out += two(thousand) + " Thousand ";
      if (n) out += three(n);
      return out.trim();
    };

    const monthLabel = new Date(`${month}-01`).toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    });

    /* ---------- document ---------- */
    const doc = new PDFDocument({ size: "A4", margin: 0 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=payslip-${employeeCode}-${month}.pdf`,
    );
    doc.pipe(res);

    const PAGE_W = 595.28;
    const M = 48; // side margin
    const W = PAGE_W - M * 2; // content width
    const INK = "#111827";
    const MUTED = "#6B7280";
    const LINE = "#E5E7EB";
    const BAND = "#0F172A";
    const ACCENT = "#059669";
    const SOFT = "#F8FAFC";

    /* header band (ARDHNARISHWAR branded) */
    doc.rect(0, 0, PAGE_W, 110).fill("#2E1065");
    if (LOGO_PATH) {
      try { doc.image(LOGO_PATH, M, 17, { width: 76, height: 76 }); } catch { /* skip */ }
    }
    const hx = LOGO_PATH ? M + 92 : M;
    doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(20)
      .text(COMPANY.name, hx, 30);
    doc.font("Helvetica").fontSize(8.5).fillColor("#DDD6FE")
      .text(COMPANY.address, hx, 56, { width: 300 })
      .text(`CIN: ${COMPANY.cin}  |  ${COMPANY.email}  |  ${COMPANY.phone}`, hx, 80, { width: 300 });
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#FFFFFF")
      .text("PAYSLIP", M, 30, { width: W, align: "right" });
    doc.font("Helvetica").fontSize(9).fillColor("#CBD5E1")
      .text(`For the month of ${monthLabel}`, M, 46, { width: W, align: "right" })
      .text(`Generated: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`, M, 59, { width: W, align: "right" });

    /* employee info grid */
    let y = 134;
    doc.font("Helvetica-Bold").fontSize(10).fillColor(INK).text("EMPLOYEE DETAILS", M, y);
    doc.moveTo(M, y + 14).lineTo(M + W, y + 14).lineWidth(0.7).strokeColor(LINE).stroke();
    y += 24;

    const info = [
      ["Employee Name", emp.name, "Employee Code", employeeCode],
      ["Designation", emp.designation || "—", "Department", emp.department || "—"],
      ["Date of Joining", emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—", "Pay Period", monthLabel],
      ["Email", emp.email || "—", "Payment Mode", "Bank Transfer"],
    ];
    const COL = W / 2;
    info.forEach((row) => {
      doc.font("Helvetica").fontSize(8).fillColor(MUTED).text(row[0].toUpperCase(), M, y);
      doc.font("Helvetica-Bold").fontSize(9.5).fillColor(INK).text(String(row[1]), M, y + 11, { width: COL - 16 });
      doc.font("Helvetica").fontSize(8).fillColor(MUTED).text(row[2].toUpperCase(), M + COL, y);
      doc.font("Helvetica-Bold").fontSize(9.5).fillColor(INK).text(String(row[3]), M + COL, y + 11, { width: COL - 16 });
      y += 34;
    });

    /* earnings / deductions table */
    y += 8;
    const HALF = W / 2;
    const PAD = 14;
    const earnings = [
      ["Basic Salary", payroll.basic_salary],
      ["House Rent Allowance (HRA)", payroll.hra],
      ["Travel Allowance (TA)", payroll.ta],
      ["Dearness Allowance (DA)", payroll.da],
      ["Overtime", payroll.overtime_amount],
    ];
    const deductions = [
      ["Provident Fund (PF)", payroll.pf],
      ["ESIC", payroll.esic],
    ];
    const rowsCount = Math.max(earnings.length, deductions.length);
    const ROW_H = 22;
    const HEAD_H = 26;
    const tableH = HEAD_H + rowsCount * ROW_H + ROW_H; // + totals row

    // table head
    doc.rect(M, y, W, HEAD_H).fill(SOFT);
    doc.rect(M, y, W, tableH).lineWidth(0.7).strokeColor(LINE).stroke();
    doc.moveTo(M + HALF, y).lineTo(M + HALF, y + tableH).strokeColor(LINE).stroke();
    doc.font("Helvetica-Bold").fontSize(9.5).fillColor(INK)
      .text("EARNINGS", M + PAD, y + 8)
      .text("AMOUNT", M, y + 8, { width: HALF - PAD, align: "right" })
      .text("DEDUCTIONS", M + HALF + PAD, y + 8)
      .text("AMOUNT", M + HALF, y + 8, { width: HALF - PAD, align: "right" });

    // rows
    for (let i = 0; i < rowsCount; i++) {
      const ry = y + HEAD_H + i * ROW_H;
      if (i % 2 === 1) {
        doc.rect(M, ry, W, ROW_H).fill("#FCFCFD");
        doc.moveTo(M + HALF, ry).lineTo(M + HALF, ry + ROW_H).strokeColor(LINE).stroke();
      }
      if (earnings[i]) {
        doc.font("Helvetica").fontSize(9).fillColor(INK).text(earnings[i][0], M + PAD, ry + 6);
        doc.font("Helvetica").fontSize(9).fillColor(INK)
          .text(money(earnings[i][1]), M, ry + 6, { width: HALF - PAD, align: "right" });
      }
      if (deductions[i]) {
        doc.font("Helvetica").fontSize(9).fillColor(INK).text(deductions[i][0], M + HALF + PAD, ry + 6);
        doc.font("Helvetica").fontSize(9).fillColor(INK)
          .text(money(deductions[i][1]), M + HALF, ry + 6, { width: HALF - PAD, align: "right" });
      }
    }

    // totals row
    const totalDeductions = Number(payroll.pf || 0) + Number(payroll.esic || 0);
    const ty = y + HEAD_H + rowsCount * ROW_H;
    doc.rect(M, ty, W, ROW_H).fill(SOFT);
    doc.moveTo(M + HALF, ty).lineTo(M + HALF, ty + ROW_H).strokeColor(LINE).stroke();
    doc.font("Helvetica-Bold").fontSize(9.5).fillColor(INK)
      .text("GROSS EARNINGS", M + PAD, ty + 6)
      .text(money(payroll.gross_salary), M, ty + 6, { width: HALF - PAD, align: "right" })
      .text("TOTAL DEDUCTIONS", M + HALF + PAD, ty + 6)
      .text(money(totalDeductions), M + HALF, ty + 6, { width: HALF - PAD, align: "right" });

    /* net pay band */
    y = ty + ROW_H + 20;
    doc.rect(M, y, W, 54).fill(ACCENT);
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#FFFFFF").text("NET PAY", M + PAD, y + 10);
    doc.font("Helvetica").fontSize(8.5).fillColor("#D1FAE5")
      .text(
        `${numberToWords(Math.round(Number(payroll.net_salary || 0)))} Rupees Only`,
        M + PAD,
        y + 26,
        { width: W - 220 },
      );
    doc.font("Helvetica-Bold").fontSize(18).fillColor("#FFFFFF")
      .text(money(payroll.net_salary), M, y + 16, { width: W - PAD, align: "right" });

    /* footer */
    y += 78;
    doc.moveTo(M, y).lineTo(M + W, y).lineWidth(0.7).strokeColor(LINE).stroke();
    doc.font("Helvetica").fontSize(8).fillColor(MUTED)
      .text(
        "This is a computer-generated payslip and does not require a signature or company seal. " +
          `For any discrepancy, contact the HR department within 7 days of issue at ${COMPANY.hrEmail}.`,
        M,
        y + 10,
        { width: W, align: "center" },
      );

    doc.end();
  } catch (err) {
    console.error("PDF error:", err);
    res.status(500).json({ success: false });
  }
};

// ======================
// AUTO-GENERATE PAYROLL (delegates to adminPayroll.service.js)
// ======================
export const autoGeneratePayrollController = async (req, res) => {
  try {
    const result = await runAutoPayroll(req.body?.payroll_month);
    res.json({
      success: true,
      ...result,
      message: `Auto-generated payroll for ${result.generated} employee(s), skipped ${result.skipped}`,
    });
  } catch (err) {
    console.error("Auto payroll error:", err);
    const isBadInput = /YYYY-MM/.test(err.message || "");
    res.status(isBadInput ? 400 : 500).json({
      success: false,
      message: isBadInput ? err.message : "Server error",
    });
  }
};

