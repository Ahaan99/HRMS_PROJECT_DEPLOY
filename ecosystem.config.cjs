/**
 * PM2 process file — runs ALL HRMS portals in production.
 *
 *   npm install -g pm2
 *   pm2 start ecosystem.config.cjs
 *   pm2 save && pm2 startup     # auto-start on server reboot
 *
 * Logs:   pm2 logs
 * Status: pm2 status
 */
module.exports = {
  apps: [
    {
      name: "hrms-backend",
      cwd: "./backen",
      script: "app.js",
      env: { NODE_ENV: "production", PORT: 5000 },
      max_memory_restart: "512M",
      autorestart: true,
    },
    {
      name: "smart-attendance",
      cwd: "./smart-Attendance-main/smart-Attendance-main/Smart_Attendance/Smart_Attendance/backend",
      script: "serve_production.py",
      interpreter: "python",
      env: { PORT: 5050, THREADS: 8 },
      max_memory_restart: "1G",
      autorestart: true,
    },
    // The React client is a static build (client/dist) — serve it with
    // nginx or any static host; it does not need a pm2 process.
  ],
};
