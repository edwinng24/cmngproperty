import { notFound } from "next/navigation";
import Link from "next/link";
import { PropertyForm } from "@/components/PropertyForm";
import { requireAdmin } from "@/lib/auth";
import { getProperty } from "@/lib/properties";
import { deletePropertyAction, updatePropertyAction } from "../../actions";

/** Cents back to the plain decimal the form edits. */
const dollars = (c: number | null) => (c === null ? "" : String(c / 100));

export default async function EditProperty({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const property = await getProperty(Number(id));
  if (!property) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-2xl border border-brand-900/10 bg-white p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
            Edit property
          </h1>
          <Link
            href={`/apply/${property.slug}`}
            className="font-mono text-xs text-ink-600 underline underline-offset-2"
          >
            /apply/{property.slug}
          </Link>
        </div>
        <div className="mt-8">
          <PropertyForm
            action={updatePropertyAction}
            deleteAction={deletePropertyAction}
            submitLabel="Save changes"
            values={{
              id: property.id,
              slug: property.slug,
              address_line1: property.address_line1,
              address_line2: property.address_line2,
              city: property.city,
              region: property.region,
              postal: property.postal,
              monthly_rent: dollars(property.monthly_rent_cents),
              deposit: dollars(property.deposit_cents),
              credit_check_fee: dollars(property.credit_check_fee_cents),
              other_charges: dollars(property.other_charges_cents),
              other_charges_label: property.other_charges_label,
              screening_fee: dollars(property.screening_fee_cents),
              bedrooms: property.bedrooms ? String(Number(property.bedrooms)) : "",
              bathrooms: property.bathrooms ? String(Number(property.bathrooms)) : "",
              available_from: property.available_from,
              description: property.description,
              is_active: property.is_active === 1,
            }}
          />
        </div>
      </div>
    </div>
  );
}
