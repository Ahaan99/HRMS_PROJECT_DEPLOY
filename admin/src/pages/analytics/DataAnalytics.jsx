import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  BarChart3,
  Users,
  UserPlus,
  CalendarCheck,
  Plane,
  IndianRupee,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { PageHero } from "../../components/common/Premium";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const COLORS = ["#0d9488", "#6366f1", "#f59e0b", "#ef4444", "#10b981", "#8b5cf6"];

const TABS = [
  { key: "workforce", label: "Workforce & Attrition", icon: Users },
  { key: "recruitment", label: "Recruitment", icon: UserPlus },
  { key: "attendance", label: "Attendance", icon: CalendarCheck },
  { key: "leaves", label: "Leaves", icon: Plane },
  { key: "financial", label: "Financial", icon: IndianRupee },
];

const Card = ({ title, children, className = "" }) => (
  <div className={`bg-white rounded-2xl shadow border border-gray-100 p-5 ${className}`}>
    <p className="text-sm font-bold text-gray-900 mb-4">{title}</p>
    {children}
  </div>
);

const Kpi = ({ label, value, sub, tone = "text-gray-900" }) => (
  <div className="bg-white rounded-2xl shadow border border-gray-100 p-5">
    <p className="text-xs font-semibold text-gray-500 uppercase">{label}</p>
    <p className={`text-2xl font-bold mt-1 ${tone}`}>{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
  </div>
);

const inr = (n) =>
  "Rs. " + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

export default function DataAnalytics() {
  const token = localStorage.getItem("hrms_admin_token");
  const headers = { Authorization: `Bearer ${token}` };

  const [tab, setTab] = useState("workforce");
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (key) => {
      if (data[key]) return;
      setLoading(true);
      try {
        const { data: d } = await axios.get(`${BASE_URL}/analytics/${key}`, { headers });
        setData((prev) => ({ ...prev, [key]: d }));
      } catch (err) {
        console.error("Analytics load error:", err);
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data]
  );

  useEffect(() => {
    load(tab);
  }, [tab, load]);

  const wf = data.workforce;
  const rec = data.recruitment;
  const att = data.attendance;
  const lv = data.leaves;
  const fin = data.financial;

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <PageHero
        eyebrow="Insights"
        title="Data Analytics"
        subtitle="Attrition, recruitment, attendance, leave and financial insights."
        icon={BarChart3}
      />

      {/* TABS */}
      <div className="flex flex-wrap gap-2">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold ${
              tab === key
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {loading && !data[tab] && (
        <p className="text-sm text-gray-400 py-10 text-center">Loading analytics...</p>
      )}

      {/* WORKFORCE */}
      {tab === "workforce" && wf && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Kpi label="Active Employees" value={wf.headcount.active} />
            <Kpi label="On Notice" value={wf.headcount.on_notice} tone="text-amber-600" />
            <Kpi
              label="Attrition (12m)"
              value={`${wf.attritionRate}%`}
              sub={`${wf.totalExits12m} exits`}
              tone="text-red-600"
            />
            <Kpi
              label="Monthly Salary Cost"
              value={inr(wf.byDept.reduce((s, d) => s + Number(d.salary_cost), 0))}
            />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Joiners vs Exits (12 months)">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={wf.timeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" fontSize={11} />
                  <YAxis allowDecimals={false} fontSize={11} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="joined" fill="#0d9488" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="exited" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Headcount by Department">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={wf.byDept} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" allowDecimals={false} fontSize={11} />
                  <YAxis type="category" dataKey="department" width={90} fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="headcount" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Employee Status Mix">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={wf.byStatus.filter((s) => Number(s.count) > 0)}
                    dataKey="count"
                    nameKey="status"
                    outerRadius={85}
                    label={(e) => `${e.status} (${e.count})`}
                  >
                    {wf.byStatus.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Tenure Distribution (active)">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={[
                    { bucket: "< 6 months", count: Number(wf.tenure.lt6m) },
                    { bucket: "6-12 months", count: Number(wf.tenure.m6to12) },
                    { bucket: "1-3 years", count: Number(wf.tenure.y1to3) },
                    { bucket: "3+ years", count: Number(wf.tenure.gt3y) },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="bucket" fontSize={11} />
                  <YAxis allowDecimals={false} fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </>
      )}

      {/* RECRUITMENT */}
      {tab === "recruitment" && rec && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Kpi label="Total Candidates" value={rec.totals.applied} />
            <Kpi label="Selected" value={rec.totals.selected} tone="text-emerald-600" />
            <Kpi label="Conversion Rate" value={`${rec.totals.conversionRate}%`} tone="text-sky-600" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Hiring Funnel">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={rec.funnel}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="stage" fontSize={11} />
                  <YAxis allowDecimals={false} fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Applications per Month">
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={rec.byMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" fontSize={11} />
                  <YAxis allowDecimals={false} fontSize={11} />
                  <Tooltip />
                  <Area dataKey="applications" stroke="#6366f1" fill="#6366f133" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Top Roles by Candidates" className="lg:col-span-2">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={rec.byJob}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="jobTitle" fontSize={11} />
                  <YAxis allowDecimals={false} fontSize={11} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="candidates" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="selected" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </>
      )}

      {/* ATTENDANCE */}
      {tab === "attendance" && att && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Kpi label={`Attendance Rate (${att.days}d)`} value={`${att.attendanceRate}%`} tone="text-emerald-600" />
            <Kpi label="Avg Working Hours" value={att.avgHours ?? "-"} />
            <Kpi
              label="Late Marks"
              value={att.byStatus.find((s) => s.status === "LATE")?.count || 0}
              tone="text-amber-600"
            />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Daily Attendance Trend" className="lg:col-span-2">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={att.byDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day" fontSize={11} />
                  <YAxis allowDecimals={false} fontSize={11} />
                  <Tooltip />
                  <Legend />
                  <Line dataKey="present" stroke="#10b981" dot={false} strokeWidth={2} />
                  <Line dataKey="absent" stroke="#ef4444" dot={false} strokeWidth={2} />
                  <Line dataKey="late" stroke="#f59e0b" dot={false} strokeWidth={2} />
                  <Line dataKey="wfh" stroke="#6366f1" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Status Distribution">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={att.byStatus}
                    dataKey="count"
                    nameKey="status"
                    outerRadius={85}
                    label={(e) => `${e.status} (${e.count})`}
                  >
                    {att.byStatus.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Most Late Arrivals">
              {att.lateByEmp.length ? (
                <div className="space-y-2">
                  {att.lateByEmp.map((r, i) => (
                    <div key={i} className="flex items-center justify-between bg-amber-50 rounded-lg px-3 py-2">
                      <span className="text-sm text-gray-800">{r.employee_name}</span>
                      <span className="text-xs font-bold text-amber-700">{r.late_days} days</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 py-8 text-center">No late marks recorded</p>
              )}
            </Card>
          </div>
        </>
      )}

      {/* LEAVES */}
      {tab === "leaves" && lv && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Approved Leave Days by Type">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={lv.byType}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="type" fontSize={11} />
                <YAxis allowDecimals={false} fontSize={11} />
                <Tooltip />
                <Bar dataKey="days" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card title="Application Status">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={lv.byStatus}
                  dataKey="count"
                  nameKey="status"
                  outerRadius={85}
                  label={(e) => `${e.status} (${e.count})`}
                >
                  {lv.byStatus.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
          <Card title="Leave Days per Month (approved)" className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={lv.byMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" fontSize={11} />
                <YAxis allowDecimals={false} fontSize={11} />
                <Tooltip />
                <Area dataKey="days" stroke="#f59e0b" fill="#f59e0b33" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* FINANCIAL */}
      {tab === "financial" && fin && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Kpi label="Total Revenue" value={inr(fin.totals.total_revenue)} tone="text-emerald-600" />
            <Kpi label="Total Expense" value={inr(fin.totals.total_expense)} tone="text-red-600" />
            <Kpi label="Outstanding Invoices" value={inr(fin.totals.outstanding_invoices)} tone="text-amber-600" />
            <Kpi label="Monthly Salary Cost" value={inr(fin.totals.monthly_salary_cost)} />
          </div>
          <Card title="Revenue vs Expense vs Profit (12 months)">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={fin.byMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" fontSize={11} />
                <YAxis fontSize={11} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} />
                <Tooltip formatter={(v) => inr(v)} />
                <Legend />
                <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </>
      )}
    </div>
  );
}
