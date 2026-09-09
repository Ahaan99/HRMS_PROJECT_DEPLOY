import { useEffect, useState, useCallback } from "react";
import ExportButton from "../../components/common/ExportButton";
import axios from "axios";
import { HeartHandshake, GraduationCap, Award, Grid3X3, Plus, Trash2 } from "lucide-react";
import { PageHero, PillTab } from "../../components/common/Premium";
import toast from "react-hot-toast";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const TABS = [
  { key: "benefits", label: "Benefits", icon: HeartHandshake },
  { key: "trainings", label: "Trainings", icon: GraduationCap },
  { key: "certs", label: "Certifications", icon: Award },
  { key: "skills", label: "Skill Matrix", icon: Grid3X3 },
];

const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500";
const btnCls = "inline-flex items-center gap-1.5 bg-gray-900 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50";

const LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"];
const LEVEL_TONE = {
  Beginner: "bg-gray-100 text-gray-600",
  Intermediate: "bg-sky-50 text-sky-700",
  Advanced: "bg-violet-50 text-violet-700",
  Expert: "bg-emerald-50 text-emerald-700",
};

export default function BenefitsUpskilling() {
  const token = localStorage.getItem("hrms_admin_token");
  const headers = { Authorization: `Bearer ${token}` };

  const [tab, setTab] = useState("benefits");
  const [employees, setEmployees] = useState([]);
  const [benefits, setBenefits] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [certs, setCerts] = useState([]);
  const [skills, setSkills] = useState([]);
  const [saving, setSaving] = useState(false);

  const [bf, setBf] = useState({ employee_id: "", benefit_type: "Insurance", title: "", provider: "", policy_number: "", amount: "", start_date: "", end_date: "" });
  const [tr, setTr] = useState({ title: "", category: "", trainer: "", mode: "Online", start_date: "", end_date: "" });
  const [asg, setAsg] = useState({ training_id: "", employee_id: "" });
  const [cf, setCf] = useState({ employee_id: "", name: "", issuer: "", issue_date: "", expiry_date: "", credential_id: "" });
  const [sk, setSk] = useState({ employee_id: "", skill: "", level: "Beginner" });

  const empName = (id) => employees.find((e) => String(e.id) === String(id))?.name || "";

  const loadAll = useCallback(async () => {
    try {
      const [e, b, t, a, c, s] = await Promise.all([
        axios.get(`${BASE_URL}/super-admin/employees`, { headers }),
        axios.get(`${BASE_URL}/benefits`, { headers }),
        axios.get(`${BASE_URL}/benefits/trainings/all`, { headers }),
        axios.get(`${BASE_URL}/benefits/assignments/all`, { headers }),
        axios.get(`${BASE_URL}/benefits/certifications/all`, { headers }),
        axios.get(`${BASE_URL}/benefits/skills/all`, { headers }),
      ]);
      setEmployees(Array.isArray(e.data) ? e.data : e.data?.employees || e.data?.data || []);
      setBenefits(b.data);
      setTrainings(t.data);
      setAssignments(a.data);
      setCerts(c.data);
      setSkills(s.data);
    } catch (err) {
      console.error("Load error:", err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const post = async (url, body, reset) => {
    setSaving(true);
    try {
      await axios.post(`${BASE_URL}${url}`, body, { headers });
      reset?.();
      await loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const put = async (url, body) => {
    try {
      await axios.put(`${BASE_URL}${url}`, body, { headers });
      await loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    }
  };

  const del = async (url) => {
    if (!confirm("Delete this record?")) return;
    try {
      await axios.delete(`${BASE_URL}${url}`, { headers });
      await loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  /* skill matrix pivot */
  const skillNames = [...new Set(skills.map((s) => s.skill))];
  const skillEmployees = [...new Set(skills.map((s) => s.employee_name))];

  return (
    <div className="p-6 space-y-6">
      <PageHero
        eyebrow="People Growth"
        title="Benefits &amp; Upskilling"
        subtitle="Insurance, reimbursements, bonuses, trainings, certifications and skills."
        icon={HeartHandshake}
        actions={<ExportButton data={benefits} filename="benefits" />}
      />

      <div className="flex flex-wrap gap-2">
        {TABS.map(({ key, label, icon: Icon }) => (
          <PillTab key={key} active={tab === key} onClick={() => setTab(key)} icon={Icon}>
            {label}
          </PillTab>
        ))}
      </div>

      {/* ---------------- BENEFITS ---------------- */}
      {tab === "benefits" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow border border-gray-100 p-5">
            <p className="text-sm font-bold text-gray-900 mb-4">Add Benefit</p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <select className={inputCls} value={bf.employee_id} onChange={(e) => setBf({ ...bf, employee_id: e.target.value })}>
                <option value="">Select employee *</option>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
              <select className={inputCls} value={bf.benefit_type} onChange={(e) => setBf({ ...bf, benefit_type: e.target.value })}>
                {["Insurance", "Reimbursement", "Bonus", "Incentive", "Other"].map((t) => <option key={t}>{t}</option>)}
              </select>
              <input className={inputCls} placeholder="Title *" value={bf.title} onChange={(e) => setBf({ ...bf, title: e.target.value })} />
              <input className={inputCls} placeholder="Provider" value={bf.provider} onChange={(e) => setBf({ ...bf, provider: e.target.value })} />
              <input className={inputCls} placeholder="Policy number" value={bf.policy_number} onChange={(e) => setBf({ ...bf, policy_number: e.target.value })} />
              <input className={inputCls} type="number" placeholder="Amount" value={bf.amount} onChange={(e) => setBf({ ...bf, amount: e.target.value })} />
              <input className={inputCls} type="date" value={bf.start_date} onChange={(e) => setBf({ ...bf, start_date: e.target.value })} />
              <input className={inputCls} type="date" value={bf.end_date} onChange={(e) => setBf({ ...bf, end_date: e.target.value })} />
            </div>
            <button className={`${btnCls} mt-4`} disabled={saving || !bf.employee_id || !bf.title}
              onClick={() => post("/benefits", { ...bf, employee_name: empName(bf.employee_id) }, () => setBf({ employee_id: "", benefit_type: "Insurance", title: "", provider: "", policy_number: "", amount: "", start_date: "", end_date: "" }))}>
              <Plus size={15} /> Add Benefit
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-auto max-h-[60vh]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-gray-50 text-left text-xs text-gray-500 uppercase">
                <tr>
                  {["Employee", "Type", "Title", "Provider", "Amount", "Period", "Status", ""].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {benefits.map((b) => (
                  <tr key={b.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">{b.employee_name}</td>
                    <td className="px-4 py-3">{b.benefit_type}</td>
                    <td className="px-4 py-3">{b.title}</td>
                    <td className="px-4 py-3 text-gray-500">{b.provider || "-"}</td>
                    <td className="px-4 py-3">{Number(b.amount).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 text-gray-500">{(b.start_date || "").slice(0, 10)} {b.end_date ? `- ${String(b.end_date).slice(0, 10)}` : ""}</td>
                    <td className="px-4 py-3">
                      <select className="border border-gray-200 rounded-lg px-2 py-1 text-xs" value={b.status} onChange={(e) => put(`/benefits/${b.id}`, { status: e.target.value })}>
                        {["Active", "Pending", "Approved", "Rejected", "Expired", "Paid"].map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => del(`/benefits/${b.id}`)} className="text-red-400 hover:text-red-600"><Trash2 size={15} /></button>
                    </td>
                  </tr>
                ))}
                {!benefits.length && <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No benefits recorded yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------- TRAININGS ---------------- */}
      {tab === "trainings" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow border border-gray-100 p-5">
              <p className="text-sm font-bold text-gray-900 mb-4">New Training Program</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input className={inputCls} placeholder="Title *" value={tr.title} onChange={(e) => setTr({ ...tr, title: e.target.value })} />
                <input className={inputCls} placeholder="Category" value={tr.category} onChange={(e) => setTr({ ...tr, category: e.target.value })} />
                <input className={inputCls} placeholder="Trainer" value={tr.trainer} onChange={(e) => setTr({ ...tr, trainer: e.target.value })} />
                <select className={inputCls} value={tr.mode} onChange={(e) => setTr({ ...tr, mode: e.target.value })}>
                  {["Online", "Offline", "Hybrid"].map((m) => <option key={m}>{m}</option>)}
                </select>
                <input className={inputCls} type="date" value={tr.start_date} onChange={(e) => setTr({ ...tr, start_date: e.target.value })} />
                <input className={inputCls} type="date" value={tr.end_date} onChange={(e) => setTr({ ...tr, end_date: e.target.value })} />
              </div>
              <button className={`${btnCls} mt-4`} disabled={saving || !tr.title}
                onClick={() => post("/benefits/trainings", tr, () => setTr({ title: "", category: "", trainer: "", mode: "Online", start_date: "", end_date: "" }))}>
                <Plus size={15} /> Create Training
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow border border-gray-100 p-5">
              <p className="text-sm font-bold text-gray-900 mb-4">Assign Employee to Training</p>
              <div className="grid grid-cols-1 gap-3">
                <select className={inputCls} value={asg.training_id} onChange={(e) => setAsg({ ...asg, training_id: e.target.value })}>
                  <option value="">Select training *</option>
                  {trainings.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
                <select className={inputCls} value={asg.employee_id} onChange={(e) => setAsg({ ...asg, employee_id: e.target.value })}>
                  <option value="">Select employee *</option>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <button className={`${btnCls} mt-4`} disabled={saving || !asg.training_id || !asg.employee_id}
                onClick={() => post("/benefits/assignments", { ...asg, employee_name: empName(asg.employee_id) }, () => setAsg({ training_id: "", employee_id: "" }))}>
                <Plus size={15} /> Assign
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-auto max-h-[60vh]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-gray-50 text-left text-xs text-gray-500 uppercase">
                <tr>{["Training", "Category", "Trainer", "Mode", "Dates", "Progress", "Status", ""].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {trainings.map((t) => (
                  <tr key={t.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">{t.title}</td>
                    <td className="px-4 py-3">{t.category || "-"}</td>
                    <td className="px-4 py-3">{t.trainer || "-"}</td>
                    <td className="px-4 py-3">{t.mode}</td>
                    <td className="px-4 py-3 text-gray-500">{(t.start_date || "").slice(0, 10)} {t.end_date ? `- ${String(t.end_date).slice(0, 10)}` : ""}</td>
                    <td className="px-4 py-3">{t.completed}/{t.assigned} completed</td>
                    <td className="px-4 py-3">
                      <select className="border border-gray-200 rounded-lg px-2 py-1 text-xs" value={t.status} onChange={(e) => put(`/benefits/trainings/${t.id}`, { status: e.target.value })}>
                        {["Planned", "Ongoing", "Completed", "Cancelled"].map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => del(`/benefits/trainings/${t.id}`)} className="text-red-400 hover:text-red-600"><Trash2 size={15} /></button>
                    </td>
                  </tr>
                ))}
                {!trainings.length && <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No trainings yet</td></tr>}
              </tbody>
            </table>
          </div>

          {assignments.length > 0 && (
            <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-auto max-h-[60vh]">
              <p className="text-sm font-bold text-gray-900 px-4 pt-4">Assignments</p>
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-gray-50 text-left text-xs text-gray-500 uppercase">
                  <tr>{["Employee", "Training", "Status", "Completed On", "Score"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {assignments.map((a) => (
                    <tr key={a.id}>
                      <td className="px-4 py-3 font-medium text-gray-900">{a.employee_name}</td>
                      <td className="px-4 py-3">{a.training_title}</td>
                      <td className="px-4 py-3">
                        <select className="border border-gray-200 rounded-lg px-2 py-1 text-xs" value={a.status} onChange={(e) => put(`/benefits/assignments/${a.id}`, { status: e.target.value })}>
                          {["Assigned", "In Progress", "Completed"].map((s) => <option key={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{a.completion_date ? String(a.completion_date).slice(0, 10) : "-"}</td>
                      <td className="px-4 py-3 text-gray-500">{a.score || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ---------------- CERTIFICATIONS ---------------- */}
      {tab === "certs" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow border border-gray-100 p-5">
            <p className="text-sm font-bold text-gray-900 mb-4">Add Certification</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select className={inputCls} value={cf.employee_id} onChange={(e) => setCf({ ...cf, employee_id: e.target.value })}>
                <option value="">Select employee *</option>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
              <input className={inputCls} placeholder="Certification name *" value={cf.name} onChange={(e) => setCf({ ...cf, name: e.target.value })} />
              <input className={inputCls} placeholder="Issuer" value={cf.issuer} onChange={(e) => setCf({ ...cf, issuer: e.target.value })} />
              <input className={inputCls} type="date" value={cf.issue_date} onChange={(e) => setCf({ ...cf, issue_date: e.target.value })} />
              <input className={inputCls} type="date" value={cf.expiry_date} onChange={(e) => setCf({ ...cf, expiry_date: e.target.value })} />
              <input className={inputCls} placeholder="Credential ID" value={cf.credential_id} onChange={(e) => setCf({ ...cf, credential_id: e.target.value })} />
            </div>
            <button className={`${btnCls} mt-4`} disabled={saving || !cf.employee_id || !cf.name}
              onClick={() => post("/benefits/certifications", { ...cf, employee_name: empName(cf.employee_id) }, () => setCf({ employee_id: "", name: "", issuer: "", issue_date: "", expiry_date: "", credential_id: "" }))}>
              <Plus size={15} /> Add Certification
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-auto max-h-[60vh]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-gray-50 text-left text-xs text-gray-500 uppercase">
                <tr>{["Employee", "Certification", "Issuer", "Issued", "Expires", "Credential", ""].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {certs.map((c) => {
                  const expiring = c.expiry_date && new Date(c.expiry_date) < new Date(Date.now() + 30 * 864e5);
                  return (
                    <tr key={c.id}>
                      <td className="px-4 py-3 font-medium text-gray-900">{c.employee_name}</td>
                      <td className="px-4 py-3">{c.name}</td>
                      <td className="px-4 py-3">{c.issuer || "-"}</td>
                      <td className="px-4 py-3 text-gray-500">{c.issue_date ? String(c.issue_date).slice(0, 10) : "-"}</td>
                      <td className={`px-4 py-3 ${expiring ? "text-red-600 font-semibold" : "text-gray-500"}`}>{c.expiry_date ? String(c.expiry_date).slice(0, 10) : "-"}</td>
                      <td className="px-4 py-3 text-gray-500">{c.credential_id || "-"}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => del(`/benefits/certifications/${c.id}`)} className="text-red-400 hover:text-red-600"><Trash2 size={15} /></button>
                      </td>
                    </tr>
                  );
                })}
                {!certs.length && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No certifications yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------- SKILL MATRIX ---------------- */}
      {tab === "skills" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow border border-gray-100 p-5">
            <p className="text-sm font-bold text-gray-900 mb-4">Add Skill</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select className={inputCls} value={sk.employee_id} onChange={(e) => setSk({ ...sk, employee_id: e.target.value })}>
                <option value="">Select employee *</option>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
              <input className={inputCls} placeholder="Skill (e.g. React, SEO) *" value={sk.skill} onChange={(e) => setSk({ ...sk, skill: e.target.value })} />
              <select className={inputCls} value={sk.level} onChange={(e) => setSk({ ...sk, level: e.target.value })}>
                {LEVELS.map((l) => <option key={l}>{l}</option>)}
              </select>
            </div>
            <button className={`${btnCls} mt-4`} disabled={saving || !sk.employee_id || !sk.skill}
              onClick={() => post("/benefits/skills", { ...sk, employee_name: empName(sk.employee_id) }, () => setSk({ employee_id: "", skill: "", level: "Beginner" }))}>
              <Plus size={15} /> Add Skill
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-auto max-h-[60vh] p-4">
            <p className="text-sm font-bold text-gray-900 mb-3">Skill Matrix</p>
            {skillNames.length ? (
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-gray-50 text-left text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-4 py-3">Employee</th>
                    {skillNames.map((s) => <th key={s} className="px-4 py-3">{s}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {skillEmployees.map((emp) => (
                    <tr key={emp}>
                      <td className="px-4 py-3 font-medium text-gray-900">{emp}</td>
                      {skillNames.map((s) => {
                        const rec = skills.find((x) => x.employee_name === emp && x.skill === s);
                        return (
                          <td key={s} className="px-4 py-3">
                            {rec ? (
                              <select
                                className={`text-xs font-semibold rounded-full px-2 py-1 border-0 ${LEVEL_TONE[rec.level]}`}
                                value={rec.level}
                                onChange={(e) => put(`/benefits/skills/${rec.id}`, { level: e.target.value })}
                              >
                                {LEVELS.map((l) => <option key={l}>{l}</option>)}
                              </select>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-gray-400 py-6 text-center">No skills recorded yet</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
