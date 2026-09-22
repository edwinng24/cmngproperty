"use client";

import { useActionState } from "react";
import { updateApplicationAction } from "@/app/admin/actions";
import { STATUSES } from "@/lib/statuses";

export function StatusForm({
  id,
  status,
  notes,
}: {
  id: number;
  status: string;
  notes: string | null;
}) {
  const [state, action, pending] = useActionState(updateApplicationAction, undefined);

  return (
    <form action={action} className="rounded-xl border border-brand-900/10 bg-white p-6">
      <h2 className="text-base font-semibold text-brand-800">Review</h2>
      <input type="hidden" name="id" value={id} />

      <div className="mt-4 grid gap-4 sm:grid-cols-[200px_1fr]">
        <div>
          <label className="block text-sm font-medium text-brand-900" htmlFor="status">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={status}
            className="mt-1.5 block w-full rounded-lg border border-brand-900/15 bg-white px-3 py-2 text-sm capitalize focus:border-accent-500 focus:outline-none"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-900" htmlFor="admin_notes">
            Internal notes
          </label>
          <textarea
            id="admin_notes"
            name="admin_notes"
            rows={3}
            defaultValue={notes ?? ""}
            className="mt-1.5 block w-full rounded-lg border border-brand-900/15 bg-white px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
          />
        </div>
      </div>

      {state && !state.error && (
        <p className="mt-3 text-sm text-brand-700">Saved.</p>
      )}
      {state?.error && (
        <p role="alert" className="mt-3 text-sm font-medium text-red-800">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded-lg bg-accent-600 px-5 py-2 text-sm font-semibold text-white hover:bg-accent-700 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
