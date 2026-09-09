import React, { useEffect, useState } from "react";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";

const AssignedHRMultiSelect = ({
  clientId,
  assignedHRs = [],
  onUpdate,
}) => {
  const axiosPrivate = useAxiosPrivate();

  const [allHRs, setAllHRs] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // fetch HR list
  useEffect(() => {
    const fetchHRs = async () => {
      try {
        const res = await axiosPrivate.get(
          "/super-admin/employees"
        );
        if (res.data?.success) {
          setAllHRs(res.data.data || []);
        }
      } catch (err) {
        console.error("HR fetch error:", err);
      }
    };

    fetchHRs();
  }, []);

  const isAssigned = (id) =>
    assignedHRs.some((hr) => hr.id === id);

  const handleToggleHR = async (hrId) => {
    try {
      setLoading(true);

      await axiosPrivate.patch(
        "/super-admin/clients/assign-hr",
        {
          client_id: clientId,
          hr_employee_id: hrId,
        }
      );

      onUpdate?.(); // refetch profile
    } catch (err) {
      console.error("HR assign error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* label */}
      <p className="text-xs text-gray-500">Assigned HR</p>

      {/* selected chips */}
      <div className="flex flex-wrap gap-2">
        {assignedHRs.map((hr) => (
          <span
            key={hr.id}
            className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full"
          >
            {hr.name}
          </span>
        ))}
      </div>

      {/* dropdown */}
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="w-full border rounded-lg px-3 py-2 text-sm text-left hover:border-indigo-400"
        >
          Assign HR
        </button>

        {open && (
          <div className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow max-h-56 overflow-y-auto">
            {allHRs.map((hr) => (
              <div
                key={hr.id}
                onClick={() => handleToggleHR(hr.id)}
                className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 flex justify-between ${
                  isAssigned(hr.id) ? "bg-indigo-50" : ""
                }`}
              >
                <span>{hr.name}</span>

                {isAssigned(hr.id) && (
                  <span className="text-indigo-600 text-xs">
                    ✓
                  </span>
                )}
              </div>
            ))}

            {!allHRs.length && (
              <div className="px-3 py-2 text-sm text-gray-500">
                No HR found
              </div>
            )}
          </div>
        )}
      </div>

      {loading && (
        <p className="text-xs text-gray-400">Updating...</p>
      )}
    </div>
  );
};

export default AssignedHRMultiSelect;