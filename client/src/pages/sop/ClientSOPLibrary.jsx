import { useEffect, useMemo, useState } from "react";
import { BookOpen, Download, FileText, Loader2 } from "lucide-react";
import API from "../../services/api";

const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || "").replace(
  /\/api\/?$/,
  "",
);

export default function ClientSOPLibrary() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dept, setDept] = useState("");

  useEffect(() => {
    API.get("/sops/client-library")
      .then((res) => setRows(Array.isArray(res.data) ? res.data : []))
      .catch(() => setError("Failed to load SOP library"))
      .finally(() => setLoading(false));
  }, []);

  const departments = useMemo(
    () => [...new Set(rows.map((r) => r.department))].sort(),
    [rows],
  );

  const filtered = dept ? rows.filter((r) => r.department === dept) : rows;

  const [downloadingId, setDownloadingId] = useState(null);

  const handleDownload = async (sop, format = "pdf") => {
    if (!sop.file_url) return;
    setDownloadingId(sop.id + "-" + format);
    try {
      const fileUrl =
        format === "docx"
          ? sop.file_url.replace(/\.pdf$/i, ".docx")
          : sop.file_url;
      const fileName =
        format === "docx"
          ? (sop.file_name || sop.title + ".pdf").replace(/\.pdf$/i, ".docx")
          : sop.file_name || sop.title.replace(/[^a-z0-9]+/gi, "-") + ".pdf";
      const res = await fetch(API_ORIGIN + fileUrl);
      if (!res.ok) throw new Error("File not found");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("Download failed. Please try again.");
      setTimeout(() => setError(""), 4000);
    } finally {
      setDownloadingId(null);
    }
  };

  const grouped = useMemo(() => {
    const g = {};
    for (const r of filtered) {
      (g[r.department] = g[r.department] || []).push(r);
    }
    return g;
  }, [filtered]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-100 ring-1 ring-indigo-100 flex items-center justify-center shrink-0">
            <BookOpen className="text-indigo-600" size={20} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 text-balance">
              SOP Library
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Sample editable SOP formats for your HR team. Download and adapt
              them to your organisation.
            </p>
          </div>
        </div>

        <select
          value={dept}
          onChange={(e) => setDept(e.target.value)}
          className="self-start sm:self-auto px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-colors text-slate-700"
          aria-label="Filter by department"
        >
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="card-premium p-5 h-48 animate-pulse bg-slate-50"
            />
          ))}
        </div>
      ) : error ? (
        <div className="card-premium py-14 text-center">
          <p className="font-semibold text-rose-600">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-premium py-14">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="p-4 rounded-2xl bg-slate-50 ring-1 ring-slate-100">
              <BookOpen className="w-8 h-8 text-slate-300" />
            </div>
            <div>
              <p className="font-semibold text-slate-700">
                No sample SOP formats published yet
              </p>
              <p className="text-sm text-slate-400 mt-0.5">
                Check back soon for new templates
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([department, sops]) => (
            <section key={department}>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  {department}
                </h2>
                <div className="h-px flex-1 bg-slate-200" />
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[11px] font-semibold">
                  {sops.length} {sops.length === 1 ? "SOP" : "SOPs"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {sops.map((sop) => (
                  <div
                    key={sop.id}
                    className="card-premium group relative overflow-hidden p-5 flex flex-col gap-3.5 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-900/10 transition-all"
                  >
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="flex items-start gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-100 ring-1 ring-indigo-100 flex items-center justify-center shrink-0">
                        <FileText className="text-indigo-600" size={19} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold tracking-tight text-slate-900 leading-snug text-pretty">
                          {sop.title}
                        </h3>
                        <p className="text-[11px] font-medium text-slate-400 mt-1">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono font-bold">
                            v{sop.current_version}
                          </span>{" "}
                          · {new Date(sop.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {sop.description && (
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                        {sop.description}
                      </p>
                    )}

                    <div className="mt-auto flex gap-2.5 pt-1">
                      <button
                        onClick={() => handleDownload(sop, "pdf")}
                        disabled={
                          !sop.file_url || downloadingId === sop.id + "-pdf"
                        }
                        className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/20 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        {downloadingId === sop.id + "-pdf" ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Download size={13} />
                        )}
                        {downloadingId === sop.id + "-pdf"
                          ? "Downloading..."
                          : "PDF"}
                      </button>
                      <button
                        onClick={() => handleDownload(sop, "docx")}
                        disabled={
                          !sop.file_url || downloadingId === sop.id + "-docx"
                        }
                        className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2.5 rounded-xl ring-1 ring-indigo-200 bg-indigo-50/60 text-indigo-700 hover:bg-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        {downloadingId === sop.id + "-docx" ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <FileText size={13} />
                        )}
                        {downloadingId === sop.id + "-docx"
                          ? "Downloading..."
                          : "Word (editable)"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
