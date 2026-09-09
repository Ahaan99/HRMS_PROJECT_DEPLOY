import PageHero from "../../components/common/PageHero";
// import { useEffect, useMemo, useState } from "react";
// import StatCard from "../../components/common/StatCard";
// import { Users as UsersIcon, Briefcase, Building2 } from "lucide-react";

// export default function Users() {
//   const [employees, setEmployees] = useState([]);
//   const [clients, setClients] = useState([]);

//   const [portalFilter, setPortalFilter] = useState("ALL");
//   const [search, setSearch] = useState("");

//   // =========================================
//   // MOCK DATA (Replace with backend later)
//   // =========================================
//   useEffect(() => {
//     const employeesFromBackend = [
//       {
//         id: 1,
//         employeeCode: "EMP-001",
//         name: "Rahul HR",
//         email: "rahul@company.com",
//         departmentId: 1,
//         isActive: 1,
//       },
//       {
//         id: 2,
//         employeeCode: "EMP-002",
//         name: "Ankit Sales",
//         email: "ankit@company.com",
//         departmentId: 2,
//         isActive: 1,
//       },
//       {
//         id: 3,
//         employeeCode: "EMP-003",
//         name: "Inactive HR",
//         email: "inactive@company.com",
//         departmentId: 1,
//         isActive: 0,
//       },
//     ];

//     const clientsFromBackend = [
//       {
//         id: 11,
//         client_code: "C1001",
//         company_name: "Tech Pvt Ltd",
//         email: "info@tech.com",
//         status: "ACTIVE",
//       },
//       {
//         id: 12,
//         client_code: "C1002",
//         company_name: "Retail Corp",
//         email: "info@retail.com",
//         status: "INACTIVE",
//       },
//     ];

//     setEmployees(employeesFromBackend);
//     setClients(clientsFromBackend);
//   }, []);

//   // =========================================
//   // COUNTS
//   // =========================================
//   const hrActiveCount = employees.filter(
//     (e) => e.departmentId === 1 && e.isActive === 1
//   ).length;

//   const salesActiveCount = employees.filter(
//     (e) => e.departmentId === 2 && e.isActive === 1
//   ).length;

//   const clientActiveCount = clients.filter(
//     (c) => c.status === "ACTIVE"
//   ).length;

//   // =========================================
//   // FILTERED DATA
//   // =========================================
//   const filteredEmployees = useMemo(() => {
//     let data = [];

//     if (portalFilter === "HR") {
//       data = employees.filter(
//         (e) => e.departmentId === 1 && e.isActive === 1
//       );
//     } else if (portalFilter === "SALES") {
//       data = employees.filter(
//         (e) => e.departmentId === 2 && e.isActive === 1
//       );
//     } else if (portalFilter === "CLIENT") {
//       return [];
//     } else {
//       data = employees;
//     }

//     return data.filter(
//       (e) =>
//         e.name.toLowerCase().includes(search.toLowerCase()) ||
//         e.email.toLowerCase().includes(search.toLowerCase())
//     );
//   }, [employees, portalFilter, search]);

//   const filteredClients = useMemo(() => {
//     if (portalFilter !== "CLIENT") return [];

//     return clients
//       .filter((c) => c.status === "ACTIVE")
//       .filter(
//         (c) =>
//           c.company_name.toLowerCase().includes(search.toLowerCase()) ||
//           c.email.toLowerCase().includes(search.toLowerCase())
//       );
//   }, [clients, portalFilter, search]);

//   return (
//     <div className="space-y-6">
//       {/* ================= HEADER ================= */}
//       <div>
//         <h1 className="text-2xl font-bold">Portal Users</h1>
//         <p className="text-gray-500">
//           Manage HR, Sales and Client active accounts.
//         </p>
//       </div>

//       {/* ================= STAT PANELS ================= */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//         <div onClick={() => setPortalFilter("HR")} className="cursor-pointer">
//           <StatCard
//             title="HR Portal Active Users"
//             value={hrActiveCount}
//             subText="Department ID 1"
//             icon={<UsersIcon />}
//             gradient="bg-gradient-to-r from-blue-400 to-blue-600"
//           />
//         </div>

//         <div
//           onClick={() => setPortalFilter("SALES")}
//           className="cursor-pointer"
//         >
//           <StatCard
//             title="Sales Portal Active Users"
//             value={salesActiveCount}
//             subText="Department ID 2"
//             icon={<Briefcase />}
//             gradient="bg-gradient-to-r from-purple-400 to-purple-600"
//           />
//         </div>

//         <div
//           onClick={() => setPortalFilter("CLIENT")}
//           className="cursor-pointer"
//         >
//           <StatCard
//             title="Client Portal Active Companies"
//             value={clientActiveCount}
//             subText="Status ACTIVE"
//             icon={<Building2 />}
//             gradient="bg-gradient-to-r from-green-400 to-green-600"
//           />
//         </div>
//       </div>

//       {/* ================= SEARCH ================= */}
//       <div className="bg-white rounded-2xl shadow p-5 border border-gray-100">
//         <input
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//           placeholder="Search by name or email..."
//           className="w-full md:w-[420px] border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-black"
//         />
//       </div>

//       {/* ================= TABLE ================= */}
//       <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
//         <div className="p-5 border-b border-gray-100">
//           <p className="font-semibold">
//             {portalFilter === "CLIENT"
//               ? `Active Clients: ${filteredClients.length}`
//               : `Users: ${filteredEmployees.length}`}
//           </p>
//         </div>

//         <div className="overflow-auto max-h-[60vh]">
//           <table className="w-full text-sm">
//             <thead className="sticky top-0 z-10 bg-gray-50 text-gray-600">
//               <tr>
//                 {portalFilter === "CLIENT" ? (
//                   <>
//                     <th className="text-left px-5 py-4">Client Code</th>
//                     <th className="text-left px-5 py-4">Company</th>
//                     <th className="text-left px-5 py-4">Email</th>
//                     <th className="text-left px-5 py-4">Status</th>
//                   </>
//                 ) : (
//                   <>
//                     <th className="text-left px-5 py-4">Employee Code</th>
//                     <th className="text-left px-5 py-4">Name</th>
//                     <th className="text-left px-5 py-4">Email</th>
//                     <th className="text-left px-5 py-4">Department</th>
//                     <th className="text-left px-5 py-4">Status</th>
//                   </>
//                 )}
//               </tr>
//             </thead>

//             <tbody>
//               {portalFilter === "CLIENT"
//                 ? filteredClients.map((c) => (
//                     <tr key={c.id} className="border-t hover:bg-gray-50">
//                       <td className="px-5 py-4">{c.client_code}</td>
//                       <td className="px-5 py-4">{c.company_name}</td>
//                       <td className="px-5 py-4">{c.email}</td>
//                       <td className="px-5 py-4 text-green-600 font-semibold">
//                         {c.status}
//                       </td>
//                     </tr>
//                   ))
//                 : filteredEmployees.map((e) => (
//                     <tr key={e.id} className="border-t hover:bg-gray-50">
//                       <td className="px-5 py-4">{e.employeeCode}</td>
//                       <td className="px-5 py-4">{e.name}</td>
//                       <td className="px-5 py-4">{e.email}</td>
//                       <td className="px-5 py-4">
//                         {e.departmentId === 1 ? "HR" : "Sales"}
//                       </td>
//                       <td className="px-5 py-4">
//                         <span className="text-green-600 font-semibold">
//                           ACTIVE
//                         </span>
//                       </td>
//                     </tr>
//                   ))}

//               {portalFilter === "CLIENT"
//                 ? filteredClients.length === 0 && (
//                     <tr>
//                       <td
//                         colSpan="4"
//                         className="px-5 py-10 text-center text-gray-500"
//                       >
//                         No active clients found.
//                       </td>
//                     </tr>
//                   )
//                 : filteredEmployees.length === 0 && (
//                     <tr>
//                       <td
//                         colSpan="5"
//                         className="px-5 py-10 text-center text-gray-500"
//                       >
//                         No users found.
//                       </td>
//                     </tr>
//                   )}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// }








import { useEffect, useState } from "react";
import axios from "axios";
import StatCard from "../../components/common/StatCard";
import { Users, Briefcase, Building2 } from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function UsersPage() {
  const [portal, setPortal] = useState("ALL");
  const [counts, setCounts] = useState({
    hr: 0,
    sales: 0,
    client: 0,
  });

  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const token = localStorage.getItem("hrms_admin_token");

  // =========================================
  // FETCH USERS
  // =========================================
  const fetchUsers = async (selectedPortal = "ALL") => {
    try {
      const res = await axios.get(
        `${BASE_URL}/super-admin/users?portal=${selectedPortal}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data?.success) {
        setCounts(res.data.data.counts);

        if (selectedPortal === "ALL") {
          // flatten employees only for default
          setData(res.data.data.users.employees || []);
        } else {
          setData(res.data.data.users || []);
        }
      }
    } catch (err) {
      console.error("Users fetch error:", err);
    }
  };

  useEffect(() => {
    fetchUsers(portal);
  }, [portal]);

  // =========================================
  // FILTER SEARCH
  // =========================================
  const filteredData = data.filter((item) => {
    const text =
      (item.name ||
        item.company_name ||
        "").toLowerCase();

    return text.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* ================= HEADER ================= */}
      <PageHero
        title="Portal Users"
        subtitle="Manage HR, Sales & Client portal accounts"
        chips={[
          { label: `${counts.hr || 0} HR` },
          { label: `${counts.sales || 0} Sales` },
          { label: `${counts.client || 0} Clients` },
        ]}
        actions={
          portal !== "ALL" && (
            <button
              onClick={() => setPortal("ALL")}
              className="inline-flex items-center gap-2 bg-white text-indigo-700 hover:bg-indigo-50 font-semibold px-5 py-2.5 rounded-xl shadow-sm transition-colors"
            >
              Show All
            </button>
          )
        }
      />

      {/* ================= STAT PANELS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          onClick={() => setPortal("HR")}
          className="cursor-pointer"
        >
          <StatCard
            title="HR Active Users"
            value={counts.hr}
            subText="Department ID 1"
            icon={<Users />}
            gradient="bg-gradient-to-r from-blue-400 to-blue-600"
          />
        </div>

        <div
          onClick={() => setPortal("SALES")}
          className="cursor-pointer"
        >
          <StatCard
            title="Sales Active Users"
            value={counts.sales}
            subText="Department ID 2"
            icon={<Briefcase />}
            gradient="bg-gradient-to-r from-purple-400 to-purple-600"
          />
        </div>

        <div
          onClick={() => setPortal("CLIENT")}
          className="cursor-pointer"
        >
          <StatCard
            title="Active Clients"
            value={counts.client}
            subText="Status ACTIVE"
            icon={<Building2 />}
            gradient="bg-gradient-to-r from-green-400 to-green-600"
          />
        </div>
      </div>

      {/* ================= SEARCH ================= */}
      <div className="bg-white rounded-2xl shadow p-5 border border-gray-100">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name..."
          className="w-full md:w-[420px] border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      {/* ================= TABLE ================= */}
      <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
        <div className="p-5 border-b">
          <p className="font-semibold">
            Showing: {portal}
          </p>
        </div>

        <div className="overflow-auto max-h-[60vh]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-gray-50">
              <tr>
                {portal === "CLIENT" ? (
                  <>
                    <th className="px-5 py-4 text-left">Client Code</th>
                    <th className="px-5 py-4 text-left">Company</th>
                    <th className="px-5 py-4 text-left">Email</th>
                    <th className="px-5 py-4 text-left">Status</th>
                  </>
                ) : (
                  <>
                    <th className="px-5 py-4 text-left">Code</th>
                    <th className="px-5 py-4 text-left">Name</th>
                    <th className="px-5 py-4 text-left">Email</th>
                    <th className="px-5 py-4 text-left">Department</th>
                  </>
                )}
              </tr>
            </thead>

            <tbody>
              {filteredData.map((item) => (
                <tr key={item.id} className="border-t hover:bg-gray-50">
                  {portal === "CLIENT" ? (
                    <>
                      <td className="px-5 py-4">
                        {item.client_code}
                      </td>
                      <td className="px-5 py-4">
                        {item.company_name}
                      </td>
                      <td className="px-5 py-4">
                        {item.email}
                      </td>
                      <td className="px-5 py-4 text-green-600 font-semibold">
                        {item.status}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-5 py-4">
                        {item.employeeCode}
                      </td>
                      <td className="px-5 py-4">
                        {item.name}
                      </td>
                      <td className="px-5 py-4">
                        {item.email}
                      </td>
                      <td className="px-5 py-4">
                        {item.departmentId === 1
                          ? "HR"
                          : "Sales"}
                      </td>
                    </>
                  )}
                </tr>
              ))}

              {filteredData.length === 0 && (
                <tr>
                  <td
                    colSpan="4"
                    className="text-center py-8 text-gray-500"
                  >
                    No data found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}