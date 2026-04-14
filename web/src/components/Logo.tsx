export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0D9488" />
          <stop offset="100%" stopColor="#14B8A6" />
        </linearGradient>
      </defs>

      {/* Rounded square background */}
      <rect width="512" height="512" rx="112" ry="112" fill="url(#bg)" />

      {/* Cloud */}
      <g transform="translate(256, 175)">
        <rect x="-120" y="-10" width="240" height="60" rx="30" fill="#99F6E4" />
        <circle cx="-60" cy="-10" r="50" fill="#99F6E4" />
        <circle cx="10" cy="-30" r="58" fill="#99F6E4" />
        <circle cx="70" cy="-8" r="45" fill="#99F6E4" />
      </g>

      {/* Lightning bolt */}
      <polygon
        points="244,190 208,275 242,275 200,390 300,258 264,258 300,190"
        fill="#F0FDFA"
      />
    </svg>
  );
}
