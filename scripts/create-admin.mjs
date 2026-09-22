#!/usr/bin/env node
/**
 * Creates or updates an admin account.
 *
 *   node scripts/create-admin.mjs "Edwin Ng" edwin@example.com
 *
 * Prompts for the password rather than taking it as an argument, so it never
 * lands in shell history or `ps` output. Re-running for an existing address
 * resets that account's password.
 *
 * The hash format must stay identical to hashPassword() in src/lib/crypto.ts —
 * that file is the source of truth; this is a standalone copy because the
 * script runs outside Next's TypeScript pipeline.
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes, scrypt as scryptCb } from "node:crypto";
import { promisify } from "node:util";
import { createInterface } from "node:readline";
import mysql from "mysql2/promise";

const scrypt = promisify(scryptCb);
// maxmem raised: 128 * N * r is 33.5MB here, over Node's 32MB default.
const SCRYPT = { N: 32768, r: 8, p: 1, maxmem: 96 * 1024 * 1024 };

async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64, SCRYPT);
  return [
    "scrypt",
    SCRYPT.N,
    SCRYPT.r,
    SCRYPT.p,
    salt.toString("base64"),
    hash.toString("base64"),
  ].join("$");
}

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const envFile = join(root, ".env.local");
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#") || !t.includes("=")) continue;
    const i = t.indexOf("=");
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (process.env[k] === undefined) process.env[k] = v;
  }
}

const [name, email] = process.argv.slice(2);
if (!name || !email) {
  console.error('usage: node scripts/create-admin.mjs "Full Name" email@example.com');
  process.exit(1);
}

function ask(question, { hidden = false } = {}) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    if (hidden) {
      // Suppress echo so the password is not shown or left on screen.
      const onData = (char) => {
        if (["\n", "\r", ""].includes(char.toString())) {
          process.stdin.removeListener("data", onData);
        } else {
          process.stdout.write("[2K[200D" + question + "*".repeat(rl.line.length));
        }
      };
      process.stdin.on("data", onData);
    }
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer);
    });
  });
}

const password = await ask("Password: ", { hidden: true });
if (password.length < 12) {
  console.error("\nerror: use at least 12 characters — this account can read every application.");
  process.exit(1);
}
const again = await ask("Confirm:  ", { hidden: true });
if (password !== again) {
  console.error("\nerror: passwords do not match");
  process.exit(1);
}

const conn = await mysql.createConnection({
  host: process.env.DB_HOST?.trim() || "127.0.0.1",
  port: Number(process.env.DB_PORT?.trim() || 3306),
  user: process.env.DB_USER.trim(),
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME.trim(),
});

const hash = await hashPassword(password);
const [res] = await conn.execute(
  `INSERT INTO admin_users (email, name, password_hash)
        VALUES (?, ?, ?)
   ON DUPLICATE KEY UPDATE name = VALUES(name),
                           password_hash = VALUES(password_hash),
                           is_active = 1`,
  [email.trim().toLowerCase(), name.trim(), hash],
);

console.log(
  res.affectedRows > 1
    ? `Updated ${email} — password reset.`
    : `Created ${email}. Sign in at /admin/login`,
);
await conn.end();
