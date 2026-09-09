import { db } from "../../config/db.js";
import PDFDocument from "pdfkit";
import { PDFDocument as PdfLibDocument, rgb, StandardFonts } from "pdf-lib";
import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";

/* ------------------------------------------------------------------ */
/* Setup                                                               */
/* ------------------------------------------------------------------ */
const DOCS_DIR = path.join(process.cwd(), "uploads", "documents");
if (!fs.existsSync(DOCS_DIR)) fs.mkdirSync(DOCS_DIR, { recursive: true });
const SIG_DIR = path.join(process.cwd(), "uploads", "signatures");
if (!fs.existsSync(SIG_DIR)) fs.mkdirSync(SIG_DIR, { recursive: true });

/* Save a base64 PNG data URL as a signature file; returns absolute path or null */
const saveSignature = (dataUrl) => {
  const m = /^data:image\/png;base64,(.+)$/.exec(dataUrl || "");
  if (!m) return null;
  const buf = Buffer.from(m[1], "base64");
  if (!buf.length || buf.length > 2 * 1024 * 1024) return null; // max 2MB
  const file = path.join(SIG_DIR, `sig-${Date.now()}-${Math.round(Math.random() * 1e6)}.png`);
  fs.writeFileSync(file, buf);
  return file;
};

const ensureTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS hr_documents (
      id INT AUTO_INCREMENT PRIMARY KEY,
      doc_type VARCHAR(60) NOT NULL,
      employee_id INT NULL,
      employee_name VARCHAR(150) NULL,
      subject VARCHAR(255) NULL,
      file_path VARCHAR(255) NOT NULL,
      generated_by VARCHAR(120) NULL,
      emailed_to VARCHAR(150) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};
ensureTable().catch((e) => console.error("hr_documents init error:", e.message));

import { COMPANY, LOGO_PATH, BRAND } from "../../config/branding.js";

/* ------------------------------------------------------------------ */
/* Letter templates (12 types)                                          */
/* body(d) receives merged data: employee row + extra form fields       */
/* ------------------------------------------------------------------ */
const fmtDate = (d) => {
  if (!d) return "____";
  const dt = new Date(d);
  return isNaN(dt) ? String(d) : dt.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
};
const rs = (n) => (n ? `Rs. ${Number(n).toLocaleString("en-IN")}` : "____");

export const DOC_TYPES = {
  offer_letter: {
    label: "Offer Letter",
    fields: ["position", "salary_annual", "joining_date", "work_location"],
    subject: (d) => `Offer of Employment - ${d.position || d.designation || ""}`,
    body: (d) =>
      `We are pleased to offer you the position of ${d.position || d.designation || "____"} at ${COMPANY.name}.\n\n` +
      `Your annual compensation (CTC) will be ${rs(d.salary_annual || d.salary * 12)}. ` +
      `Your date of joining will be ${fmtDate(d.joining_date || d.joiningDate)} at our ${d.work_location || "registered"} office.\n\n` +
      `This offer is contingent upon successful completion of documentation and background verification. ` +
      `Please sign and return a copy of this letter as acceptance of the offer.\n\n` +
      `We look forward to welcoming you to the team.`,
  },
  appointment_letter: {
    label: "Appointment Letter",
    fields: ["position", "salary_annual", "joining_date", "probation_months"],
    subject: (d) => `Letter of Appointment - ${d.position || d.designation || ""}`,
    body: (d) =>
      `With reference to your application and subsequent interviews, we are pleased to appoint you as ${d.position || d.designation || "____"} at ${COMPANY.name}, effective ${fmtDate(d.joining_date || d.joiningDate)}.\n\n` +
      `Your annual compensation will be ${rs(d.salary_annual || d.salary * 12)}. ` +
      `You will be on probation for a period of ${d.probation_months || 3} months from your date of joining, after which your employment will be confirmed subject to satisfactory performance.\n\n` +
      `Your employment will be governed by the company's policies and procedures as amended from time to time.`,
  },
  joining_letter: {
    label: "Joining Letter",
    fields: ["position", "joining_date", "reporting_to"],
    subject: (d) => `Joining Confirmation - ${d.name || ""}`,
    body: (d) =>
      `This is to confirm that ${d.name || "____"} (Employee Code: ${d.employeeCode || "____"}) has joined ${COMPANY.name} as ${d.position || d.designation || "____"} on ${fmtDate(d.joining_date || d.joiningDate)}.\n\n` +
      `${d.reporting_to ? `You will be reporting to ${d.reporting_to}.\n\n` : ""}` +
      `We welcome you aboard and wish you a successful career with us.`,
  },
  experience_letter: {
    label: "Experience Letter",
    fields: ["position", "from_date", "to_date"],
    subject: (d) => `Experience Certificate - ${d.name || ""}`,
    body: (d) =>
      `This is to certify that ${d.name || "____"} (Employee Code: ${d.employeeCode || "____"}) was employed with ${COMPANY.name} as ${d.position || d.designation || "____"} from ${fmtDate(d.from_date || d.joiningDate)} to ${fmtDate(d.to_date)}.\n\n` +
      `During the tenure with us, we found ${d.name || "the employee"} to be sincere, hardworking and professional. ` +
      `We wish ${d.name || "the employee"} all the best in future endeavours.`,
  },
  relieving_letter: {
    label: "Relieving Letter",
    fields: ["position", "relieving_date"],
    subject: (d) => `Relieving Letter - ${d.name || ""}`,
    body: (d) =>
      `This is with reference to your resignation from the position of ${d.position || d.designation || "____"}.\n\n` +
      `We confirm that you have been relieved from your duties at ${COMPANY.name} effective close of business on ${fmtDate(d.relieving_date)}. ` +
      `All company property has been returned and your full and final settlement will be processed as per company policy.\n\n` +
      `We thank you for your contribution and wish you success in your future endeavours.`,
  },
  resignation_acceptance: {
    label: "Resignation Acceptance",
    fields: ["resignation_date", "last_working_day"],
    subject: (d) => `Acceptance of Resignation - ${d.name || ""}`,
    body: (d) =>
      `We acknowledge receipt of your resignation dated ${fmtDate(d.resignation_date)}.\n\n` +
      `Your resignation has been accepted, and your last working day with ${COMPANY.name} will be ${fmtDate(d.last_working_day)}. ` +
      `Please ensure a smooth handover of your responsibilities and return all company assets before your last working day.\n\n` +
      `We thank you for your service and wish you the very best.`,
  },
  termination_letter: {
    label: "Termination Letter",
    fields: ["termination_date", "termination_reason"],
    subject: (d) => `Termination of Employment - ${d.name || ""}`,
    body: (d) =>
      `This letter serves as formal notice that your employment with ${COMPANY.name} is terminated effective ${fmtDate(d.termination_date)}.\n\n` +
      `Reason: ${d.termination_reason || "As discussed and documented"}.\n\n` +
      `Your full and final settlement will be processed as per company policy. You are required to return all company property immediately.`,
  },
  salary_revision: {
    label: "Salary Revision Letter",
    fields: ["new_salary_annual", "effective_date"],
    subject: (d) => `Salary Revision - ${d.name || ""}`,
    body: (d) =>
      `We are pleased to inform you that in recognition of your performance and contribution, your annual compensation has been revised to ${rs(d.new_salary_annual)}, effective ${fmtDate(d.effective_date)}.\n\n` +
      `All other terms and conditions of your employment remain unchanged. We appreciate your dedication and look forward to your continued contribution.`,
  },
  promotion_letter: {
    label: "Promotion Letter",
    fields: ["new_position", "new_salary_annual", "effective_date"],
    subject: (d) => `Promotion - ${d.name || ""}`,
    body: (d) =>
      `We are pleased to inform you that you have been promoted to the position of ${d.new_position || "____"}, effective ${fmtDate(d.effective_date)}.\n\n` +
      `${d.new_salary_annual ? `Your revised annual compensation will be ${rs(d.new_salary_annual)}.\n\n` : ""}` +
      `This promotion is in recognition of your consistent performance and commitment. Congratulations, and we wish you continued success.`,
  },
  warning_letter: {
    label: "Warning Letter",
    fields: ["warning_reason", "incident_date"],
    subject: (d) => `Warning Letter - ${d.name || ""}`,
    body: (d) =>
      `This letter serves as a formal warning regarding the following matter observed on ${fmtDate(d.incident_date)}:\n\n` +
      `${d.warning_reason || "____"}\n\n` +
      `You are advised to correct the above with immediate effect. Any repetition may lead to strict disciplinary action, including termination of employment. ` +
      `Please treat this matter with utmost seriousness.`,
  },
  internship_letter: {
    label: "Internship Letter",
    fields: ["position", "from_date", "to_date", "stipend"],
    subject: (d) => `Internship Offer - ${d.name || ""}`,
    body: (d) =>
      `We are pleased to offer you an internship at ${COMPANY.name} as ${d.position || "Intern"} from ${fmtDate(d.from_date)} to ${fmtDate(d.to_date)}.\n\n` +
      `${d.stipend ? `You will receive a stipend of ${rs(d.stipend)} per month.\n\n` : ""}` +
      `During the internship you will be expected to comply with all company policies. On successful completion, you will be issued an internship completion certificate.`,
  },
  nda_agreement: {
    label: "NDA & Employment Agreement",
    fields: ["position", "effective_date"],
    subject: (d) => `Non-Disclosure & Employment Agreement - ${d.name || ""}`,
    body: (d) =>
      `This Non-Disclosure and Employment Agreement is entered into between ${COMPANY.name} ("the Company") and ${d.name || "____"} ("the Employee"), employed as ${d.position || d.designation || "____"}, effective ${fmtDate(d.effective_date || d.joiningDate)}.\n\n` +
      `1. The Employee agrees to hold in strict confidence all proprietary information, trade secrets, client data, and business processes of the Company, both during and after employment.\n\n` +
      `2. The Employee shall not, directly or indirectly, disclose, use, or exploit any confidential information for personal gain or for the benefit of any third party.\n\n` +
      `3. All work products, inventions, and materials created during employment shall be the exclusive property of the Company.\n\n` +
      `4. Breach of this agreement may result in termination of employment and legal action.\n\n` +
      `By signing below, both parties acknowledge and accept the terms of this agreement.`,
  },
};

/* ------------------------------------------------------------------ */
/* PDF generation                                                       */
/* ------------------------------------------------------------------ */
const generatePdf = (docType, data, filePath) =>
  new Promise((resolve, reject) => {
    const tpl = DOC_TYPES[docType];
    const doc = new PDFDocument({ size: "A4", margins: { top: 60, bottom: 60, left: 65, right: 65 } });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Letterhead (ARDHNARISHWAR branded)
    const headTop = 48;
    if (LOGO_PATH) {
      try { doc.image(LOGO_PATH, 65, headTop - 8, { width: 58, height: 58 }); } catch { /* skip */ }
    }
    const headX = LOGO_PATH ? 135 : 65;
    doc.font("Helvetica-Bold").fontSize(19).fillColor(BRAND.primaryDark)
      .text(COMPANY.name, headX, headTop);
    doc.font("Helvetica").fontSize(8.5).fillColor(BRAND.muted)
      .text(COMPANY.address, headX, headTop + 24, { width: 395 })
      .text(`CIN: ${COMPANY.cin}  |  ${COMPANY.hrEmail}  |  ${COMPANY.phone}`, headX, headTop + 44, { width: 395 });
    doc.y = Math.max(doc.y, headTop + 62);
    doc.strokeColor(BRAND.accent).lineWidth(2)
      .moveTo(65, doc.y).lineTo(530, doc.y).stroke();
    doc.x = 65;
    doc.moveDown(1.5);

    // Date + ref
    doc.font("Helvetica").fontSize(10).fillColor("#333333");
    doc.text(`Date: ${fmtDate(new Date())}`, { align: "right" });
    doc.moveDown(1);

    // Addressee
    if (data.name) {
      doc.text(`To,`);
      doc.font("Helvetica-Bold").text(data.name);
      if (data.employeeCode) doc.font("Helvetica").text(`Employee Code: ${data.employeeCode}`);
      doc.moveDown(1);
    }

    // Subject
    doc.font("Helvetica-Bold").fontSize(12).fillColor("#1a1a2e")
      .text(`Subject: ${tpl.subject(data)}`, { underline: true });
    doc.moveDown(1);

    // Salutation + body
    doc.font("Helvetica").fontSize(11).fillColor("#222222");
    doc.text(`Dear ${data.name || "Sir/Madam"},`);
    doc.moveDown(0.8);
    doc.text(tpl.body(data), { align: "justify", lineGap: 3 });
    doc.moveDown(2);

    // Signature block
    doc.text("Sincerely,");
    doc.moveDown(0.4);
    if (data.signature_image && fs.existsSync(data.signature_image)) {
      try { doc.image(data.signature_image, { width: 110 }); } catch { /* skip bad image */ }
    } else {
      doc.moveDown(1.6);
    }
    doc.font("Helvetica-Bold").text(data.signatory_name || "Authorized Signatory");
    doc.font("Helvetica").fontSize(10).fillColor("#555555")
      .text(data.signatory_title || "HR Department")
      .text(COMPANY.name);

    // Acceptance line for offer/appointment/NDA
    if (["offer_letter", "appointment_letter", "nda_agreement"].includes(docType)) {
      doc.moveDown(2.5);
      doc.fontSize(10).fillColor("#333333")
        .text("Accepted & Agreed: ______________________          Date: ______________");
    }

    doc.end();
    stream.on("finish", resolve);
    stream.on("error", reject);
  });

/* ------------------------------------------------------------------ */
/* Controllers                                                          */
/* ------------------------------------------------------------------ */
export const getDocTypes = (req, res) => {
  res.json(
    Object.entries(DOC_TYPES).map(([key, v]) => ({ key, label: v.label, fields: v.fields }))
  );
};

export const generateDocument = async (req, res) => {
  try {
    const { doc_type, employee_id, extra = {} } = req.body;
    if (!DOC_TYPES[doc_type])
      return res.status(400).json({ success: false, message: "Invalid document type" });

    let employee = {};
    if (employee_id) {
      const [[emp]] = await db.query(
        `SELECT e.*, d.name AS department, g.name AS designation
         FROM employees e
         LEFT JOIN departments d ON d.id = e.departmentId
         LEFT JOIN designations g ON g.id = e.designationId
         WHERE e.id = ?`,
        [employee_id]
      );
      if (!emp) return res.status(404).json({ success: false, message: "Employee not found" });
      employee = emp;
    }

    const data = { ...employee, ...extra };

    /* Drawn authorized signature (base64 PNG) → embedded in the letter */
    let sigPath = null;
    if (extra.signature_data) {
      sigPath = saveSignature(extra.signature_data);
      if (sigPath) data.signature_image = sigPath;
      delete data.signature_data;
    }

    const fileName = `${doc_type}-${(data.name || "document").replace(/[^a-z0-9]/gi, "_")}-${Date.now()}.pdf`;
    const filePath = path.join(DOCS_DIR, fileName);

    await generatePdf(doc_type, data, filePath);

    const relPath = `documents/${fileName}`;
    const sigRel = sigPath ? `signatures/${path.basename(sigPath)}` : null;
    const [r] = await db.query(
      `INSERT INTO hr_documents
       (doc_type, employee_id, employee_name, subject, file_path, generated_by,
        signature_path, status, signed_by, signed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ${sigPath ? "NOW()" : "NULL"})`,
      [
        doc_type,
        employee_id || null,
        data.name || null,
        DOC_TYPES[doc_type].subject(data),
        relPath,
        req.user.name || "Admin",
        sigRel,
        sigPath ? "Signed" : "Draft",
        sigPath ? data.signatory_name || req.user.name || "Authorized Signatory" : null,
      ]
    );

    res.json({ success: true, id: r.insertId, file: `/api/uploads/${relPath}` });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const listDocuments = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM hr_documents ORDER BY created_at DESC");
    res.json(rows);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const [[row]] = await db.query("SELECT * FROM hr_documents WHERE id = ?", [req.params.id]);
    if (row) {
      const abs = path.join(process.cwd(), "uploads", row.file_path);
      if (fs.existsSync(abs)) fs.unlinkSync(abs);
      await db.query("DELETE FROM hr_documents WHERE id = ?", [req.params.id]);
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const emailDocument = async (req, res) => {
  try {
    const { to } = req.body;
    if (!to) return res.status(400).json({ success: false, message: "Recipient email required" });

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return res.status(400).json({
        success: false,
        message:
          "Email not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in the backend .env file.",
      });
    }

    const [[row]] = await db.query("SELECT * FROM hr_documents WHERE id = ?", [req.params.id]);
    if (!row) return res.status(404).json({ success: false, message: "Document not found" });

    const abs = path.join(process.cwd(), "uploads", row.file_path);
    if (!fs.existsSync(abs))
      return res.status(404).json({ success: false, message: "PDF file missing on server" });

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    await transporter.sendMail({
      from: `"${COMPANY.name}" <${process.env.SMTP_USER}>`,
      to,
      subject: row.subject || "HR Document",
      text: `Dear ${row.employee_name || "Sir/Madam"},\n\nPlease find the attached document.\n\nRegards,\n${COMPANY.name}`,
      attachments: [{ filename: path.basename(abs), path: abs }],
    });

    await db.query(
      "UPDATE hr_documents SET emailed_to = ?, status = IF(status='Signed','Signed','Sent') WHERE id = ?",
      [to, row.id],
    );
    res.json({ success: true, message: `Emailed to ${to}` });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

/* Stamp a drawn signature + signed-by line onto the last page of a PDF */
const stampSignatureOnPdf = async (absPdfPath, sigAbsPath, signedBy) => {
  const pdfBytes = fs.readFileSync(absPdfPath);
  const pdf = await PdfLibDocument.load(pdfBytes);
  const pages = pdf.getPages();
  const page = pages[pages.length - 1];
  const { width } = page.getSize();
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  const boxW = 180;
  const x = width - boxW - 65;
  let y = 60;

  if (sigAbsPath && fs.existsSync(sigAbsPath)) {
    const png = await pdf.embedPng(fs.readFileSync(sigAbsPath));
    const dims = png.scaleToFit(140, 50);
    page.drawImage(png, { x, y: y + 26, width: dims.width, height: dims.height });
  }
  page.drawLine({
    start: { x, y: y + 22 },
    end: { x: x + boxW, y: y + 22 },
    thickness: 0.8,
    color: rgb(0.2, 0.2, 0.2),
  });
  page.drawText(`Digitally signed by ${signedBy}`, {
    x, y: y + 10, size: 8, font, color: rgb(0.15, 0.15, 0.15),
  });
  page.drawText(
    `Date: ${new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}`,
    { x, y, size: 8, font, color: rgb(0.35, 0.35, 0.35) },
  );

  fs.writeFileSync(absPdfPath, await pdf.save());
};

/* E-signature: signer name + optional drawn signature stamped into the PDF */
export const signDocument = async (req, res) => {
  try {
    const { signed_by, signature_data } = req.body;
    if (!signed_by?.trim())
      return res.status(400).json({ success: false, message: "Signer name required" });

    const [[row]] = await db.query("SELECT * FROM hr_documents WHERE id = ?", [
      req.params.id,
    ]);
    if (!row)
      return res.status(404).json({ success: false, message: "Document not found" });
    if (row.status === "Signed")
      return res.status(409).json({ success: false, message: "Document is already signed" });

    let sigPath = null;
    if (signature_data) sigPath = saveSignature(signature_data);

    /* Stamp into the actual PDF so the signature travels with the file */
    const absPdf = path.join(process.cwd(), "uploads", row.file_path);
    if (fs.existsSync(absPdf)) {
      try {
        await stampSignatureOnPdf(absPdf, sigPath, signed_by.trim());
      } catch (err) {
        console.error("[documents] PDF stamp failed:", err.message);
      }
    }

    await db.query(
      `UPDATE hr_documents SET status = 'Signed', signed_by = ?, signed_at = NOW(),
       signature_path = COALESCE(?, signature_path) WHERE id = ?`,
      [signed_by.trim(), sigPath ? `signatures/${path.basename(sigPath)}` : null, req.params.id],
    );

    res.json({
      success: true,
      message: `Signed by ${signed_by.trim()}${sigPath ? " (signature embedded in PDF)" : ""}`,
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
