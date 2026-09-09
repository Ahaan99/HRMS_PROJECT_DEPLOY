import * as service from "./invoice.service.js";
import { db } from "../../../config/db.js";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

export const createInvoice = async (req, res, next) => {
  try {
    const data = await service.createInvoice(req.body);
    res.json({ success: true, invoice: data });
  } catch (err) {
    next(err);
  }
};

export const getInvoices = async (req, res, next) => {
  try {
    const data = await service.getInvoices();
    res.json({ success: true, invoices: data });
  } catch (err) {
    next(err);
  }
};

export const getInvoiceById = async (req, res, next) => {
  try {
    const data = await service.getInvoiceById(req.params.id);
    res.json({ success: true, invoice: data });
  } catch (err) {
    next(err);
  }
};

export const downloadInvoiceController = async (req, res) => {
  try {
    const { id } = req.params;

    // ================= GET INVOICE =================

    const [[invoice]] = await db.query(
      `SELECT * FROM invoices WHERE id = ?`,
      [id]
    );

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // ================= GET ITEMS =================

    const [items] = await db.query(
      `SELECT * FROM invoice_items WHERE invoice_id = ?`,
      [id]
    );

    // ================= PAYMENT DETAILS + QR =================

    const [[settings]] = await db.query(
      "SELECT * FROM company_settings LIMIT 1"
    );

    let qrBuffer = null;
    if (invoice.upi_id) {
      const upiString = `upi://pay?pa=${invoice.upi_id}&pn=${encodeURIComponent(
        settings?.company_name || "Company"
      )}&am=${Number(invoice.total_amount).toFixed(2)}&cu=INR&tn=${encodeURIComponent(
        "Invoice " + invoice.invoice_no
      )}`;
      try {
        qrBuffer = await QRCode.toBuffer(upiString, { width: 120, margin: 1 });
      } catch {
        qrBuffer = null;
      }
    }

    // ================= CREATE PDF =================

    const doc = new PDFDocument({ margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${invoice.invoice_no}.pdf`
    );

    doc.pipe(res);

    const money = (v) => Number(v || 0).toFixed(2);

    const startX = 40;
    const pageWidth = 520;

    // ================= TITLE =================

    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("Tax Invoice", { align: "center" });

    doc.moveDown(1.5);

    // ================= COMPANY BOX =================

    let y = doc.y;

    doc.rect(startX, y, pageWidth, 40).stroke();

    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("RECRUWEB RESOURCES PRIVATE LIMITED", startX + 10, y + 10);

    doc
      .font("Helvetica")
      .text("GSTIN: 09AANCR1081L1ZW", startX + 10, y + 22);

    doc.moveDown(2.5);

    // ================= BUYER BOX =================

    y = doc.y;

    doc.rect(startX, y, pageWidth, 60).stroke();

    doc
      .font("Helvetica-Bold")
      .text(`Buyer: ${invoice.client_name}`, startX + 10, y + 10);

    doc
      .font("Helvetica")
      .text(invoice.client_address || "-", startX + 10, y + 25);

    doc.text(`GSTIN: ${invoice.client_gstin || "-"}`, startX + 10, y + 40);

    doc.moveDown(3);

    // ================= TABLE HEADER =================

    y = doc.y;

    doc.rect(startX, y, pageWidth, 25).stroke();

    doc.font("Helvetica-Bold");

    doc.text("Description", startX + 10, y + 7);
    doc.text("HSN", startX + 220, y + 7);
    doc.text("Qty", startX + 300, y + 7);
    doc.text("Rate", startX + 360, y + 7);
    doc.text("Amount", startX + 450, y + 7);

    doc.moveDown(1.5);

    // ================= TABLE ROWS =================

    items.forEach((item) => {
      const rowY = doc.y;

      doc.rect(startX, rowY, pageWidth, 22).stroke();

      doc.font("Helvetica");

      doc.text(item.description, startX + 10, rowY + 6);
      doc.text(item.hsn_sac || "-", startX + 220, rowY + 6);
      doc.text(item.quantity, startX + 300, rowY + 6);
      doc.text(`₹${money(item.rate)}`, startX + 360, rowY + 6);
      doc.text(`₹${money(item.amount)}`, startX + 450, rowY + 6);

      doc.moveDown(1.1);
    });

    doc.moveDown(1);

    // ================= TAX SUMMARY =================

    const sumY = doc.y;

    doc.font("Helvetica");

    doc.text(`Taxable: ₹${money(invoice.taxable_amount)}`, 400, sumY);

    doc.text(`CGST: ₹${money(invoice.cgst)}`, 400, sumY + 15);

    doc.text(`SGST: ₹${money(invoice.sgst)}`, 400, sumY + 30);

    doc.font("Helvetica-Bold");

    doc.text(`Total: ₹${money(invoice.total_amount)}`, 400, sumY + 50);

    doc.moveDown(4);

    // ================= DECLARATION =================

    const footerY = doc.y;

    doc.font("Helvetica-Bold");
    doc.text("Declaration", startX, footerY);

    doc.font("Helvetica");
    doc.text(
      "This is a computer generated invoice.",
      startX,
      footerY + 15
    );

    // ================= PAYMENT DETAILS =================

    const payY = footerY + 55;

    if (settings) {
      doc.font("Helvetica-Bold").fontSize(10);
      doc.text("Payment Details", startX, payY);

      doc.font("Helvetica").fontSize(9);
      doc.text(`Bank: ${settings.bank_name || "-"}`, startX, payY + 15);
      doc.text(`A/C No: ${settings.account_number || "-"}`, startX, payY + 28);
      doc.text(`IFSC: ${settings.ifsc || "-"}`, startX, payY + 41);
      doc.text(`Branch: ${settings.branch || "-"}`, startX, payY + 54);
      if (invoice.upi_id) {
        doc.text(`UPI: ${invoice.upi_id}`, startX, payY + 67);
      }
    }

    if (qrBuffer) {
      doc.image(qrBuffer, 250, payY, { width: 85 });
      doc.font("Helvetica").fontSize(8);
      doc.text("Scan to pay via UPI", 250, payY + 88);
    }

    // ================= SIGNATORY =================

    doc.text("Authorised Signatory", 420, footerY + 30);

    doc.end();

  } catch (err) {
    console.error("Invoice PDF error:", err);

    res.status(500).json({
      success: false,
      message: "Invoice generation failed",
    });
  }
};
