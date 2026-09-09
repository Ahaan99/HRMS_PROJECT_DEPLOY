import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Upload,
  Download,
  Trash2,
  X,
  FileVideo,
  FileText,
  FileArchive,
  Loader2,
} from "lucide-react";
import API from "../../api/axios";
import HRNavbar from "../../components/hr/HRNavbar";

const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || "").replace(
  /\/api\/?$/,
  "",
);

const TYPE_CONFIG = {
  video: {
    title: "Video Documentation",
    subtitle: "Upload and share walkthroughs, demos, and training videos",
    accept: ".mp4,.webm,.mkv,.avi,.mov",
    hint: "MP4 / WEBM / MKV / AVI / MOV — max 500MB",
    maxMB: 500,
    Icon: FileVideo,
  },
  project_report: {
    title: "Project Reports",
    subtitle: "Upload project report documents (PDF or Word)",
    accept: ".pdf,.doc,.docx",
    hint: "PDF / DOC / DOCX — max 200MB",
    maxMB: 200,
    Icon: FileText,
  },
  source_code: {
    title: "Source Code",
    subtitle: "Upload zipped source code archives",
    accept: ".zip,.rar,.7z",
    hint: "ZIP / RAR / 7Z — max 500MB",
    maxMB: 500,
    Icon: FileArchive,
  },
};

const fmtSize = (bytes) => {
  if (!bytes) return "—";
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? mb.toFixed(1) + " MB" : (bytes / 1024).toFixed(0) + " KB";
};

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

async function downloadFile(url, name) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Download failed");
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name || "file";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  } catch {
    toast.error("Download failed");
  }
}

export default function Deliverables({ type }) {
  const cfg = TYPE_CONFIG[type];
  const { Icon } = cfg;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get("/it-deliverables", { params: { type } });
      setItems(res.data?.data || []);
    } catch {
      toast.error("Failed to load items");
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    load();
  }, [load]);

  const onPickFile = (f) => {
    if (!f) return setFile(null);
    if (f.size > cfg.maxMB * 1024 * 1024) {
      toast.error(`File too large — max ${cfg.maxMB}MB`);
      return;
    }
    setFile(f);
  };

  const submit = async () => {
    if (!title.trim()) return toast.error("Enter a title");
    if (!file) return toast.error("Attach a file");
    setSaving(true);
    try {
      const fd = new FormData();
      // NOTE: type/title/description MUST be appended before the file so
      // multer's fileFilter can read req.body.type during streaming.
      fd.append("type", type);
      fd.append("title", title.trim());
      fd.append("description", description.trim());
      fd.append("file", file);
      await API.post("/it-deliverables", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Uploaded");
      setShowModal(false);
      setTitle("");
      setDescription("");
      setFile(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this item permanently?")) return;
    try {
      await API.delete(`/it-deliverables/${id}`);
      toast.success("Deleted");
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <HRNavbar />
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        {/* header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow">
              <Icon size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{cfg.title}</h1>
              <p className="text-sm text-gray-500">{cfg.subtitle}</p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            <Upload size={16} />
            Upload
          </button>
        </div>

        {/* list */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-gray-400">
              <Loader2 size={18} className="animate-spin" />
              Loading…
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                <Icon size={26} />
              </div>
              <p className="text-sm font-medium text-gray-600">
                Nothing uploaded yet
              </p>
              <p className="text-xs text-gray-400">
                Click Upload to add the first item
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                    <th className="px-5 py-3 font-semibold">Title</th>
                    <th className="px-5 py-3 font-semibold">File</th>
                    <th className="px-5 py-3 font-semibold">Size</th>
                    <th className="px-5 py-3 font-semibold">Uploaded</th>
                    <th className="px-5 py-3 font-semibold text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((it) => (
                    <tr key={it.id} className="hover:bg-gray-50/60">
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-gray-900">
                          {it.title}
                        </p>
                        {it.description ? (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                            {it.description}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 max-w-[220px] truncate">
                        {it.file_name}
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">
                        {fmtSize(it.file_size)}
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">
                        {fmtDate(it.created_at)}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              downloadFile(
                                API_ORIGIN + it.file_url,
                                it.file_name,
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition-colors"
                          >
                            <Download size={13} />
                            Download
                          </button>
                          <button
                            onClick={() => remove(it.id)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                            aria-label="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* upload modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-gray-900">
                Upload — {cfg.title}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Title *
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Payment module demo"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Optional short description"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  File * <span className="font-normal">({cfg.hint})</span>
                </label>
                <input
                  type="file"
                  accept={cfg.accept}
                  onChange={(e) => onPickFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-600 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 file:text-xs file:font-semibold hover:file:bg-indigo-100"
                />
                {file && (
                  <p className="text-xs text-gray-500 mt-1.5">
                    {file.name} · {fmtSize(file.size)}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={submit}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Upload size={14} />
                  )}
                  {saving ? "Uploading…" : "Upload"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
