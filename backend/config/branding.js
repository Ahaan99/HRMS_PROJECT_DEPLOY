import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const COMPANY = {
  name: process.env.COMPANY_NAME || "ARDHNARISHWAR",
  legalName: process.env.COMPANY_LEGAL_NAME || "Ardhnarishwar Pvt. Ltd.",
  address:
    process.env.COMPANY_ADDRESS ||
    "Corporate Office: Plot 42, Sector 62, Noida, Uttar Pradesh 201309, India",
  cin: process.env.COMPANY_CIN || "U72900UP2020PTC000000",
  gst: process.env.COMPANY_GST || "09AAACA0000A1Z5",
  email: process.env.COMPANY_EMAIL || "info@ardhnarishwar.com",
  hrEmail: process.env.COMPANY_HR_EMAIL || "hr@ardhnarishwar.com",
  phone: process.env.COMPANY_PHONE || "+91 120 400 0000",
  website: process.env.COMPANY_WEBSITE || "www.ardhnarishwar.com",
};

/* Brand palette drawn from the ARDHNARISHWAR logo */
export const BRAND = {
  primary: "#4C1D95", // deep purple
  primaryDark: "#2E1065",
  accent: "#B8860B", // antique gold
  teal: "#0F766E",
  ink: "#1F2937",
  muted: "#6B7280",
  line: "#E5E7EB",
  soft: "#F8F7FC",
};

const logoPath = path.join(__dirname, "../assets/logo.png");
export const LOGO_PATH = fs.existsSync(logoPath) ? logoPath : null;

/* Draws the standard ARDHNARISHWAR letterhead band on a pdfkit doc.
   Returns the y position where content should begin. */
export const drawLetterhead = (doc, { title = "", subtitle = "" } = {}) => {
  const PAGE_W = doc.page.width;
  const M = 48;
  const W = PAGE_W - M * 2;

  doc.rect(0, 0, PAGE_W, 112).fill(BRAND.primaryDark);
  if (LOGO_PATH) {
    doc.image(LOGO_PATH, M, 18, { width: 76, height: 76 });
  }
  const tx = LOGO_PATH ? M + 92 : M;
  doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(19).text(COMPANY.name, tx, 26);
  doc.font("Helvetica").fontSize(8).fillColor("#DDD6FE")
    .text(COMPANY.address, tx, 50, { width: W - 260 })
    .text(
      `CIN: ${COMPANY.cin}  |  ${COMPANY.email}  |  ${COMPANY.phone}`,
      tx,
      72,
      { width: W - 260 },
    );
  if (title) {
    doc.font("Helvetica-Bold").fontSize(12).fillColor("#FFFFFF")
      .text(title, M, 30, { width: W, align: "right" });
  }
  if (subtitle) {
    doc.font("Helvetica").fontSize(8.5).fillColor("#DDD6FE")
      .text(subtitle, M, 48, { width: W, align: "right" });
  }
  /* gold rule under the band */
  doc.rect(0, 112, PAGE_W, 3).fill(BRAND.accent);
  return 140;
};

/* Standard footer with page branding */
export const drawFooter = (doc, note) => {
  const PAGE_W = doc.page.width;
  const PAGE_H = doc.page.height;
  const M = 48;
  /* zero the bottom margin while drawing inside it,
     otherwise pdfkit auto-inserts a blank page */
  const prevBottom = doc.page.margins.bottom;
  const prevX = doc.x;
  const prevY = doc.y;
  doc.page.margins.bottom = 0;
  doc.moveTo(M, PAGE_H - 60).lineTo(PAGE_W - M, PAGE_H - 60)
    .lineWidth(0.7).strokeColor(BRAND.line).stroke();
  doc.font("Helvetica").fontSize(7.5).fillColor(BRAND.muted)
    .text(
      note ||
        `${COMPANY.name} | ${COMPANY.website} | This is a system-generated document.`,
      M,
      PAGE_H - 50,
      { width: PAGE_W - M * 2, align: "center", lineBreak: false },
    );
  doc.page.margins.bottom = prevBottom;
  doc.x = prevX;
  doc.y = prevY;
};
