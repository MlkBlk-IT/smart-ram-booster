import React from 'react';

/**
 * Logo RAMBooster - carre arrondi degrade (sky-500 -> cyan-400) avec eclair.
 * Utilise dans la barre de titre, la barre laterale et le favicon.
 */
export const Logo: React.FC<{ className?: string; title?: string }> = ({
  className = 'w-5 h-5',
  title = 'RAMBooster'
}) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label={title}
  >
    <defs>
      <linearGradient id="rambooster-logo-gradient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#0ea5e9" />
        <stop offset="100%" stopColor="#22d3ee" />
      </linearGradient>
    </defs>
    <rect x="2" y="2" width="60" height="60" rx="16" fill="url(#rambooster-logo-gradient)" />
    <path d="M35.5 12 20 36.5h9.5L27.5 52 45 26h-9.5L35.5 12Z" fill="#ffffff" />
  </svg>
);

export default Logo;
