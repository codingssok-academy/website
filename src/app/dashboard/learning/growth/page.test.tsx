import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import StudentGrowthPage from "./page";

vi.mock("@/features/growth-v2/attendance/MonthlyAttendancePanel", () => ({
    MonthlyAttendancePanel: () => <section aria-label="학생 월별 출석">월별 출석 연결</section>,
}));

describe("student Growth 2.0 page", () => {
    beforeEach(() => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({
                success: true,
                student: { name: "가짜학생", school: "가짜초등학교", grade: "5학년", className: "가짜반" },
                growth: {
                    current: {
                        id: "growth-1",
                        currentClass: "가짜반",
                        strengths: "끝까지 해결했어요.",
                        currentGoal: "반복문 완성",
                        classProgress: "for 반복문",
                        parentFeedback: "꾸준히 성장 중이에요.",
                        recordedAt: "2026-08-27T00:00:00.000Z",
                    },
                    history: [],
                },
            }),
        }));
    });

    afterEach(() => vi.unstubAllGlobals());

    it("shows the same completed public growth record to the linked student", async () => {
        render(<StudentGrowthPage />);

        expect(await screen.findByRole("heading", { name: "나의 성장 기록" })).toBeInTheDocument();
        expect(await screen.findByText("for 반복문")).toBeInTheDocument();
        expect(screen.getByText("끝까지 해결했어요.")).toBeInTheDocument();
        expect(screen.getByText("반복문 완성")).toBeInTheDocument();
        expect(screen.getByText("꾸준히 성장 중이에요.")).toBeInTheDocument();
        expect(screen.getByLabelText("학생 월별 출석")).toBeInTheDocument();
        expect(screen.getByText(/내부 메모는 학생에게 표시되지 않습니다/)).toBeInTheDocument();
        expect(fetch).toHaveBeenCalledWith("/api/student/growth", expect.objectContaining({ cache: "no-store" }));
    });
});
