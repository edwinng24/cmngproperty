import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-6xl px-5 sm:px-8 ${className}`}>
      {children}
    </div>
  );
}

export function Section({
  children,
  className = "",
  ...rest
}: ComponentProps<"section">) {
  return (
    <section className={`py-16 sm:py-24 ${className}`} {...rest}>
      <Container>{children}</Container>
    </section>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.18em] text-accent-600">
      <span aria-hidden className="h-px w-8 bg-accent-400" />
      {children}
    </p>
  );
}

const buttonBase =
  "inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-semibold transition-colors";

const buttonVariants = {
  primary: "bg-accent-600 text-white shadow-sm hover:bg-accent-700",
  secondary: "bg-sand-200 text-brand-950 hover:bg-sand-300",
  outline:
    "border border-brand-700/30 text-brand-800 hover:border-brand-700 hover:bg-brand-50",
} as const;

export function ButtonLink({
  href,
  variant = "primary",
  className = "",
  children,
}: {
  href: string;
  variant?: keyof typeof buttonVariants;
  className?: string;
  children: ReactNode;
}) {
  const classes = `${buttonBase} ${buttonVariants[variant]} ${className}`;
  // next/link does not handle tel:/mailto:, so route those to a plain anchor.
  if (href.startsWith("http") || href.includes(":")) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}
