import { useState, useEffect } from "react";
import ExportButton from "../../components/common/ExportButton";
import PageHeader from "../../components/common/PageHeader";
import toast from "react-hot-toast";
import API from "../../services/api";
import { exportCSV } from "../../utils/exportUtils";
import { 
  UserMinus, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Plus, 
  Search,
  Loader2,
  X,
  Eye,
  Trash2,
  Download,
  Calendar,
  AlertCircle,
  Building,
  Mail,
  Phone
} from "lucide-react";

export default function ExitManagement() {
  const [exitRequests, setExitRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [exitForm, setExitForm] = useState({
    employee_id: "",
    employee_name: "",
    resignation_date: "",
    notice_period_days: 30,
    reason: "",
    exit_date: "",
    exit_type: "voluntary"
  });
  const [statusModal, setStatusModal] = useState(false);
  const [statusForm, setStatusForm] = useState({
    status: "",
    hr_remarks: "",
    exit_interview_date: "",
    final_settlement_date: ""
  });

useEffect(() => {
  fetchExitRequests();
  fetchStats();
}, [statusFilter, searchTerm]);

useEffect(() => {
  fetchEmployees();
}, []);

  const fetchExitRequests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      if (searchTerm) params.append("search", searchTerm);
      
      const res = await API.get(`/super-admin/exit`);
      console.log(res.data)
      setExitRequests(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch exit requests:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    setEmployeesLoading(true);
    try {
      let res = await API.get("/super-admin/employees");
      if (res.data.employees && res.data.employees.length > 0) {
        setEmployees(res.data.employees);
        setEmployeesLoading(false);
        return;
      }
    } catch (err) {
      console.error(`Failed to fetch employees: ${err}`);
    } finally {
      setEmployeesLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await API.get("/super-admin/exit/stats");
      setStats(res.data.data || null);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const handleEmployeeSelect = (employeeId) => {
    const employee = employees.find(e => e.id === Number(employeeId));
    if (employee) {
      setExitForm({
        ...exitForm,
        employee_id: employeeId,
        employee_name: employee.name
      });
    }
  };

  const handleSubmitExit = async (e) => {
    e.preventDefault();
    
    if (!exitForm.employee_id || !exitForm.resignation_date || !exitForm.notice_period_days) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const res = await API.post("/super-admin/exit", exitForm);
      if (res.data.success) {
        toast.success("Exit request submitted successfully!");
        setShowModal(false);
        setExitForm({
          employee_id: "",
          employee_name: "",
          resignation_date: "",
          notice_period_days: 30,
          reason: "",
          exit_date: "",
          exit_type: "voluntary"
        });
        fetchExitRequests();
        fetchStats();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to submit exit request");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    
    if (!statusForm.status) {
      toast.error("Please select a status");
      return;
    }

    setLoading(true);
    try {
      const res = await API.put(`/super-admin/exit/${selectedRequest.id}/status`, statusForm);
      if (res.data.success) {
        toast.success(`Exit request ${statusForm.status}!`);
        setStatusModal(false);
        setSelectedRequest(null);
        setStatusForm({
          status: "",
          hr_remarks: "",
          exit_interview_date: "",
          final_settlement_date: ""
        });
        fetchExitRequests();
        fetchStats();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExit = async (exitId) => {
    if (!window.confirm("Are you sure you want to delete this exit request?")) return;
    
    setLoading(true);
    try {
      const res = await API.delete(`/super-admin/exit/${exitId}`);
      if (res.data.success) {
        toast.success("Exit request deleted successfully!");
        fetchExitRequests();
        fetchStats();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete exit request");
    } finally {
      setLoading(false);
    }
  };

  const openStatusModal = (request) => {
    setSelectedRequest(request);
    setStatusForm({
      status: request.status,
      hr_remarks: request.hr_remarks || "",
      exit_interview_date: request.exit_interview_date ? request.exit_interview_date.split('T')[0] : "",
      final_settlement_date: request.final_settlement_date ? request.final_settlement_date.split('T')[0] : ""
    });
    setStatusModal(true);
  };

  const openDetailModal = (request) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  const calculateRemainingDays = (exitDate) => {
    if (!exitDate) return "-";
    const exit = new Date(exitDate);
    const today = new Date();
    const diffTime = exit - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? `${diffDays} days` : "Expired";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-700";
      case "approved": return "bg-blue-100 text-blue-700";
      case "processing": return "bg-purple-100 text-purple-700";
      case "completed": return "bg-green-100 text-green-700";
      case "rejected": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending": return <Clock size={14} />;
      case "approved": return <CheckCircle size={14} />;
      case "processing": return <Clock size={14} />;
      case "completed": return <CheckCircle size={14} />;
      case "rejected": return <XCircle size={14} />;
      default: return <Clock size={14} />;
    }
  };

  const exportToCSV = () =>
    exportCSV(
      exitRequests.map((req) => ({
        employee: req.employee_name || "",
        employee_code: req.employeeCode || "",
        resignation_date: req.resignation_date ? new Date(req.resignation_date).toLocaleDateString() : "",
        notice_period: `${req.notice_period_days} days`,
        exit_date: req.exit_date ? new Date(req.exit_date).toLocaleDateString() : "",
        type: req.exit_type || "",
        status: req.status || "",
        reason: req.reason || "",
      })),
      `exit_requests_${new Date().toISOString().split("T")[0]}`,
    );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <PageHeader title="Exit Management" desc="Manage employee resignations, notice periods, and exit workflows." />
        <ExportButton data={exitRequests} filename="exit-requests" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <UserMinus className="text-gray-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-xl font-bold text-gray-900">{stats?.total || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="text-yellow-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-xl font-bold text-gray-900">{stats?.pending || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Processing</p>
              <p className="text-xl font-bold text-gray-900">{stats?.processing || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-xl font-bold text-gray-900">{stats?.completed || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="text-red-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Rejected</p>
              <p className="text-xl font-bold text-gray-900">{stats?.rejected || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-4 justify-between items-center">
          <div className="flex gap-2 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search employee..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Download size={18} />
              Export CSV
            </button>
            <button
              onClick={() => {
                if (employees.length === 0) {
                  fetchEmployees();
                }
                setShowModal(true);
              }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Plus size={18} />
              New Exit Request
            </button>
          </div>
        </div>

        <div className="overflow-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
          ) : exitRequests.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <UserMinus size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No exit requests found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-gray-50">
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Employee</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Resignation Date</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Notice Period</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Exit Date</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Remaining</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Type</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {exitRequests.map((request) => (
                  <tr key={request.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{request.employee_name}</p>
                      <p className="text-sm text-gray-500">{request.employeeCode}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {request.resignation_date ? new Date(request.resignation_date).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {request.notice_period_days} days
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {request.exit_date ? new Date(request.exit_date).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-4 py-3">
                      {request.exit_date && request.status !== "completed" && request.status !== "rejected" ? (
                        <span className={`text-sm font-medium ${calculateRemainingDays(request.exit_date).includes('Expired') ? 'text-red-600' : 'text-green-600'}`}>
                          {calculateRemainingDays(request.exit_date)}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600 capitalize">{request.exit_type}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                        {request.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openDetailModal(request)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => openStatusModal(request)}
                          className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="Update Status"
                        >
                          <CheckCircle size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteExit(request.id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">New Exit Request</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmitExit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee *
                </label>
                <select
                  value={exitForm.employee_id}
                  onChange={(e) => handleEmployeeSelect(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={employeesLoading}
                >
                  <option value="">
                    {employeesLoading ? "Loading employees..." : employees.length === 0 ? "No employees found" : "Select Employee"}
                  </option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} {emp.employeeCode ? `- ${emp.employeeCode}` : ""}
                    </option>
                  ))}
                </select>
                {employees.length === 0 && !employeesLoading && (
                  <p className="text-xs text-red-500 mt-1">Please ensure employees are added in the system.</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Resignation Date *
                  </label>
                  <input
                    type="date"
                    value={exitForm.resignation_date}
                    onChange={(e) => setExitForm({ ...exitForm, resignation_date: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notice Period (Days) *
                  </label>
                  <input
                    type="number"
                    value={exitForm.notice_period_days}
                    onChange={(e) => setExitForm({ ...exitForm, notice_period_days: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expected Exit Date
                  </label>
                  <input
                    type="date"
                    value={exitForm.exit_date}
                    onChange={(e) => setExitForm({ ...exitForm, exit_date: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Exit Type
                  </label>
                  <select
                    value={exitForm.exit_type}
                    onChange={(e) => setExitForm({ ...exitForm, exit_type: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="voluntary">Voluntary</option>
                    <option value="resignation">Resignation</option>
                    <option value="termination">Termination</option>
                    <option value="retirement">Retirement</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Leaving
                </label>
                <textarea
                  value={exitForm.reason}
                  onChange={(e) => setExitForm({ ...exitForm, reason: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Enter reason for leaving..."
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {loading && <Loader2 className="animate-spin" size={16} />}
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {statusModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Update Exit Request</h3>
              <button onClick={() => setStatusModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <select
                  value={statusForm.status}
                  onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Exit Interview Date
                  </label>
                  <input
                    type="date"
                    value={statusForm.exit_interview_date}
                    onChange={(e) => setStatusForm({ ...statusForm, exit_interview_date: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Final Settlement Date
                  </label>
                  <input
                    type="date"
                    value={statusForm.final_settlement_date}
                    onChange={(e) => setStatusForm({ ...statusForm, final_settlement_date: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  HR Remarks
                </label>
                <textarea
                  value={statusForm.hr_remarks}
                  onChange={(e) => setStatusForm({ ...statusForm, hr_remarks: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Add remarks..."
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setStatusModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {loading && <Loader2 className="animate-spin" size={16} />}
                  Update Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Exit Request Details</h3>
              <button onClick={() => setShowDetailModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                  <UserMinus className="text-blue-600" size={28} />
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-semibold text-gray-900">{selectedRequest.employee_name}</h4>
                  <p className="text-gray-500">{selectedRequest.employeeCode}</p>
                  <div className="flex gap-4 mt-2 text-sm text-gray-600">
                    {selectedRequest.email && (
                      <span className="flex items-center gap-1"><Mail size={14} /> {selectedRequest.email}</span>
                    )}
                    {selectedRequest.phone && (
                      <span className="flex items-center gap-1"><Phone size={14} /> {selectedRequest.phone}</span>
                    )}
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedRequest.status)}`}>
                  {getStatusIcon(selectedRequest.status)}
                  {selectedRequest.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Resignation Date</p>
                  <p className="font-medium text-gray-900">
                    {selectedRequest.resignation_date ? new Date(selectedRequest.resignation_date).toLocaleDateString() : "-"}
                  </p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Notice Period</p>
                  <p className="font-medium text-gray-900">{selectedRequest.notice_period_days} days</p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Expected Exit Date</p>
                  <p className="font-medium text-gray-900">
                    {selectedRequest.exit_date ? new Date(selectedRequest.exit_date).toLocaleDateString() : "-"}
                  </p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Exit Type</p>
                  <p className="font-medium text-gray-900 capitalize">{selectedRequest.exit_type || "Voluntary"}</p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Exit Interview Date</p>
                  <p className="font-medium text-gray-900">
                    {selectedRequest.exit_interview_date ? new Date(selectedRequest.exit_interview_date).toLocaleDateString() : "Not scheduled"}
                  </p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Final Settlement Date</p>
                  <p className="font-medium text-gray-900">
                    {selectedRequest.final_settlement_date ? new Date(selectedRequest.final_settlement_date).toLocaleDateString() : "Pending"}
                  </p>
                </div>
              </div>

              {selectedRequest.reason && (
                <div className="p-4 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-500 mb-2">Reason for Leaving</p>
                  <p className="text-gray-700">{selectedRequest.reason}</p>
                </div>
              )}

              {selectedRequest.hr_remarks && (
                <div className="p-4 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-500 mb-2">HR Remarks</p>
                  <p className="text-gray-700">{selectedRequest.hr_remarks}</p>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    openStatusModal(selectedRequest);
                  }}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <CheckCircle size={18} />
                  Update Status
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    handleDeleteExit(selectedRequest.id);
                  }}
                  className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <Trash2 size={18} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
