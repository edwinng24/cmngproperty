import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/** Temporary: rasterises the banner art for review. Delete with /logo-preview. */
const names = ["home", "services", "about", "contact"];

function dataUri(name: string) {
  const svg = readFileSync(
    join(process.cwd(), "public", "banners", `${name}.svg`),
  );
  return `data:image/svg+xml;base64,${svg.toString("base64")}`;
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
          background: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        {names.map((n) => (
          <div key={n} style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                width: 120,
                paddingLeft: 16,
                fontSize: 17,
                fontWeight: 700,
                color: "#0c523b",
              }}
            >
              {n}
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={dataUri(n)} width={800} height={450} alt={n} />
          </div>
        ))}
      </div>
    ),
    { width: 940, height: 1820 },
  );
}
