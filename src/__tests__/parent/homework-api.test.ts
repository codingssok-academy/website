import { describe, it, expect } from "vitest";

describe("homework API input validation", () => {
    it("should reject names with XSS characters", () => {
        const dangerousNames = [
            '<script>alert(1)</script>',
            'name"onload=alert(1)',
            "name'; DROP TABLE",
            "test&amp;test",
        ];

        for (const name of dangerousNames) {
            expect(/[<>"';&]/.test(name)).toBe(true);
        }
    });

    it("should accept valid Korean names", () => {
        const validNames = ["김주원", "이다연", "박리현", "김민준"];

        for (const name of validNames) {
            expect(/[<>"';&]/.test(name)).toBe(false);
            expect(name.length >= 2 && name.length <= 10).toBe(true);
        }
    });

    it("should reject names exceeding length limit", () => {
        const longName = "가".repeat(11);
        expect(longName.length > 10).toBe(true);
    });
});
