export default function CandidateFormTable({ forms = [], loading }) {
  if (loading) {
    return <div className="p-10 text-center font-semibold">Loading...</div>;
  }

  if (forms.length === 0) {
    return (
      <div className="p-10 text-center text-gray-500">
        No candidate submissions yet
      </div>
    );
  }

  return (
    <div className="bg-white/60 backdrop-blur-xl border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      {/* HEADER */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Candidate Form Submissions</h2>
      </div>

      {/* TABLE */}
      <div className="overflow-auto max-h-[60vh]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-gray-50">
            <tr>
              <th className="p-3 text-left">Full Name</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Phone</th>
              <th className="p-3 text-left">City</th>
              <th className="p-3 text-left">Qualification</th>
              <th className="p-3 text-left">Experience</th>
              <th className="p-3 text-left">Skills</th>
              <th className="p-3 text-left">Expected Salary</th>
              <th className="p-3 text-left">Preferred Location</th>
              <th className="p-3 text-left">Current Company</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Submitted Date</th>
            </tr>
          </thead>
          <tbody>
            {forms.map((form) => (
              <tr key={form.id} className="border-t hover:bg-gray-50 transition">
                <td className="p-3 font-medium text-gray-800">
                  {form.full_name || "-"}
                </td>
                <td className="p-3 text-gray-700">{form.email || "-"}</td>
                <td className="p-3">{form.phone || "-"}</td>
                <td className="p-3">{form.city || "-"}</td>
                <td className="p-3">{form.qualification || "-"}</td>
                <td className="p-3">{form.experience || "-"}</td>
                <td className="p-3 text-xs">{form.skills || "-"}</td>
                <td className="p-3">{form.expected_salary || "-"}</td>
                <td className="p-3">{form.preferred_location || "-"}</td>
                <td className="p-3">{form.current_company || "-"}</td>
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
