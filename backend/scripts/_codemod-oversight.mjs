import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

function edit(rel, ops) {
  const p = path.join(ROOT, rel);
  const raw = fs.readFileSync(p, "utf8");
  const crlf = raw.includes("\r\n");
  let s = raw.replace(/\r\n/g, "\n");
  for (const [find, repl, count = 1] of ops) {
    const n = s.split(find).length - 1;
    if (n !== count) throw new Error(`${rel}: expected ${count} match(es) of ${JSON.stringify(find.slice(0, 80))}, found ${n}`);
    s = s.split(find).join(repl);
  }
  fs.writeFileSync(p, crlf ? s.replace(/\n/g, "\r\n") : s);
  console.log("ok", rel);
}

/* 1. backend mount */
edit("backend/app.js", [
  [
    'import superAdminClientsRoutes from "./modules/superAdmin/clients/superAdminClients.routes.js";',
    'import superAdminClientsRoutes from "./modules/superAdmin/clients/superAdminClients.routes.js";\nimport superAdminOversightRoutes from "./modules/superAdmin/oversight/oversight.routes.js";',
  ],
  [
    'app.use("/api/super-admin/clients", superAdminClientsRoutes);',
    'app.use("/api/super-admin/clients", superAdminClientsRoutes);\napp.use("/api/super-admin/oversight", superAdminOversightRoutes);',
  ],
]);

/* 2. Sales Reports: top-level view switch */
edit("admin/src/pages/dashboard/SalesReports.jsx", [
  [
    'import SalesFilters from "../../components/sales/SalesFilters";',
    'import SalesFilters from "../../components/sales/SalesFilters";\nimport SalesOversight, { OVERSIGHT_TABS } from "../../components/sales/SalesOversight";\nimport { Receipt } from "lucide-react";',
  ],
  [
    '  const [editingSale, setEditingSale] = useState(null);\n',
    '  const [editingSale, setEditingSale] = useState(null);\n  const [view, setView] = useState("subscriptions");\n',
  ],
  [
    `      <PageHeader
        title="Sales Reports"
        desc="View sales analytics and subscription revenue."
      />
`,
    `      <PageHeader
        title="Sales Reports"
        desc="Subscription revenue plus everything the Sales portal records: calls, inventory and field leads."
      />

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Sales report views">
        {[{ key: "subscriptions", label: "Subscriptions", icon: Receipt }, ...OVERSIGHT_TABS].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={view === t.key}
              onClick={() => setView(t.key)}
              className={\`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition \${
                view === t.key
                  ? "bg-gray-900 text-white shadow-md shadow-gray-900/20"
                  : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              }\`}
            >
              <Icon size={15} />
              {t.label}
            </button>
          );
        })}
      </div>

      {view !== "subscriptions" && <SalesOversight view={view} />}

      {view === "subscriptions" && (<>
`,
  ],
  [
    `      {/* MODAL */}
      <AddEditSaleModal
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
        editingSale={editingSale}
        refresh={fetchSales}
        BASE_URL={BASE_URL}
        token={token}
      />
    </div>`,
    `      {/* MODAL */}
      <AddEditSaleModal
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
        editingSale={editingSale}
        refresh={fetchSales}
        BASE_URL={BASE_URL}
        token={token}
      />
      </>)}
    </div>`,
  ],
]);

/* 3. Invoices page: Client Invoices tab */
edit("admin/src/pages/invoices/Invoices.jsx", [
  [
    'import ExportButton from "../../components/common/ExportButton";',
    'import ExportButton from "../../components/common/ExportButton";\nimport ClientInvoicesTab from "../../components/invoices/ClientInvoicesTab";',
  ],
  [
    '  const [tab, setTab] = useState("Invoices");\n',
    '  const [tab, setTab] = useState("Invoices");\n  const [clientInvoiceCount, setClientInvoiceCount] = useState(null);\n',
  ],
  [
    '        {["Invoices", "Notes"].map((t) => (',
    '        {["Invoices", "Notes", "Client Invoices"].map((t) => (',
  ],
  [
    '            {t === "Notes" ? `Credit/Debit Notes (${notes.length})` : `Invoices (${invoices.length})`}',
    '            {t === "Notes"\n              ? `Credit/Debit Notes (${notes.length})`\n              : t === "Client Invoices"\n                ? `Client Invoices${clientInvoiceCount == null ? "" : ` (${clientInvoiceCount})`}`\n                : `Invoices (${invoices.length})`}',
  ],
  [
    '      {/* INVOICES TABLE */}\n      {tab === "Invoices" && (',
    '      {tab === "Client Invoices" && <ClientInvoicesTab onCount={setClientInvoiceCount} />}\n\n      {/* INVOICES TABLE */}\n      {tab === "Invoices" && (',
  ],
]);

/* 4. Client profile drawer: operations drill-down */
edit("admin/src/components/clients/ClientProfileDrawer.jsx", [
  ['import AssignedHRMultiSelect from "./AssignedHRMultiSelect";', 'import AssignedHRMultiSelect from "./AssignedHRMultiSelect";\nimport ClientOperations from "./ClientOperations";'],
  ['            w-full max-w-xl max-h-[90vh]', '            w-full max-w-4xl max-h-[92vh]'],
  [
    '                {/* FEATURES */}',
    `                {/* OPERATIONS (read-only view of the client portal's data) */}
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3">Client Operations</h3>
                  <ClientOperations clientId={client.id} />
                </div>

                {/* FEATURES */}`,
  ],
]);
