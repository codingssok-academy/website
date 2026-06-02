"use client";

const AVATAR_COLORS = [
    "#3b82f6", // blue
    "#ef4444", // red
    "#22c55e", // green
    "#f59e0b", // amber
    "#8b5cf6", // violet
    "#ec4899", // pink
    "#14b8a6", // teal
    "#f97316", // orange
];

const AVATAR_GRADIENTS = [
    ["#3b82f6", "#2563eb"],
    ["#ef4444", "#dc2626"],
    ["#22c55e", "#16a34a"],
    ["#f59e0b", "#d97706"],
    ["#8b5cf6", "#7c3aed"],
    ["#ec4899", "#db2777"],
    ["#14b8a6", "#0d9488"],
    ["#f97316", "#ea580c"],
];

interface StudentAvatarProps {
    name: string;
    size?: number;
    borderRadius?: number;
}

export default function StudentAvatar({ name, size = 40, borderRadius }: StudentAvatarProps) {
    const colorIndex = name.charCodeAt(0) % AVATAR_COLORS.length;
    const [fromColor, toColor] = AVATAR_GRADIENTS[colorIndex];
    const initial = name.charAt(0);
    const br = borderRadius ?? Math.round(size * 0.28);
    const fontSize = Math.round(size * 0.42);
    const gradientId = `avatar-grad-${colorIndex}-${size}`;

    return (
        <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            style={{ flexShrink: 0, display: "block" }}
            aria-label={`${name} 아바타`}
        >
            <defs>
                <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={fromColor} />
                    <stop offset="100%" stopColor={toColor} />
                </linearGradient>
            </defs>
            <rect
                x={0} y={0}
                width={size} height={size}
                rx={br} ry={br}
                fill={`url(#${gradientId})`}
            />
            <text
                x="50%" y="50%"
                dominantBaseline="central"
                textAnchor="middle"
                fill="#ffffff"
                fontSize={fontSize}
                fontWeight="700"
                fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
            >
                {initial}
            </text>
        </svg>
    );
}
