/**
 * 코딩쏙 소셜 콘텐츠 (인스타그램 / 네이버 블로그)
 *
 * 담당자 작업:
 *  1. 학원 인스타그램 username 입력 → INSTAGRAM_USERNAME
 *  2. 네이버 블로그 ID 입력 → NAVER_BLOG_ID
 *  3. /api/social/feed 라우트가 자동으로 RSS/oEmbed 페치
 *
 * 페치 전략:
 *  - 네이버 블로그: RSS https://rss.blog.naver.com/{id}.xml (XML → JSON 파싱)
 *  - 인스타그램: Graph API (Business 계정 + access_token 필요) 또는 수동 큐레이션
 *
 * Graph API 미연동 시: INSTAGRAM_MANUAL_POSTS 배열에 수동 입력하면 그대로 표시
 */

export const SOCIAL_CONFIG = {
    instagramUsername: "codingssok", // 담당자 작업: 실제 username 입력
    naverBlogId: "codingssok",       // 담당자 작업: 실제 블로그 ID 입력
    instagramApiToken: process.env.INSTAGRAM_ACCESS_TOKEN, // .env에 추가 (선택)
};

export interface SocialPost {
    id: string;
    platform: "instagram" | "naver-blog";
    title?: string;
    excerpt?: string;
    imageUrl?: string;
    link: string;
    publishedAt: string;
    /** 학습한 콘텐츠 톤/스타일 태그 (해시태그, 키워드 등) */
    tags?: string[];
}

/**
 * 인스타그램 수동 큐레이션 게시물 (Graph API 미연동 시 fallback).
 * 담당자이 직접 좋아하는 게시물 URL/이미지/캡션을 입력.
 */
export const INSTAGRAM_MANUAL_POSTS: SocialPost[] = [
    // 담당자 작업: 실제 인스타 게시물로 교체
    // 예시:
    // {
    //   id: "ig-001",
    //   platform: "instagram",
    //   excerpt: "이번 주 KOI 합숙 현장!",
    //   imageUrl: "/images/social/ig-001.jpg",
    //   link: "https://www.instagram.com/p/XXXXX/",
    //   publishedAt: "2026-03-15",
    //   tags: ["#KOI", "#코딩쏙", "#합숙"],
    // },
];

/**
 * 콘텐츠 톤 가이드 (담당자 학습 결과).
 * 인스타/블로그에 새 글 작성 시 이 톤을 따른다.
 */
export const CONTENT_TONE_GUIDE = {
    voice: "친근하고 진솔, 학생 입장에서 1인칭",
    avoid: ["과장된 광고 문구", "이모지 남발", "전문 용어"],
    emphasize: ["학생의 성장 스토리", "구체적인 결과", "선생님의 따뜻한 코멘트"],
    sampleHashtags: ["#코딩쏙", "#코딩학원", "#KOI", "#정보올림피아드", "#파이썬", "#아두이노"],
    postLength: { min: 80, max: 200, unit: "한글 글자" },
    imageStyle: "밝고 자연스러운 학원 일상, 학생 얼굴 모자이크 또는 뒷모습",
};
