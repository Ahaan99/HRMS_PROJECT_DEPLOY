// TASK: work-assignment pages - manual Refresh + last-updated, error toasts, filters actually sent (employee).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(fileURLToPath(new URL("../../", import.meta.url)));

const targets = [
  { file: "employee/src/pages/workassignment/WorkAssignment.jsx", url: "/employee/work-assignment", hasToast: true },
  { file: "IT/src/pages/workassignment/WorkAssignment.jsx", url: "/hr/work-assignment", hasToast: true },
  { file: "Sales/src/pages/worktarget/WorkAssignment.jsx", url: "/sales/work-assignment", hasToast: false },
  { file: "client/src/pages/workassignment/WorkAssignment.jsx", url: "/client/work-assignment", hasToast: true },
];

const mustReplace = (s, re, to, label) => {
  const n = [...s.matchAll(new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g"))].length;
  if (n !== 1) throw new Error(`${label}: expected 1 match, got ${n}`);
  return s.replace(re, to);
};

for (const t of targets) {
  const p = path.join(root, t.file);
  const raw = fs.readFileSync(p, "utf8");
  const crlf = raw.includes("\r\n");
  let s = raw.replace(/\r\n/g, "\n");

  if (!t.hasToast) s = s.replace(/^import \{ useEffect, useState \} from "react";/m, `import toast from "react-hot-toast";\nimport { useEffect, useState } from "react";`);
  s = s.replace(/^import \{ useEffect, useState \} from "react";/m, `import { useEffect, useState } from "react";`);
  if (!/from "lucide-react"/.test(s)) s = s.replace(/^(import toast from "react-hot-toast";)/m, `$1\nimport { RefreshCw } from "lucide-react";`);
  else if (!/\bRefreshCw\b/.test(s)) s = s.replace(/import \{\n?([^}]*)\} from "lucide-react";/, (m, inner) => `import {${inner.trimEnd()},\n  RefreshCw,\n} from "lucide-react";`);

  // state: lastUpdated
  s = mustReplace(
    s,
    /const \[loading, setLoading\] = useState\(false\);/,
    `const [loading, setLoading] = useState(false);\n  const [lastUpdated, setLastUpdated] = useState(null);`,
    `${t.file} loading state`,
  );

  // employee page never sent its filters
  s = s.replace("const res = await API.get(`/employee/work-assignment`);", "const res = await API.get(`/employee/work-assignment?${query}`);");

  // after data loads -> stamp time; on error -> toast
  s = mustReplace(
    s,
    /setAssignments\(data\);\n\s*calculateStats\(data\);/,
    `setAssignments(data);\n      calculateStats(data);\n      setLastUpdated(new Date());`,
    `${t.file} setAssignments`,
  );
  s = mustReplace(
    s,
    /console\.error\("FETCH ERROR:", err\);/,
    `console.error("FETCH ERROR:", err);\n      toast.error(err.response?.data?.message || "Failed to load work assignments");`,
    `${t.file} fetch error`,
  );

  // toolbar with Refresh + last-updated, inserted right before the filters component
  const toolbar = `      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-gray-500" aria-live="polite">
          {lastUpdated
            ? \`Last updated \${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}\`
            : "Loading assignments..."}
        </p>
        <button
          type="button"
          onClick={fetchAssignments}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-60"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} aria-hidden="true" />
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

`;
  s = mustReplace(s, /^([ \t]+)<WorkAssignmentFilters\b/m, `${toolbar}$1<WorkAssignmentFilters`, `${t.file} filters anchor`);

  fs.writeFileSync(p, crlf ? s.replace(/\n/g, "\r\n") : s, "utf8");
  console.log("patched", t.file);
}
