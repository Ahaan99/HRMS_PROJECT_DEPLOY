import PDFDocument from "pdfkit";
import { db } from "../../../config/db.js";

const BRAND = "#1a2b4a"; // deep navy
const ACCENT = "#c8a24a"; // muted gold
const LIGHT = "#f4f6fa";

// Role-based terms: senior roles get longer probation review + notice period
const roleTerms = (position = "") => {
  const p = position.toLowerCase();
  if (/head|director|vp|chief|cxo|president/.test(p)) {
    return { level: "Leadership", probation: 6, noticeProbation: 30, noticeConfirmed: 90 };
  }
  if (/manager|lead|senior|architect|principal/.test(p)) {
    return { level: "Senior", probation: 6, noticeProbation: 30, noticeConfirmed: 60 };
  }
  if (/intern|trainee|apprentice/.test(p)) {
    return { level: "Trainee", probation: 3, noticeProbation: 15, noticeConfirmed: 30 };
  }
  return { level: "Associate", probation: 3, noticeProbation: 15, noticeConfirmed: 30 };
};

/* ------------------------------------------------------------------ */
/* Template engine                                                     */
/* ------------------------------------------------------------------ */

/**
 * Body syntax (plain text, editable by admins):
 *  - blank line        -> paragraph break
 *  - "## Heading"      -> section heading
 *  - "- item"          -> bullet
 *  - {{placeholder}}   -> substituted from the letter data (see PLACEHOLDERS)
 *  - {{ctc_table}}     -> compensation annexure block (only when include_ctc is on)
 *  - {{terms}}         -> the key-terms block (role-based defaults + template extra terms)
 */
export const PLACEHOLDERS = [
  ["candidate_name", "Candidate full name"],
  ["candidate_email", "Candidate email"],
  ["position", "Position / designation"],
  ["department", "Department"],
  ["grade", "Grade derived from position (Associate, Senior, ...)"],
  ["company", "Company name"],
  ["hr_name", "Signing HR name"],
  ["location", "Work location"],
  ["joining_date", "Joining date (long format)"],
  ["monthly_salary", "Monthly salary, INR"],
  ["annual_ctc", "Annual CTC, INR"],
  ["probation_months", "Probation length in months"],
  ["notice_probation", "Notice period during probation (days)"],
  ["notice_confirmed", "Notice period after confirmation (days)"],
  ["offer_validity_days", "Days the offer stays valid"],
  ["ref_no", "Letter reference number"],
  ["today", "Letter date"],
  ["ctc_table", "Compensation annexure table (block)"],
  ["terms", "Key terms of employment (block)"],
];

export const DEFAULT_BODY = `Dear {{candidate_name}},

Further to our recent discussions, we are delighted to offer you the position of {{position}} in the {{department}} department ({{grade}} grade) at {{company}}, based at {{location}}. Your date of joining will be {{joining_date}}.

Your total annual Cost to Company (CTC) will be INR {{annual_ctc}} (INR {{monthly_salary}} per month). A detailed compensation structure is provided in Annexure A below.

{{ctc_table}}

{{terms}}

We look forward to welcoming you to the team.`;

const OFFER_VALIDITY_DAYS = 7;

const safe = (v) => (v === null || v === undefined ? "" : String(v));
const inr = (n) => Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 0 });
const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "";

/** Everything a template can reference, computed once per letter. */
function buildLetterModel(input, refNo) {
  const monthly = Number(input.salary || 0);
  const annualCTC = monthly * 12;
  const basic = Math.round(annualCTC * 0.5);
  const hra = Math.round(basic * 0.4);
  const pf = Math.round(basic * 0.12);
  const gratuity = Math.round(basic * 0.0481);
  const specialAllowance = Math.max(annualCTC - basic - hra - pf - gratuity, 0);
  const terms = roleTerms(input.position);

  const vars = {
    candidate_name: safe(input.candidateName),
    candidate_email: safe(input.candidateEmail),
    position: safe(input.position),
    department: safe(input.department) || "assigned",
    grade: terms.level,
    company: input.company,
    hr_name: input.hr,
    location: input.loc,
    joining_date: formatDate(input.joiningDate),
    monthly_salary: inr(monthly),
    annual_ctc: inr(annualCTC),
    probation_months: String(terms.probation),
    notice_probation: String(terms.noticeProbation),
    notice_confirmed: String(terms.noticeConfirmed),
    offer_validity_days: String(OFFER_VALIDITY_DAYS),
    ref_no: refNo,
    today: formatDate(new Date()),
  };

  const ctcRows = [
    ["Component", "Amount (INR / year)"],
    ["Basic Salary (50% of CTC)", inr(basic)],
    ["House Rent Allowance (40% of Basic)", inr(hra)],
    ["Special Allowance", inr(specialAllowance)],
    ["Employer Provident Fund (12% of Basic)", inr(pf)],
    ["Gratuity Provision (4.81% of Basic)", inr(gratuity)],
    ["Total Cost to Company", inr(annualCTC)],
  ];

  const termLines = [
    `Probation: ${terms.probation} months from the date of joining, extendable once based on performance review.`,
    `Notice Period: ${terms.noticeProbation} days during probation; ${terms.noticeConfirmed} days after confirmation, by either party in writing.`,
    `Working Hours: 9:30 AM to 6:30 PM, Monday to Friday, subject to business requirements.`,
    `Background Verification: This offer is conditional upon satisfactory background verification and submission of all requested documents on or before your joining date.`,
    `Statutory Benefits: PF, and ESI where applicable, will be provided per statutory requirements. Leave and holidays are governed by the company leave policy shared at onboarding.`,
    `Confidentiality: You will maintain strict confidentiality of all company and client information, during and after your employment.`,
    `Offer Validity: This offer is valid for ${OFFER_VALIDITY_DAYS} calendar days from the date of this letter, after which it lapses automatically.`,
  ];
  if (safe(input.customTerms).trim()) termLines.push(`Additional Terms: ${input.customTerms.trim()}`);

  return { vars, ctcRows, termLines };
}

const substitute = (text, vars) =>
  safe(text).replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (m, key) => {
    const k = key.toLowerCase();
    return k in vars ? vars[k] : m;
  });

/**
 * Turns a template body into an ordered list of render blocks:
 *   { type: "heading" | "paragraph" | "bullets" | "ctc_table" | "terms", ... }
 */
export function compileBody(body, model, includeCtc) {
  const blocks = [];
  const src = safe(body).replace(/\r\n/g, "\n");
  const chunks = src.split(/\n\s*\n/);

  for (const raw of chunks) {
    const chunk = raw.trim();
    if (!chunk) continue;
    if (/^\{\{\s*ctc_table\s*\}\}$/i.test(chunk)) {
      if (includeCtc) blocks.push({ type: "ctc_table", rows: model.ctcRows });
      continue;
    }
    if (/^\{\{\s*terms\s*\}\}$/i.test(chunk)) {
      blocks.push({ type: "terms", items: model.termLines });
      continue;
    }
    const lines = chunk.split("\n");
    // A heading may sit directly above its paragraph with no blank line between.
    while (lines.length && /^##\s+/.test(lines[0])) {
      blocks.push({ type: "heading", text: substitute(lines.shift().replace(/^##\s+/, ""), model.vars) });
    }
    if (!lines.length) continue;
    if (lines.every((l) => /^\s*-\s+/.test(l))) {
      blocks.push({ type: "bullets", items: lines.map((l) => substitute(l.replace(/^\s*-\s+/, ""), model.vars)) });
      continue;
    }
    blocks.push({ type: "paragraph", text: substitute(lines.join(" "), model.vars) });
  }

  // Templates that never mention the blocks still get them, after the body.
  if (includeCtc && !blocks.some((b) => b.type === "ctc_table")) blocks.push({ type: "ctc_table", rows: model.ctcRows });
  if (!blocks.some((b) => b.type === "terms")) blocks.push({ type: "terms", items: model.termLines });
  return blocks;
}

/* ------------------------------------------------------------------ */
/* Shared request parsing                                              */
/* ------------------------------------------------------------------ */

async function resolveLetterInput(body) {
  const { candidateName, candidateEmail, position, department, salary, joiningDate, companyName, hrName, location, templateId } = body;

  let company = companyName || "Tech HR Solutions";
  let hr = hrName || "HR Manager";
  let loc = location || "Noida, India";
  let customTerms = safe(body.terms);
  let templateBody = safe(body.body);
  let includeCtc = body.includeCtc === undefined ? true : Boolean(body.includeCtc);
  let template = null;

  if (templateId) {
    const [rows] = await db.query(`SELECT * FROM offer_letter_templates WHERE id = ?`, [templateId]);
    if (rows.length) {
      template = rows[0];
      company = companyName || template.company_name || company;
      hr = hrName || template.hr_name || hr;
      loc = location || template.location || loc;
      customTerms = customTerms || safe(template.terms);
      templateBody = templateBody || safe(template.body);
      includeCtc = body.includeCtc === undefined ? template.include_ctc !== 0 : includeCtc;
    }
  }
  if (!templateBody.trim()) templateBody = DEFAULT_BODY;

  return { candidateName, candidateEmail, position, department, salary, joiningDate, company, hr, loc, customTerms, templateBody, includeCtc, template };
}

const refNoFor = (company, id) =>
  `${company.replace(/[^A-Z]/gi, "").slice(0, 3).toUpperCase()}/HR/${new Date().getFullYear()}/${String(id).padStart(4, "0")}`;

/* ------------------------------------------------------------------ */
/* Preview (no DB write, no PDF)                                       */
/* ------------------------------------------------------------------ */

export const previewOfferLetterController = async (req, res) => {
  try {
    const input = await resolveLetterInput(req.body);
    if (!input.candidateName || !input.position || !input.joiningDate) {
      return res.status(400).json({ success: false, message: "Candidate name, position and joining date are required" });
    }
    const [[{ next }]] = await db.query("SELECT COALESCE(MAX(id), 0) + 1 AS next FROM offer_letters");
    const refNo = refNoFor(input.company, next);
    const model = buildLetterModel(input, refNo);
    const blocks = compileBody(input.templateBody, model, input.includeCtc);
    const unknown = [...new Set((input.templateBody.match(/\{\{\s*([a-z_]+)\s*\}\}/gi) || []).map((m) => m.replace(/[{}\s]/g, "").toLowerCase()).filter((k) => !(k in model.vars) && !["ctc_table", "terms"].includes(k)))];
    res.json({
      success: true,
      data: {
        refNo,
        subject: `Offer of Employment - ${model.vars.position}${input.department ? `, ${safe(input.department)}` : ""}`,
        letterhead: { company: input.company, location: input.loc, hrName: input.hr },
        addressee: { name: model.vars.candidate_name, email: model.vars.candidate_email },
        blocks,
        unknownPlaceholders: unknown,
      },
    });
  } catch (err) {
    console.error("Offer letter preview error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ------------------------------------------------------------------ */
/* PDF                                                                 */
/* ------------------------------------------------------------------ */

export const generateOfferLetterPdfController = async (req, res) => {
  try {
    const input = await resolveLetterInput(req.body);
    const { candidateName, candidateEmail, position, department, salary, joiningDate, company, hr, loc } = input;

    if (!candidateName || !position || !joiningDate) {
      return res.status(400).json({ success: false, message: "Candidate name, position and joining date are required" });
    }

    const [result] = await db.query(
      `INSERT INTO offer_letters
      (candidate_name, candidate_email, position, department, salary, joining_date, company_name, hr_name, location, template_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [candidateName, candidateEmail || "", position, department || "", salary || 0, joiningDate, company, hr, loc, input.template?.id || null],
    );

    const refNo = refNoFor(company, result.insertId);
    const model = buildLetterModel(input, refNo);
    const blocks = compileBody(input.templateBody, model, input.includeCtc);

    const doc = new PDFDocument({ margin: 0, size: "A4", autoFirstPage: true });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=OfferLetter-${candidateName.replace(/\s+/g, "_")}.pdf`);
    doc.pipe(res);

    const PAGE_W = 595.28;
    const PAGE_H = 841.89;
    const M = 56;
    const CW = PAGE_W - M * 2;
    const BOTTOM = PAGE_H - 70; // keep clear of footer

    const footer = () => {
      doc.rect(0, 812, PAGE_W, 30).fill(BRAND);
      doc.font("Helvetica").fontSize(8).fillColor("#c9d4e5")
        .text(`${company}  |  ${loc}  |  ${refNo}  |  This is a system-generated document.`, M, 822, { width: CW, align: "center" });
    };
    let y = 0;
    const newPage = () => {
      footer();
      doc.addPage({ margin: 0 });
      doc.rect(0, 0, PAGE_W, 14).fill(BRAND);
      y = 48;
    };
    const ensure = (h) => { if (y + h > BOTTOM) newPage(); };

    // ---------- LETTERHEAD ----------
    doc.rect(0, 0, PAGE_W, 96).fill(BRAND);
    doc.rect(0, 96, PAGE_W, 4).fill(ACCENT);
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(22).text(company, M, 30, { width: CW });
    doc.font("Helvetica").fontSize(9).fillColor("#c9d4e5").text(loc, M, 60, { width: CW });
    doc.font("Helvetica-Bold").fontSize(9).fillColor(ACCENT).text("PRIVATE & CONFIDENTIAL", M, 74, { width: CW });

    // ---------- REF / DATE ----------
    y = 120;
    doc.font("Helvetica").fontSize(9.5).fillColor("#444444");
    doc.text(`Ref: ${refNo}`, M, y);
    doc.text(`Date: ${model.vars.today}`, M, y, { width: CW, align: "right" });

    // ---------- ADDRESSEE ----------
    y += 26;
    doc.font("Helvetica-Bold").fontSize(10.5).fillColor("#111111").text(safe(candidateName), M, y);
    if (candidateEmail) {
      y += 14;
      doc.font("Helvetica").fontSize(9.5).fillColor("#555555").text(safe(candidateEmail), M, y);
    }

    // ---------- SUBJECT ----------
    y += 26;
    doc.rect(M, y - 4, CW, 22).fill(LIGHT);
    doc.font("Helvetica-Bold").fontSize(10.5).fillColor(BRAND)
      .text(`Subject: Offer of Employment - ${safe(position)}${department ? `, ${safe(department)}` : ""}`, M + 8, y, { width: CW - 16 });
    y += 32;

    // ---------- BODY BLOCKS ----------
    const para = (text, opts = {}) => {
      doc.font(opts.font || "Helvetica").fontSize(opts.size || 10).fillColor(opts.color || "#222222");
      const h = doc.heightOfString(text, { width: CW, lineGap: 3 });
      ensure(h);
      doc.text(text, M, y, { width: CW, lineGap: 3 });
      y = doc.y + (opts.after ?? 12);
    };

    for (const b of blocks) {
      if (b.type === "heading") {
        ensure(24);
        para(b.text.toUpperCase(), { font: "Helvetica-Bold", size: 10.5, color: BRAND, after: 8 });
      } else if (b.type === "paragraph") {
        para(b.text);
      } else if (b.type === "bullets") {
        doc.font("Helvetica").fontSize(10).fillColor("#222222");
        for (const it of b.items) {
          const h = doc.heightOfString(it, { width: CW - 14, lineGap: 2 });
          ensure(h);
          doc.text("\u2022", M, y, { width: 10 });
          doc.text(it, M + 14, y, { width: CW - 14, lineGap: 2 });
          y = doc.y + 4;
        }
        y += 8;
      } else if (b.type === "ctc_table") {
        const rowH = 20;
        ensure(18 + rowH * b.rows.length + 8);
        doc.font("Helvetica-Bold").fontSize(10.5).fillColor(BRAND).text("ANNEXURE A - COMPENSATION STRUCTURE (ANNUAL)", M, y);
        y += 18;
        const col1 = CW * 0.65;
        b.rows.forEach((r, i) => {
          const isHeader = i === 0;
          const isTotal = i === b.rows.length - 1;
          if (isHeader) doc.rect(M, y, CW, rowH).fill(BRAND);
          else if (isTotal) doc.rect(M, y, CW, rowH).fill("#e9e2cf");
          else if (i % 2 === 0) doc.rect(M, y, CW, rowH).fill(LIGHT);
          doc.font(isHeader || isTotal ? "Helvetica-Bold" : "Helvetica").fontSize(9.5).fillColor(isHeader ? "#ffffff" : "#222222");
          doc.text(r[0], M + 8, y + 5.5, { width: col1 - 16 });
          doc.text(r[1], M + col1, y + 5.5, { width: CW - col1 - 8, align: "right" });
          y += rowH;
        });
        y += 16;
      } else if (b.type === "terms") {
        ensure(40);
        doc.font("Helvetica-Bold").fontSize(10.5).fillColor(BRAND).text("KEY TERMS OF EMPLOYMENT", M, y);
        y += 16;
        doc.font("Helvetica").fontSize(9.5).fillColor("#222222");
        b.items.forEach((t, i) => {
          const line = `${i + 1}. ${t}`;
          const h = doc.heightOfString(line, { width: CW, lineGap: 2 });
          ensure(h);
          doc.text(line, M, y, { width: CW, lineGap: 2 });
          y = doc.y + 6;
        });
        y += 6;
      }
    }

    // ---------- SIGNATURE + ACCEPTANCE ----------
    ensure(190);
    y += 6;
    doc.font("Helvetica").fontSize(10).fillColor("#222222").text("Sincerely,", M, y);
    y += 34;
    doc.font("Helvetica-Bold").text(hr, M, y);
    y += 13;
    doc.font("Helvetica").fontSize(9.5).fillColor("#555555").text(`Human Resources, ${company}`, M, y);

    y += 34;
    doc.rect(M, y, CW, 92).lineWidth(1).stroke("#cccccc");
    doc.font("Helvetica-Bold").fontSize(10).fillColor(BRAND).text("CANDIDATE ACCEPTANCE", M + 12, y + 10);
    doc.font("Helvetica").fontSize(9.5).fillColor("#222222");
    doc.text("I have read and understood the terms above and accept this offer of employment.", M + 12, y + 28, { width: CW - 24 });
    doc.text("Signature: ____________________________", M + 12, y + 54);
    doc.text("Date: ______________________", M + 300, y + 54);

    footer();
    doc.end();
  } catch (err) {
    console.error("Offer letter error:", err);
    if (!res.headersSent) res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ------------------------------------------------------------------ */
/* Templates CRUD                                                      */
/* ------------------------------------------------------------------ */

export const getOfferLetterTemplatesController = async (req, res) => {
  try {
    const [templates] = await db.query(`SELECT * FROM offer_letter_templates ORDER BY id DESC`);
    res.json({ success: true, data: templates, meta: { placeholders: PLACEHOLDERS, defaultBody: DEFAULT_BODY } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch templates" });
  }
};

const templateFields = (b) => ({
  templateName: safe(b.templateName).trim(),
  companyName: safe(b.companyName).trim(),
  hrName: safe(b.hrName).trim(),
  location: safe(b.location).trim(),
  terms: safe(b.terms).trim(),
  body: safe(b.body).trim() || DEFAULT_BODY,
  includeCtc: b.includeCtc === undefined ? 1 : b.includeCtc ? 1 : 0,
});

export const saveOfferLetterTemplateController = async (req, res) => {
  try {
    const t = templateFields(req.body);
    if (!t.templateName || !t.companyName) {
      return res.status(400).json({ success: false, message: "Template name and company name are required" });
    }
    const [result] = await db.query(
      `INSERT INTO offer_letter_templates (template_name, company_name, hr_name, location, terms, body, include_ctc) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [t.templateName, t.companyName, t.hrName, t.location, t.terms, t.body, t.includeCtc],
    );
    res.json({ success: true, message: "Template saved successfully", data: { id: result.insertId } });
  } catch (err) {
    console.error("Save offer template error:", err);
    res.status(500).json({ success: false, message: "Failed to save template" });
  }
};

export const updateOfferLetterTemplateController = async (req, res) => {
  try {
    const t = templateFields(req.body);
    if (!t.templateName || !t.companyName) {
      return res.status(400).json({ success: false, message: "Template name and company name are required" });
    }
    const [result] = await db.query(
      `UPDATE offer_letter_templates SET template_name = ?, company_name = ?, hr_name = ?, location = ?, terms = ?, body = ?, include_ctc = ? WHERE id = ?`,
      [t.templateName, t.companyName, t.hrName, t.location, t.terms, t.body, t.includeCtc, req.params.id],
    );
    if (!result.affectedRows) return res.status(404).json({ success: false, message: "Template not found" });
    res.json({ success: true, message: "Template updated successfully" });
  } catch (err) {
    console.error("Update offer template error:", err);
    res.status(500).json({ success: false, message: "Failed to update template" });
  }
};

export const getOfferLettersController = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM offer_letters ORDER BY id DESC");
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch offer letters" });
  }
};

export const deleteOfferLetterTemplateController = async (req, res) => {
  try {
    const [result] = await db.query("DELETE FROM offer_letter_templates WHERE id = ?", [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Template not found" });
    res.json({ success: true, message: "Template deleted successfully" });
  } catch (err) {
    console.error("Delete offer letter template error:", err);
    res.status(500).json({ success: false, message: "Failed to delete template" });
  }
};

export const deleteOfferLetterController = async (req, res) => {
  try {
    const [result] = await db.query("DELETE FROM offer_letters WHERE id = ?", [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Offer letter not found" });
    res.json({ success: true, message: "Offer letter deleted successfully" });
  } catch (err) {
    console.error("Delete offer letter error:", err);
    res.status(500).json({ success: false, message: "Failed to delete offer letter" });
  }
};
