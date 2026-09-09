import { useEffect, useState } from "react";
import { getDepartments, getDesignations } from "../../services/masterService";

import { fileUrl } from "../../utils/fileUrl";

export default function JoiningDetailsModal({ data, onClose, BASE }) {
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        const [d1, d2] = await Promise.all([
          getDepartments(),
          getDesignations(),
        ]);
        if (cancelled) return;
        setDepartments(d1.data?.departments || []);
        setDesignations(d2.data?.designations || []);
      } catch (err) {
        console.error("JoiningDetailsModal masters fetch error:", err);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  // Hooks must run unconditionally; bail out only after they are declared.
  if (!data) return null;

  const deptName =
    departments.find((d) => Number(d.id) === Number(data.departmentId))
      ?.name || "-";

  const desigName =
    designations.find((d) => Number(d.id) === Number(data.designationId))
      ?.name || "-";

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white w-[900px] max-h-[90vh] overflow-y-auto rounded-xl p-6">

        {/* HEADER */}
        <div className="flex justify-between mb-6">
          <h2 className="text-xl font-semibold">Joining Details</h2>
          <button onClick={onClose} className="text-red-500">
            Close
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">

          {/* IMAGE */}
          <img
            src={
              data.photo
                ? fileUrl(data.photo, "profile")
                : "https://via.placeholder.com/100"
            }
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover border"
          />

          <img
            src={
              data.signature
                ? fileUrl(data.signature, "signature")
                : "https://via.placeholder.com/120x60"
            }
            alt="Signature"
            className="w-32 h-16 object-contain border rounded"
          />

          {/* BASIC INFO */}
          <div><b>Name:</b> {data.full_name || "-"}</div>
          <div><b>Father:</b> {data.father_name || "-"}</div>
          <div><b>DOB:</b>{" "}{data.dob  ? new Date(data.dob).toLocaleDateString("en-GB"): "-"}</div>
          <div><b>Gender:</b> {data.gender || "-"}</div>

          {/* CONTACT */}
          <div><b>Mobile:</b> {data.mobile || "-"}</div>
          <div><b>Email:</b> {data.email || "-"}</div>

          {/* ADDRESS */}
          <div className="col-span-2">
            <b>Address:</b> {data.present_address || "-"}
          </div>

          <div><b>City:</b> {data.present_city || "-"}</div>

          {/* 🔥 FIXED HR DATA */}
          <div><b>Department:</b> {deptName}</div>
          <div><b>Designation:</b> {desigName}</div>

          <div className="col-span-2">
            <b>Total Experience:</b>{" "}{data.total_experience?.trim() ? data.total_experience : "-"}
          </div>

          {/* EDUCATION */}
          <div className="col-span-2 mt-2">
            <b>Education</b>
            <table className="mt-2 w-full text-xs border">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="p-2">Level</th>
                  <th className="p-2">Qualification</th>
                  <th className="p-2">Board / University</th>
                  <th className="p-2">Year</th>
                  <th className="p-2">Score</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["10th", data.qualification10, data.board10, data.year10, data.percent10],
                  ["12th", data.qualification12, data.board12, data.year12, data.percent12],
                  ["Graduation", data.qualification_grad, data.university_grad, data.year_grad, data.percent_grad],
                  ["Post-graduation", data.qualification_pg, data.university_pg, data.year_pg, data.percent_pg],
                ].map(([lvl, q, b, y, p]) => (
                  <tr key={lvl} className="border-t">
                    <td className="p-2 font-medium">{lvl}</td>
                    <td className="p-2">{q || "-"}</td>
                    <td className="p-2">{b || "-"}</td>
                    <td className="p-2">{y || "-"}</td>
                    <td className="p-2">{p || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}