/**
 * Universal export utilities used by <ExportButton/> on every admin list page.
 *   exportCSV   -> UTF-8 CSV (BOM so Excel renders ₹ / Unicode names correctly)
 *   exportExcel -> real Office Open XML workbook (.xlsx) built with SheetJS
 *   exportPDF   -> print dialog (Save as PDF) rendered in a hidden iframe (no popup blocker)
 *
 * rows: array of plain objects; columns: [{ key, label }] (optional - derived from the rows).
 */
import * as XLSX from "xlsx";
import toast from "react-hot-toast";

const humanise = (k) =>
  k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

// Union of keys across all rows (the first row may be missing optional fields).
const deriveColumns = (rows, columns) => {
  if (columns) return columns;
  const keys = new Set();
  for (const r of rows) for (const k of Object.keys(r || {})) keys.add(k);
  return [...keys].map((k) => ({ key: k, label: humanise(k) }));
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/;

/**
 * Normalise a raw value into something a spreadsheet understands.
 * Numbers stay numbers (so SUM works), booleans become Yes/No, ISO strings become
 * real Date cells, objects/arrays are flattened to readable text.
 */
const toCell = (v) => {
  if (v === null || v === undefined) return "";
  if (typeof v === "number" || typeof v === "boolean") return typeof v === "boolean" ? (v ? "Yes" : "No") : v;
  if (v instanceof Date) return isNaN(v) ? "" : v;
  if (typeof v === "string") {
    const s = v.trim();
    if (s !== "" && /^-?\d+(\.\d+)?$/.test(s) && s.length < 16 && !/^0\d/.test(s)) return Number(s);
    if (ISO_DATE.test(s)) {
      const d = new Date(s);
      if (!isNaN(d)) return d;
    }
    return v;
  }
  if (Array.isArray(v)) return v.map((x) => (typeof x === "object" && x !== null ? JSON.stringify(x) : String(x))).join(", ");
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
};

const toText = (v) => {
  const c = toCell(v);
  if (c instanceof Date) return c.toISOString().slice(0, 19).replace("T", " ");
  return String(c);
};

const download = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const safeName = (name) => String(name || "export").replace(/[\\/:*?"<>|]+/g, "-").trim() || "export";
const stamp = () => new Date().toISOString().slice(0, 10);

export const exportCSV = (rows, filename = "export", columns = null) => {
  if (!rows?.length) return toast.error("Nothing to export");
  const cols = deriveColumns(rows, columns);
  const esc = (s) => `"${String(s).replace(/"/g, '""')}"`;
  const lines = [
    cols.map((c) => esc(c.label)).join(","),
    ...rows.map((r) => cols.map((c) => esc(toText(r[c.key]))).join(",")),
  ];
  download(
    new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" }),
    `${safeName(filename)}-${stamp()}.csv`,
  );
  toast.success(`Exported ${rows.length} rows to CSV`);
};

export const exportExcel = (rows, filename = "export", columns = null, title = "") => {
  if (!rows?.length) return toast.error("Nothing to export");
  const cols = deriveColumns(rows, columns);

  const aoa = [
    cols.map((c) => c.label),
    ...rows.map((r) => cols.map((c) => toCell(r[c.key]))),
  ];
  const ws = XLSX.utils.aoa_to_sheet(aoa, { cellDates: true, dateNF: "yyyy-mm-dd hh:mm" });

  // Column widths from the longest value (capped so one long note doesn't blow up the sheet).
  ws["!cols"] = cols.map((c, i) => {
    let max = String(c.label).length;
    for (const row of aoa.slice(1)) {
      const v = row[i];
      const len = v instanceof Date ? 16 : String(v ?? "").length;
      if (len > max) max = len;
    }
    return { wch: Math.min(Math.max(max + 2, 8), 60) };
  });
  ws["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: 0, c: cols.length - 1 } }) };

  const wb = XLSX.utils.book_new();
  const sheetName = (title || humanise(filename)).slice(0, 31).replace(/[\\/?*[\]:]/g, " ") || "Sheet1";
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  wb.Props = { Title: title || humanise(filename), CreatedDate: new Date() };

  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array", cellDates: true });
  download(
    new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    `${safeName(filename)}-${stamp()}.xlsx`,
  );
  toast.success(`Exported ${rows.length} rows to Excel`);
};

export const exportPDF = (rows, filename = "export", columns = null, title = "") => {
  if (!rows?.length) return toast.error("Nothing to export");
  const cols = deriveColumns(rows, columns);
  const escHtml = (s) =>
    String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const heading = escHtml(title || humanise(filename));
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${heading}</title>
    <style>
      body { font-family: Arial, Helvetica, sans-serif; padding: 24px; color: #111; }
      h1 { font-size: 18px; margin: 0 0 4px; }
      p.meta { font-size: 11px; color: #777; margin: 0 0 16px; }
      table { width: 100%; border-collapse: collapse; font-size: 11px; }
      th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; vertical-align: top; word-break: break-word; }
      th { background: #f4f4f4; }
      tr:nth-child(even) td { background: #fafafa; }
      thead { display: table-header-group; }
      tr { page-break-inside: avoid; }
      @page { margin: 12mm; size: ${cols.length > 7 ? "landscape" : "portrait"}; }
    </style></head><body>
    <h1>${heading}</h1>
    <p class="meta">Generated ${escHtml(new Date().toLocaleString())} &middot; ${rows.length} records</p>
    <table><thead><tr>${cols.map((c) => `<th>${escHtml(c.label)}</th>`).join("")}</tr></thead>
    <tbody>${rows
      .map((r) => `<tr>${cols.map((c) => `<td>${escHtml(toText(r[c.key]))}</td>`).join("")}</tr>`)
      .join("")}</tbody></table>
    </body></html>`;

  // A hidden same-origin iframe prints without tripping popup blockers.
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;";
  document.body.appendChild(frame);
  const doc = frame.contentDocument || frame.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();
  const cleanup = () => setTimeout(() => frame.remove(), 500);
  frame.contentWindow.onafterprint = cleanup;
  setTimeout(() => {
    try {
      frame.contentWindow.focus();
      frame.contentWindow.print();
    } catch {
      cleanup();
      toast.error("Could not open the print dialog");
    }
    // Fallback cleanup for browsers that never fire onafterprint.
    setTimeout(cleanup, 60000);
  }, 250);
};
