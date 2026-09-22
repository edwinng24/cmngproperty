import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ApplicationForm } from "@/components/ApplicationForm";
import { Container } from "@/components/ui";
import { isConfigured } from "@/lib/db";
import {
  formatAddress,
  formatMoney,
  getPropertyBySlug,
  totalDueCents,
} from "@/lib/properties";
import { site } from "@/lib/site";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  if (!isConfigured()) return { title: "Rental application" };
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);
  if (!property) return { title: "Rental application" };
  return {
    title: `Apply — ${formatAddress(property)}`,
    description: `Rental application for ${formatAddress(property)} at ${formatMoney(property.monthly_rent_cents)} per month.`,
    // Applications are per-property links given to prospective tenants, not
    // pages we want indexed and surfaced out of context.
    robots: { index: false, follow: false },
  };
}

export default async function ApplyPage({ params }: Params) {
  const { slug } = await params;
  if (!isConfigured()) notFound();

  const property = await getPropertyBySlug(slug);
  if (!property || !property.is_active) notFound();

  return (
    <Container className="py-14 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <p className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.18em] text-accent-800">
          <span aria-hidden className="h-px w-8 bg-accent-600" />
          Rental application
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-ink-900">
          {formatAddress(property)}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-700">
          Complete every section that applies to you. {site.name} reviews each
          application and will be in touch — usually within one business day.
        </p>

        <div className="mt-12">
          <ApplicationForm
            property={{
              slug: property.slug,
              address: formatAddress(property),
              monthly_rent: formatMoney(property.monthly_rent_cents),
              deposit: property.deposit_cents
                ? formatMoney(property.deposit_cents)
                : null,
              credit_check_fee: property.credit_check_fee_cents
                ? formatMoney(property.credit_check_fee_cents)
                : null,
              other_charges: property.other_charges_cents
                ? formatMoney(property.other_charges_cents)
                : null,
              other_charges_label: property.other_charges_label,
              screening_fee: formatMoney(property.screening_fee_cents),
              total_due: formatMoney(totalDueCents(property)),
            }}
          />
        </div>
      </div>
    </Container>
  );
}
