import dotenv from "dotenv";
dotenv.config();

import http from "http";
import { Server } from "socket.io";

import app from "./app.js";
import { db } from "./config/db.js";
import { initDb } from "./config/initDb.js";
import { bootstrapSchemas } from "./config/schemaBootstrap.js";
import { seedSuperAdmin } from "./config/seedSuperAdmin.js";
import { seedMasters } from "./config/seedMasters.js";
import { assertProductionSecrets } from "./config/assertProductionSecrets.js";
import { startPayrollScheduler } from "./modules/superAdmin/payroll/adminPayroll.service.js";
import { startSalarySyncScheduler } from "./modules/salary/salary.controller.js";

/* CREATE HTTP SERVER */

const server = http.createServer(app);

/* SOCKET SERVER */

// Honor CORS_ORIGINS in production (same env var app.js uses).
// When unset (development), all origins are allowed as before.
const socketOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
  : "*";

const io = new Server(server, {
  cors: {
    origin: socketOrigins,
    methods: ["GET","POST"]
  }
});

/* PROCESS-LEVEL CRASH GUARDS (production safety)
   Without these, ANY unhandled promise rejection or sync throw
   outside Express kills the whole server process. Log and keep
   running; a process manager (pm2) should handle real restarts. */
process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
  // For truly unrecoverable states, exit so pm2 restarts cleanly.
  if (err && (err.code === "ERR_INTERNAL_ASSERTION" || err.fatal)) {
    process.exit(1);
  }
});

/* SOCKET EVENTS */

io.on("connection", (socket) => {

  console.log("User connected:", socket.id);

  socket.on("joinRoom", (conversationId) => {
    socket.join(conversationId);
  });

  socket.on("sendMessage", (data) => {
    io.to(data.conversationId).emit("receiveMessage", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });

});


// Retry helper: MySQL throws ER_LOCK_DEADLOCK (sqlState 40001) when two
// server instances run the same seeding INSERTs at the same moment.
// Deadlocks are transient — retrying after a short pause resolves them.
const withDeadlockRetry = async (label, fn, retries = 3) => {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isDeadlock =
        err && (err.sqlState === "40001" || err.code === "ER_LOCK_DEADLOCK");
      if (!isDeadlock || attempt > retries) throw err;
      console.warn(`${label}: deadlock, retrying (${attempt}/${retries})...`);
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
};

const startServer = async () => {
  try {
    assertProductionSecrets();

    await db.query("SELECT 1");
    console.log("MySQL Connected");

    await withDeadlockRetry("initDb", () => initDb());
    await withDeadlockRetry("schemaBootstrap", () => bootstrapSchemas());
    console.log("Database + tables ready");

    await withDeadlockRetry("seedSuperAdmin", () => seedSuperAdmin());
    await withDeadlockRetry("seedMasters", () => seedMasters());

    const PORT = process.env.PORT || 5000;

    // Friendly handling when another server instance already owns the port:
    // print a clear message instead of an unhandled crash loop.
    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.error(
          `Port ${PORT} is already in use by another server instance.\n` +
            `Stop it first (Windows):\n` +
            `  netstat -ano | findstr :${PORT}\n` +
            `  taskkill /PID <pid> /F\n` +
            `Then start the server again.`
        );
        process.exit(1);
      }
      throw err;
    });

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      startPayrollScheduler();
      startSalarySyncScheduler();
    });

  } catch (err) {
    console.error("Server start error FULL:", err);
    console.error("Error stack:", err.stack);
    process.exit(1);
  }
};

startServer();

