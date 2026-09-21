import { ImageResponse } from "next/og";

/**
 * Temporary comparison sheet — renders the three candidate marks to a PNG so
 * they can be reviewed outside a browser. Delete along with /logo-preview
 * once a mark is chosen.
 */

const GREEN = "#0c523b";
const DARK = "#041d17";
const SAND = "#e0c99b";
const ACCENT = "#dc9bb1";
const ACCENT_D = "#8a2f4b";



function CounterHouse({ size, color, accent }: MarkArgs) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <path fillRule="evenodd" fill={color}
        d="M32 3A29 29 0 1 0 32 61A29 29 0 1 0 32 3Z M32 13 44 25.5V47.5H20V25.5Z M44 23H65V41H44Z" />
      <path d="M28.6 47.5V38.4a3.4 3.4 0 0 1 6.8 0v9.1Z" fill={accent} />
    </svg>
  );
}

function RoofC({ size, color, accent }: MarkArgs) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <rect x={41.5} y={1.5} width={5.8} height={12} rx={1.4} fill={accent} />
      <path d="M52.8 20 32 4 11.2 20A24 24 0 1 0 54.6 40.2" stroke={color}
        strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RingHouse({ size, color, accent }: MarkArgs) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <path d="M46.8 14.4A23 23 0 1 0 46.8 49.6" stroke={color} strokeWidth={8} strokeLinecap="round" />
      <path d="M32 21 43.5 30.6V44.5a1.5 1.5 0 0 1-1.5 1.5H22a1.5 1.5 0 0 1-1.5-1.5V30.6Z" fill={accent} />
    </svg>
  );
}

function KeyHouse({ size, color, accent }: MarkArgs) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <path
        d="M32 3.5 54 21.5a3 3 0 0 1 1.2 2.4V35a4 4 0 0 1-4 4H12.8a4 4 0 0 1-4-4V23.9a3 3 0 0 1 1.2-2.4Z M32 16.6a5.9 5.9 0 1 0 0 11.8 5.9 5.9 0 0 0 0-11.8Z"
        fill={color}
        fillRule="evenodd"
      />
      <path d="M28.6 39h6.8v21.2a3.4 3.4 0 0 1-6.8 0Z" fill={color} />
      <path d="M35.4 43.4h10.2v5.4H35.4Z M35.4 51.6h7.4V57H35.4Z" fill={accent} fillRule="evenodd" />
    </svg>
  );
}

function Roofline({ size, color, accent }: MarkArgs) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <circle cx={32} cy={32} r={28} stroke={color} strokeWidth={4} />
      <path d="M14 41 23.5 26 32 39.5 40.5 26 50 41" stroke={color} strokeWidth={5.4} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={32} cy={48.5} r={3.4} fill={accent} />
    </svg>
  );
}

function Portfolio({ size, color, accent }: MarkArgs) {
  const h = "M11 0 22 9.2V20a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V9.2Z";
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <g fill={color}>
        <path d={h} transform="translate(7 8)" />
        <path d={h} transform="translate(35 8)" />
        <path d={h} transform="translate(7 34)" />
      </g>
      <path d={h} transform="translate(35 34)" fill={accent} />
    </svg>
  );
}

function KeyholeCrest({ size, color, accent }: MarkArgs) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <path
        d="M50.9 9.6A31 31 0 1 0 50.9 54.4"
        stroke={color}
        strokeWidth={1.3}
        strokeLinecap="round"
        opacity={0.45}
      />
      <g fill={color}>
        <path d="M48.32 11.12A26.5 26.5 0 0 0 33.85 5.56L33.22 14.54A17.5 17.5 0 0 1 42.77 18.21Z" />
        <path d="M32.46 5.50A26.5 26.5 0 0 0 17.57 9.78L22.47 17.32A17.5 17.5 0 0 1 32.31 14.50Z" />
        <path d="M16.42 10.56A26.5 26.5 0 0 0 7.10 22.94L15.56 26.01A17.5 17.5 0 0 1 21.71 17.84Z" />
        <path d="M7.10 41.06A26.5 26.5 0 0 0 16.42 53.44L21.71 46.16A17.5 17.5 0 0 1 15.56 37.99Z" />
        <path d="M17.57 54.22A26.5 26.5 0 0 0 32.46 58.50L32.31 49.50A17.5 17.5 0 0 1 22.47 46.68Z" />
        <path d="M33.85 58.44A26.5 26.5 0 0 0 48.32 52.88L42.77 45.79A17.5 17.5 0 0 1 33.22 49.46Z" />
      </g>
      <path
        d="M3.08 22.32A30.5 30.5 0 0 0 3.08 41.68L15.40 37.55A17.5 17.5 0 0 1 15.40 26.45Z"
        fill={accent}
      />
      <g fill={accent}>
        <circle cx={32} cy={27} r={6.2} />
        <path d="M29.1 31.4 L26.2 44 H37.8 L34.9 31.4 Z" />
      </g>
    </svg>
  );
}

function KeyholeC({ size, color, accent }: MarkArgs) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <path
        d="M46.14 15.15A22 22 0 1 0 46.14 48.85"
        stroke={color}
        strokeWidth={9}
        strokeLinecap="round"
      />
      <circle cx={31} cy={27} r={6.4} fill={accent} />
      <path d="M28 31.5 L24.8 44.5 H37.2 L34 31.5 Z" fill={accent} />
    </svg>
  );
}

function Arch({ size, color, accent }: MarkArgs) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <path
        d="M11 54V31a21 21 0 0 1 42 0v23"
        stroke={color}
        strokeWidth={9}
        strokeLinecap="round"
      />
      <path d="M24 54V41.5a8 8 0 0 1 16 0V54Z" fill={accent} />
    </svg>
  );
}

function LitWindow({ size, color, accent }: MarkArgs) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <path
        d="M35.5 35.5H51.5V46a5.5 5.5 0 0 1-5.5 5.5H35.5Z"
        fill={accent}
      />
      <rect
        x={9}
        y={9}
        width={46}
        height={46}
        rx={9}
        stroke={color}
        strokeWidth={7}
      />
      <path d="M32 9V55M9 32H55" stroke={color} strokeWidth={7} />
    </svg>
  );
}

type MarkArgs = { size: number; color: string; accent: string };

const concepts = [
  { name: "COUNTER-HOUSE", Mark: CounterHouse },
  { name: "ROOF-C", Mark: RoofC },
  { name: "RING-HOUSE", Mark: RingHouse },
  { name: "KEY-HOUSE (current)", Mark: KeyHouse },
];

const row = (i: number) => {
  const { name, Mark } = concepts[i];
  return (
    <div
      key={name}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 34,
        padding: "26px 40px",
        borderTop: "1px solid #dfe7e3",
      }}
    >
      <div
        style={{
          display: "flex",
          width: 150,
          fontSize: 17,
          fontWeight: 700,
          color: GREEN,
          letterSpacing: 1,
        }}
      >
        {name}
      </div>

      {/* Size ramp on white */}
      {[64, 40, 24, 16].map((s) => (
        <div
          key={s}
          style={{
            display: "flex",
            width: 74,
            height: 74,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Mark size={s} color={GREEN} accent={ACCENT_D} />
        </div>
      ))}

      {/* App-icon field */}
      <div
        style={{
          display: "flex",
          width: 74,
          height: 74,
          borderRadius: 16,
          background: GREEN,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Mark size={52} color="#ffffff" accent={SAND} />
      </div>

      {/* Lockup on dark */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 11,
          padding: "16px 24px",
          borderRadius: 14,
          background: DARK,
        }}
      >
        <Mark size={38} color="#ffffff" accent={SAND} />
        <div style={{ display: "flex", fontSize: 25, color: "#ffffff" }}>
          <span style={{ fontWeight: 700 }}>CMNG</span>
          <span style={{ fontWeight: 400, opacity: 0.7 }}>&nbsp;Property</span>
        </div>
      </div>
    </div>
  );
};

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
        <div
          style={{
            display: "flex",
            padding: "30px 40px 14px",
            fontSize: 29,
            fontWeight: 700,
            color: DARK,
          }}
        >
          CMNG Property — logo concepts
        </div>
        <div
          style={{
            display: "flex",
            padding: "0 40px 22px",
            fontSize: 15,
            color: "#5d726b",
          }}
        >
          64 / 40 / 24 / 16px · app-icon field · dark lockup
        </div>
        {row(0)}
        {row(1)}
        {row(2)}
        {row(3)}
      </div>
    ),
    { width: 1120, height: 640 },
  );
}
