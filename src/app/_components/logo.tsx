export function Logo({ color, size = 28 }: { color?: string | null; size?: number }) {
  const fill = color || "#1f2937"; // gray-800 default

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Cloud outline */}
      <path
        d="M8 24h16a6 6 0 00.87-11.94A8 8 0 009.06 14.13 5 5 0 008 24z"
        stroke={fill}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Lightning bolt - solid */}
      <path
        d="M17 12l-3 6h4l-2 7 5-8h-4l2-5h-2z"
        fill={fill}
      />
    </svg>
  );
}
