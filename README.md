# HRMS — Unified Human Resource Management System

One Node.js backend, one MySQL database, seven React portals.

| Portal | Folder | Dev port | Who uses it |
|---|---|---|---|
| Super Admin | `admin/` | 5173 | Company owner / oversight of every portal |
| Client | `client/` | 5174 | Client companies (finance, invoices, leads, payroll, work) |
| Employee | `employee/` | 5175 | Staff (attendance, leave, payslips, tasks, emergency button) |
| HR | `HR/` | 5176 | Recruitment, joining, interviews, SOPs, emergency response |
| IT | `IT/` | 5177 | IT assets, tickets, onboarding |
| Sales | `Sales/` | 5178 | Calls, leads, invoices, inventory, field sales |
| EVS (Employee Verification) | `employee-verification-system/frontend/frontend/` | 5180 | Background verification, SSO from HR |
| **Backend API** | `backend/` | **5000** | Express + MySQL, serves every portal |

The former Python services (EVS FastAPI, HR Robo AI-interview, Smart Attendance Flask) now run
**natively inside `backend/`** — there is nothing to install besides Node and MySQL.

---

## 1. Prerequisites

| Tool | Version | Check |
|---|---|---|
| Node.js | 20 LTS or newer (tested on 24) | `node -v` |
| npm | 10+ | `npm -v` |
| MySQL | 8.0 | `mysql --version` |
| Git | any | `git --version` |

---

## 2. Clone

```bash
git clone https://github.com/Ahaan99/HRMS_PROJECT_DEPLOY.git
cd HRMS_PROJECT_DEPLOY
```

---

## 3. Database

Create an empty database. Tables, indexes, migrations and the Super Admin account are
created automatically the first time the backend starts.

```sql
CREATE DATABASE hrms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

For production, do **not** use `root`:

```sql
CREATE USER 'hrms_app'@'localhost' IDENTIFIED BY 'STRONG_RANDOM_PASSWORD';
GRANT ALL PRIVILEGES ON hrms_db.* TO 'hrms_app'@'localhost';
FLUSH PRIVILEGES;
```

---

## 4. Backend setup

```bash
cd backend
npm install
```

Create the env file from the template and fill it in:

```bash
# Windows
copy .env.example .env
# macOS / Linux
cp .env.example .env
```

Minimum values to edit in `backend/.env`:

```ini
PORT=5000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root            # or hrms_app in production
DB_PASSWORD=YOUR_DB_PASSWORD
DB_NAME=hrms_db

# generate: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
JWT_SECRET=LONG_RANDOM_STRING
SALES_JWT_SECRET=ANOTHER_LONG_RANDOM_STRING

# Seeded on first start - change these before you deploy
SUPER_ADMIN_EMAIL=admin@hrms.com
SUPER_ADMIN_PASSWORD=CHANGE_ME

# EVS single sign-on (must match VITE_EVS_SSO_KEY in the admin/HR portals)
EVS_SSO_KEY=RANDOM_STRING
EVS_FRONTEND_URL=http://localhost:5180
```

Optional: `EMAIL_*` (SMTP for notifications), `GROQ_API_KEY` (AI features),
`TWILIO_*` (OTP SMS). Everything degrades gracefully when blank.

Start it:

```bash
npm run dev          # development (nodemon, auto-restart)
npm start            # production
```

First boot prints `Database + tables ready` and `Server running on port 5000`.
Health check: <http://localhost:5000/api/health>

Useful backend scripts:

| Command | What it does |
|---|---|
| `npm run db:setup` | Create/upgrade the full schema without starting the server (CI / first prod DB) |
| `npm run db:migrate` | Apply `backend/migrations/*.sql` (each runs once; also happens automatically on boot) |
| `npm run check` | Import every module and list mounted routes without listening |

---

## 5. Frontend portals

Each portal is an independent Vite + React app. Install and run the ones you need.

```bash
# from the repo root - repeat for admin, client, employee, HR, IT, Sales
cd admin
npm install
npm run dev
```

```bash
# EVS portal
cd employee-verification-system/frontend/frontend
npm install
npm run dev
```

Every portal already ships a `.env` pointing at `http://localhost:5000/api`, so no
frontend configuration is needed for local development.

Open <http://localhost:5173> and sign in with the `SUPER_ADMIN_EMAIL` /
`SUPER_ADMIN_PASSWORD` you set in `backend/.env`. Create HR / IT / Sales / Client /
Employee accounts from the Super Admin portal; each then logs into its own portal.

### Run everything at once (Windows)

Open one terminal per app, or from the repo root:

```bat
start "backend"  cmd /k "cd backend && npm run dev"
start "admin"    cmd /k "cd admin && npm run dev"
start "client"   cmd /k "cd client && npm run dev"
start "employee" cmd /k "cd employee && npm run dev"
start "HR"       cmd /k "cd HR && npm run dev"
start "IT"       cmd /k "cd IT && npm run dev"
start "Sales"    cmd /k "cd Sales && npm run dev"
start "EVS"      cmd /k "cd employee-verification-system\frontend\frontend && npm run dev"
```

---

## 6. Production deployment

### 6.1 Backend

1. Set `NODE_ENV=production` and fill **all** of these in `backend/.env` — the server
   **refuses to start** in production while any of them is a default value:
   `JWT_SECRET`, `SALES_JWT_SECRET`, `SUPER_ADMIN_PASSWORD`, `MANAGER_PASSWORD`,
   `TL_PASSWORD`, `DB_PASSWORD`, and `CORS_ORIGINS`.
2. `CORS_ORIGINS` is the comma-separated list of every portal's public origin:
   ```ini
   CORS_ORIGINS=https://admin.your-domain.com,https://client.your-domain.com,https://employee.your-domain.com,https://hr.your-domain.com,https://it.your-domain.com,https://sales.your-domain.com,https://evs.your-domain.com
   ```
3. Run under a process manager and put a reverse proxy (nginx / Apache) with TLS in front of port 5000:
   ```bash
   npm install -g pm2
   pm2 start server.js --name hrms-backend
   pm2 save
   ```
4. Serve `backend/uploads/` from persistent storage and back up `hrms_db` nightly.

### 6.2 Portals

For each portal, copy the template, set your backend domain, then build:

```bash
cd admin
cp .env.production.example .env.production     # edit VITE_API_BASE_URL etc.
npm run build                                  # output in dist/
```

Upload each `dist/` to its own (sub)domain. The apps are SPAs, so the host must
rewrite unknown paths to `index.html` (an `.htaccess` is included in each `dist/`
when built from these templates; for nginx use `try_files $uri /index.html;`).

`VITE_EVS_SSO_KEY` in the admin/HR portals must equal `EVS_SSO_KEY` in the backend.

---

## 7. Project layout

```
backend/
  app.js               express app - every /api mount is here
  server.js            boot: DB init -> schema -> migrations -> seeds -> listen
  config/              db, env, security guards, schema bootstrap, seeds
  middleware/          auth (per-portal JWT), helmet + rate limits, uploads
  modules/             one folder per feature (superAdmin, hr, client, sales, evs, hrRobo, attendance, emergency, ...)
  migrations/          idempotent .sql, applied once, tracked in schema_migrations
  scripts/             db:setup, db:migrate, boot-check and the QA harnesses (_xcheck-*, _smoke-*, _sec-sweep)
admin/ client/ employee/ HR/ IT/ Sales/     Vite + React portals (src/pages, src/components, src/services)
employee-verification-system/frontend/frontend/   EVS portal
```

---

## 8. Verifying a build (QA harnesses)

All run from `backend/` against a running local backend:

```bash
node scripts/_xcheck-routes.mjs      # every frontend API call has a backend route
node scripts/_xcheck-dataflow.mjs    # every table a portal writes is readable by Super Admin
node scripts/_sec-sweep.mjs          # static security sweep
node scripts/_smoke-oversight.mjs    # live login / oversight / emergency / rate-limit smoke test
node scripts/_build-all.mjs          # production build of all 7 portals
```

---

## 9. Troubleshooting

| Symptom | Fix |
|---|---|
| `REFUSING TO START` on boot | You are in `NODE_ENV=production` with a default secret — the message lists exactly which variables to set |
| `ER_ACCESS_DENIED_ERROR` | Wrong `DB_USER` / `DB_PASSWORD` in `backend/.env` |
| `Port 5000 is already in use` | Another backend is running: `netstat -ano \| findstr :5000` then `taskkill /F /PID <pid>` (Windows) or `lsof -i :5000` (macOS/Linux) |
| Portal shows "Network Error" | Backend not running, or `VITE_API_BASE_URL` in that portal's `.env` is wrong |
| Login works locally but not in production | Portal origin missing from `CORS_ORIGINS` |
| `429 Too Many Requests` on login | Rate limit: 20 attempts per 15 minutes per IP — wait or restart the backend |
| Export to Excel opens as text | Rebuild the admin portal — Excel export requires the current `admin/src/utils/exportUtils.js` |

---

## License

Proprietary. All rights reserved.
