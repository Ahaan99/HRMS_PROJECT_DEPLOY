import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const PAGE = { w: 595.28, h: 841.89, margin: 48 };
const INK = rgb(0.1, 0.12, 0.18);
const MUTED = rgb(0.42, 0.45, 0.52);
const LINE = rgb(0.85, 0.87, 0.9);
const ACCENT = rgb(0.31, 0.27, 0.9);

const money = (n, cur = "INR") =>
  `${cur === "INR" ? "Rs. " : cur + " "}${Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const fmtDate = (d) => {
  if (!d) return "-";
  const x = new Date(d);
  return isNaN(x) ? "-" : x.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

// pdf-lib's standard fonts are WinAnsi only; strip anything they cannot encode.
const safe = (s) => String(s ?? "").replace(/[^\x20-\x7E\u00A0-\u00FF]/g, "");

const wrap = (font, text, size, maxWidth) => {
  const words = safe(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) cur = next;
    else {
      if (cur) lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [""];
};

export async function buildProposalPdf(p) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const cur = p.currency || "INR";
  const items = Array.isArray(p.items) ? p.items : [];

  let page = doc.addPage([PAGE.w, PAGE.h]);
  let y = PAGE.h - PAGE.margin;
  const x0 = PAGE.margin;
  const width = PAGE.w - PAGE.margin * 2;

  const newPage = () => {
    page = doc.addPage([PAGE.w, PAGE.h]);
    y = PAGE.h - PAGE.margin;
  };
  const ensure = (h) => {
    if (y - h < PAGE.margin + 30) newPage();
  };
  const text = (t, { size = 10, f = font, color = INK, x = x0, align = "left", w = width } = {}) => {
    const s = safe(t);
    const tw = f.widthOfTextAtSize(s, size);
    const tx = align === "right" ? x + w - tw : align === "center" ? x + (w - tw) / 2 : x;
    page.drawText(s, { x: tx, y, size, font: f, color });
  };
  const para = (t, { size = 10, f = font, color = INK, w = width, gap = 4 } = {}) => {
    for (const line of wrap(f, t, size, w)) {
      ensure(size + gap);
      text(line, { size, f, color, w });
      y -= size + gap;
    }
  };
  const rule = () => {
    ensure(12);
    page.drawLine({ start: { x: x0, y }, end: { x: x0 + width, y }, thickness: 0.8, color: LINE });
    y -= 12;
  };
  const heading = (t) => {
    ensure(28);
    y -= 6;
    text(t.toUpperCase(), { size: 9, f: bold, color: ACCENT });
    y -= 14;
  };

  // Header band
  page.drawRectangle({ x: 0, y: PAGE.h - 110, width: PAGE.w, height: 110, color: ACCENT });
  page.drawText("PROPOSAL", { x: x0, y: PAGE.h - 52, size: 22, font: bold, color: rgb(1, 1, 1) });
  page.drawText(safe(p.proposal_number || ""), { x: x0, y: PAGE.h - 72, size: 11, font, color: rgb(0.9, 0.9, 1) });
  const st = safe(p.status || "");
  const stw = bold.widthOfTextAtSize(st, 10);
  page.drawText(st, { x: x0 + width - stw, y: PAGE.h - 52, size: 10, font: bold, color: rgb(1, 1, 1) });
  const dt = `Issued ${fmtDate(p.sent_at || p.created_at)}   |   Valid until ${fmtDate(p.valid_until)}`;
  const dtw = font.widthOfTextAtSize(dt, 9);
  page.drawText(dt, { x: x0 + width - dtw, y: PAGE.h - 72, size: 9, font, color: rgb(0.9, 0.9, 1) });
  y = PAGE.h - 140;

  // Parties
  text("PREPARED FOR", { size: 8, f: bold, color: MUTED });
  y -= 14;
  text(p.client_company || p.client_name || "-", { size: 13, f: bold });
  y -= 16;
  if (p.client_company && p.client_name) {
    text(p.client_name, { size: 10, color: MUTED });
    y -= 13;
  }
  for (const line of [p.client_email, p.client_phone, p.client_code ? `Client code: ${p.client_code}` : null].filter(Boolean)) {
    text(line, { size: 9, color: MUTED });
    y -= 12;
  }
  y -= 6;
  rule();

  // Title / intro
  para(p.title || "Proposal", { size: 15, f: bold, gap: 6 });
  if (p.intro) {
    y -= 2;
    para(p.intro, { size: 10, color: MUTED });
  }

  // Line items
  heading("Scope & pricing");
  const cols = { desc: x0, qty: x0 + width - 190, rate: x0 + width - 120, amt: x0 + width - 60 };
  ensure(20);
  text("Description", { size: 8, f: bold, color: MUTED });
  text("Qty", { size: 8, f: bold, color: MUTED, x: cols.qty, w: 40, align: "right" });
  text("Rate", { size: 8, f: bold, color: MUTED, x: cols.rate, w: 55, align: "right" });
  text("Amount", { size: 8, f: bold, color: MUTED, x: cols.amt, w: 60, align: "right" });
  y -= 8;
  rule();
  for (const it of items) {
    const qty = Number(it.qty ?? it.quantity ?? 1);
    const rate = Number(it.rate ?? it.price ?? it.unit_price ?? 0);
    const amt = Number(it.amount ?? qty * rate);
    const descLines = wrap(font, it.name || it.description || it.title || "-", 10, width - 200);
    ensure(descLines.length * 13 + 8);
    const top = y;
    for (const l of descLines) {
      text(l, { size: 10 });
      y -= 13;
    }
    if (it.description && it.name) {
      for (const l of wrap(font, it.description, 8.5, width - 200)) {
        ensure(12);
        text(l, { size: 8.5, color: MUTED });
        y -= 11;
      }
    }
    const rowY = y;
    y = top;
    text(String(qty), { size: 10, x: cols.qty, w: 40, align: "right" });
    text(money(rate, cur), { size: 10, x: cols.rate, w: 55, align: "right" });
    text(money(amt, cur), { size: 10, f: bold, x: cols.amt, w: 60, align: "right" });
    y = rowY - 4;
    page.drawLine({ start: { x: x0, y }, end: { x: x0 + width, y }, thickness: 0.4, color: LINE });
    y -= 8;
  }

  // Totals
  const totals = [
    ["Subtotal", money(p.subtotal, cur)],
    Number(p.discount_pct) > 0 ? [`Discount (${Number(p.discount_pct)}%)`, `- ${money(p.discount_amount, cur)}`] : null,
    Number(p.tax_pct) > 0 ? [`Tax (${Number(p.tax_pct)}%)`, money(p.tax_amount, cur)] : null,
  ].filter(Boolean);
  ensure(totals.length * 14 + 40);
  y -= 2;
  for (const [k, v] of totals) {
    text(k, { size: 10, color: MUTED, x: x0 + width - 220, w: 130, align: "right" });
    text(v, { size: 10, x: x0 + width - 80, w: 80, align: "right" });
    y -= 14;
  }
  y -= 4;
  page.drawRectangle({ x: x0 + width - 230, y: y - 8, width: 230, height: 26, color: rgb(0.95, 0.95, 1) });
  text("TOTAL", { size: 9, f: bold, color: ACCENT, x: x0 + width - 222, w: 100 });
  text(money(p.total, cur), { size: 12, f: bold, color: ACCENT, x: x0 + width - 88, w: 80, align: "right" });
  y -= 30;

  // Commercial terms
  const facts = [
    Number(p.token_amount) > 0 ? ["Token amount", money(p.token_amount, cur)] : null,
    p.agreement_months ? ["Agreement period", `${p.agreement_months} months`] : null,
    p.replacement_months ? ["Replacement guarantee", `${p.replacement_months} months`] : null,
  ].filter(Boolean);
  if (facts.length) {
    heading("Commercial terms");
    for (const [k, v] of facts) {
      ensure(14);
      text(k, { size: 10, color: MUTED });
      text(v, { size: 10, f: bold, x: x0 + 200, w: width - 200 });
      y -= 14;
    }
  }
  if (p.terms) {
    heading("Terms & conditions");
    for (const line of String(p.terms).split(/\r?\n/).filter((l) => l.trim())) {
      para(line.trim(), { size: 9, color: MUTED, gap: 3 });
    }
  }
  if (p.notes) {
    heading("Notes");
    para(p.notes, { size: 9, color: MUTED, gap: 3 });
  }
  if (p.status === "ACCEPTED" || p.status === "REJECTED") {
    heading(`Client response - ${p.status.toLowerCase()}`);
    para(`Responded on ${fmtDate(p.responded_at)}${p.response_note ? `: ${p.response_note}` : ""}`, { size: 9, color: MUTED });
  }

  // Footer on every page
  const pages = doc.getPages();
  pages.forEach((pg, i) => {
    const foot = `${safe(p.proposal_number || "")}  |  Page ${i + 1} of ${pages.length}`;
    const fw = font.widthOfTextAtSize(foot, 8);
    pg.drawText(foot, { x: (PAGE.w - fw) / 2, y: 24, size: 8, font, color: MUTED });
  });

  return doc.save();
}
