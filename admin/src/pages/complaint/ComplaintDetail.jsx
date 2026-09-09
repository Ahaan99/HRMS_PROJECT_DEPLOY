import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  CheckCircle2,
  Hash,
  Inbox,
  Layers,
  LoaderCircle,
  MessageSquareWarning,
  MessagesSquare,
  RotateCcw,
  Send,
  Tag,
  User,
  XCircle,
  Flag,
} from "lucide-react";
import API from "../../services/api.js";
import { PageHero, SectionCard } from "../../components/common/Premium";
import {
  ADMIN_ROLES,
  portalOf,
  raisedBy,
  categoryOf,
  senderName,
  roleLabel,
  initials,
  isActiveStatus,
  timeAgo,
  formatDateTime,
  StatusPill,
  PriorityBadge,
  PortalChip,
} from "./complaintUi";

const STATUS_ACTIONS = [
  {
    status: "in_progress",
    label: "Mark In Progress",
    hint: "The team is working on it",
    icon: LoaderCircle,
    cls: "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100",
    ring: "ring-amber-300",
  },
  {
    status: "resolved",
    label: "Resolve",
    hint: "Issue has been fixed",
    icon: CheckCircle2,
    cls: "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
    ring: "ring-emerald-300",
  },
  {
    status: "rejected",
    label: "Reject",
    hint: "Not valid or out of scope",
    icon: XCircle,
    cls: "border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100",
    ring: "ring-rose-300",
  },
  {
    status: "open",
    label: "Reopen",
    hint: "Move back to the open queue",
    icon: RotateCcw,
    cls: "border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100",
    ring: "ring-sky-300",
    onlyWhenClosed: true,
  },
];

export default function ComplaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState(null);
  const threadEndRef = useRef(null);

  const fetchDetail = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      try {
        const res = await API.get(`/complaints/${id}`);
        const payload = res.data?.data;
        if (!payload?.complaint) {
          setNotFound(true);
          setData(null);
        } else {
          setNotFound(false);
          setData(payload);
        }
      } catch {
        toast.error("Failed to load complaint");
        setNotFound(true);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [id],
  );

  useEffect(() => {
    if (id) fetchDetail();
  }, [id, fetchDetail]);

  const replyCount = data?.replies?.length ?? 0;
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ block: "nearest" });
  }, [replyCount]);

  const handleReply = async () => {
    const message = reply.trim();
    if (!message || sending) return;
    setSending(true);
    try {
      await API.post(`/complaints/${id}/reply`, { message });
      setReply("");
      await fetchDetail({ silent: true });
      toast.success("Reply sent");
    } catch {
      toast.error("Reply failed");
    } finally {
      setSending(false);
    }
  };

  const onComposerKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !(e.nativeEvent.isComposing || e.keyCode === 229)) {
      e.preventDefault();
      handleReply();
    }
  };

  const handleStatus = async (status) => {
    if (!data?.complaint || data.complaint.status === status || updating) return;
    setUpdating(status);
    try {
      await API.put(`/complaints/${id}/status`, { status });
      await fetchDetail({ silent: true });
      toast.success(`Marked as ${status.replace("_", " ")}`);
    } catch {
      toast.error("Status update failed");
    } finally {
      setUpdating(null);
    }
  };

  const goBack = () => navigate("/complaints");

  if (loading) return <DetailSkeleton onBack={goBack} />;

  if (notFound || !data?.complaint) {
    return (
      <div className="p-6 space-y-6">
        <BackLink onClick={goBack} />
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#d5dae4] bg-white px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Inbox size={26} />
          </span>
          <h2 className="mt-4 text-base font-bold tracking-tight text-[#0b1220]">Complaint not found</h2>
          <p className="mt-1 max-w-sm text-sm leading-relaxed text-[#7b8698]">
            It may have been removed, or the link is out of date.
          </p>
          <button
            type="button"
            onClick={goBack}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-700 px-4 py-2 text-sm font-bold text-white shadow-md shadow-indigo-200 transition hover:opacity-95"
          >
            <ArrowLeft size={15} /> Back to complaints
          </button>
        </div>
      </div>
    );
  }

  const { complaint, replies = [] } = data;
  const closed = !isActiveStatus(complaint.status);
  const portal = portalOf(complaint.created_by_role);

  return (
    <div className="p-6 space-y-6">
      <BackLink onClick={goBack} />

      <PageHero
        eyebrow={`Complaint #${complaint.id}`}
        title={complaint.title}
        subtitle={`Raised by ${raisedBy(complaint)} via ${portal.label} · ${timeAgo(complaint.created_at)}`}
        icon={MessageSquareWarning}
        actions={
          <>
            <StatusPill status={complaint.status} size="lg" />
            <PriorityBadge priority={complaint.priority} size="lg" />
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* MAIN COLUMN */}
        <div className="space-y-6">
          <SectionCard title="Description" sub="What was reported">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#33405c]">
              {complaint.description?.trim() || "No description was provided."}
            </p>
          </SectionCard>

          <SectionCard
            title="Conversation"
            sub={replies.length ? `${replies.length} ${replies.length === 1 ? "reply" : "replies"}` : "No replies yet"}
            bodyClassName="p-0"
          >
            <div className="max-h-[520px] space-y-5 overflow-y-auto px-5 py-5">
              {replies.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                    <MessagesSquare size={22} />
                  </span>
                  <p className="mt-3 text-sm font-semibold text-[#0b1220]">Start the conversation</p>
                  <p className="mt-1 text-xs text-[#7b8698]">Your reply is visible to the person who raised this complaint.</p>
                </div>
              ) : (
                replies.map((r) => <ReplyBubble key={r.id} reply={r} />)
              )}
              <div ref={threadEndRef} />
            </div>

            {/* COMPOSER */}
            <div className="border-t border-[#eceff4] bg-gray-50 p-4">
              <div className="flex items-end gap-3">
                <label className="sr-only" htmlFor="complaint-reply">
                  Write a reply
                </label>
                <textarea
                  id="complaint-reply"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={onComposerKeyDown}
                  rows={2}
                  placeholder="Write a reply…"
                  className="min-h-[44px] flex-1 resize-none rounded-xl border border-[#e6e9f0] bg-white px-4 py-2.5 text-sm text-[#0b1220] outline-none transition placeholder:text-[#7b8698] focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
                <button
                  type="button"
                  onClick={handleReply}
                  disabled={sending || !reply.trim()}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-700 px-4 text-sm font-bold text-white shadow-md shadow-indigo-200 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
                >
                  {sending ? <LoaderCircle size={16} className="animate-spin" /> : <Send size={16} />}
                  Send
                </button>
              </div>
              <p className="mt-2 text-[11px] text-[#7b8698]">
                Enter to send · Shift + Enter for a new line
              </p>
            </div>
          </SectionCard>
        </div>

        {/* SIDE COLUMN */}
        <aside className="space-y-6">
          <SectionCard title="Status" sub="Update where this complaint stands">
            <div className="flex flex-col gap-2">
              {STATUS_ACTIONS.filter((a) => !a.onlyWhenClosed || closed).map((a) => {
                const Icon = a.icon;
                const current = complaint.status === a.status;
                const busy = updating === a.status;
                return (
                  <button
                    key={a.status}
                    type="button"
                    onClick={() => handleStatus(a.status)}
                    disabled={current || !!updating}
                    aria-pressed={current}
                    className={`flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left text-sm font-semibold transition ${a.cls} ${
                      current ? `ring-2 ring-offset-1 ${a.ring} cursor-default` : ""
                    } disabled:opacity-90`}
                  >
                    <span className="flex items-center gap-2.5">
                      {busy ? <LoaderCircle size={16} className="animate-spin" /> : <Icon size={16} />}
                      <span>
                        {a.label}
                        <span className="block text-[11px] font-medium opacity-70">{a.hint}</span>
                      </span>
                    </span>
                    {current ? (
                      <span className="rounded-md bg-white/70 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">Current</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard title="Details">
            <dl>
              <DetailRow icon={Flag} label="Priority">
                <PriorityBadge priority={complaint.priority} />
              </DetailRow>
              <DetailRow icon={Tag} label="Category">
                {categoryOf(complaint.category)}
              </DetailRow>
              <DetailRow icon={User} label="Raised by">
                {raisedBy(complaint)}
              </DetailRow>
              <DetailRow icon={Building2} label="Department">
                {complaint.department_name || "—"}
              </DetailRow>
              <DetailRow icon={Layers} label="Portal">
                <PortalChip role={complaint.created_by_role} />
              </DetailRow>
              <DetailRow icon={CalendarClock} label="Created">
                {formatDateTime(complaint.created_at)}
              </DetailRow>
              <DetailRow icon={CalendarClock} label="Last updated">
                {formatDateTime(complaint.updated_at)}
              </DetailRow>
              <DetailRow icon={Hash} label="Reference">
                <span className="num">CMP-{String(complaint.id).padStart(4, "0")}</span>
              </DetailRow>
            </dl>
          </SectionCard>
        </aside>
      </div>
    </div>
  );
}

function BackLink({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#33405c] transition hover:text-indigo-600"
    >
      <ArrowLeft size={16} />
      Back to complaints
    </button>
  );
}

function ReplyBubble({ reply }) {
  const mine = ADMIN_ROLES.has(reply.sender_role);
  const name = senderName(reply);
  return (
    <div className={`flex items-end gap-3 ${mine ? "flex-row-reverse" : ""}`}>
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
          mine ? "bg-gradient-to-br from-indigo-600 to-violet-700 text-white" : "bg-slate-100 text-slate-700"
        }`}
        aria-hidden="true"
      >
        {initials(name)}
      </span>
      <div className={`flex max-w-[78%] flex-col ${mine ? "items-end" : "items-start"}`}>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="font-semibold text-[#33405c]">{name}</span>
          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">
            {roleLabel(reply.sender_role)}
          </span>
        </div>
        <div
          className={`mt-1 whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            mine
              ? "rounded-br-md bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-md shadow-indigo-200"
              : "rounded-bl-md border border-[#e6e9f0] bg-gray-50 text-[#0b1220]"
          }`}
        >
          {reply.message}
        </div>
        <p className="mt-1 text-[10px] font-medium text-[#7b8698]" title={formatDateTime(reply.created_at)}>
          {timeAgo(reply.created_at)}
        </p>
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3 border-t border-[#eceff4] py-3 first:border-t-0 first:pt-0 last:pb-0">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
        <Icon size={15} />
      </span>
      <div className="min-w-0 flex-1">
        <dt className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#7b8698]">{label}</dt>
        <dd className="mt-0.5 break-words text-sm font-semibold text-[#0b1220]">{children}</dd>
      </div>
    </div>
  );
}

function DetailSkeleton({ onBack }) {
  return (
    <div className="p-6 space-y-6" aria-busy="true" aria-label="Loading complaint">
      <BackLink onClick={onBack} />
      <div className="h-28 animate-pulse rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 opacity-80" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <div className="animate-pulse rounded-2xl border border-[#e6e9f0] bg-white p-5">
            <div className="h-4 w-32 rounded bg-gray-100" />
            <div className="mt-4 h-3 w-full rounded bg-gray-100" />
            <div className="mt-2 h-3 w-5/6 rounded bg-gray-100" />
          </div>
          <div className="h-72 animate-pulse rounded-2xl border border-[#e6e9f0] bg-white" />
        </div>
        <div className="space-y-6">
          <div className="h-56 animate-pulse rounded-2xl border border-[#e6e9f0] bg-white" />
          <div className="h-80 animate-pulse rounded-2xl border border-[#e6e9f0] bg-white" />
        </div>
      </div>
    </div>
  );
}
