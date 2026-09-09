import { useEffect, useState} from "react";
import API from "../../api/axios";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { Plus, Calendar, Clock, } from "lucide-react";
import EmployeeNavbar from "../../components/layout/EmployeeNavbar";

const PRIORITY_CONFIG = {
  high: { label: "High", color: "bg-red-100 text-red-700" },
  medium: { label: "Medium", color: "bg-yellow-100 text-yellow-700" },
  low: { label: "Low", color: "bg-green-100 text-green-700" },
};

const TARGET_STATUS_CONFIG = {
  pending: { label: "Pending", color: "bg-gray-100 text-gray-700" },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-700" },
  completed: { label: "Completed", color: "bg-green-100 text-green-700" },
  overdue: { label: "Overdue", color: "bg-red-100 text-red-700" },
};

export default function MyTargets() {
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await API.get("/employee/targets");
      setTargets(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load targets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateProgress = async (id, current, target) => {
    try {
      const newValue = Math.min(current + 1, target);

      await API.patch(`/employee/targets/progress/${id}`, {
        currentValue: newValue,
      });

      toast.success("Progress updated");
      loadData();
    } catch (err) {
      toast.error("Update failed");
    }
  };

  const getProgress = (t) =>
    Math.min(Math.round((t.current_value / t.target_value) * 100), 100);

  return (
    <div className="p-4">
      <EmployeeNavbar />
      <h1 className="text-xl font-semibold mb-4">My Work</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {targets.map((t) => {
          const progress = getProgress(t);
          const priority = PRIORITY_CONFIG[t.priority];
          const status = TARGET_STATUS_CONFIG[t.status];

          const isOverdue =
            dayjs(t.deadline).isBefore(dayjs()) && t.status !== "completed";

          return (
            <div
              key={t.id}
              className={`bg-white rounded-2xl shadow border-2 p-5 ${
                t.status === "completed"
                  ? "border-green-500"
                  : isOverdue
                  ? "border-red-500"
                  : "border-gray-200"
              }`}
            >
              {/* Header */}
              <div className="flex justify-between mb-3">
                <span className={`px-2 py-1 text-xs rounded ${priority.color}`}>
                  {priority.label}
                </span>

                <span className={`px-2 py-1 text-xs rounded ${status.color}`}>
                  {isOverdue ? "Overdue" : status.label}
                </span>
              </div>

              <h3 className="font-semibold text-gray-800 mb-2">{t.title}</h3>

              <div className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                <Calendar size={14} />
                {dayjs(t.deadline).format("MMM D, YYYY")}
              </div>

              <div className="text-sm text-gray-500 mb-3 flex items-center gap-1">
                <Clock size={14} />
                {Math.max(dayjs(t.deadline).diff(dayjs(), "day"), 0)} days left
              </div>

              {/* Progress */}
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span>
                    {t.current_value}/{t.target_value} {t.unit}
                  </span>
                  <span>{progress}%</span>
                </div>

                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Action */}
              <button
                onClick={() =>
                  handleUpdateProgress(t.id, t.current_value, t.target_value)
                }
                className="w-full flex items-center justify-center gap-2 bg-green-50 hover:bg-green-100 text-green-600 py-2 rounded-lg text-sm"
              >
                <Plus size={14} />
                Update Progress
              </button>
            </div>
          );
        })}

        {!targets.length && !loading && (
          <p className="text-gray-500">No targets assigned</p>
        )}
      </div>
    </div>
  );
}
