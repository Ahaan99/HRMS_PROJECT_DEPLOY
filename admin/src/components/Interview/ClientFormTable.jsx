export default function ClientFormTable({ forms = [], loading }) {
  if (loading) {
    return <div className="p-10 text-center font-semibold">Loading...</div>;
  }

  if (forms.length === 0) {
    return (
      <div className="p-10 text-center text-gray-500">
        No client submissions yet
      </div>
    );
  }
  

  return (
    <div className="bg-white/60 backdrop-blur-xl border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      {/* HEADER */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Client Form Submissions</h2>
      </div>

      {/* TABLE */}
      <div className="overflow-auto max-h-[60vh]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-gray-50">
            <tr>
              <th className="p-3 text-left">Company Name</th>
              <th className="p-3 text-left">HR Name</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Phone</th>
              <th className="p-3 text-left">Job Role</th>
              <th className="p-3 text-left">Openings</th>
              <th className="p-3 text-left">Salary</th>
              <th className="p-3 text-left">Experience</th>
              <th className="p-3 text-left">Location</th>
              <th className="p-3 text-left">Employment Type</th>
              <th className="p-3 text-left">Joining Timeline</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Submitted Date</th>
            </tr>
          </thead>
          <tbody>
            {forms.map((form) => (
              <tr key={form.id} className="border-t hover:bg-gray-50 transition">
                <td className="p-3 font-medium text-gray-800">
                  {form.company_name || "-"}
                </td>
                <td className="p-3">{form.hr_name || "-"}</td>
                <td className="p-3 text-gray-700">{form.email || "-"}</td>
                <td className="p-3">{form.phone || "-"}</td>
                <td className="p-3">{form.job_role || "-"}</td>
                <td className="p-3">{form.openings || "-"}</td>
                <td className="p-3">{form.salary || "-"}</td>
                <td className="p-3">{form.experience || "-"}</td>
                <td className="p-3">{form.location || "-"}</td>
                <td className="p-3 text-xs">{form.employment_type || "-"}</td>
                <td className="p-3">{form.joining_timeline || "-"}</td>
                <td className="p-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      form.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-800"
                        : form.status === "REVIEWED"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {form.status || "PENDING"}
                  </span>
                </td>
                <td className="p-3 text-gray-600">
                  {form.created_at
                    ? new Date(form.created_at).toLocaleDateString("en-IN")
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
