import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import dayjs from "dayjs";
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
  X,
  Users,
  Building2,
  Calendar,
  Bell,
  File,
  BookOpen,
  Phone,
  CalendarCheck,
  RefreshCw,
  Eye,
  Play,
} from "lucide-react";

import PageHeader from "../../components/common/PageHeader";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Toggle from "../../components/ui/Toggle";
import StatCard from "../../components/common/StatCard";

const POLICY_TYPES = [
  {
    id: "leave",
    name: "Leave Policy",
    icon: CalendarCheck,
    color: "bg-blue-50 text-blue-600",
    defaultSubject: "Company Leave Policy - Important Information",
    defaultBody: `Dear {{employee_name}},

We hope this email finds you well. As part of our ongoing commitment to keep all employees informed about company policies, we are sharing the updated Leave Policy.

KEY POINTS:

1. Annual Leave Entitlement
   - Paid Annual Leave: As per your employment contract
   - Leaves must be applied at least 3 days in advance for planned absences
   - Emergency leaves require immediate intimation to your supervisor

2. Leave Application Process
   - Submit leave requests through the HRMS portal
   - All leaves require manager approval
   - Sick leaves must be supported by medical documentation for 3+ consecutive days

3. Leave Types Available
   - Casual Leave (CL)
   - Sick Leave (SL)
   - Earned Leave (EL)
   - Maternity/Paternity Leave
   - Loss of Pay (LOP)

4. Carry Forward Policy
   - Leaves can be carried forward as per company policy
   - Maximum carry forward limit applies
   - Encashment options available at year-end

5. Holidays
   - All gazetted public holidays are observed
   - Check the company calendar for the complete list

Please read the complete policy document attached. If you have any questions, please reach out to the HR department.

Best regards,
HR Department`,
  },
  {
    id: "call",
    name: "Call Policy",
    icon: Phone,
    color: "bg-green-50 text-green-600",
    defaultSubject: "Office Call Policy - Guidelines for Employees",
    defaultBody: `Dear {{employee_name}},

We hope this message finds you well. Please find below the company's official Call Policy guidelines for all employees.

CALL HANDLING GUIDELINES:

1. Response Time
   - All official calls must be answered within 3 rings
   - Voicemail must be checked at least twice daily
   - Return calls should be made within 4 business hours

2. Professional Conduct
   - Use professional greetings on calls
   - Avoid personal calls during work hours
   - Conference calls require punctuality

3. Client Communication
   - All client calls should be documented
   - Escalate issues to supervisor within 1 hour
   - Maintain call etiquette standards

4. Mobile Phone Usage
   - Keep phones on silent during meetings
   - Emergency contacts should be shared with HR
   - Office hours: Work phone only for official calls

5. Remote Work Calls
   - Stable internet connection required
   - Video calls: Professional background expected
   - Test audio/video before important meetings

6. Escalation Matrix
   - L1: Team Lead
   - L2: Department Manager
   - L3: HR/HOD
   - Emergency: Reception

Please adhere to these guidelines to maintain professional standards. Contact HR for any clarifications.

Best regards,
HR Department`,
  },
  {
    id: "attendance",
    name: "Attendance Policy",
    icon: Clock,
    color: "bg-purple-50 text-purple-600",
    defaultSubject: "Attendance & Punctuality Policy",
    defaultBody: `Dear {{employee_name}},

This email outlines our company's Attendance & Punctuality Policy.

ATTENDANCE EXPECTATIONS:

1. Working Hours
   - Office Hours: 9:30 AM - 6:00 PM
   - Grace period: 10 minutes
   - Late arrivals beyond grace period will be marked accordingly

2. Marking Attendance
   - Biometric/Manual attendance mandatory
   - Check-in before shift start
   - Check-out after shift end

3. Work From Home
   - WFH requires prior approval
   - Mark attendance in HRMS portal
   - Available for meetings during work hours

4. Consequences of Non-Compliance
   - Repeated late arrivals may affect performance review
   - Unauthorized absences will be marked as LOP
   - Patterns of absenteeism will be addressed formally

5. Benefits of Good Attendance
   - Eligible for attendance bonuses
   - Positive impact on annual reviews
   - Shows professional commitment

Please ensure compliance with these guidelines.

Best regards,
HR Department`,
  },
  {
    id: "code",
    name: "Code of Conduct",
    icon: BookOpen,
    color: "bg-orange-50 text-orange-600",
    defaultSubject: "Employee Code of Conduct",
    defaultBody: `Dear {{employee_name}},

As a valued member of our organization, we request you to familiarize yourself with our Code of Conduct.

CODE OF CONDUCT:

1. Professional Behavior
   - Treat all colleagues with respect
   - Maintain professional boundaries
   - No discrimination or harassment of any kind

2. Workplace Ethics
   - Honest and transparent communication
   - No conflicts of interest
   - Protect company assets and information

3. Confidentiality
   - Do not share sensitive information
   - Secure handling of client data
   - NDA compliance mandatory

4. Social Media & Communication
   - Do not speak on behalf of company without authorization
   - Professional tone in all communications
   - Respect company image and reputation

5. Dress Code
   - Business casual during office hours
   - Client-facing roles: Formals
   - Event-specific dress codes will be communicated

6. Reporting Violations
   - Report to HR or Ethics Committee
   - Whistleblower policy in place
   - No retaliation for genuine concerns

Adherence to these guidelines ensures a positive work environment for all.

Best regards,
HR Department`,
  },
];

export default function AutomatedPolicyMail() {
  const [activeTab, setActiveTab] = useState("compose");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const [selectedPolicyType, setSelectedPolicyType] = useState(null);
  const [recipientType, setRecipientType] = useState("all");
  const [selectedDepartment, setSelectedDepartment] = useState(0);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [searchEmployee, setSearchEmployee] = useState("");

  const [composeForm, setComposeForm] = useState({
    subject: "",
    body: "",
    policyType: "",
    scheduled: false,
    scheduleDate: "",
    scheduleTime: "",
  });

  const [openPolicyPreview, setOpenPolicyPreview] = useState(false);
  const [openTemplateModal, setOpenTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  const [templateForm, setTemplateForm] = useState({
    name: "",
    subject: "",
    body: "",
    category: "leave",
  });

  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    totalSent: 0,
    delivered: 0,
    failed: 0,
    scheduled: 0,
  });

  const [templates, setTemplates] = useState([
    {
      id: 1,
      name: "Annual Leave Policy 2026",
      category: "leave",
      subject: "Annual Leave Policy Update 2026",
      body: "Please find attached the updated annual leave policy...",
      createdAt: "2026-01-15",
    },
    {
      id: 2,
      name: "Call Handling Guidelines",
      category: "call",
      subject: "Updated Call Handling Guidelines",
      body: "All employees must follow the updated call handling guidelines...",
      createdAt: "2026-02-01",
    },
  ]);

  const [employees, setEmployees] = useState([
    { id: 1, employeeId: "EMP1001", name: "Harry Sharma", email: "harry@company.com", department: "Engineering" },
    { id: 2, employeeId: "EMP1002", name: "Rohit HR", email: "rohit@company.com", department: "HR" },
    { id: 3, employeeId: "EMP1003", name: "Ankit Employee", email: "ankit@company.com", department: "Sales" },
    { id: 4, employeeId: "EMP1004", name: "Priya Manager", email: "priya@company.com", department: "Marketing" },
    { id: 5, employeeId: "EMP1005", name: "Vikram Dev", email: "vikram@company.com", department: "Engineering" },
  ]);

  const departments = [
    { id: 0, name: "All Departments" },
    { id: 1, name: "Engineering" },
    { id: 2, name: "HR" },
    { id: 3, name: "Sales" },
    { id: 4, name: "Marketing" },
    { id: 5, name: "Finance" },
  ];

  useEffect(() => {
    loadLogs();
    loadStats();
  }, []);

  const loadLogs = () => {
    setLoading(true);
    setTimeout(() => {
      setLogs([
        {
          id: 1,
          policyType: "Leave Policy",
          recipients: 45,
          subject: "Company Leave Policy 2026",
          status: "delivered",
          sentAt: "2026-03-20 10:30:00",
          sentBy: "Admin",
        },
        {
          id: 2,
          policyType: "Call Policy",
          recipients: 32,
          subject: "Updated Call Guidelines",
          status: "delivered",
          sentAt: "2026-03-18 14:15:00",
          sentBy: "Admin",
        },
        {
          id: 3,
          policyType: "Attendance Policy",
          recipients: 50,
          subject: "Attendance & Punctuality Reminder",
          status: "failed",
          sentAt: "2026-03-15 09:00:00",
          sentBy: "Admin",
        },
        {
          id: 4,
          policyType: "Code of Conduct",
          recipients: 12,
          subject: "Employee Code of Conduct",
          status: "scheduled",
          sentAt: "2026-03-25 09:00:00",
          sentBy: "Admin",
        },
      ]);
      setLoading(false);
    }, 500);
  };

  const loadStats = () => {
    setStats({
      totalSent: 127,
      delivered: 119,
      failed: 8,
      scheduled: 3,
    });
  };

  const filteredEmployees = useMemo(() => {
    if (!searchEmployee) return employees;
    return employees.filter(
      (e) =>
        e.name.toLowerCase().includes(searchEmployee.toLowerCase()) ||
        e.employeeId.toLowerCase().includes(searchEmployee.toLowerCase())
    );
  }, [employees, searchEmployee]);

  const handlePolicyTypeSelect = (policy) => {
    setSelectedPolicyType(policy);
    setComposeForm({
      ...composeForm,
      policyType: policy.id,
      subject: policy.defaultSubject,
      body: policy.defaultBody,
    });
  };

  const handleRecipientSelect = (emp) => {
    setSelectedEmployees((prev) => {
      const exists = prev.find((e) => e.id === emp.id);
      if (exists) return prev.filter((e) => e.id !== emp.id);
      return [...prev, emp];
    });
  };

  const handleSendNow = async () => {
    if (!composeForm.subject || !composeForm.body) {
      toast.error("Please fill in subject and body");
      return;
    }

    const recipientCount =
      recipientType === "all"
        ? employees.length
        : recipientType === "department"
        ? employees.filter((e) => selectedDepartment === 0 || e.departmentId === selectedDepartment).length
        : selectedEmployees.length;

    if (recipientCount === 0) {
      toast.error("Please select at least one recipient");
      return;
    }

    setSending(true);
    setTimeout(() => {
      toast.success(`Policy mail sent to ${recipientCount} employees!`);
      setSending(false);

      setLogs((prev) => [
        {
          id: Date.now(),
          policyType: selectedPolicyType?.name || composeForm.policyType,
          recipients: recipientCount,
          subject: composeForm.subject,
          status: "delivered",
          sentAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
          sentBy: "Admin",
        },
        ...prev,
      ]);

      setStats((prev) => ({
        ...prev,
        totalSent: prev.totalSent + recipientCount,
        delivered: prev.delivered + recipientCount,
      }));

      resetForm();
    }, 2000);
  };

  const handleSchedule = async () => {
    if (!composeForm.subject || !composeForm.body) {
      toast.error("Please fill in subject and body");
      return;
    }

    if (!composeForm.scheduleDate || !composeForm.scheduleTime) {
      toast.error("Please select schedule date and time");
      return;
    }

    setSending(true);
    setTimeout(() => {
      toast.success("Policy mail scheduled successfully!");
      setSending(false);

      setLogs((prev) => [
        {
          id: Date.now(),
          policyType: selectedPolicyType?.name || composeForm.policyType,
          recipients: 1,
          subject: composeForm.subject,
          status: "scheduled",
          sentAt: `${composeForm.scheduleDate} ${composeForm.scheduleTime}`,
          sentBy: "Admin",
        },
        ...prev,
      ]);

      setStats((prev) => ({
        ...prev,
        scheduled: prev.scheduled + 1,
      }));

      setOpenPolicyPreview(false);
      resetForm();
    }, 1500);
  };

  const resetForm = () => {
    setSelectedPolicyType(null);
    setSelectedEmployees([]);
    setRecipientType("all");
    setSelectedDepartment(0);
    setComposeForm({
      subject: "",
      body: "",
      policyType: "",
      scheduled: false,
      scheduleDate: "",
      scheduleTime: "",
    });
  };

  const handleSaveTemplate = () => {
    if (!templateForm.name || !templateForm.subject || !templateForm.body) {
      toast.error("Please fill in all fields");
      return;
    }

    if (editingTemplate) {
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === editingTemplate.id ? { ...t, ...templateForm } : t
        )
      );
      toast.success("Template updated successfully!");
    } else {
      setTemplates((prev) => [
        ...prev,
        { id: Date.now(), ...templateForm, createdAt: dayjs().format("YYYY-MM-DD") },
      ]);
      toast.success("Template saved successfully!");
    }

    setOpenTemplateModal(false);
    setEditingTemplate(null);
    setTemplateForm({ name: "", subject: "", body: "", category: "leave" });
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      subject: template.subject,
      body: template.body,
      category: template.category,
    });
    setOpenTemplateModal(true);
  };

  const handleDeleteTemplate = (id) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    toast.success("Template deleted");
  };

  const handleLoadTemplate = (template) => {
    const policy = POLICY_TYPES.find((p) => p.id === template.category);
    setSelectedPolicyType(policy);
    setComposeForm({
      ...composeForm,
      subject: template.subject,
      body: template.body,
      policyType: template.category,
    });
    toast.success("Template loaded!");
  };

  const tabs = [
    { id: "compose", label: "Compose", icon: Send },
    { id: "templates", label: "Templates", icon: FileText },
    { id: "history", label: "Send History", icon: Clock },
  ];

  return (
    <div>
      <PageHeader
        title="Automated Policy Mail"
        desc="Send company policies (Leave, Call, Attendance) to employees via email."
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Sent"
          value={stats.totalSent}
          icon={<Send size={20} />}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Delivered"
          value={stats.delivered}
          icon={<CheckCircle size={20} />}
          color="bg-green-50 text-green-600"
        />
        <StatCard
          title="Failed"
          value={stats.failed}
          icon={<XCircle size={20} />}
          color="bg-red-50 text-red-600"
        />
        <StatCard
          title="Scheduled"
          value={stats.scheduled}
          icon={<Calendar size={20} />}
          color="bg-purple-50 text-purple-600"
        />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow border border-gray-100">
        <div className="border-b border-gray-100">
          <nav className="flex gap-1 p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-black text-white"
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
          {/* Compose Tab */}
          {activeTab === "compose" && (
            <div className="space-y-6">
              {/* Step 1: Select Policy Type */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Step 1: Select Policy Type
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {POLICY_TYPES.map((policy) => {
                    const Icon = policy.icon;
                    return (
                      <button
                        key={policy.id}
                        onClick={() => handlePolicyTypeSelect(policy)}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          selectedPolicyType?.id === policy.id
                            ? "border-black bg-gray-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${policy.color}`}
                        >
                          <Icon size={20} />
                        </div>
                        <p className="font-semibold text-gray-900">{policy.name}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Select Recipients */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Step 2: Select Recipients
                </h3>
                <div className="flex flex-wrap gap-3 mb-4">
                  <button
                    onClick={() => setRecipientType("all")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition ${
                      recipientType === "all"
                        ? "bg-black text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <Users size={18} />
                    All Employees ({employees.length})
                  </button>
                  <button
                    onClick={() => setRecipientType("department")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition ${
                      recipientType === "department"
                        ? "bg-black text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <Building2 size={18} />
                    By Department
                  </button>
                  <button
                    onClick={() => setRecipientType("individual")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition ${
                      recipientType === "individual"
                        ? "bg-black text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <File size={18} />
                    Select Individuals ({selectedEmployees.length})
                  </button>
                </div>

                {recipientType === "department" && (
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(Number(e.target.value))}
                    className="w-full md:w-64 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-black bg-white"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                )}

                {recipientType === "individual" && (
                  <div className="space-y-3">
                    <input
                      value={searchEmployee}
                      onChange={(e) => setSearchEmployee(e.target.value)}
                      placeholder="Search employees..."
                      className="w-full md:w-80 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-black"
                    />
                    <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl">
                      {filteredEmployees.map((emp) => {
                        const isSelected = selectedEmployees.find(
                          (e) => e.id === emp.id
                        );
                        return (
                          <button
                            key={emp.id}
                            onClick={() => handleRecipientSelect(emp)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition ${
                              isSelected ? "bg-blue-50" : ""
                            } ${emp !== filteredEmployees[filteredEmployees.length - 1] ? "border-b border-gray-100" : ""}`}
                          >
                            <div
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                isSelected
                                  ? "bg-black border-black"
                                  : "border-gray-300"
                              }`}
                            >
                              {isSelected && (
                                <CheckCircle size={14} className="text-white" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {emp.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {emp.employeeId} - {emp.department}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Step 3: Compose Email */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">
                    Step 3: Compose Email
                  </h3>
                  {selectedPolicyType && (
                    <button
                      onClick={() => setOpenTemplateModal(true)}
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <Plus size={16} />
                      Save as Template
                    </button>
                  )}
                </div>

                {selectedPolicyType && (
                  <div className="mb-4 flex gap-2">
                    <button
                      onClick={() =>
                        setComposeForm({
                          ...composeForm,
                          subject: selectedPolicyType.defaultSubject,
                          body: selectedPolicyType.defaultBody,
                        })
                      }
                      className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                    >
                      Reset to Default
                    </button>
                    <button
                      onClick={() => setOpenPolicyPreview(true)}
                      className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition flex items-center gap-1"
                    >
                      <Eye size={14} />
                      Preview & Send
                    </button>
                  </div>
                )}

                <div className="space-y-4">
                  <Input
                    label="Subject"
                    value={composeForm.subject}
                    onChange={(e) =>
                      setComposeForm({ ...composeForm, subject: e.target.value })
                    }
                    placeholder="Email subject..."
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Body
                    </label>
                    <textarea
                      value={composeForm.body}
                      onChange={(e) =>
                        setComposeForm({ ...composeForm, body: e.target.value })
                      }
                      rows={12}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black resize-none"
                      placeholder="Write your policy email content here..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Use {"{{employee_name}}"} as placeholder for employee names
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Templates Tab */}
          {activeTab === "templates" && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Saved Templates</h3>
                <button
                  onClick={() => {
                    setEditingTemplate(null);
                    setTemplateForm({ name: "", subject: "", body: "", category: "leave" });
                    setOpenTemplateModal(true);
                  }}
                  className="flex items-center gap-2 bg-black hover:bg-gray-900 text-white px-4 py-2 rounded-xl font-medium transition"
                >
                  <Plus size={18} />
                  New Template
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900">{template.name}</h4>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded mt-1 inline-block">
                          {template.category.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleLoadTemplate(template)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          title="Use Template"
                        >
                          <FileText size={16} />
                        </button>
                        <button
                          onClick={() => handleEditTemplate(template)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{template.subject}</p>
                    <p className="text-xs text-gray-400 line-clamp-2">{template.body}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      Created: {template.createdAt}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === "history" && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Send History</h3>
              <div className="overflow-auto max-h-[60vh]">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-gray-50">
                    <tr className="bg-gray-50">
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Policy</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Subject</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Recipients</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Sent/Scheduled</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-t border-gray-100">
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                            {log.policyType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-900 font-medium max-w-xs truncate">
                          {log.subject}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {log.recipients} employees
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                              log.status === "delivered"
                                ? "bg-green-100 text-green-700"
                                : log.status === "failed"
                                ? "bg-red-100 text-red-700"
                                : "bg-purple-100 text-purple-700"
                            }`}
                          >
                            {log.status === "delivered" && <CheckCircle size={12} />}
                            {log.status === "failed" && <XCircle size={12} />}
                            {log.status === "scheduled" && <Clock size={12} />}
                            {log.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{log.sentAt}</td>
                      </tr>
                    ))}
                    {logs.length === 0 && (
                      <tr>
                        <td colSpan="5" className="px-4 py-10 text-center text-gray-500">
                          No history found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview & Send Modal */}
      <Modal
        open={openPolicyPreview}
        title="Preview & Send Policy Mail"
        onClose={() => setOpenPolicyPreview(false)}
        width="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Email Preview</h4>
            <div className="text-sm space-y-2">
              <p>
                <span className="text-gray-500">To:</span>{" "}
                <span className="font-medium">
                  {recipientType === "all"
                    ? "All Employees"
                    : recipientType === "department"
                    ? departments.find((d) => d.id === selectedDepartment)?.name
                    : `${selectedEmployees.length} selected employees`}
                </span>
              </p>
              <p>
                <span className="text-gray-500">Subject:</span>{" "}
                <span className="font-medium">{composeForm.subject}</span>
              </p>
              <p>
                <span className="text-gray-500">Policy:</span>{" "}
                <span className="font-medium">{selectedPolicyType?.name}</span>
              </p>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-xl p-4">
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
              {composeForm.body}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Delivery Options</p>
            <div className="flex gap-3">
              <button
                onClick={handleSendNow}
                disabled={sending}
                className="flex-1 flex items-center justify-center gap-2 bg-black hover:bg-gray-900 text-white px-4 py-2.5 rounded-xl font-semibold transition disabled:opacity-50"
              >
                {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                Send Now
              </button>
              <button
                onClick={() => {
                  setComposeForm({ ...composeForm, scheduled: true });
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl font-semibold transition"
              >
                <Calendar size={18} />
                Schedule
              </button>
            </div>

            {composeForm.scheduled && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                <Input
                  label="Schedule Date"
                  type="date"
                  value={composeForm.scheduleDate}
                  onChange={(e) =>
                    setComposeForm({ ...composeForm, scheduleDate: e.target.value })
                  }
                />
                <Input
                  label="Schedule Time"
                  type="time"
                  value={composeForm.scheduleTime}
                  onChange={(e) =>
                    setComposeForm({ ...composeForm, scheduleTime: e.target.value })
                  }
                />
                <div className="col-span-2">
                  <button
                    onClick={handleSchedule}
                    disabled={sending}
                    className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl font-semibold transition disabled:opacity-50"
                  >
                    <Bell size={18} />
                    Confirm Schedule
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Template Save Modal */}
      <Modal
        open={openTemplateModal}
        title={editingTemplate ? "Edit Template" : "Save as Template"}
        onClose={() => {
          setOpenTemplateModal(false);
          setEditingTemplate(null);
        }}
      >
        <div className="space-y-4">
          <Input
            label="Template Name"
            value={templateForm.name}
            onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
            placeholder="e.g., Updated Leave Policy 2026"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={templateForm.category}
              onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-black bg-white"
            >
              {POLICY_TYPES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Subject"
            value={templateForm.subject}
            onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
            placeholder="Email subject..."
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
            <textarea
              value={templateForm.body}
              onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })}
              rows={8}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black resize-none"
              placeholder="Email body..."
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              onClick={() => {
                setOpenTemplateModal(false);
                setEditingTemplate(null);
              }}
              className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 font-semibold transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveTemplate}
              className="px-5 py-2.5 rounded-xl bg-black hover:bg-gray-900 text-white font-semibold transition"
            >
              {editingTemplate ? "Update Template" : "Save Template"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
