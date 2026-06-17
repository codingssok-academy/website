"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const P = (url: string) => `/api/proxy-image?url=${encodeURIComponent(url)}`;

type ShowcaseItem = {
    title: string;
    label: string;
    description: string;
    date: string;
    image: string;
    link: string;
};

const competitions: ShowcaseItem[] = [
    {
        title: "청소년 IT경시대회",
        label: "대회 준비",
        description: "문제 독해, 조건 분석, 알고리즘 구현까지 실제 대회형 문제를 기준으로 훈련합니다.",
        date: "2026",
        image: P("https://blogthumb.pstatic.net/MjAyNjAyMDVfMTcw/MDAxNzcwMjY3MTUyODY0.JY5KdgGdTU0vH5lWaPDNQ6R4VhgUv2sk9jwEpQmecRAg.A7f1u2cbz6NdKO0pOJ_x4yEy0rJFpgvvo8tl87anx2sg.PNG/2026_%C1%A66%C8%B8_%C3%BB%BC%D2%B3%E2_IT%B0%E6%BD%C3%B4%EB%C8%B8_%C6%F7%BD%BA%C5%CD_%28260204%29_1.png?type=s3"),
        link: "https://blog.naver.com/codingssok",
    },
    {
        title: "KOI 정보올림피아드 대비",
        label: "알고리즘",
        description: "C++과 Python 기반으로 입문부터 중급 문제까지 풀이 기록을 남기며 난이도를 올립니다.",
        date: "상시 운영",
        image: "/images/courses/koi.png",
        link: "/dashboard/learning",
    },
    {
        title: "외부 OJ 문제 풀이",
        label: "풀이 기록",
        description: "KOISTUDY, BIKO, Programmers 문제 풀이 현황을 학습 기록과 연결하는 방향으로 운영합니다.",
        date: "연구 진행",
        image: "/images/courses/cpp.png",
        link: "/dashboard/learning",
    },
];

const contests: ShowcaseItem[] = [
    {
        title: "IT코딩 발명 아이디어 경진대회",
        label: "수상 기록",
        description: "문제 발견, 아이디어 설계, 구현 방향 정리까지 학생의 사고 과정을 결과물로 증명합니다.",
        date: "2026.04",
        image: P("https://blogthumb.pstatic.net/MjAyNjA0MDhfMjEz/MDAxNzc1NjM1MjM1NjEz.0msIcp91ID97i_-DLisQbUlEYBFnOkrUMYSZ20VH-Tkg.1F2ZU6k39hJFJI-BJXpmfTBb15d72fF5FoUfcsOc_Zsg.PNG/image.png?type=s3"),
        link: "https://blog.naver.com/codingssok",
    },
    {
        title: "전국학생과학발명품경진대회",
        label: "공모전 준비",
        description: "코딩과 피지컬 컴퓨팅을 활용해 생활 문제를 해결하는 발명형 프로젝트를 준비합니다.",
        date: "2026",
        image: P("https://blogthumb.pstatic.net/MjAyNjAxMDlfMzcg/MDAxNzY3OTM5MzQ4ODAx.yEL2g88KH5XzNyeI3N46PyQk8niISYsEhn6ZPS1oUSgg.xaIIRlaNIgryTp2eD0S2qlyErWGbixjr5Uz4vB-LHJQg.PNG/image.png?type=s3"),
        link: "https://blog.naver.com/codingssok",
    },
    {
        title: "교육 공공데이터 AI 활용대회",
        label: "AI 활용",
        description: "데이터를 읽고 문제를 정의한 뒤 AI 도구와 코딩으로 설명 가능한 결과물을 만듭니다.",
        date: "2026",
        image: P("https://blogthumb.pstatic.net/MjAyNjAzMjNfNzEg/MDAxNzc0MjM5NjQyNjY4.UbNBUHlqvp3LnDLYK5ufdJTmskAi5vGK7Fqb9FF3uZUg.8YzVL40_l-mV9YWylrug-tTeL8GBroYXb3J3A3qc-qIg.JPEG/%C1%A68%C8%B8_%B1%B3%C0%B0_%B0%F8%B0%F8%B5%A5%C0%CC%C5%CD_AI_%C8%B0%BF%EB%B4%EB%C8%B8_%C6%F7%BD%BA%C5%CD_%C3%D6%C1%BE%BA%BB.jpg?type=s3"),
        link: "https://blog.naver.com/codingssok",
    },
    {
        title: "WAIFF Seoul 2026",
        label: "AI 영상",
        description: "기획, 스토리보드, 생성형 AI 활용, 결과물 발표까지 프로젝트 수업과 연결합니다.",
        date: "2026",
        image: P("https://blogthumb.pstatic.net/MjAyNjAyMDdfNzAg/MDAxNzcwNDI5NTA5MTky.oWyaCxyIqF41g_ZbrVFdDdbflWiwDD_KQU9p5s6VSkEg.zLz8uNjNSSKTSLc38oebjver2szc2ERUKsHBBZzBEb8g.PNG/%BC%BC%B0%E8ai%BF%B5%C8%AD%C1%A6.png?type=s3"),
        link: "https://blog.naver.com/codingssok",
    },
];

function ShowcaseCard({ item, index }: { item: ShowcaseItem; index: number }) {
    return (
        <motion.a
            href={item.link}
            target={item.link.startsWith("http") ? "_blank" : undefined}
            rel={item.link.startsWith("http") ? "noreferrer" : undefined}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: index * 0.06, duration: 0.45, ease: "easeOut" }}
            whileHover={{ y: -4 }}
            style={{
                display: "grid",
                gridTemplateRows: "190px auto",
                minHeight: 360,
                border: "1px solid #dbe3ef",
                borderRadius: 18,
                overflow: "hidden",
                background: "#ffffff",
                color: "inherit",
                textDecoration: "none",
                boxShadow: "0 16px 42px rgba(15, 23, 42, 0.07)",
            }}
        >
            <div style={{ position: "relative", background: "#eaf1fb", overflow: "hidden" }}>
                <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: "linear-gradient(to bottom, rgba(15,23,42,0.05), rgba(15,23,42,0.44))",
                    }}
                />
                <span
                    style={{
                        position: "absolute",
                        left: 16,
                        bottom: 14,
                        padding: "6px 10px",
                        borderRadius: 999,
                        background: "rgba(255,255,255,0.92)",
                        color: "#1e3a8a",
                        fontSize: 12,
                        fontWeight: 800,
                    }}
                >
                    {item.label}
                </span>
            </div>
            <div style={{ padding: 20 }}>
                <div style={{ fontSize: 12, color: "#64748b", fontWeight: 800, marginBottom: 10 }}>
                    {item.date}
                </div>
                <h4 style={{ margin: "0 0 10px", color: "#0f172a", fontSize: 21, lineHeight: 1.3, letterSpacing: "-0.02em" }}>
                    {item.title}
                </h4>
                <p style={{ margin: 0, color: "#475569", fontSize: 14, lineHeight: 1.7 }}>
                    {item.description}
                </p>
            </div>
        </motion.a>
    );
}

function ShowcaseGroup({
    eyebrow,
    title,
    description,
    items,
}: {
    eyebrow: string;
    title: string;
    description: string;
    items: ShowcaseItem[];
}) {
    return (
        <div style={{ marginTop: 44 }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, marginBottom: 18, flexWrap: "wrap" }}>
                <div>
                    <div style={{ color: "#2563eb", fontSize: 12, fontWeight: 900, letterSpacing: "0.16em", marginBottom: 8 }}>
                        {eyebrow}
                    </div>
                    <h3 style={{ margin: 0, color: "#0f172a", fontSize: "clamp(24px, 3vw, 34px)", letterSpacing: "-0.04em" }}>
                        {title}
                    </h3>
                </div>
                <p style={{ margin: 0, maxWidth: 470, color: "#64748b", fontSize: 14, lineHeight: 1.7 }}>
                    {description}
                </p>
            </div>
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                    gap: 18,
                }}
            >
                {items.map((item, index) => (
                    <ShowcaseCard key={item.title} item={item} index={index} />
                ))}
            </div>
        </div>
    );
}

export default function Events() {
    const sectionRef = useRef<HTMLElement>(null);
    const inView = useInView(sectionRef, { once: true, margin: "-80px" });

    return (
        <section id="events" ref={sectionRef} style={{ background: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
            <div style={{ maxWidth: 1180, margin: "0 auto", padding: "clamp(78px, 9vw, 120px) 20px" }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5 }}
                    style={{ maxWidth: 760 }}
                >
                    <div style={{ color: "#2563eb", fontSize: 12, fontWeight: 900, letterSpacing: "0.16em", marginBottom: 12 }}>
                        COMPETITION AND PORTFOLIO
                    </div>
                    <h2 style={{ margin: 0, color: "#020617", fontSize: "clamp(34px, 5vw, 56px)", letterSpacing: "-0.055em", lineHeight: 1.05 }}>
                        대회와 공모전을 다른 목표로 관리합니다
                    </h2>
                    <p style={{ margin: "18px 0 0", color: "#475569", fontSize: 16, lineHeight: 1.75 }}>
                        대회는 문제 해결력과 알고리즘 실력을, 공모전은 아이디어와 제작 결과물을 증명하는 과정입니다.
                        코딩쏙은 두 흐름을 분리해 학생별 기록과 포트폴리오로 남깁니다.
                    </p>
                </motion.div>

                <ShowcaseGroup
                    eyebrow="COMPETITIONS"
                    title="대회 준비"
                    description="문제를 읽고 조건을 분석한 뒤 코드로 검증하는 흐름을 반복합니다. 외부 문제 풀이 기록은 학생의 실력 성장 자료로 관리합니다."
                    items={competitions}
                />

                <ShowcaseGroup
                    eyebrow="CONTESTS"
                    title="공모전과 프로젝트"
                    description="아이디어를 실제 결과물로 만들고, 발표 자료와 GitHub 기록까지 연결해 학부모와 학교가 확인할 수 있는 산출물로 정리합니다."
                    items={contests}
                />
            </div>
        </section>
    );
}
