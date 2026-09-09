# HRMS Production Deployment Guide

Three portals ship from this repo:

| Portal | Tech | Port (internal) |
|---|---|---|
| HRMS backend (superadmin/HR/employee/client/sales APIs + dashboards data) | Node.js (Express) | 5000 |
| HRMS frontend (React) | Vite build → static files | served by nginx |
| Smart-Attendance (face/OTP/WiFi attendance) | Python (Flask + waitress) | 5050 |

Databases: MySQL — `hrms_db` and `smart_attendance`.

---

## 1. Server prerequisites (Ubuntu example)

```bash
sudo apt update
sudo apt install -y nginx mysql-server python3 python3-pip nodejs npm
sudo npm install -g pm2
# python deps (includes dlib/face_recognition build deps)
sudo apt install -y build-essential cmake libopenblas-dev liblapack-dev
pip3 install flask waitress mysql-connector-python python-dotenv bcrypt \
             face_recognition opencv-python-headless numpy requests
```

## 2. MySQL setup (do NOT use root in production)

```sql
CREATE DATABASE hrms_db;
CREATE DATABASE smart_attendance;
CREATE USER 'hrms_app'@'localhost' IDENTIFIED BY 'STRONG_RANDOM_PASSWORD';
GRANT ALL PRIVILEGES ON hrms_db.* TO 'hrms_app'@'localhost';
GRANT ALL PRIVILEGES ON smart_attendance.* TO 'hrms_app'@'localhost';
FLUSH PRIVILEGES;
```

Nightly backup (crontab -e):

```
0 2 * * * mysqldump -u hrms_app -pSTRONG_RANDOM_PASSWORD --databases hrms_db smart_attendance | gzip > /var/backups/hrms-$(date +\%F).sql.gz
```

## 3. Environment files (never commit these)

- `backen/.env` — DB creds (hrms_app user), `JWT_SECRET` (long random),
  Twilio, `SMART_ATTENDANCE_KEY`, and add:
  `CORS_ORIGINS=https://hrms.yourdomain.com,https://attendance.yourdomain.com`
- `smart-Attendance-main/.../backend/.env` — copy from `.env.example`:
  MySQL creds, `SECRET_KEY` (generate: `python3 -c "import secrets; print(secrets.token_hex(32))"`),
  office GPS/subnet.
- `client/.env.production` — copy from `.env.production.example`, set your API domain.

Rotate the MySQL password and JWT secret before going live — the old dev
values were previously committed to git history.

## 4. Build the frontend

```bash
cd client
npm install
npm run build        # outputs client/dist
```

## 5. Start backends with pm2

```bash
cd "HRMS Merging"
pm2 start ecosystem.config.cjs
pm2 save && pm2 startup   # auto-start on reboot
```

## 6. nginx + HTTPS (required — camera/GPS do not work over plain HTTP)

```nginx
# /etc/nginx/sites-available/hrms
server {
    server_name hrms.yourdomain.com;
    root /var/www/hrms/client/dist;          # React build
    index index.html;
    location / { try_files $uri /index.html; }
    location /api/ { proxy_pass http://127.0.0.1:5000; proxy_set_header Host $host; }
    location /socket.io/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

server {
    server_name attendance.yourdomain.com;
    location / {
        proxy_pass http://127.0.0.1:5050;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $remote_addr;
        client_max_body_size 10m;            # base64 face images
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/hrms /etc/nginx/sites-enabled/
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d hrms.yourdomain.com -d attendance.yourdomain.com
sudo systemctl reload nginx
```

## 7. Post-deploy configuration

- In the Smart-Attendance admin panel → set the HRMS sync URL to
  `https://hrms.yourdomain.com` (it defaults to 127.0.0.1:5000 — fine if
  both run on the same server).
- Change the seeded admin password (`9999999999` / `admin123`) immediately.
- Set the office GPS coordinates/radius and WiFi subnet in the backend `.env`
  for the real office location.
- Delete `backend/migrate_mongo_to_mysql.py` once migration is final
  (re-running it restores intentionally deleted records).

## 8. Smoke test checklist

- [ ] `https://hrms.yourdomain.com` loads, superadmin/HR/employee logins work
- [ ] `https://attendance.yourdomain.com` loads, camera opens (HTTPS OK)
- [ ] Face attendance punch appears in Superadmin/HR dashboard
- [ ] `pm2 status` shows both apps online; `pm2 logs` clean
- [ ] Reboot server once: everything comes back automatically
