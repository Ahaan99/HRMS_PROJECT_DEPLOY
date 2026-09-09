import { useState, useEffect } from "react";
import PageHeader from "../../components/common/PageHeader";
import toast from "react-hot-toast";
import API from "../../services/api";
import { 
  Send, 
  Mail, 
  FileText, 
  Trash2, 
  Edit2, 
  Plus, 
  Search,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Loader2,
  X
} from "lucide-react";

export default function EmailSystem() {
  const [activeTab, setActiveTab] = useState("compose");
  const [templates, setTemplates] = useState([]);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [emailForm, setEmailForm] = useState({
    to: "",
    toName: "",
    subject: "",
    body: "",
    templateId: ""
  });
  const [bulkForm, setBulkForm] = useState({
    recipients: "",
    subject: "",
    body: "",
    templateId: ""
  });
  const [templateModal, setTemplateModal] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    templateName: "",
    subject: "",
    body: "",
    category: "general"
  });
  const [editingTemplate, setEditingTemplate] = useState(null);

  useEffect(() => {
    fetchTemplates();
    fetchLogs();
    fetchStats();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await API.get("/super-admin/email/templates");
      setTemplates(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch templates:", err);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await API.get("/super-admin/email/logs");
      setLogs(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await API.get("/super-admin/email/stats");
      setStats(res.data.data || null);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!emailForm.to || !emailForm.subject || !emailForm.body) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const res = await API.post("/super-admin/email/send", emailForm);
      if (res.data.success) {
        toast.success("Email sent successfully!");
        setEmailForm({ to: "", toName: "", subject: "", body: "", templateId: "" });
        fetchLogs();
        fetchStats();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to send email");
    } finally {
      setLoading(false);
    }
  };

  const handleSendBulkEmail = async (e) => {
    e.preventDefault();
    const recipients = bulkForm.recipients.split("\n").map(line => {
      const [email, name] = line.split(",").map(s => s.trim());
      return { email, name };
    }).filter(r => r.email);

    if (recipients.length === 0) {
      toast.error("Please add at least one recipient");
      return;
    }

    if (!bulkForm.subject && !bulkForm.body && !bulkForm.templateId) {
      toast.error("Please add subject, body or select a template");
      return;
    }

    setLoading(true);
    try {
      const res = await API.post("/super-admin/email/send-bulk", {
        recipients,
        subject: bulkForm.subject,
        body: bulkForm.body,
        templateId: bulkForm.templateId || null
      });
      if (res.data.success) {
        toast.success(`Bulk email sent! ${res.data.data.sent} sent, ${res.data.data.failed} failed`);
        setBulkForm({ recipients: "", subject: "", body: "", templateId: "" });
        fetchLogs();
        fetchStats();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to send bulk email");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    if (!templateForm.templateName || !templateForm.subject || !templateForm.body) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      if (editingTemplate) {
        await API.put(`/super-admin/email/templates/${editingTemplate.id}`, templateForm);
        toast.success("Template updated successfully!");
      } else {
        await API.post("/super-admin/email/templates", templateForm);
        toast.success("Template saved successfully!");
      }
      setTemplateModal(false);
      setTemplateForm({ templateName: "", subject: "", body: "", category: "general" });
      setEditingTemplate(null);
      fetchTemplates();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save template");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm("Are you sure you want to delete this template?")) return;
    
    try {
      await API.delete(`/super-admin/email/templates/${templateId}`);
      toast.success("Template deleted successfully!");
      fetchTemplates();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete template");
    }
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setTemplateForm({
      templateName: template.template_name,
      subject: template.subject,
      body: template.body,
      category: template.category || "general"
    });
    setTemplateModal(true);
  };

  const loadTemplate = (template) => {
    setEmailForm({
      ...emailForm,
      subject: template.subject,
      body: template.body,
      templateId: template.id
    });
    toast.success("Template loaded!");
  };

  const tabs = [
    { id: "compose", label: "Send Email", icon: Send },
    { id: "bulk", label: "Bulk Email", icon: FileText },
    { id: "templates", label: "Templates", icon: Mail },
    { id: "logs", label: "Email Logs", icon: Clock },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Email System" desc="Email templates, logs, and automation." />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Mail className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Emails</p>
              <p className="text-xl font-bold text-gray-900">{stats?.total || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Sent</p>
              <p className="text-xl font-bold text-gray-900">{stats?.sent || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="text-red-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Failed</p>
              <p className="text-xl font-bold text-gray-900">{stats?.failed || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Success Rate</p>
              <p className="text-xl font-bold text-gray-900">
                {stats?.total > 0 ? Math.round((stats.sent / stats.total) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-100">
          <nav className="flex gap-1 p-2 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
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
          {activeTab === "compose" && (
            <form onSubmit={handleSendEmail} className="space-y-4 max-w-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recipient Email *
                  </label>
                  <input
                    type="email"
                    value={emailForm.to}
                    onChange={(e) => setEmailForm({ ...emailForm, to: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="recipient@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recipient Name
                  </label>
                  <input
                    type="text"
                    value={emailForm.toName}
                    onChange={(e) => setEmailForm({ ...emailForm, toName: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Template (Optional)
                </label>
                <select
                  value={emailForm.templateId}
                  onChange={(e) => {
                    const template = templates.find(t => t.id === Number(e.target.value));
                    if (template) {
                      setEmailForm({
                        ...emailForm,
                        templateId: e.target.value,
                        subject: template.subject,
                        body: template.body
                      });
                    } else {
                      setEmailForm({ ...emailForm, templateId: "" });
                    }
                  }}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a template</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.template_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Email subject"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Body *
                </label>
                <textarea
                  value={emailForm.body}
                  onChange={(e) => setEmailForm({ ...emailForm, body: e.target.value })}
                  rows={8}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Write your email content here..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                Send Email
              </button>
            </form>
          )}

          {activeTab === "bulk" && (
            <form onSubmit={handleSendBulkEmail} className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipients (one per line: email, name)
                </label>
                <textarea
                  value={bulkForm.recipients}
                  onChange={(e) => setBulkForm({ ...bulkForm, recipients: e.target.value })}
                  rows={6}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
                  placeholder="john@example.com, John Doe&#10;jane@example.com, Jane Smith"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Template (Optional)
                </label>
                <select
                  value={bulkForm.templateId}
                  onChange={(e) => {
                    const template = templates.find(t => t.id === Number(e.target.value));
                    if (template) {
                      setBulkForm({
                        ...bulkForm,
                        templateId: e.target.value,
                        subject: template.subject,
                        body: template.body
                      });
                    } else {
                      setBulkForm({ ...bulkForm, templateId: "" });
                    }
                  }}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a template</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.template_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={bulkForm.subject}
                  onChange={(e) => setBulkForm({ ...bulkForm, subject: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Email subject"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Body
                </label>
                <textarea
                  value={bulkForm.body}
                  onChange={(e) => setBulkForm({ ...bulkForm, body: e.target.value })}
                  rows={8}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Write your email content here..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                Send to All Recipients
              </button>
            </form>
          )}

          {activeTab === "templates" && (
            <div>
              <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Email Templates</h3>
                <button
                  onClick={() => {
                    setEditingTemplate(null);
                    setTemplateForm({ templateName: "", subject: "", body: "", category: "general" });
                    setTemplateModal(true);
                  }}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <Plus size={18} />
                  Add Template
                </button>
              </div>

              {templates.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No templates saved yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className="border border-gray-100 rounded-lg p-4 hover:border-gray-300 transition cursor-pointer group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">{template.template_name}</h4>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditTemplate(template);
                            }}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTemplate(template.id);
                            }}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{template.subject}</p>
                      <p className="text-xs text-gray-400 line-clamp-2">{template.body}</p>
                      <span className="inline-block mt-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {template.category}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "logs" && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Logs</h3>
              {logs.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No email logs yet.</p>
              ) : (
                <div className="overflow-auto max-h-[60vh]">
                  <table className="w-full">
                    <thead className="sticky top-0 z-10 bg-gray-50">
                      <tr className="bg-gray-50">
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Recipient</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Subject</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log.id} className="border-t border-gray-100">
                          <td className="px-4 py-3">
                            <p className="text-sm text-gray-900">{log.recipient_email}</p>
                            {log.recipient_name && (
                              <p className="text-xs text-gray-500">{log.recipient_name}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                            {log.subject}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              log.status === "sent" 
                                ? "bg-green-100 text-green-700" 
                                : "bg-red-100 text-red-700"
                            }`}>
                              {log.status === "sent" ? <CheckCircle size={12} /> : <XCircle size={12} />}
                              {log.status}
                            </span>
                            {log.error_message && (
                              <p className="text-xs text-red-500 mt-1 max-w-xs truncate" title={log.error_message}>
                                {log.error_message}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {templateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingTemplate ? "Edit Template" : "Add Template"}
              </h3>
              <button
                onClick={() => {
                  setTemplateModal(false);
                  setEditingTemplate(null);
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSaveTemplate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={templateForm.templateName}
                  onChange={(e) => setTemplateForm({ ...templateForm, templateName: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="My Email Template"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={templateForm.category}
                  onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="general">General</option>
                  <option value="offer">Offer Letter</option>
                  <option value="interview">Interview</option>
                  <option value="onboarding">Onboarding</option>
                  <option value="hr">HR</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  value={templateForm.subject}
                  onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Email subject"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Body *
                </label>
                <textarea
                  value={templateForm.body}
                  onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })}
                  rows={6}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Write your email template here..."
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setTemplateModal(false);
                    setEditingTemplate(null);
                  }}
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
                  {editingTemplate ? "Update Template" : "Save Template"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
