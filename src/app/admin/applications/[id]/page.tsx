import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getApplication, type ApplicationRow } from "@/lib/applications";
import { formatMoney } from "@/lib/properties";
import { StatusForm } from "@/components/ApplicationStatusForm";
import { RevealSsns } from "@/components/RevealSsns";

const yn = (v: number | null) => (v === null ? "—" : v ? "Yes" : "No");
const dash = (v: string | null | undefined) => (v && v.trim() !== "" ? v : "—");

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex gap-4 border-b border-brand-900/8 py-2 last:border-0">
      <dt className="w-52 shrink-0 text-sm text-ink-500">{k}</dt>
      <dd className="text-sm text-ink-900">{v}</dd>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-brand-900/10 bg-white p-6">
      <h2 className="text-base font-semibold text-brand-800">{title}</h2>
      <dl className="mt-3">{children}</dl>
    </section>
  );
}

export default async function ApplicationDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const app: ApplicationRow | null = await getApplication(Number(id));
  if (!app) notFound();

  const income = app.income ?? {};

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/admin/applications" className="text-sm text-ink-600 underline underline-offset-4">
        ← All applications
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-ink-900">
            {app.applicant_name}
          </h1>
          <p className="mt-1 text-ink-600">
            {app.property_address} · applied{" "}
            {new Date(app.submitted_at).toLocaleString("en-US")}
          </p>
        </div>
        <span className="rounded bg-sand-200 px-2.5 py-1 text-xs font-medium capitalize text-brand-900">
          {app.status}
        </span>
      </div>

      {app.email_sent === 0 && (
        <p className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          The notification email for this application did not send. The
          application itself was saved — check the server log for the reason.
        </p>
      )}

      <div className="mt-8 space-y-5">
        <Block title="Terms applied for">
          <Row k="Property" v={app.property_address} />
          <Row k="Monthly rent" v={formatMoney(app.monthly_rent_cents)} />
          <Row k="Security deposit" v={formatMoney(app.deposit_cents)} />
          <Row k="Credit-check fee" v={formatMoney(app.credit_check_fee_cents)} />
          {app.other_charges_cents ? (
            <Row
              k={app.other_charges_label || "Other"}
              v={formatMoney(app.other_charges_cents)}
            />
          ) : null}
          <Row k="Total due" v={<strong>{formatMoney(app.total_due_cents)}</strong>} />
          <Row
            k="Term"
            v={
              app.rental_term === "lease"
                ? `Lease ${dash(app.lease_from)} to ${dash(app.lease_to)}`
                : "Month to month"
            }
          />
        </Block>

        {app.applicants.map((a, i) => (
          <Block key={i} title={`Applicant ${i + 1}`}>
            <Row k="Name" v={[a.first, a.middle, a.last].filter(Boolean).join(" ")} />
            <Row k="Date of birth" v={dash(a.dob)} />
            <Row k="Home phone" v={dash(a.home_phone)} />
            <Row k="Work phone" v={dash(a.work_phone)} />
            <Row k="Email" v={dash(a.email)} />
            <Row
              k="Driver's licence"
              v={`${dash(a.dl_number)} (${dash(a.dl_state)}, exp ${dash(a.dl_expiration)})`}
            />
            <Row k="Other ID" v={dash(a.other_id)} />
            <Row k="Other names, 10 yrs" v={dash(a.other_names)} />
          </Block>
        ))}

        {/* SSNs stay encrypted until an admin asks for them, so simply opening
            an application does not decrypt one. */}
        <RevealSsns applicationId={app.id} />

        <Block title="Contact">
          <Row k="Email" v={<a className="underline" href={`mailto:${app.applicant_email}`}>{app.applicant_email}</a>} />
          <Row k="Phone" v={dash(app.applicant_phone)} />
        </Block>

        <Block title="Rental history">
          {(app.rental_history ?? []).filter((r) => r.address).length === 0 ? (
            <p className="text-sm text-ink-500">None given.</p>
          ) : (
            (app.rental_history ?? [])
              .filter((r) => r.address)
              .map((r, i) => (
                <Row
                  key={i}
                  k={["Present", "Previous", "Next previous"][i] ?? `Address ${i + 1}`}
                  v={
                    <>
                      {r.address}, {r.city} {r.state} {r.zip}
                      <br />
                      <span className="text-ink-600">
                        {dash(r.date_in)} to {dash(r.date_out)} · {dash(r.manager_name)}{" "}
                        {dash(r.manager_phone)}
                      </span>
                      {r.reason_for_moving && (
                        <>
                          <br />
                          <span className="text-ink-600">Reason: {r.reason_for_moving}</span>
                        </>
                      )}
                    </>
                  }
                />
              ))
          )}
        </Block>

        <Block title="Employment">
          {(app.employment ?? []).filter((e) => e.employer_name || e.occupation).length === 0 ? (
            <p className="text-sm text-ink-500">None given.</p>
          ) : (
            (app.employment ?? [])
              .filter((e) => e.employer_name || e.occupation)
              .map((e, i) => (
                <Row
                  key={i}
                  k={`Applicant ${e.applicant} — ${e.which}`}
                  v={
                    <>
                      {dash(e.occupation)} at <strong>{dash(e.employer_name)}</strong>
                      <br />
                      <span className="text-ink-600">
                        {dash(e.employer_address)} {e.employer_city_state_zip ?? ""}
                      </span>
                      <br />
                      <span className="text-ink-600">
                        Supervisor {dash(e.supervisor_name)} {dash(e.supervisor_phone)} ·{" "}
                        {dash(e.how_long)}
                      </span>
                    </>
                  }
                />
              ))
          )}
        </Block>

        <Block title="Income">
          <Row k="Applicant 1" v={formatMoney(income.applicant1_cents ?? null)} />
          <Row k="Applicant 2" v={formatMoney(income.applicant2_cents ?? null)} />
          <Row
            k="Other"
            v={`${formatMoney(income.other_cents ?? null)} ${income.other_source ?? ""}`}
          />
          <Row k="Total" v={<strong>{formatMoney(income.total_cents ?? null)}</strong>} />
          {income.total_cents && app.monthly_rent_cents ? (
            <Row
              k="Income to rent"
              v={`${(income.total_cents / app.monthly_rent_cents).toFixed(1)}×`}
            />
          ) : null}
        </Block>

        <Block title="Occupants, vehicles and pets">
          {(app.occupants ?? []).map((o, i) => (
            <Row key={i} k={`Occupant ${i + 1}`} v={`${o.name} — ${dash(o.relationship)}, age ${dash(o.age)}`} />
          ))}
          <Row k="Adults / children" v={`${app.total_adults ?? "—"} / ${app.total_children ?? "—"}`} />
          {(app.vehicles ?? []).map((v, i) => (
            <Row key={`v${i}`} k={`Vehicle ${i + 1}`} v={`${v.year ?? ""} ${v.make ?? ""} ${v.model ?? ""} — ${dash(v.state_plate)}`} />
          ))}
          <Row k="Other vehicles" v={dash(app.other_vehicles)} />
          <Row k="Pets" v={`${yn(app.has_pets)} ${app.pets_describe ?? ""}`} />
          <Row
            k="Liquid-filled furniture"
            v={`${yn(app.has_liquid_furniture)} ${app.liquid_furniture_describe ?? ""}`}
          />
        </Block>

        <Block title="Disclosures">
          <Row k="Party to an eviction" v={yn(app.ever_evicted)} />
          <Row k="Filed for bankruptcy" v={yn(app.ever_bankruptcy)} />
          <Row k="Drug-related conviction" v={yn(app.ever_drug_conviction)} />
        </Block>

        <Block title="Signatures">
          <Row k="Applicant 1" v={`${app.signature_1} — ${new Date(app.signed_1_at).toLocaleString("en-US")}`} />
          {app.signature_2 && (
            <Row
              k="Applicant 2"
              v={`${app.signature_2}${app.signed_2_at ? ` — ${new Date(app.signed_2_at).toLocaleString("en-US")}` : ""}`}
            />
          )}
          <Row k="Submitted from" v={dash(app.ip)} />
        </Block>

        <StatusForm id={app.id} status={app.status} notes={app.admin_notes} />
      </div>
    </div>
  );
}
