import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import {
  MessageSquareWarning,
  Search,
  Inbox,
  User,
  Building2,
  Clock,
  ChevronRight,
  CircleDot,
  LoaderCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Filter,
  ListChecks,
} from "lucide-react";
import API from "../../services/api.js";
import { PageHero, HeroStat, StatCard, PillTab } from "../../components/common/Premium";
import {
  PORTAL_ORDER,
  portalOf,
  raisedBy,
  categoryOf,
  isActiveStatus,
  timeAgo,
  formatDateTime,
  StatusPill,
  PriorityBadge,
  CategoryChip,
} from "./complaintUi";

const TABS = [
  { key: "active", label: "Active", icon: CircleDot, match: (s) => isActiveStatus(s) },
  { key: "resolved", label: "Resolved", icon: CheckCircle2, match: (s) => s === "resolved" },
  { key: "rejected", label: "Rejected", icon: XCircle, match: (s) => s === "rejected" },
  { key: "all", label: "All", icon: ListChecks, match: () => true },
];

/* Complaints list for Super Admin.
   initialStatus: "active" | "resolved" | "rejected" | "all"  (the /complaints/resolved route passes "resolved") */
export default function ComplaintList({ initialStatus = "active" }) {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(initialStatus);
  const [portal, setPortal] = useState("all");
  const [query, setQuery] = useState("");

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get("/complaints");
      const rows = Array.isArray(res.data?.data) ? res.data.data : [];
      rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setData(rows);
    } catch {
      toast.error("Failed to fetch complaints");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const counts = useMemo(() => {
    const c = { open: 0, in_progress: 0, resolved: 0, rejected: 0, high: 0, byTab: {}, byPortal: {} };
    for (const item of data) {
      if (c[item.status] !== undefined) c[item.status] += 1;
      if (item.priority === "high" && isActiveStatus(item.status)) c.high += 1;
      const p = item.created_by_role || "other";
      c.byPortal[p] = (c.byPortal[p] || 0) + 1;
    }
    for (const t of TABS) c.byTab[t.key] = data.filter((i) => t.match(i.status)).length;
    return c;
  }, [data]);

  const visible = useMemo(() => {
    const t = TABS.find((x) => x.key === tab) || TABS[0];
    const q = query.trim().toLowerCase();
    return data.filter((item) => {
      if (!t.match(item.status)) return false;
      if (portal !== "all" && (item.created_by_role || "other") !== portal) return false;
      if (!q) return true;
      const hay = [item.title, item.description, raisedBy(item), item.department_name, categoryOf(item.category), portalOf(item.created_by_role).label]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [data, tab, portal, query]);

  // group by originating portal, in a fixed order, with any unknown roles last
  const groups = useMemo(() => {
    const map = new Map();
    for (const item of visible) {
      const key = item.created_by_role || "other";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    }
    const order = [...PORTAL_ORDER, ...[...map.keys()].filter((k) => !PORTAL_ORDER.includes(k))];
    return order.filter((k) => map.has(k)).map((k) => ({ key: k, meta: portalOf(k), items: map.get(k) }));
  }, [visible]);

  const portalOptions = useMemo(
    () => [...PORTAL_ORDER, ...Object.keys(counts.byPortal).filter((k) => !PORTAL_ORDER.includes(k))].filter((k) => counts.byPortal[k]),
    [counts.byPortal],
  );

  const filtersApplied = portal !== "all" || query.trim().length > 0;

  return (
    <div className="p-6 space-y-6">
      <PageHero
        eyebrow="Support"
        title="Complaints"
        subtitle="Every issue raised across the client, sales, HR, employee and IT portals"
        icon={MessageSquareWarning}
        actions={
          <>
            <HeroStat label="Open" value={counts.open} />
            <HeroStat label="In progress" value={counts.in_progress} tone="amber" />
            <HeroStat label="High priority" value={counts.high} tone={counts.high ? "red" : "default"} />
            <button
              type="button"
              onClick={fetchComplaints}
              disabled={loading}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-60"
              aria-label="Refresh complaints"
              title="Refresh"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
          </>
        }
      />

      {/* KPI STRIP */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Open" value={counts.open} sub="Awaiting first response" icon={CircleDot} tone="indigo" />
        <StatCard label="In Progress" value={counts.in_progress} sub="Being worked on" icon={LoaderCircle} tone="amber" />
        <StatCard label="Resolved" value={counts.resolved} sub="Closed successfully" icon={CheckCircle2} tone="green" />
        <StatCard label="Rejected" value={counts.rejected} sub="Declined or invalid" icon={XCircle} tone="red" />
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#e6e9f0] bg-white p-3 shadow-[0_1px_2px_rgba(11,18,32,0.05)] lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {TABS.map((t) => (
            <PillTab key={t.key} active={tab === t.key} onClick={() => setTab(t.key)} icon={t.icon}>
              {t.label}
              <span className={`num ml-1 rounded-md px-1.5 py-0.5 text-[10px] ${tab === t.key ? "bg-white/20" : "bg-gray-100 text-[#7b8698]"}`}>
                {counts.byTab[t.key] ?? 0}
              </span>
            </PillTab>
          ))}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="relative">
            <Filter size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7b8698]" />
            <select
              value={portal}
              onChange={(e) => setPortal(e.target.value)}
              className="h-10 appearance-none rounded-xl border border-[#e6e9f0] bg-white pl-9 pr-8 text-sm font-semibold text-[#33405c] outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              aria-label="Filter by portal"
            >
              <option value="all">All portals</option>
              {portalOptions.map((k) => (
                <option key={k} value={k}>
                  {portalOf(k).label} ({counts.byPortal[k]})
                </option>
              ))}
            </select>
            <ChevronRight size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-[#7b8698]" />
          </label>

          <label className="relative">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7b8698]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title, person, department…"
              className="h-10 w-full rounded-xl border border-[#e6e9f0] bg-white pl-9 pr-3 text-sm text-[#0b1220] outline-none transition placeholder:text-[#7b8698] focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 sm:w-72"
              aria-label="Search complaints"
            />
          </label>
        </div>
      </div>

      {/* CONTENT */}
      {loading ? (
        <SkeletonGrid />
      ) : groups.length === 0 ? (
        <EmptyState
          tab={tab}
          filtersApplied={filtersApplied}
          onClear={() => {
            setPortal("all");
            setQuery("");
          }}
        />
      ) : (
        <div className="space-y-8">
          {groups.map((g) => (
            <section key={g.key} aria-labelledby={`portal-${g.key}`}>
              <div className="mb-3 flex items-center gap-3">
                <span className={`h-2.5 w-2.5 rounded-full ${g.meta.dot}`} />
                <h2 id={`portal-${g.key}`} className="text-sm font-bold uppercase tracking-[0.12em] text-[#33405c]">
                  {g.meta.label}
                </h2>
                <span className="num rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-[#7b8698]">{g.items.length}</span>
                <span className="h-px flex-1 bg-[#eceff4]" />
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {g.items.map((item, i) => (
                  <ComplaintCard key={item.id} item={item} index={i} onOpen={() => navigate(`/complaints/${item.id}`)} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function ComplaintCard({ item, index, onOpen }) {
  const portal = portalOf(item.created_by_role);
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index, 8) * 0.04, ease: "easeOut" }}
      className="group flex w-full flex-col gap-3 rounded-2xl border border-[#e6e9f0] bg-white p-5 text-left shadow-[0_1px_2px_rgba(11,18,32,0.05)] transition-all duration-150 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-[0_16px_32px_-14px_rgba(79,70,229,0.3)] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-bold tracking-tight text-[#0b1220] transition-colors group-hover:text-indigo-600">
            {item.title}
          </p>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-[#7b8698]">
            {item.description || "No description provided."}
          </p>
        </div>
        <PriorityBadge priority={item.priority} />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-medium text-[#33405c]">
        <span className="inline-flex items-center gap-1.5">
          <User size={14} className="text-[#7b8698]" />
          {raisedBy(item)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Building2 size={14} className="text-[#7b8698]" />
          {item.department_name || portal.label}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-[#eceff4] pt-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill status={item.status} />
          <CategoryChip category={item.category} />
        </div>
        <span
          className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-[#7b8698]"
          title={formatDateTime(item.created_at)}
        >
          <Clock size={12} />
          {timeAgo(item.created_at)}
          <ChevronRight size={14} className="ml-1 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
        </span>
      </div>
    </motion.button>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Loading complaints">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-2xl border border-[#e6e9f0] bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="h-4 w-2/3 rounded bg-gray-100" />
              <div className="mt-2 h-3 w-full rounded bg-gray-100" />
              <div className="mt-1.5 h-3 w-4/5 rounded bg-gray-100" />
            </div>
            <div className="h-6 w-14 rounded-full bg-gray-100" />
          </div>
          <div className="mt-4 flex gap-4">
            <div className="h-3 w-24 rounded bg-gray-100" />
            <div className="h-3 w-20 rounded bg-gray-100" />
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-[#eceff4] pt-3">
            <div className="h-6 w-20 rounded-full bg-gray-100" />
            <div className="h-3 w-12 rounded bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ tab, filtersApplied, onClear }) {
  const copy = filtersApplied
    ? { title: "No complaints match these filters", body: "Try a different portal or clear the search." }
    : tab === "active"
      ? { title: "No active complaints", body: "Everything raised so far has been resolved or rejected." }
      : { title: `No ${tab === "all" ? "" : tab + " "}complaints yet`, body: "New items will appear here as soon as they are filed." };

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#d5dae4] bg-white px-6 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
        <Inbox size={26} />
      </span>
      <h3 className="mt-4 text-base font-bold tracking-tight text-[#0b1220]">{copy.title}</h3>
      <p className="mt-1 max-w-sm text-sm leading-relaxed text-[#7b8698]">{copy.body}</p>
      {filtersApplied ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[#e6e9f0] bg-white px-4 py-2 text-sm font-semibold text-[#33405c] transition hover:border-indigo-200 hover:text-indigo-600"
        >
          Clear filters
        </button>
      ) : null}
    </div>
  );
}
