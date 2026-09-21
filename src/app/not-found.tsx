import { ButtonLink, Container } from "@/components/ui";

export default function NotFound() {
  return (
    <Container className="py-28 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">
        404
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-brand-950">
        That page does not exist
      </h1>
      <p className="mx-auto mt-4 max-w-md leading-relaxed text-ink-600">
        The link may be out of date. Start from the home page, or get in touch
        and we will point you the right way.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <ButtonLink href="/">Back to home</ButtonLink>
        <ButtonLink href="/contact" variant="outline">
          Contact us
        </ButtonLink>
      </div>
    </Container>
  );
}
