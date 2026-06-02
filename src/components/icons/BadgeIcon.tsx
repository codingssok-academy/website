"use client";

/**
 * 커스텀 SVG 배지 아이콘
 * rarity에 따라 테두리/배경 그라데이션 변경
 */

const RARITY_GRADIENTS: Record<string, { from: string; to: string; glow: string }> = {
    common: { from: "#94a3b8", to: "#cbd5e1", glow: "rgba(148,163,184,0.3)" },
    rare: { from: "#3b82f6", to: "#60a5fa", glow: "rgba(59,130,246,0.3)" },
    epic: { from: "#7c3aed", to: "#a78bfa", glow: "rgba(124,58,237,0.3)" },
    legendary: { from: "#f59e0b", to: "#fbbf24", glow: "rgba(245,158,11,0.4)" },
};

// 각 배지의 SVG 내부 아이콘 path
const BADGE_PATHS: Record<string, { d: string; viewBox?: string; fill?: string }> = {
    seedling: {
        d: "M12 22c-1.5 0-3-.5-4-1.5C6 19 5 17 5 15c0-3 2-5.5 4-7 .5-.4 1-.7 1.5-1C11 6.5 11.5 6 12 5c.5 1 1 1.5 1.5 2 .5.3 1 .6 1.5 1 2 1.5 4 4 4 7 0 2-1 4-3 5.5-1 1-2.5 1.5-4 1.5zm0-2c2.2 0 5-1.8 5-5 0-2.2-1.5-4-3-5.2-.4-.3-.8-.6-1.2-.9l-.8-.7-.8.7c-.4.3-.8.6-1.2.9C8.5 11 7 12.8 7 15c0 3.2 2.8 5 5 5z",
    },
    coder: {
        d: "M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0L19.2 12l-4.6-4.6L16 6l6 6-6 6-1.4-1.4z",
    },
    sharpshooter: {
        d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z",
    },
    speedster: {
        d: "M11 21h-1l1-7H7.5c-.88 0-.33-.75-.31-.78C8.48 10.94 10.42 7.54 13.01 3h1l-1 7h3.51c.4 0 .62.19.4.66C12.97 17.55 11 21 11 21z",
    },
    bookworm: {
        d: "M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z",
    },
    genius: {
        d: "M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zm2 14h-4v-1h4v1zm0-2h-4v-1h4v1zm-1.5-3.59V13h-1v-2.59L9.67 8.59 10.34 7.93 12 9.59l1.66-1.66.67.66-1.83 1.82zM9 20h6v1c0 .55-.45 1-1 1h-4c-.55 0-1-.45-1-1v-1z",
    },
    master: {
        d: "M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .55-.45 1-1 1H6c-.55 0-1-.45-1-1v-1h14v1z",
    },
    early_bird: {
        d: "M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.42 0-.39.39-.39 1.03 0 1.42l1.42 1.42c.39.39 1.03.39 1.42 0 .38-.39.39-1.03 0-1.42L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.42 0-.39.39-.39 1.03 0 1.42l1.42 1.42c.39.39 1.03.39 1.42 0 .39-.39.39-1.03 0-1.42l-1.42-1.42zm1.06-12.37l-1.42 1.42c-.39.39-.39 1.03 0 1.42.39.39 1.03.39 1.42 0l1.42-1.42c.39-.39.39-1.03 0-1.42-.39-.38-1.03-.39-1.42 0zM6.34 17l-1.42 1.42c-.39.39-.39 1.03 0 1.42.39.39 1.03.39 1.42 0L7.76 18.4c.39-.39.39-1.03 0-1.42-.39-.38-1.03-.39-1.42.02z",
    },
    night_owl: {
        d: "M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z",
    },
    xmas: {
        d: "M17 12h2L12 2 5 12h2l-3 5h5v5h6v-5h5l-3-5zm-5-3.84L15.22 13H8.78L12 8.16z",
    },
    champion: {
        d: "M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z",
    },
};

interface BadgeIconProps {
    badgeId: string;
    rarity?: string;
    size?: number;
    unlocked?: boolean;
    style?: React.CSSProperties;
}

export default function BadgeIcon({ badgeId, rarity = "common", size = 48, unlocked = true, style }: BadgeIconProps) {
    const grad = RARITY_GRADIENTS[rarity] || RARITY_GRADIENTS.common;
    const path = BADGE_PATHS[badgeId];
    const gradId = `badge-${badgeId}-${rarity}`;
    const innerSize = size * 0.5;

    if (!path) {
        return (
            <div style={{
                width: size, height: size, borderRadius: "50%",
                background: "#f1f5f9", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: size * 0.4, color: "#94a3b8",
                ...style,
            }}>
                ?
            </div>
        );
    }

    return (
        <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            style={{ filter: unlocked ? `drop-shadow(0 2px 6px ${grad.glow})` : "grayscale(1) opacity(0.4)", ...style }}
        >
            <defs>
                <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={grad.from} />
                    <stop offset="100%" stopColor={grad.to} />
                </linearGradient>
                <linearGradient id={`${gradId}-bg`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={grad.from} stopOpacity="0.12" />
                    <stop offset="100%" stopColor={grad.to} stopOpacity="0.06" />
                </linearGradient>
            </defs>

            {/* Outer ring */}
            <circle
                cx={size / 2}
                cy={size / 2}
                r={size / 2 - 1.5}
                fill={`url(#${gradId}-bg)`}
                stroke={`url(#${gradId})`}
                strokeWidth={2}
            />

            {/* Inner highlight */}
            <circle
                cx={size / 2}
                cy={size / 2}
                r={size / 2 - 5}
                fill="none"
                stroke="rgba(255,255,255,0.25)"
                strokeWidth={0.5}
            />

            {/* Icon */}
            <g transform={`translate(${(size - innerSize) / 2}, ${(size - innerSize) / 2}) scale(${innerSize / 24})`}>
                <path d={path.d} fill={unlocked ? `url(#${gradId})` : "#94a3b8"} />
            </g>
        </svg>
    );
}

// 통계 아이콘용 간단 SVG
const STAT_PATHS: Record<string, string> = {
    xp: "M11 21h-1l1-7H7.5c-.88 0-.33-.75-.31-.78C8.48 10.94 10.42 7.54 13.01 3h1l-1 7h3.51c.4 0 .62.19.4.66C12.97 17.55 11 21 11 21z",
    streak: "M13.5 .67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z",
    problems: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z",
    badges: "M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z",
};

interface StatIconProps {
    type: "xp" | "streak" | "problems" | "badges";
    size?: number;
    color?: string;
    style?: React.CSSProperties;
}

export function StatIcon({ type, size = 20, color = "#64748b", style }: StatIconProps) {
    const d = STAT_PATHS[type];
    if (!d) return null;
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" style={style}>
            <path d={d} fill={color} />
        </svg>
    );
}
