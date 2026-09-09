import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(fileURLToPath(new URL("../../", import.meta.url)));
const p = path.join(root, "Sales/src/pages/work/MyEOD.jsx");
const raw = fs.readFileSync(p, "utf8");
const crlf = raw.includes("\r\n");
let s = raw.replace(/\r\n/g, "\n");
const once = (from, to, label) => {
  const n = s.split(from).length - 1;
  if (n !== 1) throw new Error(`${label}: expected 1, got ${n}`);
  s = s.replace(from, to);
};

once(
  `          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/60 bg-white/95 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-200">
                  <FileText size={17} aria-hidden="true" />`,
  `          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/60 bg-white/95 shadow-2xl backdrop-blur-xl">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-200">
                  <FileText size={17} aria-hidden="true" />`,
  "modal shell",
);

once(
  `                    placeholder={\`Enter \${label.toLowerCase()}...\`}
                  />
                </div>
              ))}

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">`,
  `                    placeholder={\`Enter \${label.toLowerCase()}...\`}
                  />
                </div>
              ))}
              </div>

              <div className="flex shrink-0 justify-end gap-3 border-t border-slate-100 bg-white/95 px-6 py-4 shadow-[0_-8px_24px_-12px_rgba(15,23,42,0.15)]">`,
  "footer",
);

fs.writeFileSync(p, crlf ? s.replace(/\n/g, "\r\n") : s, "utf8");
console.log("MyEOD patched");
