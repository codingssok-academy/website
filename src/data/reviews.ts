/**
 * 코딩쏙 실제 리뷰 데이터
 *
 * 담당자 작업: 네이버 스마트플레이스/구글/카카오맵에서 실제 리뷰 복사해서 채울 것.
 * 학부모/학생 동의 후 이름은 이니셜 처리 권장.
 *
 * 데이터 출처별 권장 워크플로우:
 *  - 네이버: 스마트플레이스 → 리뷰 관리 → 복사 → 작성자 익명화
 *  - 구글: Google Maps 코딩쏙 검색 → 리뷰 탭 → 복사
 *  - 카카오맵: 카카오맵 검색 → 리뷰 탭 → 복사
 *
 * 검증된 리뷰만 verified=true 로 표시. UI에서 미검증은 회색 처리.
 */

export interface Review {
    id: string;
    platform: "naver" | "google" | "kakao";
    rating: 1 | 2 | 3 | 4 | 5;
    /** 작성자 (이니셜 처리 권장: "김OO 학부모", "고1 박OO") */
    author: string;
    /** 작성일 (YYYY-MM-DD 또는 "1주 전" 등) */
    date: string;
    text: string;
    /** 학원 답글 (선택) */
    reply?: string;
    verified: boolean;
}

export const REVIEWS_DATA: Review[] = [
    // ── 담당자 작업: 실제 리뷰로 교체 — 아래는 스타일 가이드용 샘플 ──
    {
        id: "placeholder-1",
        platform: "naver",
        rating: 5,
        author: "이OO 학부모",
        date: "2026-01-15",
        text: "아이가 코딩에 흥미를 잃었었는데 코딩쏙 다니면서 다시 좋아하게 되었어요. 1:1로 봐주시고 진도도 아이 수준에 맞춰주셔서 만족합니다.",
        reply: "감사합니다! 앞으로도 아이가 즐겁게 배울 수 있도록 노력하겠습니다.",
        verified: false,
    },
    {
        id: "placeholder-2",
        platform: "google",
        rating: 5,
        author: "Park OO",
        date: "2025-12-20",
        text: "선생님이 정말 친절하시고 수업도 체계적이에요. 자격증도 준비할 수 있어서 좋습니다.",
        verified: false,
    },
    {
        id: "placeholder-3",
        platform: "kakao",
        rating: 5,
        author: "초6 김OO",
        date: "2025-11-30",
        text: "처음 코딩 배우는데 재밌어요! 게임 만드는 거 너무 좋아요.",
        verified: false,
    },
];

export const REVIEW_PLATFORMS = {
    naver: { name: "네이버", color: "#03C75A", logo: "N" },
    google: { name: "구글", color: "#4285F4", logo: "G" },
    kakao: { name: "카카오맵", color: "#FEE500", logo: "K" },
};

/** 평균 평점 계산 */
export function getAverageRating(reviews: Review[] = REVIEWS_DATA): number {
    if (!reviews.length) return 0;
    const sum = reviews.reduce((s, r) => s + r.rating, 0);
    return Math.round((sum / reviews.length) * 10) / 10;
}
