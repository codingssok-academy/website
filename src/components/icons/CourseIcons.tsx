"use client";

import React from "react";

/* ═══════════════════════════════════════
   코딩쏙 아카데미 — Premium Course SVG Icons
   초고퀄리티 인라인 SVG 아이콘 시스템
   ═══════════════════════════════════════ */

interface IconProps {
    size?: number;
    className?: string;
    style?: React.CSSProperties;
}

/* ── 1. 코딩 기초 — 코드 블록 + 스파크 ── */
export function CodingBasicsIcon({ size = 32, className, style }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} style={style}>
            <defs>
                <linearGradient id="cb-bg" x1="0" y1="0" x2="48" y2="48">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
                <linearGradient id="cb-shine" x1="0" y1="0" x2="48" y2="48">
                    <stop offset="0%" stopColor="#fff" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                </linearGradient>
            </defs>
            <rect width="48" height="48" rx="14" fill="url(#cb-bg)" />
            <rect width="48" height="48" rx="14" fill="url(#cb-shine)" />
            {/* Terminal bracket */}
            <path d="M14 16L22 24L14 32" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M24 32H34" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
            {/* Spark */}
            <circle cx="36" cy="14" r="2" fill="#fef08a" />
            <path d="M36 10V12M36 16V18M32 14H34M38 14H40" stroke="#fef08a" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

/* ── 2. 피지컬 컴퓨팅 — 회로 보드 + 칩 ── */
export function PhysicalComputingIcon({ size = 32, className, style }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} style={style}>
            <defs>
                <linearGradient id="pc-bg" x1="0" y1="0" x2="48" y2="48">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#f97316" />
                </linearGradient>
                <linearGradient id="pc-shine" x1="0" y1="0" x2="48" y2="48">
                    <stop offset="0%" stopColor="#fff" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                </linearGradient>
            </defs>
            <rect width="48" height="48" rx="14" fill="url(#pc-bg)" />
            <rect width="48" height="48" rx="14" fill="url(#pc-shine)" />
            {/* CPU chip */}
            <rect x="16" y="16" width="16" height="16" rx="3" stroke="#fff" strokeWidth="2.5" fill="none" />
            <rect x="20" y="20" width="8" height="8" rx="1.5" fill="#fff" fillOpacity="0.9" />
            {/* Pins */}
            <path d="M20 16V12M24 16V12M28 16V12" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            <path d="M20 32V36M24 32V36M28 32V36" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            <path d="M16 20H12M16 24H12M16 28H12" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            <path d="M32 20H36M32 24H36M32 28H36" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

/* ── 3. 파이썬 — 뱀 모양 브래킷 ── */
export function PythonIcon({ size = 32, className, style }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} style={style}>
            <defs>
                <linearGradient id="py-bg" x1="0" y1="0" x2="48" y2="48">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
                <linearGradient id="py-shine" x1="0" y1="0" x2="48" y2="48">
                    <stop offset="0%" stopColor="#fff" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                </linearGradient>
            </defs>
            <rect width="48" height="48" rx="14" fill="url(#py-bg)" />
            <rect width="48" height="48" rx="14" fill="url(#py-shine)" />
            {/* Python-style interlocking shape */}
            <path d="M24 12C18 12 14 14.5 14 18V22C14 24.5 16 26 20 26H24V28H18C14 28 12 30 12 33V36C12 39 16 40 20 40" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M24 36C30 36 34 33.5 34 30V26C34 23.5 32 22 28 22H24V20H30C34 20 36 18 36 15V12C36 9 32 8 28 8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <circle cx="19" cy="16" r="2" fill="#fef08a" />
            <circle cx="29" cy="32" r="2" fill="#bfdbfe" />
        </svg>
    );
}

/* ── 4. C언어 — 중괄호 + C ── */
export function CLangIcon({ size = 32, className, style }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} style={style}>
            <defs>
                <linearGradient id="cl-bg" x1="0" y1="0" x2="48" y2="48">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
                <linearGradient id="cl-shine" x1="0" y1="0" x2="48" y2="48">
                    <stop offset="0%" stopColor="#fff" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                </linearGradient>
            </defs>
            <rect width="48" height="48" rx="14" fill="url(#cl-bg)" />
            <rect width="48" height="48" rx="14" fill="url(#cl-shine)" />
            {/* C letter */}
            <path d="M30 16C28.5 13.5 26 12 23 12C18 12 14 16.5 14 24C14 31.5 18 36 23 36C26 36 28.5 34.5 30 32" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" />
            {/* Curly braces */}
            <path d="M34 14C36 14 37 15 37 17V20C37 22 38 23 40 23" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" fill="none" strokeOpacity="0.5" />
            <path d="M34 34C36 34 37 33 37 31V28C37 26 38 25 40 25" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" fill="none" strokeOpacity="0.5" />
        </svg>
    );
}

/* ── 5. 게임 제작 — 게임패드 + 빌드 블록 ── */
export function GameMakerIcon({ size = 32, className, style }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} style={style}>
            <defs>
                <linearGradient id="gm-bg" x1="0" y1="0" x2="48" y2="48">
                    <stop offset="0%" stopColor="#2563eb" />
                    <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
                <linearGradient id="gm-shine" x1="0" y1="0" x2="48" y2="48">
                    <stop offset="0%" stopColor="#fff" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                </linearGradient>
            </defs>
            <rect width="48" height="48" rx="14" fill="url(#gm-bg)" />
            <rect width="48" height="48" rx="14" fill="url(#gm-shine)" />
            <path d="M16 18H32C35.5 18 38 21 38 24.5V29C38 32 36 34 33.5 34C31.5 34 30 32.8 28.5 30.5H19.5C18 32.8 16.5 34 14.5 34C12 34 10 32 10 29V24.5C10 21 12.5 18 16 18Z" stroke="#fff" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M17 23V29M14 26H20" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="30" cy="24" r="1.7" fill="#fef08a" />
            <circle cx="34" cy="28" r="1.7" fill="#fef08a" />
            <path d="M20 13H24V17H20V13ZM26 10H30V14H26V10Z" fill="#fff" fillOpacity="0.75" />
        </svg>
    );
}

/* ── 기존 CosPro 아이콘 — 이전 자격 과정 호환용 ── */
export function CosProIcon({ size = 32, className, style }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} style={style}>
            <defs>
                <linearGradient id="cp-bg" x1="0" y1="0" x2="48" y2="48">
                    <stop offset="0%" stopColor="#ec4899" />
                    <stop offset="100%" stopColor="#f43f5e" />
                </linearGradient>
                <linearGradient id="cp-shine" x1="0" y1="0" x2="48" y2="48">
                    <stop offset="0%" stopColor="#fff" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="cp-medal" x1="20" y1="16" x2="28" y2="36">
                    <stop offset="0%" stopColor="#fef08a" />
                    <stop offset="100%" stopColor="#fbbf24" />
                </linearGradient>
            </defs>
            <rect width="48" height="48" rx="14" fill="url(#cp-bg)" />
            <rect width="48" height="48" rx="14" fill="url(#cp-shine)" />
            {/* Ribbon */}
            <path d="M18 10L24 18L30 10" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            {/* Medal circle */}
            <circle cx="24" cy="26" r="10" stroke="url(#cp-medal)" strokeWidth="2.5" fill="none" />
            <circle cx="24" cy="26" r="6" fill="url(#cp-medal)" fillOpacity="0.3" />
            {/* Star in medal */}
            <path d="M24 21L25.5 24.5L29 25L26.5 27.5L27 31L24 29.5L21 31L21.5 27.5L19 25L22.5 24.5Z" fill="#fff" fillOpacity="0.9" />
        </svg>
    );
}

/* ── 6. 프로그래밍 대회 — 트로피 ── */
export function ContestIcon({ size = 32, className, style }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} style={style}>
            <defs>
                <linearGradient id="ct-bg" x1="0" y1="0" x2="48" y2="48">
                    <stop offset="0%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#eab308" />
                </linearGradient>
                <linearGradient id="ct-shine" x1="0" y1="0" x2="48" y2="48">
                    <stop offset="0%" stopColor="#fff" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                </linearGradient>
            </defs>
            <rect width="48" height="48" rx="14" fill="url(#ct-bg)" />
            <rect width="48" height="48" rx="14" fill="url(#ct-shine)" />
            {/* Trophy cup */}
            <path d="M17 12H31V20C31 25 28 28 24 28C20 28 17 25 17 20V12Z" stroke="#fff" strokeWidth="2.5" fill="none" />
            {/* Handles */}
            <path d="M17 15H14C12.5 15 11 16.5 11 18.5C11 20.5 12.5 22 14 22H17" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M31 15H34C35.5 15 37 16.5 37 18.5C37 20.5 35.5 22 34 22H31" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" />
            {/* Base */}
            <path d="M24 28V32" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M19 32H29" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M18 35H30" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
            {/* Star */}
            <path d="M24 16L25 19L28 19L25.5 21L26.5 24L24 22L21.5 24L22.5 21L20 19L23 19Z" fill="#fef08a" fillOpacity="0.8" />
        </svg>
    );
}

/* ── 7. 자격증 — 인증서 + 체크마크 ── */
export function CertificationIcon({ size = 32, className, style }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} style={style}>
            <defs>
                <linearGradient id="ce-bg" x1="0" y1="0" x2="48" y2="48">
                    <stop offset="0%" stopColor="#2563eb" />
                    <stop offset="100%" stopColor="#d946ef" />
                </linearGradient>
                <linearGradient id="ce-shine" x1="0" y1="0" x2="48" y2="48">
                    <stop offset="0%" stopColor="#fff" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                </linearGradient>
            </defs>
            <rect width="48" height="48" rx="14" fill="url(#ce-bg)" />
            <rect width="48" height="48" rx="14" fill="url(#ce-shine)" />
            {/* Document */}
            <rect x="12" y="8" width="24" height="30" rx="3" stroke="#fff" strokeWidth="2.5" fill="none" />
            {/* Lines */}
            <path d="M17 16H31" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.5" />
            <path d="M17 21H27" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.5" />
            <path d="M17 26H24" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.5" />
            {/* Seal/badge */}
            <circle cx="32" cy="32" r="8" fill="#fff" fillOpacity="0.15" stroke="#fff" strokeWidth="2" />
            <path d="M28 32L31 35L37 29" stroke="#fef08a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

/* ── 8. 컴퓨터 기초 — 모니터 + 키보드 ── */
export function ComputerBasicsIcon({ size = 32, className, style }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} style={style}>
            <defs>
                <linearGradient id="cmb-bg" x1="0" y1="0" x2="48" y2="48">
                    <stop offset="0%" stopColor="#ec4899" />
                    <stop offset="100%" stopColor="#60a5fa" />
                </linearGradient>
                <linearGradient id="cmb-shine" x1="0" y1="0" x2="48" y2="48">
                    <stop offset="0%" stopColor="#fff" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                </linearGradient>
            </defs>
            <rect width="48" height="48" rx="14" fill="url(#cmb-bg)" />
            <rect width="48" height="48" rx="14" fill="url(#cmb-shine)" />
            {/* Monitor */}
            <rect x="10" y="10" width="28" height="20" rx="3" stroke="#fff" strokeWidth="2.5" fill="none" />
            <rect x="14" y="14" width="20" height="12" rx="1" fill="#fff" fillOpacity="0.15" />
            {/* Stand */}
            <path d="M24 30V34" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M18 34H30" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
            {/* Keyboard dots */}
            <path d="M16 37H32" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.5" />
            <path d="M18 39H30" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.5" />
        </svg>
    );
}

/* ── 코스 ID → 아이콘 매핑 ── */
const COURSE_ICON_MAP: Record<string, React.FC<IconProps>> = {
    "1": CodingBasicsIcon,
    "2": PhysicalComputingIcon,
    "3": PythonIcon,
    "4": CLangIcon,
    "5": GameMakerIcon,
    "6": ContestIcon,
    "7": CertificationIcon,
    "8": ComputerBasicsIcon,
};

/** 코스 ID로 아이콘 컴포넌트 가져오기 */
export function CourseIcon({ courseId, size = 32, className, style }: IconProps & { courseId: string }) {
    const Icon = COURSE_ICON_MAP[courseId] || CodingBasicsIcon;
    return <Icon size={size} className={className} style={style} />;
}

export default CourseIcon;
