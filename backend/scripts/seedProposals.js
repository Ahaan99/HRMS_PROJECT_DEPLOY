/**
 * DUMMY DATA SEEDER — proposals (FOR TESTING ONLY)
 *
 * Usage (from the backend folder):
 *   node scripts/seedProposals.js
 *
 * Inserts 5 sample proposals covering every status so you can test:
 *  - list page + stat cards + accepted-value banner
 *  - status actions (Send / Accept / Reject / Edit / Delete)
 *  - PDF preview page
 *  - client portal view (proposals are linked to the first registered
 *    client if one exists, so log into that client account to see them)
 *
 * Safe to re-run: it deletes previous seeded rows (proposal_number LIKE 'TEST-%')
 * before inserting fresh ones. Real proposals (PRO-...) are never touched.
 */

import db from "../config/db.js";

const money = (n) => Math.round(n * 100) / 100;

const buildItems = (items) =>
  items.map((it) => ({
    service: it[0],
    description: it[1],
    qty: it[2],
    rate: it[3],
  }));

const calc = (items, discountPct, taxPct) => {
  const subtotal = money(
    items.reduce((s, it) => s + Number(it.qty) * Number(it.rate), 0),
  );
  const discount_amount = money((subtotal * discountPct) / 100);
  const taxable = subtotal - discount_amount;
  const tax_amount = money((taxable * taxPct) / 100);
  const total = money(taxable + tax_amount);
  return { subtotal, discount_amount, tax_amount, total };
};

const daysFromNow = (d) => {
  const x = new Date();
  x.setDate(x.getDate() + d);
  return x.toISOString().slice(0, 10);
};

async function main() {
  console.log("Seeding dummy proposals...");

  /* Link seeds to the first registered client (if any) so the
     client portal view can be tested too. */
  let client = null;
  try {
    const [clients] = await db.query(
      "SELECT id, client_code, name, email, company_name FROM clients ORDER BY id ASC LIMIT 1",
    );
    client = clients[0] || null;
  } catch {
    /* clients table may not exist in a bare test DB — seeds still work */
  }
  if (client) {
    console.log(
      `Linking seeds to client #${client.id} (${client.client_code || "no code"}) — log into this client's portal to see SENT/ACCEPTED/REJECTED ones.`,
    );
  } else {
    console.log("No registered clients found — seeding as manual prospects.");
  }

  /* Clean previous test rows so the script is idempotent. */
  await db.query("DELETE FROM proposals WHERE proposal_number LIKE 'TEST-%'");

  const TERMS =
    "1. This proposal is valid until the date mentioned above.\n2. Prices are exclusive of applicable taxes unless stated otherwise.\n3. Payment terms: 50% advance, 50% on delivery/completion.\n4. Any additional scope will be quoted separately.";

  const seeds = [
    {
      number: "TEST-2026-0001",
      status: "DRAFT",
      title: "Recruitment Services Proposal",
      intro:
        "Thank you for considering Recruweb. This proposal covers end-to-end recruitment for your open positions.",
      items: buildItems([
        ["IT Recruitment", "Permanent hiring - 5 positions", 5, 25000],
        ["Background Verification", "Standard BGV per candidate", 5, 1500],
      ]),
      discountPct: 5,
      taxPct: 18,
      validDays: 30,
      linked: false,
    },
    {
      number: "TEST-2026-0002",
      status: "SENT",
      title: "HRMS Annual License & Onboarding",
      intro:
        "Complete HRMS suite: attendance, payroll, leave management and employee self-service for up to 100 employees.",
      items: buildItems([
        ["HRMS License (Annual)", "Up to 100 employees", 1, 120000],
        ["Onboarding & Training", "2 sessions included", 2, 8000],
        ["Data Migration", "From spreadsheets/legacy HR", 1, 15000],
      ]),
      discountPct: 10,
      taxPct: 18,
      validDays: 15,
      linked: true,
      sentDaysAgo: 2,
    },
    {
      number: "TEST-2026-0003",
      status: "ACCEPTED",
      title: "Employee Verification Services (EVS)",
      intro:
        "Bulk employee verification package with digital certificates and QR validation.",
      items: buildItems([
        ["EVS Verification", "Per-employee verification", 50, 800],
        ["Digital Certificates", "QR-verified PDF certificates", 50, 100],
      ]),
      discountPct: 0,
      taxPct: 18,
      validDays: 20,
      linked: true,
      sentDaysAgo: 6,
      respondedDaysAgo: 3,
      responseNote: "Approved by management. Please share the invoice.",
    },
    {
      number: "TEST-2026-0004",
      status: "REJECTED",
      title: "Smart Attendance (Face Recognition) Pilot",
      intro:
        "30-day pilot of AI face-recognition attendance for one office location.",
      items: buildItems([
        ["Smart Attendance Pilot", "1 location, 30 days", 1, 45000],
        ["Setup & Calibration", "On-site camera calibration", 1, 10000],
      ]),
      discountPct: 0,
      taxPct: 18,
      validDays: 10,
      linked: true,
      sentDaysAgo: 8,
      respondedDaysAgo: 5,
      responseNote: "Budget not approved this quarter. Please re-share in Q2.",
    },
    {
      number: "TEST-2026-0005",
      status: "EXPIRED",
      title: "Payroll Outsourcing (Monthly)",
      intro:
        "Fully managed monthly payroll processing including compliance filings.",
      items: buildItems([
        ["Payroll Processing", "Per employee / month", 60, 150],
        ["Compliance Filings", "PF, ESI, PT, TDS returns", 1, 5000],
      ]),
      discountPct: 5,
      taxPct: 18,
      validDays: -3 /* already past — expired */,
      linked: false,
      sentDaysAgo: 20,
    },
  ];

  for (const s of seeds) {
    const t = calc(s.items, s.discountPct, s.taxPct);
    const linked = s.linked && client;
    const now = new Date();
    const sentAt = s.sentDaysAgo
      ? new Date(now.getTime() - s.sentDaysAgo * 864e5)
      : null;
    const respondedAt = s.respondedDaysAgo
      ? new Date(now.getTime() - s.respondedDaysAgo * 864e5)
      : null;

    await db.query(
      `INSERT INTO proposals
        (proposal_number, client_id, client_code, client_name, client_email,
         client_phone, client_company, title, intro, items,
         subtotal, discount_pct, discount_amount, tax_pct, tax_amount, total,
         currency, valid_until, terms, notes, status, response_note,
         created_by, sent_at, responded_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        s.number,
        linked ? client.id : null,
        linked ? client.client_code : null,
        linked ? client.name || "Test Client" : "Rahul Sharma (Prospect)",
        linked ? client.email : "prospect@example.com",
        "+91 98765 43210",
        linked
          ? client.company_name || "Test Client Co."
          : "Acme Industries Pvt Ltd",
        s.title,
        s.intro,
        JSON.stringify(s.items),
        t.subtotal,
        s.discountPct,
        t.discount_amount,
        s.taxPct,
        t.tax_amount,
        t.total,
        "INR",
        daysFromNow(s.validDays),
        TERMS,
        "Seeded dummy data — safe to delete.",
        s.status,
        s.responseNote || null,
        "Seed Script",
        sentAt,
        respondedAt,
      ],
    );
    console.log(`  + ${s.number}  [${s.status}]  ${s.title}  = INR ${t.total}`);
  }

  const [[{ c }]] = await db.query(
    "SELECT COUNT(*) c FROM proposals WHERE proposal_number LIKE 'TEST-%'",
  );
  console.log(`\nDone. ${c} dummy proposals inserted.`);
  console.log(
    "Open the admin portal -> Proposals to verify. To remove them later:\n  DELETE FROM proposals WHERE proposal_number LIKE 'TEST-%';",
  );
  process.exit(0);
}

main().catch((e) => {
  console.error("Seed failed:", e.message);
  console.error(
    "\nIf the error says the table doesn't exist, start the backend once first\n(the proposals module auto-creates the table on startup), then re-run this script.",
  );
  process.exit(1);
});
