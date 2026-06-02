"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";

/*
  Pricing — exact nodcoding s-bootcamps pattern
  Uses <ul class="s__bootcamps"> with <li class="s__bootcamp sb-bootcamp">
  Each row has: title, schedule, format, location, price, apply button
  Top has hills illustration container + heading
*/

const CLASS_LEVELS = [
    "기초반",
    "초급반",
    "중급반",
    "고급반",
    "진로 및 대회반",
];

const courses = [
    {
        name: "월 5회",
        topic: "주 1~2회 · 기초반 / 초급반 / 중급반",
        schedule: "상시 모집",
        format: "주 1~2회 · 90분",
        location: "대전",
        price: "16~20만원",
    },
    {
        name: "월 8회",
        topic: "주 2회 · 중급반 / 고급반 / 진로 및 대회반",
        schedule: "상시 모집",
        format: "주 2회 · 90분",
        location: "대전",
        price: "26~30만원",
    },
    {
        name: "1:1 과외",
        topic: "맞춤 커리큘럼 · 전 레벨",
        schedule: "상시 모집",
        format: "주 1~3회",
        location: "대전 / 온라인",
        price: "별도 문의",
    },
    {
        name: "무료 체험",
        topic: "레벨 테스트 + 상담",
        schedule: "수시",
        format: "1회 90분",
        location: "대전",
        price: "무료",
    },
];

export default function Pricing() {
    const ref = useRef<HTMLDivElement>(null);
    const [isIn, setIsIn] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([e]) => {
                if (e.isIntersecting) {
                    setIsIn(true);
                    obs.disconnect();
                }
            },
            { rootMargin: "-80px" }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            id="pricing"
            className={`s-bootcamps${isIn ? " is-in" : ""}`}
            data-plr-component="s-bootcamps"
        >
            {/* Hills illustration placeholder */}
            <div className="b-hills s__illus is-init">
                <div className="b__hills">
                    <svg
                        className="b__svg"
                        viewBox="0 0 1920 400"
                        preserveAspectRatio="none"
                        fill="none"
                    >
                        <path
                            d="M0 400V200C320 50 640 0 960 100C1280 200 1600 150 1920 200V400H0Z"
                            fill="var(--color-brand-4, #77C6B3)"
                            opacity="0.15"
                        />
                    </svg>
                </div>
            </div>

            <div className="u-container">
                {/* Header */}
                <div className="s__header js-header lg-reveal is-in">
                    <h2
                        className="s__title t-h-md js-title"
                        aria-label="수강 과정"
                    >
                        수강 과정
                    </h2>
                    <p className="s__intro js-intro">
                        코딩쏙의 과정을 살펴보고, 나에게 맞는 수업을 찾아보세요.
                    </p>
                </div>

                {/* Class levels */}
                <div className="s__levels" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 32 }}>
                    {CLASS_LEVELS.map((level) => (
                        <span
                            key={level}
                            style={{
                                padding: "4px 14px",
                                borderRadius: 999,
                                background: "var(--color-brand-4, #77C6B3)",
                                color: "#fff",
                                fontSize: 13,
                                fontWeight: 700,
                            }}
                        >
                            {level}
                        </span>
                    ))}
                </div>

                {/* Bootcamp list */}
                <ul className="s__bootcamps js-bootcamps">
                    {courses.map((c, i) => (
                        <li
                            key={i}
                            className="s__bootcamp sb-bootcamp js-bootcamp"
                        >
                            <Link
                                href="#contact"
                                data-option={`${c.name} · ${c.topic} · ${c.format}`}
                                className="sb__link"
                            >
                                <span className="sb__title">
                                    <span className="a-bullet-point a-bullet-point--outline a-bullet-point--green" />
                                    {c.name}
                                </span>

                                <span className="sb__dates">
                                    {c.topic}
                                </span>

                                <span className="sb__duration">
                                    {c.format}
                                </span>

                                <span className="sb__location">
                                    {c.location}
                                </span>

                                <span className="sb__price">
                                    {c.price}
                                </span>

                                <span className="sb__btn">
                                    <span
                                        className="btn-plain sb__btn__link"
                                        data-plr-component="btn-plain"
                                    >
                                        <span className="btn-plain__inner">
                                            <span className="btn-plain__text">
                                                신청
                                            </span>
                                            <span className="btn-plain__arrow" />
                                        </span>
                                    </span>
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
