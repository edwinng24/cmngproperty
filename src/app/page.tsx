import Link from "next/link";
import { PageBanner } from "@/components/PageBanner";
import { ButtonLink, Container, Eyebrow, Section } from "@/components/ui";
import { differentiators, process, services } from "@/lib/content";
import { site } from "@/lib/site";

export default function HomePage() {
  return (
    <>
      <PageBanner
        image="/banners/home.jpg"
        eyebrow="Residential property management"
        title={site.tagline}
        intro={site.description}
        size="tall"
      >
        <div className="mt-9 flex flex-wrap gap-3">
          <ButtonLink href="/services">See what we handle</ButtonLink>
        </div>
        <p className="mt-6 text-sm text-ink-700">
          Month-to-month agreements. No markup on maintenance.
        </p>
      </PageBanner>

      {/* Services overview */}
      <Section>
        <div className="max-w-2xl">
          <Eyebrow>What we do</Eyebrow>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
            Full-service management, not a list of add-ons
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ink-600">
            Everything below is included in the management fee. We would rather
            quote one honest number than nickel-and-dime an owner for the work
            managing a property actually requires.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <div
              key={service.title}
              className="group rounded-xl border border-brand-900/10 bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-accent-300 hover:shadow-lg hover:shadow-brand-950/5"
            >
              <h3 className="text-lg font-semibold text-brand-800">
                {service.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-600">
                {service.summary}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <Link
            href="/services"
            className="text-sm font-semibold text-accent-700 underline underline-offset-4 hover:text-accent-900"
          >
            Read the detail on each service →
          </Link>
        </div>
      </Section>

      {/* Why us */}
      <section className="bg-sand-50 py-16 sm:py-24">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
            <div>
              <Eyebrow>Why owners stay</Eyebrow>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
                The terms are the differentiator
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-ink-600">
                Most management companies describe themselves the same way. What
                separates them is what is in the agreement — so here is ours,
                up front.
              </p>
            </div>
            <dl className="grid gap-6 sm:grid-cols-2">
              {differentiators.map((item) => (
                <div key={item.title}>
                  <dt className="text-base font-semibold text-brand-900">
                    {item.title}
                  </dt>
                  <dd className="mt-2 text-sm leading-relaxed text-ink-600">
                    {item.body}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </Container>
      </section>

      {/* Process */}
      <Section>
        <div className="max-w-2xl">
          <Eyebrow>Getting started</Eyebrow>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
            Four steps from first enquiry to managed
          </h2>
        </div>
        <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {process.map((item) => (
            <li key={item.step} className="border-t-2 border-accent-400 pt-5">
              <span className="text-sm font-semibold tracking-widest text-accent-600">
                {item.step}
              </span>
              <h3 className="mt-2 text-lg font-semibold text-brand-900">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">
                {item.body}
              </p>
            </li>
          ))}
        </ol>
      </Section>

      {/* CTA */}
      <section className="bg-brand-900 py-16 text-white sm:py-20">
        <Container className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
          <div className="max-w-xl">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Find out what your property should be earning
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-brand-100">
              A property review is free and comes with a written rent estimate —
              whether or not you decide to work with us.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/contact" variant="secondary">
              Contact us
            </ButtonLink>
            <ButtonLink
              href={`mailto:${site.email}`}
              className="bg-white/10 text-white hover:bg-white/20"
            >
              Email us
            </ButtonLink>
          </div>
        </Container>
      </section>
    </>
  );
}
