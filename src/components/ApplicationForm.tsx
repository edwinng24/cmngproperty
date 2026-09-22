"use client";

import { useMemo, useState } from "react";
import { site } from "@/lib/site";

/**
 * The rental application, reproducing the paper form: two applicants, three
 * prior addresses, present and last employment for each applicant, occupants,
 * vehicles, disclosures and signatures.
 *
 * Everything is collected in one uncontrolled <form> and read out with
 * FormData on submit. With ~140 inputs, holding each in React state would cost
 * a re-render per keystroke for no benefit — nothing here reacts to anything
 * else except the income total, which is derived on demand.
 */

export type FormProperty = {
  slug: string;
  address: string;
  monthly_rent: string;
  deposit: string | null;
  credit_check_fee: string | null;
  other_charges: string | null;
  other_charges_label: string | null;
  screening_fee: string;
  total_due: string;
};

const label = "block text-sm font-medium text-brand-900";
const field =
  "mt-1.5 block w-full rounded-lg border border-brand-900/15 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-500/60 focus:border-accent-500 focus:outline-none";

function Req() {
  return (
    <span className="text-red-600" aria-hidden>
      {" "}
      *
    </span>
  );
}

function Text({
  name,
  label: text,
  required,
  type = "text",
  placeholder,
  className = "",
}: {
  name: string;
  label: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className={label} htmlFor={name}>
        {text}
        {required && <Req />}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className={field}
      />
    </div>
  );
}

function YesNo({ name, question }: { name: string; question: string }) {
  return (
    <fieldset className="flex flex-wrap items-center justify-between gap-4 border-t border-brand-900/10 py-3">
      <legend className="sr-only">{question}</legend>
      <span className="text-sm text-ink-700">{question}</span>
      <span className="flex shrink-0 gap-4">
        {["yes", "no"].map((v) => (
          <label key={v} className="flex items-center gap-1.5 text-sm">
            <input type="radio" name={name} value={v} className="accent-accent-600" />
            {v === "yes" ? "Yes" : "No"}
          </label>
        ))}
      </span>
    </fieldset>
  );
}

function Section({
  n,
  title,
  hint,
  children,
}: {
  n: number;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-brand-900/10 pt-8">
      <h2 className="flex items-baseline gap-3 text-xl font-semibold text-ink-900">
        <span className="font-mono text-sm text-accent-600">
          {String(n).padStart(2, "0")}
        </span>
        {title}
      </h2>
      {hint && <p className="mt-1 text-sm text-ink-600">{hint}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function ApplicantFields({ n }: { n: 1 | 2 }) {
  const p = `a${n}_`;
  return (
    <div className="rounded-xl border border-brand-900/10 p-5">
      <h3 className="text-base font-semibold text-brand-800">
        Applicant {n}
        {n === 2 && <span className="font-normal text-ink-500"> — if any</span>}
      </h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Text name={`${p}first`} label="First name" required={n === 1} />
        <Text name={`${p}middle`} label="Middle name" />
        <Text name={`${p}last`} label="Last name" required={n === 1} />
        <Text name={`${p}dob`} label="Date of birth" type="date" />
        <Text name={`${p}ssn`} label="Social Security number" placeholder="000-00-0000" />
        <Text name={`${p}other_id`} label="Other ID" />
        <Text name={`${p}home_phone`} label="Home phone" type="tel" />
        <Text name={`${p}work_phone`} label="Work phone" type="tel" />
        <Text name={`${p}email`} label="Email" type="email" />
        <Text name={`${p}dl_number`} label="Driver's licence #" />
        <Text name={`${p}dl_expiration`} label="Expiration" type="date" />
        <Text name={`${p}dl_state`} label="State" />
        <Text
          name={`${p}other_names`}
          label="Other names used in the last 10 years"
          className="sm:col-span-3"
        />
      </div>
    </div>
  );
}

function ResidenceFields({ n, title }: { n: number; title: string }) {
  const p = `r${n}_`;
  return (
    <div className="rounded-xl border border-brand-900/10 p-5">
      <h3 className="text-base font-semibold text-brand-800">{title}</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-4">
        <Text name={`${p}address`} label="Address" className="sm:col-span-4" />
        <Text name={`${p}city`} label="City" className="sm:col-span-2" />
        <Text name={`${p}state`} label="State" />
        <Text name={`${p}zip`} label="Zip code" />
        <Text name={`${p}date_in`} label="Date in" type="date" />
        <Text name={`${p}date_out`} label="Date out" type="date" />
        <Text name={`${p}manager_name`} label="Owner / manager" />
        <Text name={`${p}manager_phone`} label="Their phone" type="tel" />
        <Text
          name={`${p}reason_for_moving`}
          label="Reason for moving"
          className="sm:col-span-4"
        />
      </div>
    </div>
  );
}

function EmploymentFields({
  applicant,
  which,
}: {
  applicant: 1 | 2;
  which: "present" | "last";
}) {
  const p = `e${applicant}${which === "present" ? "p" : "l"}_`;
  return (
    <div className="rounded-xl border border-brand-900/10 p-5">
      <h3 className="text-base font-semibold text-brand-800">
        Applicant {applicant} — {which === "present" ? "present" : "last"}{" "}
        occupation
      </h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Text
          name={`${p}occupation`}
          label="Occupation / position or source of income"
          className="sm:col-span-2"
        />
        <Text name={`${p}employer_name`} label="Employer name" />
        <Text name={`${p}how_long`} label="How long with this employer" />
        <Text name={`${p}employer_address`} label="Employer address" />
        <Text name={`${p}employer_city_state_zip`} label="City, state, zip" />
        <Text name={`${p}supervisor_name`} label="Supervisor's name" />
        <Text name={`${p}supervisor_phone`} label="Supervisor's phone" type="tel" />
      </div>
    </div>
  );
}

export function ApplicationForm({ property }: { property: FormProperty }) {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">(
    "idle",
  );
  const [error, setError] = useState("");
  const [reference, setReference] = useState<number | null>(null);
  const [term, setTerm] = useState<"month_to_month" | "lease">("month_to_month");

  const charges = useMemo(
    () =>
      [
        ["First month's rent", property.monthly_rent],
        ["Security deposit", property.deposit],
        ["Credit-check fee", property.credit_check_fee],
        [property.other_charges_label || "Other", property.other_charges],
      ].filter(([, v]) => v) as [string, string][],
    [property],
  );

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const f = new FormData(form);
    const g = (k: string) => String(f.get(k) ?? "").trim();

    const payload = {
      slug: property.slug,
      _gotcha: g("_gotcha"),
      rental_term: g("rental_term") || "month_to_month",
      lease_from: g("lease_from"),
      lease_to: g("lease_to"),
      applicants: ([1, 2] as const).map((n) => ({
        first: g(`a${n}_first`),
        middle: g(`a${n}_middle`),
        last: g(`a${n}_last`),
        dob: g(`a${n}_dob`),
        ssn: g(`a${n}_ssn`),
        other_id: g(`a${n}_other_id`),
        other_names: g(`a${n}_other_names`),
        home_phone: g(`a${n}_home_phone`),
        work_phone: g(`a${n}_work_phone`),
        email: g(`a${n}_email`),
        dl_number: g(`a${n}_dl_number`),
        dl_expiration: g(`a${n}_dl_expiration`),
        dl_state: g(`a${n}_dl_state`),
      })),
      rental_history: [1, 2, 3].map((n) => ({
        address: g(`r${n}_address`),
        city: g(`r${n}_city`),
        state: g(`r${n}_state`),
        zip: g(`r${n}_zip`),
        date_in: g(`r${n}_date_in`),
        date_out: g(`r${n}_date_out`),
        manager_name: g(`r${n}_manager_name`),
        manager_phone: g(`r${n}_manager_phone`),
        reason_for_moving: g(`r${n}_reason_for_moving`),
      })),
      employment: (
        [
          [1, "present", "e1p_"],
          [1, "last", "e1l_"],
          [2, "present", "e2p_"],
          [2, "last", "e2l_"],
        ] as const
      ).map(([applicant, which, p]) => ({
        applicant,
        which,
        occupation: g(`${p}occupation`),
        employer_name: g(`${p}employer_name`),
        employer_address: g(`${p}employer_address`),
        employer_city_state_zip: g(`${p}employer_city_state_zip`),
        supervisor_name: g(`${p}supervisor_name`),
        supervisor_phone: g(`${p}supervisor_phone`),
        how_long: g(`${p}how_long`),
      })),
      income: {
        applicant1: g("income_a1"),
        applicant2: g("income_a2"),
        other: g("income_other"),
        other_source: g("income_other_source"),
        total: g("income_total"),
      },
      occupants: [1, 2, 3, 4, 5, 6].map((n) => ({
        name: g(`o${n}_name`),
        relationship: g(`o${n}_relationship`),
        age: g(`o${n}_age`),
      })),
      total_adults: g("total_adults"),
      total_children: g("total_children"),
      vehicles: [1, 2].map((n) => ({
        make: g(`v${n}_make`),
        model: g(`v${n}_model`),
        year: g(`v${n}_year`),
        state_plate: g(`v${n}_state_plate`),
      })),
      other_vehicles: g("other_vehicles"),
      has_pets: g("has_pets"),
      pets_describe: g("pets_describe"),
      has_liquid_furniture: g("has_liquid_furniture"),
      liquid_furniture_describe: g("liquid_furniture_describe"),
      ever_evicted: g("ever_evicted"),
      ever_bankruptcy: g("ever_bankruptcy"),
      ever_drug_conviction: g("ever_drug_conviction"),
      signature_1: g("signature_1"),
      signature_2: g("signature_2"),
      certification_ack: f.get("certification_ack") === "on",
      screening_fee_ack: f.get("screening_fee_ack") === "on",
      applicant_email: g("applicant_email"),
      applicant_phone: g("applicant_phone"),
    };

    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => null);
      if (res.ok && body?.ok === true) {
        setReference(body.id ?? null);
        setStatus("done");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      setError(body?.error || "That did not go through. Please try again.");
      setStatus("error");
    } catch {
      setError("Network error — check your connection and try again.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="rounded-2xl border border-brand-200 bg-brand-50 p-10 text-center">
        <h2 className="text-2xl font-semibold text-brand-900">
          Application received
        </h2>
        <p className="mx-auto mt-3 max-w-lg leading-relaxed text-ink-700">
          Thank you. We have your application for {property.address}
          {reference ? ` — your reference is #${reference}` : ""}. We review
          every application and will be in touch; if you need us sooner, email{" "}
          <a
            className="font-medium underline underline-offset-2"
            href={`mailto:${site.email}`}
          >
            {site.email}
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-10" noValidate>
      <input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      {/* Terms — filled in by us, shown so the applicant knows what they are
          applying for. Values come from the property record. */}
      <section className="rounded-2xl bg-brand-950 p-6 text-white sm:p-8">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-accent-300">
          The property
        </h2>
        <p className="mt-2 text-xl font-semibold">{property.address}</p>
        <dl className="mt-5 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
          {charges.map(([k, v]) => (
            <div key={k} className="flex justify-between border-b border-white/10 py-1.5">
              <dt className="text-brand-200">{k}</dt>
              <dd className="font-medium">{v}</dd>
            </div>
          ))}
          <div className="flex justify-between border-b-2 border-accent-400 py-1.5 sm:col-span-2">
            <dt className="font-semibold">Total due prior to occupancy</dt>
            <dd className="font-semibold">{property.total_due}</dd>
          </div>
        </dl>

        <fieldset className="mt-6">
          <legend className="text-sm font-medium text-brand-100">Rental term</legend>
          <div className="mt-2 flex flex-wrap items-center gap-5 text-sm">
            {(
              [
                ["month_to_month", "Month to month"],
                ["lease", "Lease"],
              ] as const
            ).map(([v, l]) => (
              <label key={v} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="rental_term"
                  value={v}
                  defaultChecked={v === "month_to_month"}
                  onChange={() => setTerm(v)}
                  className="accent-accent-400"
                />
                {l}
              </label>
            ))}
          </div>
          {term === "lease" && (
            <div className="mt-4 grid gap-4 sm:max-w-md sm:grid-cols-2">
              <div>
                <label className="block text-sm text-brand-100" htmlFor="lease_from">
                  From
                </label>
                <input id="lease_from" name="lease_from" type="date" className={field} />
              </div>
              <div>
                <label className="block text-sm text-brand-100" htmlFor="lease_to">
                  To
                </label>
                <input id="lease_to" name="lease_to" type="date" className={field} />
              </div>
            </div>
          )}
        </fieldset>
      </section>

      <Section n={1} title="Applicant information" hint="A second applicant is optional.">
        <div className="grid gap-5">
          <ApplicantFields n={1} />
          <ApplicantFields n={2} />
        </div>
      </Section>

      <Section n={2} title="How we reach you" hint="Where we send updates about this application.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Text name="applicant_email" label="Contact email" type="email" required />
          <Text name="applicant_phone" label="Contact phone" type="tel" />
        </div>
      </Section>

      <Section n={3} title="Rental history" hint="Most recent first, going back three addresses.">
        <div className="grid gap-5">
          <ResidenceFields n={1} title="Present address" />
          <ResidenceFields n={2} title="Previous address" />
          <ResidenceFields n={3} title="Next previous address" />
        </div>
      </Section>

      <Section n={4} title="Employment history">
        <div className="grid gap-5">
          <EmploymentFields applicant={1} which="present" />
          <EmploymentFields applicant={1} which="last" />
          <EmploymentFields applicant={2} which="present" />
          <EmploymentFields applicant={2} which="last" />
        </div>
      </Section>

      <Section n={5} title="Income" hint="Gross monthly, before deductions.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Text name="income_a1" label="Applicant 1 monthly employment income" placeholder="$0.00" />
          <Text name="income_a2" label="Applicant 2 monthly employment income" placeholder="$0.00" />
          <Text name="income_other" label="Average monthly other income" placeholder="$0.00" />
          <Text name="income_other_source" label="Source of other income" />
          <Text name="income_total" label="Total monthly income" placeholder="$0.00" />
        </div>
      </Section>

      <Section n={6} title="Additional occupants" hint="Everyone who will live at the property besides you.">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="grid gap-3 sm:grid-cols-[2fr_1.4fr_0.6fr]">
              <input name={`o${n}_name`} placeholder={`Name ${n}`} className={field} aria-label={`Occupant ${n} name`} />
              <input name={`o${n}_relationship`} placeholder="Relationship" className={field} aria-label={`Occupant ${n} relationship`} />
              <input name={`o${n}_age`} placeholder="Age" className={field} aria-label={`Occupant ${n} age`} />
            </div>
          ))}
        </div>
        <div className="mt-5 grid gap-4 sm:max-w-lg sm:grid-cols-2">
          <Text name="total_adults" label="Total adults" type="number" />
          <Text name="total_children" label="Children under 18" type="number" />
        </div>
      </Section>

      <Section n={7} title="Vehicles">
        <div className="space-y-3">
          {[1, 2].map((n) => (
            <div key={n} className="grid gap-3 sm:grid-cols-4">
              <input name={`v${n}_make`} placeholder="Make" className={field} aria-label={`Vehicle ${n} make`} />
              <input name={`v${n}_model`} placeholder="Model" className={field} aria-label={`Vehicle ${n} model`} />
              <input name={`v${n}_year`} placeholder="Year" className={field} aria-label={`Vehicle ${n} year`} />
              <input name={`v${n}_state_plate`} placeholder="State / plate #" className={field} aria-label={`Vehicle ${n} plate`} />
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Text name="other_vehicles" label="Other motor vehicles" />
        </div>
      </Section>

      <Section n={8} title="Pets and furnishings">
        <YesNo name="has_pets" question="Will you have pets?" />
        <Text name="pets_describe" label="If yes, describe" />
        <div className="mt-4">
          <YesNo name="has_liquid_furniture" question="Will you have liquid-filled furniture?" />
          <Text name="liquid_furniture_describe" label="If yes, describe" />
        </div>
      </Section>

      <Section n={9} title="Disclosures">
        <YesNo name="ever_evicted" question="Have you ever been party to an eviction?" />
        <YesNo name="ever_bankruptcy" question="Have you ever filed for bankruptcy?" />
        <YesNo
          name="ever_drug_conviction"
          question="Have you ever been convicted for selling, distributing or manufacturing illegal drugs?"
        />
      </Section>

      <Section n={10} title="Certification and signature">
        <div className="rounded-xl border border-brand-900/10 bg-sand-50 p-5 text-sm leading-relaxed text-ink-700">
          <p>
            I certify that all the information given above is true and correct
            and understand that my lease or rental agreement may be terminated
            if I have made any material false or incomplete statements in this
            application. I authorize verification of the information provided
            in this application from my credit sources, credit bureaus, current
            and previous landlords and employers, and personal references. I
            understand that if I have initiated a &ldquo;security freeze&rdquo;
            on my credit information with any of the credit report agencies, I
            will promptly lift the freeze for a reasonable time so that my
            credit report may be accessed by the Landlord; and I understand
            that if I fail to do so, the Landlord may consider this an
            incomplete application. (CC &sect; 1785.11.2.) This permission will
            survive the expiration of my tenancy.
          </p>
          <p className="mt-3">
            Furthermore, I agree to pay a non-refundable sum of{" "}
            {property.screening_fee} per applicant for tenant screening service
            and credit check if selected.
          </p>
        </div>

        <div className="mt-5 space-y-3">
          <label className="flex gap-3 text-sm text-ink-700">
            <input type="checkbox" name="certification_ack" required className="mt-0.5 accent-accent-600" />
            <span>
              I certify the above and authorize verification.
              <Req />
            </span>
          </label>
          <label className="flex gap-3 text-sm text-ink-700">
            <input type="checkbox" name="screening_fee_ack" className="mt-0.5 accent-accent-600" />
            <span>
              I agree to the {property.screening_fee} per-applicant screening
              fee if selected.
            </span>
          </label>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Text
            name="signature_1"
            label="Applicant 1 — type your full name to sign"
            required
          />
          <Text name="signature_2" label="Applicant 2 — type your full name to sign" />
        </div>
      </Section>

      {status === "error" && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4 border-t border-brand-900/10 pt-6">
        <button
          type="submit"
          disabled={status === "sending"}
          className="inline-flex items-center justify-center rounded-lg bg-accent-600 px-7 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "sending" ? "Submitting…" : "Submit application"}
        </button>
        <p className="text-xs text-ink-500">
          <span className="text-red-600">*</span> required. Your Social Security
          number is encrypted before it is stored.
        </p>
      </div>
    </form>
  );
}
