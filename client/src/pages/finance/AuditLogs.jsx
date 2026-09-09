import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Clock, User, Filter, History } from "lucide-react";
import { auditLogService } from "../../services/financeService";
import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/common/EmptyState";

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState("");

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await auditLogService.getAll(200);
      setLogs(response.data || []);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      toast.error("Failed to fetch audit logs");
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action = "") => {
    if (action.includes("ADD")) return "badge-success";
    if (action.includes("DELETE")) return "badge-danger";
    if (action.includes("UPDATE")) return "badge-info";
    return "badge-neutral";
  };

  const filteredLogs = filterAction
    ? logs.filter((log) =>
        (log.action || "").includes(filterAction.toUpperCase()),
      )
    : logs;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  const formatDetails = (details) => {
    if (!details) return "";

    const formatObject = (obj) =>
      Object.entries(obj)
        .map(([key, value]) => {
          if (typeof value === "object") {
            return `${key}: { ${formatObject(value)} }`;
          }
          return `${key}: ${value}`;
        })
        .join(", ");

    return formatObject(details);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<History size={22} />}
        title="Audit Logs"
        desc="Track all system activities and changes for Inventory, Assets, and Purchase Orders."
      />

      <div className="card-premium overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
            Activity History
          </h2>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="input-premium w-full sm:w-[180px]"
            >
              <option value="">All Actions</option>
              <option value="ADD">Add</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
            </select>
          </div>
        </div>

        <div className="p-4 sm:p-5 space-y-3 max-h-[70vh] overflow-y-auto scrollbar-thin-premium">
          {filteredLogs.length === 0 ? (
            <EmptyState
              icon={<History size={28} />}
              title="No activity yet"
              desc="System actions will appear here as they happen."
            />
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 sm:gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/60 hover:bg-gray-100/80 dark:hover:bg-gray-800 transition"
              >
                <div className="p-2 bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 shrink-0">
                  <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span
                      className={`badge-premium ${getActionBadge(log.action)}`}
                    >
                      {(log.action || "").replace(/_/g, " ")}
                    </span>
                    {log.user_name && (
                      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                        <User className="w-3.5 h-3.5" />
                        {log.user_name}
                      </div>
                    )}
                  </div>
                  {log.details && (
                    <div className="text-sm text-gray-700 dark:text-gray-300 mt-1 break-words">
                      {typeof log.details === "object"
                        ? Object.entries(log.details).map(([key, value]) => (
                            <div key={key}>
                              <strong>{key}:</strong>{" "}
                              {typeof value === "object"
                                ? JSON.stringify(value)
                                : value}
                            </div>
                          ))
                        : log.details}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {log.timestamp
                      ? new Date(log.timestamp).toLocaleString()
                      : "N/A"}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
