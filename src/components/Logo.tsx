import { MarkRoofC, type MarkProps } from "./logo-concepts";
import { site } from "@/lib/site";

/**
 * The active mark: Roof-C — one continuous stroke that starts as a pitched
 * roof, turns at the eaves and runs round as the bowl of a C, with a chimney
 * in the accent colour. A monogram and a roofline in the same figure.
 *
 * A single stroke of even weight, so it needs no separate compact cut — the
 * same geometry serves the header, the footer and the favicon.
 *
 * To change the mark everywhere, swap this one import. The alternatives live
 * in ./logo-concepts and are compared at /logo-preview.
 */
const ActiveMark = MarkRoofC;

export function LogoMark(props: MarkProps) {
  return <ActiveMark {...props} />;
}

export function Logo({
  className = "",
  markClassName = "h-9 w-9",
  accent,
}: {
  className?: string;
  markClassName?: string;
  /** Two-tone accent for the chimney. Defaults to currentColor. */
  accent?: string;
}) {
  const [first, ...rest] = site.name.split(" ");

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className={markClassName} accent={accent} />
      <span className="text-lg leading-none tracking-tight">
        <span className="font-bold tracking-[0.02em]">{first}</span>
        {rest.length > 0 && (
          <span className="font-normal opacity-70"> {rest.join(" ")}</span>
        )}
      </span>
      <span className="sr-only">{site.name} home</span>
    </span>
  );
}
