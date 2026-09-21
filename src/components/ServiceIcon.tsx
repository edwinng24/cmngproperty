/** One line-art glyph per service, so each card is recognisable at a glance. */
const paths: Record<string, React.ReactNode> = {
  key: (
    <>
      <circle cx="8.5" cy="8.5" r="4.5" />
      <path d="m11.8 11.8 8.2 8.2M17 17l2-2M14.5 14.5l2-2" />
    </>
  ),
  coin: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M14.5 9.2a3 3 0 0 0-5 2.2c0 2.6 5 1.4 5 4a3 3 0 0 1-5 2.2M12 6.5v11" />
    </>
  ),
  wrench: (
    <path d="M15.2 3.6a5.5 5.5 0 0 0-6.6 7L3.8 15.4a2.2 2.2 0 0 0 3.1 3.1l4.8-4.8a5.5 5.5 0 0 0 7-6.6l-3 3-2.9-.6-.6-2.9z" />
  ),
  clipboard: (
    <>
      <path d="M9 4.5H7.5A1.5 1.5 0 0 0 6 6v13a1.5 1.5 0 0 0 1.5 1.5h9A1.5 1.5 0 0 0 18 19V6a1.5 1.5 0 0 0-1.5-1.5H15" />
      <rect x="9" y="2.8" width="6" height="3.4" rx="1.1" />
      <path d="m9.5 12.5 1.8 1.8 3.4-4" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20h16M7 20v-6M12 20V7M17 20v-9" />
    </>
  ),
  cycle: (
    <>
      <path d="M4.5 12a7.5 7.5 0 0 1 12.8-5.3L20 9.3" />
      <path d="M19.5 12a7.5 7.5 0 0 1-12.8 5.3L4 14.7" />
      <path d="M20 4.8v4.5h-4.5M4 19.2v-4.5h4.5" />
    </>
  ),
};

export function ServiceIcon({
  name,
  className = "h-6 w-6",
}: {
  name: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name] ?? paths.key}
    </svg>
  );
}
