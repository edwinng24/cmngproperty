import type { Metadata } from "next";
import { Container } from "@/components/ui";
import { markConcepts } from "@/components/logo-concepts";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Logo concepts",
  robots: { index: false, follow: false },
};

const sizes = [
  { px: 64, label: "64px" },
  { px: 40, label: "40px" },
  { px: 32, label: "32px" },
  { px: 24, label: "24px" },
  { px: 16, label: "16px — favicon" },
];

export default function LogoPreviewPage() {
  return (
    <Container className="py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-brand-950">
        Logo concepts
      </h1>
      <p className="mt-3 max-w-2xl leading-relaxed text-ink-600">
        Internal comparison page — not linked from the site and marked noindex.
        &ldquo;Keyhole C&rdquo; is currently live. Delete{" "}
        <code className="font-mono text-sm">src/app/logo-preview</code> once a
        mark is chosen.
      </p>

      <div className="mt-14 space-y-16">
        {markConcepts.map(({ id, name, Mark, rationale }) => (
          <section key={id} className="border-t border-brand-900/10 pt-8">
            <div className="flex flex-wrap items-baseline gap-3">
              <h2 className="text-xl font-semibold text-brand-900">{name}</h2>
              <code className="font-mono text-xs text-ink-500">{id}</code>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-600">
              {rationale}
            </p>

            {/* Size ramp on light */}
            <div className="mt-8 flex flex-wrap items-end gap-8 rounded-xl border border-brand-900/10 p-8">
              {sizes.map((size) => (
                <div key={size.px} className="text-center">
                  {/* Inline size keeps the ramp exact rather than approximate. */}
                  <Mark
                    className="text-brand-700"
                    style={{ width: size.px, height: size.px }}
                  />
                  <p className="mt-3 text-[11px] text-ink-500">
                    {size.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {/* Lockup on light */}
              <div className="flex items-center rounded-xl border border-brand-900/10 bg-white p-8">
                <span className="inline-flex items-center gap-2.5 text-brand-900">
                  <Mark className="h-9 w-9 text-brand-700" />
                  <span className="text-xl leading-none tracking-tight">
                    <span className="font-bold tracking-[0.02em]">CMNG</span>
                    <span className="font-normal opacity-70"> Property</span>
                  </span>
                </span>
              </div>

              {/* Lockup on dark */}
              <div className="flex items-center rounded-xl bg-brand-950 p-8">
                <span className="inline-flex items-center gap-2.5 text-white">
                  <Mark className="h-9 w-9" accent="#e0c99b" />
                  <span className="text-xl leading-none tracking-tight">
                    <span className="font-bold tracking-[0.02em]">CMNG</span>
                    <span className="font-normal opacity-70"> Property</span>
                  </span>
                </span>
              </div>

              {/* Favicon field */}
              <div className="flex items-center gap-4 rounded-xl border border-brand-900/10 p-8">
                <span className="grid h-16 w-16 place-items-center rounded-[14px] bg-brand-700">
                  <Mark className="h-10 w-10 text-white" accent="#e0c99b" />
                </span>
                <span className="grid h-8 w-8 place-items-center rounded-[7px] bg-brand-700">
                  <Mark className="h-5 w-5 text-white" accent="#e0c99b" />
                </span>
                <p className="text-xs text-ink-500">
                  On the app-icon field
                </p>
              </div>

              {/* Reversed field */}
              <div className="flex items-center gap-4 rounded-xl bg-sand-200 p-8">
                <Mark className="h-10 w-10 text-brand-900" />
                <p className="text-xs text-ink-500">On sand</p>
              </div>
            </div>
          </section>
        ))}
      </div>

      <p className="mt-16 text-sm text-ink-600">
        {site.name} — tell Claude which concept to keep and the rest get deleted.
      </p>
    </Container>
  );
}
