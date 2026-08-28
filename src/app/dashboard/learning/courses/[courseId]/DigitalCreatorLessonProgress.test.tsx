import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DigitalCreatorLessonProgress } from "./DigitalCreatorLessonProgress";

describe("DigitalCreatorLessonProgress", () => {
    it("always shows completed and remaining screens and records", () => {
        render(
            <DigitalCreatorLessonProgress
                screens={{ completed: 6, total: 10 }}
                records={{ completed: 2, total: 4 }}
                loading={false}
                completed={false}
            />,
        );

        expect(screen.getByText("6/10")).toBeInTheDocument();
        expect(screen.getByText("2/4")).toBeInTheDocument();
        expect(screen.getByText("남은 화면 4개 · 남은 기록 2개")).toBeInTheDocument();
        expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "57");
    });

    it("explains the final completion step after every condition is met", () => {
        render(
            <DigitalCreatorLessonProgress
                screens={{ completed: 10, total: 10 }}
                records={{ completed: 4, total: 4 }}
                loading={false}
                completed={false}
            />,
        );

        expect(screen.getByText(/마지막 화면에서 수업 완료/)).toBeInTheDocument();
        expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
    });
});
