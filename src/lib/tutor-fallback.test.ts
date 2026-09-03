import { beforeEach, describe, expect, it } from "vitest";
import {
    buildBasicTutorHint,
    buildTeacherQuestionDraft,
    clearTeacherQuestionDraft,
    prioritizeTeacherContacts,
    readTeacherQuestionDraft,
    saveTeacherQuestionDraft,
} from "./tutor-fallback";

describe("tutor fallback helpers", () => {
    beforeEach(() => sessionStorage.clear());

    it("offers a safe error-checking hint when code execution failed", () => {
        expect(buildBasicTutorHint({
            question: "왜 실행이 안 돼요?",
            currentError: "SyntaxError on line 2",
            currentLanguage: "Python",
        })).toContain("오류가 표시된 첫 번째 줄");
    });

    it("offers a question-specific hint without revealing the answer", () => {
        expect(buildBasicTutorHint({ question: "for 반복문은 어떻게 써요?" })).toContain("반복할 일");
        expect(buildBasicTutorHint({ question: "if 조건이 어려워요" })).toContain("참인지 거짓인지");
    });

    it("prepares a teacher message and hides private access codes", () => {
        const draft = buildTeacherQuestionDraft({
            question: "비밀번호 1234인데 반복문이 어려워요",
            context: "파이썬 코어 > 반복문",
        });

        expect(draft).toContain("[쏙쌤에서 남긴 질문]");
        expect(draft).toContain("학습 중: 파이썬 코어 > 반복문");
        expect(draft).toContain("비밀번호 [숨김]");
        expect(draft).not.toContain("1234");
    });

    it("keeps the draft only in the current browser session until it is cleared", () => {
        expect(saveTeacherQuestionDraft("테스트 질문")).toBe(true);
        expect(readTeacherQuestionDraft()).toBe("테스트 질문");
        clearTeacherQuestionDraft();
        expect(readTeacherQuestionDraft()).toBe("");
    });

    it("places an administrator teacher first without changing the source list", () => {
        const contacts = [
            { id: "teacher", role: "teacher", display_name: "김선생님" },
            { id: "admin", role: "admin", display_name: "관리자 선생님" },
        ];

        const prioritized = prioritizeTeacherContacts(contacts);
        expect(prioritized.map(contact => contact.id)).toEqual(["admin", "teacher"]);
        expect(contacts.map(contact => contact.id)).toEqual(["teacher", "admin"]);
    });
});
