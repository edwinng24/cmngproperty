#!/usr/bin/env node
/**
 * One-command bootstrap. Idempotent — safe to run on every deploy, and safe to
 * re-run by hand.
 *
 *   node scripts/setup.mjs          ensure config + schema
 *   node scripts/setup.mjs --full   also create the database, user and admin
 *
 * Plain mode (what release.sh runs every deploy):
 *   - generates APP_ENCRYPTION_KEY into .env.local if it is missing
 *   - applies any pending migrations
 *
 * --full additionally, for a first deploy:
 *   - creates the MySQL database and user, generating a password
 *   - creates an admin account with a generated password, printed once
 *
 * Nothing here ever overwrites an existing value. APP_ENCRYPTION_KEY in
 * particular is generate-once: replacing it would make every stored SSN
 * permanently unreadable.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, appendFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes, scrypt as scryptCb } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb);
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const ENV = join(root, ".env.local");
const full = process.argv.includes("--full");

const log = (m) => console.log(`    ${m}`);
const step = (m) => console.log(`\n\x1b[1m${m}\x1b[0m`);

/* ─────────────────────────────── .env.local ──────────────────────────────── */

function readEnvFile() {
  if (!existsSync(ENV)) return {};
  const out = {};
  for (const line of readFileSync(ENV, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#") || !t.includes("=")) continue;
    const i = t.indexOf("=");
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[t.slice(0, i).trim()] = v;
  }
  return out;
}

/** Appends only keys that are absent or blank. Never rewrites an existing one. */
function ensureEnv(pairs, note) {
  const current = readEnvFile();
  const missing = Object.entries(pairs).filter(([k]) => !current[k]);
  if (missing.length === 0) return {};
  if (!existsSync(ENV)) writeFileSync(ENV, "");
  appendFileSync(
    ENV,
    `\n# ${note} — added by scripts/setup.mjs ${new Date().toISOString().slice(0, 10)}\n` +
      missing.map(([k, v]) => `${k}=${v}`).join("\n") +
      "\n",
  );
  return Object.fromEntries(missing);
}

/* ──────────────────────────────── mysql ─────────────────────────────────── */

/**
 * An admin mysql invocation. Ubuntu's root uses auth_socket, so `sudo mysql`
 * works with no password; a local Homebrew install usually answers to
 * `mysql -u root`. Tries both before giving up.
 */
function adminMysql() {
  for (const [cmd, args] of [
    ["mysql", ["-u", "root"]],
    ["sudo", ["-n", "mysql"]],
  ]) {
    try {
      execFileSync(cmd, [...args, "-e", "SELECT 1"], { stdio: "ignore" });
      return (sql) => execFileSync(cmd, [...args, "-e", sql], { stdio: "pipe" });
    } catch {
      /* try the next one */
    }
  }
  return null;
}

/* ──────────────────────────────── password ──────────────────────────────── */

// Ambiguous characters left out: these get read off a screen and retyped.
const ALPHABET = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const generatePassword = (len = 24) =>
  Array.from(randomBytes(len), (b) => ALPHABET[b % ALPHABET.length]).join("");

async function hashPassword(password) {
  // Must match hashPassword() in src/lib/crypto.ts.
  const salt = randomBytes(16);
  const SCRYPT = { N: 32768, r: 8, p: 1, maxmem: 96 * 1024 * 1024 };
  const hash = await scrypt(password, salt, 64, SCRYPT);
  return ["scrypt", SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString("base64"), hash.toString("base64")].join("$");
}

/* ──────────────────────────────── the steps ─────────────────────────────── */

const notices = [];

step("==> Configuration");

const added = ensureEnv(
  { APP_ENCRYPTION_KEY: randomBytes(32).toString("base64") },
  "Encrypts applicant SSNs at rest",
);
if (added.APP_ENCRYPTION_KEY) {
  log("generated APP_ENCRYPTION_KEY");
  notices.push(
    "APP_ENCRYPTION_KEY was generated and written to .env.local.\n" +
      "      Back it up somewhere OTHER than the database it protects —\n" +
      "      without it, stored Social Security numbers cannot be read.",
  );
} else {
  log("APP_ENCRYPTION_KEY already set — left alone");
}

if (full) {
  const env = readEnvFile();
  const dbName = env.DB_NAME || "cmngproperty";
  const dbUser = env.DB_USER || "cmng";
  const dbPass = env.DB_PASSWORD || generatePassword(20);

  const addedDb = ensureEnv(
    {
      DB_HOST: env.DB_HOST || "127.0.0.1",
      DB_PORT: env.DB_PORT || "3306",
      DB_NAME: dbName,
      DB_USER: dbUser,
      DB_PASSWORD: dbPass,
    },
    "Database connection",
  );
  if (Object.keys(addedDb).length) log(`wrote DB settings for ${dbUser}@${dbName}`);

  step("==> Database and user");
  const mysql = adminMysql();
  const sql =
    `CREATE DATABASE IF NOT EXISTS \`${dbName}\` ` +
    "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; " +
    `CREATE USER IF NOT EXISTS '${dbUser}'@'localhost' IDENTIFIED BY '${dbPass}'; ` +
    `ALTER USER '${dbUser}'@'localhost' IDENTIFIED BY '${dbPass}'; ` +
    `GRANT ALL PRIVILEGES ON \`${dbName}\`.* TO '${dbUser}'@'localhost'; ` +
    "FLUSH PRIVILEGES;";

  if (mysql) {
    mysql(sql);
    log(`database "${dbName}" and user "${dbUser}" ready`);
  } else {
    // No admin access is a perfectly normal state on a managed host.
    console.log(
      "\n    Could not reach MySQL as an administrator. Run this yourself,\n" +
        "    then re-run setup:\n\n" +
        `    sudo mysql -e "${sql}"\n`,
    );
    process.exit(1);
  }
}

step("==> Schema");
const env = readEnvFile();
if (!env.DB_USER || !env.DB_NAME) {
  log("no database configured — skipping (run with --full to set one up)");
} else {
  // Delegate rather than duplicate: migrate.mjs owns the migrations table.
  execFileSync(process.execPath, [join(root, "scripts", "migrate.mjs")], {
    stdio: "inherit",
    cwd: root,
  });

  if (full) {
    step("==> Admin account");
    const mysql2 = await import("mysql2/promise");
    const conn = await mysql2.default.createConnection({
      host: env.DB_HOST || "127.0.0.1",
      port: Number(env.DB_PORT || 3306),
      user: env.DB_USER,
      password: env.DB_PASSWORD ?? "",
      database: env.DB_NAME,
    });
    const [rows] = await conn.execute("SELECT COUNT(*) AS n FROM admin_users");
    if (Number(rows[0].n) > 0) {
      log(`${rows[0].n} admin account(s) already exist — left alone`);
    } else {
      const email = env.ADMIN_EMAIL || "info@cmngproperty.com";
      const password = generatePassword();
      await conn.execute(
        "INSERT INTO admin_users (email, name, password_hash) VALUES (?, ?, ?)",
        [email, "Administrator", await hashPassword(password)],
      );
      log(`created ${email}`);
      notices.push(
        "Admin account created. This password is shown once:\n\n" +
          `        ${email}\n        ${password}\n\n` +
          "      Sign in at /admin and change it with:\n" +
          `        node scripts/create-admin.mjs "Your Name" ${email}`,
      );
    }
    await conn.end();
  }
}

if (notices.length) {
  console.log("\n\x1b[1;33m" + "─".repeat(68) + "\x1b[0m");
  for (const n of notices) console.log(`\n  \x1b[1m!\x1b[0m ${n}`);
  console.log("\n\x1b[1;33m" + "─".repeat(68) + "\x1b[0m");
}
console.log("\nSetup complete.\n");
