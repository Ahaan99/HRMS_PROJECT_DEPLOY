import * as service from "./clientAgreements.service.js";
import * as templateService from "../../client/agreementTemplates/agreementTemplates.service.js";

import { PDFDocument, rgb } from "pdf-lib";
import PDFKit from "pdfkit";
import { COMPANY, BRAND, LOGO_PATH, drawFooter } from "../../../config/branding.js";

import { getTemplateConfig } from "./templateFieldConfig.js";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* =========================================
CREATE
========================================= */
export const createClientAgreement = async (req, res) => {
  try {
    const {
      client_id,
      template_id,
      agreement_title,
      client_company_name,
      agreement_type,
      agreement_number,
      start_date,
      expiry_date,
      status,
      remarks,
      agreement_pdf,
    } = req.body;

    if (!agreement_pdf) {
      return res.status(400).json({
        success: false,
        message: "Agreement PDF URL is required",
      });
    }

    console.log("💾 Saving agreement:", client_company_name);

    await service.createClientAgreement({
      client_id,
      template_id,
      agreement_title,
      client_company_name,
      agreement_type,
      agreement_number,
      start_date,
      expiry_date,
      agreement_pdf,
      status,
      remarks,
    });

    res.status(201).json({
      success: true,
      message: "Agreement created successfully",
    });
  } catch (err) {
    console.error("❌ Create Agreement Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error: " + err.message,
    });
  }
};

export const generateAgreementPDF = async (req, res) => {
  try {
    let {
      template_id,
      client_company_name,
      client_address,
      client_gst_number,
      client_representative_name,
      effective_date,
      duration,
      agreement_title,
      remarks,
    } = req.body;

    if (Array.isArray(template_id)) {
      template_id = template_id[0];
    }

    console.log("🔍 Template:", template_id, "Client:", client_company_name);

    const template = await templateService.getTemplateById(template_id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

// Get filename from DB
const fileName = template.template_file.split("/").pop();
console.log("📄 Template filename:", fileName);

// Try multiple paths
const possiblePaths = [
  // Path 1: Current directory structure (MOST LIKELY)
  path.join(__dirname, "../../../uploads/agreement-templates", fileName),
  
  // Path 2: Absolute path
  `C:/home/u471298916/uploads/agreement-templates/${fileName}`,
  
  // Path 3: Relative to project root
  path.join(process.cwd(), "uploads/agreement-templates", fileName),
  
  // Path 4: From backen folder
  path.join(process.cwd(), "backen/uploads/agreement-templates", fileName),
];

console.log("🔎 Trying to find:", fileName);
console.log("📍 Paths to check:", possiblePaths);

let foundPath = null;
for (const p of possiblePaths) {
  console.log(`  Checking: ${p} ... ${fs.existsSync(p) ? "✅ FOUND" : "❌"}`);
  if (fs.existsSync(p)) {
    foundPath = p;
    break;
  }
}

if (!foundPath) {
  return res.status(404).json({
    success: false,
    message: `PDF file '${fileName}' not found`,
    attempted_paths: possiblePaths,
  });
}

console.log("✅ Using path:", foundPath);

    if (!fs.existsSync(foundPath)) {
      return res.status(404).json({
        success: false,
        message: "PDF file not found",
      });
    }

    const existingPdfBytes = fs.readFileSync(foundPath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    const templateConfig = getTemplateConfig(String(template_id));
    const pages = pdfDoc.getPages();

    const fieldData = {
      client_company_name: client_company_name || "",
      client_address: client_address || "",
      client_gst_number: client_gst_number || "",
      client_representative_name: client_representative_name || "",
      effective_date: effective_date || "",
      duration: duration || "One Year",
    };

    // Add fields from config
    if (templateConfig && templateConfig.fields) {
      for (const [fieldName, fieldConfig] of Object.entries(templateConfig.fields)) {
        if (!fieldData[fieldName]) continue;

        const pageIndex = fieldConfig.page || 0;
        if (pageIndex >= pages.length) continue;

        const page = pages[pageIndex];

        console.log(`✏️ Adding ${fieldName}:`, fieldData[fieldName]);

        page.drawText(fieldData[fieldName], {
          x: fieldConfig.x,
          y: fieldConfig.y,
          size: fieldConfig.size || 11,
          color: rgb(0.15, 0.15, 0.15),
        });
      }
    }

  const pdfBytes = await pdfDoc.save();
const generatedFileName = `agreement_${Date.now()}.pdf`;
const generatedFolder = path.join(process.cwd(), "uploads", "generated");

    if (!fs.existsSync(generatedFolder)) {
      fs.mkdirSync(generatedFolder, { recursive: true });
    }

    const outputPath = path.join(generatedFolder, generatedFileName);
    fs.writeFileSync(outputPath, pdfBytes);

    const pdfUrl = `/api/uploads/generated/${generatedFileName}`;
    console.log("✨ PDF Generated:", pdfUrl);

    res.json({
      success: true,
      pdfUrl: pdfUrl,
      message: "PDF generated successfully",
    });
  } catch (err) {
    console.error("❌ PDF Error:", err);
    res.status(500).json({
      success: false,
      message: "PDF generation failed: " + err.message,
    });
  }
};

/* =========================================
GENERATE PROFESSIONAL BRANDED AGREEMENT (no template needed)
========================================= */
export const generateProfessionalAgreement = async (req, res) => {
  try {
    const {
      agreement_type = "Master Service Agreement",
      client_company_name,
      client_address,
      client_gst_number,
      client_representative_name,
      client_representative_designation,
      client_email,
      effective_date,
      duration = "One (1) Year",
      expiry_date,
      services_scope,
      fees,
      payment_terms,
      notice_period_days = "30",
      jurisdiction = "Noida, Uttar Pradesh",
      remarks,
    } = req.body;

    if (!client_company_name || !client_representative_name || !effective_date) {
      return res.status(400).json({
        success: false,
        message: "Client company, representative and effective date are required",
      });
    }

    const agreementNumber = `ARDH/AGR/${new Date().getFullYear()}/${String(Date.now()).slice(-6)}`;
    const effDate = new Date(effective_date).toLocaleDateString("en-IN", {
      day: "2-digit", month: "long", year: "numeric",
    });

    const doc = new PDFKit({ size: "A4", margins: { top: 64, bottom: 80, left: 60, right: 60 } });
    const generatedFileName = `agreement_${Date.now()}.pdf`;
    const generatedFolder = path.join(process.cwd(), "uploads", "generated");
    if (!fs.existsSync(generatedFolder)) fs.mkdirSync(generatedFolder, { recursive: true });
    const outputPath = path.join(generatedFolder, generatedFileName);
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    const W = doc.page.width - 120;
    const M = 60;

    /* ---------- page 1 header band ---------- */
    doc.rect(0, 0, doc.page.width, 118).fill(BRAND.primaryDark);
    if (LOGO_PATH) { try { doc.image(LOGO_PATH, M, 20, { width: 78, height: 78 }); } catch { /* skip */ } }
    const hx = LOGO_PATH ? M + 94 : M;
    doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(20).text(COMPANY.name, hx, 28);
    doc.font("Helvetica").fontSize(8).fillColor("#DDD6FE")
      .text(COMPANY.address, hx, 54, { width: 320 })
      .text(`CIN: ${COMPANY.cin}  |  GSTIN: ${COMPANY.gst}`, hx, 76)
      .text(`${COMPANY.email}  |  ${COMPANY.phone}  |  ${COMPANY.website}`, hx, 88);
    doc.rect(0, 118, doc.page.width, 3).fill(BRAND.accent);

    /* ---------- title ---------- */
    let y = 148;
    doc.font("Helvetica-Bold").fontSize(16).fillColor(BRAND.primaryDark)
      .text(agreement_type.toUpperCase(), M, y, { width: W, align: "center" });
    y = doc.y + 4;
    doc.font("Helvetica").fontSize(9).fillColor(BRAND.muted)
      .text(`Agreement No: ${agreementNumber}   |   Effective Date: ${effDate}`, M, y, { width: W, align: "center" });
    y = doc.y + 16;

    /* ---------- parties ---------- */
    doc.font("Helvetica").fontSize(9.5).fillColor(BRAND.ink)
      .text(`This ${agreement_type} ("Agreement") is entered into on ${effDate} by and between:`, M, y, { width: W, lineGap: 3 });
    y = doc.y + 10;

    const party = (label, name, addr, extra) => {
      doc.rect(M, y, W, 74).lineWidth(0.8).strokeColor(BRAND.line).stroke();
      doc.rect(M, y, 4, 74).fill(BRAND.accent);
      doc.font("Helvetica-Bold").fontSize(8).fillColor(BRAND.muted).text(label, M + 16, y + 8);
      doc.font("Helvetica-Bold").fontSize(11).fillColor(BRAND.primaryDark).text(name, M + 16, y + 20);
      doc.font("Helvetica").fontSize(8.5).fillColor(BRAND.ink)
        .text(addr, M + 16, y + 36, { width: W - 32 })
        .text(extra, M + 16, y + 56, { width: W - 32 });
      y += 84;
    };
    party(
      'FIRST PARTY ("SERVICE PROVIDER")',
      COMPANY.legalName,
      COMPANY.address,
      `CIN: ${COMPANY.cin}  |  GSTIN: ${COMPANY.gst}  |  Represented by its Authorized Signatory`,
    );
    doc.font("Helvetica-Bold").fontSize(9).fillColor(BRAND.muted).text("AND", M, y - 6, { width: W, align: "center" });
    y += 8;
    party(
      'SECOND PARTY ("CLIENT")',
      client_company_name,
      client_address || "Address as per records",
      `${client_gst_number ? "GSTIN: " + client_gst_number + "  |  " : ""}Represented by: ${client_representative_name}${client_representative_designation ? ", " + client_representative_designation : ""}${client_email ? "  |  " + client_email : ""}`,
    );

    /* ---------- clauses ---------- */
    const clause = (num, title, body) => {
      if (doc.y > doc.page.height - 160) { drawFooter(doc); doc.addPage(); }
      doc.moveDown(0.6);
      doc.font("Helvetica-Bold").fontSize(10.5).fillColor(BRAND.primaryDark)
        .text(`${num}. ${title}`, M, doc.y, { width: W });
      doc.moveDown(0.25);
      doc.font("Helvetica").fontSize(9).fillColor(BRAND.ink)
        .text(body, M, doc.y, { width: W, align: "justify", lineGap: 2.5 });
    };

    doc.x = M;
    clause("1", "SCOPE OF SERVICES",
      services_scope ||
      `The Service Provider shall render professional services to the Client as mutually agreed and detailed in Annexure A, including all deliverables, timelines and quality standards communicated in writing. Any change to the scope shall be executed through a written change order signed by both parties.`);
    clause("2", "TERM AND RENEWAL",
      `This Agreement shall commence on ${effDate} and remain in force for a period of ${duration}${expiry_date ? `, expiring on ${new Date(expiry_date).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}` : ""}, unless terminated earlier in accordance with Clause 9. The Agreement may be renewed by mutual written consent no later than thirty (30) days prior to expiry.`);
    clause("3", "FEES AND PAYMENT",
      `${fees ? `The Client shall pay the Service Provider fees of ${fees}. ` : "The fees payable shall be as set out in Annexure A. "}${payment_terms || "All invoices are payable within fifteen (15) days of receipt. Delayed payments attract interest at 1.5% per month. All fees are exclusive of applicable GST, which shall be charged as per prevailing law."}`);
    clause("4", "CONFIDENTIALITY",
      `Each party shall keep confidential all business, technical, financial and personal information disclosed by the other party and shall not disclose it to any third party without prior written consent, except as required by law. This obligation survives termination of this Agreement for a period of three (3) years.`);
    clause("5", "INTELLECTUAL PROPERTY",
      `All pre-existing intellectual property remains the property of the originating party. Deliverables created specifically for the Client shall vest in the Client upon receipt of full payment. The Service Provider retains the right to use general know-how, methodologies and tools developed during the engagement.`);
    clause("6", "DATA PROTECTION",
      `Both parties shall comply with applicable data protection laws of India, including the Digital Personal Data Protection Act, 2023. Personal data shall be processed only for the purposes of this Agreement and protected with reasonable security safeguards.`);
    clause("7", "INDEMNITY",
      `Each party shall indemnify and hold harmless the other against losses arising from breach of this Agreement, gross negligence, wilful misconduct, or infringement of third-party rights, subject to the limitation in Clause 8.`);
    clause("8", "LIMITATION OF LIABILITY",
      `Neither party shall be liable for indirect, incidental or consequential damages. The aggregate liability of either party under this Agreement shall not exceed the total fees paid or payable in the twelve (12) months preceding the claim.`);
    clause("9", "TERMINATION",
      `Either party may terminate this Agreement by giving ${notice_period_days} days' written notice. Either party may terminate immediately upon material breach not cured within fifteen (15) days of written notice. Upon termination, the Client shall pay for all services rendered up to the effective date of termination.`);
    clause("10", "FORCE MAJEURE",
      `Neither party shall be liable for delay or failure caused by events beyond reasonable control, including acts of God, war, epidemic, or governmental action, provided the affected party notifies the other promptly and resumes performance as soon as practicable.`);
    clause("11", "GOVERNING LAW AND DISPUTE RESOLUTION",
      `This Agreement shall be governed by the laws of India. Disputes shall first be resolved amicably; failing which, they shall be referred to arbitration under the Arbitration and Conciliation Act, 1996, by a sole arbitrator seated at ${jurisdiction}. Courts at ${jurisdiction} shall have exclusive jurisdiction.`);
    clause("12", "NOTICES AND ENTIRE AGREEMENT",
      `All notices shall be in writing to the addresses stated above or by email with acknowledgement. This Agreement, together with its Annexures, constitutes the entire agreement between the parties and supersedes all prior understandings. Amendments are valid only if made in writing and signed by both parties.${remarks ? ` Additional terms: ${remarks}` : ""}`);

    /* ---------- signatures ---------- */
    if (doc.y > doc.page.height - 260) { drawFooter(doc); doc.addPage(); }
    doc.moveDown(1.2);
    doc.font("Helvetica-Bold").fontSize(10.5).fillColor(BRAND.primaryDark)
      .text("IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.", M, doc.y, { width: W });
    doc.moveDown(1.5);

    const sigY = doc.y;
    const half = W / 2 - 14;
    const sig = (x, partyLabel, name, rep) => {
      doc.rect(x, sigY, half, 120).lineWidth(0.8).strokeColor(BRAND.line).stroke();
      doc.font("Helvetica-Bold").fontSize(8).fillColor(BRAND.muted).text(partyLabel, x + 14, sigY + 10);
      doc.font("Helvetica-Bold").fontSize(10).fillColor(BRAND.ink).text(name, x + 14, sigY + 24, { width: half - 28 });
      doc.moveTo(x + 14, sigY + 78).lineTo(x + half - 14, sigY + 78).lineWidth(0.8).strokeColor(BRAND.ink).stroke();
      doc.font("Helvetica").fontSize(8).fillColor(BRAND.muted)
        .text("Authorized Signature & Seal", x + 14, sigY + 83)
        .text(`Name: ${rep}`, x + 14, sigY + 96)
        .text("Date: ______________", x + 14, sigY + 107);
    };
    sig(M, "FOR THE SERVICE PROVIDER", COMPANY.legalName, "______________________");
    sig(M + half + 28, "FOR THE CLIENT", client_company_name, client_representative_name);

    doc.y = sigY + 140;
    doc.font("Helvetica").fontSize(8.5).fillColor(BRAND.muted)
      .text("Witness 1: ______________________________          Witness 2: ______________________________", M, doc.y, { width: W });

    drawFooter(doc, `${COMPANY.name}  |  Agreement No: ${agreementNumber}  |  Confidential — for the named parties only.`);
    doc.end();

    await new Promise((resolve, reject) => {
      stream.on("finish", resolve);
      stream.on("error", reject);
    });

    const pdfUrl = `/api/uploads/generated/${generatedFileName}`;

    await service.createClientAgreement({
      client_id: null,
      template_id: null,
      agreement_title: `${agreement_type} — ${client_company_name}`,
      client_company_name,
      agreement_type,
      agreement_number: agreementNumber,
      start_date: effective_date,
      expiry_date: expiry_date || null,
      agreement_pdf: pdfUrl,
      status: "Active",
      remarks: remarks || null,
    });

    res.json({ success: true, pdfUrl, agreement_number: agreementNumber, message: "Agreement generated" });
  } catch (err) {
    console.error("Professional Agreement Error:", err);
    res.status(500).json({ success: false, message: "Generation failed: " + err.message });
  }
};

/* =========================================
GET ALL AGREEMENTS
========================================= */
export const getAllClientAgreements = async (req, res) => {
  try {
    const agreements = await service.getAllClientAgreements();

    res.json({
      success: true,
      data: agreements,
    });
  } catch (err) {
    console.error("❌ Get Agreements Error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};


/* =========================================
DELETE
========================================= */
export const deleteClientAgreement = async (req, res) => {
  try {
    const { id } = req.params;

    await service.deleteClientAgreement(id);

    res.json({
      success: true,
      message: "Agreement deleted successfully",
    });
  } catch (err) {
    console.error("Delete Agreement Error:", err);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};