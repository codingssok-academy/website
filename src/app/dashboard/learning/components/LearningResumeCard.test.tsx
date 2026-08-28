import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LearningResumeCard from "./LearningResumeCard";

const limit = vi.fn();
const order = vi.fn(() => ({ limit }));
const not = vi.fn(() => ({ order }));
const eq = vi.fn(() => ({ not }));
const select = vi.fn(() => ({ eq }));
const from = vi.fn(() => ({ select }));

vi.mock("@/lib/supabase/client", () => ({
    createClient: () => ({ from }),
}));

describe("LearningResumeCard", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("shows the exact last page and its remaining stages", async () => {
        limit.mockResolvedValueOnce({
            data: [{
                course_id: "11",
                course_title: "디지털 창작자",
                unit_id: "digital-creator-v2-u01",
                unit_title: "컴퓨터 탐험대 출발",
                page_id: "digital-creator-v2-004",
                page_title: "만들기 도전",
                started_at: "2026-08-28T10:00:00.000Z",
            }],
            error: null,
        });

        render(<LearningResumeCard userId="fake-student-id" />);

        expect(await screen.findByRole("heading", { name: "디지털 창작자" })).toBeInTheDocument();
        expect(screen.getByText("컴퓨터 탐험대 출발 · 만들기 도전")).toBeInTheDocument();
        expect(screen.getByText("4/10단계")).toBeInTheDocument();
        expect(screen.getByText("현재 위치 뒤로 6단계가 더 있습니다.")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /이어서 학습하기/ })).toHaveAttribute(
            "href",
            "/dashboard/learning/courses/11?unit=digital-creator-v2-u01&page=digital-creator-v2-004",
        );
    });

    it("guides a new student to choose a course when no activity exists", async () => {
        limit.mockResolvedValueOnce({ data: [], error: null });

        render(<LearningResumeCard userId="fake-new-student-id" />);

        expect(await screen.findByRole("heading", { name: "아직 저장된 학습 위치가 없어요." })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /코스 선택하기/ })).toHaveAttribute(
            "href",
            "/dashboard/learning/courses",
        );
    });
});
