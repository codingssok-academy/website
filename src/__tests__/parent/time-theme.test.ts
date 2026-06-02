import { describe, it, expect, vi } from "vitest";

function getTimeTheme(hour: number) {
    if (hour < 6) return { greeting: "늦은 밤이에요", period: "night" };
    if (hour < 12) return { greeting: "좋은 아침이에요", period: "morning" };
    if (hour < 18) return { greeting: "안녕하세요", period: "afternoon" };
    return { greeting: "수고하셨어요", period: "evening" };
}

describe("Time-based theme", () => {
    it("should show night theme from 0-5", () => {
        for (let h = 0; h <= 5; h++) {
            expect(getTimeTheme(h).period).toBe("night");
        }
    });

    it("should show morning theme from 6-11", () => {
        for (let h = 6; h <= 11; h++) {
            expect(getTimeTheme(h).period).toBe("morning");
        }
    });

    it("should show afternoon theme from 12-17", () => {
        for (let h = 12; h <= 17; h++) {
            expect(getTimeTheme(h).period).toBe("afternoon");
        }
    });

    it("should show evening theme from 18-23", () => {
        for (let h = 18; h <= 23; h++) {
            expect(getTimeTheme(h).period).toBe("evening");
        }
    });

    it("should have Korean greeting text", () => {
        expect(getTimeTheme(8).greeting).toContain("아침");
        expect(getTimeTheme(15).greeting).toContain("안녕");
        expect(getTimeTheme(20).greeting).toContain("수고");
    });
});
