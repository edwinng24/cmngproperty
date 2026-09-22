import "server-only";
import { execute, query, queryOne } from "./db";

export type Property = {
  id: number;
  slug: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  region: string;
  postal: string;
  monthly_rent_cents: number;
  deposit_cents: number | null;
  credit_check_fee_cents: number | null;
  other_charges_cents: number | null;
  other_charges_label: string | null;
  screening_fee_cents: number;
  bedrooms: string | null;
  bathrooms: string | null;
  available_from: string | null;
  description: string | null;
  is_active: number;
};

export type PropertyInput = Omit<Property, "id" | "slug"> & { slug?: string };

const COLUMNS = `id, slug, address_line1, address_line2, city, region, postal,
  monthly_rent_cents, deposit_cents, credit_check_fee_cents,
  other_charges_cents, other_charges_label, screening_fee_cents,
  bedrooms, bathrooms, available_from, description, is_active`;

/**
 * "Amount Due Prior to Occupancy" from the paper form: first month's rent,
 * deposit, credit-check fee and anything else, summed.
 */
export function totalDueCents(p: Property): number {
  return (
    p.monthly_rent_cents +
    (p.deposit_cents ?? 0) +
    (p.credit_check_fee_cents ?? 0) +
    (p.other_charges_cents ?? 0)
  );
}

/** "12 Oak Street, Apt 4, Springfield, IL 62704" */
export function formatAddress(p: Property): string {
  return [p.address_line1, p.address_line2, `${p.city}, ${p.region} ${p.postal}`]
    .filter(Boolean)
    .join(", ");
}

export function formatMoney(cents: number | null): string {
  if (cents === null) return "—";
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  });
}

/** "$1,850/mo" → 185000. Tolerates commas, $ and decimals. */
export function parseMoneyToCents(input: string): number | null {
  const cleaned = input.replace(/[$,\s]/g, "");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

/** URL-safe slug. "12 Oak St, Apt 4" -> "12-oak-st-apt-4" */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

/**
 * A slug not already taken, appending -2, -3 … as needed.
 * `excludeId` lets an edit keep its own slug.
 */
export async function uniqueSlug(
  base: string,
  excludeId?: number,
): Promise<string> {
  const root = slugify(base) || "property";
  for (let n = 1; n < 100; n++) {
    const candidate = n === 1 ? root : `${root}-${n}`;
    const clash = await queryOne<{ id: number }>(
      "SELECT id FROM properties WHERE slug = ?",
      [candidate],
    );
    if (!clash || clash.id === excludeId) return candidate;
  }
  // Practically unreachable; better than looping forever.
  return `${root}-${Date.now().toString(36)}`;
}

export async function listProperties(
  { activeOnly = false } = {},
): Promise<Property[]> {
  return query<Property>(
    `SELECT ${COLUMNS} FROM properties
      ${activeOnly ? "WHERE is_active = 1" : ""}
      ORDER BY is_active DESC, city, address_line1`,
  );
}

export async function getPropertyBySlug(slug: string): Promise<Property | null> {
  return queryOne<Property>(
    `SELECT ${COLUMNS} FROM properties WHERE slug = ?`,
    [slug],
  );
}

export async function getProperty(id: number): Promise<Property | null> {
  return queryOne<Property>(`SELECT ${COLUMNS} FROM properties WHERE id = ?`, [
    id,
  ]);
}

export async function createProperty(input: PropertyInput): Promise<number> {
  const slug = await uniqueSlug(
    input.slug || `${input.address_line1} ${input.city}`,
  );
  const res = await execute(
    `INSERT INTO properties
       (slug, address_line1, address_line2, city, region, postal,
        monthly_rent_cents, deposit_cents, credit_check_fee_cents,
        other_charges_cents, other_charges_label, screening_fee_cents,
        bedrooms, bathrooms,
        available_from, description, is_active)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      slug,
      input.address_line1,
      input.address_line2,
      input.city,
      input.region,
      input.postal,
      input.monthly_rent_cents,
      input.deposit_cents,
      input.credit_check_fee_cents,
      input.other_charges_cents,
      input.other_charges_label,
      input.screening_fee_cents,
      input.bedrooms,
      input.bathrooms,
      input.available_from,
      input.description,
      input.is_active,
    ],
  );
  return res.insertId;
}

export async function updateProperty(
  id: number,
  input: PropertyInput,
): Promise<void> {
  const slug = await uniqueSlug(
    input.slug || `${input.address_line1} ${input.city}`,
    id,
  );
  await execute(
    `UPDATE properties SET
       slug = ?, address_line1 = ?, address_line2 = ?, city = ?, region = ?,
       postal = ?, monthly_rent_cents = ?, deposit_cents = ?,
       credit_check_fee_cents = ?, other_charges_cents = ?,
       other_charges_label = ?, screening_fee_cents = ?, bedrooms = ?,
       bathrooms = ?, available_from = ?, description = ?, is_active = ?
     WHERE id = ?`,
    [
      slug,
      input.address_line1,
      input.address_line2,
      input.city,
      input.region,
      input.postal,
      input.monthly_rent_cents,
      input.deposit_cents,
      input.credit_check_fee_cents,
      input.other_charges_cents,
      input.other_charges_label,
      input.screening_fee_cents,
      input.bedrooms,
      input.bathrooms,
      input.available_from,
      input.description,
      input.is_active,
      id,
    ],
  );
}

/**
 * Properties with applications cannot be deleted — the foreign key is
 * RESTRICT on purpose, because an application must always resolve to the
 * property and terms it was made against. Deactivate instead.
 */
export async function deleteProperty(id: number): Promise<
  { ok: true } | { ok: false; reason: string }
> {
  const used = await queryOne<{ n: number }>(
    "SELECT COUNT(*) AS n FROM applications WHERE property_id = ?",
    [id],
  );
  if (used && Number(used.n) > 0) {
    return {
      ok: false,
      reason: `This property has ${used.n} application(s). Mark it inactive instead — deleting it would orphan them.`,
    };
  }
  await execute("DELETE FROM properties WHERE id = ?", [id]);
  return { ok: true };
}

export async function applicationCounts(): Promise<Map<number, number>> {
  const rows = await query<{ property_id: number; n: number }>(
    "SELECT property_id, COUNT(*) AS n FROM applications GROUP BY property_id",
  );
  return new Map(rows.map((r) => [r.property_id, Number(r.n)]));
}
