import { describe, it, expect } from "vitest";

function getLevelFromXp(xp: number): number {
    return Math.max(1, Math.floor(xp / 150) + 1);
}

function getLevelProgress(xp: number, level: number) {
    const base = (level - 1) * 150;
    const next = level * 150;
    const progress = Math.min(((xp - base) / (next - base)) * 100, 100);
    return { progress: Math.max(progress, 0), remaining: Math.max(next - xp, 0), next };
}

describe("XP → Level calculation", () => {
    it("should be level 1 for 0 XP", () => {
        expect(getLevelFromXp(0)).toBe(1);
    });

    it("should be level 2 at 150 XP", () => {
        expect(getLevelFromXp(150)).toBe(2);
    });

    it("should be level 4 at 495 XP (이다연)", () => {
        expect(getLevelFromXp(495)).toBe(4);
    });

    it("should calculate progress correctly", () => {
        const result = getLevelProgress(495, 4);
        // Level 4: base=450, next=600
        expect(result.remaining).toBe(105); // 600 - 495
        expect(result.progress).toBeCloseTo(30, 0); // (495-450)/(600-450) = 30%
    });

    it("should clamp progress to 0-100", () => {
        expect(getLevelProgress(0, 1).progress).toBeGreaterThanOrEqual(0);
        expect(getLevelProgress(999, 1).progress).toBeLessThanOrEqual(100);
    });

    it("should handle edge case at level boundary", () => {
        const result = getLevelProgress(300, 3);
        // Level 3: base=300, next=450 → progress = 0%
        expect(result.progress).toBe(0);
        expect(result.remaining).toBe(150);
    });
});
