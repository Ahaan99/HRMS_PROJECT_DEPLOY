/**
 * HRMS - Complete Project Report (HTML -> PDF via Puppeteer)
 *   cd backend && node scripts/generate-full-report.mjs
 * Output: D:\HRMS_new\HRMS-COMPLETE-PROJECT-REPORT-2026-09-02.pdf  (+ .html)
 */
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";

const OUT_DIR = path.resolve(process.cwd(), "..", "..", "..", "..");
const BASE = "HRMS-COMPLETE-PROJECT-REPORT-2026-09-02";
const HTML_OUT = path.join(OUT_DIR, BASE + ".html");
const PDF_OUT = path.join(OUT_DIR, BASE + ".pdf");

const css = `
@page { size: A4; margin: 18mm 15mm 20mm 15mm; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body { font-family: "Segoe UI", Arial, Helvetica, sans-serif; font-size: 10.5pt; line-height: 1.5; color: #1a1f2e; }
h1, h2, h3, h4 { color: #1e2a5a; margin: 0; line-height: 1.25; break-after: avoid; }
h1 { font-size: 20pt; border-bottom: 3px solid #4534DA; padding-bottom: 6px; margin-bottom: 14px; }
h2 { font-size: 14pt; margin-top: 18px; margin-bottom: 8px; color: #2b3a8f; }
h3 { font-size: 11.5pt; margin-top: 12px; margin-bottom: 5px; }
p { margin: 0 0 8px 0; text-align: justify; }
ul, ol { margin: 0 0 8px 0; padding-left: 20px; }
li { margin-bottom: 3px; }
section.page { break-before: page; }
table { width: 100%; border-collapse: collapse; margin: 6px 0 12px 0; font-size: 9.3pt; }
th, td { border: 1px solid #c9cedd; padding: 4px 6px; vertical-align: top; text-align: left; }
th { background: #e9ebf7; color: #1e2a5a; font-weight: 600; }
tr { break-inside: avoid; }
tr:nth-child(even) td { background: #f7f8fc; }
code, .mono { font-family: Consolas, "Courier New", monospace; font-size: 9pt; background: #f1f2f8; padding: 0 3px; border-radius: 2px; }
pre { font-family: Consolas, "Courier New", monospace; font-size: 8.6pt; background: #f4f5fa; border: 1px solid #d5d9e8; border-left: 4px solid #4534DA; padding: 8px 10px; white-space: pre; overflow: hidden; margin: 6px 0 12px 0; line-height: 1.35; break-inside: avoid; }
.box { border: 1px solid #c9cedd; border-left: 4px solid #4534DA; background: #f7f8fc; padding: 8px 12px; margin: 8px 0 12px 0; break-inside: avoid; }
.warn { border-left-color: #d97706; background: #fff8ec; }
.ok { border-left-color: #16a34a; background: #f0fdf4; }
.small { font-size: 9pt; color: #4b5270; }
.cover { height: 250mm; display: flex; flex-direction: column; justify-content: space-between; }
.cover .top { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #4534DA; padding-bottom: 10px; }
.cover .brand { color: #1e2a5a; font-weight: 700; letter-spacing: 3px; font-size: 10.5pt; }
.cover .doctype { color: #4534DA; font-weight: 600; letter-spacing: 2px; font-size: 8.5pt; text-transform: uppercase; }
.cover .middle { text-align: center; padding: 0 10mm; }
.cover .eyebrow { color: #4534DA; font-weight: 600; letter-spacing: 3px; font-size: 9.5pt; text-transform: uppercase; margin-bottom: 14px; }
.cover h1 { border: none; font-size: 30pt; color: #1e2a5a; margin: 0; line-height: 1.2; }
.cover .rule { width: 60mm; height: 3px; background: linear-gradient(90deg,#4534DA,#7c6cf0); margin: 18px auto; }
.cover .sub { font-size: 12.5pt; color: #2b3a8f; line-height: 1.5; max-width: 140mm; margin: 0 auto; }
.cover .bottom { }
.cover .info { border-top: 1px solid #c9cedd; border-bottom: 1px solid #c9cedd; padding: 12px 0; margin-bottom: 14px; }
.cover .info table { border: none; margin: 0; width: 100%; font-size: 10pt; }
.cover .info td { border: none; padding: 4px 0; vertical-align: top; background: none; }
.cover .info td.l { width: 34mm; color: #4b5270; font-weight: 600; text-transform: uppercase; font-size: 8.5pt; letter-spacing: 1px; padding-top: 6px; }
.cover .info td.v { color: #1a1f2e; }
.cover .info td.gap { width: 10mm; }
.cover .abstract { font-size: 9.5pt; color: #4b5270; text-align: justify; margin: 0 0 14px 0; }
.cover .bar { height: 6px; background: linear-gradient(90deg,#4534DA,#7c6cf0); }
.toc td { border: none; border-bottom: 1px dotted #c9cedd; padding: 3px 4px; }
.toc td.n { width: 28px; color: #4534DA; font-weight: 600; }
.grid2 { display: flex; gap: 12px; }
.grid2 > div { flex: 1; }
.tag { display: inline-block; background: #e9ebf7; color: #1e2a5a; border-radius: 3px; padding: 0 6px; font-size: 8.5pt; margin-right: 3px; }
.flow { font-family: Consolas, "Courier New", monospace; font-size: 8.8pt; background: #fbfbfe; border: 1px dashed #9aa3c7; padding: 8px 10px; margin: 6px 0 12px 0; white-space: pre; break-inside: avoid; line-height: 1.4; }
`;

const S = [];
const add = (h) => S.push(h);

/* ============================ COVER ============================ */
add(`
<div class="cover">
  <div class="top">
    <div class="brand">ARDHNARISHWAR HRMS &nbsp;|&nbsp; RECRUWEB</div>
    <div class="doctype">Technical Project Report</div>
  </div>
  <div class="middle">
    <div class="eyebrow">Human Resource Management System</div>
    <h1>HRMS Platform<br/>Complete Project Report</h1>
    <div class="rule"></div>
    <div class="sub">Unified Node.js Backend &middot; Eight Portals &middot; Integrated AI Interview, Smart Attendance and Employee Verification Services</div>
  </div>
  <div class="bottom">
    <div class="info">
      <table>
        <tr>
          <td class="l">Prepared for</td><td class="v">Recruweb &mdash; Ardhnarishwar HRMS</td>
        </tr>
        <tr>
          <td class="l">Prepared by</td><td class="v">Phabindra Kumar Sah</td>
        </tr>
        <tr>
          <td class="l">Report date</td><td class="v">2 September 2026</td>
        </tr>
      </table>
    </div>
    <p class="abstract">This report documents the complete state of the HRMS platform: system architecture, project structure, every module and portal, all changes implemented, how each component works, how data flows between portals through the unified backend, verification results and the production deployment procedure.</p>
    <div class="bar"></div>
  </div>
</div>`);

/* ============================ TOC ============================ */
const toc = [
  "Executive Summary",
  "Project Overview and Objectives",
  "Technology Stack",
  "System Architecture - Before and After Unification",
  "Project Structure (Directory Tree)",
  "Backend - Modules, Middleware and Request Pipeline",
  "Frontend Portals - Pages, Roles and Domains",
  "Merged Module 1 - Employee Verification System (EVS)",
  "Merged Module 2 - HR Robo (AI Interview Platform)",
  "Merged Module 3 - Smart Attendance",
  "Database Design",
  "Authentication and Security Model",
  "Data Flow - How Information Moves Through the One Backend",
  "Complete Change Log - What Was Done",
  "Bugs Found and Fixed",
  "Testing and Verification Results",
  "Environment Variables Reference",
  "Migration and Utility Scripts",
  "Production Deployment Guide (Hostinger)",
  "Known Limitations and Pending Actions",
  "Appendix A - API Route Reference (Merged Modules)",
  "Appendix B - Package Contents",
  "Appendix C - Glossary",
];
add(`<section class="page"><h1>Table of Contents</h1><table class="toc">${toc
  .map((t, i) => `<tr><td class="n">${i + 1}</td><td>${t}</td></tr>`)
  .join("")}</table>
<div class="box small">Conventions: <code>monospace</code> text denotes file paths, table names, routes, environment keys or commands. Paths are relative to the source tree <code>HRMS Merging/</code> unless stated otherwise.</div></section>`);

/* ============================ 1 EXEC SUMMARY ============================ */
add(`<section class="page"><h1>1. Executive Summary</h1>
<p>The HRMS platform is a multi-portal Human Resource Management System built for Recruweb. Until August 2026 it consisted of one Node.js/Express backend powering six React portals, plus three independent Python services (Employee Verification System on FastAPI :8000, HR Robo AI interview on FastAPI :8001, Smart Attendance on Flask :5050), each with its own database, login and deployment footprint.</p>
<p>Between 27 August and 2 September 2026 the project was hardened and consolidated. The three Python services were re-implemented as native Express modules inside the same backend, their data migrated into the single <code>hrms_db</code> database, and their frontends re-pointed to the unified API. The result is <b>one Node.js process, one database, one JWT secret and one pm2 service</b> serving every portal and every feature.</p>
<h2>Key outcomes</h2>
<table>
<tr><th>Area</th><th>Before</th><th>After (2 Sep 2026)</th></tr>
<tr><td>Backend processes</td><td>4 (Node + 3 Python)</td><td>1 (Node only)</td></tr>
<tr><td>Databases</td><td>4 (hrms_db, employee_verification, hr_robo_db/SQLite+JSON, smart_attendance)</td><td>1 (hrms_db, tables prefixed evs_, robo_, attendance_)</td></tr>
<tr><td>Runtime dependencies</td><td>Node + Python 3 + dlib/face_recognition + Groq SDK + waitress</td><td>Node 18+ only</td></tr>
<tr><td>Face recognition</td><td>Server-side dlib (heavy native build)</td><td>Browser-side face-api.js; server compares 128-d vectors</td></tr>
<tr><td>Logins</td><td>Separate credentials per service</td><td>HRMS Super Admin / HR credentials accepted everywhere; legacy logins still work</td></tr>
<tr><td>Cross-service sync</td><td>HTTP calls with shared keys (SMART_ATTENDANCE_KEY, HRMS_SYNC_KEY)</td><td>Direct SQL in the same database - no keys, no network hop</td></tr>
<tr><td>Deploy package</td><td>Backend 45.7 MB incl. Python folders</td><td>Full package 16.1 MB: backend + 7 built portals + interview UI</td></tr>
<tr><td>Verification</td><td>Manual</td><td>boot-check PASS (151 mounts), Smart Attendance 34/34, HR Robo + EVS smoke green, 0 localhost leaks in builds</td></tr>
</table>
<h2>Bugs fixed in this period</h2>
<ul>
<li>Blank-screen crash on corrupt localStorage in 4 portals (safe auth init).</li>
<li>EVS SSO exposed shared key in URL - replaced with HMAC-SHA256 signed URL minted server-side.</li>
<li>EVS login hard-coded role "Admin" - real role now returned.</li>
<li>Unauthenticated HR Robo <code>/sync</code> and 2 unguarded backend routes - protected.</li>
<li>IT portal login impossible for IT-department employees (SQL filtered <code>dep.name='HR'</code>) - dedicated IT auth.</li>
<li>IT and HR portals shared localStorage keys - namespaced.</li>
<li>Smart Attendance OTP printed to console and stored in-memory - gated by <code>OTP_DEBUG</code> and stored in DB.</li>
<li>HR Robo JSON double-parse on <code>synced_at</code> after migration.</li>
<li>HR Robo UI broken under new mount (15 absolute paths) - relative paths + runtime base detection.</li>
<li>Collation mismatch blocking attendance to HRMS sync - 18 tables converted to utf8mb4_unicode_ci.</li>
<li>Admin "Open Portal" for AI Interviews pointed to EVS domain - new <code>VITE_AI_ROBO_APP_URL</code>.</li>
<li>Client build baked in a retired backend domain - rebuilt with the correct API base.</li>
</ul>
</section>`);

/* ============================ 2 OVERVIEW ============================ */
add(`<section class="page"><h1>2. Project Overview and Objectives</h1>
<h2>2.1 What the platform does</h2>
<p>HRMS covers the complete employee and client lifecycle for a staffing / HR-technology business: organisation structure, recruitment and ATS scoring, interviews (human and AI-conducted), onboarding and joining, document generation and e-signature, attendance (geo, WiFi, OTP and face), leave, payroll, salary approvals, compensation, overtime, finance and invoicing, commercial proposals, client operations, IT operations, sales operations, employee verification (Aadhaar/PAN/documents/background), compliance and SOPs, complaints, notifications and real-time chat.</p>
<h2>2.2 Portals (user-facing applications)</h2>
<table>
<tr><th>Portal</th><th>Primary users</th><th>Production domain</th><th>Source folder</th></tr>
<tr><td>Super Admin</td><td>Platform owner</td><td>admin-hrms.recruweb.com</td><td><code>admin/</code></td></tr>
<tr><td>Client</td><td>Client admins and client employees (tenants)</td><td>client-hrms.recruweb.com</td><td><code>client/</code></td></tr>
<tr><td>HR</td><td>HR department staff</td><td>hr-hrms.recruweb.com</td><td><code>HR/</code></td></tr>
<tr><td>IT</td><td>IT department staff</td><td>it-hrms.recruweb.com</td><td><code>IT/</code></td></tr>
<tr><td>Sales</td><td>Sales department staff</td><td>sales-hrms.recruweb.com</td><td><code>Sales/</code></td></tr>
<tr><td>Employee</td><td>All employees (self-service)</td><td>employee-hrms.recruweb.com</td><td><code>employee/</code></td></tr>
<tr><td>EVS (Employee Verification)</td><td>Super Admin, HR, Client admins</td><td>evs-hrms.recruweb.com</td><td><code>employee-verification-system/frontend/frontend/</code></td></tr>
<tr><td>HR AI Interview (HR Robo UI)</td><td>Candidates, HR, Super Admin</td><td>hr-ai-interview-hrms.recruweb.com (also served at backend <code>/api/hr-robo/</code>)</td><td><code>backend/modules/hrRobo/ui/</code></td></tr>
<tr><td>Smart Attendance (pages)</td><td>Attendance admin, employees</td><td>backend-hrms.recruweb.com/api/smart-attendance/</td><td><code>backend/modules/attendance/ui/</code></td></tr>
</table>
<h2>2.3 Objectives of the August-September 2026 work</h2>
<ol>
<li>Remove every production bug discovered in the audit (security, auth, UI crashes).</li>
<li>Eliminate the Python runtime from production - a single Node process is simpler to host on Hostinger, cheaper, and has one point of monitoring.</li>
<li>Use a single database so that portals share data directly (attendance appears in Super Admin, interview reports appear in HR, verification status appears in Admin) without HTTP bridges or shared keys.</li>
<li>Single sign-on semantics: HRMS credentials work in the merged modules.</li>
<li>Produce a verified, ready-to-upload production package with all portals built against production domains.</li>
</ol>
<h2>2.4 Constraints respected</h2>
<ul>
<li>The <code>HRMS Recruweb deploy/</code> folder and its zip were never read or modified (owner instruction).</li>
<li>All existing URLs, screens and JSON shapes of the Python services were preserved so their HTML pages needed only a base-path prefix.</li>
<li>Legacy data was copied, never deleted - the old databases remain on MySQL as backups.</li>
<li>No secrets are stored in this report or in the package (<code>.env</code> is excluded; <code>.env.production</code> is a template).</li>
</ul>
</section>`);

/* ============================ 3 TECH STACK ============================ */
add(`<section class="page"><h1>3. Technology Stack</h1>
<table>
<tr><th>Layer</th><th>Technology</th><th>Notes</th></tr>
<tr><td>Runtime</td><td>Node.js 18+ (tested on 24.13), ESM modules ("type": "module")</td><td>Single process; pm2 in production, nodemon in development</td></tr>
<tr><td>Web framework</td><td>Express 5</td><td>~151 route mounts under <code>/api</code>; static hosting of uploads and module UIs</td></tr>
<tr><td>Real-time</td><td>Socket.IO</td><td>Chat rooms (joinRoom / sendMessage / receiveMessage)</td></tr>
<tr><td>Database</td><td>MySQL 8 via mysql2/promise pool (limit 10, <code>dateStrings: true</code>)</td><td>One database <code>hrms_db</code>, 160+ tables, auto-created and seeded on first start</td></tr>
<tr><td>Auth</td><td>jsonwebtoken (JWT Bearer), bcrypt / bcryptjs</td><td>Session revocation via <code>user_sessions.jti</code>; per-portal token families</td></tr>
<tr><td>Files</td><td>multer uploads; pdfkit, pdf-lib, pdf-parse; docx, mammoth; xlsx; qrcode; puppeteer</td><td>Letters, agreements, SOP PDFs, reports</td></tr>
<tr><td>Messaging</td><td>Twilio (OTP SMS), nodemailer (email)</td><td>Optional - features degrade gracefully</td></tr>
<tr><td>AI</td><td>Groq API via fetch (LLM chat + Whisper STT), msedge-tts (neural TTS), Ollama (chatbot, optional)</td><td>HR Robo interview engine now inside Node</td></tr>
<tr><td>Face recognition</td><td>face-api.js 0.22 in the browser (SSD MobileNet v1, 68-landmarks, FaceRecognitionNet)</td><td>Models vendored under <code>modules/attendance/ui/vendor/</code>; server compares 128-d descriptors (Euclidean &le; 0.55)</td></tr>
<tr><td>Frontends</td><td>React 18/19, Vite 5-7, Tailwind CSS (v3/v4), react-router-dom 6/7, axios, recharts, lucide-react, socket.io-client, jspdf, html2canvas</td><td>7 SPAs built to <code>dist/</code> with SPA <code>.htaccess</code></td></tr>
<tr><td>Interview UI</td><td>Plain HTML/CSS/JS (no build) with <code>config.js</code> base detection</td><td>Works both standalone on its subdomain and served from the backend</td></tr>
<tr><td>Hosting</td><td>Hostinger: Node.js app for the backend, static <code>public_html</code> per portal subdomain, HTTPS via Hostinger SSL</td><td>HTTPS is mandatory for camera and GPS APIs</td></tr>
</table>
<h2>3.1 Removed from the stack</h2>
<p>Python 3, FastAPI, Flask, waitress, uvicorn, PyMySQL, SQLAlchemy, SQLite, MongoDB, dlib, face_recognition, OpenCV, the Groq Python SDK and edge-tts Python package are no longer needed anywhere in production. The corresponding folders (<code>HR_robo/</code>, <code>smart-Attendance-main/</code>, <code>employee-verification-system/employee-verification-backend/</code>) remain in the source tree only as historical reference and are excluded from the deployment package.</p>
</section>`);

/* ============================ 4 ARCHITECTURE ============================ */
add(`<section class="page"><h1>4. System Architecture - Before and After Unification</h1>
<h2>4.1 Before (up to 27 August 2026)</h2>
<div class="flow">Browsers (8 portals)
   |                 |                    |                       |
   v                 v                    v                       v
Node backend :5000   EVS FastAPI :8000    HR Robo FastAPI :8001   Smart Attendance Flask :5050
   |                 |                    |                       |
hrms_db (MySQL)   employee_verification  hr_robo_db (MySQL) +    smart_attendance (MySQL)
                  (MySQL)                 JSON files + SQLite     dlib encodings

Bridges: Node gateway proxy (/api/evs, /api/hr-robo, /api/smart-attendance -> Python ports)
         EVS  hrms_sync.py  -> reads hrms_db employees over PyMySQL
         Attendance -> POST /api/integration/attendance with SMART_ATTENDANCE_KEY
         HR Robo /sync <- hrms_sync.js with HRMS_SYNC_KEY</div>
<h2>4.2 After (2 September 2026)</h2>
<div class="flow">Browsers: admin | client | hr | it | sales | employee | evs | hr-ai-interview | attendance pages
                                   |
                                   v  HTTPS  (CORS allow-list from CORS_ORIGINS + *.recruweb.com)
                    +---------------------------------------------+
                    |   Node.js / Express  -  server.js -> app.js  |  one pm2 process, port 5000
                    |---------------------------------------------|
                    |  /api/super-admin/*  /api/client/*  /api/hr/* |
                    |  /api/it/*  /api/sales/*  /api/employee/*    |   40 feature modules
                    |  /api/evs/*            (modules/evs)         |
                    |  /api/hr-robo/*        (modules/hrRobo + ui) |
                    |  /api/smart-attendance/* (modules/attendance + ui + face models)
                    |  /socket.io            (chat)                |
                    |  /uploads, /api/uploads (static files)       |
                    +----------------------+----------------------+
                                           |  mysql2 pool
                                           v
                          MySQL  hrms_db  (160+ tables)
                          core HRMS tables | evs_* | robo_* | attendance_*
                          Same-DB joins: attendance_records.emp_id = employees.employeeCode
                                          evs_employees.email     = employees.email
                                          robo_snapshots          <- HR / Admin audit pages</div>
<h2>4.3 Architectural principles</h2>
<ul>
<li><b>Module isolation by prefix.</b> Each merged service owns tables with a unique prefix and a router with a unique mount path; nothing collides with the 120+ pre-existing HRMS tables.</li>
<li><b>One request pipeline.</b> <code>app.js</code> order: CORS &rarr; (gateway, now a no-op) &rarr; <code>express.json</code> &rarr; request logger &rarr; urlencoded &rarr; static uploads &rarr; routes &rarr; error middleware. Merged modules sit inside this pipeline and inherit logging and error handling.</li>
<li><b>Same-process integration.</b> Where the Python services previously called HRMS over HTTP, the Node modules now execute SQL on the shared pool - faster, transactional, and with no secret to rotate.</li>
<li><b>Frontends unchanged in shape.</b> Existing HTML pages were kept; only their fetch base was prefixed. React portals gained environment keys, not rewrites.</li>
<li><b>Build-time configuration for SPAs, run-time for plain HTML.</b> Vite bakes <code>VITE_*</code> values into bundles; the interview UI's <code>config.js</code> detects its base at runtime, so the same files work on the subdomain and under the backend.</li>
</ul>
</section>`);

/* ============================ 5 STRUCTURE ============================ */
add(`<section class="page"><h1>5. Project Structure (Directory Tree)</h1>
<h2>5.1 Source tree - <code>D:\\HRMS_new\\HRMS_new\\HRMS\\HRMS Merging\\</code></h2>
<pre>HRMS Merging/
|-- backend/                         Node.js unified backend (production: 0-hrms-backend)
|   |-- server.js                    HTTP + Socket.IO, DB init/seed with deadlock retry, schedulers
|   |-- app.js                       Express app: CORS, middleware, ~151 route mounts
|   |-- package.json                 "type":"module"; scripts: dev (nodemon), start (node)
|   |-- .env.production              Template of every env key (copy to .env on the server)
|   |-- README-DEPLOY.md             Deployment instructions for the single-process layout
|   |-- config/                      db.js (mysql2 pool), env.js, initDb.js, seedSuperAdmin.js,
|   |                                seedMasters.js, multer.js, twilio.js, branding.js
|   |-- middleware/                  auth (protect + session revocation), clientUnifiedAuth, tenant,
|   |                                checkPortalStatus, hrAuth, salesAuth, employeeAuth, audit, upload,
|   |                                feature, complaint, error
|   |-- routes/                      portalRoutes, automation/ (chatbot), testTwilio
|   |-- utils/                       jwt.js, asyncHandler.js, mailer, pdf helpers
|   |-- uploads/                     runtime files (hr-robo/video, evs/, documents ...)
|   |-- modules/                     40 feature modules (see section 6)
|   |   |-- superAdmin/  client/  hr/  it/  itdev/  sales/  employee/  common/
|   |   |-- jobBoard/  aiRecruit/  aiChat/  assistant/  analytics/  search/
|   |   |-- attendance/              Smart Attendance (Node port)  -> /api/smart-attendance
|   |   |   |-- attendance.schema.sql, attendance.controller.js, attendance.routes.js
|   |   |   \`-- ui/  login, register, admin, admin_advanced, employee, face_attendance,
|   |   |            otp_attendance, wifi_attendance (.html) + vendor/ (face-api.min.js,
|   |   |            sa-face.js, 6 model files)
|   |   |-- hrRobo/                  HR Robo AI interview (Node port)  -> /api/hr-robo
|   |   |   |-- hrRobo.schema.sql, hrRobo.controller.js, hrRobo.routes.js
|   |   |   \`-- ui/  index.html, config.js, static/ (app.js, hrms_sync.js, css)
|   |   |-- evs/                     Employee Verification (Node port)  -> /api/evs
|   |   |   \`-- evs.schema.sql, evs.routes.js, evs.controller.js, evs.auth.controller.js,
|   |   |        evs.countries.js
|   |   |-- gateway/gateway.proxy.js No-op (kept for compatibility; no Python targets remain)
|   |   |-- integration/             smartAttendance.routes.js (/api/integration legacy receiver)
|   |   |-- geoAttendance/ leave/ onboarding/ documents/ sop/ compliance/ verification/
|   |   |-- proposals/ (planCatalog.js) salary/ compensation/ overtime/ benefits/ birthday/
|   |   \`-- branches/ complaint/ docExpiry/ webForms/ visitors/ notifications/ chat/ otpAuth/
|   \`-- scripts/                     migrations, smoke tests, build + package tooling (section 18)
|-- admin/        Super Admin portal (React+Vite)   28 page groups
|-- client/       Client portal                     20 page groups
|-- HR/           HR portal                         20 page groups
|-- IT/           IT portal (clone of HR minus aiInterviews/webforms/search)
|-- Sales/        Sales portal                      16 page groups
|-- employee/     Employee portal                   9 page groups
|-- employee-verification-system/
|   |-- frontend/frontend/           EVS React portal (VITE_API_URL -> /api/evs)
|   \`-- employee-verification-backend/   RETIRED Python (reference only)
|-- HR_robo/                         RETIRED Python (reference only)
|-- smart-Attendance-main/           RETIRED Python (reference only)
|-- scripts/                         audit/check python helpers, responsive-hardening.css
\`-- README.md, PROJECT_REPORT.md, DEPLOYMENT.md, ecosystem.config.cjs</pre>
<h2>5.2 Production package - <code>D:\\HRMS_new\\HRMS-FULL-PRODUCTION-2026-09-02\\</code></h2>
<pre>HRMS-FULL-PRODUCTION-2026-09-02/
|-- 0-hrms-backend/        backend/ without node_modules, .env, dev uploads  (Node app)
|-- 1-superadmin/          admin dist + .htaccess          -> admin-hrms.recruweb.com
|-- 2-client/              client dist + .htaccess         -> client-hrms.recruweb.com
|-- 3-evs-frontend/        EVS dist + .htaccess            -> evs-hrms.recruweb.com
|-- 6-employee/            employee dist + .htaccess       -> employee-hrms.recruweb.com
|-- 7-hr/                  HR dist + .htaccess             -> hr-hrms.recruweb.com
|-- 8-it/                  IT dist + .htaccess             -> it-hrms.recruweb.com
|-- 9-sales/               Sales dist + .htaccess          -> sales-hrms.recruweb.com
|-- 11-hr-ai-interview/    interview UI (plain HTML)       -> hr-ai-interview-hrms.recruweb.com
\`-- README-DEPLOY.md
(Numbers 4, 5 and 10 - the former Python EVS backend, HR Robo and Smart Attendance folders -
 are intentionally absent: all three now live inside 0-hrms-backend.)</pre>
</section>`);

/* ============================ 6 BACKEND ============================ */
add(`<section class="page"><h1>6. Backend - Modules, Middleware and Request Pipeline</h1>
<h2>6.1 Startup sequence (<code>server.js</code>)</h2>
<ol>
<li>Load <code>.env</code>; build Express app from <code>app.js</code>; create HTTP server and Socket.IO (CORS from <code>CORS_ORIGINS</code>).</li>
<li>Install crash guards: unhandledRejection is logged; uncaughtException exits only on fatal errors.</li>
<li><code>withDeadlockRetry</code> runs <code>initDb</code> (CREATE TABLE IF NOT EXISTS for all core tables), <code>seedSuperAdmin</code> (admin@hrms.com), <code>seedMasters</code>; retries ER_LOCK_DEADLOCK up to 3 times.</li>
<li>Listen on <code>PORT</code> (5000); friendly message on EADDRINUSE; start payroll and salary-sync schedulers.</li>
<li>Socket events: <code>joinRoom(conversationId)</code>, <code>sendMessage</code> &rarr; broadcast <code>receiveMessage</code> to the room.</li>
</ol>
<h2>6.2 Request pipeline (<code>app.js</code>)</h2>
<div class="flow">request
  -> cors (credentials:true; allow-list + *.recruweb.com regex + CORS_ORIGINS + localhost dev)
  -> mountGateway(app)            (no-op since 2 Sep 2026 - kept so app.js order is unchanged)
  -> express.json()  -> request logger -> express.urlencoded()
  -> static  /uploads  /api/uploads
  -> /api/super-admin/*  ... 40 module routers (checkPortalStatus gates /api/client, /api/hr, /api/sales)
  -> /api/evs  /api/hr-robo  /api/smart-attendance   (merged modules incl. their HTML UIs)
  -> error middleware  -> 500 JSON {success:false, message}</div>
<h2>6.3 Module inventory (40)</h2>
<table>
<tr><th>Module</th><th>Mount</th><th>Purpose</th></tr>
<tr><td>superAdmin</td><td>/api/super-admin</td><td>Largest module: auth, employees, clients, departments, payroll, invoices, finance, revenue tracker, interviews, job positions, policies, targets, performance, leads, EVS SSO minting (<code>evs/evsSso.routes.js</code>), master control, portal settings</td></tr>
<tr><td>client</td><td>/api/client</td><td>Tenant portal API: admin + employee logins, features, employees, attendance, payroll, finance, invoices, sales, interviews, proposals (client side)</td></tr>
<tr><td>hr / it / itdev / sales / employee</td><td>/api/hr, /api/it, /api/itdev, /api/sales, /api/employee</td><td>Department portals; IT has its own <code>auth/itAuth.service.js</code> (added 2 Sep) issuing role <code>it</code></td></tr>
<tr><td>common</td><td>/api/common</td><td>Emergency contacts, forms, SOPs, deliverables shared by portals</td></tr>
<tr><td>jobBoard / aiRecruit</td><td>/api/job-board, /api/ai-recruit</td><td>Public job apply, resume parsing, ATS score (60 keywords + 25 experience + 10 education + 5 contact)</td></tr>
<tr><td>aiChat / assistant / routes/automation</td><td>/api/ai-chat, /api/assistant, /api/automation/chatbot</td><td>Ollama-backed chatbot with fallback replies; protected since 31 Aug</td></tr>
<tr><td>chat</td><td>/api/chat</td><td>Conversations and messages; <code>chatAccessGuard</code> on GET messages (31 Aug)</td></tr>
<tr><td>geoAttendance / leave / overtime / compensation / salary / benefits</td><td>/api/geo-attendance, /api/leave, /api/overtime, /api/compensation, /api/salary, /api/benefits</td><td>Core HR operations; all use <code>protect([...roles])</code></td></tr>
<tr><td>onboarding / documents / verification / docExpiry / compliance / sop</td><td>various</td><td>Joining flows, letter generation (pdfkit), e-sign (pdf-lib), verification documents, expiry alerts, SOP library</td></tr>
<tr><td>proposals</td><td>/api/super-admin/proposals, /api/client/proposals</td><td>Commercial proposals with plan catalogue, MRP vs offer, token/agreement/replacement terms, server-side totals</td></tr>
<tr><td>analytics / search / notifications / birthday / branches / complaint / visitors / webForms / otpAuth</td><td>various</td><td>Supporting features; otpAuth uses Twilio and issues portal-specific roles</td></tr>
<tr><td>integration</td><td>/api/integration</td><td>Legacy Smart Attendance HTTP receiver (kept for compatibility; no longer used by the Node attendance module)</td></tr>
<tr><td><b>evs</b></td><td>/api/evs</td><td>Employee Verification System (section 8)</td></tr>
<tr><td><b>hrRobo</b></td><td>/api/hr-robo</td><td>AI interview platform + served UI (section 9)</td></tr>
<tr><td><b>attendance</b></td><td>/api/smart-attendance</td><td>Smart Attendance + served pages + face models (section 10)</td></tr>
<tr><td>gateway</td><td>-</td><td><code>mountGateway()</code> returns immediately; retained so future sidecars can be re-added without touching app.js order</td></tr>
</table>
<h2>6.4 Middleware</h2>
<ul>
<li><code>protect(allowedRoles)</code> - verifies Bearer JWT, checks <code>user_sessions.jti</code> not revoked, touches last_seen, enforces role list.</li>
<li><code>clientUnifiedAuth</code> - role <code>client_admin</code> (validates <code>clients.status=ACTIVE</code>) or <code>CLIENT_EMPLOYEE</code> (validates <code>client_employees.isActive</code>); <code>tenant.middleware</code> attaches clientId (fixed 27 Aug).</li>
<li><code>checkPortalStatus("CLIENT"|"HR"|"SALES")</code> - reads <code>portal_settings.is_enabled</code> (Master Control).</li>
<li>Per-portal auth: hrAuth (accepts hr and it tokens), salesAuth, employeeAuth, clientEmployeeAuth, complaintAuth; audit, feature and upload middlewares.</li>
<li>Merged modules carry their own guards: <code>requireLogin(role)</code> (attendance), <code>requireRoboAuth</code> (HR Robo), EVS role guard - each also accepting HRMS SUPER_ADMIN/hr tokens.</li>
</ul>
</section>`);

/* ============================ 7 PORTALS ============================ */
add(`<section class="page"><h1>7. Frontend Portals - Pages, Roles and Domains</h1>
<table>
<tr><th>Portal</th><th>Token keys (localStorage)</th><th>Login endpoint</th><th>Page groups</th></tr>
<tr><td>Super Admin (<code>admin/</code>)</td><td>hrms_admin_*</td><td>/api/super-admin/auth/login</td><td>aiPlatform, aiRecruit, analytics, auth, benefits, branches, chat, complaint, compliance, dashboard, departments, documents, finance, geoAttendance, invoices, itdev, leads, masterControl, onboarding, proposals, recruitment, settings, sop, team, users, verification, visitors, webForms</td></tr>
<tr><td>Client (<code>client/</code>)</td><td>hrms_client_Token / _user / _features</td><td>/api/client/auth/login-admin, login-employee, OTP</td><td>attendance, auth, chat, complaint, employees, finance (11 pages), hrActions, interviews, invoices, leads, overview, payroll, performance, proposals, sales, search, sop, workassignment, workPolicy, workTarget; FeatureRoute gating by Master Control keys</td></tr>
<tr><td>HR (<code>HR/</code>)</td><td>hrms_hr_*</td><td>/api/hr/auth/login</td><td>aiInterviews, attendance, auth, complaint, dashboard, eodreport, InterviewManagement, it, itdashboard, joining, leads, myTargets, performance, search, sop, webforms, work, workassignment, workpolicy, worktarget</td></tr>
<tr><td>IT (<code>IT/</code>)</td><td>hrms_it_* (renamed 31 Aug)</td><td>/api/it/auth/login (added 2 Sep)</td><td>Same as HR minus aiInterviews, webforms, search</td></tr>
<tr><td>Sales (<code>Sales/</code>)</td><td>hrms_sales_*</td><td>/api/sales/auth/login</td><td>auth, calls, ChatPage, clients, complaint, eodreport, fieldsales, inventory, invoices, leads, performance, SalesReports, services, work, workpolicy, worktarget</td></tr>
<tr><td>Employee (<code>employee/</code>)</td><td>hrms_employee_*</td><td>/api/employee/auth/login</td><td>auth, ChatPage, compensation, dashboard, leave, myTargets, performance, sop, work, workassignment</td></tr>
<tr><td>EVS</td><td>EVS JWT (own key)</td><td>/api/evs/login, /api/evs/sso-login</td><td>Login, dashboard, employees, identity, documents, background, employment history, audit logs</td></tr>
<tr><td>HR AI Interview</td><td>robo token (in page)</td><td>/api/hr-robo/api/v1/auth/login</td><td>Candidate interview room, proctor control, HR sync panel</td></tr>
<tr><td>Smart Attendance pages</td><td>cookie <code>sa_token</code> (Path=/api/smart-attendance) or Bearer</td><td>/api/smart-attendance/api/login</td><td>login, register, admin, admin_advanced, employee, face, otp, wifi</td></tr>
</table>
<h2>7.1 Production environment files (all verified consistent on 2 Sep 2026)</h2>
<table>
<tr><th>Portal</th><th>Key</th><th>Value</th></tr>
<tr><td>admin, client, HR, IT, Sales, employee</td><td>VITE_API_BASE_URL</td><td>https://backend-hrms.recruweb.com/api</td></tr>
<tr><td>client</td><td>VITE_API_SOCKET_URL</td><td>https://backend-hrms.recruweb.com</td></tr>
<tr><td>admin, HR</td><td>VITE_AI_ROBO_URL</td><td>https://backend-hrms.recruweb.com/api/hr-robo (API for audit / reports)</td></tr>
<tr><td>admin, HR</td><td>VITE_AI_ROBO_APP_URL</td><td>https://hr-ai-interview-hrms.recruweb.com (Open Portal button) - added 2 Sep</td></tr>
<tr><td>admin</td><td>VITE_EVS_API_URL / VITE_EVS_PORTAL_URL</td><td>https://backend-hrms.recruweb.com/api/evs / https://evs-hrms.recruweb.com</td></tr>
<tr><td>EVS frontend</td><td>VITE_API_URL</td><td>https://backend-hrms.recruweb.com/api/evs</td></tr>
</table>
<p class="small">Because Vite bakes these values into the JavaScript bundle at build time, any change of domain requires <code>npm run build</code> and re-upload of that portal. The build script confirmed 0 occurrences of "localhost" in all 7 dist folders.</p>
<h2>7.2 Client-side safety patterns</h2>
<ul>
<li>Root error boundary in every portal: a crash shows a styled reset screen that clears that portal's localStorage keys and returns to login.</li>
<li>Auth contexts wrap <code>JSON.parse</code> of stored user objects in try/catch (fixed 31 Aug in admin, HR, IT, Sales; Employee already did).</li>
<li>Axios instances inject the Bearer token; base URL already ends in <code>/api</code>, so call paths must not repeat the prefix (doubled-prefix 404s were fixed in proposals).</li>
</ul>
</section>`);

/* ============================ 8 EVS ============================ */
add(`<section class="page"><h1>8. Merged Module 1 - Employee Verification System (EVS)</h1>
<h2>8.1 Purpose</h2>
<p>EVS tracks the verification of every employee: Aadhaar (Verhoeff-checksum validated and masked), PAN, uploaded documents, background verification and employment history, with an audit log of every decision. The Super Admin portal shows a live verification matrix; HR and client admins can work in the EVS portal itself.</p>
<h2>8.2 Before &rarr; after</h2>
<table>
<tr><th>Aspect</th><th>Python FastAPI (:8000)</th><th>Node module <code>backend/modules/evs/</code></th></tr>
<tr><td>Database</td><td><code>employee_verification</code> (8 tables)</td><td><code>hrms_db</code> tables <code>evs_users, evs_employees, evs_identity_verification, evs_documents, evs_background_verification, evs_employment_history, evs_audit_logs, evs_verification_tokens</code></td></tr>
<tr><td>Auth</td><td>Own JWT secret (EVS_JWT_SECRET), local users</td><td>Accepts Super Admin, HR and Client HRMS credentials; roles SUPER_ADMIN, hr, client_admin; legacy EVS users still accepted</td></tr>
<tr><td>SSO from Admin</td><td>Query-string key (insecure) &rarr; HMAC signed URL (31 Aug)</td><td>Same HMAC scheme: <code>sig = HMAC-SHA256(EVS_SSO_KEY, email + "." + ts)</code>, 120 s window, verified in <code>evs.auth.controller.js</code></td></tr>
<tr><td>HRMS employee sync</td><td>PyMySQL read of hrms_db + HTTP</td><td>Direct SQL upsert by email from <code>employees</code></td></tr>
<tr><td>Uploads</td><td>Local Python folder</td><td><code>backend/uploads/evs/</code> served under /api/uploads</td></tr>
<tr><td>Frontend</td><td>React (VITE_API_URL :8000)</td><td>Same React app, <code>VITE_API_URL=.../api/evs</code></td></tr>
</table>
<h2>8.3 How it works</h2>
<ol>
<li>Super Admin opens Verification &rarr; <code>EvsOverview.jsx</code> calls <code>/api/super-admin/evs/sso-url</code> (SUPER_ADMIN only); the backend mints a signed URL to <code>evs-hrms.recruweb.com/sso-login?email&amp;ts&amp;sig</code>. No key ever reaches the browser bundle.</li>
<li>EVS frontend posts the parameters to <code>/api/evs/sso-login</code>; the module recomputes the HMAC, checks the timestamp window, and issues an EVS session with the user's real role.</li>
<li><code>/api/evs/hrms-sync</code> upserts <code>evs_employees</code> from <code>employees</code> (match on email); <code>/api/evs/hrms-status</code> returns "16/16 HRMS employees synced" style counts used by the admin panel.</li>
<li>Identity, documents and background records are written to the <code>evs_*</code> tables; every status change inserts an <code>evs_audit_logs</code> row with actor, action and timestamp.</li>
<li>Overall status per employee (Fully Verified / In Progress / Action Required / Not Started) is computed server-side from the four verification dimensions and returned to both the EVS dashboard and the Admin matrix.</li>
</ol>
<h2>8.4 Migration</h2>
<p><code>node scripts/run-evs-schema.mjs</code> runs <code>evs.schema.sql</code> (CREATE TABLE IF NOT EXISTS) and, if the legacy <code>employee_verification</code> database exists, copies all 8 tables with <code>INSERT IGNORE</code>. Safe to re-run. Collation fixed to <code>utf8mb4_unicode_ci</code> on 2 Sep.</p>
<h2>8.5 Environment</h2>
<p><code>EVS_SSO_KEY</code> (must equal the value baked into the Super Admin build: <code>hrms-evs-sso-2026</code>), <code>EVS_FRONTEND_URL</code> (https://evs-hrms.recruweb.com). The old <code>EVS_SERVICE_URL</code>, <code>HRMS_SSO_KEY</code> and <code>EVS_JWT_SECRET</code> are no longer read.</p>
</section>`);

/* ============================ 9 HR ROBO ============================ */
add(`<section class="page"><h1>9. Merged Module 2 - HR Robo (AI Interview Platform)</h1>
<h2>9.1 Purpose</h2>
<p>HR Robo conducts AI-driven candidate interviews in the browser: the candidate hears questions via neural text-to-speech, answers by voice (Whisper speech-to-text), an LLM (Groq) evaluates and asks follow-ups, the camera stream is proctored (face presence, face consistency, extra speaker detection, tab/technical monitoring) and the whole session is recorded. HR sees reports, proctor logs and recordings in the HR portal (AI Interviews page); Super Admin sees integrity audit in the AI Platform page.</p>
<h2>9.2 Before &rarr; after</h2>
<table>
<tr><th>Aspect</th><th>Python FastAPI (:8001)</th><th>Node module <code>backend/modules/hrRobo/</code></th></tr>
<tr><td>Storage</td><td><code>hr_robo_db.admin_users</code> + <code>integration_store.json</code> + <code>video_storage/videos_index.json</code> + files</td><td><code>robo_snapshots</code> (key/JSON: reports, proctor_logs, candidates, schedules, config, synced_at), <code>robo_videos</code>, <code>robo_admin_users</code>, <code>robo_interview_sessions</code></td></tr>
<tr><td>LLM / STT</td><td>groq Python SDK</td><td>Native fetch to Groq REST (<code>GROQ_API_KEY</code>, <code>GROQ_CHAT_MODEL</code>); Whisper transcription via multipart fetch</td></tr>
<tr><td>TTS</td><td>edge-tts (Python)</td><td><code>msedge-tts</code> npm package - same Edge neural voices, MP3 output</td></tr>
<tr><td>Video</td><td>Python file streaming</td><td>Express Range streaming (HTTP 206, Content-Range) from <code>uploads/hr-robo/video/</code></td></tr>
<tr><td>Auth</td><td>Robo admin users only</td><td>Login order: HRMS Super Admin &rarr; HR employee &rarr; legacy robo admin; issues robo JWT with HRMS role</td></tr>
<tr><td>/sync endpoint</td><td>Required robo JWT or X-Sync-Key (31 Aug fix)</td><td>Requires robo JWT; writes snapshots directly - no HRMS_SYNC_KEY needed</td></tr>
<tr><td>UI hosting</td><td>FastAPI static</td><td>Served at <code>/api/hr-robo/</code> and as standalone folder <code>11-hr-ai-interview</code> for its own subdomain</td></tr>
</table>
<h2>9.3 How an interview flows</h2>
<div class="flow">Candidate opens hr-ai-interview-hrms.recruweb.com (or backend /api/hr-robo/)
  -> config.js sets HR_ROBO_BASE (same-origin '/api/hr-robo' if served by backend,
     else 'https://backend-hrms.recruweb.com/api/hr-robo')
  -> POST {BASE}/api/v1/auth/login   (HR starts session)          -> JWT
  -> POST {BASE}/api/v1/tts          question text -> MP3 (msedge-tts)
  -> POST {BASE}/api/v1/stt          audio blob   -> Groq Whisper -> transcript
  -> POST {BASE}/api/v1/chat         transcript   -> Groq LLM   -> next question / score
  -> proctor events accumulate client-side; at end
  -> POST {BASE}/api/videos/upload   recording -> uploads/hr-robo/video + robo_videos row
  -> POST {BASE}/api/sync            report + proctor log -> robo_snapshots (reports, proctor_logs)
HR portal AIInterviews.jsx  / Admin AIPlatformAudit.jsx
  -> GET {VITE_AI_ROBO_URL}/api/integration/summary | reports | proctor-logs   (HRMS JWT accepted)
  -> GET {VITE_AI_ROBO_URL}/api/videos/{candidateId}   (Range streaming in <video>)
  -> "Open Portal" -> VITE_AI_ROBO_APP_URL</div>
<h2>9.4 Migration</h2>
<p><code>node scripts/run-hrrobo-migrate.mjs</code>: creates the 4 tables, imports <code>integration_store.json</code> keys into <code>robo_snapshots</code>, imports <code>videos_index.json</code> into <code>robo_videos</code> copying video files, and imports <code>hr_robo_db.admin_users</code>. Result on the development machine: 6 snapshot keys, 1 recording, 1 admin user.</p>
<h2>9.5 Environment</h2>
<p><code>GROQ_API_KEY</code> (a new key is required - the old one is revoked), <code>GROQ_CHAT_MODEL</code> (optional). <code>HR_ROBO_SERVICE_URL</code> and <code>HRMS_SYNC_KEY</code> are no longer read. TTS, reports, video and login work without Groq; only LLM chat and STT need it.</p>
</section>`);

/* ============================ 10 SMART ATTENDANCE ============================ */
add(`<section class="page"><h1>10. Merged Module 3 - Smart Attendance</h1>
<h2>10.1 Purpose</h2>
<p>Smart Attendance lets employees mark attendance by face, OTP or office WiFi, always subject to a geo-fence around the office; supports check-out with hours/overtime, monthly history, correction requests with admin approval, attendance approval queues, CSV export, admin and employee account management, and synchronisation of every record into the HRMS attendance table so it appears in Super Admin reports.</p>
<h2>10.2 Before &rarr; after</h2>
<table>
<tr><th>Aspect</th><th>Python Flask (:5050)</th><th>Node module <code>backend/modules/attendance/</code></th></tr>
<tr><td>Database</td><td><code>smart_attendance</code>: users, employees, attendance, corrections, settings</td><td><code>attendance_users, attendance_employees, attendance_records, attendance_corrections, attendance_settings</code> in hrms_db</td></tr>
<tr><td>Face engine</td><td>dlib / face_recognition on the server (128-d encodings, native build)</td><td>face-api.js in the browser computes 128-d descriptors; server stores up to 5 samples per employee and matches by Euclidean distance (tolerance 0.35-0.70, default 0.55). Old encodings are incompatible &rarr; employees re-register once (<code>face_engine</code> column)</td></tr>
<tr><td>Sessions</td><td>Flask server-side session cookie</td><td>JWT in httpOnly cookie <code>sa_token</code> scoped to <code>Path=/api/smart-attendance</code>, or Authorization Bearer; 12 h expiry</td></tr>
<tr><td>Admin access</td><td>Attendance admin only</td><td>Attendance admin + HRMS SUPER_ADMIN / hr tokens act as admin</td></tr>
<tr><td>OTP</td><td>In-memory then DB (31 Aug fix); console print</td><td>DB-backed (<code>attendance_settings otp_&lt;emp&gt;</code>), 5-minute expiry, <code>otp_dev</code> only when <code>OTP_DEBUG=1</code></td></tr>
<tr><td>Passwords</td><td>sha256 hex</td><td>bcrypt; legacy sha256 verified and upgraded on first login</td></tr>
<tr><td>HRMS sync</td><td>POST to Node with SMART_ATTENDANCE_KEY</td><td>Direct upsert into <code>super_admin_attendance</code> matching <code>employees.employeeCode = emp_id</code>; per-record status synced/failed with error text; retry endpoint</td></tr>
<tr><td>WiFi check</td><td>Server subnet vs client IP</td><td>Same two-layer logic; <code>OFFICE_SUBNET</code> override; honours X-Forwarded-For behind Hostinger proxy</td></tr>
<tr><td>Pages</td><td>Jinja templates</td><td>Same 8 HTML files, fetch base prefixed; served from <code>ui/</code></td></tr>
</table>
<h2>10.3 How marking works</h2>
<div class="flow">Employee (phone, HTTPS) -> /api/smart-attendance/employee/face
  1. page loads vendor/face-api.min.js + models (ssd_mobilenetv1, landmark68, recognition)
  2. camera frame -> sa-face.js -> detectAllFaces().withFaceLandmarks().withFaceDescriptors()
  3. navigator.geolocation -> lat/lng
  4. POST api/mark-attendance {descriptors:[128 floats], lat, lng, tolerance}
Server
  5. isInOffice(lat,lng): haversine to attendance_settings.office (default OFFICE_LAT/LNG/RADIUS)
  6. load gallery attendance_employees WHERE face_engine='face-api'
  7. nearest sample distance <= tolerance -> identity; employee role may only mark themselves
  8. INSERT attendance_records (status Present/Late from shift start + grace) approval='pending'
  9. setImmediate(pushToHrms): SELECT employees WHERE employeeCode=emp_id AND isActive
     -> INSERT/UPDATE super_admin_attendance (PRESENT / LATE / HALF_DAY) -> hrms_sync='synced'
Super Admin portal -> Attendance reports read super_admin_attendance -> record visible immediately</div>
<h2>10.4 Other flows</h2>
<ul>
<li><b>OTP:</b> <code>api/otp/send</code> stores a 6-digit code; <code>api/otp/verify</code> checks code, expiry and geo-fence, then marks.</li>
<li><b>WiFi:</b> <code>api/wifi-attendance</code> passes only when client and server share the office subnet.</li>
<li><b>Check-out:</b> hours = out - in; overtime beyond <code>overtime_after_hours</code>; Half Day if below <code>half_day_hours</code>; re-syncs to HRMS.</li>
<li><b>Corrections:</b> employee submits date + times + reason; admin approves (record created/updated with audit fields <code>corrected_by/at</code>, <code>original</code> JSON) or rejects.</li>
<li><b>Approval:</b> admin bulk approves/rejects pending records; summary and CSV by day/month/year.</li>
</ul>
<h2>10.5 Migration and environment</h2>
<p><code>node scripts/run-attendance-migrate.mjs</code> creates the tables and copies users, employees (without dlib encodings), attendance, corrections and office/shift settings from <code>smart_attendance</code>. On the development machine: 6 accounts, 3 employees, 4 records, 2 corrections. Env: <code>OFFICE_LAT</code>, <code>OFFICE_LNG</code>, <code>OFFICE_RADIUS</code>, <code>OFFICE_SUBNET</code>, <code>OTP_DEBUG</code> (unset in production).</p>
</section>`);

/* ============================ 11 DATABASE ============================ */
add(`<section class="page"><h1>11. Database Design</h1>
<h2>11.1 Single database: <code>hrms_db</code></h2>
<p>All tables live in one MySQL schema. Core HRMS tables (120+) are created by <code>config/initDb.js</code> and module-level <code>ensureTable()</code> helpers on first start; merged-module tables are created by their <code>*.schema.sql</code> files through the migration scripts. All tables use <code>utf8mb4 / utf8mb4_unicode_ci</code> so cross-module joins work.</p>
<table>
<tr><th>Group</th><th>Representative tables</th></tr>
<tr><td>Organisation</td><td>users, user_sessions, employees, departments, designations, branches, clients, client_employees, portal_settings, master features</td></tr>
<tr><td>Recruitment / ATS</td><td>job_positions, applications, candidates, interviews, ats_scores, offers</td></tr>
<tr><td>Attendance / leave</td><td>super_admin_attendance, geo_attendance, geo_fences, leaves, leave_balances, overtime_requests</td></tr>
<tr><td>Payroll / finance</td><td>payroll_runs, salary_structures, salary_revisions, invoices, ledger, purchase_orders, tax, revenue_tracker</td></tr>
<tr><td>Client ops</td><td>proposals, work_assignments, work_targets, work_policies, performance, sales_reports, leads</td></tr>
<tr><td>Documents / compliance</td><td>documents, letters, verification_documents, sops, compliance_items, doc_expiry</td></tr>
<tr><td>Communication</td><td>conversations, messages, chatbot_conversations, notifications</td></tr>
<tr><td>EVS (8)</td><td>evs_users, evs_employees, evs_identity_verification, evs_documents, evs_background_verification, evs_employment_history, evs_audit_logs, evs_verification_tokens</td></tr>
<tr><td>HR Robo (4)</td><td>robo_snapshots, robo_videos, robo_admin_users, robo_interview_sessions</td></tr>
<tr><td>Smart Attendance (5)</td><td>attendance_users, attendance_employees, attendance_records, attendance_corrections, attendance_settings</td></tr>
</table>
<h2>11.2 New table definitions (merged modules)</h2>
<table>
<tr><th>Table</th><th>Columns (key ones)</th></tr>
<tr><td>attendance_users</td><td>id PK, name, mobile UNIQUE, password (bcrypt), role (admin|employee), emp_id, created</td></tr>
<tr><td>attendance_employees</td><td>id PK, emp_id UNIQUE, name, encoding LONGTEXT (JSON array of 128-d descriptors), face_engine ('face-api'|NULL), registered_at</td></tr>
<tr><td>attendance_records</td><td>id PK, emp_id, name, date, time, status, method (Face|OTP|WiFi|Correction), ip, approval, check_out, hours, overtime, lat, lng, hrms_sync, hrms_sync_error, hrms_sync_at, corrected, corrected_by, corrected_at, correction_reason, original, approved_by, approved_at; indexes on (emp_id,date), date, approval, hrms_sync</td></tr>
<tr><td>attendance_corrections</td><td>id PK, emp_id, name, date, check_in, check_out, reason, state (pending|approved|rejected), requested_at, decided_by, decided_at</td></tr>
<tr><td>attendance_settings</td><td>skey PK, data LONGTEXT JSON - keys office, shift, hrms, otp_&lt;emp_id&gt;</td></tr>
<tr><td>robo_snapshots</td><td>snap_key PK, data JSON, updated_at - keys reports, proctor_logs, candidates, schedules, config, synced_at</td></tr>
<tr><td>robo_videos</td><td>candidate_id PK, candidate_name, file, mime, duration, size, uploaded_at</td></tr>
<tr><td>robo_admin_users</td><td>id PK, name, email UNIQUE, hashed_password, role, is_active, last_login, created_at</td></tr>
<tr><td>robo_interview_sessions</td><td>id PK, candidate_id, started_at, ended_at, status, meta JSON</td></tr>
<tr><td>evs_employees</td><td>id PK, employee_code, employee_name, email UNIQUE, department, designation, status, hrms_employee_id, created_at</td></tr>
<tr><td>evs_identity_verification</td><td>id PK, employee_id FK, aadhaar_masked, aadhaar_valid, pan, pan_valid, status, verified_by, verified_at</td></tr>
<tr><td>evs_documents / evs_background_verification / evs_employment_history</td><td>employee_id FK, type/company, file path, status, verified_by, verified_at, remarks</td></tr>
<tr><td>evs_audit_logs</td><td>id PK, actor, action, entity, entity_id, details JSON, created_at</td></tr>
</table>
<h2>11.3 Cross-module relationships</h2>
<ul>
<li><code>attendance_records.emp_id</code> &harr; <code>employees.employeeCode</code> (sync into <code>super_admin_attendance.employee_id</code>).</li>
<li><code>evs_employees.email</code> &harr; <code>employees.email</code> (HRMS sync and Admin matrix).</li>
<li><code>robo_snapshots.reports[].candidate_id</code> &harr; <code>robo_videos.candidate_id</code> (recording link in HR audit table).</li>
<li>Logins in merged modules read <code>users</code> (Super Admin) and <code>employees</code> joined to <code>departments</code> (HR / IT).</li>
</ul>
</section>`);

/* ============================ 12 AUTH ============================ */
add(`<section class="page"><h1>12. Authentication and Security Model</h1>
<h2>12.1 Token families</h2>
<table>
<tr><th>Family</th><th>Issued by</th><th>Role values</th><th>Accepted by</th></tr>
<tr><td>Super Admin</td><td>/api/super-admin/auth/login</td><td>SUPER_ADMIN, MANAGER, TL</td><td>All admin routes; EVS, HR Robo, Smart Attendance (as admin)</td></tr>
<tr><td>HR / IT</td><td>/api/hr/auth/login, /api/it/auth/login</td><td>hr, it</td><td>HR and IT routes (hrAuth accepts both); EVS, HR Robo, Attendance (hr)</td></tr>
<tr><td>Sales / Employee</td><td>/api/sales/auth/login, /api/employee/auth/login</td><td>sales, employee</td><td>Their portals</td></tr>
<tr><td>Client</td><td>/api/client/auth/login-admin, login-employee, OTP</td><td>client_admin, CLIENT_EMPLOYEE</td><td>Client routes (tenant scoped by clientId); EVS (client_admin)</td></tr>
<tr><td>Attendance</td><td>/api/smart-attendance/api/login</td><td>attendance_admin, attendance_employee (claim <code>sa:true</code>)</td><td>Attendance routes only</td></tr>
<tr><td>Robo</td><td>/api/hr-robo/api/v1/auth/login</td><td>super_admin, hr, admin</td><td>HR Robo routes only</td></tr>
</table>
<p>All tokens are signed with the single <code>JWT_SECRET</code>; merged modules distinguish their own tokens by claims (<code>sa</code>, <code>robo</code>) and fall back to HRMS roles. <code>protect()</code> additionally checks the <code>user_sessions</code> table so a logout revokes the token server-side.</p>
<h2>12.2 Security controls in place</h2>
<ul>
<li>Parameterised SQL everywhere (mysql2 placeholders); IN-lists passed as arrays.</li>
<li>bcrypt password hashing; legacy sha256 (attendance) upgraded transparently on login.</li>
<li>HMAC-signed, time-boxed SSO URLs for EVS; signing key never shipped to the client bundle; production refuses to mint with the default key.</li>
<li>Role guards on every route (audit of all 36-40 modules on 31 Aug; 2 gaps fixed).</li>
<li>httpOnly, SameSite=Lax, path-scoped attendance cookie; Secure flag when behind HTTPS/X-Forwarded-Proto.</li>
<li>Employee face marking restricted to the logged-in employee's own identity ("not_you" result otherwise).</li>
<li>Geo-fence enforced server-side for face and OTP; WiFi subnet check server-side.</li>
<li>OTP debug output disabled unless <code>OTP_DEBUG=1</code>.</li>
<li>Per-portal localStorage namespaces prevent token collisions on a shared origin.</li>
<li>CORS allow-list; uploads served read-only; Range requests validated.</li>
<li>Fail-loud startup warnings for missing critical env keys (EVS_SSO_KEY, GROQ_API_KEY, JWT_SECRET).</li>
</ul>
<h2>12.3 Operator obligations</h2>
<ul>
<li>Change seed passwords (<code>admin@hrms.com / admin123</code>, manager/tl <code>123</code>, attendance admin <code>9999999999 / admin123</code>) on first login.</li>
<li>Set a long random <code>JWT_SECRET</code>; set <code>EVS_SSO_KEY=hrms-evs-sso-2026</code> (or rebuild the admin portal with a new baked value); obtain a new <code>GROQ_API_KEY</code>.</li>
<li>Serve everything over HTTPS (camera, geolocation and Secure cookies depend on it).</li>
</ul>
</section>`);

/* ============================ 13 DATA FLOW ============================ */
add(`<section class="page"><h1>13. Data Flow - How Information Moves Through the One Backend</h1>
<p>Every portal talks only to <code>https://backend-hrms.recruweb.com</code>. Because all modules share the same Express process and the same MySQL pool, data entered in one portal is available to the others immediately, without synchronisation jobs or webhooks. The flows below describe the principal paths.</p>
<h2>13.1 Login flow (any portal)</h2>
<div class="flow">Portal login form -> POST /api/&lt;portal&gt;/auth/login {email|mobile, password}
  -> controller: SELECT user/employee (+department for hr/it), bcrypt.compare
  -> INSERT user_sessions (jti) -> jwt.sign({id, role, name, jti}, JWT_SECRET, 7d)
  -> response {token, user, features}
Portal stores token in its namespace (hrms_admin_*, hrms_hr_*, hrms_it_*, ...)
Every later request: Authorization: Bearer -> protect(): verify, check jti not revoked, role in list</div>
<h2>13.2 Employee lifecycle across portals</h2>
<div class="flow">Super Admin / HR creates employee  -> employees (employeeCode, email, departmentId, isActive)
   |-> Employee portal login uses the same row (role employee)
   |-> IT / HR / Sales portal login: employees JOIN departments (UPPER(dep.name)='IT' etc.)
   |-> EVS  /api/evs/hrms-sync  -> evs_employees upsert by email  -> verification matrix in Admin
   |-> Smart Attendance: emp_id typed at registration must equal employeeCode for HRMS sync
   |-> Payroll / salary / compensation / leave modules reference employees.id
   \\-> Client tenant: client_employees rows link to clients (client_code) for the Client portal</div>
<h2>13.3 Attendance to Super Admin</h2>
<div class="flow">Phone -> /api/smart-attendance/api/mark-attendance   (face / otp / wifi)
  -> attendance_records (approval pending)  -> pushToHrms()
  -> super_admin_attendance {employee_id, employee_name, date, check_in, check_out, status}
Super Admin portal Attendance page -> GET /api/super-admin/attendance ... -> shows the same day
Check-out later -> attendance_records.check_out/hours -> pushToHrms() UPDATE check_out
Admin approves corrections -> record corrected -> pushToHrms() again (idempotent upsert on employee_id+date)
Also: geoAttendance module (portal GPS check-in) writes its own geo_attendance tables independently.</div>
<h2>13.4 AI interview to HR and Admin</h2>
<div class="flow">Interview UI -> /api/hr-robo/api/sync {reports, proctor_logs, candidates, schedules}
  -> robo_snapshots (one JSON document per key, updated_at)
  -> /api/hr-robo/api/videos/upload -> uploads/hr-robo/video/*.webm + robo_videos
HR portal AI Interviews  -> GET /api/hr-robo/api/integration/reports | proctor-logs | summary
Admin AI Platform Audit  -> same endpoints; Integrity / Outcome / Face check / Violations / Recording
Recording playback       -> GET /api/hr-robo/api/videos/:id  with Range -> 206 partial content
HR portal Interview Management (human interviews) uses /api/hr/interviews -> interviews table (separate)</div>
<h2>13.5 Verification to Admin</h2>
<div class="flow">Admin Verification page -> GET /api/evs/hrms-status  -> counts (employees, fully verified, in progress, action required, not started)
                         -> GET /api/evs/employees/matrix -> per-employee Aadhaar/PAN/Documents/Background/History/Overall
                         -> "Open Verification Portal" -> GET /api/super-admin/evs/sso-url -> signed URL -> EVS portal auto-login
EVS portal actions -> evs_* tables + evs_audit_logs -> reflected in Admin on next Refresh</div>
<h2>13.6 Proposal lifecycle (Admin &harr; Client)</h2>
<div class="flow">Admin CreateProposal -> GET /api/super-admin/proposals/catalog/plans (planCatalog.js)
  -> POST /api/super-admin/proposals {items[{mrp, rate, qty, unit}], token_amount, agreement_months, replacement_months}
  -> server computeTotals() -> proposals (DRAFT) -> status SENT
Client portal Proposals -> GET /api/client/proposals (clientMatch: client_id | client_code | email)
  -> POST /api/client/proposals/:id/respond {accept|reject, note} -> ACCEPTED / REJECTED (terminal)
expireStale() marks SENT past valid_until as EXPIRED; PDF generated client-side from the preview node.</div>
<h2>13.7 Master Control feature gating</h2>
<div class="flow">Super Admin Master Control -> portal_settings.is_enabled, client feature flags
  -> checkPortalStatus() blocks /api/client, /api/hr, /api/sales when a portal is disabled
  -> Client login returns enabledFeatures -> FeatureRoute hides/blocks pages (PAYROLL, LIVE_CHAT, ...)</div>
<h2>13.8 Real-time chat</h2>
<div class="flow">Portal socket.io-client -> joinRoom(conversationId) -> sendMessage -> server persists messages -> receiveMessage broadcast
REST fallback GET /api/chat/messages/:conversationId guarded by chatAccessGuard (HR-family or client token)</div>
</section>`);

/* ============================ 14 CHANGE LOG ============================ */
add(`<section class="page"><h1>14. Complete Change Log - What Was Done</h1>
<h2>14.1 27 August 2026 - Full-suite production package</h2>
<ul>
<li>Interview video pipeline with HTTP Range streaming; HR AI Interviews page fixes.</li>
<li>Tenant <code>clientId</code> middleware fix; EVS frontend API URL fix.</li>
<li>Packages <code>HRMS-COMPLETE-PRODUCTION-2026-08-27</code> / <code>HRMS_PRODUCTION_DEPLOY_2026-08-27</code> (0-10 layout, still with Python services).</li>
<li>Project report (md/html/pdf) generated.</li>
</ul>
<h2>14.2 31 August 2026 - Security and stability audit (8 fixes)</h2>
<ol>
<li>Safe auth initialisation in admin, HR, IT and Sales auth contexts (try/catch JSON.parse).</li>
<li>EVS SSO hardened: HMAC-SHA256 signed URL minted by new SUPER_ADMIN-only route <code>evsSso.routes.js</code>; key removed from client bundle; 120 s validity.</li>
<li>EVS role fix in frontend Login.jsx (uses returned role).</li>
<li>HR Robo <code>/sync</code> secured (JWT or sync key at the time).</li>
<li>Smart Attendance OTP: debug output gated, store moved to DB (multi-worker safe).</li>
<li>Route audit of all modules: <code>aiChat.routes.js</code> protected; <code>chat.routes.js</code> GET messages guarded.</li>
<li>IT portal localStorage keys renamed <code>hrms_it_*</code> (~20 files).</li>
<li>Fail-loud env warnings (EVS_SSO_KEY, sync key, EVS JWT secret).</li>
</ol>
<p>Also: Proposal module upgraded to the Recruweb plan catalogue (Plan A/B/C recruitment; HR Tech Starter/Growth/Enterprise; per-employee AI Attendance / HRMS / EVS products; MRP vs offer; token/agreement/replacement terms) with schema migration and rebuilt admin + client portals. Hostinger package <code>HRMS-HOSTINGER-DEPLOY-2026-08-31</code> and Proposal module report produced.</p>
<h2>14.3 1-2 September 2026 - IT portal login fix</h2>
<ul>
<li>Root cause: IT Login posted to <code>/api/hr/auth/login</code> whose SQL filters <code>dep.name='HR'</code>.</li>
<li>Added <code>modules/it/auth/itAuth.service.js</code> + <code>itAuth.controller.js</code>; <code>it.routes.js</code> exposes <code>POST /auth/login</code> before the auth middleware; IT Login.jsx posts to <code>/it/auth/login</code>; token role <code>it</code>.</li>
<li>Hotfix package <code>HRMS-IT-LOGIN-HOTFIX-2026-09-02.zip</code>; fixed Hostinger package <code>HRMS-HOSTINGER-DEPLOY-2026-08-31-FIXED</code>.</li>
</ul>
<h2>14.4 2 September 2026 - EVS merged into Node</h2>
<ul>
<li>New <code>modules/evs/</code> (routes, controller, auth controller, countries, schema.sql); mounted at <code>/api/evs</code>; gateway no longer proxies EVS.</li>
<li>Login accepts Super Admin / HR / Client HRMS credentials; roles SUPER_ADMIN, hr, client_admin.</li>
<li>Uploads to <code>backend/uploads/evs/</code>; <code>scripts/run-evs-schema.mjs</code> creates tables and migrates the old database; <code>evs-smoke.mjs</code> added.</li>
<li>EVS frontend <code>VITE_API_URL</code> re-pointed to <code>/api/evs</code>. Python EVS backend retired.</li>
</ul>
<h2>14.5 2 September 2026 - HR Robo merged into Node</h2>
<ul>
<li>New <code>modules/hrRobo/</code> with controller, routes, schema and the interview UI under <code>ui/</code>; mounted at <code>/api/hr-robo</code>.</li>
<li>Groq via fetch, Whisper STT, <code>msedge-tts</code> TTS, Range video streaming, login chain Super Admin &rarr; HR &rarr; legacy admins.</li>
<li><code>run-hrrobo-migrate.mjs</code> imported all legacy data; <code>hrrobo-smoke.mjs</code> added.</li>
<li>HR <code>AIInterviews.jsx</code> and admin <code>AIPlatformAudit.jsx</code> default API base changed from :8001 to <code>/api/hr-robo</code>. <code>GROQ_API_KEY</code> copied to backend .env (found revoked).</li>
</ul>
<h2>14.6 2 September 2026 - Smart Attendance merged into Node</h2>
<ul>
<li>Full study of <code>app.py</code> (923 lines), <code>attendance_plus.py</code>, <code>database.py</code>, <code>face_engine.py</code>, <code>wifi_attendance.py</code>, config and 8 templates to capture the exact route contract.</li>
<li>New <code>modules/attendance/</code>: schema (5 tables), controller (all 50+ endpoints), routes; mounted at <code>/api/smart-attendance</code>.</li>
<li>Browser face engine: vendored face-api.min.js + 6 model files (~7 MB) + <code>sa-face.js</code> helper; 4 capture sites patched (employee face page; admin kiosk, admin registration x2) to send descriptors instead of images.</li>
<li>8 HTML pages copied and path-prefixed by <code>_sa-patch-ui.mjs</code>; cookie auth implemented; HRMS sync converted to direct SQL.</li>
<li><code>run-attendance-migrate.mjs</code> and <code>attendance-smoke.mjs</code> (34 checks) added; gateway proxy made a no-op; <code>.env.production</code> template and <code>README-DEPLOY.md</code> rewritten; package <code>HRMS-UNIFIED-BACKEND-2026-09-02.zip</code>.</li>
</ul>
<h2>14.7 2 September 2026 - Run, bug-hunt and production package</h2>
<ul>
<li>Both modules run live; HR Robo UI path bug and collation bug found and fixed (section 15).</li>
<li>"Open Portal" fix: <code>config.js</code> runtime base detection, relative assets, trailing-slash redirect, <code>VITE_AI_ROBO_APP_URL</code> in admin + HR, CORS origin added, standalone <code>11-hr-ai-interview</code> folder.</li>
<li><code>boot-check.mjs</code> updated to the new env key list; all 7 portal env files audited; <code>_build-all-portals.mjs</code> built all 7 portals (0 localhost leaks); <code>_package-full.mjs</code> assembled <code>HRMS-FULL-PRODUCTION-2026-09-02</code> (563 files, 16.1 MB) with SPA <code>.htaccess</code> per portal.</li>
<li>Source pushed to GitHub <code>Ahaan99/HRMS_PROJECTs</code>.</li>
</ul>
</section>`);

/* ============================ 15 BUGS ============================ */
add(`<section class="page"><h1>15. Bugs Found and Fixed</h1>
<table>
<tr><th>#</th><th>Bug</th><th>Impact</th><th>Root cause</th><th>Fix</th></tr>
<tr><td>1</td><td>Blank screen after corrupted localStorage</td><td>Portal unusable until storage cleared manually</td><td>Unguarded <code>JSON.parse</code> in auth contexts</td><td>try/catch + reset (admin, HR, IT, Sales)</td></tr>
<tr><td>2</td><td>EVS SSO key in URL</td><td>Shared secret visible in browser history / logs</td><td>Raw key passed as query param</td><td>Server-minted HMAC-SHA256 signed URL, 120 s window</td></tr>
<tr><td>3</td><td>EVS login always "Admin"</td><td>Wrong permissions shown</td><td>Hard-coded role in Login.jsx</td><td>Use role from response</td></tr>
<tr><td>4</td><td>HR Robo <code>/sync</code> unauthenticated</td><td>Anyone could overwrite interview reports</td><td>Missing guard</td><td>JWT required; now internal to Node</td></tr>
<tr><td>5</td><td>Two unguarded backend routes</td><td>Chatbot and chat messages readable without login</td><td>Missing middleware</td><td><code>protect()</code> on aiChat; <code>chatAccessGuard</code> on chat GET</td></tr>
<tr><td>6</td><td>IT staff cannot log into IT portal</td><td>Entire IT portal blocked for its users; HR staff could enter it</td><td>IT used HR login whose SQL filters department HR</td><td>Dedicated IT auth service/controller/route; role <code>it</code></td></tr>
<tr><td>7</td><td>HR and IT share localStorage keys</td><td>Cross-portal session collisions on same origin</td><td>Copied code kept <code>hrms_hr_*</code></td><td>Renamed to <code>hrms_it_*</code> across ~20 files</td></tr>
<tr><td>8</td><td>OTP printed to console / in-memory store</td><td>OTP leak in logs; lost on restart or with multiple workers</td><td>Debug code left in; dict store</td><td><code>OTP_DEBUG</code> gate; DB-backed store</td></tr>
<tr><td>9</td><td>HR Robo summary crashed after migration</td><td>500 on integration summary</td><td>mysql2 already parses JSON columns; string <code>synced_at</code> double-parsed</td><td>Safe <code>loadStore</code> parsing</td></tr>
<tr><td>10</td><td>Interview UI blank under <code>/api/hr-robo/</code></td><td>No CSS/JS, login, TTS on the served UI</td><td>15 absolute <code>/api/v1/...</code>, <code>/static/...</code> paths resolved to server root (404)</td><td>Relative assets + <code>HR_ROBO_BASE</code> from <code>config.js</code>; 301 redirect adds trailing slash</td></tr>
<tr><td>11</td><td>Attendance never reached HRMS table</td><td><code>hrms_sync=failed</code> "illegal mix of collations"</td><td>New tables created with server default collation; <code>employees</code> is utf8mb4_unicode_ci</td><td>18 tables converted in place; 3 schema files patched</td></tr>
<tr><td>12</td><td>Admin "Open Portal" (AI Interviews) opened EVS domain</td><td>Wrong portal opened</td><td>Button used API URL; stale baked value</td><td>New <code>VITE_AI_ROBO_APP_URL</code>; separate API vs portal URLs</td></tr>
<tr><td>13</td><td>Client build pointed at retired backend domain</td><td>Client portal would fail if old domain offline</td><td>Old <code>VITE_API_BASE_URL</code> baked in</td><td>Rebuilt with <code>backend-hrms.recruweb.com/api</code></td></tr>
<tr><td>14</td><td>Stale env list in <code>boot-check.mjs</code></td><td>False "missing env" warnings for retired Python URLs</td><td>Script predates merge</td><td>Updated required/recommended key lists</td></tr>
<tr><td>15</td><td>Tenant clientId missing on some client routes</td><td>Cross-tenant data risk</td><td>Middleware order</td><td>Tenant middleware fix (27 Aug)</td></tr>
</table>
<div class="box warn"><b>Not a bug, but requires action:</b> the Groq API key stored in <code>HR_robo/.env</code> is revoked (HTTP 401 from Groq). AI chat and speech-to-text in interviews will not respond until a new key is placed in <code>backend/.env</code> as <code>GROQ_API_KEY</code>. All other HR Robo functions work without it.</div>
<div class="box"><b>Behavioural observation:</b> Smart Attendance sync only succeeds when an attendance employee's <code>emp_id</code> equals an active HRMS <code>employeeCode</code> (e.g. 005 Ahaan synced; 002 Abc had no HRMS match and stays local). This is intended and the failure reason is recorded per record.</div>
</section>`);

/* ============================ 16 TESTING ============================ */
add(`<section class="page"><h1>16. Testing and Verification Results</h1>
<h2>16.1 Backend boot check (<code>scripts/boot-check.mjs</code>)</h2>
<div class="box ok">RESULT: PASS - <code>app.js</code> imports fully; 151 route mounts registered; all required env keys present in <code>.env</code>; modules evs, hrRobo, attendance present; no Python service URLs referenced.</div>
<h2>16.2 Smart Attendance smoke (<code>scripts/attendance-smoke.mjs</code>) - 34 / 34 pass</h2>
<table>
<tr><th>Group</th><th>Checks</th></tr>
<tr><td>Pages and assets</td><td>login, admin, employee, face, otp, wifi pages 200; face-api.min.js, sa-face.js, model manifests 200</td></tr>
<tr><td>Auth</td><td>admin login (cookie + Bearer), employee login, wrong password rejected, protected route 401 without token, role 403</td></tr>
<tr><td>Face</td><td>register descriptor, second sample appended (max 5), match within tolerance marks, unknown descriptor rejected, employee cannot mark another identity</td></tr>
<tr><td>OTP / WiFi</td><td>send stores OTP, verify wrong code, verify outside geo-fence, verify correct inside fence marks, wifi-check response shape</td></tr>
<tr><td>Records</td><td>my-status, check-out computes hours/overtime, my-history summary, admin stats, today-log, report, CSV download</td></tr>
<tr><td>Corrections / approval</td><td>request, duplicate pending rejected, admin list, approve updates record, pending queue, bulk approve</td></tr>
<tr><td>HRMS integration</td><td>Super Admin HRMS token accepted as attendance admin; sync writes <code>super_admin_attendance</code> for matching employeeCode; hrms-settings GET/POST; retry endpoint</td></tr>
</table>
<h2>16.3 HR Robo smoke (<code>scripts/hrrobo-smoke.mjs</code>)</h2>
<table>
<tr><th>Endpoint</th><th>Result</th></tr>
<tr><td>GET /api/hr-robo/health</td><td>200, database ok</td></tr>
<tr><td>GET /api/hr-robo/ (+ 301 from no-slash) and config.js, static/app.js, static/hrms_sync.js, css</td><td>200; served HTML contains 0 hard-coded <code>/api/hr-robo</code> paths</td></tr>
<tr><td>GET /api/integration/summary without token</td><td>401</td></tr>
<tr><td>POST /api/v1/auth/login (admin@hrms.com)</td><td>200, role super_admin</td></tr>
<tr><td>/api/v1/auth/me, /summary, /reports, /proctor-logs</td><td>200 with migrated data</td></tr>
<tr><td>GET /api/videos/491213 with Range</td><td>206, correct Content-Range</td></tr>
<tr><td>POST /api/v1/tts</td><td>200, 19 KB MP3</td></tr>
<tr><td>POST /api/v1/chat</td><td>Groq 401 - revoked key (external)</td></tr>
</table>
<h2>16.4 EVS smoke (<code>scripts/evs-smoke.mjs</code>)</h2>
<p>Health, login with Super Admin credentials, employee list, hrms-status counts, hrms-sync upsert, matrix endpoint, signed SSO URL mint (SUPER_ADMIN) and verification - all 200. Legacy-user login path returns 401 for unknown legacy accounts as expected.</p>
<h2>16.5 Portal builds (<code>scripts/_build-all-portals.mjs</code>)</h2>
<table>
<tr><th>Portal</th><th>Build</th><th>localhost refs in dist</th></tr>
<tr><td>admin</td><td>OK</td><td>0</td></tr><tr><td>client</td><td>OK</td><td>0</td></tr><tr><td>HR</td><td>OK</td><td>0</td></tr><tr><td>IT</td><td>OK</td><td>0</td></tr><tr><td>Sales</td><td>OK</td><td>0</td></tr><tr><td>employee</td><td>OK</td><td>0</td></tr><tr><td>EVS frontend</td><td>OK</td><td>0</td></tr>
</table>
<h2>16.6 Package integrity (<code>scripts/_package-full.mjs</code>)</h2>
<p>563 files, 16.1 MB. Verified: <code>0-hrms-backend</code> contains no <code>node_modules</code> and no <code>.env</code>; each of the 8 portal folders contains <code>index.html</code> and <code>.htaccess</code>; migration and smoke scripts present; README included.</p>
<h2>16.7 Not verified by automation</h2>
<ul>
<li>Real camera capture on a phone over HTTPS (face matching was verified with synthetic 128-d descriptors). One manual check on the production domain is recommended.</li>
<li>Groq LLM/STT responses (blocked by the revoked key).</li>
<li>Twilio SMS delivery and email dispatch (credentials are environment-specific).</li>
</ul>
</section>`);

/* ============================ 17 ENV ============================ */
add(`<section class="page"><h1>17. Environment Variables Reference (<code>backend/.env</code>)</h1>
<table>
<tr><th>Key</th><th>Required</th><th>Purpose / value</th></tr>
<tr><td>PORT</td><td>yes</td><td>5000</td></tr>
<tr><td>NODE_ENV</td><td>yes</td><td>production</td></tr>
<tr><td>DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME</td><td>yes</td><td>MySQL connection; DB_NAME = hrms_db</td></tr>
<tr><td>JWT_SECRET</td><td>yes</td><td>Long random string; signs every token in the suite</td></tr>
<tr><td>SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD</td><td>yes</td><td>Seed super admin (change after first login)</td></tr>
<tr><td>CORS_ORIGINS</td><td>yes</td><td>Comma list of all 8 portal origins incl. hr-ai-interview-hrms.recruweb.com</td></tr>
<tr><td>EVS_SSO_KEY</td><td>yes</td><td>hrms-evs-sso-2026 (must match admin build)</td></tr>
<tr><td>EVS_FRONTEND_URL</td><td>yes</td><td>https://evs-hrms.recruweb.com</td></tr>
<tr><td>GROQ_API_KEY</td><td>for AI chat/STT</td><td>New key from console.groq.com</td></tr>
<tr><td>GROQ_CHAT_MODEL</td><td>no</td><td>Defaults to a current Groq Llama model</td></tr>
<tr><td>OFFICE_LAT, OFFICE_LNG, OFFICE_RADIUS</td><td>recommended</td><td>Default geo-fence (overridden by admin UI setting)</td></tr>
<tr><td>OFFICE_SUBNET</td><td>no</td><td>e.g. 192.168.1 - office WiFi subnet for WiFi attendance</td></tr>
<tr><td>OTP_DEBUG</td><td>never in prod</td><td>1 enables otp_dev in responses (development only)</td></tr>
<tr><td>SALES_DEPT_ID</td><td>no</td><td>Sales department id for sales login</td></tr>
<tr><td>OLLAMA_URL, OLLAMA_MODEL</td><td>no</td><td>Chatbot backend; fallback replies if absent</td></tr>
<tr><td>TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM</td><td>no</td><td>OTP SMS for portal OTP login</td></tr>
<tr><td>SMTP_* / MAIL_*</td><td>no</td><td>nodemailer for letters and notifications</td></tr>
<tr><td colspan="3" class="small">Removed (no longer read): EVS_SERVICE_URL, HR_ROBO_SERVICE_URL, SMART_ATTENDANCE_SERVICE_URL, SMART_ATTENDANCE_KEY, HRMS_SYNC_KEY, HRROBO_SYNC_KEY, HRMS_SSO_KEY, EVS_JWT_SECRET.</td></tr>
</table>
<h2>17.1 Portal build variables</h2>
<p>See section 7.1. All are prefixed <code>VITE_</code> and live in each portal's <code>.env.production</code>; they are compiled into the bundle by <code>npm run build</code>.</p>
<h2>17.2 Interview UI runtime configuration</h2>
<p><code>11-hr-ai-interview/config.js</code>: if the page is served from a path containing <code>/api/hr-robo</code> it uses that same origin; otherwise <code>STANDALONE_API = "https://backend-hrms.recruweb.com/api/hr-robo"</code>. Edit this one line if the backend domain differs.</p>
</section>`);

/* ============================ 18 SCRIPTS ============================ */
add(`<section class="page"><h1>18. Migration and Utility Scripts (<code>backend/scripts/</code>)</h1>
<table>
<tr><th>Script</th><th>Run</th><th>What it does</th></tr>
<tr><td>run-evs-schema.mjs</td><td>once per server</td><td>Creates evs_* tables; migrates <code>employee_verification</code> if present (INSERT IGNORE)</td></tr>
<tr><td>run-hrrobo-migrate.mjs</td><td>once per server</td><td>Creates robo_* tables; imports integration_store.json, videos_index.json (+ copies videos), hr_robo_db.admin_users</td></tr>
<tr><td>run-attendance-migrate.mjs</td><td>once per server</td><td>Creates attendance_* tables; imports users/employees/attendance/corrections/settings from <code>smart_attendance</code>; employees flagged for face re-registration</td></tr>
<tr><td>boot-check.mjs</td><td>any time</td><td>Imports app.js, counts mounts, checks env keys; writes <code>_boot_report.txt</code>; prints RESULT: PASS/FAIL</td></tr>
<tr><td>env-keys.mjs</td><td>any time</td><td>Lists env keys actually referenced by the code vs present in .env</td></tr>
<tr><td>attendance-smoke.mjs</td><td>after start</td><td>34 live HTTP checks against :5000 (creates and deletes test employee 006)</td></tr>
<tr><td>hrrobo-smoke.mjs</td><td>after start</td><td>Live checks: health, UI, login, integration endpoints, Range video, TTS</td></tr>
<tr><td>evs-smoke.mjs</td><td>after start</td><td>Live checks for EVS endpoints and SSO</td></tr>
<tr><td>_build-all-portals.mjs</td><td>release</td><td>Runs <code>vite build</code> in all 7 portals, scans dist for "localhost", writes <code>_build_report.txt</code></td></tr>
<tr><td>_package-full.mjs</td><td>release</td><td>Assembles the numbered deployment folders + .htaccess + README and zips them</td></tr>
<tr><td>generate-full-report.mjs</td><td>documentation</td><td>Produces this report (HTML + PDF)</td></tr>
<tr><td>generateProjectReport.mjs, generate-sop-pdfs.mjs, generate-sop-docx.mjs, seedProposals.js, batch5_tables.sql, demo_analytics_data.sql</td><td>utility</td><td>Earlier report generator, SOP document generators, proposal seed data, table batches and demo analytics data</td></tr>
</table>
<div class="box">All three migration scripts read the backend <code>.env</code> and are idempotent (CREATE TABLE IF NOT EXISTS + INSERT IGNORE). Running them again on an already-migrated server only prints the "done" summary.</div>
</section>`);

/* ============================ 19 DEPLOY ============================ */
add(`<section class="page"><h1>19. Production Deployment Guide (Hostinger)</h1>
<h2>19.1 Domain map</h2>
<table>
<tr><th>Folder</th><th>Subdomain</th><th>Type</th></tr>
<tr><td>0-hrms-backend</td><td>backend-hrms.recruweb.com</td><td>Node.js application (Hostinger Node app or VPS with pm2)</td></tr>
<tr><td>1-superadmin</td><td>admin-hrms.recruweb.com</td><td>Static public_html</td></tr>
<tr><td>2-client</td><td>client-hrms.recruweb.com</td><td>Static</td></tr>
<tr><td>3-evs-frontend</td><td>evs-hrms.recruweb.com</td><td>Static</td></tr>
<tr><td>6-employee</td><td>employee-hrms.recruweb.com</td><td>Static</td></tr>
<tr><td>7-hr</td><td>hr-hrms.recruweb.com</td><td>Static</td></tr>
<tr><td>8-it</td><td>it-hrms.recruweb.com</td><td>Static</td></tr>
<tr><td>9-sales</td><td>sales-hrms.recruweb.com</td><td>Static</td></tr>
<tr><td>11-hr-ai-interview</td><td>hr-ai-interview-hrms.recruweb.com</td><td>Static (no build)</td></tr>
<tr><td>(inside backend)</td><td>backend-hrms.recruweb.com/api/smart-attendance/</td><td>Served by Node</td></tr>
</table>
<h2>19.2 Steps in order</h2>
<ol>
<li><b>Database:</b> create MySQL database <code>hrms_db</code> and a user with full rights on it (utf8mb4).</li>
<li><b>Backend upload:</b> upload <code>0-hrms-backend</code> to the Node app directory. Run <code>npm install --production</code>.</li>
<li><b>Environment:</b> copy <code>.env.production</code> to <code>.env</code>; fill DB_*, JWT_SECRET, SUPER_ADMIN_*, CORS_ORIGINS, EVS_SSO_KEY=hrms-evs-sso-2026, EVS_FRONTEND_URL, new GROQ_API_KEY, OFFICE_*; leave OTP_DEBUG unset.</li>
<li><b>Migrations (once):</b> <code>node scripts/run-evs-schema.mjs</code>, <code>node scripts/run-hrrobo-migrate.mjs</code>, <code>node scripts/run-attendance-migrate.mjs</code>.</li>
<li><b>Start:</b> <code>pm2 start server.js --name hrms-backend</code> then <code>pm2 save</code>. First start auto-creates core tables and seeds the super admin. Verify <code>https://backend-hrms.recruweb.com/health</code>, <code>/api/hr-robo/health</code>, <code>/api/smart-attendance/health</code>.</li>
<li><b>Optional self-test:</b> <code>node scripts/boot-check.mjs</code>, <code>node scripts/attendance-smoke.mjs</code>, <code>node scripts/hrrobo-smoke.mjs</code>.</li>
<li><b>Portals:</b> upload the contents of each numbered folder into its subdomain's <code>public_html</code>, including the hidden <code>.htaccess</code> (SPA fallback to index.html).</li>
<li><b>SSL:</b> enable HTTPS on every subdomain (camera, GPS and Secure cookies require it).</li>
<li><b>First login:</b> log into Super Admin, change the seed passwords; in Smart Attendance change the seeded admin (9999999999) password; ask employees to register their face once.</li>
<li><b>Uploads persistence:</b> ensure <code>backend/uploads/</code> is writable and kept between deployments (hr-robo videos, evs documents).</li>
</ol>
<h2>19.3 Changing domains</h2>
<p>Domains are baked into the 7 React builds. To move to different domains: edit each portal's <code>.env.production</code>, run <code>node scripts/_build-all-portals.mjs</code> then <code>node scripts/_package-full.mjs</code> from <code>backend/</code>, update <code>CORS_ORIGINS</code> and <code>EVS_FRONTEND_URL</code> on the server, and edit <code>11-hr-ai-interview/config.js</code>.</p>
<h2>19.4 Operations</h2>
<ul>
<li>Logs: <code>pm2 logs hrms-backend</code>; request logger prints method, path, status and duration.</li>
<li>Restart after env changes: <code>pm2 restart hrms-backend</code>.</li>
<li>Backups: dump <code>hrms_db</code> and archive <code>backend/uploads/</code>.</li>
<li>Health endpoints return database status for external monitoring.</li>
</ul>
</section>`);

/* ============================ 20 LIMITATIONS ============================ */
add(`<section class="page"><h1>20. Known Limitations and Pending Actions</h1>
<h2>20.1 Pending actions for the operator</h2>
<table>
<tr><th>Action</th><th>Why</th><th>Blocking?</th></tr>
<tr><td>Obtain new GROQ_API_KEY</td><td>Old key revoked; AI chat and STT return 401</td><td>Only for AI interview conversation</td></tr>
<tr><td>Run the 3 migration scripts on the server</td><td>Create evs_/robo_/attendance_ tables</td><td>Yes, for those modules</td></tr>
<tr><td>Employees re-register face</td><td>dlib encodings incompatible with face-api.js</td><td>Only for face attendance</td></tr>
<tr><td>Change seed passwords</td><td>Security</td><td>Yes (policy)</td></tr>
<tr><td>Manual camera test on phone (HTTPS)</td><td>Automation used synthetic descriptors</td><td>Recommended</td></tr>
<tr><td>Set attendance emp_id = HRMS employeeCode</td><td>Required for sync into Super Admin attendance</td><td>Per employee</td></tr>
</table>
<h2>20.2 Design limitations</h2>
<ul>
<li>Face recognition accuracy depends on the phone camera and lighting; face-api.js SSD MobileNet is lighter than dlib - default tolerance 0.55 balances false accepts/rejects and is adjustable per request (0.35-0.70).</li>
<li>WiFi attendance requires the server to see the client's real IP (X-Forwarded-For is honoured); on shared hosting behind NAT the subnet check may need <code>OFFICE_SUBNET</code>.</li>
<li>Smart Attendance pages are plain HTML served by the backend; they are functional but not part of the React design system.</li>
<li><code>modules/integration/smartAttendance.routes.js</code> (legacy HTTP receiver) is retained for compatibility only.</li>
<li>Dead files noted in earlier audits (<code>routes/financeRoutes.js</code> with a typo import, one-off controller scripts) are not imported anywhere and are harmless; they can be deleted in a later clean-up.</li>
<li>The optional Ollama chatbot needs a reachable Ollama server; otherwise it answers with fallback replies.</li>
</ul>
<h2>20.3 Suggested next steps</h2>
<ul>
<li>Add an automated CI job running <code>boot-check</code> and the three smoke suites on every push to <code>Ahaan99/HRMS_PROJECTs</code>.</li>
<li>Move the Smart Attendance pages into the Employee portal as React routes for a consistent UI.</li>
<li>Rotate <code>EVS_SSO_KEY</code> to a random value and rebuild the admin portal.</li>
<li>Delete the retired Python folders from the repository once the production rollout is confirmed.</li>
</ul>
</section>`);

/* ============================ APPENDIX A ============================ */
add(`<section class="page"><h1>Appendix A - API Route Reference (Merged Modules)</h1>
<h2>A.1 Smart Attendance - base <code>/api/smart-attendance</code></h2>
<table>
<tr><th>Method / path</th><th>Guard</th><th>Purpose</th></tr>
<tr><td>GET / , /register-account, /admin, /admin/advanced, /employee, /employee/face, /employee/otp, /employee/wifi, /static/*</td><td>public</td><td>HTML pages and assets (face-api models under /static/vendor)</td></tr>
<tr><td>GET /health, /api/health</td><td>public</td><td>Status + DB check</td></tr>
<tr><td>POST /api/login, /api/logout, /api/register-account</td><td>public</td><td>Cookie + token login; self registration (employee, or first admin)</td></tr>
<tr><td>POST /api/location-status; GET/POST /api/office-location</td><td>public / admin</td><td>Geo-fence check; read/set office coordinates</td></tr>
<tr><td>GET /api/wifi-check, /api/network-status; POST /api/wifi-attendance</td><td>public / employee</td><td>Subnet verification; WiFi marking</td></tr>
<tr><td>POST /api/otp/send, /api/otp/verify</td><td>employee</td><td>OTP marking</td></tr>
<tr><td>POST /api/register-face; POST /api/mark-attendance</td><td>admin / any user</td><td>Descriptor registration; face marking (single or multi-face kiosk)</td></tr>
<tr><td>GET /api/stats, /api/today-log, /api/report, /api/download-csv, /api/registered-employees; POST /api/delete-employee</td><td>admin</td><td>Dashboards and exports</td></tr>
<tr><td>GET /api/accounts/list; POST /api/accounts/create, /delete, /update-admin</td><td>admin</td><td>Account management</td></tr>
<tr><td>DELETE /api/attendance/:emp_id?date=, /api/attendance/delete-by-date/:date; POST /api/attendance/bulk-delete</td><td>admin</td><td>Record deletion</td></tr>
<tr><td>GET /api/my-status, /api/my-history; POST /api/check-out</td><td>employee</td><td>Self-service</td></tr>
<tr><td>GET/POST /api/shift-settings; GET /api/summary</td><td>any / admin</td><td>Shift rules; monthly summary</td></tr>
<tr><td>GET /api/attendance/pending; POST /api/attendance/approve</td><td>admin</td><td>Approval queue</td></tr>
<tr><td>GET/POST /api/corrections; POST /api/corrections/:cid</td><td>any / employee / admin</td><td>Correction workflow</td></tr>
<tr><td>GET/POST /api/hrms-settings; POST /api/hrms-sync/retry</td><td>admin</td><td>Sync toggle and retry</td></tr>
</table>
<h2>A.2 HR Robo - base <code>/api/hr-robo</code></h2>
<table>
<tr><th>Method / path</th><th>Guard</th><th>Purpose</th></tr>
<tr><td>GET / (301 from no slash), /config.js, /static/*</td><td>public</td><td>Interview UI</td></tr>
<tr><td>GET /health</td><td>public</td><td>Status</td></tr>
<tr><td>POST /api/v1/auth/login; GET /api/v1/auth/me</td><td>public / robo JWT</td><td>Login chain Super Admin &rarr; HR &rarr; legacy admin</td></tr>
<tr><td>POST /api/v1/tts, /api/v1/stt, /api/v1/chat</td><td>robo JWT</td><td>Speech and LLM</td></tr>
<tr><td>POST /api/sync</td><td>robo JWT</td><td>Store reports / proctor logs / candidates / schedules</td></tr>
<tr><td>GET /api/integration/summary, /reports, /proctor-logs, /candidates, /schedules</td><td>robo or HRMS JWT</td><td>Data for HR and Admin pages</td></tr>
<tr><td>POST /api/videos/upload; GET /api/videos, /api/videos/:candidateId</td><td>robo JWT / HRMS JWT</td><td>Recording upload and Range streaming</td></tr>
</table>
<h2>A.3 EVS - base <code>/api/evs</code></h2>
<table>
<tr><th>Method / path</th><th>Guard</th><th>Purpose</th></tr>
<tr><td>POST /login, /sso-login; GET /me</td><td>public / EVS JWT</td><td>HRMS-credential login; HMAC SSO</td></tr>
<tr><td>GET /hrms-status; POST /hrms-sync; GET /hrms-documents</td><td>EVS JWT</td><td>HRMS bridge (same DB)</td></tr>
<tr><td>GET/POST /employees, /employees/:id, /employees/matrix</td><td>EVS JWT</td><td>Employee records and verification matrix</td></tr>
<tr><td>/identity, /documents (multipart), /background, /employment-history</td><td>EVS JWT (role-checked)</td><td>Verification dimensions</td></tr>
<tr><td>GET /audit-logs; GET /countries</td><td>EVS JWT</td><td>Audit trail; reference data</td></tr>
<tr><td>GET /api/super-admin/evs/sso-url</td><td>SUPER_ADMIN</td><td>Mints the signed EVS URL (lives in superAdmin module)</td></tr>
</table>
</section>`);

/* ============================ APPENDIX B ============================ */
add(`<section class="page"><h1>Appendix B - Package Contents</h1>
<table>
<tr><th>Package</th><th>Date</th><th>Contents</th></tr>
<tr><td>HRMS-FULL-PRODUCTION-2026-09-02 (.zip 16.1 MB, 563 files)</td><td>2 Sep</td><td>0-hrms-backend, 1-superadmin, 2-client, 3-evs-frontend, 6-employee, 7-hr, 8-it, 9-sales, 11-hr-ai-interview, README-DEPLOY.md - <b>current release</b></td></tr>
<tr><td>HRMS-UNIFIED-BACKEND-2026-09-02 (.zip 6.2 MB, 482 files)</td><td>2 Sep</td><td>backend/ + 11-hr-ai-interview + README (backend-only release, superseded by the full package)</td></tr>
<tr><td>HRMS-IT-LOGIN-HOTFIX-2026-09-02.zip</td><td>2 Sep</td><td>3 backend IT auth files + IT frontend source + README-HOTFIX</td></tr>
<tr><td>HRMS-HOSTINGER-DEPLOY-2026-08-31-FIXED</td><td>1 Sep</td><td>0-10 layout with Python services (pre-merge, superseded)</td></tr>
<tr><td>HRMS-COMPLETE-PRODUCTION-2026-08-27</td><td>27 Aug</td><td>0-10 layout with Python services (superseded)</td></tr>
<tr><td>HRMS-PROPOSAL-MODULE-REPORT-2026-08-31.md</td><td>31 Aug</td><td>Proposal module documentation</td></tr>
<tr><td>HRMS-PROJECT-REPORT-2026-08-27 (.md/.html/.pdf)</td><td>27 Aug</td><td>Previous project report</td></tr>
</table>
<h2>B.1 Backend folder exclusions</h2>
<p><code>node_modules/</code> (installed on the server), <code>.env</code> (secrets), dev <code>uploads/</code> bulk (the folder structure <code>uploads/hr-robo/video/</code> and <code>uploads/evs/</code> is created on demand), temporary <code>_*.txt</code> reports, and the retired Python folders.</p>
<h2>B.2 Static portal folders</h2>
<p>Each contains Vite output (<code>index.html</code>, <code>assets/*.js|css</code>, favicons, <code>sw.js</code> for the client PWA) plus:</p>
<pre>.htaccess
&lt;IfModule mod_rewrite.c&gt;
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
&lt;/IfModule&gt;</pre>
</section>`);

/* ============================ APPENDIX C ============================ */
add(`<section class="page"><h1>Appendix C - Glossary</h1>
<table>
<tr><th>Term</th><th>Meaning</th></tr>
<tr><td>ATS</td><td>Applicant Tracking System - resume parsing and 0-100 candidate scoring in the jobBoard / aiRecruit modules</td></tr>
<tr><td>EVS</td><td>Employee Verification System - Aadhaar, PAN, documents, background and history verification</td></tr>
<tr><td>HR Robo</td><td>AI interview platform: TTS questions, STT answers, LLM evaluation, proctoring and recording</td></tr>
<tr><td>Smart Attendance</td><td>Face / OTP / WiFi attendance with geo-fence, corrections and approvals</td></tr>
<tr><td>Descriptor</td><td>128-dimensional face embedding computed by face-api.js; compared by Euclidean distance</td></tr>
<tr><td>Geo-fence</td><td>Circle of OFFICE_RADIUS metres around office coordinates; haversine distance check</td></tr>
<tr><td>JWT</td><td>JSON Web Token; Bearer token signed with JWT_SECRET, revocable via user_sessions.jti</td></tr>
<tr><td>HMAC SSO</td><td>Single sign-on link whose signature is HMAC-SHA256(key, email.timestamp), valid 120 s</td></tr>
<tr><td>Master Control</td><td>Super Admin screen enabling portals and per-client features (portal_settings, feature flags)</td></tr>
<tr><td>Tenant</td><td>A client organisation; client routes are scoped by clientId from the token</td></tr>
<tr><td>SPA .htaccess</td><td>Apache rewrite rule routing all unknown paths to index.html for React Router</td></tr>
<tr><td>pm2</td><td>Node process manager used to keep the backend running and restart on crash</td></tr>
<tr><td>Vite build-time env</td><td>VITE_* variables compiled into the JavaScript bundle; changing them requires a rebuild</td></tr>
<tr><td>Range streaming</td><td>HTTP 206 partial responses letting the browser seek inside interview recordings</td></tr>
<tr><td>Idempotent migration</td><td>Script that can be re-run safely (CREATE TABLE IF NOT EXISTS, INSERT IGNORE)</td></tr>
<tr><td>utf8mb4_unicode_ci</td><td>MySQL collation used on every table so joins between modules never fail</td></tr>
</table>
</section>`);

/* ============================ RENDER ============================ */
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>HRMS Complete Project Report - 2 Sep 2026</title><style>${css}</style></head><body>${S.join("\n")}</body></html>`;
fs.writeFileSync(HTML_OUT, html, "utf8");
console.log("HTML written:", HTML_OUT);

const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--disable-gpu"] });
const page = await browser.newPage();
await page.setContent(html, { waitUntil: "load" });
await page.emulateMediaType("print");
await page.pdf({
  path: PDF_OUT,
  format: "A4",
  printBackground: true,
  preferCSSPageSize: true,
  displayHeaderFooter: true,
  headerTemplate: `<div style="font-size:8px;color:#6b7280;width:100%;padding:0 15mm;display:flex;justify-content:space-between;font-family:Arial"><span>HRMS Platform - Complete Project Report</span><span>2 September 2026</span></div>`,
  footerTemplate: `<div style="font-size:8px;color:#6b7280;width:100%;padding:0 15mm;display:flex;justify-content:space-between;font-family:Arial"><span>Ardhnarishwar HRMS | Recruweb - Confidential</span><span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>`,
  margin: { top: "18mm", right: "15mm", bottom: "20mm", left: "15mm" },
});
await browser.close();
const size = fs.statSync(PDF_OUT).size;
const pages = (fs.readFileSync(PDF_OUT, "latin1").match(/\/Type\s*\/Page[^s]/g) || []).length;
console.log("PDF written:", PDF_OUT, (size / 1024).toFixed(0) + " KB", pages + " pages");
