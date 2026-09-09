// One-off: make IT WorkPolicy.jsx read-only (TASK-17).
import fs from "node:fs";

const file =
  "D:/HRMS_new/HRMS_new/HRMS/HRMS Merging/IT/src/pages/workpolicy/WorkPolicy.jsx";
let s = fs.readFileSync(file, "utf8");
const before = s;

s = s.replace(
  'import AddPolicyModal, { CATEGORIES, DEPARTMENTS, STATUSES } from "../../components/workpolicy/AddPolicyModal";',
  'import { CATEGORIES, DEPARTMENTS, STATUSES } from "../../components/workpolicy/AddPolicyModal";',
);
s = s.replace(
  'import { ScrollText, FileText, FilePen, SearchCheck, Archive, Plus, Filter } from "lucide-react";',
  'import { ScrollText, FileText, FilePen, SearchCheck, Archive, Filter } from "lucide-react";',
);
s = s.replace(/  const \[modal, setModal\] = useState\(\{ open: false, policy: null \}\);\r?\n/, "");
s = s.replace(/  const handleDelete = async \(id\) => \{[\s\S]*?\n  \};\r?\n\r?\n/, "");
s = s.replace(
  /        <PolicyTable\s+rows=\{rows\}\s+loading=\{loading\}\s+onRefresh=\{fetchPolicies\}\s+onDelete=\{handleDelete\}\s+onEdit=\{\(p\) => setModal\(\{ open: true, policy: p \}\)\}\s+\/>/,
  "        <PolicyTable rows={rows} loading={loading} onRefresh={fetchPolicies} readOnly />",
);
s = s.replace(/\r?\n        <AddPolicyModal[\s\S]*?\/>\r?\n/, "\n");

if (s === before) throw new Error("no changes applied");
fs.writeFileSync(file, s, "utf8");
const leftovers = ["AddPolicyModal\n", "setModal", "handleDelete", "Plus,"].filter((k) => s.includes(k));
console.log("done; leftovers:", leftovers.length ? leftovers : "none");
