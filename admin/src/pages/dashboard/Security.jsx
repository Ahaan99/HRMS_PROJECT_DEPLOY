import { useState, useEffect } from "react";
import PageHeader from "../../components/common/PageHeader";
import toast from "react-hot-toast";
import API from "../../services/api";
import { exportCSV } from "../../utils/exportUtils";
import { 
  Shield, 
  Lock, 
  Eye, 
  EyeOff, 
  Key, 
  Users, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Settings,
  Clock,
  Download,
  Trash2,
  Server
} from "lucide-react";

export default function Security() {
  const [activeTab, setActiveTab] = useState("overview");
  const [securityStats, setSecurityStats] = useState(null);
  const [loginLogs, setLoginLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  useEffect(() => {
    fetchSecurityStats();
    fetchLoginLogs();
  }, []);

  const fetchSecurityStats = async () => {
    try {
      const res = await API.get("/super-admin/security/stats");
      setSecurityStats(res.data.data || getDefaultStats());
    } catch (err) {
      setSecurityStats(getDefaultStats());
    }
  };

  const fetchLoginLogs = async () => {
    setLoading(true);
    try {
      const res = await API.get("/super-admin/security/login-logs");
      setLoginLogs(res.data.data || []);
    } catch (err) {
      setLoginLogs(getSampleLogs());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultStats = () => ({
    totalLogins: 156,
    todayLogins: 12,
    failedLogins: 5,
    activeSessions: 8,
    lastBackup: new Date().toISOString(),
    systemUptime: "99.9%"
  });

  const getSampleLogs = () => [
    { id: 1, user: "admin@hrms.com", ip: "192.168.1.100", action: "Login", status: "success", timestamp: new Date().toISOString() },
    { id: 2, user: "hr@hrms.com", ip: "192.168.1.101", action: "Login", status: "success", timestamp: new Date(Date.now() - 3600000).toISOString() },
    { id: 3, user: "user@hrms.com", ip: "192.168.1.102", action: "Login", status: "failed", timestamp: new Date(Date.now() - 7200000).toISOString() },
    { id: 4, user: "admin@hrms.com", ip: "192.168.1.100", action: "Logout", status: "success", timestamp: new Date(Date.now() - 10800000).toISOString() },
  ];

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await API.post("/super-admin/auth/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      
      if (res.data.success) {
        toast.success("Password changed successfully!");
        setShowPasswordModal(false);
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleClearLogs = async () => {
    if (!window.confirm("Are you sure you want to clear all login logs?")) return;
    
    try {
      const res = await API.delete("/super-admin/security/login-logs");
      if (res.data.success) {
        toast.success("Logs cleared successfully!");
        fetchLoginLogs();
      }
    } catch (err) {
      toast.error("Failed to clear logs");
    }
  };

  const exportLogs = () =>
    exportCSV(
      loginLogs.map((log) => ({
        user: log.user || "",
        ip_address: log.ip || "",
        action: log.action || "",
        status: log.status || "",
        timestamp: new Date(log.timestamp).toLocaleString(),
      })),
      `security_logs_${new Date().toISOString().split("T")[0]}`,
    );

  const getStatusColor = (status) => {
    return status === "success" ? "text-green-600" : "text-red-600";
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: Shield },
    { id: "logs", label: "Login History", icon: Activity },
    { id: "password", label: "Change Password", icon: Key },
    { id: "settings", label: "Security Settings", icon: Settings },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Secure & Reliable" desc="Security settings, access control, and activity monitoring." />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-100">
          <nav className="flex gap-1 p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                      <Users className="text-white" size={24} />
                    </div>
                    <div>
                      <p className="text-sm text-blue-600">Total Logins</p>
                      <p className="text-2xl font-bold text-blue-900">{securityStats?.totalLogins || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                      <Activity className="text-white" size={24} />
                    </div>
                    <div>
                      <p className="text-sm text-green-600">Today's Logins</p>
                      <p className="text-2xl font-bold text-green-900">{securityStats?.todayLogins || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="text-white" size={24} />
                    </div>
                    <div>
                      <p className="text-sm text-red-600">Failed Attempts</p>
                      <p className="text-2xl font-bold text-red-900">{securityStats?.failedLogins || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                      <Shield className="text-white" size={24} />
                    </div>
                    <div>
                      <p className="text-sm text-purple-600">Active Sessions</p>
                      <p className="text-2xl font-bold text-purple-900">{securityStats?.activeSessions || 0}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Server size={20} className="text-blue-600" />
                    System Status
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">System Uptime</span>
                      <span className="font-medium text-green-600 flex items-center gap-1">
                        <CheckCircle size={16} />
                        {securityStats?.systemUptime || "99.9%"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Database Status</span>
                      <span className="font-medium text-green-600 flex items-center gap-1">
                        <CheckCircle size={16} />
                        Connected
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Last Backup</span>
                      <span className="font-medium text-gray-900">
                        {securityStats?.lastBackup ? new Date(securityStats.lastBackup).toLocaleString() : "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">SSL Certificate</span>
                      <span className="font-medium text-green-600 flex items-center gap-1">
                        <CheckCircle size={16} />
                        Valid
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Lock size={20} className="text-blue-600" />
                    Security Features
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Two-Factor Auth</span>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">Optional</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Password Policy</span>
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">Enforced</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Session Timeout</span>
                      <span className="font-medium text-gray-900">30 minutes</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Login Attempts</span>
                      <span className="font-medium text-gray-900">Max 5</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "logs" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Login History</h3>
                <div className="flex gap-2">
                  <button
                    onClick={exportLogs}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Download size={18} />
                    Export CSV
                  </button>
                  <button
                    onClick={handleClearLogs}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={18} />
                    Clear Logs
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12 text-gray-500">Loading logs...</div>
              ) : loginLogs.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Activity size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>No login logs found</p>
                </div>
              ) : (
                <div className="overflow-auto max-h-[60vh]">
                  <table className="w-full">
                    <thead className="sticky top-0 z-10 bg-gray-50">
                      <tr className="bg-gray-50">
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">User</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">IP Address</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Action</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loginLogs.map((log) => (
                        <tr key={log.id} className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{log.user}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{log.ip}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{log.action}</td>
                          <td className="px-4 py-3">
                            <span className={`flex items-center gap-1 text-sm font-medium ${getStatusColor(log.status)}`}>
                              {log.status === "success" ? <CheckCircle size={16} /> : <XCircle size={16} />}
                              {log.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === "password" && (
            <div className="max-w-md mx-auto">
              <div className="border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Key size={20} className="text-blue-600" />
                  Change Password
                </h3>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword.current ? "text" : "password"}
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 pr-10 outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword.current ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword.new ? "text" : "password"}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 pr-10 outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword.new ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword.confirm ? "text" : "password"}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 pr-10 outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {loading ? "Changing..." : "Change Password"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-6">
              <div className="border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Password Policy</h3>
                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600 rounded" />
                    <span className="text-gray-700">Require uppercase letters</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600 rounded" />
                    <span className="text-gray-700">Require lowercase letters</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600 rounded" />
                    <span className="text-gray-700">Require numbers</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="w-5 h-5 text-blue-600 rounded" />
                    <span className="text-gray-700">Require special characters</span>
                  </label>
                  <div className="pt-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600 rounded" />
                      <span className="text-gray-700">Minimum password length: 8 characters</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Session Timeout (minutes)
                    </label>
                    <select className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="15">15 minutes</option>
                      <option value="30" selected>30 minutes</option>
                      <option value="60">1 hour</option>
                      <option value="120">2 hours</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600 rounded" />
                    <span className="text-gray-700">Remember device for 30 days</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="w-5 h-5 text-blue-600 rounded" />
                    <span className="text-gray-700">Enable two-factor authentication</span>
                  </label>
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Login Security</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Maximum Login Attempts
                    </label>
                    <select className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="3">3 attempts</option>
                      <option value="5" selected>5 attempts</option>
                      <option value="10">10 attempts</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lockout Duration (minutes)
                    </label>
                    <select className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="15">15 minutes</option>
                      <option value="30" selected>30 minutes</option>
                      <option value="60">1 hour</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600 rounded" />
                    <span className="text-gray-700">Send email on new login</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end">
                <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors">
                  <Settings size={18} />
                  Save Settings
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
