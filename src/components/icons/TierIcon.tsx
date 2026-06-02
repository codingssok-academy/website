"use client";

import React from "react";

interface TierIconProps {
  tier: string;
  size?: number;
  animated?: boolean;
  style?: React.CSSProperties;
}

/* ------------------------------------------------------------------ */
/*  Keyframe styles injected once via <style> inside the SVG          */
/* ------------------------------------------------------------------ */

const animationStyles = `
  @keyframes tierGlowPulse {
    0%, 100% { opacity: 0.45; }
    50%      { opacity: 0.85; }
  }
  @keyframes tierShimmer {
    0%   { opacity: 0.3; transform: rotate(0deg); }
    50%  { opacity: 0.8; transform: rotate(6deg); }
    100% { opacity: 0.3; transform: rotate(0deg); }
  }
  @keyframes tierDiamondAurora {
    0%   { opacity: 0.25; transform: scale(1)   rotate(0deg); }
    33%  { opacity: 0.7;  transform: scale(1.08) rotate(3deg); }
    66%  { opacity: 0.4;  transform: scale(1.02) rotate(-2deg); }
    100% { opacity: 0.25; transform: scale(1)   rotate(0deg); }
  }
  @keyframes tierRaysSpin {
    0%   { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

/* ================================================================== */
/*  IRON — Hexagonal rugged shield                                    */
/* ================================================================== */

function IronIcon({ animated }: { animated: boolean }) {
  return (
    <>
      <defs>
        <linearGradient id="iron-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9ca3af" />
          <stop offset="50%" stopColor="#6b7280" />
          <stop offset="100%" stopColor="#4b5563" />
        </linearGradient>
        <linearGradient id="iron-highlight" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#d1d5db" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#6b7280" stopOpacity="0" />
        </linearGradient>
        <filter id="iron-shadow">
          <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodColor="#1f2937" floodOpacity="0.5" />
        </filter>
      </defs>

      {/* Hexagonal shield */}
      <polygon
        points="24,4 42,14 42,34 24,44 6,34 6,14"
        fill="url(#iron-body)"
        stroke="#374151"
        strokeWidth="1.5"
        filter="url(#iron-shadow)"
      />
      {/* Inner hex border */}
      <polygon
        points="24,8 38,16 38,32 24,40 10,32 10,16"
        fill="none"
        stroke="#9ca3af"
        strokeWidth="0.8"
        opacity="0.5"
      />
      {/* Rivet details */}
      {[
        [24, 8],
        [38, 16],
        [38, 32],
        [24, 40],
        [10, 32],
        [10, 16],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="1.8" fill="#4b5563" stroke="#9ca3af" strokeWidth="0.5" />
      ))}
      {/* Center cross detail */}
      <line x1="24" y1="16" x2="24" y2="32" stroke="#4b5563" strokeWidth="2" opacity="0.6" />
      <line x1="16" y1="24" x2="32" y2="24" stroke="#4b5563" strokeWidth="2" opacity="0.6" />
      {/* Highlight overlay */}
      <polygon
        points="24,4 42,14 42,24 24,24 6,24 6,14"
        fill="url(#iron-highlight)"
      />
      {/* Center emblem — small anvil shape */}
      <rect x="20" y="20" width="8" height="6" rx="1" fill="#374151" opacity="0.7" />
      <rect x="18" y="25" width="12" height="2" rx="0.5" fill="#374151" opacity="0.7" />
    </>
  );
}

/* ================================================================== */
/*  BRONZE — Shield with crossed swords                               */
/* ================================================================== */

function BronzeIcon({ animated }: { animated: boolean }) {
  return (
    <>
      <defs>
        <linearGradient id="bronze-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d97706" />
          <stop offset="45%" stopColor="#b45309" />
          <stop offset="100%" stopColor="#92400e" />
        </linearGradient>
        <linearGradient id="bronze-sword" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#92400e" />
        </linearGradient>
        <linearGradient id="bronze-highlight" x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#fcd34d" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#b45309" stopOpacity="0" />
        </linearGradient>
        <filter id="bronze-shadow">
          <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodColor="#78350f" floodOpacity="0.6" />
        </filter>
      </defs>

      {/* Shield body */}
      <path
        d="M24,4 L40,10 L40,28 Q40,38 24,44 Q8,38 8,28 L8,10 Z"
        fill="url(#bronze-body)"
        stroke="#78350f"
        strokeWidth="1.2"
        filter="url(#bronze-shadow)"
      />
      {/* Inner shield border */}
      <path
        d="M24,8 L36,13 L36,27 Q36,35 24,40 Q12,35 12,27 L12,13 Z"
        fill="none"
        stroke="#d97706"
        strokeWidth="0.7"
        opacity="0.6"
      />
      {/* Highlight */}
      <path
        d="M24,4 L40,10 L40,20 L24,24 L8,20 L8,10 Z"
        fill="url(#bronze-highlight)"
      />
      {/* Crossed swords */}
      {/* Sword 1 — top-left to bottom-right */}
      <line x1="14" y1="14" x2="34" y2="34" stroke="url(#bronze-sword)" strokeWidth="2" strokeLinecap="round" />
      <line x1="14" y1="14" x2="17" y2="12" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="14" y1="14" x2="12" y2="17" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
      {/* Sword 2 — top-right to bottom-left */}
      <line x1="34" y1="14" x2="14" y2="34" stroke="url(#bronze-sword)" strokeWidth="2" strokeLinecap="round" />
      <line x1="34" y1="14" x2="31" y2="12" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="34" y1="14" x2="36" y2="17" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
      {/* Center gem on sword cross */}
      <circle cx="24" cy="24" r="3.5" fill="#92400e" stroke="#d97706" strokeWidth="0.8" />
      <circle cx="24" cy="24" r="1.8" fill="#fbbf24" opacity="0.7" />
      {/* Decorative dots */}
      <circle cx="24" cy="14" r="1" fill="#fbbf24" opacity="0.5" />
      <circle cx="24" cy="34" r="1" fill="#92400e" opacity="0.5" />
    </>
  );
}

/* ================================================================== */
/*  SILVER — Elegant star crest                                       */
/* ================================================================== */

function SilverIcon({ animated }: { animated: boolean }) {
  return (
    <>
      <defs>
        <linearGradient id="silver-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="50%" stopColor="#9ca3af" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
        <linearGradient id="silver-star" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f1f5f9" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
        <radialGradient id="silver-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#f8fafc" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#64748b" stopOpacity="0" />
        </radialGradient>
        <filter id="silver-shadow">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#334155" floodOpacity="0.45" />
        </filter>
      </defs>

      {/* Outer circle crest */}
      <circle cx="24" cy="24" r="20" fill="url(#silver-body)" stroke="#475569" strokeWidth="1.2" filter="url(#silver-shadow)" />
      {/* Inner ring */}
      <circle cx="24" cy="24" r="16" fill="none" stroke="#cbd5e1" strokeWidth="0.7" opacity="0.7" />
      {/* Decorative ring dots */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        return (
          <circle
            key={i}
            cx={24 + 16 * Math.cos(rad)}
            cy={24 + 16 * Math.sin(rad)}
            r="1.2"
            fill="#e2e8f0"
            opacity="0.6"
          />
        );
      })}
      {/* Five-pointed star */}
      <polygon
        points={fivePointStar(24, 24, 12, 5.5)}
        fill="url(#silver-star)"
        stroke="#94a3b8"
        strokeWidth="0.6"
      />
      {/* Star inner highlight */}
      <polygon
        points={fivePointStar(24, 23, 6, 2.5)}
        fill="#f1f5f9"
        opacity="0.5"
      />
      {/* Center glow */}
      <circle cx="24" cy="24" r="10" fill="url(#silver-glow)" />
      {/* Top accent lines */}
      <line x1="24" y1="4" x2="24" y2="8" stroke="#e2e8f0" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      <line x1="6" y1="16" x2="9" y2="18" stroke="#e2e8f0" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      <line x1="42" y1="16" x2="39" y2="18" stroke="#e2e8f0" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
    </>
  );
}

/* ================================================================== */
/*  GOLD — Majestic crown with gems                                   */
/* ================================================================== */

function GoldIcon({ animated }: { animated: boolean }) {
  return (
    <>
      <defs>
        <linearGradient id="gold-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="40%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#ca8a04" />
        </linearGradient>
        <linearGradient id="gold-accent" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#ca8a04" />
        </linearGradient>
        <radialGradient id="gold-glow" cx="0.5" cy="0.4" r="0.6">
          <stop offset="0%" stopColor="#fef3c7" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#ca8a04" stopOpacity="0" />
        </radialGradient>
        <filter id="gold-shadow">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#92400e" floodOpacity="0.5" />
        </filter>
        <filter id="gold-outer-glow">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feFlood floodColor="#eab308" floodOpacity="0.35" />
          <feComposite in2="blur" operator="in" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Glow aura */}
      {animated && (
        <circle
          cx="24" cy="24" r="22"
          fill="none"
          stroke="#eab308"
          strokeWidth="1.5"
          opacity="0.3"
          style={{ animation: "tierGlowPulse 2.5s ease-in-out infinite" }}
        />
      )}

      {/* Crown base band */}
      <rect x="8" y="28" width="32" height="8" rx="2" fill="url(#gold-body)" stroke="#92400e" strokeWidth="0.8" filter="url(#gold-shadow)" />
      {/* Band decoration lines */}
      <line x1="10" y1="31" x2="38" y2="31" stroke="#fde68a" strokeWidth="0.5" opacity="0.5" />
      <line x1="10" y1="33" x2="38" y2="33" stroke="#92400e" strokeWidth="0.5" opacity="0.4" />

      {/* Crown body — five peaks */}
      <path
        d="M8,28 L8,18 L14,22 L19,10 L24,18 L29,10 L34,22 L40,18 L40,28 Z"
        fill="url(#gold-body)"
        stroke="#92400e"
        strokeWidth="0.8"
        filter="url(#gold-shadow)"
      />
      {/* Crown highlight */}
      <path
        d="M10,27 L10,19 L15,22.5 L20,12 L24,19 L28,12 L33,22.5 L38,19 L38,27 Z"
        fill="url(#gold-accent)"
        opacity="0.4"
      />

      {/* Crown peak gems */}
      {/* Center peak — large ruby */}
      <circle cx="24" cy="14" r="2.5" fill="#dc2626" stroke="#fbbf24" strokeWidth="0.6" />
      <circle cx="23.3" cy="13.3" r="0.8" fill="#fca5a5" opacity="0.7" />
      {/* Left peak */}
      <circle cx="19" cy="11" r="1.8" fill="#2563eb" stroke="#fbbf24" strokeWidth="0.5" />
      <circle cx="18.5" cy="10.5" r="0.5" fill="#93c5fd" opacity="0.6" />
      {/* Right peak */}
      <circle cx="29" cy="11" r="1.8" fill="#2563eb" stroke="#fbbf24" strokeWidth="0.5" />
      <circle cx="28.5" cy="10.5" r="0.5" fill="#93c5fd" opacity="0.6" />

      {/* Base gems */}
      <circle cx="16" cy="32" r="1.5" fill="#dc2626" stroke="#ca8a04" strokeWidth="0.4" />
      <circle cx="24" cy="32" r="1.5" fill="#059669" stroke="#ca8a04" strokeWidth="0.4" />
      <circle cx="32" cy="32" r="1.5" fill="#dc2626" stroke="#ca8a04" strokeWidth="0.4" />

      {/* Glow overlay */}
      <ellipse cx="24" cy="22" rx="16" ry="12" fill="url(#gold-glow)" />
    </>
  );
}

/* ================================================================== */
/*  PLATINUM — Crystal geometric emblem                               */
/* ================================================================== */

function PlatinumIcon({ animated }: { animated: boolean }) {
  return (
    <>
      <defs>
        <linearGradient id="plat-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#67e8f9" />
          <stop offset="50%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#0891b2" />
        </linearGradient>
        <linearGradient id="plat-facet" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a5f3fc" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#0891b2" stopOpacity="0.2" />
        </linearGradient>
        <radialGradient id="plat-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#cffafe" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
        </radialGradient>
        <filter id="plat-shadow">
          <feDropShadow dx="0" dy="1" stdDeviation="1.8" floodColor="#0e7490" floodOpacity="0.5" />
        </filter>
        <filter id="plat-outer-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feFlood floodColor="#22d3ee" floodOpacity="0.3" />
          <feComposite in2="blur" operator="in" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Animated outer glow */}
      {animated && (
        <circle
          cx="24" cy="24" r="22"
          fill="none"
          stroke="#22d3ee"
          strokeWidth="1.5"
          opacity="0.3"
          style={{ animation: "tierGlowPulse 2s ease-in-out infinite" }}
        />
      )}

      {/* Outer crystal — octagon */}
      <polygon
        points="24,3 38,10 44,24 38,38 24,45 10,38 4,24 10,10"
        fill="url(#plat-body)"
        stroke="#0e7490"
        strokeWidth="1"
        filter="url(#plat-shadow)"
      />

      {/* Crystal facet lines */}
      <line x1="24" y1="3" x2="24" y2="45" stroke="#a5f3fc" strokeWidth="0.4" opacity="0.4" />
      <line x1="4" y1="24" x2="44" y2="24" stroke="#a5f3fc" strokeWidth="0.4" opacity="0.4" />
      <line x1="10" y1="10" x2="38" y2="38" stroke="#a5f3fc" strokeWidth="0.4" opacity="0.3" />
      <line x1="38" y1="10" x2="10" y2="38" stroke="#a5f3fc" strokeWidth="0.4" opacity="0.3" />

      {/* Inner crystal */}
      <polygon
        points="24,10 34,16 38,24 34,32 24,38 14,32 10,24 14,16"
        fill="url(#plat-facet)"
        stroke="#67e8f9"
        strokeWidth="0.6"
      />

      {/* Inner facet triangles — top */}
      <polygon points="24,10 34,16 24,24" fill="#a5f3fc" opacity="0.2" />
      <polygon points="24,10 14,16 24,24" fill="#cffafe" opacity="0.15" />
      {/* Bottom facets */}
      <polygon points="24,38 34,32 24,24" fill="#0891b2" opacity="0.25" />
      <polygon points="24,38 14,32 24,24" fill="#0e7490" opacity="0.2" />

      {/* Core gem */}
      <circle cx="24" cy="24" r="4" fill="#cffafe" opacity="0.5" />
      <circle cx="24" cy="24" r="2" fill="#ecfeff" opacity="0.7" />

      {/* Sparkle dots */}
      {[
        [24, 6, 0.6],
        [41, 24, 0.5],
        [24, 42, 0.5],
        [7, 24, 0.5],
        [36, 12, 0.4],
        [36, 36, 0.4],
        [12, 36, 0.4],
        [12, 12, 0.4],
      ].map(([x, y, op], i) => (
        <circle key={i} cx={x} cy={y} r="1" fill="#ecfeff" opacity={op} />
      ))}

      {/* Center glow */}
      <circle cx="24" cy="24" r="12" fill="url(#plat-glow)" />
    </>
  );
}

/* ================================================================== */
/*  DIAMOND — Multi-faceted radiant diamond with aurora                */
/* ================================================================== */

function DiamondIcon({ animated }: { animated: boolean }) {
  return (
    <>
      <defs>
        <linearGradient id="dia-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="40%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
        <linearGradient id="dia-facet-l" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="dia-facet-r" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#818cf8" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
        </linearGradient>
        <radialGradient id="dia-glow" cx="0.5" cy="0.35" r="0.55">
          <stop offset="0%" stopColor="#dbeafe" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="dia-aurora" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#818cf8" stopOpacity="0.4" />
          <stop offset="50%" stopColor="#60a5fa" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
        </radialGradient>
        <filter id="dia-shadow">
          <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#1e40af" floodOpacity="0.5" />
        </filter>
        <filter id="dia-bloom">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feFlood floodColor="#60a5fa" floodOpacity="0.35" />
          <feComposite in2="blur" operator="in" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Aurora background glow */}
      {animated && (
        <g style={{ animation: "tierDiamondAurora 3s ease-in-out infinite", transformOrigin: "24px 24px" }}>
          <circle cx="24" cy="24" r="23" fill="url(#dia-aurora)" />
          <circle cx="24" cy="24" r="23" fill="none" stroke="#818cf8" strokeWidth="1" opacity="0.25" />
        </g>
      )}

      {/* Animated outer glow ring */}
      {animated && (
        <circle
          cx="24" cy="24" r="21"
          fill="none"
          stroke="#60a5fa"
          strokeWidth="1.8"
          opacity="0.3"
          style={{ animation: "tierGlowPulse 1.8s ease-in-out infinite" }}
        />
      )}

      {/* Rays behind diamond */}
      <g opacity="0.2" style={animated ? { animation: "tierRaysSpin 20s linear infinite", transformOrigin: "24px 24px" } : undefined}>
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          return (
            <line
              key={i}
              x1={24 + 8 * Math.cos(rad)}
              y1={24 + 8 * Math.sin(rad)}
              x2={24 + 22 * Math.cos(rad)}
              y2={24 + 22 * Math.sin(rad)}
              stroke="#93c5fd"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          );
        })}
      </g>

      {/* Diamond shape — classic gem cut top-down */}
      {/* Upper crown */}
      <polygon
        points="24,4 40,18 24,24 8,18"
        fill="url(#dia-body)"
        stroke="#1e40af"
        strokeWidth="0.8"
        filter="url(#dia-shadow)"
      />
      {/* Lower pavilion */}
      <polygon
        points="8,18 40,18 24,44"
        fill="url(#dia-body)"
        stroke="#1e40af"
        strokeWidth="0.8"
      />

      {/* Crown facets */}
      <polygon points="24,4 32,12 24,18" fill="url(#dia-facet-l)" />
      <polygon points="24,4 16,12 24,18" fill="#bfdbfe" opacity="0.25" />
      <polygon points="24,18 32,12 40,18" fill="url(#dia-facet-r)" />
      <polygon points="24,18 16,12 8,18" fill="#818cf8" opacity="0.15" />

      {/* Table (top center) */}
      <polygon points="16,12 32,12 28,17 20,17" fill="#dbeafe" opacity="0.35" />

      {/* Pavilion facets */}
      <polygon points="8,18 24,24 24,44" fill="#3b82f6" opacity="0.3" />
      <polygon points="40,18 24,24 24,44" fill="#1e40af" opacity="0.25" />
      <polygon points="8,18 24,24 16,20" fill="#93c5fd" opacity="0.15" />
      <polygon points="40,18 24,24 32,20" fill="#818cf8" opacity="0.15" />

      {/* Pavilion center line */}
      <line x1="24" y1="24" x2="24" y2="44" stroke="#93c5fd" strokeWidth="0.4" opacity="0.4" />
      {/* Girdle line */}
      <line x1="8" y1="18" x2="40" y2="18" stroke="#bfdbfe" strokeWidth="0.5" opacity="0.5" />

      {/* Shimmer highlight */}
      <ellipse
        cx="22"
        cy="13"
        rx="4"
        ry="3"
        fill="#eff6ff"
        opacity={animated ? undefined : "0.4"}
        style={animated ? { animation: "tierShimmer 2.5s ease-in-out infinite", transformOrigin: "22px 13px" } : undefined}
      />

      {/* Center glow */}
      <circle cx="24" cy="20" r="8" fill="url(#dia-glow)" />

      {/* Sparkle accents */}
      {[
        [12, 10],
        [36, 10],
        [6, 24],
        [42, 24],
        [18, 38],
        [30, 38],
      ].map(([x, y], i) => (
        <g key={i} opacity={0.4 + (i % 3) * 0.15}>
          <line x1={x as number - 1.5} y1={y} x2={x as number + 1.5} y2={y} stroke="#dbeafe" strokeWidth="0.6" />
          <line x1={x} y1={y as number - 1.5} x2={x} y2={y as number + 1.5} stroke="#dbeafe" strokeWidth="0.6" />
        </g>
      ))}
    </>
  );
}

/* ================================================================== */
/*  UNRANKED — Simple question-mark circle                            */
/* ================================================================== */

function UnrankedIcon() {
  return (
    <>
      <defs>
        <linearGradient id="unrank-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="18" fill="url(#unrank-bg)" stroke="#64748b" strokeWidth="1.5" />
      <circle cx="24" cy="24" r="14" fill="none" stroke="#e2e8f0" strokeWidth="0.6" opacity="0.4" />
      {/* Question mark */}
      <path
        d="M20,18 Q20,12 24,12 Q28,12 28,16 Q28,19 24,20 L24,24"
        fill="none"
        stroke="#475569"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="24" cy="30" r="1.5" fill="#475569" />
    </>
  );
}

/* ================================================================== */
/*  Helper: five-pointed star points                                  */
/* ================================================================== */

function fivePointStar(cx: number, cy: number, outerR: number, innerR: number): string {
  const points: string[] = [];
  for (let i = 0; i < 5; i++) {
    // outer point — start from top (−90°)
    const outerAngle = ((i * 72 - 90) * Math.PI) / 180;
    points.push(`${cx + outerR * Math.cos(outerAngle)},${cy + outerR * Math.sin(outerAngle)}`);
    // inner point
    const innerAngle = (((i * 72 + 36) - 90) * Math.PI) / 180;
    points.push(`${cx + innerR * Math.cos(innerAngle)},${cy + innerR * Math.sin(innerAngle)}`);
  }
  return points.join(" ");
}

/* ================================================================== */
/*  Main component                                                    */
/* ================================================================== */

export default function TierIcon({ tier, size = 48, animated = false, style }: TierIconProps) {
  const normalizedTier = tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase();

  const renderIcon = () => {
    switch (normalizedTier) {
      case "Iron":
        return <IronIcon animated={animated} />;
      case "Bronze":
        return <BronzeIcon animated={animated} />;
      case "Silver":
        return <SilverIcon animated={animated} />;
      case "Gold":
        return <GoldIcon animated={animated} />;
      case "Platinum":
        return <PlatinumIcon animated={animated} />;
      case "Diamond":
        return <DiamondIcon animated={animated} />;
      default:
        return <UnrankedIcon />;
    }
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      width={size}
      height={size}
      style={style}
      role="img"
      aria-label={`${normalizedTier} tier icon`}
    >
      {animated && <style>{animationStyles}</style>}
      {renderIcon()}
    </svg>
  );
}
