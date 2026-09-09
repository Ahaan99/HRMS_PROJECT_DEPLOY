import * as XLSX from "xlsx";

/**
 * Download `rows` as an .xlsx file.
 * `columns` = [{ key, label }] controls order and header text; when omitted,
 * every key of the first row is exported as-is.
 */
export function exportToExcel({ rows, columns, fileName, sheetName = "Sheet1" }) {
  if (!rows?.length) return false;

  const cols = columns?.length ? columns : Object.keys(rows[0]).map((key) => ({ key, label: key }));
  const data = rows.map((row) =>
    Object.fromEntries(cols.map(({ key, label, format }) => [label, format ? format(row[key], row) : row[key] ?? ""])),
  );

  const sheet = XLSX.utils.json_to_sheet(data);
  sheet["!cols"] = cols.map(({ label }) => ({
    wch: Math.min(40, Math.max(label.length, ...data.map((r) => String(r[label] ?? "").length)) + 2),
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, sheetName);
  XLSX.writeFile(wb, fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`);
  return true;
}
