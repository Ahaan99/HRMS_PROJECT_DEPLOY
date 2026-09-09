import { useAuth } from "../../context/AuthContext";
import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { SIDEBAR_PERMISSIONS } from "./sidebarPermissions";
import {
  LayoutDashboard,
  Users,
  Building2,
  Settings,
  ChevronDown,
  Briefcase,
  UserRoundSearch,
  Wallet,
  CalendarDays,
  ClipboardCheck,
  PhoneCall,
  UserMinus,
  BarChart3,
  Bot,
  FileText,
  ShieldCheck,
  Mail,
  Form,
  TrendingUp,
  MessageSquare,
  CheckSquare,
  Clock,
  BookOpen,
  Target,
  Coffee,
  MessageCircle,
  CreditCard,
  UserCheck,
  AlertCircle,
  Users2,
  Code2,
  HeartHandshake,
  FileCheck2,
  Handshake,
  SlidersHorizontal,
  Navigation,
  Globe,
  BrainCircuit,
  DoorOpen,
  CalendarClock,
} from "lucide-react";

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200
   ${
     isActive
       ? "bg-gradient-to-r from-[#4f63f0]/30 to-[#7c8cf5]/15 text-white border border-[#7c8cf5]/40 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_6px_16px_-6px_rgba(79,99,240,0.45)]"
       : "text-white/60 border border-transparent hover:bg-white/[0.07] hover:text-white"
   }`;

export default function Sidebar() {
  const location = useLocation();

  const { auth } = useAuth();

  const role = auth?.user?.role;

  // ✅ Only one object to manage everything (scalable)
  const navItems = useMemo(
    () => [
      {
        key: "dashboard",
        label: "Dashboard",
        icon: <LayoutDashboard size={18} />,
        children: [
          {
            key: "overview",
            to: "/",
            label: "Overview",
            icon: <FileText size={18} />,
          },
          {
            key: "client-management",
            to: "/dashboard/client-management",
            label: "Client Management",
            icon: <Briefcase size={18} />,
          },
          {
            key: "employees",
            to: "/dashboard/employees",
            label: "Employee Management",
            icon: <Users size={18} />,
          },
          {
            key: "candidate-management",
            to: "/dashboard/candidate-management",
            label: "Candidate Management",
            icon: <UserRoundSearch size={18} />,
          },
          {
            key: "joined-candidates",
            to: "/dashboard/joined-candidates",
            label: "Joined Candidates",
            icon: <UserRoundSearch size={18} />,
          },
          {
            key: "interview-scheduling",
            to: "/dashboard/interview-scheduling",
            label: "Interview Scheduling",
            icon: <CalendarDays size={18} />,
          },
          {
            key: "services",
            to: "/dashboard/services",
            label: "All Services",
            icon: <Briefcase size={18} />,
          },
          {
            key: "attendance",
            to: "/dashboard/attendance",
            label: "Attendance Tracker",
            icon: <ClipboardCheck size={18} />,
          },
          {
            key: "leave-management",
            to: "/dashboard/leave-management",
            label: "Leave Management",
            icon: <CalendarDays size={18} />,
          },
          {
            key: "compensation",
            to: "/dashboard/compensation",
            label: "Compensation",
            icon: <Briefcase size={18} />,
          },
          {
            key: "salary-revisions",
            to: "/dashboard/salary-revisions",
            label: "Salary Revisions",
            icon: <TrendingUp size={18} />,
          },
          {
            key: "advanced-search",
            to: "/dashboard/advanced-search",
            label: "Advanced Search",
            icon: <UserCheck size={18} />,
          },
          {
            key: "job-board",
            to: "/dashboard/job-board",
            label: "Job Board & ATS",
            icon: <Briefcase size={18} />,
          },
          {
            key: "visitors",
            to: "/dashboard/visitors",
            label: "Visitors",
            icon: <DoorOpen size={18} />,
          },
          {
            key: "branches",
            to: "/dashboard/branches",
            label: "Branches",
            icon: <Building2 size={18} />,
          },
          {
            key: "doc-expiry",
            to: "/dashboard/doc-expiry",
            label: "Doc Expiry Alerts",
            icon: <CalendarClock size={18} />,
          },
          {
            key: "hr-documents",
            to: "/dashboard/hr-documents",
            label: "HR Documents",
            icon: <FileText size={18} />,
          },
          {
            key: "sop-management",
            to: "/dashboard/sop-management",
            label: "SOP Management",
            icon: <BookOpen size={18} />,
          },
          {
            key: "it-dev",
            to: "/dashboard/it-dev",
            label: "IT Developer",
            icon: <Code2 size={18} />,
          },
          {
            key: "analytics",
            to: "/dashboard/analytics",
            label: "Data Analytics",
            icon: <BarChart3 size={18} />,
          },
          {
            key: "benefits",
            to: "/dashboard/benefits",
            label: "Benefits & Upskilling",
            icon: <HeartHandshake size={18} />,
          },
          {
            key: "compliance",
            to: "/dashboard/compliance",
            label: "Compliance & Audit",
            icon: <ShieldCheck size={18} />,
          },
          {
            key: "verification",
            to: "/dashboard/verification",
            label: "Verification Portal",
            icon: <FileCheck2 size={18} />,
          },
          {
            key: "client-onboarding",
            to: "/dashboard/client-onboarding",
            label: "Client Onboarding",
            icon: <Handshake size={18} />,
          },
          {
            key: "master-control",
            to: "/dashboard/master-control",
            label: "Master Control",
            icon: <SlidersHorizontal size={18} />,
          },
          {
            key: "geo-attendance",
            to: "/dashboard/geo-attendance",
            label: "Geo Attendance",
            icon: <Navigation size={18} />,
          },
          {
            key: "web-forms",
            to: "/dashboard/web-forms",
            label: "Website Forms",
            icon: <Globe size={18} />,
          },
          {
            key: "ai-recruit",
            to: "/dashboard/ai-recruit",
            label: "AI Recruitment",
            icon: <BrainCircuit size={18} />,
          },
          {
            key: "ai-platform-audit",
            to: "/dashboard/ai-platform-audit",
            label: "AI Platform Audit",
            icon: <BrainCircuit size={18} />,
          },
          // {
          //   to: "/dashboard/automated-attendance",
          //   label: "Automated Attendance",
          //   icon: <Bot size={18} />,
          // },
          // {
          //   to: "/dashboard/policy-mail",
          //   label: "Policy Mail",
          //   icon: <Mail size={18} />,
          // },
          {
            key: "performance",
            to: "/dashboard/performance",
            label: "Performance Sheet",
            icon: <TrendingUp size={18} />,
          },
          {
            key: "chatbot",
            to: "/dashboard/chatbot",
            label: "AI Chatbot",
            icon: <MessageSquare size={18} />,
          },
          {
            key: "work-report",
            to: "/dashboard/work-report",
            label: "Work & EOD",
            icon: <CheckSquare size={18} />,
          },
          {
            key: "client-agreements",
            to: "/client-agreements",
            label: "Client Agreements",
            icon: <FileText size={18} />,
          },
          {
            key: "login-time",
            to: "/dashboard/login-time",
            label: "Login Time",
            icon: <Clock size={18} />,
          },
          {
            key: "policies",
            to: "/dashboard/policies",
            label: "Company Policies",
            icon: <BookOpen size={18} />,
          },
          {
            key: "work-policy-target",
            to: "/dashboard/work-policy-target",
            label: "Work Policy & Target",
            icon: <Target size={18} />,
          },
          // {
          //   to: "/dashboard/discussion-policy",
          //   label: "Discussion Policy",
          //   icon: <Coffee size={18} />,
          // },
          // {
          //   to: "/dashboard/ai-chat-hub",
          //   label: "AI Chat Hub",
          //   icon: <MessageCircle size={18} />,
          // },
          // {
          //   to: "/dashboard/subscription-plans",
          //   label: "Subscription Plans",
          //   icon: <CreditCard size={18} />,
          // },
          {
            key: "client-candidate-policies",
            to: "/dashboard/client-candidate-policies",
            label: "Client & Candidate Policies",
            icon: <UserCheck size={18} />,
          },
          {
            key: "hr-calling",
            to: "/dashboard/hr-calling",
            label: "HR Calling Details",
            icon: <PhoneCall size={18} />,
          },
          {
            key: "joining",
            to: "/dashboard/joining",
            label: "Joining Form",
            icon: <Form size={18} />,
          },
          {
            key: "payroll",
            to: "/dashboard/payroll",
            label: "Payroll System",
            icon: <Wallet size={18} />,
          },
          {
            key: "exit-management",
            to: "/dashboard/exit-management",
            label: "Exit Management",
            icon: <UserMinus size={18} />,
          },
          {
            key: "sales-reports",
            to: "/dashboard/sales-reports",
            label: "Sales Reports",
            icon: <BarChart3 size={18} />,
          },
          // {
          //   to: "/dashboard/ai-chatbot",
          //   label: "AI Chatbot",
          //   icon: <Bot size={18} />,
          // },
          {
            key: "offer-letter",
            to: "/dashboard/offer-letter",
            label: "Offer Letter & PDF",
            icon: <FileText size={18} />,
          },
          {
            key: "security",
            to: "/dashboard/security",
            label: "Security & Sessions",
            icon: <ShieldCheck size={18} />,
          },
          {
            key: "emergency",
            to: "/dashboard/emergency",
            label: "Emergency Alerts",
            icon: <AlertCircle size={18} />,
          },
          {
            key: "email-system",
            to: "/dashboard/email-system",
            label: "Email System",
            icon: <Mail size={18} />,
          },
          
           {
  key: "finance",
  to: "/dashboard/finance",
  label: "Finance Dashboard",
  icon: <Wallet size={18} />,
},
{
  key: "finance-expenses",
  to: "/dashboard/finance/expenses",
  label: "Expense Management",
  icon: <TrendingUp size={18} />,
},
{
  key: "finance-revenue",
  to: "/dashboard/finance/revenue",
  label: "Revenue Management",
  icon: <BarChart3 size={18} />,
},
{
  key: "revenue-advanced",
  to: "/dashboard/finance/revenue-advanced",
  label: "Revenue Advanced",
  icon: <TrendingUp size={18} />,
},
{
  key: "invoices",
  to: "/invoices",
  label: "Invoices",
  icon: <FileText size={18} />,
},
{
  key: "proposals",
  to: "/proposals",
  label: "Proposals",
  icon: <Handshake size={18} />,
},


        ],
        activePaths: ["/", "/dashboard"],
      },
      {
        key: "lead-assigner",
        to: "/lead-assigner",
        label: "Lead Assigner",
        icon: <Users2 size={18} />,
      },



      // Users (normal link for now)
      {
        key: "users",
        label: "Users",
        icon: <Users size={18} />,
        to: "/users",
      },

      // Departments (normal link)
      {
        key: "departments",
        label: "Departments",
        icon: <Building2 size={18} />,
        to: "/departments",
      },

      // Departments (normal link)
      {
        key: "complaints",
        label: "Complaints",
        icon: <AlertCircle size={18} />,
        to: "/complaints",
      },

      // Settings (normal link)
      {
        key: "settings",
        label: "Settings",
        icon: <Settings size={18} />,
        to: "/settings",
      },
    ],
    [],
  );

  // Dropdown open state
  const [openMenu, setOpenMenu] = useState(() => {
    const initial = {};
    navItems.forEach((item) => {
      if (item.children?.length) initial[item.key] = false;
    });
    return initial;
  });

  // Auto open dropdown when route matches
  useEffect(() => {
    navItems.forEach((item) => {
      if (!item.children?.length) return;

      const isActive = item.activePaths?.some((p) =>
        p === "/" ? location.pathname === "/" : location.pathname.startsWith(p),
      );

      if (isActive) {
        setOpenMenu((prev) => ({ ...prev, [item.key]: true }));
      }
    });
  }, [location.pathname, navItems]);

  const toggleMenu = (key) => {
    setOpenMenu((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const isSectionActive = (item) => {
    if (item.to) return location.pathname === item.to;

    if (item.activePaths?.includes("/")) {
      if (location.pathname === "/") return true;
    }

    return item.activePaths?.some((p) =>
      p === "/" ? location.pathname === "/" : location.pathname.startsWith(p),
    );
  };

  const permissions =
  SIDEBAR_PERMISSIONS[role];

const filteredNavItems =
  navItems.filter((item) => {

    if (
      permissions?.nav === "ALL"
    ) {
      return true;
    }

    return permissions?.nav?.includes(
      item.key
    );
  });

const filteredDashboardChildren =
  navItems[0].children.filter(
    (child) => {

      if (
        permissions?.dashboard ===
        "ALL"
      ) {
        return true;
      }

      return permissions?.dashboard?.includes(
        child.key
      );
    }
  );
  
  return (
    <aside className="w-64 sm:w-72 h-screen flex flex-col overflow-hidden bg-gradient-to-b from-[#0B1220] via-[#0A0F1D] to-[#050812] border-r border-white/10">
      {/* Logo (fixed, never scrolls) */}
      <div className="px-5 pt-5 mb-6 flex items-center gap-3 shrink-0">
        <img
          src="/logo.jpeg"
          alt="logo"
          className="w-10 h-10 object-contain rounded-lg shadow"
        />

        <div>
          <h1 className="text-sm font-bold text-white leading-tight">
            ARDHNARISHWAR
          </h1>
          <p className="text-[10px] text-white/60">HRMS Admin Panel</p>
        </div>
      </div>

      {/* Scrollable area: menu + footer */}
      <div className="sidebar-scroll flex-1 overflow-y-auto px-5 pb-5">
      <nav className="space-y-1">
        {filteredNavItems.map((item) => {
          const hasChildren = !!item.children?.length;
          const active = isSectionActive(item);

          // Dropdown
          if (hasChildren) {
            return (
              <div key={item.key}>
                <button
                  onClick={() => toggleMenu(item.key)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200
                    ${
                      openMenu[item.key]
                        ? "sticky top-0 z-10 bg-[#0B1220]"
                        : ""
                    }
                    ${
                      active
                        ? "bg-gradient-to-r from-[#4f63f0]/30 to-[#7c8cf5]/15 text-white border border-[#7c8cf5]/40 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_6px_16px_-6px_rgba(79,99,240,0.45)]"
                        : "text-white/60 border border-transparent bg-transparent hover:bg-white/[0.07] hover:text-white"
                    }
                  `}
                >
                  <span className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.label}</span>
                  </span>

                  {/* Arrow only if children exists */}
                  <ChevronDown
                    size={18}
                    className={`transition-transform duration-200 ${
                      openMenu[item.key] ? "rotate-180" : "rotate-0"
                    }`}
                  />
                </button>

                <div
                  className={`ml-4 pl-3 border-l border-white/10 transition-all duration-300
                  ${
                    openMenu[item.key]
                      ? "max-h-[5000px] opacity-100 mt-2"
                      : "max-h-0 opacity-0 mt-0 overflow-hidden"
                  }
                  `}
                >
                  {(item.key === "dashboard"
                    ? filteredDashboardChildren
                    : item.children
                  ).map((child) => (
                    <NavLink
                      key={child.to}
                      to={child.to}
                      end={child.to === "/dashboard/finance"}
                      className={linkClass}
                    >
                      {child.icon}
                      {child.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          }

          // Normal link
          return (
            <NavLink key={item.to} to={item.to} className={linkClass}>
              {item.icon}
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-10 p-4 rounded-2xl bg-white/5 border border-white/10">
        <p className="text-white text-sm font-semibold">Admin Tip</p>
        <p className="text-white/60 text-xs mt-1 leading-relaxed">
          Keep roles clean: Admin → HR → Employee.
        </p>
      </div>
      </div>
    </aside>
  );
}
