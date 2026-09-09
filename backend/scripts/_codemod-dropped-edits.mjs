// One-off: re-apply edits that the MCP edit tool reported but dropped.
import fs from "node:fs";
const root = new URL("../../", import.meta.url);
const rw = (rel, fn) => {
  const url = new URL(rel, root);
  const raw = fs.readFileSync(url, "utf8");
  const crlf = raw.includes("\r\n");
  const before = raw.replace(/\r\n/g, "\n");
  const after = fn(before);
  if (after === before) throw new Error(`no change: ${rel}`);
  fs.writeFileSync(url, crlf ? after.replace(/\n/g, "\r\n") : after, "utf8");
  console.log("patched", rel);
};

// Sales CreateInvoice: client_code + error state + client-side validation
rw("Sales/src/pages/invoices/CreateInvoice.jsx", (s) => {
  if (!s.includes('client_code: "",')) {
    s = s.replace(
      `  const [form, setForm] = useState({\n    client_name: "",`,
      `  const [error, setError] = useState("");\n\n  const [form, setForm] = useState({\n    client_code: "",\n    client_name: "",`,
    );
  }
  if (!s.includes("client_code: form.client_code")) {
    s = s.replace(
      `  const handleSubmit = async () => {\n    try {\n      setLoading(true);\n      const payload = {\n        invoice_no: "INV-" + Date.now(),`,
      `  const handleSubmit = async () => {
    setError("");
    if (!form.client_name.trim()) return setError("Client name is required");
    if (!form.invoice_date) return setError("Invoice date is required");
    if (!form.description.trim()) return setError("Item description is required");
    if (Number(form.quantity) <= 0 || Number(form.rate) < 0)
      return setError("Quantity must be at least 1 and rate cannot be negative");

    try {
      setLoading(true);
      const payload = {
        invoice_no: "INV-" + Date.now(),
        client_code: form.client_code.trim() || undefined,`,
    );
  }
  return s;
});

// Client Invoices list: unique keys + "From Sales" badge
rw("client/src/pages/invoices/Invoices.jsx", (s) =>
  s
    .replace(
      `                  key={inv.id}`,
      `                  key={\`\${inv.source || "client"}-\${inv.id}\`}`,
    )
    .replace(
      `                  <td className="px-5 py-4 font-semibold text-gray-900">\n                    {inv.invoice_no}\n                  </td>`,
      `                  <td className="px-5 py-4 font-semibold text-gray-900">
                    <div className="flex items-center gap-2">
                      <span>{inv.invoice_no}</span>
                      {inv.source === "sales" && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-100 text-indigo-700">
                          From Sales
                        </span>
                      )}
                    </div>
                  </td>`,
    ),
);
