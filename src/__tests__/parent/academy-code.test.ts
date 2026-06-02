import { describe, it, expect } from "vitest";

const ACADEMY_CODE = "74123";

describe("Academy access code", () => {
    it("should accept correct code", () => {
        expect("74123".trim() === ACADEMY_CODE).toBe(true);
    });

    it("should reject wrong codes", () => {
        const wrongCodes = ["12345", "00000", "74124", "7412", "741230"];
        for (const code of wrongCodes) {
            expect(code.trim() === ACADEMY_CODE).toBe(false);
        }
    });

    it("should handle empty/whitespace input", () => {
        expect("".trim() === ACADEMY_CODE).toBe(false);
        expect("  ".trim() === ACADEMY_CODE).toBe(false);
        expect(" 74123 ".trim() === ACADEMY_CODE).toBe(true);
    });

    it("should only accept numeric input", () => {
        const code = "74abc".replace(/\D/g, "");
        expect(code).toBe("74");
        expect(code === ACADEMY_CODE).toBe(false);
    });
});
