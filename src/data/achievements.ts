/**
 * 코딩쏙 대회·공모전 성과 데이터
 *
 * ⚠️ TODO(담당자): 실제 학원 대회 참가/수상 데이터로 교체할 것.
 * 현재는 placeholder. 학원 운영 기록과 대조하여 정확한 정보로 갱신.
 *
 * 업데이트 시 체크리스트:
 *  □ 대회명 정확히 (주최기관 표기 통일)
 *  □ 날짜 (YYYY년 M월 형식)
 *  □ 수상 등급 (대상/금상/은상/동상/장려/입상)
 *  □ 학생 이름 (학부모 동의 후 이니셜만)
 *  □ 사진 (얼굴 모자이크 또는 뒷모습)
 */

export interface Achievement {
    id: string;
    image: string;
    alt: string;
    title: string;
    organizer: string; // 주최기관
    desc: string;
    date: string;
    location: string;
    badge: string; // 수상 등급
    participants: string; // 전체 참가 규모
    status: "upcoming" | "live" | "archived";
    awardLevel?: "grand" | "gold" | "silver" | "bronze" | "special" | "merit";
    studentInitials?: string[]; // ["김OO", "이OO"]
    /** 검증된 실제 데이터인지 (false면 placeholder/예정) */
    verified: boolean;
}

export const ACHIEVEMENTS_UPCOMING: Achievement[] = [
    {
        id: "koi-2026",
        image: "/images/events/competition-1.jpg",
        alt: "2026 한국정보올림피아드 대회 현장",
        title: "한국정보올림피아드(KOI)",
        organizer: "한국정보과학회",
        desc: "C언어 알고리즘 문제풀이 집중 준비. 전국 본선 진출 목표.",
        date: "2026년 8월",
        location: "서울 코엑스",
        badge: "참가 예정",
        participants: "48명 준비 중",
        status: "upcoming",
        verified: false, // TODO: 실제 등록 학생 수 확인
    },
];

export const ACHIEVEMENTS_PAST: Achievement[] = [
    // TODO: 실제 수상 기록으로 교체
    // 아래는 구조 예시 (실데이터 입력 시 verified: true 로 변경)
    {
        id: "placeholder-1",
        image: "/images/events/competition-2.jpg",
        alt: "전국 청소년 코딩 챌린지",
        title: "전국 청소년 코딩 챌린지",
        organizer: "한국과학창의재단",
        desc: "Python 부문 실시간 코딩 과제 — 제한 시간 내 완성형 평가.",
        date: "2024년 9월",
        location: "부산 벡스코",
        badge: "은상",
        participants: "1,800명",
        status: "archived",
        awardLevel: "silver",
        verified: false,
    },
];

export const ACHIEVEMENT_STATS = {
    // TODO: 실제 누적 수치로 교체
    totalCompetitions: 24,    // 누적 참가 대회
    totalAwards: 15,          // 누적 수상 횟수
    totalStudents: 120,       // 누적 참가 학생
    awardRate: 87,            // 수상률 %
};
