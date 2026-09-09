import { useEffect, useState } from "react";
import axios from "axios";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from "recharts";
import { TrendingUp, TrendingDown, BarChart3, RefreshCw } from "lucide-react";
import { StatCard } from "../../components/common/Premium";
import RevenueManagement from "./RevenueManagement";
import ExpenseManagement from "./ExpenseManagement";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function FinanceDashboard() {
  const token = localStorage.getItem("hrms_admin_token");

  const [revenue, setRevenue] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  const formatCurrency = (num) => Number(num || 0).toLocaleString("en-IN");

  const fetchData = async () => {
    try {
      setLoading(true);

      const [revRes, expRes] = await Promise.all([
        axios.get(`${BASE_URL}/finance/revenue`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${BASE_URL}/finance/expenses`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const revData = revRes.data || [];
      const expData = expRes.data || [];

      setRevenue(revData);
      setExpenses(expData);
      prepareChartData(revData, expData);
    } catch (err) {
      console.error("Finance Dashboard Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = (revList, expList) => {
    const dailyMap = {};

    // 1. Process Revenue using correct key: invoice_date
    revList.forEach((item) => {
      const targetDate = item.invoice_date || item.date || item.createdAt;
      const dateStr = targetDate 
        ? new Date(targetDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) 
        : "Unknown";
        
      if (!dailyMap[dateStr]) dailyMap[dateStr] = { date: dateStr, Revenue: 0, Expenses: 0 };
      dailyMap[dateStr].Revenue += Number(item.amount || 0);
    });

    // 2. Process Expenses using correct key: expense_date
    expList.forEach((item) => {
      const targetDate = item.expense_date || item.date || item.createdAt;
      const dateStr = targetDate 
        ? new Date(targetDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) 
        : "Unknown";
        
      if (!dailyMap[dateStr]) dailyMap[dateStr] = { date: dateStr, Revenue: 0, Expenses: 0 };
      dailyMap[dateStr].Expenses += Number(item.amount || 0);
    });

    // 3. Convert map back to an array
    const formattedData = Object.values(dailyMap);

    // 4. Sort data by real time so the chart line flows correctly from left to right
    formattedData.sort((a, b) => new Date(a.date) - new Date(b.date));

    setChartData(formattedData);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalRevenue = revenue.reduce((acc, item) => acc + Number(item.amount || 0), 0);
  const totalExpenses = expenses.reduce((acc, item) => acc + Number(item.amount || 0), 0);
  const profit = totalRevenue - totalExpenses;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 bg-slate-50 min-h-screen text-slate-800">
      
      {/* HEADER SECTION */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 px-6 py-6 shadow-lg shadow-indigo-900/20 sm:px-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-12 -top-14 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute -left-10 -bottom-16 h-36 w-36 rounded-full bg-white/5" />
        </div>
        <div className="relative z-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-indigo-300">Finance</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">Finance Dashboard</h1>
          <p className="text-sm text-indigo-200 mt-1">
            Track your company income, business expenses, and total profit margins.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="relative z-10 flex items-center gap-2 px-4 py-2.5 bg-white text-indigo-700 font-bold rounded-xl shadow-md shadow-indigo-950/20 hover:bg-indigo-50 active:scale-95 transition-all text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.253 8H18" />
          </svg>
          Refresh Data
        </button>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
        <StatCard
          label="Total Revenue"
          value={`₹${formatCurrency(totalRevenue)}`}
          sub="Incoming payments"
          icon={TrendingUp}
          tone="green"
        />
        <StatCard
          label="Total Expenses"
          value={`₹${formatCurrency(totalExpenses)}`}
          sub="Business costs"
          icon={TrendingDown}
          tone="red"
        />
        <StatCard
          label="Net Profit"
          value={`₹${formatCurrency(profit)}`}
          sub={profit >= 0 ? "Positive margin" : "Negative margin"}
          icon={BarChart3}
          tone={profit >= 0 ? "indigo" : "amber"}
        />
      </div>

      {/* GRAPH CHART PANEL */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-100">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Cash Flow Trends</h2>
            <p className="text-xs text-slate-500">Visual chart showing incoming revenue compared directly against business costs.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Revenue
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              Expenses
            </span>
          </div>
        </div>
        
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} stroke="#94a3b8" fontSize={11} dy={10} />
              <YAxis tickLine={false} axisLine={false} stroke="#94a3b8" fontSize={11} dx={-5} tickFormatter={(val) => `₹${val.toLocaleString()}`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                formatter={(value) => [`₹${formatCurrency(value)}`]}
              />
              <Area type="monotone" dataKey="Revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue" />
              <Area type="monotone" dataKey="Expenses" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorExpenses)" name="Expenses" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SPLIT MANAGEMENT SECTIONS */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-2">Revenue Tracking</h2>
          <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-2">
            <RevenueManagement />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-2">Expense Tracking</h2>
          <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-2">
            <ExpenseManagement />
          </div>
        </div>
      </div>

    </div>
  );
}