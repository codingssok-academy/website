"use client";

import React from "react";

interface ProfileEffectProps {
  effect: string | null;
  children: React.ReactNode;
  size?: number;
}

const KEYFRAMES = `
@keyframes profileGoldGlow {
  0%, 100% { box-shadow: 0 0 8px 2px rgba(255,193,37,0.5), 0 0 16px 4px rgba(218,165,32,0.25); }
  50% { box-shadow: 0 0 14px 4px rgba(255,215,0,0.7), 0 0 28px 8px rgba(218,165,32,0.35); }
}
@keyframes profilePlatinumRotate {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}
@keyframes profilePlatinumSparkle {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}
@keyframes profileDiamondAurora {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
`;

function getEffectStyle(effect: string | null, size: number): React.CSSProperties {
  const base: React.CSSProperties = {
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
  };

  if (effect === "gold_glow") {
    return {
      ...base,
      animation: "profileGoldGlow 2s ease-in-out infinite",
      borderRadius: "50%",
    };
  }

  if (effect === "platinum_crystal") {
    const border = Math.max(2, Math.round(size * 0.05));
    return {
      ...base,
      padding: border,
      background: "linear-gradient(90deg, #00e5ff, #b0bec5, #e0f7fa, #80deea, #00e5ff)",
      backgroundSize: "200% 100%",
      animation: "profilePlatinumRotate 3s linear infinite",
      borderRadius: "50%",
    };
  }

  if (effect === "diamond_aurora") {
    const border = Math.max(2, Math.round(size * 0.06));
    return {
      ...base,
      padding: border,
      background: "linear-gradient(270deg, #ff0080, #ff8c00, #40e0d0, #7b68ee, #ff0080)",
      backgroundSize: "400% 400%",
      animation: "profileDiamondAurora 4s ease infinite",
      borderRadius: "50%",
    };
  }

  return { ...base };
}

export default function ProfileEffect({ effect, children, size = 48 }: ProfileEffectProps) {
  const needsInner = effect === "platinum_crystal" || effect === "diamond_aurora";

  return (
    <>
      <style>{KEYFRAMES}</style>
      <div style={getEffectStyle(effect, size)}>
        {needsInner ? (
          <div style={{ borderRadius: "50%", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {children}
          </div>
        ) : (
          children
        )}
      </div>
    </>
  );
}
