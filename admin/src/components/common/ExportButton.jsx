import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { Download, ChevronDown, FileDown, FileSpreadsheet, FileText } from "lucide-react";
import { exportCSV, exportExcel, exportPDF } from "../../utils/exportUtils";

/**
 * Reusable "Export data" button with CSV / Excel / PDF formats.
 * The dropdown renders in a portal (document.body) so it can never be
 * clipped by parents with overflow-hidden (e.g. rounded hero banners).
 *
 * @param {Array<Object>} data      Rows to export (usually the filtered list)
 * @param {string}        filename  Base file name, e.g. "employees"
 * @param {Array<string>} exclude   Keys to exclude from the export
 * @param {string}        label     Button label
 */
export default function ExportButton({
  data = [],
  filename = "export",
  exclude = [],
  label = "Export",
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const disabled = !Array.isArray(data) || data.length === 0;

  const MENU_W = 176; // w-44

  const place = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    // right-align to the button, clamp inside the viewport (mobile safety)
    let left = r.right - MENU_W;
    left = Math.max(8, Math.min(left, window.innerWidth - MENU_W - 8));
    setPos({ top: r.bottom + 6, left });
  };

  useLayoutEffect(() => {
    if (open) place();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (btnRef.current?.contains(e.target)) return;
      if (menuRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onMove = () => place();
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close);
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [open]);

  const cleanRows = () => {
    if (!exclude?.length) return data;
    return data.map((row) => {
      const copy = { ...row };
      for (const k of exclude) delete copy[k];
      return copy;
    });
  };

  const run = (fn) => {
    setOpen(false);
    fn(cleanRows(), filename, null, filename.replace(/[-_]/g, " "));
  };

  const itemCls =
    "w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 text-left";

  return (
    <div className={"relative inline-block " + className}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        title={
          disabled
            ? "No data to export"
            : `Export ${data.length} row${data.length === 1 ? "" : "s"}`
        }
        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-white text-[#33405c] shadow-[inset_0_0_0_1px_#e6e9f0] hover:bg-[#f7f8fb] hover:text-[#0b1220] active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
      >
        <Download size={16} />
        {label}
        <ChevronDown size={14} className={open ? "rotate-180 transition" : "transition"} />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: "fixed", top: pos.top, left: pos.left, width: MENU_W }}
            className="bg-white border border-[#e6e9f0] rounded-xl shadow-[0_8px_24px_rgba(11,18,32,0.10)] overflow-hidden z-[9999]"
          >
            <button type="button" className={itemCls} onClick={() => run(exportCSV)}>
              <FileDown size={15} className="text-gray-500" /> CSV
            </button>
            <button type="button" className={itemCls} onClick={() => run(exportExcel)}>
              <FileSpreadsheet size={15} className="text-emerald-600" /> Excel (.xlsx)
            </button>
            <button type="button" className={itemCls} onClick={() => run(exportPDF)}>
              <FileText size={15} className="text-red-500" /> PDF (print)
            </button>
          </div>,
          document.body,
        )}
    </div>
  );
}
