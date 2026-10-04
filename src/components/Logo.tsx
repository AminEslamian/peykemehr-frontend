import React from 'react';

interface LogoProps {
  size?: number;
  variant?: 'icon' | 'full';
  showSubtitle?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 42,
  variant = 'full',
  showSubtitle = true,
  className = '',
}) => {
  // Bespoke Minimal Logo Mark for "پیک مهر"
  // Symbolism:
  // 1. Arched dome / Open book pages (education & cultural foundation)
  // 2. Rising radiant sun of "مهر" (kindness, enlightenment, guidance)
  // 3. Stylized messenger feather / flight curve of "پیک"
  const IconMark = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
      aria-label="لوگوی پیک مهر"
    >
      <defs>
        {/* Deep Pine Green Gradient */}
        <linearGradient id="peykBg" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1e5849" />
          <stop offset="1" stopColor="#113329" />
        </linearGradient>

        {/* Luminous Warm Gold Gradient */}
        <linearGradient id="peykGold" x1="12" y1="10" x2="36" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f3dfa2" />
          <stop offset="0.5" stopColor="#d4af37" />
          <stop offset="1" stopColor="#aa8222" />
        </linearGradient>

        {/* Ambient Subtle Shadow */}
        <filter id="markShadow" x="0" y="2" width="48" height="46" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#0d2820" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Arched Astra Badge Shape */}
      <rect
        x="3"
        y="3"
        width="42"
        height="42"
        rx="14"
        fill="url(#peykBg)"
        stroke="#e5d5ab"
        strokeWidth="1"
        strokeOpacity="0.3"
        filter="url(#markShadow)"
      />

      {/* Inner Subtle Border Highlight */}
      <rect
        x="5.5"
        y="5.5"
        width="37"
        height="37"
        rx="11.5"
        fill="none"
        stroke="#ffffff"
        strokeWidth="0.75"
        strokeOpacity="0.12"
      />

      {/* Radiant Sun of "مهر" (Center Dawn) */}
      <circle cx="24" cy="18" r="4.2" fill="url(#peykGold)" />
      
      {/* Sun Ray Beams */}
      <path
        d="M24 10V11.5M24 24.5V26M16.5 18H18M30 18H31.5M18.5 12.5L19.6 13.6M28.4 22.4L29.5 23.5M18.5 23.5L19.6 22.4M28.4 13.6L29.5 12.5"
        stroke="url(#peykGold)"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeOpacity="0.75"
      />

      {/* Open Book Wings & Messenger Feather Contour */}
      <path
        d="M13 33C17 31 21 31.5 24 34C27 31.5 31 31 35 33"
        stroke="url(#peykGold)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M13 28C17 26 21 26.5 24 29C27 26.5 31 26 35 28"
        stroke="#ffffff"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity="0.9"
      />

      {/* Central Spine Axis / Messenger Path */}
      <path
        d="M24 27.5V36"
        stroke="url(#peykGold)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );

  if (variant === 'icon') {
    return <div className={`logo-icon-wrapper ${className}`}>{IconMark}</div>;
  }

  return (
    <div className={`brand-wrapper ${className}`}>
      {IconMark}
      <div className="brand-info">
        <b className="brand-name">پیک مهر</b>
        {showSubtitle && <small className="brand-subtitle">سامانه مبلغین و معلمین</small>}
      </div>
    </div>
  );
};
