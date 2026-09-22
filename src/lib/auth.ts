import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { execute, queryOne } from "./db";
import { hashToken, newSessionToken, verifyPassword } from "./crypto";

const COOKIE = "cmng_admin";
const SESSION_DAYS = 14;

export type AdminUser = {
  id: number;
  email: string;
  name: string;
};

/**
 * Verifies credentials and opens a session.
 *
 * Returns null for both "no such user" and "wrong password" — distinguishing
 * them tells an attacker which addresses are real.
 */
export async function login(
  email: string,
  password: string,
  meta: { ip?: string; userAgent?: string } = {},
): Promise<AdminUser | null> {
  const row = await queryOne<{
    id: number;
    email: string;
    name: string;
    password_hash: string;
    is_active: number;
  }>(
    "SELECT id, email, name, password_hash, is_active FROM admin_users WHERE email = ?",
    [email.trim().toLowerCase()],
  );

  if (!row || !row.is_active) {
    // Hash anyway so a missing account is not measurably faster than a wrong
    // password, which would let someone enumerate valid addresses by timing.
    await verifyPassword(password, "scrypt$32768$8$1$AAAA$AAAA");
    return null;
  }
  if (!(await verifyPassword(password, row.password_hash))) return null;

  const token = newSessionToken();
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await execute(
    `INSERT INTO admin_sessions (token_hash, user_id, expires_at, ip, user_agent)
     VALUES (?, ?, ?, ?, ?)`,
    [
      hashToken(token),
      row.id,
      expires,
      meta.ip ?? null,
      meta.userAgent?.slice(0, 255) ?? null,
    ],
  );
  await execute("UPDATE admin_users SET last_login_at = NOW() WHERE id = ?", [
    row.id,
  ]);

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });

  return { id: row.id, email: row.email, name: row.name };
}

export async function logout(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    await execute("DELETE FROM admin_sessions WHERE token_hash = ?", [
      hashToken(token),
    ]);
  }
  jar.delete(COOKIE);
}

/** The signed-in admin, or null. Expired sessions are treated as absent. */
export async function currentAdmin(): Promise<AdminUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;

  const row = await queryOne<{ id: number; email: string; name: string }>(
    `SELECT u.id, u.email, u.name
       FROM admin_sessions s
       JOIN admin_users u ON u.id = s.user_id
      WHERE s.token_hash = ? AND s.expires_at > NOW() AND u.is_active = 1`,
    [hashToken(token)],
  );
  return row ?? null;
}

/**
 * Gate for every admin page and action. Redirects rather than returning null,
 * so a caller cannot forget to check and leak the page.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

/** Housekeeping; safe to call from anywhere. */
export async function pruneExpiredSessions(): Promise<void> {
  await execute("DELETE FROM admin_sessions WHERE expires_at < NOW()");
}
