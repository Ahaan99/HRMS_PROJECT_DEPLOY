import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import {
  Bot,
  MessageSquare,
  Users,
  Briefcase,
  UserCheck,
  TrendingUp,
  Send,
  Settings,
  Search,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  Eye,
  X,
  ChevronDown,
  ChevronRight,
  Zap,
  BarChart3,
  FileText,
  Phone,
  Mail,
  Star,
  MessageCircle,
  Sparkles,
  Brain,
  Activity,
  Clock as ClockIcon,
  TrendingDown,
  Save,
} from "lucide-react";

import PageHeader from "../../components/common/PageHeader";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Toggle from "../../components/ui/Toggle";
import StatCard from "../../components/common/StatCard";


import API from "../../services/api";
import {
  getConversations,
  getMessages,
  sendMessage,
} from "../../services/chatService";

const AI_CHANNELS = {
  client: {
    id: "client",
    name: "Client Chat",
    icon: Briefcase,
    color: "bg-blue-50 text-blue-600",
    borderColor: "border-blue-500",
    headerColor: "bg-blue-600",
    placeholder: "AI will respond to client queries about services, pricing, projects...",
    greeting: "Hello! I'm your AI assistant. How can I help you today?",
    topics: ["Services", "Pricing", "Projects", "Support", "Contracts"],
  },
  candidate: {
    id: "candidate",
    name: "Candidate Chat",
    icon: UserCheck,
    color: "bg-purple-50 text-purple-600",
    borderColor: "border-purple-500",
    headerColor: "bg-purple-600",
    placeholder: "AI will respond to candidate queries about jobs, interviews, process...",
    greeting: "Hi there! I'm here to help with your application. What would you like to know?",
    topics: ["Jobs", "Applications", "Interviews", "Benefits", "Process"],
  },
  sales: {
    id: "sales",
    name: "Sales Team Chat",
    icon: TrendingUp,
    color: "bg-green-50 text-green-600",
    borderColor: "border-green-500",
    headerColor: "bg-green-600",
    placeholder: "AI will respond to sales team queries about leads, targets, proposals...",
    greeting: "Welcome! Your AI sales assistant is ready. How can I help you close more deals?",
    topics: ["Leads", "Targets", "Proposals", "CRM", "Forecasting"],
  },

  employee: {
    id: "employee",
    name: "Employee Chat",
    icon: Users,
    color: "bg-orange-50 text-orange-600",
    borderColor: "border-orange-500",
    headerColor: "bg-orange-600",
    placeholder: "AI will respond to employee queries about attendance, leave, salary...",
    greeting: "Hello! I'm your Employee Assistant. How can I help you today?",
    topics: ["Leave", "Attendance", "Salary", "Performance", "Policies"],
  },
};

const AI_RESPONSE_TEMPLATES = [
  { id: 1, category: "client", keyword: "pricing", response: "Our pricing starts from $999/month for basic packages. Would you like me to share our detailed pricing brochure?", intent: "pricing_inquiry" },
  { id: 2, category: "client", keyword: "demo", response: "I'd be happy to schedule a demo for you! Our team will reach out within 24 hours to confirm a suitable time.", intent: "demo_request" },
  { id: 3, category: "client", keyword: "support", response: "Our support team is available 24/7. You can reach us at support@company.com or call our helpline.", intent: "support_request" },
  { id: 4, category: "candidate", keyword: "jobs", response: "We're currently hiring! Please check our careers page for open positions. Which role interests you?", intent: "job_inquiry" },
  { id: 5, category: "candidate", keyword: "interview", response: "Your interview has been scheduled. You'll receive a confirmation email with all details within 24 hours.", intent: "interview_info" },
  { id: 6, category: "candidate", keyword: "status", response: "Your application is under review. We'll update you within 5-7 working days.", intent: "application_status" },
  { id: 7, category: "sales", keyword: "lead", response: "New lead assigned! Check your CRM dashboard for full details. Remember to follow up within 24 hours.", intent: "lead_assigned" },
  { id: 8, category: "sales", keyword: "target", response: "You're currently at 75% of your monthly target. Keep up the great work! Need help with any deals?", intent: "target_progress" },
  { id: 9, category: "sales", keyword: "commission", response: "Your commission structure: 5% on deals up to $10K, 8% on $10K-$50K, 12% on $50K+. View detailed breakdown in your dashboard.", intent: "commission_info" },
];

const SAMPLE_CONVERSATIONS = {
  client: [
    { id: 1, contact: "Acme Corp", email: "contact@acme.com", lastMessage: "What's your pricing for enterprise plan?", unread: 2, timestamp: "10:30 AM", status: "active", messages: [
      { sender: "client", text: "Hi, I need information about your enterprise pricing", timestamp: "10:25 AM" },
      { sender: "ai", text: "Hello! Thank you for reaching out. Our enterprise plan starts at $4,999/month. Would you like a detailed breakdown?", timestamp: "10:26 AM" },
      { sender: "client", text: "Yes please, also what's included in the support package?", timestamp: "10:28 AM" },
      { sender: "ai", text: "Enterprise includes 24/7 dedicated support, account manager, SLA guarantee, and custom integrations. Shall I schedule a call with our sales team?", timestamp: "10:29 AM" },
      { sender: "client", text: "What's your pricing for enterprise plan?", timestamp: "10:30 AM" },
    ]},
    { id: 2, contact: "TechStart Inc", email: "info@techstart.com", lastMessage: "Thank you for the information!", unread: 0, timestamp: "09:15 AM", status: "resolved" },
  ],
  candidate: [
    { id: 3, contact: "Rahul Verma", email: "rahul@email.com", lastMessage: "When will I hear back about my application?", unread: 1, timestamp: "11:00 AM", status: "active", messages: [
      { sender: "candidate", text: "I applied for the Software Engineer position last week", timestamp: "10:55 AM" },
      { sender: "ai", text: "Hi Rahul! Great to hear from you. Your application is under review by our technical team. We'll update you within 5 business days.", timestamp: "10:56 AM" },
      { sender: "candidate", text: "When will I hear back about my application?", timestamp: "11:00 AM" },
    ]},
    { id: 4, contact: "Priya Singh", email: "priya@email.com", lastMessage: "Interview confirmed for tomorrow", unread: 0, timestamp: "10:00 AM", status: "resolved" },
  ],
  sales: [
    { id: 5, contact: "Ankit Employee", email: "ankit@company.com", lastMessage: "Need help with this proposal", unread: 1, timestamp: "10:45 AM", status: "active", messages: [
      { sender: "sales", text: "AI, I need help with a proposal for a $50K deal", timestamp: "10:40 AM" },
      { sender: "ai", text: "Sure Ankit! For a $50K deal, you should include: Executive summary, ROI analysis, case studies, implementation timeline, and 8% commission rate. Need me to generate a template?", timestamp: "10:41 AM" },
      { sender: "sales", text: "Need help with this proposal", timestamp: "10:45 AM" },
    ]},
    { id: 6, contact: "Vikram Dev", email: "vikram@company.com", lastMessage: "Target updated!", unread: 0, timestamp: "09:30 AM", status: "resolved" },
  ],
};

const AI_INSIGHTS = [
  { type: "positive", message: "Client satisfaction score increased by 15% this month", icon: TrendingUp },
  { type: "info", message: "Average AI response time: 3.2 seconds", icon: Zap },
  { type: "warning", message: "5 candidate queries need human intervention", icon: AlertCircle },
  { type: "positive", message: "Sales team closing rate improved by 22%", icon: TrendingUp },
];

export default function AIChatHub() {
  const [activeChannel, setActiveChannel] = useState("client");
  const [activeTab, setActiveTab] = useState("conversations");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [aiTyping, setAITyping] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
  const [openAnalytics, setOpenAnalytics] = useState(false);

  const [aiSettings, setAISettings] = useState({
    autoRespond: true,
    humanHandoff: true,
    responseTime: 3,
    sentimentAnalysis: true,
    language: "en",
    workingHours: "9 AM - 6 PM",
  });

  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({
    category: "client",
    keyword: "",
    response: "",
    intent: "",
  });
  const [savingSettings, setSavingSettings] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadConversations();
  }, [activeChannel]);

  useEffect(() => {
    loadTemplates();
    loadSettings();
  }, []);

  const loadTemplates = async () => {
    try {
      setTemplatesLoading(true);
      const res = await API.get("/automation/chatbot/templates");
      setTemplates(res.data?.data || []);
    } catch (err) {
      console.log(err);
      toast.error("Failed to load templates");
    } finally {
      setTemplatesLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const res = await API.get("/automation/chatbot/settings");
      if (res.data?.data && !Array.isArray(res.data.data)) {
        setAISettings((prev) => ({ ...prev, ...res.data.data }));
      }
    } catch (err) {
      console.log(err);
    }
  };

  const saveSettings = async () => {
    try {
      setSavingSettings(true);
      await API.put("/automation/chatbot/settings", aiSettings);
      toast.success("AI Settings saved successfully!");
    } catch (err) {
      console.log(err);
      toast.error("Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const openAddTemplate = () => {
    setEditingTemplate(null);
    setTemplateForm({ category: activeChannel, keyword: "", response: "", intent: "" });
    setTemplateModalOpen(true);
  };

  const openEditTemplate = (template) => {
    setEditingTemplate(template);
    setTemplateForm({
      category: template.category,
      keyword: template.keyword,
      response: template.response,
      intent: template.intent || "",
    });
    setTemplateModalOpen(true);
  };

  const saveTemplate = async () => {
    if (!templateForm.keyword.trim() || !templateForm.response.trim()) {
      toast.error("Keyword and response are required");
      return;
    }
    try {
      if (editingTemplate) {
        await API.put(`/automation/chatbot/templates/${editingTemplate.id}`, templateForm);
        toast.success("Template updated");
      } else {
        await API.post("/automation/chatbot/templates", templateForm);
        toast.success("Template created");
      }
      setTemplateModalOpen(false);
      await loadTemplates();
    } catch (err) {
      console.log(err);
      toast.error("Failed to save template");
    }
  };

  const removeTemplate = async (template) => {
    if (!window.confirm(`Delete template "${template.keyword}"?`)) return;
    try {
      await API.delete(`/automation/chatbot/templates/${template.id}`);
      toast.success("Template deleted");
      await loadTemplates();
    } catch (err) {
      console.log(err);
      toast.error("Failed to delete template");
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);


const loadConversations = async () => {
  try {
    setLoading(true);

    const res = await API.get("/automation/chatbot/conversations", {
      params: { limit: 50 },
    });

    const rows = res.data?.data?.conversations || [];
    const sessions = rows.reduce((acc, row) => {
      const session = acc[row.session_id] || {
        session_id: row.session_id,
        contact: "AI Assistant",
        email: "",
        status: "active",
        lastMessage: "",
        timestamp: row.created_at,
      };

      const createdAt = new Date(row.created_at).getTime();
      if (createdAt >= new Date(session.timestamp).getTime()) {
        session.lastMessage = row.response || row.message;
        session.timestamp = row.created_at;
      }

      acc[row.session_id] = session;
      return acc;
    }, {});

    setConversations(Object.values(sessions));
  } catch (err) {
    console.log(err);
    toast.error("Failed to load conversations");
  } finally {
    setLoading(false);
  }
};

const loadMessages = async (conversation) => {
  try {
    setSelectedConversation(conversation);

    const res = await API.get("/automation/chatbot/conversations", {
      params: { session_id: conversation.session_id },
    });

    const rows = res.data?.data?.conversations || [];
    const formatted = rows.flatMap((row) => {
      const items = [{
        sender: row.sender_type === "ai" ? "ai" : "user",
        text: row.message,
        timestamp: row.created_at,
      }];

      if (row.response) {
        items.push({
          sender: "ai",
          text: row.response,
          timestamp: row.created_at,
        });
      }

      return items;
    });

    setMessages(formatted);
  } catch (err) {
    console.log(err);
    toast.error("Failed to load messages");
  }
};

const handleSendMessage = async () => {
  try {
    if (!newMessage.trim()) return;

    setAITyping(true);

    const payload = {
      message: newMessage,
      session_id: selectedConversation?.session_id,
      user_type: "ADMIN",
    };

    const res = await API.post("/automation/chatbot/message", payload);
    setNewMessage("");

    const session_id = res.data?.data?.session_id || selectedConversation?.session_id;
    const updatedConversation = {
      ...selectedConversation,
      session_id,
      lastMessage: newMessage,
    };

    setSelectedConversation(updatedConversation);
    await loadMessages(updatedConversation);
    await loadConversations();
  } catch (err) {
    console.log(err);
    toast.error("Failed to send message");
  } finally {
    setAITyping(false);
  }
};


  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredConversations = useMemo(() => {
    if (!search) return conversations;
    return conversations.filter(
      (c) =>
        c.contact?.toLowerCase().includes(search.toLowerCase()) ||
        c.lastMessage?.toLowerCase().includes(search.toLowerCase())
    );
  }, [conversations, search]);

  const stats = useMemo(() => ({
    totalChats: 156,
    activeChats: 12,
    resolvedToday: 28,
    avgResponseTime: "3.2s",
    aiAccuracy: "94%",
    satisfaction: "4.8/5",
  }), []);

  const channelConfig = AI_CHANNELS[activeChannel];
  const ChannelIcon = channelConfig.icon;

  const tabs = [
    { id: "conversations", label: "Conversations", icon: MessageSquare },
    { id: "templates", label: "AI Templates", icon: FileText },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "settings", label: "AI Settings", icon: Settings },
  ];

  return (
    <div>
      <PageHeader
        title="AI Chat Hub"
        desc="Unified AI-powered chatbot for Clients, Candidates, and Sales Team"
      />

      {/* Channel Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Object.entries(AI_CHANNELS).map(([key, channel]) => {
          const Icon = channel.icon;
          const convCount = SAMPLE_CONVERSATIONS[key]?.length || 0;
          return (
            <button
              key={key}
              onClick={() => setActiveChannel(key)}
              className={`p-4 rounded-xl border-2 transition ${
                activeChannel === key
                  ? `${channel.borderColor} ${channel.color}`
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={24} />
                <div className="text-left">
                  <p className="font-bold text-gray-900">{channel.name}</p>
                  <p className="text-sm text-gray-500">{convCount} conversations</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Conversations Tab */}
      {activeTab === "conversations" && (
        <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
          <div className="flex h-[600px]">
            {/* Sidebar */}
            <div className="w-80 border-r border-gray-100 flex flex-col">
              <div className="p-4 border-b border-gray-100">
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search conversations..."
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <RefreshCw size={24} className="animate-spin text-gray-400" />
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <MessageSquare size={40} className="mb-2 text-gray-300" />
                    <p>No conversations</p>
                  </div>
                ) : (
                  filteredConversations.map((conv) => {
                    const isSelected = selectedConversation?.session_id === conv.session_id;
                    return (
                      <button
                        key={conv.session_id}
                        onClick={() => loadMessages(conv)}
                        className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition border-b border-gray-50 ${
                          isSelected ? "bg-blue-50" : ""
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full ${channelConfig.color} flex items-center justify-center`}>
                          <ChannelIcon size={18} />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center justify-between">
                            <p className={`font-semibold truncate ${conv.unread > 0 ? "text-gray-900" : "text-gray-700"}`}>
                              {conv.contact}
                            </p>
                            <span className="text-xs text-gray-400">{conv.timestamp}</span>
                          </div>
                          <p className="text-sm text-gray-500 truncate">{conv.lastMessage}</p>
                          {conv.unread > 0 && (
                            <span className="inline-block mt-1 px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded-full">
                              {conv.unread}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="p-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm text-gray-500">AI Online</span>
                </div>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  <div className={`p-4 border-b border-gray-100 flex items-center justify-between ${channelConfig.headerColor} text-white`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <ChannelIcon size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold">{selectedConversation.contact}</h3>
                        <p className="text-sm text-white/80">{selectedConversation.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        selectedConversation.status === "active" ? "bg-white/20" : "bg-green-500"
                      }`}>
                        {selectedConversation.status === "active" ? "Active" : "Resolved"}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, idx) => {
                      const isAI = msg.sender === "ai";
                      return (
                        <div key={idx} className={`flex ${isAI ? "justify-start" : "justify-end"}`}>
                          <div
                            className={`max-w-[70%] px-4 py-3 rounded-2xl ${
                              isAI
                                ? "bg-gray-100 text-gray-900 rounded-bl-md"
                                : `${channelConfig.headerColor} text-white rounded-br-md`
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              {isAI && <Bot size={14} />}
                              <span className="text-xs opacity-70">{msg.timestamp}</span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                          </div>
                        </div>
                      );
                    })}
                    {aiTyping && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-md flex items-center gap-2">
                          <Bot size={16} className="text-blue-600" />
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="p-4 border-t border-gray-100">
                    <div className="flex items-end gap-3">
                      <div className="flex-1 relative">
                        <textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder={channelConfig.placeholder}
                          rows={1}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black resize-none"
                        />
                      </div>
                      <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className={`p-3 rounded-xl transition ${
                          newMessage.trim()
                            ? `${channelConfig.headerColor} text-white hover:opacity-90`
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        <Send size={20} />
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                      <Sparkles size={12} />
                      AI-powered responses • Press Enter to send
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                  <div className={`w-20 h-20 ${channelConfig.color} rounded-full flex items-center justify-center mb-4`}>
                    <Bot size={40} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Select a conversation
                  </h3>
                  <p className="text-sm text-gray-500">
                    Choose from the list to view and respond
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Templates Tab */}
      {activeTab === "templates" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">AI Response Templates</h3>
              <button
                onClick={openAddTemplate}
                className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition"
              >
                <Plus size={18} />
                Add Template
              </button>
            </div>

            {templatesLoading ? (
              <div className="py-12 text-center text-gray-400">Loading templates...</div>
            ) : templates.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                No templates yet. Click "Add Template" to create one.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => {
                  const channel = AI_CHANNELS[template.category] || AI_CHANNELS.client;
                  const ChannelIcon = channel.icon;
                  return (
                    <div key={template.id} className={`border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className={`flex items-center gap-2 px-2 py-1 rounded-lg ${channel.color}`}>
                          <ChannelIcon size={14} />
                          <span className="text-xs font-medium capitalize">{template.category}</span>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => openEditTemplate(template)}
                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                            aria-label="Edit template"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => removeTemplate(template)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                            aria-label="Delete template"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-gray-900 mb-1">Keyword: "{template.keyword}"</p>
                      <p className="text-sm text-gray-600 line-clamp-3">{template.response}</p>
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <span className="text-xs text-gray-400">Intent: {template.intent || "—"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <StatCard title="Total Chats" value={stats.totalChats} icon={<MessageSquare size={20} />} color="bg-blue-50 text-blue-600" />
            <StatCard title="Active Now" value={stats.activeChats} icon={<Activity size={20} />} color="bg-green-50 text-green-600" />
            <StatCard title="Resolved Today" value={stats.resolvedToday} icon={<CheckCircle size={20} />} color="bg-purple-50 text-purple-600" />
            <StatCard title="Avg Response" value={stats.avgResponseTime} icon={<Zap size={20} />} color="bg-yellow-50 text-yellow-600" />
            <StatCard title="AI Accuracy" value={stats.aiAccuracy} icon={<Brain size={20} />} color="bg-indigo-50 text-indigo-600" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">AI Performance Insights</h3>
              <div className="space-y-4">
                {AI_INSIGHTS.map((insight, idx) => {
                  const Icon = insight.icon;
                  return (
                    <div key={idx} className={`flex items-start gap-3 p-4 rounded-xl ${
                      insight.type === "positive" ? "bg-green-50" :
                      insight.type === "warning" ? "bg-yellow-50" : "bg-blue-50"
                    }`}>
                      <Icon size={20} className={insight.type === "positive" ? "text-green-600" : insight.type === "warning" ? "text-yellow-600" : "text-blue-600"} />
                      <p className={`text-sm ${
                        insight.type === "positive" ? "text-green-700" :
                        insight.type === "warning" ? "text-yellow-700" : "text-blue-700"
                      }`}>{insight.message}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Channel Performance</h3>
              <div className="space-y-4">
                {Object.entries(AI_CHANNELS).map(([key, channel]) => {
                  const Icon = channel.icon;
                  const count = SAMPLE_CONVERSATIONS[key]?.length || 0;
                  const percentage = Math.round((count / 10) * 100);
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Icon size={18} className={channel.color.replace("bg-", "text-").replace("-50", "-600")} />
                          <span className="font-medium text-gray-900">{channel.name}</span>
                        </div>
                        <span className="text-sm text-gray-500">{count} chats</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${channel.color.replace("-50", "-500")}`}
                          style={{ width: `${percentage * 10}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <div className="bg-white rounded-2xl shadow border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">AI Chat Settings</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium text-gray-900">Auto Respond</p>
                  <p className="text-sm text-gray-500">AI automatically responds to queries</p>
                </div>
                <button
                  onClick={() => setAISettings({ ...aiSettings, autoRespond: !aiSettings.autoRespond })}
                  className={`w-12 h-6 rounded-full transition ${aiSettings.autoRespond ? "bg-green-500" : "bg-gray-300"}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition transform ${aiSettings.autoRespond ? "translate-x-6" : "translate-x-0.5"}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium text-gray-900">Human Handoff</p>
                  <p className="text-sm text-gray-500">Transfer to human for complex queries</p>
                </div>
                <button
                  onClick={() => setAISettings({ ...aiSettings, humanHandoff: !aiSettings.humanHandoff })}
                  className={`w-12 h-6 rounded-full transition ${aiSettings.humanHandoff ? "bg-green-500" : "bg-gray-300"}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition transform ${aiSettings.humanHandoff ? "translate-x-6" : "translate-x-0.5"}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium text-gray-900">Sentiment Analysis</p>
                  <p className="text-sm text-gray-500">Detect customer emotions and tone</p>
                </div>
                <button
                  onClick={() => setAISettings({ ...aiSettings, sentimentAnalysis: !aiSettings.sentimentAnalysis })}
                  className={`w-12 h-6 rounded-full transition ${aiSettings.sentimentAnalysis ? "bg-green-500" : "bg-gray-300"}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition transform ${aiSettings.sentimentAnalysis ? "translate-x-6" : "translate-x-0.5"}`} />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <label className="block text-sm font-medium text-gray-700 mb-2">AI Response Delay (seconds)</label>
                <input
                  type="number"
                  value={aiSettings.responseTime}
                  onChange={(e) => setAISettings({ ...aiSettings, responseTime: parseInt(e.target.value) })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-black"
                  min={1}
                  max={10}
                />
                <p className="text-xs text-gray-500 mt-1">Add natural delay for realistic responses</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl">
                <label className="block text-sm font-medium text-gray-700 mb-2">Working Hours</label>
                <input
                  type="text"
                  value={aiSettings.workingHours}
                  onChange={(e) => setAISettings({ ...aiSettings, workingHours: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100 flex justify-end">
            <button
              onClick={saveSettings}
              disabled={savingSettings}
              className="flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition disabled:opacity-50"
            >
              <Save size={18} />
              {savingSettings ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Template Modal */}
      {templateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {editingTemplate ? "Edit Template" : "Add Template"}
              </h3>
              <button
                onClick={() => setTemplateModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={templateForm.category}
                  onChange={(e) => setTemplateForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                >
                  <option value="client">Client</option>
                  <option value="candidate">Candidate</option>
                  <option value="sales">Sales</option>
                  <option value="employee">Employee</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Keyword</label>
                <input
                  type="text"
                  value={templateForm.keyword}
                  onChange={(e) => setTemplateForm((f) => ({ ...f, keyword: e.target.value }))}
                  placeholder='e.g. "pricing"'
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Response</label>
                <textarea
                  rows={4}
                  value={templateForm.response}
                  onChange={(e) => setTemplateForm((f) => ({ ...f, response: e.target.value }))}
                  placeholder="The AI's reply when this keyword is detected"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Intent (optional)</label>
                <input
                  type="text"
                  value={templateForm.intent}
                  onChange={(e) => setTemplateForm((f) => ({ ...f, intent: e.target.value }))}
                  placeholder="e.g. pricing_inquiry"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setTemplateModalOpen(false)}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={saveTemplate}
                className="px-4 py-2 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition"
              >
                {editingTemplate ? "Save Changes" : "Create Template"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

