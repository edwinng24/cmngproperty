import { ImageResponse } from "next/og";

/** Temporary palette sheet. Delete along with /logo-preview. */

const ramps: Record<string, string[]> = {
  brand: [
    "#eef7f2",
    "#d3ecdf",
    "#a9d9c3",
    "#74bd9f",
    "#3f9d79",
    "#1d815e",
    "#0f6749",
    "#0c523b",
    "#0d4231",
    "#0c3629",
    "#041d17",
  ],
  clay: [
    "#fdf4f0",
    "#fbe4d9",
    "#f6c6b1",
    "#ef9f7e",
    "#e5744d",
    "#d4512a",
    "#bb3d1d",
    "#9a301a",
    "#7d2a1b",
    "#672619",
  ],
  sand: ["#fdfaf3", "#f9f1e1", "#f0e2c4", "#e0c99b", "#ccab6d", "#b08c4b"],
  ink: ["#0f1f1a", "#2d413a", "#45584f", "#5f7168"],
};

const steps: Record<string, number[]> = {
  brand: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950],
  clay: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900],
  sand: [50, 100, 200, 300, 400, 500],
  ink: [900, 700, 600, 500],
};

function lum(hex: string) {
  const c = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

function ratio(a: string, b: string) {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

const pairs: [string, string, string][] = [
  ["Body text", "#2d413a", "#ffffff"],
  ["Secondary text", "#45584f", "#ffffff"],
  ["Caption", "#5f7168", "#ffffff"],
  ["Link / heading", "#0c523b", "#ffffff"],
  ["Eyebrow (clay)", "#bb3d1d", "#ffffff"],
  ["Primary button", "#ffffff", "#bb3d1d"],
  ["On deep green", "#d3ecdf", "#041d17"],
  ["Accent on green", "#ef9f7e", "#041d17"],
];

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#ffffff",
          padding: 40,
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 30,
            fontWeight: 700,
            color: "#041d17",
          }}
        >
          CMNG Property — palette
        </div>

        {Object.keys(ramps).map((name) => (
          <div
            key={name}
            style={{ display: "flex", flexDirection: "column", marginTop: 22 }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 15,
                fontWeight: 700,
                color: "#45584f",
                marginBottom: 8,
                letterSpacing: 1,
              }}
            >
              {name.toUpperCase()}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {ramps[name].map((hex, i) => (
                <div
                  key={hex}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      width: 94,
                      height: 64,
                      borderRadius: 10,
                      background: hex,
                      border: "1px solid rgba(0,0,0,0.08)",
                    }}
                  />
                  <div
                    style={{ display: "flex", fontSize: 12, color: "#45584f", marginTop: 5 }}
                  >
                    {steps[name][i]}
                  </div>
                  <div
                    style={{ display: "flex", fontSize: 10, color: "#5f7168" }}
                  >
                    {hex}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div
          style={{
            display: "flex",
            fontSize: 15,
            fontWeight: 700,
            color: "#45584f",
            marginTop: 28,
            marginBottom: 8,
            letterSpacing: 1,
          }}
        >
          CONTRAST — WCAG AA NEEDS 4.5:1 FOR BODY TEXT
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {pairs.map(([label, fg, bg]) => {
            const r = ratio(fg, bg);
            return (
              <div
                key={label}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  width: 246,
                  height: 74,
                  padding: "0 16px",
                  borderRadius: 10,
                  background: bg,
                  border: "1px solid rgba(0,0,0,0.08)",
                }}
              >
                <div style={{ display: "flex", fontSize: 17, color: fg }}>
                  {label}
                </div>
                <div
                  style={{
                    display: "flex",
                    fontSize: 13,
                    color: fg,
                    opacity: 0.8,
                  }}
                >
                  {r.toFixed(1)}:1 {r >= 4.5 ? "PASS" : "LARGE TEXT ONLY"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    ),
    { width: 1100, height: 860 },
  );
}
