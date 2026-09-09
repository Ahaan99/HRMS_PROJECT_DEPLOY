import { useEffect, useState } from "react";
import {
  Users,
  UserCog,
  Building2,
  Briefcase,
  LayoutGrid,
  Activity,
  Zap,
  UserPlus,
  FolderPlus,
  ShieldPlus,
  Bot,
  ArrowRight,
  CalendarClock,
} from "lucide-react";
import API from "../../services/api";
import { useNavigate } from "react-router-dom";
import PageHero from "../../components/common/PageHero";

export default function Dashboard() {
  const [stats, setStats] = useState({
    employees: 0,
    hrAccounts: 0,
    departments: 0,
    clients: 0,
  });
  const [activity, setActivity] = useState([]);

  const navigate = useNavigate();
  const fetchDashboardStats = async () => {
    try {
      const [empRes, deptRes, clientRes, interviewRes] = await Promise.all([
        API.get("/super-admin/employees"),
        API.get("/super-admin/departments"),
        API.get("/super-admin/clients"),
        API.get("/super-admin/interviews").catch(() => null),
      ]);

      const employees = empRes?.data?.employees || [];
      const departments =
        deptRes?.data?.data || deptRes?.data?.departments || [];
      const clients =
        clientRes?.data?.clients ||
        clientRes?.data?.data ||
        clientRes?.data ||
        [];
      const interviews =
        interviewRes?.data?.data || interviewRes?.data?.interviews || [];

      // ✅ HR = departmentId === 1
      const hrCount = employees.filter(
        (emp) => Number(emp.departmentId) === 1,
      ).length;

      setStats({
        employees: employees.length,
        hrAccounts: hrCount,
        departments: departments.length,
        clients: Array.isArray(clients) ? clients.length : 0,
      });

      // Build real recent activity from latest records
      const events = [];
      const ts = (r) => new Date(r?.createdAt || r?.updatedAt || 0).getTime();

      [...employees]
        .sort((a, b) => ts(b) - ts(a))
        .slice(0, 3)
        .forEach((e) =>
          events.push({
            time: ts(e),
            type: "employee",
            text: `Employee added: ${e.name || e.fullName || e.email || "—"}`,
          }),
        );

      (Array.isArray(clients) ? [...clients] : [])
        .sort((a, b) => ts(b) - ts(a))
        .slice(0, 2)
        .forEach((c) =>
          events.push({
            time: ts(c),
            type: "client",
            text: `Client registered: ${c.companyName || c.name || c.email || "—"}`,
          }),
        );

      (Array.isArray(interviews) ? [...interviews] : [])
        .sort((a, b) => ts(b) - ts(a))
        .slice(0, 2)
        .forEach((iv) =>
          events.push({
            time: ts(iv),
            type: "interview",
            text: `Interview scheduled: ${
              iv.candidateName || iv.candidate?.fullName || "candidate"
            }${iv.date ? ` on ${iv.date}` : ""}`,
          }),
        );

      setActivity(
        events.sort((a, b) => b.time - a.time).slice(0, 6),
      );
    } catch (err) {
      console.error(`Dashboard stats error: ${err}`);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const statCards = [
    {
      title: "Total Employees",
      value: stats.employees,
      subText: "Active employees in system",
      icon: <Users size={20} />,
      onClick: () => navigate("/dashboard/employees"),
    },
    {
      title: "Total HR Accounts",
      value: stats.hrAccounts,
      subText: "HR managers & recruiters",
      icon: <UserCog size={20} />,
      onClick: () => navigate("/users"),
    },
    {
      title: "Departments",
      value: stats.departments,
      subText: "Company departments configured",
      icon: <Building2 size={20} />,
      onClick: () => navigate("/departments"),
    },
    {
      title: "Total Clients",
      value: stats.clients,
      subText: "Registered clients",
      icon: <Briefcase size={20} />,
      onClick: () => navigate("/dashboard/clients"),
    },
  ];

  const activityIcon = (type) => {
    if (type === "client")
      return (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
          <Briefcase size={14} />
        </span>
      );
    if (type === "interview")
      return (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
          <CalendarClock size={14} />
        </span>
      );
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
        <UserPlus size={14} />
      </span>
    );
  };

  const quickActions = [
    {
      label: "Create Employee Account",
      desc: "Register a new employee",
      to: "/dashboard/employees",
      icon: <UserPlus size={16} />,
    },
    {
      label: "Add Department",
      desc: "Configure a new department",
      to: "/departments",
      icon: <FolderPlus size={16} />,
    },
    {
      label: "Create Admin User",
      desc: "Grant portal access",
      to: "/users",
      icon: <ShieldPlus size={16} />,
    },
    {
      label: "AI Chat Hub",
      desc: "Open the AI assistant",
      to: "/dashboard/ai-chat-hub",
      icon: <Bot size={16} />,
    },
  ];

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Premium hero header */}
      <PageHero
        title="Overview"
        subtitle="HRMS Control Center — here's what's happening in your HRMS today."
        chips={[
          { icon: <Users size={12} />, label: `${stats.employees} Employees` },
          { icon: <UserCog size={12} />, label: `${stats.hrAccounts} HR Accounts` },
          {
            icon: <Building2 size={12} />,
            label: `${stats.departments} Departments`,
          },
          { icon: <Briefcase size={12} />, label: `${stats.clients} Clients` },
        ]}
        actions={
          <button
            onClick={() => navigate("/dashboard/advanced-search")}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-indigo-700 shadow-sm transition-all hover:bg-indigo-50"
          >
            <LayoutGrid size={15} />
            Advanced Search
          </button>
        }
      />

      {/* Premium stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        {statCards.map((card) => (
          <button
            key={card.title}
            onClick={card.onClick}
            className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-100"
          >
            <div className="flex items-start justify-between">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                {card.title}
              </p>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-200 transition-transform duration-200 group-hover:scale-105">
                {card.icon}
              </span>
            </div>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              {card.value}
            </p>
            <p className="mt-1 text-xs text-slate-500">{card.subText}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              View
              <ArrowRight size={12} />
            </span>
            <div className="pointer-events-none absolute -right-8 -bottom-10 h-24 w-24 rounded-full bg-indigo-50 transition-transform duration-300 group-hover:scale-125" />
          </button>
        ))}
      </div>

      {/* Big section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-5">
        {/* Recent Activity */}
        <div className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Activity size={18} />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Recent Activity
              </h2>
              <p className="text-xs text-slate-500">
                Latest admin actions & HR updates.
              </p>
            </div>
          </div>

          <div className="mt-5">
            {activity.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                No recent activity yet.
              </div>
            ) : (
              <div className="relative space-y-1">
                <div
                  className="absolute left-4 top-4 bottom-4 w-px bg-slate-200"
                  aria-hidden="true"
                />
                {activity.map((item, idx) => (
                  <div
                    key={idx}
                    className="relative flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-slate-50"
                  >
                    {activityIcon(item.type)}
                    <p className="min-w-0 flex-1 break-words text-sm text-slate-700">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Zap size={18} />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Quick Actions
              </h2>
              <p className="text-xs text-slate-500">Fast shortcuts for admin.</p>
            </div>
          </div>

          <div className="mt-5 space-y-2.5">
            {quickActions.map((a) => (
              <button
                key={a.label}
                onClick={() => navigate(a.to)}
                className="group flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-left transition-all duration-200 hover:border-indigo-300 hover:bg-indigo-50/60 hover:shadow-sm"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
                  {a.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-slate-800">
                    {a.label}
                  </span>
                  <span className="block text-xs text-slate-500">{a.desc}</span>
                </span>
                <ArrowRight
                  size={15}
                  className="shrink-0 text-slate-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-indigo-600"
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
