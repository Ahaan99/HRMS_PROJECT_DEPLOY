import usePrompt from "../../hooks/usePrompt";
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { PageHero, HeroStat, PillTab } from "../../components/common/Premium";
import {
  Inbox,
  KeyRound,
  Copy,
  UserPlus,
  Archive,
  MailOpen,
  Globe,
} from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("hrms_admin_token")}`,
});

const TYPE_LABELS = {
  contact: "Contact",
  job_application: "Job Application",
  enquiry: "Enquiry",
  demo_request: "Demo Request",
  vendor_registration: "Vendor Registration",
  employee_new_joining: "New Joining",
};

export default function WebFormsInbox() {
  const { ask, PromptDialog } = usePrompt();
  const [subs, setSubs] = useState([]);
  const [counts, setCounts] = useState({});
  const [keys, setKeys] = useState([]);
  const [filter, setFilter] = useState("");
  const [tab, setTab] = useState("inbox");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [s, k] = await Promise.all([
        axios.get(`${BASE_URL}/web-forms/submissions${filter ? `?status=${filter}` : ""}`, {
          headers: authHeaders(),
        }),
        axios.get(`${BASE_URL}/web-forms/keys`, { headers: authHeaders() }),
      ]);
      setSubs(s.data.submissions || []);
      setCounts(s.data.counts || {});
      setKeys(k.data.keys || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Load failed");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (id, status) => {
    await axios.patch(
      `${BASE_URL}/web-forms/submissions/${id}/status`,
      { status },
      { headers: authHeaders() },
    );
    load();
  };

  const convert = async (id) => {
    try {
      await axios.post(
        `${BASE_URL}/web-forms/submissions/${id}/convert`,
        {},
        { headers: authHeaders() },
      );
      toast.success("Converted to candidate");
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Convert failed");
    }
  };

  const createKey = async () => {
    const label = await ask({
      title: "Create API key",
      label: "Key label",
      placeholder: "e.g. Careers Site",
      required: true,
      submitText: "Create key",
    });
    if (!label) return;
    const { data } = await axios.post(
      `${BASE_URL}/web-forms/keys`,
      { label },
      { headers: authHeaders() },
    );
    toast.success("Key created");
    navigator.clipboard?.writeText(data.api_key).catch(() => {});
    load();
  };

  const revokeKey = async (id) => {
    if (!window.confirm("Revoke this API key? Websites using it will stop working.")) return;
    await axios.delete(`${BASE_URL}/web-forms/keys/${id}`, { headers: authHeaders() });
    load();
  };

  const copy = (text) => {
    navigator.clipboard?.writeText(text);
    toast.success("Copied");
  };

  const snippet = (key) => `fetch("${BASE_URL}/web-forms/submit", {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-API-Key": "${key}" },
  body: JSON.stringify({
    form_type: "contact", // contact | job_application | enquiry | demo_request
    name: "...", email: "...", phone: "...",
    subject: "...", message: "...",
  }),
});`;

  const statusColors = {
    New: "bg-blue-50 text-blue-600",
    Read: "bg-gray-100 text-gray-600",
    Converted: "bg-emerald-50 text-emerald-600",
    Archived: "bg-amber-50 text-amber-600",
  };

  return (
    <>
    <div className="p-6 space-y-5">
      <PageHero
        eyebrow="Inbound"
        title="Website Forms"
        subtitle="Public website submissions routed into your HRMS"
        icon={Globe}
        actions={
          <>
            <HeroStat label="Submissions" value={counts.total || 0} />
            <HeroStat label="New" value={counts.unread || 0} tone="amber" />
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <PillTab active={tab === "inbox"} onClick={() => setTab("inbox")} icon={Inbox}>
          Inbox
        </PillTab>
        <PillTab active={tab === "keys"} onClick={() => setTab("keys")} icon={KeyRound}>
          API Keys
        </PillTab>
      </div>

      {tab === "inbox" && (
        <>
          <div className="flex gap-2 flex-wrap">
            {["", "New", "Read", "Converted", "Archived"].map((f) => (
              <button
                key={f || "all"}
                onClick={() => setFilter(f)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg ${
                  filter === f ? "bg-black text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                {f || "All"}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {subs.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-gray-900">{s.name}</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
                        {TYPE_LABELS[s.form_type] || s.form_type}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[s.status]}`}
                      >
                        {s.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {s.email || "no email"} &middot; {s.phone || "no phone"} &middot;{" "}
                      {new Date(s.created_at).toLocaleString()} &middot; via {s.source}
                    </p>
                    {s.subject && (
                      <p className="text-sm font-semibold text-gray-700 mt-2">{s.subject}</p>
                    )}
                    {s.message && (
                      <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                        {s.message}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {s.status === "New" && (
                      <button
                        onClick={() => setStatus(s.id, "Read")}
                        className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
                        title="Mark read"
                      >
                        <MailOpen size={15} />
                      </button>
                    )}
                    {s.status !== "Converted" && (
                      <button
                        onClick={() => convert(s.id)}
                        className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                        title="Convert to candidate"
                      >
                        <UserPlus size={15} />
                      </button>
                    )}
                    {s.status !== "Archived" && (
                      <button
                        onClick={() => setStatus(s.id, "Archived")}
                        className="p-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100"
                        title="Archive"
                      >
                        <Archive size={15} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {!loading && subs.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <Inbox size={40} className="mx-auto mb-3 opacity-40" />
                <p className="font-semibold">No submissions yet</p>
                <p className="text-sm">
                  Connect your website using an API key from the API Keys tab.
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {tab === "keys" && (
        <div className="space-y-4">
          <button
            onClick={createKey}
            className="bg-black text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-gray-900"
          >
            + Generate New Key
          </button>

          {keys.map((k) => (
            <div
              key={k.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3"
            >
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="font-bold text-gray-900">
                    {k.label}{" "}
                    {!k.is_active && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500 ml-1">
                        REVOKED
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400 font-mono break-all mt-1">{k.api_key}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => copy(k.api_key)}
                    className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
                    title="Copy key"
                  >
                    <Copy size={15} />
                  </button>
                  {k.is_active === 1 && (
                    <button
                      onClick={() => revokeKey(k.id)}
                      className="text-xs font-bold text-red-500 hover:text-red-600 px-2"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>
              {k.is_active === 1 && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-bold text-gray-500">
                      Website integration snippet
                    </p>
                    <button
                      onClick={() => copy(snippet(k.api_key))}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                    >
                      Copy snippet
                    </button>
                  </div>
                  <pre className="bg-gray-900 text-gray-100 text-[11px] rounded-xl p-3 overflow-x-auto">
                    {snippet(k.api_key)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
      <PromptDialog />
    </>
  );
}
