import "server-only";
import mysql from "mysql2/promise";

/**
 * mysql2's own parameter type. Using it rather than `unknown[]` is what makes
 * the overloads resolve, and it rejects `undefined` at compile time —
 * mysql2 throws "Bind parameters must not contain undefined" at runtime, and
 * a missing optional field is exactly how that happens.
 */
type Params = Parameters<mysql.Pool["execute"]>[1] & unknown[];

/**
 * MySQL connection pool, created once per process.
 *
 * Next's dev server hot-reloads modules, which would otherwise leak a new pool
 * on every edit until the connection limit is hit. Stashing it on globalThis
 * survives the reload.
 */
declare global {
  // eslint-disable-next-line no-var
  var __cmngPool: mysql.Pool | undefined;
}

function required(name: string): string {
  const v = process.env[name];
  if (v === undefined || v.trim() === "") {
    throw new Error(
      `${name} is not set. The database is required for the applications ` +
        "feature — see .env.local.example.",
    );
  }
  return v.trim();
}

export function pool(): mysql.Pool {
  if (!globalThis.__cmngPool) {
    globalThis.__cmngPool = mysql.createPool({
      host: process.env.DB_HOST?.trim() || "127.0.0.1",
      port: Number(process.env.DB_PORT?.trim() || 3306),
      user: required("DB_USER"),
      password: process.env.DB_PASSWORD ?? "",
      database: required("DB_NAME"),
      waitForConnections: true,
      connectionLimit: Number(process.env.DB_POOL_SIZE?.trim() || 5),
      // Return DECIMAL as string rather than float — see the cents comment in
      // the migration. Same reasoning applies on the way out.
      decimalNumbers: false,
      dateStrings: ["DATE"],
      timezone: "Z",
    });
  }
  return globalThis.__cmngPool;
}

/** SELECT returning rows. */
export async function query<T = Record<string, unknown>>(
  sql: string,
  params: Params = [],
): Promise<T[]> {
  const [rows] = await pool().execute<mysql.RowDataPacket[]>(sql, params);
  return rows as T[];
}

/** SELECT returning the first row, or null. */
export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  params: Params = [],
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

/** INSERT / UPDATE / DELETE. */
export async function execute(
  sql: string,
  params: Params = [],
): Promise<mysql.ResultSetHeader> {
  const [result] = await pool().execute<mysql.ResultSetHeader>(sql, params);
  return result;
}

/** True when the database is configured; lets pages degrade rather than crash. */
export function isConfigured(): boolean {
  return Boolean(process.env.DB_USER?.trim() && process.env.DB_NAME?.trim());
}
