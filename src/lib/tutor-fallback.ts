export const TEACHER_QUESTION_DRAFT_KEY = "codingssok_teacher_question_draft";

const MAX_QUESTION_LENGTH = 1_000;
const MAX_CONTEXT_LENGTH = 180;

function cleanText(value: string | undefined, maxLength: number) {
    return (value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export function prioritizeTeacherContacts<T extends {
    id: string;
    role?: string | null;
    display_name?: string | null;
    name?: string | null;
}>(contacts: T[]) {
    return [...contacts].sort((left, right) => {
        const roleOrder = (role?: string | null) => role === "admin" ? 0 : 1;
        const byRole = roleOrder(left.role) - roleOrder(right.role);
        if (byRole !== 0) return byRole;
        const leftName = cleanText(left.display_name || left.name || "", 80);
        const rightName = cleanText(right.display_name || right.name || "", 80);
        return leftName.localeCompare(rightName, "ko");
    });
}

export function buildBasicTutorHint({
    question,
    currentError,
    currentLanguage,
}: {
    question: string;
    currentError?: string;
    currentLanguage?: string;
}) {
    const normalized = question.toLowerCase();

    if (cleanText(currentError, 500)) {
        return "오류가 표시된 첫 번째 줄을 찾아보세요. 그 줄의 괄호, 따옴표, 콜론과 들여쓰기를 하나씩 확인한 뒤 다시 실행해 보세요.";
    }
    if (/(반복|for|while|loop)/i.test(normalized)) {
        return "똑같이 여러 번 해야 하는 부분을 먼저 찾아보세요. 반복할 일을 한 줄로 정리한 다음, 몇 번 반복할지 작은 숫자로 시험해 보세요.";
    }
    if (/(조건|if|else|비교)/i.test(normalized)) {
        return "조건을 ‘맞으면 무엇을 하고, 아니면 무엇을 할지’ 두 칸으로 나눠 적어보세요. 그다음 조건이 참인지 거짓인지 한 번씩 시험해 보세요.";
    }
    if (/(변수|저장|값)/i.test(normalized)) {
        return "바뀌는 값에 짧고 뜻이 분명한 이름을 붙여보세요. 값을 넣은 직후 출력해 보면 변수에 무엇이 저장됐는지 확인할 수 있어요.";
    }
    if (/(함수|def|매개변수|return)/i.test(normalized)) {
        return "함수가 받아야 하는 값과 돌려줘야 하는 결과를 먼저 한 줄로 적어보세요. 가장 간단한 값 하나를 넣어 함수만 따로 실행해 보세요.";
    }
    if (/(출력|print|결과|화면)/i.test(normalized)) {
        return "출력하고 싶은 내용을 작은 따옴표 안에 넣었는지 확인해 보세요. 계산 결과라면 따옴표 없이 변수나 계산식을 출력해 보세요.";
    }

    const language = cleanText(currentLanguage, 30);
    return `${language ? `${language} 코드를` : "코드를"} 가장 작은 한 단계로 나눠보세요. 한 줄을 실행한 뒤 예상한 결과와 실제 결과가 어디서 달라지는지 찾아보면 다음 단서가 보여요.`;
}

export function buildTeacherQuestionDraft({
    question,
    context,
}: {
    question: string;
    context?: string;
}) {
    const safeQuestion = cleanText(question, MAX_QUESTION_LENGTH).replace(
        /((?:비밀번호|인증번호|password|passcode|pin)\s*[:=]?\s*)\d{4,}/gi,
        "$1[숨김]",
    );
    const safeContext = cleanText(context, MAX_CONTEXT_LENGTH);
    return [
        "[쏙쌤에서 남긴 질문]",
        safeContext ? `학습 중: ${safeContext}` : "",
        `궁금한 점: ${safeQuestion}`,
    ].filter(Boolean).join("\n");
}

export function saveTeacherQuestionDraft(draft: string) {
    try {
        sessionStorage.setItem(TEACHER_QUESTION_DRAFT_KEY, draft);
        return true;
    } catch {
        return false;
    }
}

export function readTeacherQuestionDraft() {
    try {
        return sessionStorage.getItem(TEACHER_QUESTION_DRAFT_KEY) || "";
    } catch {
        return "";
    }
}

export function clearTeacherQuestionDraft() {
    try {
        sessionStorage.removeItem(TEACHER_QUESTION_DRAFT_KEY);
    } catch {
        // 브라우저 저장소를 사용할 수 없어도 메시지 화면은 계속 사용할 수 있습니다.
    }
}
