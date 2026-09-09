import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, UserPlus, X } from "lucide-react";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";

const initials = (name = "") =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || "").join("") || "?";

const AssignedHRMultiSelect = ({ clientId, assignedHRs = [], onUpdate }) => {
  const axiosPrivate = useAxiosPrivate();
  const [allHRs, setAllHRs] = useState([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const rootRef = useRef(null);

  useEffect(() => {
    let alive = true;
    axiosPrivate
      .get("/super-admin/employees")
      .then((res) => {
        if (!alive) return;
        const list = res.data?.employees ?? res.data?.data ?? [];
        setAllHRs(list.filter((e) => e.isActive !== 0 && e.isActive !== false));
      })
      .catch(() => alive && setError("Could not load employees"));
    return () => { alive = false; };
  }, [axiosPrivate]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => rootRef.current && !rootRef.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const assignedIds = useMemo(() => new Set(assignedHRs.map((h) => h.id)), [assignedHRs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allHRs.filter((e) =>
      !q ||
      e.name?.toLowerCase().includes(q) ||
      e.email?.toLowerCase().includes(q) ||
      e.employeeCode?.toLowerCase().includes(q) ||
      e.department?.toLowerCase().includes(q)
    );
  }, [allHRs, query]);

  const toggle = async (hrId) => {
    try {
      setBusyId(hrId);
      setError("");
      await axiosPrivate.patch("/super-admin/clients/assign-hr", {
        client_id: clientId,
        hr_employee_id: hrId,
      });
      onUpdate?.();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update assignment");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div ref={rootRef} className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">Assigned HR</p>
        <span className="text-[11px] font-semibold text-gray-400">
          {assignedHRs.length} assigned
        </span>
      </div>

      {assignedHRs.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {assignedHRs.map((hr) => (
            <span
              key={hr.id}
              className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 py-1 pl-1 pr-2 text-xs font-semibold text-indigo-700"
            >
              <span className="grid h-5 w-5 place-items-center rounded-full bg-indigo-600 text-[9px] font-bold text-white">
                {initials(hr.name)}
              </span>
              {hr.name}
              <button
                type="button"
                onClick={() => toggle(hr.id)}
                disabled={busyId === hr.id}
                aria-label={`Unassign ${hr.name}`}
                className="rounded-full p-0.5 text-indigo-400 transition hover:bg-indigo-100 hover:text-indigo-700 disabled:opacity-40"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={`flex w-full items-center justify-between rounded-lg border bg-white px-3 py-2 text-sm transition ${
            open ? "border-indigo-400 ring-2 ring-indigo-100" : "border-gray-200 hover:border-indigo-300"
          }`}
        >
          <span className="flex items-center gap-2 text-gray-700">
            <UserPlus size={15} className="text-indigo-500" />
            Assign HR
          </span>
          <ChevronDown size={15} className={`text-gray-400 transition ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
            <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
              <Search size={14} className="text-gray-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, code or department"
                className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
              />
            </div>

            <ul role="listbox" className="max-h-60 overflow-y-auto py-1">
              {filtered.map((e) => {
                const on = assignedIds.has(e.id);
                return (
                  <li
                    key={e.id}
                    role="option"
                    aria-selected={on}
                    onClick={() => busyId === null && toggle(e.id)}
                    className={`flex cursor-pointer items-center gap-3 px-3 py-2 text-sm transition hover:bg-gray-50 ${
                      on ? "bg-indigo-50/60" : ""
                    } ${busyId === e.id ? "opacity-50" : ""}`}
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">
                      {initials(e.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-gray-900">{e.name}</span>
                      <span className="block truncate text-[11px] text-gray-500">
                        {[e.employeeCode, e.department, e.designation].filter(Boolean).join(" · ") || e.email}
                      </span>
                    </span>
                    {on && <Check size={15} className="shrink-0 text-indigo-600" />}
                  </li>
                );
              })}

              {!filtered.length && (
                <li className="px-3 py-6 text-center text-sm text-gray-500">
                  {allHRs.length ? "No match for your search" : error || "No employees available"}
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      {error && !open && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
};

export default AssignedHRMultiSelect;
