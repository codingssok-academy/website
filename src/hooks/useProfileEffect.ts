"use client";

import { useState, useEffect } from "react";

const TIER_PRIORITY: Record<string, number> = {
  diamond_aurora: 3,
  platinum_crystal: 2,
  gold_glow: 1,
};

export function useProfileEffect(): string | null {
  const [effect, setEffect] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("codingssok_profile_effects");
      if (!raw) return;
      const effects: string[] = JSON.parse(raw);
      if (!Array.isArray(effects) || effects.length === 0) return;

      // Return the highest-tier effect
      let best: string | null = null;
      let bestPriority = 0;
      for (const e of effects) {
        const p = TIER_PRIORITY[e] ?? 0;
        if (p > bestPriority) {
          bestPriority = p;
          best = e;
        }
      }
      setEffect(best || effects[0]);
    } catch {
      // ignore parse errors
    }
  }, []);

  return effect;
}
