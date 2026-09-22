"use client";

import { useState } from "react";
import { revealSsnsAction } from "@/app/admin/reveal-ssn";

/** Kept behind a click so simply opening an application never decrypts one. */
export function RevealSsns({ applicationId }: { applicationId: number }) {
  const [ssns, setSsns] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <section className="rounded-xl border border-accent-200 bg-accent-50 p-6">
      <h2 className="text-base font-semibold text-accent-900">
        Social Security numbers
      </h2>
      <p className="mt-1 text-sm text-accent-900/80">
        Stored encrypted. Revealing them is logged against your account.
      </p>

      {ssns === null ? (
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              setSsns(await revealSsnsAction(applicationId));
            } finally {
              setBusy(false);
            }
          }}
          className="mt-4 rounded-lg border border-accent-400 px-4 py-2 text-sm font-medium text-accent-900 hover:bg-accent-100 disabled:opacity-60"
        >
          {busy ? "Decrypting…" : "Reveal"}
        </button>
      ) : ssns.length === 0 ? (
        <p className="mt-4 text-sm text-ink-600">None were provided.</p>
      ) : (
        <ul className="mt-4 space-y-1">
          {ssns.map((s, i) => (
            <li key={i} className="font-mono text-sm text-ink-900">
              Applicant {i + 1}: {s || "—"}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
