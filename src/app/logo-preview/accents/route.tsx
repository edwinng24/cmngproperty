import { ImageResponse } from "next/og";

/** Temporary accent comparison. Delete along with /logo-preview. */

const BRAND = {
  950: "#041d17",
  800: "#0d4231",
  700: "#0c523b",
  100: "#d3ecdf",
};
const INK = { 900: "#0f1f1a", 600: "#45584f" };

type Ramp = { 200: string; 300: string; 400: string; 600: string };

const candidates: { name: string; hue: number; note: string; r: Ramp }[] = [
  {
    name: "Terracotta (current)",
    hue: 12,
    note: "warm neighbour, not a complement",
    r: { 200: "#f6c6b1", 300: "#ef9f7e", 400: "#e5744d", 600: "#bb3d1d" },
  },
  {
    name: "Brass",
    hue: 44,
    note: "harmonises with the sand ramp",
    r: { 200: "#f2dda4", 300: "#e2c063", 400: "#c9a22f", 600: "#8a6a14" },
  },
  {
    name: "Plum",
    hue: 342,
    note: "the true complement of the green",
    r: { 200: "#f0cdd8", 300: "#dc9bb1", 400: "#c26685", 600: "#8a2f4b" },
  },
  {
    name: "Teal",
    hue: 192,
    note: "cool, analogous — quiet rather than loud",
    r: { 200: "#bfe3ea", 300: "#87ccd9", 400: "#42a8bd", 600: "#186d83" },
  },
];

function Row({ c }: { c: (typeof candidates)[number] }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: "20px 34px",
        borderTop: "1px solid #e2e9e6",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", width: 190 }}>
        <div style={{ display: "flex", fontSize: 18, fontWeight: 700, color: INK[900] }}>
          {c.name}
        </div>
        <div style={{ display: "flex", fontSize: 12, color: INK[600], marginTop: 3 }}>
          hue {c.hue}° · {c.note}
        </div>
      </div>

      {/* Ramp chips */}
      <div style={{ display: "flex", gap: 5 }}>
        {[c.r[200], c.r[300], c.r[400], c.r[600]].map((hex) => (
          <div
            key={hex}
            style={{ display: "flex", width: 38, height: 52, borderRadius: 7, background: hex }}
          />
        ))}
      </div>

      {/* Button + eyebrow on white */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 9,
          width: 216,
          padding: "14px 16px",
          borderRadius: 11,
          border: "1px solid #e2e9e6",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", width: 24, height: 2, background: c.r[400] }} />
          <div style={{ display: "flex", fontSize: 11, fontWeight: 700, color: c.r[600], letterSpacing: 2 }}>
            SERVICES
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignSelf: "flex-start",
            padding: "9px 18px",
            borderRadius: 8,
            background: c.r[600],
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          Request a review
        </div>
      </div>

      {/* Dark panel */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          width: 216,
          padding: "14px 16px",
          borderRadius: 11,
          background: BRAND[950],
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", width: 24, height: 2, background: c.r[400] }} />
          <div style={{ display: "flex", fontSize: 11, fontWeight: 700, color: c.r[300], letterSpacing: 2 }}>
            CONTACT
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 15, color: "#fff", fontWeight: 700 }}>
          Tell us about it
        </div>
        <div style={{ display: "flex", fontSize: 12, color: BRAND[100] }}>
          Banner heading over artwork
        </div>
      </div>

      {/* Banner-style lit windows against the green */}
      <div
        style={{
          display: "flex",
          width: 210,
          height: 92,
          borderRadius: 11,
          background: BRAND[950],
          padding: 10,
          gap: 6,
        }}
      >
        {[BRAND[700], BRAND[800], BRAND[700]].map((tower, ti) => (
          <div
            key={ti}
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 5,
              width: 62,
              padding: 6,
              borderRadius: 6,
              background: tower,
              alignContent: "flex-start",
            }}
          >
            {[0, 1, 2, 3, 4, 5].map((w) => (
              <div
                key={w}
                style={{
                  display: "flex",
                  width: 12,
                  height: 12,
                  borderRadius: 3,
                  background:
                    (w + ti) % 3 === 0 ? c.r[400] : (w + ti) % 3 === 1 ? "#e0c99b" : BRAND[950],
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#fff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", padding: "28px 34px 16px" }}>
          <div style={{ display: "flex", fontSize: 27, fontWeight: 700, color: BRAND[950] }}>
            Accent candidates against the evergreen
          </div>
          <div style={{ display: "flex", fontSize: 14, color: INK[600], marginTop: 5 }}>
            Brand green sits at hue 160°, so its true complement is 340°. All four pass WCAG AA.
          </div>
        </div>
        {candidates.map((c) => (
          <Row key={c.name} c={c} />
        ))}
      </div>
    ),
    { width: 1240, height: 700 },
  );
}
