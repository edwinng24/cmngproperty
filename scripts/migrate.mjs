#!/usr/bin/env node
/**
 * Applies any migration in db/migrations that has not run yet, in filename
 * order, recording each in a `migrations` table. Safe to re-run.
 *
 *   node scripts/migrate.mjs
 *
 * Reads DB_* from the environment, or from .env.local if present.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

// Minimal .env.local reader so this works outside Next, which normally loads it.
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

for (const name of ["DB_USER", "DB_NAME"]) {
  if (!process.env[name]?.trim()) {
    console.error(`error: ${name} is not set (see .env.local.example)`);
    process.exit(1);
  }
}

const conn = await mysql.createConnection({
  host: process.env.DB_HOST?.trim() || "127.0.0.1",
  port: Number(process.env.DB_PORT?.trim() || 3306),
  user: process.env.DB_USER.trim(),
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME.trim(),
  multipleStatements: true,
});

await conn.query(`
  CREATE TABLE IF NOT EXISTS migrations (
    name       VARCHAR(190) NOT NULL PRIMARY KEY,
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

const [done] = await conn.query("SELECT name FROM migrations");
const applied = new Set(done.map((r) => r.name));

const dir = join(root, "db", "migrations");
const files = readdirSync(dir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

let ran = 0;
for (const file of files) {
  if (applied.has(file)) {
    console.log(`  = ${file}`);
    continue;
  }
  process.stdout.write(`  + ${file} ... `);
  const sql = readFileSync(join(dir, file), "utf8");
  try {
    await conn.query(sql);
    await conn.query("INSERT INTO migrations (name) VALUES (?)", [file]);
    ran += 1;
    console.log("ok");
  } catch (err) {
    console.log("FAILED");
    console.error(`\n${err.message}\n`);
    await conn.end();
    process.exit(1);
  }
}

console.log(
  ran === 0 ? "\nAlready up to date." : `\nApplied ${ran} migration(s).`,
);
await conn.end();
