"use client";

interface ShimmerProps {
    width?: string | number;
    height?: string | number;
    radius?: number;
    style?: React.CSSProperties;
}

export default function Shimmer({ width = "100%", height = 80, radius = 18, style }: ShimmerProps) {
    return (
        <div
            style={{
                width,
                height,
                borderRadius: radius,
                background: "linear-gradient(90deg, #f1f5f9 25%, #e8edf3 37%, #f1f5f9 63%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.5s ease-in-out infinite",
                ...style,
            }}
        >
            <style jsx>{`
                @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>
        </div>
    );
}
