import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useLessonAnswerPersistence } from "./useLessonPersistence";

const answer = {
    quizAnswer: null,
    quizResult: null,
    codeAnswers: { activity: "원이 파란색으로 바뀌었어요" },
};

describe("useLessonAnswerPersistence", () => {
    afterEach(() => {
        localStorage.clear();
        vi.unstubAllGlobals();
    });

    it("retries a failed academy account save without losing the local answer", async () => {
        const fetchMock = vi.fn()
            .mockResolvedValueOnce({ ok: true, json: async () => ({ answers: [] }) })
            .mockResolvedValueOnce({ ok: false, status: 503 })
            .mockResolvedValueOnce({ ok: true, status: 200 });
        vi.stubGlobal("fetch", fetchMock);
        const onRestore = vi.fn();

        const { result } = renderHook(() => useLessonAnswerPersistence({
            enabled: true,
            userId: "test-student",
            courseId: "11",
            unitId: "unit-1",
            pageId: "page-1",
            answer,
            onRestore,
        }));

        await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2), { timeout: 2_000 });
        await waitFor(() => expect(result.current.status).toBe("local"));

        await act(async () => {
            await result.current.retry();
        });

        expect(result.current.status).toBe("saved");
        expect(fetchMock).toHaveBeenCalledTimes(3);
        expect(fetchMock.mock.calls[2]?.[1]).toMatchObject({ method: "POST" });
    });
});
