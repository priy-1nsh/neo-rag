import { useId } from 'react';

// Neo — the friendly robot mascot, matching the Neo App design.
// Gradient rounded body, antenna, big eyes with dark-blue pupils, white smile.
// `blink` adds a subtle periodic blink; `antenna` toggles the head antenna.
export default function NeoLogo({ size = 40, className = '', blink = true, antenna = true }) {
  const grad = `nf-${useId().replace(/:/g, '')}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Neo logo"
    >
      <defs>
        <linearGradient id={grad} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5b9bff" />
          <stop offset="1" stopColor="#1e40af" />
        </linearGradient>
      </defs>

      {/* head */}
      <rect x="16" y="20" width="68" height="64" rx="24" fill={`url(#${grad})`} />

      {/* antenna */}
      {antenna && (
        <>
          <line x1="50" y1="20" x2="50" y2="9" stroke="#5b9bff" strokeWidth="4" strokeLinecap="round" />
          <circle cx="50" cy="7" r="4.5" fill="#5b9bff" />
        </>
      )}

      {/* eyes (blink) */}
      <g style={blink ? { transformOrigin: '50px 50px', animation: 'neoBlink 5s infinite' } : undefined}>
        <circle cx="38" cy="50" r="8" fill="#fff" />
        <circle cx="62" cy="50" r="8" fill="#fff" />
        <circle cx="39.5" cy="51.5" r="3.4" fill="#1e3a8a" />
        <circle cx="63.5" cy="51.5" r="3.4" fill="#1e3a8a" />
      </g>

      {/* smile */}
      <path d="M41 67 q9 8 18 0" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" />
    </svg>
  );
}
