import "server-only";
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  scrypt as scryptCb,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

/* ───────────────────────────── password hashing ─────────────────────────── */

// scrypt from node:crypto rather than bcrypt or argon2: no native module to
// compile on the server, and it is a memory-hard KDF, which bcrypt is not.
// N=2^15 costs ~50ms per verify on this hardware — slow enough to make
// offline cracking expensive, fast enough for a login form.
const SCRYPT = { N: 32768, r: 8, p: 1 } as const;
const KEY_LEN = 64;

// scrypt needs roughly 128 * N * r bytes — 33.5MB at these parameters, which
// exceeds Node's 32MB default and throws ERR_CRYPTO_INVALID_SCRYPT_PARAMS.
// Raise the ceiling rather than weakening the cost factor.
const MAXMEM = 96 * 1024 * 1024;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, KEY_LEN, { ...SCRYPT, maxmem: MAXMEM });
  return [
    "scrypt",
    SCRYPT.N,
    SCRYPT.r,
    SCRYPT.p,
    salt.toString("base64"),
    hash.toString("base64"),
  ].join("$");
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, n, r, p, saltB64, hashB64] = parts;

  const salt = Buffer.from(saltB64, "base64");
  const expected = Buffer.from(hashB64, "base64");
  const actual = await scrypt(password, salt, expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: MAXMEM,
  });
  // Constant-time: a plain === leaks how much of the hash matched via timing.
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/* ────────────────────────── field-level encryption ──────────────────────── */

/**
 * AES-256-GCM for the one field that genuinely needs it: the applicant's SSN.
 *
 * The key lives in APP_ENCRYPTION_KEY, outside the database, so a dump of the
 * database alone does not reveal it. GCM rather than CBC because it
 * authenticates: a tampered ciphertext fails to decrypt instead of quietly
 * producing different plaintext.
 *
 * Stored layout: iv(12) || authTag(16) || ciphertext
 */
function encryptionKey(): Buffer {
  const raw = process.env.APP_ENCRYPTION_KEY?.trim();
  if (!raw) {
    throw new Error(
      "APP_ENCRYPTION_KEY is not set. Generate one with: " +
        "openssl rand -base64 32",
    );
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error(
      `APP_ENCRYPTION_KEY must decode to 32 bytes, got ${key.length}. ` +
        "Generate one with: openssl rand -base64 32",
    );
  }
  return key;
}

export function encryptField(plaintext: string): Buffer {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const body = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]);
}

export function decryptField(blob: Buffer): string {
  const iv = blob.subarray(0, 12);
  const tag = blob.subarray(12, 28);
  const body = blob.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(body), decipher.final()]).toString(
    "utf8",
  );
}

/** Whether encryption is available, so the form can refuse rather than crash. */
export function encryptionAvailable(): boolean {
  try {
    encryptionKey();
    return true;
  } catch {
    return false;
  }
}

/* ────────────────────────────── session tokens ──────────────────────────── */

export function newSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Only the hash is stored, so a leaked row cannot be replayed as a session. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
