import type { Metadata } from "next";
import Link from "next/link";
import { Container, Eyebrow } from "@/components/ui";
import { isConfigured } from "@/lib/db";
import { formatAddress, formatMoney, listProperties } from "@/lib/properties";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Available properties",
  description: `Properties currently available to rent through ${site.name}.`,
};

// Availability changes whenever an admin edits a property, so this cannot be
// prerendered at build time.
export const dynamic = "force-dynamic";

export default async function ApplyIndex() {
  const properties = isConfigured()
    ? await listProperties({ activeOnly: true })
    : [];

  return (
    <Container className="py-14 sm:py-20">
      <div className="max-w-2xl">
        <Eyebrow>Apply</Eyebrow>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">
          Available properties
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-700">
          Pick a property to open its application. Each has its own form with
          that property&rsquo;s address and terms already filled in.
        </p>
      </div>

      {properties.length === 0 ? (
        <p className="mt-12 rounded-xl border border-brand-900/10 bg-sand-50 p-8 text-ink-600">
          Nothing is available to apply for right now. Email{" "}
          <a
            className="font-medium underline underline-offset-2"
            href={`mailto:${site.email}`}
          >
            {site.email}
          </a>{" "}
          and we will let you know when something comes up.
        </p>
      ) : (
        <ul className="mt-12 grid gap-5 sm:grid-cols-2">
          {properties.map((p) => (
            <li key={p.id}>
              <Link
                href={`/apply/${p.slug}`}
                className="flex h-full flex-col rounded-xl border border-brand-900/10 p-6 transition-all hover:-translate-y-0.5 hover:border-accent-300 hover:shadow-lg hover:shadow-brand-950/5"
              >
                <span className="text-lg font-semibold text-brand-900">
                  {p.address_line1}
                  {p.address_line2 ? `, ${p.address_line2}` : ""}
                </span>
                <span className="mt-1 text-sm text-ink-600">
                  {p.city}, {p.region} {p.postal}
                </span>
                <span className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-600">
                  {p.bedrooms && <span>{Number(p.bedrooms)} bed</span>}
                  {p.bathrooms && <span>{Number(p.bathrooms)} bath</span>}
                  {p.available_from && <span>From {p.available_from}</span>}
                </span>
                {p.description && (
                  <span className="mt-3 text-sm leading-relaxed text-ink-600">
                    {p.description}
                  </span>
                )}
                <span className="mt-auto pt-5 text-xl font-semibold text-accent-800">
                  {formatMoney(p.monthly_rent_cents)}
                  <span className="text-sm font-normal text-ink-500"> / month</span>
                </span>
                <span className="sr-only">
                  Apply for {formatAddress(p)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
