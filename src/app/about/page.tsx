import type { Metadata } from "next";
import { PageBanner } from "@/components/PageBanner";
import { ButtonLink, Container, Eyebrow, Section } from "@/components/ui";
import { differentiators } from "@/lib/content";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: `${site.name} is a residential property management company working with owners who want the income without the day-to-day.`,
};

const principles = [
  {
    title: "Owners get the whole picture",
    body: "Including the parts that are inconvenient. If a unit is overpriced, if a repair is going to be expensive, if a tenant is a risk — you hear it early, while it is still a decision rather than a problem.",
  },
  {
    title: "Tenants are treated as customers",
    body: "A resident whose requests get answered renews. Renewals are the cheapest occupancy an owner will ever buy, so good tenant service is not charity — it is the business model.",
  },
  {
    title: "Small enough to know your property",
    body: "We cap how many doors each manager carries. It limits how fast we grow, and it is the reason we can answer a question about your property without looking it up.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageBanner
        image="/banners/about.jpg"
        eyebrow="About"
        title={<>A management company built around the owner&rsquo;s numbers</>}
        intro={`${site.name} manages residential rentals for owners who want the income without the day-to-day — and who want to understand exactly what is happening with the asset.`}
      />

      <Section>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <div className="space-y-5 text-lg leading-relaxed text-ink-700">
            <h2 className="text-3xl font-semibold tracking-tight text-ink-900">
              Why we started
            </h2>
            <p>
              Most owners do not leave a management company because of one big
              failure. They leave because of a slow accumulation of small ones:
              a statement that does not reconcile, a repair invoice with an
              unexplained markup, a vacancy nobody flagged until it was two
              months old.
            </p>
            <p>
              {site.name} was set up to remove those. Contractor invoices pass
              through at cost. Statements show the actual invoice behind every
              line. Vacancy days are reported as a number, not described as
              &ldquo;a bit slow this month.&rdquo; None of that is remarkable —
              it is just what an owner should already be getting.
            </p>
            <p>
              The result is a business that grows by keeping owners rather than
              by signing them. That shapes the decisions we make: month-to-month
              agreements, capped portfolios per manager, and a preference for
              telling you something early over telling you something
              comfortable.
            </p>
          </div>

          <aside className="rounded-xl border border-brand-900/10 bg-brand-950 p-7 text-brand-100">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-accent-300">
              At a glance
            </h2>
            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="font-semibold text-white">Focus</dt>
                <dd className="mt-1 text-brand-200">
                  Residential rentals — single-family homes, condos and small
                  multi-family buildings.
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-white">Hours</dt>
                <dd className="mt-1 text-brand-200">{site.hours}</dd>
              </div>
              <div>
                <dt className="font-semibold text-white">Emergencies</dt>
                <dd className="mt-1 text-brand-200">
                  Maintenance intake is staffed 24/7 for current residents.
                </dd>
              </div>
            </dl>
          </aside>
        </div>
      </Section>

      <section className="bg-sand-50 py-16 sm:py-24">
        <Container>
          <div className="max-w-2xl">
            <Eyebrow>How we work</Eyebrow>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
              Three principles we do not trade away
            </h2>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {principles.map((item) => (
              <div key={item.title}>
                <h3 className="text-lg font-semibold text-brand-800">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-600">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <Section>
        <div className="max-w-2xl">
          <Eyebrow>In the agreement</Eyebrow>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
            What that means in writing
          </h2>
        </div>
        <dl className="mt-10 grid gap-8 sm:grid-cols-2">
          {differentiators.map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-brand-900/10 border-l-4 border-l-accent-500 p-6"
            >
              <dt className="text-base font-semibold text-brand-800">
                {item.title}
              </dt>
              <dd className="mt-2 text-sm leading-relaxed text-ink-600">
                {item.body}
              </dd>
            </div>
          ))}
        </dl>
        <div className="mt-10">
          <ButtonLink href="/contact">Talk to us about your property</ButtonLink>
        </div>
      </Section>
    </>
  );
}
