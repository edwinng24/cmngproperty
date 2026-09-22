import "server-only";
import { execute, query, queryOne } from "./db";
import { decryptField, encryptField } from "./crypto";
import type { Property } from "./properties";
import { totalDueCents } from "./properties";

/* ────────────────────────────────── shapes ──────────────────────────────── */

export type Applicant = {
  last: string;
  first: string;
  middle?: string;
  other_names?: string;
  other_id?: string;
  dob?: string;
  work_phone?: string;
  home_phone?: string;
  email?: string;
  dl_number?: string;
  dl_expiration?: string;
  dl_state?: string;
};

export type ResidenceEntry = {
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  date_in?: string;
  date_out?: string;
  manager_name?: string;
  manager_phone?: string;
  reason_for_moving?: string;
};

export type EmploymentEntry = {
  applicant: 1 | 2;
  which: "present" | "last";
  occupation?: string;
  employer_name?: string;
  employer_address?: string;
  employer_city_state_zip?: string;
  supervisor_name?: string;
  supervisor_phone?: string;
  how_long?: string;
};

export type Income = {
  applicant1_cents?: number | null;
  applicant2_cents?: number | null;
  other_cents?: number | null;
  other_source?: string;
  total_cents?: number | null;
};

export type Occupant = { name?: string; relationship?: string; age?: string };
export type Vehicle = {
  make?: string;
  model?: string;
  year?: string;
  state_plate?: string;
};

export type ApplicationInput = {
  rental_term: "month_to_month" | "lease";
  lease_from?: string | null;
  lease_to?: string | null;
  applicants: Applicant[];
  /** Plaintext on the way in; encrypted before it touches the database. */
  ssns: string[];
  rental_history: ResidenceEntry[];
  employment: EmploymentEntry[];
  income: Income;
  occupants: Occupant[];
  total_adults?: number | null;
  total_children?: number | null;
  vehicles: Vehicle[];
  other_vehicles?: string | null;
  has_pets?: boolean | null;
  pets_describe?: string | null;
  has_liquid_furniture?: boolean | null;
  liquid_furniture_describe?: string | null;
  ever_evicted?: boolean | null;
  ever_bankruptcy?: boolean | null;
  ever_drug_conviction?: boolean | null;
  signature_1: string;
  signature_2?: string | null;
  certification_ack: boolean;
  screening_fee_ack: boolean;
  applicant_email: string;
  applicant_phone?: string | null;
};

export type ApplicationRow = {
  id: number;
  property_id: number;
  property_slug: string;
  property_address: string;
  monthly_rent_cents: number;
  deposit_cents: number | null;
  credit_check_fee_cents: number | null;
  other_charges_cents: number | null;
  other_charges_label: string | null;
  total_due_cents: number | null;
  screening_fee_cents: number | null;
  rental_term: "month_to_month" | "lease";
  lease_from: string | null;
  lease_to: string | null;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string | null;
  applicants: Applicant[];
  rental_history: ResidenceEntry[] | null;
  employment: EmploymentEntry[] | null;
  income: Income | null;
  occupants: Occupant[] | null;
  total_adults: number | null;
  total_children: number | null;
  vehicles: Vehicle[] | null;
  other_vehicles: string | null;
  has_pets: number | null;
  pets_describe: string | null;
  has_liquid_furniture: number | null;
  liquid_furniture_describe: string | null;
  ever_evicted: number | null;
  ever_bankruptcy: number | null;
  ever_drug_conviction: number | null;
  signature_1: string;
  signed_1_at: string;
  signature_2: string | null;
  signed_2_at: string | null;
  status: "new" | "reviewing" | "approved" | "declined" | "withdrawn";
  admin_notes: string | null;
  email_sent: number;
  submitted_at: string;
  ip: string | null;
};

export { STATUSES } from "./statuses";

/* ──────────────────────────────── persistence ───────────────────────────── */

// ssns_encrypted is deliberately excluded. It is only ever read by
// getApplicationSsns(), so a careless `SELECT *` cannot leak it into a log,
// a server component payload or an error report.
const COLUMNS = `id, property_id, property_slug, property_address,
  monthly_rent_cents, deposit_cents, credit_check_fee_cents,
  other_charges_cents, other_charges_label, total_due_cents,
  screening_fee_cents, rental_term, lease_from, lease_to,
  applicant_name, applicant_email, applicant_phone, applicants,
  rental_history, employment, income, occupants, total_adults, total_children,
  vehicles, other_vehicles, has_pets, pets_describe, has_liquid_furniture,
  liquid_furniture_describe, ever_evicted, ever_bankruptcy,
  ever_drug_conviction, signature_1, signed_1_at, signature_2, signed_2_at,
  status, admin_notes, email_sent, submitted_at, ip`;

const bit = (v: boolean | null | undefined) =>
  v === null || v === undefined ? null : v ? 1 : 0;

export async function createApplication(
  property: Property,
  input: ApplicationInput,
  meta: { ip?: string | null } = {},
): Promise<number> {
  const a1 = input.applicants[0];
  const name = [a1.first, a1.middle, a1.last].filter(Boolean).join(" ");

  const realSsns = input.ssns.filter((s) => s && s.trim() !== "");
  const ssnBlob =
    realSsns.length > 0 ? encryptField(JSON.stringify(input.ssns)) : null;

  const res = await execute(
    `INSERT INTO applications (
       property_id, property_slug, property_address, monthly_rent_cents,
       deposit_cents, credit_check_fee_cents, other_charges_cents,
       other_charges_label, total_due_cents, screening_fee_cents,
       rental_term, lease_from, lease_to,
       applicant_name, applicant_email, applicant_phone,
       applicants, ssns_encrypted, rental_history, employment, income,
       occupants, total_adults, total_children, vehicles, other_vehicles,
       has_pets, pets_describe, has_liquid_furniture,
       liquid_furniture_describe, ever_evicted, ever_bankruptcy,
       ever_drug_conviction, signature_1, signed_1_at, signature_2,
       signed_2_at, certification_ack, screening_fee_ack, ip
     ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),?,?,?,?,?)`,
    [
      property.id,
      property.slug,
      [
        property.address_line1,
        property.address_line2,
        `${property.city}, ${property.region} ${property.postal}`,
      ]
        .filter(Boolean)
        .join(", "),
      property.monthly_rent_cents,
      property.deposit_cents,
      property.credit_check_fee_cents,
      property.other_charges_cents,
      property.other_charges_label,
      totalDueCents(property),
      property.screening_fee_cents,
      input.rental_term,
      input.lease_from || null,
      input.lease_to || null,
      name,
      input.applicant_email,
      input.applicant_phone || null,
      JSON.stringify(input.applicants),
      ssnBlob,
      JSON.stringify(input.rental_history),
      JSON.stringify(input.employment),
      JSON.stringify(input.income),
      JSON.stringify(input.occupants),
      input.total_adults ?? null,
      input.total_children ?? null,
      JSON.stringify(input.vehicles),
      input.other_vehicles || null,
      bit(input.has_pets),
      input.pets_describe || null,
      bit(input.has_liquid_furniture),
      input.liquid_furniture_describe || null,
      bit(input.ever_evicted),
      bit(input.ever_bankruptcy),
      bit(input.ever_drug_conviction),
      input.signature_1,
      input.signature_2 || null,
      input.signature_2 ? new Date() : null,
      bit(input.certification_ack),
      bit(input.screening_fee_ack),
      meta.ip ?? null,
    ],
  );
  return res.insertId;
}

export async function markEmailSent(id: number): Promise<void> {
  await execute("UPDATE applications SET email_sent = 1 WHERE id = ?", [id]);
}

export async function listApplications(filter?: {
  propertyId?: number;
  status?: string;
}): Promise<ApplicationRow[]> {
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (filter?.propertyId) {
    where.push("property_id = ?");
    params.push(filter.propertyId);
  }
  if (filter?.status) {
    where.push("status = ?");
    params.push(filter.status);
  }
  return query<ApplicationRow>(
    `SELECT ${COLUMNS} FROM applications
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY submitted_at DESC`,
    params,
  );
}

export async function getApplication(
  id: number,
): Promise<ApplicationRow | null> {
  return queryOne<ApplicationRow>(
    `SELECT ${COLUMNS} FROM applications WHERE id = ?`,
    [id],
  );
}

/**
 * Decrypts the stored SSNs. Separate from getApplication() on purpose: this is
 * the only path to them, so every caller is an explicit, auditable decision.
 */
export async function getApplicationSsns(id: number): Promise<string[]> {
  const row = await queryOne<{ ssns_encrypted: Buffer | null }>(
    "SELECT ssns_encrypted FROM applications WHERE id = ?",
    [id],
  );
  if (!row?.ssns_encrypted) return [];
  try {
    return JSON.parse(decryptField(row.ssns_encrypted)) as string[];
  } catch {
    // Wrong or rotated APP_ENCRYPTION_KEY. Say so rather than showing blanks
    // that look like the applicant left the field empty.
    return ["(could not decrypt — check APP_ENCRYPTION_KEY)"];
  }
}

export async function updateApplicationStatus(
  id: number,
  status: string,
  notes: string | null,
): Promise<void> {
  await execute(
    "UPDATE applications SET status = ?, admin_notes = ? WHERE id = ?",
    [status, notes, id],
  );
}

export async function countsByStatus(): Promise<Record<string, number>> {
  const rows = await query<{ status: string; n: number }>(
    "SELECT status, COUNT(*) AS n FROM applications GROUP BY status",
  );
  return Object.fromEntries(rows.map((r) => [r.status, Number(r.n)]));
}
