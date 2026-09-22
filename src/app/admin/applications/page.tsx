import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { listApplications } from "@/lib/applications";
import { formatMoney, listProperties } from "@/lib/properties";

const STATUS_STYLE: Record<string, string> = {
  new: "bg-accent-100 text-accent-900",
  reviewing: "bg-sand-200 text-brand-900",
  approved: "bg-brand-100 text-brand-900",
  declined: "bg-ink-500/10 text-ink-700",
  withdrawn: "bg-ink-500/10 text-ink-600",
};

export default async function ApplicationsList({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; property?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const propertyId = sp.property ? Number(sp.property) : undefined;

  const [applications, properties] = await Promise.all([
    listApplications({ status: sp.status, propertyId }),
    listProperties(),
  ]);
  const byId = new Map(properties.map((p) => [p.id, p]));

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-ink-900">
        Applications
      </h1>

      <div className="mt-5 flex flex-wrap gap-2 text-sm">
        <Link
          href="/admin/applications"
          className={`rounded-full border px-3 py-1.5 ${!sp.status && !propertyId ? "border-brand-700 bg-white font-medium text-brand-800" : "border-brand-900/15 text-ink-600"}`}
        >
          All
        </Link>
        {["new", "reviewing", "approved", "declined"].map((s) => (
          <Link
            key={s}
            href={`/admin/applications?status=${s}`}
            className={`rounded-full border px-3 py-1.5 capitalize ${sp.status === s ? "border-brand-700 bg-white font-medium text-brand-800" : "border-brand-900/15 text-ink-600"}`}
          >
            {s}
          </Link>
        ))}
      </div>

      {applications.length === 0 ? (
        <p className="mt-8 rounded-xl border border-brand-900/10 bg-white p-8 text-ink-600">
          Nothing here yet.
        </p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-brand-900/10 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-sand-100 text-left text-xs uppercase tracking-wider text-ink-600">
              <tr>
                <th className="px-5 py-3 font-semibold">Applicant</th>
                <th className="px-5 py-3 font-semibold">Property</th>
                <th className="px-5 py-3 font-semibold">Income</th>
                <th className="px-5 py-3 font-semibold">Submitted</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-900/10">
              {applications.map((a) => (
                <tr key={a.id}>
                  <td className="px-5 py-4">
                    <Link
                      href={`/admin/applications/${a.id}`}
                      className="font-medium text-brand-800 underline underline-offset-2"
                    >
                      {a.applicant_name}
                    </Link>
                    <div className="text-xs text-ink-500">{a.applicant_email}</div>
                    {a.email_sent === 0 && (
                      // Worth surfacing: the row exists but nobody was notified.
                      <span className="mt-1 inline-block rounded bg-red-50 px-1.5 py-0.5 text-xs font-medium text-red-700">
                        not emailed
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-ink-700">
                    {byId.get(a.property_id)?.address_line1 ?? a.property_address}
                  </td>
                  <td className="px-5 py-4 text-ink-700">
                    {a.income?.total_cents ? formatMoney(a.income.total_cents) : "—"}
                  </td>
                  <td className="px-5 py-4 text-ink-600">
                    {new Date(a.submitted_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`rounded px-2 py-1 text-xs font-medium capitalize ${STATUS_STYLE[a.status]}`}>
                      {a.status}
                    </span>
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
