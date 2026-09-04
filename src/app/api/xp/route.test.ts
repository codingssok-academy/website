import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    createClient: vi.fn(),
    getUser: vi.fn(),
    rpc: vi.fn(),
    rateLimit: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
    createClient: mocks.createClient,
}));

vi.mock("@/lib/rate-limit", () => ({
    rateLimit: mocks.rateLimit,
}));

import { POST } from "./route";

function request(body: unknown) {
    return new NextRequest("https://www.codingssok.com/api/xp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
}

describe("안전한 XP 지급 API", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.getUser.mockResolvedValue({
            data: { user: { id: "fake-student-user" } },
            error: null,
        });
        mocks.rpc.mockResolvedValue({
            data: {
                xp: 130,
                level: 2,
                levelUp: true,
                delta: 30,
                duplicate: false,
            },
            error: null,
        });
        mocks.createClient.mockResolvedValue({
            auth: { getUser: mocks.getUser },
            rpc: mocks.rpc,
        });
        mocks.rateLimit.mockResolvedValue({ success: true, remaining: 29 });
    });

    it("로그인하지 않은 요청을 차단한다", async () => {
        mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });

        const response = await POST(request({
            action: "award",
            type: "unit_complete",
            item_id: "fake-course:unit-1",
        }));

        expect(response.status).toBe(401);
        expect(mocks.rpc).not.toHaveBeenCalled();
    });

    it("허용된 활동을 DB의 단일 XP 함수로 전달한다", async () => {
        const response = await POST(request({
            action: "award",
            type: " unit_complete ",
            item_id: " fake-course:unit-1 ",
        }));
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(mocks.rpc).toHaveBeenCalledWith("growth_api_award_xp", {
            p_action_type: "unit_complete",
            p_item_id: "fake-course:unit-1",
        });
        expect(body).toEqual({
            xp: 130,
            level: 2,
            levelUp: true,
            delta: 30,
            duplicate: false,
        });
    });

    it("DB가 반환한 중복 및 일일 한도 결과를 그대로 전달한다", async () => {
        mocks.rpc.mockResolvedValue({
            data: {
                xp: 100,
                level: 2,
                levelUp: false,
                delta: 0,
                duplicate: true,
                reason: "daily_cap",
            },
            error: null,
        });

        const response = await POST(request({
            action: "award",
            type: "code_run",
            item_id: "fake-code-run-21",
        }));

        expect(await response.json()).toEqual({
            xp: 100,
            level: 2,
            levelUp: false,
            delta: 0,
            duplicate: true,
            reason: "daily_cap",
        });
    });

    it("허용되지 않은 활동과 지나치게 긴 항목 ID를 DB 호출 전에 차단한다", async () => {
        const invalidAction = await POST(request({
            action: "award",
            type: "fake_action",
            item_id: "fake-item",
        }));
        const longItem = await POST(request({
            action: "award",
            type: "lesson_view",
            item_id: "x".repeat(201),
        }));

        expect(invalidAction.status).toBe(400);
        expect(longItem.status).toBe(400);
        expect(mocks.rpc).not.toHaveBeenCalled();
    });

    it("짧은 시간에 너무 많은 요청을 차단한다", async () => {
        mocks.rateLimit.mockResolvedValue({ success: false, remaining: 0 });

        const response = await POST(request({
            action: "award",
            type: "lesson_view",
            item_id: "fake-lesson",
        }));

        expect(response.status).toBe(429);
        expect(mocks.rpc).not.toHaveBeenCalled();
    });

    it("활성 학생이 아니면 DB 권한 오류를 쉬운 메시지로 바꾼다", async () => {
        mocks.rpc.mockResolvedValue({
            data: null,
            error: { code: "42501", message: "active student login is required" },
        });

        const response = await POST(request({
            action: "award",
            type: "lesson_view",
            item_id: "fake-lesson",
        }));
        const body = await response.json();

        expect(response.status).toBe(403);
        expect(body.error).toContain("활성 상태의 학생");
    });

    it("DB 응답 모양이 잘못되면 성공으로 처리하지 않는다", async () => {
        mocks.rpc.mockResolvedValue({ data: { xp: 30 }, error: null });

        const response = await POST(request({
            action: "award",
            type: "unit_complete",
            item_id: "fake-course:unit-1",
        }));

        expect(response.status).toBe(500);
    });
});
