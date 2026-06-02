/**
 * JSON-LD structured data for search engines
 * Static academy info — no user input, no XSS risk
 */

const SCHEMA = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: "코딩쏙 아카데미",
    alternateName: "CodingSSok Academy",
    url: "https://codingssok.com",
    logo: "https://codingssok.com/og-image.png",
    description: "C/Python 중심 텍스트코딩 강화. IT 현직자가 가르치는 코딩 학원.",
    address: {
        "@type": "PostalAddress",
        addressLocality: "대전광역시",
        addressRegion: "유성구",
        streetAddress: "관평동",
        addressCountry: "KR",
    },
    priceRange: "160000-300000 KRW",
    aggregateRating: { "@type": "AggregateRating", ratingValue: "5.0", reviewCount: "152" },
    sameAs: ["https://blog.naver.com/codingssok"],
});

export default function JsonLd() {
    // Static constant — safe to inject, contains no dynamic/user content
    return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: SCHEMA }} />;
}
