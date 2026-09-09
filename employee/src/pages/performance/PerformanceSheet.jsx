import { useEffect, useState } from "react";

import API from "../../api/axios";

import toast from "react-hot-toast";

import dayjs from "dayjs";

import {
  Eye,
  CheckCircle,
  AlertCircle,
  XCircle,
  Award,
  Calendar,
} from "lucide-react";

import EmployeeNavbar from "../../components/layout/EmployeeNavbar";

const STATUS_CONFIG = {
  excellent: {
    label: "Excellent",
    color:
      "bg-green-100 text-green-700",
    border:
      "border-green-500",
    icon: CheckCircle,
  },

  good: {
    label: "Good",
    color:
      "bg-yellow-100 text-yellow-700",
    border:
      "border-yellow-500",
    icon: AlertCircle,
  },

  needs_improvement: {
    label:
      "Needs Improvement",

    color:
      "bg-red-100 text-red-700",

    border:
      "border-red-500",

    icon: XCircle,
  },
};

const PERFORMANCE_CRITERIA = [
  {
    id: "quality",
    name: "Work Quality",
  },

  {
    id: "productivity",
    name: "Productivity",
  },

  {
    id: "communication",
    name: "Communication",
  },

  {
    id: "teamwork",
    name: "Teamwork",
  },

  {
    id: "attendance",
    name:
      "Attendance & Punctuality",
  },

  {
    id: "initiative",
    name:
      "Initiative & Innovation",
  },

  {
    id: "deadline",
    name:
      "Meeting Deadlines",
  },

  {
    id: "adaptability",
    name: "Adaptability",
  },
];

export default function MyPerformance() {
  const [records, setRecords] =
    useState([]);

  const [selectedRecord, setSelectedRecord] =
    useState(null);

  const [viewModal, setViewModal] =
    useState(false);

  const fetchData = async () => {
    try {
      const res =
        await API.get(
          "/employee/performance"
        );

        console.log("res-------- ", res)
      setRecords(
        res.data.data || []
      );
    } catch (err) {
      console.log(err);

      toast.error(
        "Failed to load performance reviews"
      );
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="p-4">
      <EmployeeNavbar />

      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          My Performance Reviews
        </h1>

        <p className="text-gray-500 text-sm mt-1">
          View all your
          performance evaluations
        </p>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {records.map((record) => {
          const config =
            STATUS_CONFIG[
              record.status
            ];

          const Icon =
            config.icon;

          return (
            <div
              key={record.id}
              className={`bg-white rounded-3xl shadow border-l-4 ${config.border} overflow-hidden`}
            >
              <div className="p-5">
                {/* TOP */}
                <div className="flex justify-between items-start mb-5">
                  <div>
                    <h2 className="font-bold text-lg">
                      Performance Review
                    </h2>

                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                      <Calendar size={14} />

                      {dayjs(
                        record.period
                      ).format(
                        "MMMM YYYY"
                      )}
                    </div>
                  </div>

                  <span
                    className={`flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold ${config.color}`}
                  >
                    <Icon size={12} />

                    {config.label}
                  </span>
                </div>

                {/* SCORE */}
                <div className="mb-5">
                  <p className="text-sm text-gray-500 mb-1">
                    Overall Score
                  </p>

                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-extrabold">
                      {
                        record.avgScore
                      }
                    </span>

                    <span className="text-gray-400 mb-1">
                      /10
                    </span>
                  </div>
                </div>

                {/* REMARK */}
                <div className="mb-5">
                  <p className="text-sm text-gray-500 mb-1">
                    Feedback
                  </p>

                  <p className="text-sm text-gray-700 line-clamp-3">
                    {record.remarks ||
                      "No remarks"}
                  </p>
                </div>

                {/* ACTION */}
                <button
                  onClick={() => {
                    setSelectedRecord(
                      record
                    );

                    setViewModal(
                      true
                    );
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 py-2.5 rounded-2xl font-medium transition"
                >
                  <Eye size={16} />
                  View Details
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {!records.length && (
        <div className="bg-white rounded-3xl shadow border p-10 text-center text-gray-500">
          No performance reviews
          found
        </div>
      )}

      {/* VIEW MODAL */}
      {viewModal &&
        selectedRecord && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-[32px] w-full max-w-4xl max-h-[92vh] overflow-hidden shadow-2xl">
              
              {/* HEADER */}
              <div className="bg-black text-white p-7">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-3xl font-bold">
                      Performance Review
                    </h2>

                    <p className="text-gray-300 mt-2">
                      {
                        selectedRecord.employeeName
                      }
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      setViewModal(
                        false
                      )
                    }
                    className="w-10 h-10 rounded-xl bg-white/10"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* BODY */}
              <div className="p-7 overflow-y-auto max-h-[70vh]">
                
                {/* SCORE */}
                <div className="bg-gray-50 rounded-3xl p-6 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 mb-2">
                        Overall Score
                      </p>

                      <div className="flex items-end gap-1">
                        <span className="text-5xl font-extrabold">
                          {
                            selectedRecord.avgScore
                          }
                        </span>

                        <span className="text-gray-400 mb-2">
                          /10
                        </span>
                      </div>
                    </div>

                    <Award
                      size={60}
                    />
                  </div>
                </div>

                {/* CRITERIA */}
                <div className="space-y-4">
                  {PERFORMANCE_CRITERIA.map(
                    (
                      criteria
                    ) => {
                      const value =
                        selectedRecord
                          .scores?.[
                          criteria.id
                        ] || 0;

                      return (
                        <div
                          key={
                            criteria.id
                          }
                          className="bg-gray-50 rounded-2xl p-4"
                        >
                          <div className="flex justify-between mb-2">
                            <p className="font-medium">
                              {
                                criteria.name
                              }
                            </p>

                            <p className="font-bold">
                              {value}
                              /10
                            </p>
                          </div>

                          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                value >= 8
                                  ? "bg-green-500"
                                  : value >=
                                      6
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                              }`}
                              style={{
                                width: `${value * 10}%`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>

                {/* REMARKS */}
                <div className="mt-6 bg-gray-50 rounded-3xl p-6">
                  <h3 className="font-bold text-lg mb-3">
                    Remarks
                  </h3>

                  <p className="text-gray-700 whitespace-pre-wrap">
                    {
                      selectedRecord.remarks
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}