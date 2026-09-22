import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import {
  applicationCounts,
  formatAddress,
  formatMoney,
  listProperties,
  totalDueCents,
} from "@/lib/properties";
import { countsByStatus } from "@/lib/applications";

export default async function AdminHome() {
  await requireAdmin();
  const [properties, appCounts, statusCounts] = await Promise.all([
    listProperties(),
    applicationCounts(),
    countsByStatus(),
  ]);

  const newCount = statusCounts.new ?? 0;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-ink-900">
            Managed properties
          </h1>
          <p className="mt-1 text-sm text-ink-600">
            Each property gets its own application form at{" "}
            <code className="font-mono">/apply/&lt;slug&gt;</code>.
          </p>
        </div>
        <div className="flex gap-3">
          {newCount > 0 && (
            <Link
              href="/admin/applications?status=new"
              className="rounded-lg border border-accent-300 bg-accent-50 px-4 py-2.5 text-sm font-semibold text-accent-900"
            >
              {newCount} new application{newCount === 1 ? "" : "s"}
            </Link>
          )}
          <Link
            href="/admin/properties/new"
            className="rounded-lg bg-accent-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-700"
          >
            Add property
          </Link>
        </div>
      </div>

      {properties.length === 0 ? (
        <p className="mt-10 rounded-xl border border-brand-900/10 bg-white p-8 text-ink-600">
          No properties yet. Add one and its application form goes live
          immediately.
        </p>
      ) : (
        <div className="mt-8 overflow-hidden rounded-xl border border-brand-900/10 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-sand-100 text-left text-xs uppercase tracking-wider text-ink-600">
              <tr>
                <th className="px-5 py-3 font-semibold">Property</th>
                <th className="px-5 py-3 font-semibold">Rent</th>
                <th className="px-5 py-3 font-semibold">Due at move-in</th>
                <th className="px-5 py-3 font-semibold">Applications</th>
                <th className="px-5 py-3 font-semibold">Link</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-900/10">
              {properties.map((p) => (
                <tr key={p.id} className={p.is_active ? "" : "bg-sand-50/60"}>
                  <td className="px-5 py-4">
                    <span className="font-medium text-ink-900">
                      {formatAddress(p)}
                    </span>
                    {!p.is_active && (
                      <span className="ml-2 rounded bg-ink-500/10 px-1.5 py-0.5 text-xs text-ink-600">
                        inactive
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-ink-700">
                    {formatMoney(p.monthly_rent_cents)}
                  </td>
                  <td className="px-5 py-4 text-ink-700">
                    {formatMoney(totalDueCents(p))}
                  </td>
                  <td className="px-5 py-4">
                    {appCounts.get(p.id) ? (
                      <Link
                        href={`/admin/applications?property=${p.id}`}
                        className="font-medium text-accent-700 underline underline-offset-2"
                      >
                        {appCounts.get(p.id)}
                      </Link>
                    ) : (
                      <span className="text-ink-500">0</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <Link
                      href={`/apply/${p.slug}`}
                      className="font-mono text-xs text-ink-600 underline underline-offset-2 hover:text-brand-800"
                    >
                      /apply/{p.slug}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/admin/properties/${p.id}`}
                      className="font-medium text-brand-700 underline underline-offset-2"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
