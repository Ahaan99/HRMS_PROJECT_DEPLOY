// Employee portal: route + nav for OTP attendance, refresh button on the live MyAssignments page.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(fileURLToPath(new URL("../../", import.meta.url)));
const rw = (rel, fn) => {
  const p = path.join(root, rel);
  const raw = fs.readFileSync(p, "utf8");
  const crlf = raw.includes("\r\n");
  let s = raw.replace(/\r\n/g, "\n");
  const once = (from, to, label) => {
    const n = s.split(from).length - 1;
    if (n !== 1) throw new Error(`${rel} ${label}: expected 1, got ${n}`);
    s = s.replace(from, to);
  };
  fn(once);
  fs.writeFileSync(p, crlf ? s.replace(/\n/g, "\r\n") : s, "utf8");
  console.log("patched", rel);
};

rw("employee/src/routes/AppRoutes.jsx", (once) => {
  once(`import SOPLibrary from "../pages/sop/SOPLibrary";`, `import SOPLibrary from "../pages/sop/SOPLibrary";\nimport OtpAttendance from "../pages/attendance/OtpAttendance";`, "import");
  once(`  Wallet,\n} from "lucide-react";`, `  Wallet,\n  Fingerprint,\n} from "lucide-react";`, "icon");
  once(
    `        <Route
          path="/compensation"
          element={
            <ProtectedRoute>
              <MyCompensation />
            </ProtectedRoute>
          }
        />
      </Routes>`,
    `        <Route
          path="/compensation"
          element={
            <ProtectedRoute>
              <MyCompensation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/attendance"
          element={
            <ProtectedRoute>
              <OtpAttendance />
            </ProtectedRoute>
          }
        />
      </Routes>`,
    "route",
  );
  once(
    `          { to: "/leave", label: "Leave", icon: <CalendarDays size={20} /> },
        ]}`,
    `          { to: "/attendance", label: "Attend", icon: <Fingerprint size={20} /> },
        ]}`,
    "pinned nav",
  );
  once(
    `        moreItems={[
          { to: "/targets", label: "My Targets", icon: <Target size={18} /> },`,
    `        moreItems={[
          { to: "/leave", label: "Leave", icon: <CalendarDays size={18} /> },
          { to: "/targets", label: "My Targets", icon: <Target size={18} /> },`,
    "more nav",
  );
});

rw("employee/src/pages/work/MyAssignments.jsx", (once) => {
  once(`  Eye,\n  Calendar,\n} from "lucide-react";`, `  Eye,\n  Calendar,\n  RefreshCw,\n} from "lucide-react";`, "icon");
  once(`  const [selectedAssignment, setSelectedAssignment] = useState(null);\n  const fetchAssignments = async () => {`, `  const [selectedAssignment, setSelectedAssignment] = useState(null);\n  const [lastUpdated, setLastUpdated] = useState(null);\n  const fetchAssignments = async () => {`, "state");
  once(`      setAssignments(res.data.data || []);\n    } catch (err) {\n      console.error(err);\n      toast.error("Failed to load assignments");`, `      setAssignments(res.data.data || []);\n      setLastUpdated(new Date());\n    } catch (err) {\n      console.error(err);\n      toast.error(err.response?.data?.message || "Failed to load assignments");`, "stamp");
  once(
    `          <p className="text-sm text-gray-500">
            Track and update your assigned work
          </p>
        </div>
      </div>`,
    `          <p className="text-sm text-gray-500">
            Track and update your assigned work
            {lastUpdated ? \` - updated \${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}\` : ""}
          </p>
        </div>

        <button
          type="button"
          onClick={fetchAssignments}
          disabled={loading}
          className="ml-auto inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-60"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} aria-hidden="true" />
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>`,
    "header",
  );
});
