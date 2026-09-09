function ExportBar({ filename, rows, columns }) {
  const exportCSV = () => {
    if (!rows || rows.length === 0) return;

    const header = columns.map((c) => `"${c.label}"`).join(",");

    const lines = rows.map((row) =>
      columns
        .map((c) => {
          const val = row[c.key];
          const s = val === null || val === undefined ? "" : String(val);
          return `"${s.replace(/"/g, '""')}"`;
        })
        .join(",")
    );

    // BOM so Excel detects UTF-8 (Unicode names / ₹ otherwise show as mojibake).
    const blob = new Blob(["\uFEFF" + header + "\r\n" + lines.join("\r\n")], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="export-bar">
      <span className="spacer" />
      <button
        type="button"
        className="btn-outline"
        onClick={exportCSV}
        disabled={!rows || rows.length === 0}
      >
        &#8681; Export CSV
      </button>
      <button
        type="button"
        className="btn-outline"
        onClick={() => window.print()}
      >
        &#128424; Print / PDF
      </button>
    </div>
  );
}

export default ExportBar;
