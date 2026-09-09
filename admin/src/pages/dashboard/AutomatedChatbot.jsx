import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import {
  MessageSquare,
  Users,
  UserCheck,
  Briefcase,
  Search,
  Send,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  Settings,
  Plus,
  MoreVertical,
  Hash,
  Circle,
  FileText,
  Image,
  Smile,
  X,
  RefreshCw,
  Bot,
  MessageCircle,
  Archive,
  Trash2,
  Edit2,
  Save,
  ChevronDown,
} from "lucide-react";

import PageHeader from "../../components/common/PageHeader";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import StatCard from "../../components/common/StatCard";

const CHANNEL_CONFIG = {
  client: {
    label: "Clients",
    icon: Briefcase,
    color: "bg-blue-50 text-blue-600",
    borderColor: "border-blue-500",
    badge: "bg-blue-100 text-blue-700",
  },
  candidate: {
    label: "Candidates",
    icon: UserCheck,
    color: "bg-purple-50 text-purple-600",
    borderColor: "border-purple-500",
    badge: "bg-purple-100 text-purple-700",
  },
  hr: {
    label: "HR Team",
    icon: Users,
    color: "bg-green-50 text-green-600",
    borderColor: "border-green-500",
    badge: "bg-green-100 text-green-700",
  },
};

const QUICK_REPLIES = [
  "Thank you for your message. We will get back to you shortly.",
  "Your query has been noted. Our team will respond within 24 hours.",
  "Please share more details about your concern.",
  "Could you please provide your contact number?",
  "Your application is under review. We will update you soon.",
  "For immediate assistance, please call our helpline.",
];

const DUMMY_CLIENTS = [
  { id: 1, name: "Acme Corp", email: "contact@acme.com", phone: "+91 98765 43210", lastSeen: "2026-03-20 10:30" },
  { id: 2, name: "TechStart Inc", email: "info@techstart.com", phone: "+91 98765 43211", lastSeen: "2026-03-20 09:15" },
  { id: 3, name: "Global Solutions", email: "support@globalsol.com", phone: "+91 98765 43212", lastSeen: "2026-03-19 16:45" },
];

const DUMMY_CANDIDATES = [
  { id: 1, name: "Rahul Verma", email: "rahul@email.com", phone: "+91 98765 43220", status: "Interview Scheduled", lastSeen: "2026-03-20 11:00" },
  { id: 2, name: "Priya Singh", email: "priya@email.com", phone: "+91 98765 43221", status: "Offer Sent", lastSeen: "2026-03-20 10:00" },
  { id: 3, name: "Amit Kumar", email: "amit@email.com", phone: "+91 98765 43222", status: "Pending Review", lastSeen: "2026-03-19 14:30" },
  { id: 4, name: "Sneha Patel", email: "sneha@email.com", phone: "+91 98765 43223", status: "Joined", lastSeen: "2026-03-20 08:00" },
];

const DUMMY_HR_TEAM = [
  { id: 1, name: "Rohit HR", email: "rohit@company.com", role: "HR Manager" },
  { id: 2, name: "Neha Sharma", email: "neha@company.com", role: "Recruiter" },
  { id: 3, name: "Vikram Singh", email: "vikram@company.com", role: "HR Executive" },
];

export default function AutomatedChatbot() {
  const [activeChannel, setActiveChannel] = useState("client");
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
  const [openNewChat, setOpenNewChat] = useState(false);

  const [chatSettings, setChatSettings] = useState({
    autoReply: true,
    workingHours: "9:00 AM - 6:00 PM",
    responseTime: "2 hours",
    greetingMessage: "Hello! Welcome to our support. How can I assist you today?",
    offlineMessage: "We are currently offline. Please leave a message and we will get back to you.",
  });

  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadConversations();
  }, [activeChannel]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const loadConversations = () => {
    setLoading(true);
    setTimeout(() => {
      const dummyConversations = activeChannel === "client"
        ? [
            { id: 1, contactId: 1, contactName: "Acme Corp", type: "client", lastMessage: "We need to discuss the project timeline", unread: 2, timestamp: "10:30 AM", status: "open" },
            { id: 2, contactId: 2, contactName: "TechStart Inc", type: "client", lastMessage: "Thanks for the update!", unread: 0, timestamp: "09:15 AM", status: "open" },
            { id: 3, contactId: 3, contactName: "Global Solutions", type: "client", lastMessage: "Looking forward to the proposal", unread: 1, timestamp: "Yesterday", status: "closed" },
          ]
        : activeChannel === "candidate"
        ? [
            { id: 4, contactId: 4, name: "Rahul Verma", type: "candidate", lastMessage: "When is my interview scheduled?", unread: 1, timestamp: "11:00 AM", status: "open" },
            { id: 5, contactId: 5, name: "Priya Singh", type: "candidate", lastMessage: "I have accepted the offer!", unread: 0, timestamp: "10:00 AM", status: "open" },
            { id: 6, contactId: 6, name: "Amit Kumar", type: "candidate", lastMessage: "Please review my updated resume", unread: 3, timestamp: "Yesterday", status: "open" },
          ]
        : [
            { id: 7, contactId: 7, contactName: "Rohit HR", type: "hr", lastMessage: "Budget approved for new hires", unread: 0, timestamp: "10:00 AM", status: "open" },
            { id: 8, contactId: 8, contactName: "Neha Sharma", type: "hr", lastMessage: "Interview panel finalized", unread: 1, timestamp: "09:30 AM", status: "open" },
          ];

      setConversations(dummyConversations);
      setLoading(false);
    }, 500);
  };

  const loadMessages = (conversation) => {
    setLoading(true);
    setTimeout(() => {
      const dummyMessages = [
        { id: 1, sender: conversation.type, text: "Hello, I wanted to follow up on our recent discussion.", timestamp: "10:00 AM", status: "read" },
        { id: 2, sender: "admin", text: "Hi! Thank you for reaching out. How can I help you today?", timestamp: "10:05 AM", status: "read" },
        { id: 3, sender: conversation.type, text: "We need to discuss the project timeline and deliverables.", timestamp: "10:10 AM", status: "read" },
        { id: 4, sender: "admin", text: "Sure, I can arrange a meeting. What time works best for you?", timestamp: "10:15 AM", status: "read" },
        { id: 5, sender: conversation.type, text: "Would tomorrow at 2 PM work? We can also do a video call.", timestamp: "10:20 AM", status: "delivered" },
        { id: 6, sender: "admin", text: "Tomorrow at 2 PM is perfect. I'll send you the meeting link.", timestamp: "10:25 AM", status: "delivered" },
        { id: 7, sender: conversation.type, text: "We need to discuss the project timeline", timestamp: "10:30 AM", status: "delivered" },
      ];
      setMessages(dummyMessages);
      setLoading(false);
    }, 300);
  };

  const handleSelectConversation = (conv) => {
    setSelectedConversation(conv);
    loadMessages(conv);
    setConversations((prev) =>
      prev.map((c) => (c.id === conv.id ? { ...c, unread: 0 } : c))
    );
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    setSending(true);
    setTimeout(() => {
      const msg = {
        id: Date.now(),
        sender: "admin",
        text: newMessage,
        timestamp: dayjs().format("h:mm A"),
        status: "sent",
      };
      setMessages((prev) => [...prev, msg]);
      setNewMessage("");
      setSending(false);

      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConversation.id
            ? { ...c, lastMessage: newMessage, timestamp: dayjs().format("h:mm A") }
            : c
        )
      );
    }, 500);
  };

  const handleQuickReply = (reply) => {
    setNewMessage(reply);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredConversations = useMemo(() => {
    if (!searchQuery) return conversations;
    return conversations.filter((c) =>
      c.contactName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [conversations, searchQuery]);

  const totalUnread = useMemo(() => {
    return conversations.reduce((sum, c) => sum + (c.unread || 0), 0);
  }, [conversations]);

  const stats = {
    totalConversations: 24,
    activeChats: 8,
    resolvedToday: 5,
    avgResponseTime: "15 min",
  };

  const channels = [
    { id: "client", label: "Clients", count: 3 },
    { id: "candidate", label: "Candidates", count: 3 },
    { id: "hr", label: "HR Team", count: 2 },
  ];

  const getContactInfo = (conv) => {
    if (conv.type === "client") {
      return DUMMY_CLIENTS.find((c) => c.id === conv.contactId) || {};
    } else if (conv.type === "candidate") {
      return DUMMY_CANDIDATES.find((c) => c.id === conv.contactId) || {};
    } else {
      return DUMMY_HR_TEAM.find((h) => h.id === conv.contactId) || {};
    }
  };

  return (
    <div>
      <PageHeader
        title="Automated Chatbot"
        desc="Manage conversations with Clients, Candidates, and HR Team in one place."
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Chats"
          value={stats.totalConversations}
          icon={<MessageCircle size={20} />}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Active Now"
          value={stats.activeChats}
          icon={<Circle size={20} className="fill-green-500 text-green-500" />}
          color="bg-green-50 text-green-600"
        />
        <StatCard
          title="Resolved Today"
          value={stats.resolvedToday}
          icon={<CheckCircle size={20} />}
          color="bg-purple-50 text-purple-600"
        />
        <StatCard
          title="Avg Response"
          value={stats.avgResponseTime}
          icon={<Clock size={20} />}
          color="bg-orange-50 text-orange-600"
        />
      </div>

      {/* Main Chat Interface */}
      <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
        <div className="flex h-[600px]">
          {/* Sidebar - Channel & Conversations */}
          <div className="w-80 border-r border-gray-100 flex flex-col">
            {/* Channel Tabs */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex gap-2">
                {channels.map((channel) => {
                  const config = CHANNEL_CONFIG[channel.id];
                  const Icon = config.icon;
                  return (
                    <button
                      key={channel.id}
                      onClick={() => {
                        setActiveChannel(channel.id);
                        setSelectedConversation(null);
                      }}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                        activeChannel === channel.id
                          ? "bg-black text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      <Icon size={16} />
                      {channel.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <RefreshCw size={24} className="animate-spin text-gray-400" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <MessageSquare size={40} className="mb-2 text-gray-300" />
                  <p>No conversations yet</p>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isSelected = selectedConversation?.id === conv.id;
                  const contact = getContactInfo(conv);
                  const channelConfig = CHANNEL_CONFIG[conv.type];
                  const ChannelIcon = channelConfig.icon;

                  return (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv)}
                      className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition border-b border-gray-50 ${
                        isSelected ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="relative">
                        <div className={`w-10 h-10 rounded-full ${channelConfig.color} flex items-center justify-center`}>
                          <ChannelIcon size={18} />
                        </div>
                        {conv.status === "open" && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between">
                          <p className={`font-semibold truncate ${conv.unread > 0 ? "text-gray-900" : "text-gray-700"}`}>
                            {conv.contactName || conv.name}
                          </p>
                          <span className="text-xs text-gray-400">{conv.timestamp}</span>
                        </div>
                        <p className="text-sm text-gray-500 truncate">{conv.lastMessage}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded text-xs ${channelConfig.badge}`}>
                            {channelConfig.label}
                          </span>
                          {conv.unread > 0 && (
                            <span className="px-2 py-0.5 bg-blue-500 text-white rounded-full text-xs font-bold">
                              {conv.unread}
                            </span>
                          )}
                          {conv.status === "closed" && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">
                              Closed
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Settings Button */}
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={() => setOpenSettings(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition"
              >
                <Settings size={18} />
                Chat Settings
              </button>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${CHANNEL_CONFIG[selectedConversation.type].color} flex items-center justify-center`}>
                      {activeChannel === "client" ? <Briefcase size={18} /> :
                       activeChannel === "candidate" ? <UserCheck size={18} /> :
                       <Users size={18} />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {selectedConversation.contactName || selectedConversation.name}
                      </h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Circle size={8} className="fill-green-500 text-green-500" />
                        Online
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                      <Phone size={18} className="text-gray-500" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                      <MoreVertical size={18} className="text-gray-500" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <RefreshCw size={24} className="animate-spin text-gray-400" />
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isAdmin = msg.sender === "admin";
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] ${
                              isAdmin
                                ? "bg-black text-white rounded-2xl rounded-br-md"
                                : "bg-gray-100 text-gray-900 rounded-2xl rounded-bl-md"
                            } px-4 py-3`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                            <div className={`flex items-center gap-2 mt-1 ${isAdmin ? "justify-end" : ""}`}>
                              <span className={`text-xs ${isAdmin ? "text-gray-400" : "text-gray-400"}`}>
                                {msg.timestamp}
                              </span>
                              {isAdmin && (
                                <span className="text-xs text-gray-400">
                                  {msg.status === "sent" ? "✓" : msg.status === "delivered" ? "✓✓" : "✓✓"}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Replies */}
                <div className="px-4 pb-2">
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {QUICK_REPLIES.slice(0, 4).map((reply, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuickReply(reply)}
                        className="flex-shrink-0 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-xs font-medium text-gray-600 transition whitespace-nowrap"
                      >
                        {reply.slice(0, 30)}...
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-100">
                  <div className="flex items-end gap-3">
                    <div className="flex-1 relative">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message..."
                        rows={1}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black resize-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button className="p-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition">
                        <Smile size={20} className="text-gray-500" />
                      </button>
                      <button className="p-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition">
                        <FileText size={20} className="text-gray-500" />
                      </button>
                      <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sending}
                        className="p-3 bg-black hover:bg-gray-900 rounded-xl transition disabled:opacity-50"
                      >
                        <Send size={20} className="text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Bot size={40} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Welcome to Chat Dashboard
                </h3>
                <p className="text-sm text-gray-500">
                  Select a conversation from the left panel to start chatting
                </p>
                <div className="flex gap-3 mt-4">
                  {channels.map((channel) => {
                    const config = CHANNEL_CONFIG[channel.id];
                    const Icon = config.icon;
                    return (
                      <button
                        key={channel.id}
                        onClick={() => setActiveChannel(channel.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${config.color}`}
                      >
                        <Icon size={16} />
                        {channel.count} {config.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <Modal
        open={openSettings}
        title="Chatbot Settings"
        onClose={() => setOpenSettings(false)}
        width="max-w-lg"
      >
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Working Hours</label>
            <input
              type="text"
              value={chatSettings.workingHours}
              onChange={(e) => setChatSettings({ ...chatSettings, workingHours: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-black"
              placeholder="9:00 AM - 6:00 PM"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Response Time</label>
            <input
              type="text"
              value={chatSettings.responseTime}
              onChange={(e) => setChatSettings({ ...chatSettings, responseTime: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-black"
              placeholder="2 hours"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Greeting Message</label>
            <textarea
              value={chatSettings.greetingMessage}
              onChange={(e) => setChatSettings({ ...chatSettings, greetingMessage: e.target.value })}
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-black resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Offline Message</label>
            <textarea
              value={chatSettings.offlineMessage}
              onChange={(e) => setChatSettings({ ...chatSettings, offlineMessage: e.target.value })}
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-black resize-none"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-medium text-gray-900">Auto Reply</p>
              <p className="text-sm text-gray-500">Automatically reply when offline</p>
            </div>
            <button
              onClick={() => setChatSettings({ ...chatSettings, autoReply: !chatSettings.autoReply })}
              className={`w-12 h-6 rounded-full transition ${
                chatSettings.autoReply ? "bg-black" : "bg-gray-300"
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow transition transform ${
                  chatSettings.autoReply ? "translate-x-6" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              onClick={() => setOpenSettings(false)}
              className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                toast.success("Settings saved successfully!");
                setOpenSettings(false);
              }}
              className="flex-1 px-4 py-2.5 bg-black hover:bg-gray-900 text-white rounded-xl font-medium transition"
            >
              Save Settings
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
