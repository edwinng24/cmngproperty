/**
 * Logo marks, drawn on a 64×64 grid and inheriting `currentColor` so a single
 * mark works on the white header, the dark footer and the favicon field.
 *
 * The active mark is chosen in `Logo.tsx`. Keep all candidates here so
 * switching is a one-line change and `/logo-preview` can show them side by side.
 */

export type MarkProps = {
  className?: string;
  style?: React.CSSProperties;
  /** Accent colour for the two-tone details. Defaults to a muted currentColor. */
  accent?: string;
};

/**
 * Keyhole C — the monogram C, with its counter occupied by a keyhole.
 * Reads as a letter at favicon size, reveals the key on closer look.
 */
export function MarkKeyholeC({ className, style, accent }: MarkProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      style={style}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M46.14 15.15A22 22 0 1 0 46.14 48.85"
        stroke="currentColor"
        strokeWidth={9}
        strokeLinecap="round"
      />
      <g fill={accent ?? "currentColor"} opacity={accent ? 1 : 0.85}>
        <circle cx={31} cy={27} r={6.4} />
        <path d="M28 31.5 L24.8 44.5 H37.2 L34 31.5 Z" />
      </g>
    </svg>
  );
}

/**
 * Arch — a C turned on its side into a doorway, with an arched door inside it.
 * Warmer and more architectural; less obviously a letter.
 */
export function MarkArch({ className, style, accent }: MarkProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      style={style}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M11 54V31a21 21 0 0 1 42 0v23"
        stroke="currentColor"
        strokeWidth={9}
        strokeLinecap="round"
      />
      <path
        d="M24 54V41.5a8 8 0 0 1 16 0V54Z"
        fill={accent ?? "currentColor"}
        opacity={accent ? 1 : 0.85}
      />
    </svg>
  );
}

/**
 * Lit window — four panes for the four letters of CMNG, one of them occupied.
 * The most literal of the three, and the strongest at very small sizes.
 */
export function MarkLitWindow({ className, style, accent }: MarkProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      style={style}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M35.5 35.5H51.5V46a5.5 5.5 0 0 1-5.5 5.5H35.5Z"
        fill={accent ?? "currentColor"}
        opacity={accent ? 1 : 0.85}
      />
      <rect
        x={9}
        y={9}
        width={46}
        height={46}
        rx={9}
        stroke="currentColor"
        strokeWidth={7}
      />
      <path
        d="M32 9V55M9 32H55"
        stroke="currentColor"
        strokeWidth={7}
        strokeLinecap="square"
      />
    </svg>
  );
}


/**
 * Keyhole Crest — the elaborate mark. The same C, but built as seven
 * voussoirs with a projecting keystone at the apex, the way a real arch is
 * cut, with the keyhole in the counter and a hairline seal ring around it.
 *
 * It carries the detail at display sizes; below about 28px the joints close
 * up, so `Logo` falls back to MarkKeyholeC for favicons and small lockups.
 */
export function MarkKeyholeCrest({ className, style, accent }: MarkProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      style={style}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {/* Seal ring, broken where the C opens. */}
      <path
        d="M50.9 9.6A31 31 0 1 0 50.9 54.4"
        stroke="currentColor"
        strokeWidth={1.3}
        strokeLinecap="round"
        opacity={0.45}
      />
      {/* Voussoirs. */}
      <g fill="currentColor">
        <path d="M48.32 11.12A26.5 26.5 0 0 0 33.85 5.56L33.22 14.54A17.5 17.5 0 0 1 42.77 18.21Z" />
        <path d="M32.46 5.50A26.5 26.5 0 0 0 17.57 9.78L22.47 17.32A17.5 17.5 0 0 1 32.31 14.50Z" />
        <path d="M16.42 10.56A26.5 26.5 0 0 0 7.10 22.94L15.56 26.01A17.5 17.5 0 0 1 21.71 17.84Z" />
        <path d="M7.10 41.06A26.5 26.5 0 0 0 16.42 53.44L21.71 46.16A17.5 17.5 0 0 1 15.56 37.99Z" />
        <path d="M17.57 54.22A26.5 26.5 0 0 0 32.46 58.50L32.31 49.50A17.5 17.5 0 0 1 22.47 46.68Z" />
        <path d="M33.85 58.44A26.5 26.5 0 0 0 48.32 52.88L42.77 45.79A17.5 17.5 0 0 1 33.22 49.46Z" />
      </g>
      {/* Keystone — projects past the arc line, like the real thing. */}
      <path
        d="M3.08 22.32A30.5 30.5 0 0 0 3.08 41.68L15.40 37.55A17.5 17.5 0 0 1 15.40 26.45Z"
        fill={accent ?? "currentColor"}
      />
      {/* Keyhole. */}
      <g fill={accent ?? "currentColor"} opacity={accent ? 1 : 0.85}>
        <circle cx={32} cy={27} r={6.2} />
        <path d="M29.1 31.4 L26.2 44 H37.8 L34.9 31.4 Z" />
      </g>
    </svg>
  );
}


/**
 * Key-House — the bow of a key drawn as a house, with the shaft and bits
 * below. Two ideas in one silhouette: the property, and the moment it is
 * handed over. Solid shapes only, so it holds together at favicon size.
 */
export function MarkKeyHouse({ className, style, accent }: MarkProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      style={style}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {/* House-shaped bow, with the key's hole punched through it. */}
      <path
        d="M32 3.5 54 21.5a3 3 0 0 1 1.2 2.4V35a4 4 0 0 1-4 4H12.8a4 4 0 0 1-4-4V23.9a3 3 0 0 1 1.2-2.4Z
           M32 16.6a5.9 5.9 0 1 0 0 11.8 5.9 5.9 0 0 0 0-11.8Z"
        fill="currentColor"
        fillRule="evenodd"
      />
      {/* Shaft and bits. */}
      <path d="M28.6 39h6.8v21.2a3.4 3.4 0 0 1-6.8 0Z" fill="currentColor" />
      <path
        d="M35.4 43.4h10.2v5.4H35.4Z M35.4 51.6h7.4V57H35.4Z"
        fill={accent ?? "currentColor"}
        fillRule="evenodd"
      />
    </svg>
  );
}

/**
 * Roofline — two rooftops that also read as the M of CMNG, set in a seal ring.
 * The quietest of the three and the most legible at small sizes.
 */
export function MarkRoofline({ className, style, accent }: MarkProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      style={style}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx={32} cy={32} r={28} stroke="currentColor" strokeWidth={4} />
      <path
        d="M14 41 23.5 26 32 39.5 40.5 26 50 41"
        stroke="currentColor"
        strokeWidth={5.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={32} cy={48.5} r={3.4} fill={accent ?? "currentColor"} />
    </svg>
  );
}

/**
 * Portfolio — four houses in a block, one of them occupied. Four for the four
 * letters of CMNG, and the clearest statement of what the business manages.
 */
export function MarkPortfolio({ className, style, accent }: MarkProps) {
  const house = "M11 0 22 9.2V20a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V9.2Z";
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      style={style}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <g fill="currentColor">
        <path d={house} transform="translate(7 8)" />
        <path d={house} transform="translate(35 8)" />
        <path d={house} transform="translate(7 34)" />
      </g>
      <path d={house} transform="translate(35 34)" fill={accent ?? "currentColor"} />
    </svg>
  );
}


/**
 * Counter-House — a solid disc with a house cut clean out of the middle and a
 * slot cut out of the right edge, so the ring that remains reads as a C. The
 * letter and the house are the same shape: you cannot draw one without the
 * other. Even-odd fill does all the work, so it is a single path.
 */
export function MarkCounterHouse({ className, style, accent }: MarkProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      style={style}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fillRule="evenodd"
        fill="currentColor"
        d="M32 3A29 29 0 1 0 32 61A29 29 0 1 0 32 3Z
           M32 13 44 25.5V47.5H20V25.5Z
           M44 23H65V41H44Z"
      />
      {/* Door, in the accent — the one warm note. */}
      <path
        d="M28.6 47.5V38.4a3.4 3.4 0 0 1 6.8 0v9.1Z"
        fill={accent ?? "currentColor"}
      />
    </svg>
  );
}

/**
 * Roof-C — one continuous stroke. It starts as a pitched roof, turns the
 * corner at the eaves and runs round as the bowl of a C. Chimney in the
 * accent. The most typographic of the set.
 */
export function MarkRoofC({ className, style, accent }: MarkProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      style={style}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {/* Drawn first so the roof stroke laps over its base. */}
      <rect
        x={41.5}
        y={1.5}
        width={5.8}
        height={12}
        rx={1.4}
        fill={accent ?? "currentColor"}
      />
      <path
        d="M52.8 20 32 4 11.2 20A24 24 0 1 0 54.6 40.2"
        stroke="currentColor"
        strokeWidth={9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Ring-House — a plain C ring with a solid house sitting in its counter.
 * The most immediately legible, and the least clever.
 */
export function MarkRingHouse({ className, style, accent }: MarkProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      style={style}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M46.8 14.4A23 23 0 1 0 46.8 49.6"
        stroke="currentColor"
        strokeWidth={8}
        strokeLinecap="round"
      />
      <path
        d="M32 21 43.5 30.6V44.5a1.5 1.5 0 0 1-1.5 1.5H22a1.5 1.5 0 0 1-1.5-1.5V30.6Z"
        fill={accent ?? "currentColor"}
      />
    </svg>
  );
}

export const markConcepts = [
  {
    id: "counter-house",
    name: "Counter-House",
    Mark: MarkCounterHouse,
    rationale:
      "A disc with a house cut out of it and a slot cut out of the right edge; what is left reads as a C. The letter and the house are the same shape.",
  },
  {
    id: "roof-c",
    name: "Roof-C",
    Mark: MarkRoofC,
    rationale:
      "One continuous stroke that starts as a pitched roof and runs round as the bowl of a C. The most typographic of the set.",
  },
  {
    id: "ring-house",
    name: "Ring-House",
    Mark: MarkRingHouse,
    rationale:
      "A plain C ring with a solid house in its counter. The most immediately legible and the least clever.",
  },
  {
    id: "key-house",
    name: "Key-House",
    Mark: MarkKeyHouse,
    rationale:
      "A key whose bow is a house, the hole punched straight through it. Says property and handover in one silhouette, and it is all solid shapes so nothing closes up at 16px.",
  },
  {
    id: "roofline",
    name: "Roofline",
    Mark: MarkRoofline,
    rationale:
      "Two rooftops that double as the M of CMNG, set in a seal ring. Quietest of the set and the most legible small, but chevrons are common in this category.",
  },
  {
    id: "portfolio",
    name: "Portfolio",
    Mark: MarkPortfolio,
    rationale:
      "Four houses, one of them occupied — four for the four letters of CMNG. The most literal statement of what the business manages.",
  },
  {
    id: "keyhole-crest",
    name: "Keyhole Crest",
    Mark: MarkKeyholeCrest,
    rationale:
      "The Keyhole C cut as an arch: seven voussoirs, a projecting keystone at the apex, a keyhole in the counter and a hairline seal ring. Carries detail at display sizes and ties the mark to the architecture running through the banner art.",
  },
  {
    id: "keyhole-c",
    name: "Keyhole C (compact)",
    Mark: MarkKeyholeC,
    rationale:
      "The solid form of the same mark. The joints in the crest close up below roughly 28px, so this is what gets used for favicons and small lockups.",
  },
  {
    id: "arch",
    name: "Arch",
    Mark: MarkArch,
    rationale:
      "The same C rotated into a doorway, with an arched door set inside it. Architectural and welcoming, but it reads as a building before it reads as a letter.",
  },
  {
    id: "lit-window",
    name: "Lit window",
    Mark: MarkLitWindow,
    rationale:
      "Four panes for the four letters of CMNG, one of them lit. The occupancy story is immediate and it survives 16px better than the others — but window grids are common in this category.",
  },
] as const;
