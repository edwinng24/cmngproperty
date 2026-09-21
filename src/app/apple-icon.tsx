import { ImageResponse } from "next/og";

// iOS ignores SVG touch icons, so this renders the mark to a PNG at build time.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0c523b",
        }}
      >
        <svg width="126" height="126" viewBox="0 0 64 64" fill="none">
          <rect x={41.5} y={1.5} width={5.8} height={12} rx={1.4} fill="#dc9bb1" />
          <path
            d="M52.8 20 32 4 11.2 20A24 24 0 1 0 54.6 40.2"
            stroke="#ffffff"
            strokeWidth={9}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    size,
  );
}
