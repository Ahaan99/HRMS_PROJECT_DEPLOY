import { useCallback, useEffect, useState } from "react";
import {
  BookOpen,
  Download,
  CheckCircle2,
  GraduationCap,
  Clock,
} from "lucide-react";
import API from "../../api/axios";
import EmployeeNavbar from "../../components/layout/EmployeeNavbar";
import toast from "react-hot-toast";

const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || "").replace(
  /\/api\/?$/,
  "",
);

const downloadFile = async (url, name) => {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = name || decodeURIComponent(url.split("/").pop() || "download");
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  } catch {
    window.open(url, "_blank");
  }
};


export default function SOPLibrary() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const fetchSops = useCallback(async () => {
    try {
      const res = await API.get("/sops/employee");
      setRows(Array.isArray(res.data) ? res.data : []);
      setError("");
    } catch {
      setError("Failed to load SOP library");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSops();
  }, [fetchSops]);

  const acknowledge = async (sop) => {
    setBusyId(sop.id);
    try {
      await API.post(`/sops/${sop.id}/acknowledge`);
      await fetchSops();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to acknowledge");
    } finally {
      setBusyId(null);
    }
  };

  const completeTraining = async (sop) => {
    setBusyId(sop.id);
    try {
      await API.post(`/sops/${sop.id}/training-complete`);
      await fetchSops();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to record training");
    } finally {
      setBusyId(null);
    }
  };

  const pendingCount = rows.filter((r) => !r.acknowledged_at).length;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <EmployeeNavbar />

      <div className="px-3 sm:px-6 lg:px-8 pt-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="text-indigo-600" size={26} />
            SOP Library
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Company standard operating procedures.{" "}
            {pendingCount > 0
              ? `${pendingCount} pending acknowledgement${pendingCount > 1 ? "s" : ""}.`
              : "You are up to date."}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-500">
            Loading SOPs...
          </div>
        ) : error ? (
          <div className="text-center py-16 text-red-500">{error}</div>
        ) : rows.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 text-gray-500">
            No SOPs published yet.
          </div>
        ) : (
          <div className="space-y-4">
            {rows.map((sop) => {
              const acked = Boolean(sop.acknowledged_at);
              const trained = sop.training_completed === 1;
              return (
                <div
                  key={sop.id}
                  className={`bg-white rounded-2xl border shadow-sm p-5 ${
                    acked ? "border-gray-100" : "border-amber-200"
                  }`}
                >
                  <div className="flex flex-col gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {sop.department}
                        </span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          v{sop.current_version}
                        </span>
                        {!acked && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock size={11} /> Action required
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 mt-1.5">
                        {sop.title}
                      </h3>
                      {sop.description && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {sop.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                        {acked && (
                          <span className="inline-flex items-center gap-1 text-emerald-600">
                            <CheckCircle2 size={13} />
                            Acknowledged{" "}
                            {new Date(
                              sop.acknowledged_at,
                            ).toLocaleDateString()}
                          </span>
                        )}
                        {sop.requires_training === 1 && trained && (
                          <span className="inline-flex items-center gap-1 text-purple-600">
                            <GraduationCap size={13} />
                            Training completed{" "}
                            {sop.training_completed_at
                              ? new Date(
                                  sop.training_completed_at,
                                ).toLocaleDateString()
                              : ""}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                      {sop.file_url && (
                        <button
                          onClick={() =>
                            downloadFile(API_ORIGIN + sop.file_url, sop.file_name || sop.title)
                          }
                          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                        >
                          <Download size={13} /> Download
                        </button>
                      )}
                      {!acked ? (
                        <button
                          onClick={() => acknowledge(sop)}
                          disabled={busyId === sop.id}
                          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                          <CheckCircle2 size={13} />
                          {busyId === sop.id
                            ? "Saving..."
                            : "I have read & acknowledge"}
                        </button>
                      ) : (
                        sop.requires_training === 1 &&
                        !trained && (
                          <button
                            onClick={() => completeTraining(sop)}
                            disabled={busyId === sop.id}
                            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
                          >
                            <GraduationCap size={13} />
                            {busyId === sop.id
                              ? "Saving..."
                              : "Mark training complete"}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
