import * as service from "./clientAgreements.service.js";
import * as templateService from "../../client/agreementTemplates/agreementTemplates.service.js";

import { PDFDocument, rgb } from "pdf-lib";
import { buildProfessionalAgreementPdf } from "./agreementPdf.builder.js";

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
    const { agreement_type = "Master Service Agreement", client_company_name, effective_date, expiry_date, remarks } = req.body;

    const { pdfUrl, agreementNumber } = await buildProfessionalAgreementPdf(req.body);

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
      status: "active",
      remarks: remarks || null,
    });

    res.json({ success: true, pdfUrl, agreement_number: agreementNumber, message: "Agreement generated" });
  } catch (err) {
    if (err.status === 400) return res.status(400).json({ success: false, message: err.message });
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