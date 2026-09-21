import Image from "next/image";
import type { ReactNode } from "react";
import { Container } from "./ui";

/**
 * Shared page banner: a photograph bleeds across the full width, a sheer
 * brand-green veil lifts it, and dark copy sits over the top.
 *
 * The veil is `brand-50` straight off the brand ramp, held at 70% across the
 * text column and clearing to almost nothing by 88%.
 *
 * 70% is the floor, not a guess. Measured across all four photographs — the
 * darkest local background behind the copy, blurred to model what a glyph
 * actually sits on — the contrast at 70% is:
 *
 *   heading  ink-900    7.6:1
 *   intro    ink-700    4.9:1
 *   eyebrow  accent-800 5.5:1
 *
 * At 68% the eyebrow is 5.2:1 and the intro 4.6:1; at 66% the intro drops to
 * 4.3:1 and fails WCAG AA. So going sheerer than this means darkening the
 * copy further or accepting text that does not meet AA on the darker photos.
 *
 * Because the text is dark, a bright photograph is the safe case here and a
 * very dark one is the risk — the opposite of a white-on-dark banner.
 *
 * `image` is any path under /public. To swap a photograph, drop a new file at
 * the same path; nothing else needs to change.
 */
export function PageBanner({
  image,
  eyebrow,
  title,
  intro,
  children,
  size = "default",
}: {
  image: string;
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  children?: ReactNode;
  /** "tall" for the home hero, "default" for interior pages. */
  size?: "default" | "tall";
}) {
  return (
    <section className="relative isolate overflow-hidden border-b border-brand-900/10 bg-brand-50 text-ink-900">
      <Image
        src={image}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      {/* Sheer brand-green veil: flat 70% across the text column, then gone
          by 88% so the right of the photograph keeps its full colour. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(to_right,color-mix(in_srgb,var(--color-brand-50)_70%,transparent)_0%,color-mix(in_srgb,var(--color-brand-50)_70%,transparent)_62%,color-mix(in_srgb,var(--color-brand-50)_4%,transparent)_88%)]"
      />
      {/* A touch of vertical shading to seat the banner against the header. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-brand-50/20 via-transparent to-brand-50/15"
      />

      <Container
        className={
          size === "tall"
            ? "relative py-24 sm:py-32 lg:py-40"
            : "relative py-20 sm:py-24"
        }
      >
        <div className="max-w-2xl">
          {/* accent-800 rather than accent-600: the darker step is what lets
              the veil stay at 70% and still clear AA. */}
          <p className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.18em] text-accent-800">
            <span aria-hidden className="h-px w-8 bg-accent-600" />
            {eyebrow}
          </p>
          <h1
            className={`mt-4 font-semibold leading-[1.1] tracking-tight text-ink-900 ${
              size === "tall"
                ? "text-4xl sm:text-5xl lg:text-6xl"
                : "text-4xl sm:text-5xl"
            }`}
          >
            {title}
          </h1>
          {intro && (
            <p className="mt-6 text-lg leading-relaxed text-ink-700">{intro}</p>
          )}
          {children}
        </div>
      </Container>
    </section>
  );
}
