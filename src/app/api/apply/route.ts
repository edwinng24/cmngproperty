import { NextResponse } from "next/server";
import { getPropertyBySlug, formatMoney, totalDueCents } from "@/lib/properties";
import {
  createApplication,
  markEmailSent,
  type ApplicationInput,
} from "@/lib/applications";
import { encryptionAvailable } from "@/lib/crypto";
import { FROM, TO, esc, sendMail } from "@/lib/mailer";

/**
 * Rental application submission.
 *
 * Order matters: the row is written first, then the email is attempted. If
 * mail fails the application is still captured and `email_sent` stays 0, so
 * nothing an applicant typed is ever lost to a relay outage — the admin list
 * flags those rows instead.
 */

export const runtime = "nodejs";

const WINDOW_MS = 10 * 60_000;
const MAX_PER_WINDOW = 4;
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string) {
  const now = Date.now();
  const e = hits.get(ip);
  if (!e || now > e.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  e.count += 1;
  return e.count > MAX_PER_WINDOW;
}

const str = (v: unknown, max = 200) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";
const boolOrNull = (v: unknown) =>
  v === true || v === "yes" ? true : v === false || v === "no" ? false : null;
const intOrNull = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.trunc(n) : null;
};
const centsOrNull = (v: unknown) => {
  if (typeof v !== "string" && typeof v !== "number") return null;
  const cleaned = String(v).replace(/[$,\s]/g, "");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
};

/** Keeps arrays bounded so a crafted payload cannot balloon a JSON column. */
function arr<T>(v: unknown, max: number, map: (x: Record<string, unknown>) => T): T[] {
  if (!Array.isArray(v)) return [];
  return v
    .slice(0, max)
    .filter((x): x is Record<string, unknown> => typeof x === "object" && x !== null)
    .map(map);
}

function money(c: number | null | undefined) {
  return c === null || c === undefined ? "—" : formatMoney(c);
}

function buildText(id: number, address: string, input: ApplicationInput) {
  const L: string[] = [];
  L.push(`Rental application #${id}`, `Property: ${address}`, "");
  input.applicants.forEach((a, i) => {
    if (!a.last && !a.first) return;
    L.push(`APPLICANT ${i + 1}: ${[a.first, a.middle, a.last].filter(Boolean).join(" ")}`);
    L.push(`  DOB ${a.dob || "—"}   Home ${a.home_phone || "—"}   Work ${a.work_phone || "—"}`);
    L.push(`  Email ${a.email || "—"}   DL ${a.dl_number || "—"} (${a.dl_state || "—"}, exp ${a.dl_expiration || "—"})`);
    if (a.other_names) L.push(`  Other names: ${a.other_names}`);
    L.push("");
  });
  L.push("RENTAL HISTORY");
  input.rental_history.forEach((r, i) => {
    if (!r.address) return;
    L.push(`  ${i + 1}. ${r.address}, ${r.city || ""} ${r.state || ""} ${r.zip || ""}`);
    L.push(`     ${r.date_in || "?"} to ${r.date_out || "present"} — ${r.manager_name || "—"} ${r.manager_phone || ""}`);
    if (r.reason_for_moving) L.push(`     Reason: ${r.reason_for_moving}`);
  });
  L.push("", "EMPLOYMENT");
  input.employment.forEach((e) => {
    if (!e.employer_name && !e.occupation) return;
    L.push(`  Applicant ${e.applicant} (${e.which}): ${e.occupation || "—"} at ${e.employer_name || "—"}`);
    L.push(`     ${e.employer_address || ""} ${e.employer_city_state_zip || ""}`.trimEnd());
    L.push(`     Supervisor ${e.supervisor_name || "—"} ${e.supervisor_phone || ""} — ${e.how_long || "—"}`);
  });
  L.push("", "INCOME");
  L.push(`  Applicant 1: ${money(input.income.applicant1_cents)}`);
  L.push(`  Applicant 2: ${money(input.income.applicant2_cents)}`);
  L.push(`  Other: ${money(input.income.other_cents)} ${input.income.other_source || ""}`.trimEnd());
  L.push(`  TOTAL: ${money(input.income.total_cents)}`);
  L.push("", "OCCUPANTS");
  input.occupants.forEach((o) => {
    if (o.name) L.push(`  ${o.name} — ${o.relationship || "—"}, age ${o.age || "—"}`);
  });
  L.push(`  Adults: ${input.total_adults ?? "—"}   Children under 18: ${input.total_children ?? "—"}`);
  L.push("", "VEHICLES");
  input.vehicles.forEach((v) => {
    if (v.make || v.model)
      L.push(`  ${v.year || ""} ${v.make || ""} ${v.model || ""} — ${v.state_plate || "—"}`.trim());
  });
  if (input.other_vehicles) L.push(`  Other: ${input.other_vehicles}`);
  L.push("");
  const yn = (b: boolean | null | undefined) => (b === null || b === undefined ? "—" : b ? "YES" : "No");
  L.push(`Pets: ${yn(input.has_pets)} ${input.pets_describe || ""}`.trimEnd());
  L.push(`Liquid-filled furniture: ${yn(input.has_liquid_furniture)} ${input.liquid_furniture_describe || ""}`.trimEnd());
  L.push("", "DISCLOSURES");
  L.push(`  Party to an eviction: ${yn(input.ever_evicted)}`);
  L.push(`  Filed for bankruptcy: ${yn(input.ever_bankruptcy)}`);
  L.push(`  Drug-related conviction: ${yn(input.ever_drug_conviction)}`);
  L.push("", `Signed: ${input.signature_1}${input.signature_2 ? ` and ${input.signature_2}` : ""}`);
  L.push("", "SSNs are stored encrypted and are not included in this email.");
  return L.join("\n");
}

function buildHtml(id: number, address: string, input: ApplicationInput, adminUrl: string) {
  const a1 = input.applicants[0];
  const name = [a1.first, a1.middle, a1.last].filter(Boolean).join(" ");
  return `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.55;color:#2d413a">
  <h2 style="margin:0 0 4px;color:#0c523b">Rental application #${id}</h2>
  <p style="margin:0 0 18px;color:#5f7168">${esc(address)}</p>
  <table style="border-collapse:collapse;margin-bottom:18px">
    <tr><td style="padding:4px 14px 4px 0;color:#5f7168">Applicant</td><td><strong>${esc(name)}</strong></td></tr>
    <tr><td style="padding:4px 14px 4px 0;color:#5f7168">Email</td><td>${esc(input.applicant_email)}</td></tr>
    <tr><td style="padding:4px 14px 4px 0;color:#5f7168">Phone</td><td>${esc(input.applicant_phone || "—")}</td></tr>
    <tr><td style="padding:4px 14px 4px 0;color:#5f7168">Total income</td><td>${esc(money(input.income.total_cents))}</td></tr>
  </table>
  <p style="margin:0 0 18px"><a href="${esc(adminUrl)}" style="background:#8a2f4b;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Open the full application</a></p>
  <pre style="white-space:pre-wrap;padding:14px 16px;background:#eef7f2;border-left:3px solid #8a2f4b;font-family:ui-monospace,monospace;font-size:13px">${esc(buildText(id, address, input))}</pre>
</div>`;
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
  if (rateLimited(ip)) {
    return NextResponse.json({
      ok: false,
      error: "Too many submissions from this connection. Please try again shortly.",
    });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Malformed request." });
  }

  if (str(body._gotcha, 100)) {
    return NextResponse.json({ ok: true, id: 0 });
  }

  const property = await getPropertyBySlug(str(body.slug, 120));
  if (!property || !property.is_active) {
    return NextResponse.json({
      ok: false,
      error: "That property is no longer accepting applications.",
    });
  }

  const applicants = arr(body.applicants, 2, (a) => ({
    last: str(a.last, 80),
    first: str(a.first, 80),
    middle: str(a.middle, 80),
    other_names: str(a.other_names, 200),
    other_id: str(a.other_id, 80),
    dob: str(a.dob, 20),
    work_phone: str(a.work_phone, 40),
    home_phone: str(a.home_phone, 40),
    email: str(a.email, 200),
    dl_number: str(a.dl_number, 60),
    dl_expiration: str(a.dl_expiration, 20),
    dl_state: str(a.dl_state, 40),
  })).filter((a) => a.first || a.last);

  const input: ApplicationInput = {
    rental_term: body.rental_term === "lease" ? "lease" : "month_to_month",
    lease_from: str(body.lease_from, 20) || null,
    lease_to: str(body.lease_to, 20) || null,
    applicants,
    ssns: arr(body.applicants, 2, (a) => str(a.ssn, 40)) as unknown as string[],
    rental_history: arr(body.rental_history, 3, (r) => ({
      address: str(r.address, 200),
      city: str(r.city, 100),
      state: str(r.state, 40),
      zip: str(r.zip, 20),
      date_in: str(r.date_in, 20),
      date_out: str(r.date_out, 20),
      manager_name: str(r.manager_name, 160),
      manager_phone: str(r.manager_phone, 40),
      reason_for_moving: str(r.reason_for_moving, 400),
    })),
    employment: arr(body.employment, 4, (e) => ({
      applicant: e.applicant === 2 ? (2 as const) : (1 as const),
      which: e.which === "last" ? ("last" as const) : ("present" as const),
      occupation: str(e.occupation, 160),
      employer_name: str(e.employer_name, 160),
      employer_address: str(e.employer_address, 200),
      employer_city_state_zip: str(e.employer_city_state_zip, 160),
      supervisor_name: str(e.supervisor_name, 160),
      supervisor_phone: str(e.supervisor_phone, 40),
      how_long: str(e.how_long, 80),
    })),
    income: {
      applicant1_cents: centsOrNull((body.income as Record<string, unknown>)?.applicant1),
      applicant2_cents: centsOrNull((body.income as Record<string, unknown>)?.applicant2),
      other_cents: centsOrNull((body.income as Record<string, unknown>)?.other),
      other_source: str((body.income as Record<string, unknown>)?.other_source, 200),
      total_cents: centsOrNull((body.income as Record<string, unknown>)?.total),
    },
    occupants: arr(body.occupants, 6, (o) => ({
      name: str(o.name, 160),
      relationship: str(o.relationship, 80),
      age: str(o.age, 10),
    })).filter((o) => o.name),
    total_adults: intOrNull(body.total_adults),
    total_children: intOrNull(body.total_children),
    vehicles: arr(body.vehicles, 2, (v) => ({
      make: str(v.make, 60),
      model: str(v.model, 60),
      year: str(v.year, 10),
      state_plate: str(v.state_plate, 60),
    })).filter((v) => v.make || v.model),
    other_vehicles: str(body.other_vehicles, 400) || null,
    has_pets: boolOrNull(body.has_pets),
    pets_describe: str(body.pets_describe, 400) || null,
    has_liquid_furniture: boolOrNull(body.has_liquid_furniture),
    liquid_furniture_describe: str(body.liquid_furniture_describe, 400) || null,
    ever_evicted: boolOrNull(body.ever_evicted),
    ever_bankruptcy: boolOrNull(body.ever_bankruptcy),
    ever_drug_conviction: boolOrNull(body.ever_drug_conviction),
    signature_1: str(body.signature_1, 200),
    signature_2: str(body.signature_2, 200) || null,
    certification_ack: body.certification_ack === true,
    screening_fee_ack: body.screening_fee_ack === true,
    applicant_email: str(body.applicant_email, 200),
    applicant_phone: str(body.applicant_phone, 40) || null,
  };

  const errors: string[] = [];
  if (applicants.length === 0) errors.push("Enter the first applicant's name.");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.applicant_email))
    errors.push("Enter a valid contact email address.");
  if (!input.signature_1) errors.push("Applicant 1 must sign the application.");
  if (!input.certification_ack)
    errors.push("You must certify the information is true and correct.");
  if (errors.length) {
    return NextResponse.json({ ok: false, error: errors.join(" ") });
  }

  // Refuse rather than silently storing an SSN in the clear.
  const hasSsn = input.ssns.some((s) => s && s.trim() !== "");
  if (hasSsn && !encryptionAvailable()) {
    console.error("[apply] APP_ENCRYPTION_KEY missing — refusing to store an SSN");
    return NextResponse.json({
      ok: false,
      error: `This form is not fully configured. Please email ${TO}.`,
    });
  }

  let id: number;
  try {
    id = await createApplication(property, input, { ip });
  } catch (cause) {
    console.error("[apply] could not save application", cause);
    return NextResponse.json({
      ok: false,
      error: `We could not save your application. Please email ${TO}.`,
    });
  }

  const address = [
    property.address_line1,
    property.address_line2,
    `${property.city}, ${property.region} ${property.postal}`,
  ]
    .filter(Boolean)
    .join(", ");

  const base = process.env.SITE_URL?.trim() || "https://cmngproperty.com";
  let emailed = false;
  try {
    await sendMail({
      subject: `Rental application — ${address} — ${input.applicants[0].first} ${input.applicants[0].last}`,
      text: buildText(id, address, input),
      html: buildHtml(id, address, input, `${base}/admin/applications/${id}`),
      replyTo: `${input.applicants[0].first} ${input.applicants[0].last} <${input.applicant_email}>`,
    });
    await markEmailSent(id);
    emailed = true;
  } catch (cause) {
    // Already saved, so this is recoverable: the admin list shows it unsent.
    console.error(`[apply] application ${id} saved but not emailed`, cause);
    const text = cause instanceof Error ? cause.message : String(cause);
    if (/\b(550|553)\b/.test(text) && /domain|sender|from/i.test(text)) {
      console.error(`[apply] the relay refused the sender "${FROM}".`);
    }
  }

  // Total due is echoed back so the applicant sees what they committed to.
  return NextResponse.json({
    ok: true,
    id,
    emailed,
    total_due: formatMoney(totalDueCents(property)),
  });
}
