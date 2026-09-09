# HRMS Full Production Package - Hostinger Deploy Guide

Package date: 2026-09-09. Everything in this zip was built from the same source
tree and verified together (backend boot PASS with 0 schema failures; 256 live GET
endpoints 2xx across all 7 portals; per-role access cross-check PASS; the three
data-flow breaks found in the 2026-09-08 video audit are fixed and re-verified).
Deploy the whole package - do not mix with older builds.

**Upgrading from the 2026-09-07 or 2026-09-08 build?** Follow 1b. There are NO manual SQL
steps any more: on every start the backend creates missing HR Robo / Smart
Attendance / EVS tables and applies `migrations/*.sql` exactly once (tracked in
`schema_migrations`). The legacy Python services (HR_robo :8001, Smart
Attendance :5050) are fully replaced by Node modules - do NOT start them.

## What is in the zip

| Folder | Deploy to (Hostinger domain) | What it is |
|---|---|---|
| `0-hrms-backend/` | `backend-hrms.recruweb.com` (Node app, pm2) | ONE Node.js process that serves EVERY portal's API **and** the Smart Attendance portal pages **and** the HR Robo API |
| `1-superadmin/` | `admin-hrms.recruweb.com` | Super Admin portal (static) |
| `2-client/` | `client-hrms.recruweb.com` | Client portal (static) |
| `3-evs-frontend/` | `evs-hrms.recruweb.com` | Employee Verification System portal (static) |
| `6-employee/` | `employee-hrms.recruweb.com` | Employee portal (static) |
| `7-hr/` | `hr-hrms.recruweb.com` | HR dashboard portal (static) |
| `8-it/` | `it-hrms.recruweb.com` | IT dashboard portal (static) |
| `9-sales/` | `sales-hrms.recruweb.com` | Sales portal (static) |
| `11-hr-ai-interview/` | `hr-ai-interview-hrms.recruweb.com` | HR Robo AI interview UI (plain HTML, no build) |

Smart Attendance has NO separate folder: it is served by the backend at
`https://backend-hrms.recruweb.com/api/smart-attendance/` (login, admin, employee pages).

Every static portal ships with a `.htaccess` (SPA routing + asset caching).
Upload hidden files too - without `.htaccess`, refreshing a deep link gives 404.

## Requirements (backend host)
- Node.js 20+ (built and tested on 24), npm
- MySQL 8 / MariaDB 10.6+ with database `hrms_db`
- pm2 (`npm i -g pm2`), Nginx or Apache reverse proxy with HTTPS
  (camera, GPS and microphone in the browser REQUIRE HTTPS)

---

## STEP 1 - Backend (`0-hrms-backend`) - deploy FIRST

### 1a. First-time install (fresh server)
```bash
cd /path/to/0-hrms-backend
npm ci --omit=dev                # or: npm install --omit=dev
cp .env.production .env          # edit EVERY CHANGE_ME value (see 1c)
node scripts/run-evs-schema.mjs
node scripts/run-hrrobo-migrate.mjs
node scripts/run-attendance-migrate.mjs
node scripts/run-it-portal-migrate.mjs
pm2 start server.js --name hrms-backend
pm2 save && pm2 startup
```
All migration scripts are idempotent (safe to run again). HRMS core tables are
created on first boot. `npm run db:setup` runs the same bootstrap without
starting the server; `npm run check` is the boot self-test.

### 1b. Upgrading an existing server (already running an older backend)
```bash
pm2 stop hrms-backend
mv backend backend_old_$(date +%F)          # instant rollback copy
# upload 0-hrms-backend and rename it to  backend
cp   backend_old_*/.env       backend/.env   # KEEP your live .env
cp -r backend_old_*/uploads/  backend/       # KEEP documents, EVS files, interview videos
cd backend && npm install --omit=dev
pm2 restart hrms-backend
pm2 logs hrms-backend --lines 60             # expect "[schema] ... ok" lines and "migrations: N applied", no FAILED
curl https://backend-hrms.recruweb.com/api/health   # {"status":"healthy","db":"up",...}
# optional one-time import of the old Python HR Robo data (idempotent):
node scripts/migrate-hrrobo-store.mjs
```
Rollback: `pm2 stop hrms-backend && mv backend backend_failed && mv backend_old_* backend && pm2 restart hrms-backend`

### 1c. `.env` keys that must be correct
| Key | Notes |
|---|---|
| `PORT` | 5000 (what the reverse proxy forwards to) |
| `DB_HOST DB_USER DB_PASSWORD DB_NAME` | `hrms_db` |
| `JWT_SECRET` | one secret shared by all modules - changing it logs everyone out |
| `CORS_ORIGINS` | comma list of ALL portal domains incl. `https://hr-ai-interview-hrms.recruweb.com` |
| `EVS_SSO_KEY` | must equal the value baked into the Super Admin build (`hrms-evs-sso-2026`) |
| `EVS_FRONTEND_URL` | `https://evs-hrms.recruweb.com` |
| `GROQ_API_KEY` | **HR Robo AI needs a VALID key.** A revoked key makes the interview fall back to static questions (`GET /api/hr-robo/api/v1/test-groq` shows `Invalid API Key`). Get one at console.groq.com |
| `GROQ_CHAT_MODEL` | optional, defaults apply |
| `OFFICE_LAT OFFICE_LNG OFFICE_RADIUS OFFICE_SUBNET` | Smart Attendance geofence (can also be set from the attendance admin UI) |
| `OTP_DEBUG` | must be `false` in production |
| SMTP / Twilio keys | as before |

### 1d. Verify backend
```bash
curl https://backend-hrms.recruweb.com/api/health
curl https://backend-hrms.recruweb.com/api/evs/health
curl https://backend-hrms.recruweb.com/api/hr-robo/health
curl https://backend-hrms.recruweb.com/api/smart-attendance/api/health
```
All four must return JSON with `"status":"healthy"` / `ok`.
Then open `https://backend-hrms.recruweb.com/api/smart-attendance/` - the
Smart Attendance login page must load.

### 1e. Nginx block (backend-hrms.recruweb.com)
```nginx
server {
  server_name backend-hrms.recruweb.com;
  client_max_body_size 600m;              # interview video uploads
  location / {
    proxy_pass http://127.0.0.1:5000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;   # socket.io chat
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 300s;
  }
}
```
Then `certbot --nginx`.

---

## STEP 2 - Static portals (1, 2, 3, 6, 7, 8, 9)
For EACH portal folder:
1. hPanel -> File Manager -> the matching domain's `public_html`.
2. Delete the old contents.
3. Upload the CONTENTS of the folder (`index.html`, `assets/`, `.htaccess`, ...).
   Enable "show hidden files" so `.htaccess` is included.
4. Open the domain, press Ctrl+F5 once, log in.

All builds are baked with `https://backend-hrms.recruweb.com` (0 localhost URLs,
verified at package time). If you ever change the backend domain you must edit
each portal's `.env.production` and rebuild.

## STEP 3 - HR Robo interview UI (`11-hr-ai-interview`)
1. `public_html` of `hr-ai-interview-hrms.recruweb.com` -> delete old contents.
2. Upload the contents of `11-hr-ai-interview`.
3. Open `config.js` on the server: `HR_ROBO_BASE` must be
   `https://backend-hrms.recruweb.com/api/hr-robo`.
4. Ctrl+F5, log in with a Super Admin or HR account.

---

## STEP 4 - Post-deploy feature checklist
| Portal | Test |
|---|---|
| Backend | 4 health URLs above return healthy |
| Super Admin | Login -> Client Management -> add + delete a test client (no FK error) -> IT Developer page shows Deliverables tab -> Complaints shows every portal's complaints (IT/Employee/Manager included) -> Proposals: "Pending approval" tab lists Sales submissions with Approve / Return |
| Client | Login -> Employees, Attendance, Payroll, Leads upload -> Proposals lists only Sent/Accepted/Rejected/Expired (never drafts) and Accept works |
| HR | Login -> AI Interviews page lists candidates from HR Robo |
| Employee | Login -> Attendance, Leave, Documents, My EOD |
| IT | Login as developer -> Tasks, Timesheet (own rows only), Daily Work, My EOD, Complaint box, Work policies |
| Sales | Login -> Calls, Clients, Invoices, EOD -> Proposals: New Proposal (only the rep's own clients are offered) -> Submit for approval -> appears in Super Admin "Pending approval" -> after Approve the client sees it |
| EVS | Super Admin -> Employee Verification opens EVS via SSO; EVS direct login works |
| Smart Attendance | `/api/smart-attendance/` login `9999999999` -> Download CSV tab -> Download Today CSV saves a file; employee registers face + marks attendance (HTTPS + camera) |
| HR Robo | Register a candidate on one device, it appears in the admin dashboard on another device |

## Security reminders
- Change every seed password (`123`, `admin123`, `Test@1234`) before go-live.
- `OTP_DEBUG=false`; rotate `JWT_SECRET` and `GROQ_API_KEY` if they were ever shared.
- Keep `uploads/` outside of any public web root except through the backend's `/uploads` route.

## Change log 2026-09-09 release (this package)
Backend
- **Client Onboarding pipeline** (`/api/super-admin/onboarding`): Proposal Sent -> Details
  Submitted -> Agreement Generated -> Agreement Signed -> Onboarded, with server-side stage
  gates. "Agreement Generated" renders the branded MSA PDF into `uploads/generated` and
  creates a `client_agreements` row (status `draft`); "Signed" sets it `active`;
  "Onboarded" links an existing client (matched by e-mail/phone) or provisions a new one
  (gap-safe client code, temporary password shown once, all 21 features enabled) and locks
  the record. Migration `2026-09-09_onboarding_links.sql` (applied automatically on boot).
- **Client Agreements for clients**: `GET /api/client/agreements` (scoped by client id).
- **Client employees**: Work Target and Inventory read routes accept client-employee
  tokens (own / department / company-wide targets; company stock). All create, update
  and delete routes stay client-admin only.
- Emergency alerts table migration `2026-09-09_emergency_alerts.sql`.
- Local-only test and report scripts removed from the package.

Portals
- Super Admin: Client Onboarding page (pipeline, stage buttons, Details drawer, locked
  onboarded rows), Client Agreements list shows onboarding-generated agreements.
- Client: Agreements page (Admin tab); Employee tab shows Work Target and Inventory
  read-only; Overview personal workspace for client employees.

Deploy notes for this release
- No manual SQL. Start the backend once; check `schema_migrations` contains
  `2026-09-09_onboarding_links.sql` and `2026-09-09_emergency_alerts.sql`.
- Rebuild/redeploy ALL seven portal folders (admin and client changed; the others
  were rebuilt from the same tree so versions match).
- `CORS_ORIGINS` in `.env` must list the admin portal domain you actually use
  (`https://admin-hrms.recruweb.com`); the template now includes it.

Change log 2026-09-08 release
Backend
- **Python services retired**: HR Robo (`/api/hr-robo`, tables `robo_*`) and Smart
  Attendance (`/api/smart-attendance`, tables `attendance_*`) now run natively in Node.
  `gateway.proxy.js` is a no-op. `scripts/migrate-hrrobo-store.mjs` imports the old
  Python store once. HR Robo integration endpoints now require a portal JWT
  (SUPER_ADMIN / hr) - the admin and HR portals send it automatically.
- **Schema bootstrap on boot** (`config/schemaBootstrap.js`): module schemas + tracked
  `migrations/*.sql`; nothing throws, failures are logged and retried next start.
  New: `GET /api/health` (DB ping), `npm run db:setup`, `npm run db:migrate`, `npm run check`.
- Data-flow fixes from the video audit: Super Admin "Add Candidate" writes `candidates`
  (HR/Client now see it); Super Admin Attendance Tracker unions `attendance` +
  `client_attendance`; Sales invoices carry `client_id` and the Client portal reads
  both `invoices` and `client_invoices`.
- OTP attendance for employees (email OTP, attempt limit, cooldown, check-out).
- Unified employee self-profile: `GET/PATCH /api/employee/profile`, avatar upload
  (`uploads/profile`), password change. Static uploads served at `/uploads` and `/api/uploads`.
- Offer letters: editable templates with `{{placeholders}}`, CTC annexure toggle,
  server-rendered preview, template-bound PDF. Tables are created if missing
  (`2026-09-08_offer_letter_base_tables.sql`) then widened.
- Joining forms: 12th / graduation / post-graduation education columns.
- **Shift-aware attendance**: `employees.shift_id` (migration `2026-09-08_employee_shift.sql`).
  Super Admin -> Login Time gets a "Shifts" tab and a per-employee Shift selector; HR and
  geo check-ins are marked LATE against the employee's own shift (login-window end + grace)
  instead of the single global login time. Saving shifts in IT/HR now keeps shift ids.
Portals
- Employee: OTP Attendance page, unified My Profile, bottom-nav "More" sheet.
- Super Admin: Offer Letter page rebuilt (TemplateEditor, LetterPreview, ConfirmModal);
  AI Platform Audit authenticates against HR Robo; PWA cache bumped (v2).
- HR: AI Interviews authenticates against HR Robo.
- All 7 portals rebuilt from the same source - 0 `localhost` leaks, production domains baked in.

## Change log since 2026-09-04 release (2026-09-07 package)
Backend
- SECURITY: `/api/super-admin/offer-letter/*` was reachable without a login (the
  `protect` middleware had been commented out). Re-enabled for SUPER_ADMIN /
  MANAGER / TL. Added the `DELETE /templates/:id` route the UI already called.
- SECURITY: removed `console.log` statements that wrote the entered password,
  the bcrypt hash and full request bodies to the server log (employee login,
  client-employee login, Super Admin employee create/update).
- Super Admin clients: `PATCH /api/super-admin/clients/assign-hr` was never
  wired (Client Profile "Assigned HR" multiselect returned 404) - fixed.
- Client leads: `updateLead` had no tenant scope (one client could edit another
  client's lead by id) - now scoped by `client_id` (+ `assigned_to` for
  employees); every handler has try/catch (some errors used to hang the
  request); `/my` for client_admin returns the tenant's leads instead of 500.
- Complaints: joins are role-conditioned (a client complaint no longer shows a
  random employee whose id happened to match); detail returns name/dept/client;
  replies carry `sender_name`.
- Proposals (Sales workflow): new module `modules/sales/proposals`
  (`/api/sales/proposals` - draft, submit, withdraw, edit, delete-draft, my
  clients, plan catalog; every write is ownership-checked). Super Admin gained
  `PATCH /api/super-admin/proposals/:id/approve` and `/:id/return` (note
  required). Client API only ever returns SENT / ACCEPTED / REJECTED / EXPIRED.
  Statuses: DRAFT -> PENDING_APPROVAL -> (SENT | REVISION -> resubmit).
  Schema self-migrates on boot: `proposals.sales_employee_id, created_by_role,
  submitted_at, approval_note, approved_by, approved_at`, wider `status` ENUM,
  `clients.employee_id`. No SQL to run by hand.
Portals
- Sales: new **Proposals** module (list with KPI strip + "Returned with notes"
  callout, builder with own-clients picker + plan catalog, preview with
  Submit / Withdraw / Edit & resubmit / Download PDF, progress timeline).
- Super Admin: Proposals list shows the submitting rep, "Pending approval" tab,
  Approve + Return-with-note modal; Complaints pages redesigned and now list
  complaints from ALL portals (IT / Employee / Manager were invisible before);
  Joining Details modal no longer crashes (hooks-order bug).
- Client: Proposals page unchanged in behaviour, rebuilt from the same source.
- HR, Employee, IT, EVS: rebuilt from the same source (no functional change).

## Change log 2026-09-07 release (this package)
Backend
- **Sales Proposals workflow** (new module `modules/sales/proposals`, mounted `/api/sales/proposals`):
  a sales rep drafts a proposal for one of *their own* clients, submits it, Super Admin approves
  (-> client sees it) or returns it with a note (-> rep edits and resubmits). Statuses:
  `DRAFT -> PENDING_APPROVAL -> SENT -> ACCEPTED/REJECTED`, plus `REVISION` and auto `EXPIRED`.
  Super Admin endpoints `PATCH /api/super-admin/proposals/:id/approve|return`.
  The `proposals` table is upgraded automatically on first boot (new columns
  `sales_employee_id, created_by_role, approval_note, approved_by, approved_at`, wider status ENUM).
- **Security**: offer-letter API (`/api/super-admin/offer-letter/*`) was reachable without a login -
  now requires SUPER_ADMIN/MANAGER/TL; `DELETE /templates/:id` added (the UI already called it).
- **Security**: plaintext passwords and bcrypt hashes are no longer written to the server log
  (employee login, client-employee login, super-admin employee create/update).
- Client Profile "Assign HR" toggle was 404 - `PATCH /api/super-admin/clients/assign-hr` is now wired.
- Client leads API: tenant-scoped updates (no cross-client writes), all handlers return proper errors
  instead of hanging, `/my` works for `client_admin`.
- Complaints: complaints raised from IT/Employee/Manager portals are now listed for Super Admin;
  raiser name resolved per role (fixes "random employee shown on client complaint"); replies carry sender name.
Portals
- Sales: new **Proposals** card + pages (list with status filter, builder, preview/PDF, submit/withdraw/resubmit).
- Super Admin: Proposals page gains **Pending approval** tab with Approve / Return-with-note; returned note shown in list.
  Complaints pages redesigned (status tabs, portal filter, chat-style thread, status panel).
- Admin: JoiningDetailsModal crash (hooks after early return) fixed.
- All 7 portals rebuilt from the same source - 0 `localhost` leaks, production domains baked in.
Tooling (in `scripts/`, for maintainers)
- `_xcheck-routes.mjs` / `_xcheck-roles.mjs` / `_xcheck-nav.mjs` - frontend calls vs backend routes/roles/router.
- `_smoke-portals.mjs` - mints a JWT per portal role and GETs every live endpoint (251 endpoints, all 2xx).
- `_grep.mjs` - recursive grep used by the audits.

## Change log since 2026-09-02 release (previous package, 2026-09-04)
Backend
- Super Admin client delete: transactional cascade in FK-safe order (fixes `client_leads_ibfk_2` error).
- Smart Attendance: CSV download always returns a file (empty period -> header-only CSV with BOM, `X-Row-Count`); HTML pages served `no-store`.
- HR Robo: shared store merges by candidate identity with tombstones - candidates registered on any laptop show everywhere; admin login uses backend JWT.
- IT role: timesheet/performance/complaints/targets/emergency/work-policy/birthday/deployment endpoints scoped for `it`; EOD API; deliverables API (`/api/it-deliverables`).
- Work policies: `client_id` default 0; complaints ENUMs include `it`/`manager` (`run-it-portal-migrate.mjs`).
Portals
- Super Admin: Client Directory sticky table; IT Developer page read-only timesheet + Deliverables tab; client table sticky header.
- IT: premium redesign (MagicCard) of Tasks, Timesheet, Bugs, Performance, Targets, Deployments, Complaints, Work Policies, Daily Work, My EOD; dark-mode fixes.
- HR Robo UI: store sync fix, relative asset paths, JWT admin login.
- Client, HR, Employee, Sales, EVS: rebuilt from the same source (no functional change) so the whole suite is one consistent release.
