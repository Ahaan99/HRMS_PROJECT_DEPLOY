import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, ShadingType, BorderStyle,
} from "docx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOPS_DIR = path.join(__dirname, "..", "uploads", "sops");

const BRAND = "1A2B4A";
const ACCENT = "C8A24A";
const LIGHT = "F4F6FA";

const FILES = [
  { txt: "client-leave-policy-template.txt", docx: "Leave-Policy-SOP-Template.docx", title: "Leave Policy SOP" },
  { txt: "client-recruitment-sop-template.txt", docx: "Recruitment-SOP-Template.docx", title: "Recruitment SOP" },
  { txt: "client-onboarding-sop-template.txt", docx: "Employee-Onboarding-SOP-Template.docx", title: "Employee Onboarding SOP" },
  { txt: "client-payroll-attendance-sop-template.txt", docx: "Payroll-Attendance-SOP-Template.docx", title: "Payroll & Attendance SOP" },
  { txt: "client-performance-sop-template.txt", docx: "Performance-Management-SOP-Template.docx", title: "Performance Management SOP" },
];

const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const thinBorder = { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" };

function makeTable(rows) {
  const cols = Math.max(...rows.map((r) => r.length));
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map((cells, ri) => {
      const isHead = ri === 0;
      const padded = [...cells];
      while (padded.length < cols) padded.push("");
      return new TableRow({
        tableHeader: isHead,
        children: padded.map((c) =>
          new TableCell({
            borders: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder },
            shading: isHead
              ? { type: ShadingType.CLEAR, fill: BRAND }
              : ri % 2 === 0
                ? { type: ShadingType.CLEAR, fill: LIGHT }
                : undefined,
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: c,
                    bold: isHead,
                    color: isHead ? "FFFFFF" : "222222",
                    size: 18,
                    font: "Calibri",
                  }),
                ],
              }),
            ],
          })
        ),
      });
    }),
  });
}

function convert({ txt, docx, title }) {
  const raw = fs.readFileSync(path.join(SOPS_DIR, txt), "utf8");
  const lines = raw.split(/\r?\n/);
  const children = [];

  // Title block
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      shading: { type: ShadingType.CLEAR, fill: BRAND },
      spacing: { before: 0, after: 40 },
      children: [new TextRun({ text: title, bold: true, color: "FFFFFF", size: 40, font: "Calibri" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      shading: { type: ShadingType.CLEAR, fill: BRAND },
      spacing: { after: 240 },
      children: [
        new TextRun({
          text: "EDITABLE SAMPLE FORMAT - STANDARD OPERATING PROCEDURE",
          bold: true, color: ACCENT, size: 16, font: "Calibri",
        }),
      ],
    })
  );

  let i = 0;
  while (i < lines.length) {
    const trimmed = lines[i].trim();

    if (/^=+$/.test(trimmed)) { i++; continue; }
    if (i < 6 && (trimmed === "" || /^[A-Z\[\] &'-]+$/.test(trimmed))) { i++; continue; }
    if (/^-{10,}$/.test(trimmed)) { i++; continue; }
    if (trimmed === "--- END OF DOCUMENT ---") { i++; continue; }
    if (trimmed.startsWith("(Replace all")) {
      children.push(
        new Paragraph({
          spacing: { before: 240 },
          children: [new TextRun({ text: trimmed, italics: true, color: "888888", size: 16, font: "Calibri" })],
        })
      );
      i++; continue;
    }
    if (trimmed === "") { i++; continue; }

    // Table block
    if (trimmed.startsWith("|")) {
      const tbl = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        const cells = lines[i].trim().split("|").slice(1, -1).map((c) => c.trim());
        if (!cells.every((c) => /^-*$/.test(c))) tbl.push(cells);
        i++;
      }
      if (tbl.length) {
        children.push(makeTable(tbl));
        children.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
      }
      continue;
    }

    // Section heading
    if (/^(\d+\.\s+[A-Z]|DOCUMENT CONTROL|REVISION HISTORY)/.test(trimmed) && trimmed === trimmed.toUpperCase()) {
      children.push(
        new Paragraph({
          spacing: { before: 280, after: 120 },
          shading: { type: ShadingType.CLEAR, fill: LIGHT },
          border: { left: { style: BorderStyle.SINGLE, size: 24, color: ACCENT } },
          children: [new TextRun({ text: trimmed, bold: true, color: BRAND, size: 22, font: "Calibri" })],
        })
      );
      i++; continue;
    }

    // Key : value line
    if (/^[A-Za-z ()/&-]+\s+:\s/.test(trimmed)) {
      const idx = trimmed.indexOf(":");
      children.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({ text: trimmed.slice(0, idx).trim() + ":  ", bold: true, size: 18, color: "333333", font: "Calibri" }),
            new TextRun({ text: trimmed.slice(idx + 1).trim(), size: 18, color: "222222", font: "Calibri" }),
          ],
        })
      );
      i++; continue;
    }

    // Regular paragraph
    children.push(
      new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({ text: trimmed, size: 19, color: "222222", font: "Calibri" })],
      })
    );
    i++;
  }

  const doc = new Document({
    creator: "HRMS SOP Library",
    title,
    sections: [{ properties: {}, children }],
  });

  return Packer.toBuffer(doc).then((buf) => {
    fs.writeFileSync(path.join(SOPS_DIR, docx), buf);
    return docx;
  });
}

for (const f of FILES) {
  const name = await convert(f);
  console.log("Generated:", name);
}
console.log("Done.");
