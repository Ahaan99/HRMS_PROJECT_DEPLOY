import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

const OUT = path.resolve(process.cwd(), "..", "HRMS_Project_Report.pdf");
const doc = new PDFDocument({ size: "A4", margins: { top: 56, bottom: 56, left: 52, right: 52 } });
doc.pipe(fs.createWriteStream(OUT));

const W = doc.page.width;
const CW = W - 104;
const INK = "#1a1a2e";
const MUT = "#5c5c70";
const ACC = "#4338ca";
const OK = "#047857";
const NEW = "#b45309";
const RED = "#9f1239";
const LINE = "#d4d4dd";

/* ---------- helpers ---------- */
const hr = () => {
  doc.moveDown(0.4);
  doc.moveTo(52, doc.y).lineTo(W - 52, doc.y).lineWidth(0.7).strokeColor(LINE).stroke();
  doc.moveDown(0.5);
};
const ensure = (h) => { if (doc.y + h > doc.page.height - 60) doc.addPage(); };
const h1 = (t) => { ensure(70); doc.font("Helvetica-Bold").fontSize(17).fillColor(ACC).text(t, 52); hr(); };
const h2 = (t) => { ensure(55); doc.moveDown(0.45); doc.font("Helvetica-Bold").fontSize(12).fillColor(INK).text(t, 52); doc.moveDown(0.25); };
const h3 = (t) => { ensure(40); doc.moveDown(0.3); doc.font("Helvetica-Bold").fontSize(10).fillColor("#37376b").text(t, 52); doc.moveDown(0.15); };
const p = (t) => { ensure(30); doc.font("Helvetica").fontSize(9.5).fillColor(MUT).text(t, 52, doc.y, { lineGap: 2.5, width: CW }); doc.moveDown(0.3); };

const bullet = (label, desc, color = OK) => {
  ensure(30);
  const y = doc.y + 4;
  doc.circle(58, y, 2).fillColor(color).fill();
  doc.font("Helvetica-Bold").fontSize(9.3).fillColor(INK).text(label + (desc ? ": " : ""), 68, doc.y, { continued: !!desc, width: CW - 16 });
  if (desc) doc.font("Helvetica").fillColor(MUT).text(desc);
  doc.x = 52;
  doc.moveDown(0.18);
};

const tag = (txt, color) => {
  ensure(30);
  const w = doc.widthOfString(txt, { font: "Helvetica-Bold", size: 7.5 }) + 12;
  const x = 52, y = doc.y;
  doc.roundedRect(x, y, w, 13, 6.5).fillColor(color).fill();
  doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#ffffff").text(txt, x + 6, y + 3.2, { lineBreak: false });
  doc.y = y + 18;
  doc.x = 52;
};

const kv = (k, v) => {
  ensure(24);
  doc.font("Helvetica-Bold").fontSize(9).fillColor(INK).text(k, 60, doc.y, { continued: true, width: CW - 16 });
  doc.font("Helvetica").fillColor(MUT).text("  —  " + v);
  doc.x = 52;
  doc.moveDown(0.12);
};

const flow = (title, steps) => {
  const boxH = 30, gap = 22, bw = 330;
  ensure(Math.min(steps.length * (boxH + gap) + 40, 620));
  doc.moveDown(0.3);
  doc.font("Helvetica-Bold").fontSize(10).fillColor(INK).text(title, 52, doc.y);
  doc.moveDown(0.5);
  const x = (W - bw) / 2;
  steps.forEach((s, i) => {
    ensure(boxH + gap + 10);
    const y = doc.y;
    const isDecision = s.startsWith("?");
    const label = isDecision ? s.slice(1) : s;
    doc.roundedRect(x, y, bw, boxH, isDecision ? 15 : 6)
      .lineWidth(1.1)
      .fillAndStroke(isDecision ? "#fef3c7" : i === 0 ? "#e0e7ff" : i === steps.length - 1 ? "#d1fae5" : "#f4f4f8", "#9a9ab0");
    doc.font(isDecision ? "Helvetica-Oblique" : "Helvetica").fontSize(8.6).fillColor(INK)
      .text(label, x + 10, y + (label.length > 64 ? 6 : 10.5), { width: bw - 20, align: "center", lineGap: 0 });
    doc.y = y + boxH;
    if (i < steps.length - 1) {
      const cx = x + bw / 2;
      doc.moveTo(cx, doc.y + 3).lineTo(cx, doc.y + gap - 6).lineWidth(1.1).strokeColor("#9a9ab0").stroke();
      doc.moveTo(cx - 4, doc.y + gap - 9).lineTo(cx, doc.y + gap - 3).lineTo(cx + 4, doc.y + gap - 9).lineWidth(1.1).strokeColor("#9a9ab0").stroke();
      doc.y += gap;
    }
    doc.x = 52;
  });
  doc.moveDown(0.8);
};

/* ================= COVER ================= */
doc.rect(0, 0, W, doc.page.height).fillColor("#111132").fill();
doc.font("Helvetica-Bold").fontSize(30).fillColor("#ffffff").text("HRMS Platform", 52, 230);
doc.fontSize(30).fillColor("#8b8bf5").text("Project Report", 52);
doc.moveDown(1);
doc.font("Helvetica").fontSize(12).fillColor("#c9c9e8").text("Complete feature inventory, module documentation, implementation status, and system flow diagrams", 52, doc.y, { width: 420 });

/* ================= 1. OVERVIEW ================= */
doc.addPage();
h1("1. Project Overview");
p("The HRMS platform is a multi-portal Human Resource Management System. It consists of five independent React (Vite) frontend applications served by a single Node.js / Express backend and one MySQL database (hrms_db, 126 tables). Each portal is a standalone single-page application with its own login, routing, and role-appropriate feature set, while all portals share the same REST API layer and authentication conventions (JWT bearer tokens).");
h2("1.1 The Five Portals");
kv("Superadmin / Admin Portal", "Master control of the whole platform: company management, finance, payroll, exit management, document generation, web-form inbox, AI tools, analytics, security and user administration.");
kv("HR Portal", "Day-to-day HR operations: recruitment, interview management, new joinings, lead handling, chat, work assignment, EOD reporting, complaints, attendance.");
kv("Client Portal", "For client companies: dual login (client admin and client employee), employee management, payroll, invoices, finance suite, audit logs, asset and inventory management, field sales oversight.");
kv("Employee Portal (ESS)", "Employee self-service: personal dashboard, work assignments, EOD submission, leave application, targets, performance, and chat.");
kv("Sales Portal", "Sales team operations: sales reports, call logging, field sales with geo-tagging, invoices, leads, clients, services, inventory, targets and EOD.");
h2("1.2 Technology Stack");
kv("Frontend", "React 18 with Vite, Tailwind CSS utility styling, lucide-react icons, axios for API calls, react-router-dom for routing. Five separate apps: admin, HR, client, employee, Sales.");
kv("Backend", "Node.js with Express, modular architecture (24 feature modules under backen/modules), JWT authentication, pdfkit and pdf-lib for PDF generation and stamping, nodemailer for email.");
kv("Database", "MySQL (hrms_db) with 126 tables accessed through parameterized queries (mysql2 connection pool). No ORM.");
kv("File storage", "Local uploads directory: generated documents (uploads/documents), drawn signatures (uploads/signatures), SOP files, profile assets.");

/* ================= 2. BACKEND MODULES ================= */
doc.addPage();
h1("2. Backend Modules (24)");
p("Every module lives under backen/modules/<name> with its own routes, controller, and (where needed) services. All routes are mounted under /api. The modules are:");
h3("Core HR & People");
kv("employee", "Employee CRUD, profiles, department mapping, activation status, ESS endpoints, employee auth (password login).");
kv("hr", "HR portal backbone: recruitment pipeline, interviews, new joinings, leads, calling details, work assignment, EOD reports, HR auth.");
kv("leave", "Leave application and approval workflow, leave types, balances, holiday calendar, comp-off handling, leave-to-payroll deduction.");
kv("geoAttendance", "Geo-tagged check-in/check-out, geo-fencing with fence-violation alerts, attendance tracker feeds, automated attendance rules.");
kv("onboarding", "Client onboarding: proposals, detail submission, agreement generation and acceptance.");
kv("birthday", "Birthday and anniversary reminders surfaced on dashboards and via notifications.");
h3("Business & Finance");
kv("client", "Client company management, client auth (admin + employee logins), master-control feature flags per client, client dashboards.");
kv("sales", "Sales auth (department-guarded), sales reports, sales calls, field sales geo capture, leads, clients, services, inventory, invoices.");
kv("analytics", "Employee, attrition, recruitment, revenue, attendance and department analytics powering dashboard charts and data-analytics pages.");
kv("benefits", "Benefits & upskilling: insurance records, reimbursements, incentives, training programs, skill matrix.");
kv("compliance", "PF / ESIC reminders, compliance checklists, audit logs, alerting.");
h3("Documents, Forms & Communication");
kv("documents", "HR letter generator (offer, appointment, experience, relieving) with auto-fill from employee records, PDF output via pdfkit, e-signature embedding, signing of existing PDFs via pdf-lib, email dispatch, document register.");
kv("webForms", "Public website-to-HRMS form API secured by API keys. Six form types: contact, job_application, enquiry, demo_request, vendor_registration, employee_new_joining. Admin inbox with convert-to-lead / convert-to-candidate actions.");
kv("chat", "Internal chat across portals (HR, employee, client, sales) with conversations and message history.");
kv("notifications", "Central notification store and delivery to portal notification centers.");
kv("complaint", "Complaint filing, tracking, resolution workflow and resolved-complaint archive.");
h3("Platform & Advanced");
kv("superAdmin", "Superadmin auth, platform-wide settings, master control, subscription plans, user administration, security settings.");
kv("otpAuth", "NEW — unified passwordless OTP login for HR, Employee, Client and Sales portals (detailed in section 6).");
kv("aiChat", "AI chatbot hub and automated chatbot endpoints.");
kv("aiRecruit", "AI recruitment: resume parsing (ATS), AI interview flows, public interview links, candidate scoring.");
kv("itdev", "IT development module: tasks, bugs, timesheets, deployments, milestones (19 endpoints).");
kv("sop", "SOP library: upload/download, versioning, acknowledgement tracking.");
kv("verification", "Verification portal: background/document verification workflows.");
kv("common", "Shared helpers: departments, lookups, export utilities used across modules.");

/* ================= 3. PORTAL PAGES ================= */
doc.addPage();
h1("3. Portal Pages In Detail");
h2("3.1 Admin / Superadmin Portal (60+ pages)");
kv("Dashboards & analytics", "Dashboard, DataAnalytics, FinanceDashboard, RevenueManagement, RevenueAdvanced, PerformanceSheet, SalesReports, WorkReportSystem.");
kv("People", "EmployeeManagement, Departments, Users, CandidateManagement, JoinedCandidates, JoiningManagement, ExitManagement, LeaveManagement, AttendanceTracker, AutomatedAttendance, GeoAttendance, LoginTimeSettings.");
kv("Recruitment & AI", "AiRecruit, PublicInterview, InterviewScheduling, OfferLetter, AIChatbot, AIChatHub, AutomatedChatbot, HRCallingDetails.");
kv("Clients & business", "ClientManagement, ClientAgreements, ClientOnboarding, ClientCandidatePolicies, ServiceManagement, SubscriptionPlans, LeadAssigner, LeadBatchDetail, MasterControl.");
kv("Finance", "AdminPayroll, ExpenseManagement, Invoices, CreateInvoice, InvoicePreview, GeneralLedger-style revenue views.");
kv("Documents & forms", "HRDocuments (letter generator + e-sign), WebFormsInbox, EmailSystem, AutomatedPolicyMail, CompanyPolicies, ManagementDiscussionPolicy, WorkPolicyTarget.");
kv("Governance", "ComplianceAudit, ComplaintList, ComplaintDetail, ResolvedComplaints, Security, Settings, SopManagement, VerificationPortal, BenefitsUpskilling, ItDevDashboard.");
h2("3.2 Client Portal (35+ pages)");
kv("Dashboards", "ClientDashboard, Overview, FinanceDashboard, FinancialReports, PerformanceTracker, EmployeePerformanceReport.");
kv("People & work", "EmployeeManagement (admin + employee variants), AttendanceTracker, WorkAssignment, WorkPolicy, WorkTarget, InterviewTracker, Payroll.");
kv("Finance suite", "GeneralLedger, TaxManagement, ExpenseManagement, RevenueManagement, PurchaseOrders, Invoices, CreateInvoice, InvoicePreview.");
kv("Operations", "AssetManagement, InventoryManagement, ServiceManagement, AuditLogs, LeadAssigner, LeadBatchDetail, FieldSales, SalesCall, SalesReports, ComplaintList/Detail, ClientChatPage.");
h2("3.3 HR Portal");
kv("Pages", "Dashboard, Attendance (geo), Leads, Chat, New Joining, Interview Management, Work Assignment, EOD Reports, Work Targets, Work Policies, Complaints, My Performance, My Targets, My Assignments, My EOD.");
h2("3.4 Employee Portal (ESS)");
kv("Pages", "Dashboard, Assignments, EOD, Leave, My Targets, Performance, Chat.");
h2("3.5 Sales Portal");
kv("Pages", "Sales Reports, Sales Calls, Field Sales (geo), Invoices, Leads, Clients, Services, Inventory, Work Targets, Assignments, Policies, Performance, EOD, Complaints, Chat.");

/* ================= 4. DATABASE ================= */
doc.addPage();
h1("4. Database Layer");
p("MySQL database hrms_db contains 126 tables. Key table families:");
bullet("People", "employees, departments, users, candidates, interviews, joinings, exits", ACC);
bullet("Attendance & leave", "attendance records, geo check-ins, geo-fences, leave applications, leave balances, holidays", ACC);
bullet("Clients & sales", "clients, client feature flags (master control), leads, lead batches, sales calls, field sales, services, inventory", ACC);
bullet("Finance", "invoices, invoice items, receipts, credit/debit notes, expenses, payroll, revenue entries, targets", ACC);
bullet("Documents & forms", "hr_documents (with signature_path, status, signed_by, signed_at), web_form_submissions, web_form_keys", ACC);
bullet("Auth & security", "portal user credentials, login_otps (NEW: otp_hash, expiry, attempts, used flags), sessions/tokens, audit logs", ACC);
bullet("Platform", "notifications, chats/messages, complaints, SOPs, compliance checklists, trainings, benefits, IT-dev tasks/bugs/timesheets", ACC);
p("All queries are parameterized (mysql2 placeholders) to prevent SQL injection. Schema changes are applied via idempotent ALTER statements.");

/* ================= 5. STATUS ================= */
doc.addPage();
h1("5. Implementation Status");
tag("PREVIOUSLY IMPLEMENTED", OK);
bullet("Role dashboards", "All 5 portals plus manager / TL / IT-dev module views");
bullet("Master Control", "Superadmin enable/disable of features per client, reflected live in the client portal");
bullet("Leave management", "Application, approval chain, holiday calendar, comp-off, balances, payroll deduction");
bullet("Geo attendance", "Geo-tagging, geo-fencing, check-in/out, fence-violation alerts, automated rules");
bullet("Compliance", "PF/ESIC reminders, checklists, audit logs, alerts");
bullet("Analytics", "Employee, attrition, recruitment, revenue, attendance, department analytics");
bullet("Benefits & upskilling", "Insurance, reimbursements, incentives, trainings, skill matrix");
bullet("Payroll sync", "Attendance-to-payroll, leave deduction, overtime, revision history");
bullet("Client onboarding", "Proposals, detail submission, agreement generation and acceptance");
bullet("Invoices", "GST template, statuses, due dates, receipts, credit/debit notes across admin, client and sales portals");
bullet("Document generator", "Offer / appointment / experience / relieving letters with auto-fill, PDF, email dispatch, register");
bullet("Web forms API", "contact, job_application, enquiry, demo_request + API-key security + admin inbox + CRM/ATS conversion");
bullet("Revenue tracker", "Daily/monthly, client-wise, collections, profitability, targets");
bullet("SOP library", "Upload/download, versioning, acknowledgement");
bullet("IT Dev module", "Tasks, bugs, timesheets, deployments, milestones (19 endpoints)");
bullet("AI features", "AI chatbot hub, automated chatbot, AI interviews with public links, ATS resume parsing");
bullet("Operations", "Exit management, asset management, complaints workflow, notification center, chat in every portal");
bullet("Exports", "CSV / Excel / PDF export on management pages");
doc.moveDown(0.4);
tag("NEWLY IMPLEMENTED (THIS PHASE)", NEW);
bullet("Passwordless OTP login", "HR, Employee, Client & Sales portals: login with email OR phone; 6-digit OTP, 5-minute expiry, rate-limited, single-use, portal-guarded (unified /api/otp-auth module + login-page toggle in all four apps)", NEW);
bullet("New web form types", "vendor_registration and employee_new_joining accepted by the public API and labelled in the admin inbox", NEW);
bullet("E-signature everywhere", "Draw-to-sign canvas (mouse + touch) in the generator; signature embedded at generation, or stamped onto already-generated PDFs (pdf-lib) with signer name + timestamp; re-signing blocked; signature images stored in uploads/signatures and path tracked in hr_documents", NEW);
bullet("Mobile bottom navigation", "App-style fixed bottom nav (4 pinned tabs + 'More' slide-up sheet, safe-area aware) in HR, Employee & Sales portals; Admin and Client verified with existing hamburger drawers", NEW);
doc.moveDown(0.4);
tag("NOT YET IMPLEMENTED", RED);
bullet("Multi-company SaaS tenancy", "Single-company database today; no tenant isolation", RED);
bullet("WhatsApp / SMS delivery", "OTP and notification SMS hooks exist, but no Twilio/WhatsApp provider is wired (dev fallback shows the OTP on screen)", RED);
bullet("Other roadmap items", "Dark mode, PWA manifest, visitor management, AI voice assistant, job-board integration, document expiry alerts, native mobile app", RED);

/* ================= 6. ARCHITECTURE FLOW ================= */
doc.addPage();
h1("6. System Architecture — How It Works");
flow("High-level request flow", [
  "User (desktop or mobile browser)",
  "React portal (Admin / HR / Client / Employee / Sales)",
  "Axios REST call with JWT bearer token",
  "Express backend  -  /api/<module> routes",
  "?Auth middleware: JWT valid & role allowed for this route?",
  "Module controller + service (business logic, validation)",
  "MySQL (hrms_db, 126 tables) via parameterized queries",
  "JSON response rendered by the portal UI",
]);
p("Each portal keeps its token in localStorage under its own key, so a user can be logged into multiple portals simultaneously without conflicts. Role checks happen on the backend per route; the frontend additionally hides navigation the role cannot use.");

/* ================= 7. OTP FLOW ================= */
doc.addPage();
h1("7. Passwordless OTP Login — How It Works");
p("A single unified module (/api/otp-auth) serves all four portals. The user enters an email OR a phone number; the backend resolves the account for that specific portal, generates a one-time code, and on successful verification issues exactly the same JWT payload that the portal's password login issues — so every downstream API call works identically.");
flow("OTP login flow (all portals)", [
  "User opens login page and taps the 'OTP Login' toggle",
  "Enters email or phone  ->  POST /api/otp-auth/request",
  "?Account exists for this portal & is active? (Sales also enforces the sales department)",
  "?Rate limit: max 3 pending OTPs per identifier per 10 min?",
  "6-digit OTP stored in login_otps (5-minute expiry)",
  "OTP delivered (SMS/email hook; dev fallback shows the code on screen)",
  "User enters the OTP  ->  POST /api/otp-auth/verify",
  "?OTP matches, not expired, < 5 wrong attempts, not already used?",
  "OTP marked used (single-use)  ->  portal-specific JWT issued",
  "Portal stores the token & redirects to its dashboard",
]);
h3("Security properties");
bullet("Single-use codes", "A verified OTP can never be replayed");
bullet("5-minute expiry", "Stale codes are rejected automatically");
bullet("Attempt cap", "Max 5 wrong entries per code, then the code is invalidated");
bullet("Request rate-limiting", "Prevents OTP flooding of a mailbox/phone");
bullet("Portal guard", "An account resolved for one portal cannot receive a token for another (verified: a non-sales employee is rejected by the Sales portal)");

/* ================= 8. E-SIGN FLOW ================= */
doc.addPage();
h1("8. E-Signature — How It Works");
p("Two signing paths are supported, both using a reusable draw-to-sign canvas component (mouse and touch, high-DPI aware, exports a PNG data URL).");
flow("Path A: sign at generation time", [
  "Admin fills the letter form and draws a signature on the pad",
  "POST /api/documents/generate with signature_data (base64 PNG)",
  "Signature saved to uploads/signatures + embedded into the PDF",
  "hr_documents row saved as status = Signed with signer + timestamp",
]);
flow("Path B: sign an already-generated letter", [
  "Admin clicks 'Sign' on any document in the register",
  "Modal: signer full name + draw-to-sign canvas",
  "POST /api/documents/:id/sign",
  "?Document not already signed? (409 Conflict if it is)",
  "pdf-lib opens the existing PDF and stamps the signature image, 'Digitally signed by <name>' and the date onto the last page",
  "Status -> Signed; signature file path stored on the record",
]);
p("Size and format are validated server-side (PNG data URL, max 2 MB). The signature image itself is kept on disk so the audit trail shows exactly what was stamped.");

/* ================= 9. WEB FORMS FLOW ================= */
doc.addPage();
h1("9. Website-to-HRMS Forms — How It Works");
p("External websites (e.g. a company marketing site) can push form submissions directly into the HRMS using an API key issued from the admin portal. Six form types are supported: contact, job_application, enquiry, demo_request, vendor_registration (new), employee_new_joining (new).");
flow("Web form pipeline", [
  "External website form  ->  POST /api/web-forms/submit + x-api-key header",
  "?API key exists, is active & form_type is allowed?",
  "Submission stored and appears instantly in the Admin Web Forms Inbox",
  "Admin triages: convert to CRM lead / ATS candidate, or mark resolved",
]);

/* ================= 10. MOBILE ================= */
h1("10. Mobile Experience — How It Works");
p("Every portal is usable on a phone. HR, Employee and Sales received an app-style bottom navigation bar; Admin and Client portals already had slide-in hamburger drawers, which were verified.");
flow("Mobile navigation behaviour", [
  "User on a phone (viewport < 768 px)",
  "Fixed bottom bar: 4 primary pages + 'More' button",
  "'More' opens a slide-up grid listing every remaining page",
  "Desktop (>= 768 px): the bar hides itself; sidebar / navbar shown instead",
]);
p("The bar respects the device safe-area inset, adds a spacer so content is never hidden behind it, and is suppressed on login pages.");

doc.end();
console.log("PDF written to " + OUT);
