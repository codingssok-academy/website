/**
 * 어버이날 감사 카드 데이터 — 학생별
 * 키: 학생 이름 (학부모 포털 진입 시 입력하는 자녀 이름과 매칭)
 *
 * 학생이 학원에서 HTML/CSS로 자유롭게 만든 카드를 담당자이 여기에 박음.
 * - title / message: 텍스트 (간단)
 * - html: 학생이 직접 작성한 HTML 콘텐츠 (자유 디자인용)
 * - background: CSS gradient/색상
 * - signature: 마무리 문구
 */

export interface ParentsDayCard {
    studentName: string;
    title: string;
    message: string;          // 줄바꿈 \n 사용
    html?: string;            // 학생이 직접 작성한 HTML (선택, message보다 우선)
    imageUrl?: string;        // 풀 카드 이미지 URL (있으면 텍스트 대신 이미지만 표시)
    background?: string;      // CSS gradient (예: "linear-gradient(135deg, #fef3c7, #fde68a)")
    accentColor?: string;     // 강조 색상
    signature?: string;       // 끝 인사
    createdAt: string;
}

/**
 * 학생 이름 → 카드 데이터.
 * 학부모 포털에서 자녀 이름 검색 시 매칭.
 * 이름은 학부모 게이트에 입력하는 그대로 (공백/대소문자 정규화 안 됨).
 */
export const parentsDayCards: Record<string, ParentsDayCard> = {
    "민다온": {
        studentName: "민다온",
        title: "엄마 아빠 사랑해요 ❤️",
        message: "엄마, 아빠.\n저를 항상 사랑해주시고\n키워주셔서 감사해요.\n\n앞으로도 건강하게\n오래오래 함께해요!",
        imageUrl: "/images/parents-day/mindaon.webp",
        background: "linear-gradient(135deg, #fff5f5 0%, #fde8ec 50%, #fbcfe8 100%)",
        accentColor: "#dc2626",
        signature: "사랑하는 아들 다온 올림",
        createdAt: "2026-05-08",
    },
};

export function getParentsDayCard(studentName: string | null): ParentsDayCard | null {
    if (!studentName) return null;
    const trimmed = studentName.trim();
    return parentsDayCards[trimmed] ?? null;
}
