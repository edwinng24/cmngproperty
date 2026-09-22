"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { ActionState } from "@/app/admin/actions";

/** Shared by the new-property and edit-property pages. */

export type PropertyFormValues = {
  id?: number;
  slug?: string;
  address_line1?: string;
  address_line2?: string | null;
  city?: string;
  region?: string;
  postal?: string;
  monthly_rent?: string;
  deposit?: string;
  credit_check_fee?: string;
  other_charges?: string;
  other_charges_label?: string | null;
  screening_fee?: string;
  bedrooms?: string | null;
  bathrooms?: string | null;
  available_from?: string | null;
  description?: string | null;
  is_active?: boolean;
};

const label = "block text-sm font-medium text-brand-900";
const field =
  "mt-1.5 block w-full rounded-lg border border-brand-900/15 bg-white px-3 py-2 text-sm text-ink-900 focus:border-accent-500 focus:outline-none";

function F({
  name,
  text,
  value,
  required,
  type = "text",
  hint,
  className = "",
}: {
  name: string;
  text: string;
  value?: string | null;
  required?: boolean;
  type?: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className={label} htmlFor={name}>
        {text}
        {required && <span className="text-red-600"> *</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={value ?? ""}
        className={field}
      />
      {hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
    </div>
  );
}

export function PropertyForm({
  action,
  values = {},
  submitLabel,
  deleteAction,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  values?: PropertyFormValues;
  submitLabel: string;
  deleteAction?: (state: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [delState, delAction, delPending] = useActionState(
    deleteAction ?? (async () => undefined),
    undefined,
  );

  return (
    <>
      <form action={formAction} className="space-y-8">
        {values.id && <input type="hidden" name="id" value={values.id} />}

        <fieldset>
          <legend className="text-lg font-semibold text-ink-900">Address</legend>
          <div className="mt-4 grid gap-4 sm:grid-cols-6">
            <F name="address_line1" text="Street address" value={values.address_line1} required className="sm:col-span-4" />
            <F name="address_line2" text="Unit / apt" value={values.address_line2} className="sm:col-span-2" />
            <F name="city" text="City" value={values.city} required className="sm:col-span-3" />
            <F name="region" text="State" value={values.region} required className="sm:col-span-1" />
            <F name="postal" text="Zip code" value={values.postal} required className="sm:col-span-2" />
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-lg font-semibold text-ink-900">
            Amount due prior to occupancy
          </legend>
          <p className="mt-1 text-sm text-ink-600">
            These appear on the application, itemised, with a total.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-4">
            <F name="monthly_rent" text="Monthly rent" value={values.monthly_rent} required hint="e.g. 2550" />
            <F name="deposit" text="Security deposit" value={values.deposit} />
            <F name="credit_check_fee" text="Credit-check fee" value={values.credit_check_fee} />
            <F name="other_charges" text="Other charges" value={values.other_charges} />
            <F name="other_charges_label" text="Label for other charges" value={values.other_charges_label} className="sm:col-span-2" />
            <F
              name="screening_fee"
              text="Screening fee per applicant"
              value={values.screening_fee}
              hint="California caps this and the cap rises annually."
              className="sm:col-span-2"
            />
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-lg font-semibold text-ink-900">Listing detail</legend>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <F name="bedrooms" text="Bedrooms" value={values.bedrooms} type="number" />
            <F name="bathrooms" text="Bathrooms" value={values.bathrooms} type="number" />
            <F name="available_from" text="Available from" value={values.available_from} type="date" />
            <div className="sm:col-span-3">
              <label className={label} htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                defaultValue={values.description ?? ""}
                className={field}
              />
            </div>
            <F
              name="slug"
              text="URL slug"
              value={values.slug}
              hint="Leave blank to generate from the address. Changing it breaks links already given out."
              className="sm:col-span-3"
            />
          </div>
        </fieldset>

        <label className="flex items-center gap-3 text-sm text-ink-700">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={values.is_active ?? true}
            className="accent-accent-600"
          />
          Accepting applications
        </label>

        {state?.error && (
          <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
            {state.error}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-4 border-t border-brand-900/10 pt-6">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-accent-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-accent-700 disabled:opacity-60"
          >
            {pending ? "Saving…" : submitLabel}
          </button>
          <Link href="/admin" className="text-sm text-ink-600 underline underline-offset-4">
            Cancel
          </Link>
        </div>
      </form>

      {deleteAction && values.id && (
        <form action={delAction} className="mt-10 border-t border-brand-900/10 pt-6">
          <input type="hidden" name="id" value={values.id} />
          <p className="text-sm text-ink-600">
            Deleting is blocked once a property has applications — deactivate it
            instead, which keeps the records and stops new submissions.
          </p>
          {delState?.error && (
            <p role="alert" className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
              {delState.error}
            </p>
          )}
          <button
            type="submit"
            disabled={delPending}
            className="mt-4 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
          >
            {delPending ? "Deleting…" : "Delete property"}
          </button>
        </form>
      )}
    </>
  );
}
