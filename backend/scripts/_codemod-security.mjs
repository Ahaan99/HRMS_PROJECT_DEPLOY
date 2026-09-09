import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const B = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function edit(rel, ops) {
  const p = path.join(B, rel);
  const raw = fs.readFileSync(p, "utf8");
  const crlf = raw.includes("\r\n");
  let s = raw.replace(/\r\n/g, "\n");
  for (const [find, repl, count = 1] of ops) {
    const n = s.split(find).length - 1;
    if (n !== count) throw new Error(`${rel}: expected ${count} match(es) of ${JSON.stringify(find.slice(0, 60))}, found ${n}`);
    s = s.split(find).join(repl);
  }
  fs.writeFileSync(p, crlf ? s.replace(/\n/g, "\r\n") : s);
  console.log("ok", rel);
}

edit("app.js", [
  [
    'import { errorMiddleware } from "./middleware/error.middleware.js";',
    'import { errorMiddleware } from "./middleware/error.middleware.js";\nimport { securityHeaders, authRateLimit } from "./middleware/security.middleware.js";',
  ],
  [
    'app.use(cors({ origin: corsOrigins, credentials: true }));',
    'app.use(securityHeaders);\napp.use(cors({ origin: corsOrigins, credentials: true }));\napp.use(authRateLimit);',
  ],
  [
    'app.use(express.json());\n',
    'app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || "5mb" }));\n',
  ],
]);

edit("server.js", [
  [
    'import { seedMasters } from "./config/seedMasters.js";',
    'import { seedMasters } from "./config/seedMasters.js";\nimport { assertProductionSecrets } from "./config/assertProductionSecrets.js";',
  ],
  [
    'const startServer = async () => {\n  try {\n',
    'const startServer = async () => {\n  try {\n    assertProductionSecrets();\n',
  ],
]);

edit("modules/otpAuth/otpAuth.controller.js", [
  ['import jwt from "jsonwebtoken";', 'import jwt from "jsonwebtoken";\nimport crypto from "crypto";'],
  ['String(Math.floor(100000 + Math.random() * 900000))', 'String(crypto.randomInt(100000, 1000000))'],
]);

edit("modules/superAdmin/auth/superAdminAuth.controller.js", [
  ['String(Math.floor(100000 + Math.random() * 900000))', 'String(crypto.randomInt(100000, 1000000))'],
]);
