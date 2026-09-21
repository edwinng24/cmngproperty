import type { Metadata } from "next";
import { PageBanner } from "@/components/PageBanner";
import { ServiceIcon } from "@/components/ServiceIcon";
import { ButtonLink, Container, Eyebrow } from "@/components/ui";
import { faqs, services } from "@/lib/content";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Tenant placement, rent collection, maintenance, inspections and owner reporting — everything included in one management fee.",
};

const slug = (title: string) =>
  title
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export default function ServicesPage() {
  return (
    <>
      <PageBanner
        image="/banners/services.jpg"
        eyebrow="Services"
        title="Everything managing a rental actually takes"
        intro="One fee covers all six. If something falls outside it, we tell you the cost before the work happens — never after."
      />

      {/* Jump index — six services is a lot to scroll past blind. */}
      <div className="border-b border-brand-900/12 bg-brand-950">
        <Container className="py-6">
          <h2 className="sr-only">Jump to a service</h2>
          {/* All six on one line. Below xl the row scrolls sideways rather
              than wrapping, so it stays a single band at every width. */}
          <ul className="-mx-5 flex gap-1.5 overflow-x-auto px-5 [scrollbar-width:none] sm:-mx-8 sm:px-8 xl:mx-0 xl:px-0 [&::-webkit-scrollbar]:hidden">
            {services.map((service, i) => (
              <li key={service.title} className="shrink-0">
                <a
                  href={`#${slug(service.title)}`}
                  className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium text-brand-100 transition-colors hover:border-accent-400 hover:text-white"
                >
                  <span className="font-mono text-[10px] text-accent-300">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {service.title}
                </a>
              </li>
            ))}
          </ul>
        </Container>
      </div>

      {/* One band per service, alternating tone so they read as distinct. */}
      {services.map((service, i) => {
        const shaded = i % 2 === 1;
        return (
          <section
            key={service.title}
            id={slug(service.title)}
            className={`scroll-mt-16 border-b border-brand-900/10 py-14 sm:py-20 ${
              shaded ? "bg-sand-50" : "bg-white"
            }`}
          >
            <Container>
              <div className="grid gap-x-14 gap-y-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
                <div className="lg:sticky lg:top-24 lg:self-start">
                  <div className="flex items-center gap-4">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-700 text-white">
                      <ServiceIcon name={service.icon} />
                    </span>
                    <span className="font-mono text-sm font-semibold tracking-widest text-accent-600">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <h2 className="mt-5 text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
                    {service.title}
                  </h2>
                  <p className="mt-3 text-lg leading-relaxed text-ink-600">
                    {service.summary}
                  </p>
                  <p className="mt-5 inline-flex rounded-lg border-l-[3px] border-accent-500 bg-accent-50 px-3.5 py-2 text-sm font-medium text-accent-900">
                    {service.outcome}
                  </p>
                </div>

                <div
                  className={`rounded-2xl border border-brand-900/10 p-7 sm:p-8 ${
                    shaded ? "bg-white" : "bg-brand-50"
                  }`}
                >
                  <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">
                    What that includes
                  </h3>
                  <ul className="mt-5 space-y-4">
                    {service.detail.map((point) => (
                      <li key={point} className="flex gap-3.5">
                        <svg
                          aria-hidden
                          viewBox="0 0 20 20"
                          className="mt-0.5 h-5 w-5 shrink-0 text-brand-500"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="leading-relaxed text-ink-700">
                          {point}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Container>
          </section>
        );
      })}

      <section className="bg-white py-16 sm:py-24">
        <Container>
          <div className="max-w-2xl">
            <Eyebrow>Common questions</Eyebrow>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
              Before you get in touch
            </h2>
          </div>
          <dl className="mt-10 divide-y divide-brand-900/10 border-y border-brand-900/10">
            {faqs.map((faq) => (
              <div
                key={faq.q}
                className="grid gap-2 py-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] md:gap-10"
              >
                <dt className="text-base font-semibold text-brand-800">
                  {faq.q}
                </dt>
                <dd className="leading-relaxed text-ink-600">{faq.a}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-10 flex flex-wrap gap-3">
            <ButtonLink href="/contact">Ask us something else</ButtonLink>
            <ButtonLink href={`mailto:${site.email}`} variant="outline">
              Email {site.email}
            </ButtonLink>
          </div>
        </Container>
      </section>
    </>
  );
}
