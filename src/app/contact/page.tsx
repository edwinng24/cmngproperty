import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { PageBanner } from "@/components/PageBanner";
import { Container, Section } from "@/components/ui";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: `Talk to ${site.name} about managing your rental property. Free property review and written rent estimate.`,
};

export default function ContactPage() {
  return (
    <>
      <PageBanner
        image="/banners/contact.jpg"
        eyebrow="Contact"
        title="Tell us about the property"
        intro="Owners, residents and prospective tenants all reach us here. Send the details and we will come back within one business day."
      />

      <Section>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-ink-900">
              Send a message
            </h2>
            <p className="mt-2 text-sm text-ink-600">
              Fields marked <span className="text-red-600">*</span> are
              required.
            </p>
            <div className="mt-8">
              <ContactForm />
            </div>
          </div>

          <aside className="space-y-8">
            <div className="rounded-xl border border-brand-900/10 bg-brand-950 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-accent-300">
                Reach us directly
              </h2>
              <dl className="mt-5 space-y-4 text-sm">
                <div>
                  <dt className="font-semibold text-white">Email</dt>
                  <dd className="mt-1">
                    <a
                      href={`mailto:${site.email}`}
                      className="text-brand-200 underline underline-offset-2 hover:text-white"
                    >
                      {site.email}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-white">Hours</dt>
                  <dd className="mt-1 text-brand-200">{site.hours}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-xl border-l-4 border-accent-500 bg-accent-50 p-6">
              <h2 className="text-base font-semibold text-accent-900">
                Maintenance emergency?
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-accent-900/85">
                Current residents with no heat, no water, a leak or anything
                unsafe should email{" "}
                <a
                  href={`mailto:${site.email}?subject=URGENT%20maintenance`}
                  className="font-semibold underline underline-offset-2"
                >
                  {site.email}
                </a>{" "}
                with URGENT in the subject line. Emergency intake is monitored
                around the clock.
              </p>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
