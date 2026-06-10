"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Maximize2, ShieldCheck, Terminal } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const bookshelfCourses = [
    { title: "어린이 IT", image: "/images/courses/kids-it.png", href: "/dashboard/learning/courses/11" },
    { title: "정보올림피아드 대회", image: "/images/courses/koi.png", href: "/dashboard/learning/courses/12" },
    { title: "사고력 수학", image: "/images/courses/math-thinking.png", href: "/dashboard/learning/courses/9" },
    { title: "컴퓨터 기초", image: "/images/courses/computer-basics.png", href: "/dashboard/learning/courses/8" },
    { title: "코딩기초", image: "/images/courses/coding-basics.png", href: "/dashboard/learning/courses/1" },
    { title: "피지컬컴퓨팅", image: "/images/courses/physical-computing.png", href: "/dashboard/learning/courses/2" },
    { title: "Python", image: "/images/courses/python.png", href: "/dashboard/learning/courses/3" },
    { title: "ai강의", image: "/images/courses/ai-class.png", href: "/dashboard/learning/courses/10" },
    { title: "C++", image: "/images/courses/cpp.png", href: "/dashboard/learning/courses/4" },
    { title: "게임 제작", image: "/images/courses/programming-contest.png", href: "/dashboard/learning/courses/6" },
];

function toggleFullscreen() {
    if (typeof document === "undefined") return;

    if (document.fullscreenElement) {
        void document.exitFullscreen();
        return;
    }

    void document.documentElement.requestFullscreen().catch(() => undefined);
}

export default function CoursesPage() {
    const router = useRouter();
    const { user, signOut } = useAuth();
    const userName = user?.name || "구자현";

    return (
        <main className="learning-bookshelf" aria-label="코딩쏙 학습 플랫폼 코스와 교재">
            <style>{`
                .learning-bookshelf {
                    min-height: 100vh;
                    background: linear-gradient(180deg, #eef5ff 0%, #f8fbff 48%, #eaf3ff 100%);
                    color: #0f172a;
                    font-family: "Plus Jakarta Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                    overflow-x: hidden;
                    letter-spacing: 0;
                }

                .bookshelf-topbar {
                    height: 70px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 16px;
                    padding: 14px clamp(12px, 2.8vw, 34px);
                }

                .bookshelf-logo {
                    width: clamp(72px, 5.2vw, 98px);
                    height: auto;
                    display: block;
                    object-fit: contain;
                }

                .bookshelf-actions {
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    gap: 8px;
                    min-width: 0;
                }

                .bookshelf-user,
                .bookshelf-admin,
                .bookshelf-icon-button,
                .bookshelf-exit {
                    height: 38px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    border: 1px solid rgba(148, 163, 184, 0.28);
                    border-radius: 8px;
                    background: rgba(255, 255, 255, 0.86);
                    box-shadow: 0 8px 22px rgba(15, 23, 42, 0.07);
                    color: #1f2937;
                    font-size: 14px;
                    font-weight: 900;
                    line-height: 1;
                    letter-spacing: 0;
                    white-space: nowrap;
                }

                .bookshelf-user {
                    padding: 0 12px;
                }

                .bookshelf-user-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #10b981;
                    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.12);
                }

                .bookshelf-admin {
                    padding: 0 12px;
                    border-color: rgba(255, 112, 89, 0.42);
                    background: #ff674f;
                    color: #ffffff;
                }

                .bookshelf-icon-button,
                .bookshelf-exit {
                    cursor: pointer;
                    transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease;
                }

                .bookshelf-icon-button {
                    width: 38px;
                    padding: 0;
                }

                .bookshelf-exit {
                    padding: 0 12px;
                }

                .bookshelf-icon-button:hover,
                .bookshelf-exit:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 12px 26px rgba(15, 23, 42, 0.12);
                    background: #ffffff;
                }

                .bookshelf-stage {
                    width: 100%;
                    min-height: calc(100vh - 70px);
                    display: grid;
                    grid-template-columns: repeat(5, minmax(142px, 1fr));
                    align-items: end;
                    gap: clamp(34px, 4.2vw, 58px) clamp(42px, 5vw, 92px);
                    padding: clamp(4px, 1.4vw, 18px) clamp(24px, 5.4vw, 86px) 54px;
                }

                .book-link {
                    min-width: 0;
                    height: clamp(238px, 31vw, 338px);
                    display: flex;
                    align-items: flex-end;
                    justify-content: center;
                    border-radius: 8px;
                    outline-offset: 8px;
                    text-decoration: none;
                    transform: translateZ(0);
                }

                .book-visual {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: flex-end;
                    justify-content: center;
                    filter: drop-shadow(0 24px 18px rgba(37, 99, 235, 0.13));
                    transition: transform 190ms ease, filter 190ms ease;
                }

                .book-cover {
                    width: 100%;
                    height: 100%;
                    display: block;
                    object-fit: contain;
                    user-select: none;
                    -webkit-user-drag: none;
                }

                .book-link:hover .book-visual {
                    transform: translateY(-8px) scale(1.018);
                    filter: drop-shadow(0 30px 22px rgba(37, 99, 235, 0.18));
                }

                .book-link:focus-visible {
                    outline: 3px solid #2563eb;
                }

                @media (max-width: 1440px) {
                    .bookshelf-stage {
                        gap: 30px 54px;
                        padding-left: 44px;
                        padding-right: 44px;
                    }

                    .book-link {
                        height: clamp(214px, 27vw, 302px);
                    }
                }

                @media (max-width: 1120px) {
                    .bookshelf-stage {
                        grid-template-columns: repeat(4, minmax(140px, 1fr));
                    }
                }

                @media (max-width: 820px) {
                    .bookshelf-topbar {
                        height: auto;
                        min-height: 68px;
                        align-items: flex-start;
                    }

                    .bookshelf-actions {
                        flex-wrap: wrap;
                    }

                    .bookshelf-stage {
                        min-height: auto;
                        grid-template-columns: repeat(2, minmax(132px, 1fr));
                        gap: 28px 24px;
                        padding: 18px 18px 42px;
                    }

                    .book-link {
                        height: clamp(210px, 58vw, 288px);
                    }
                }

                @media (max-width: 480px) {
                    .bookshelf-user,
                    .bookshelf-admin {
                        max-width: 104px;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }

                    .bookshelf-exit span {
                        display: none;
                    }
                }
            `}</style>

            <header className="bookshelf-topbar">
                <img className="bookshelf-logo" src="/images/logo-codingssok.png" alt="코딩쏙" />
                <div className="bookshelf-actions" aria-label="학습 플랫폼 도구">
                    <span className="bookshelf-user">
                        <span className="bookshelf-user-dot" aria-hidden="true" />
                        {userName}
                    </span>
                    <span className="bookshelf-admin">
                        <ShieldCheck size={16} strokeWidth={2.4} aria-hidden="true" />
                        관리자
                    </span>
                    <button
                        className="bookshelf-icon-button"
                        type="button"
                        onClick={() => router.push("/dashboard/learning/codegolf")}
                        title="C-Studio"
                        aria-label="C-Studio"
                    >
                        <Terminal size={18} strokeWidth={2.5} aria-hidden="true" />
                    </button>
                    <button
                        className="bookshelf-icon-button"
                        type="button"
                        onClick={toggleFullscreen}
                        title="전체 화면"
                        aria-label="전체 화면"
                    >
                        <Maximize2 size={18} strokeWidth={2.5} aria-hidden="true" />
                    </button>
                    <button className="bookshelf-exit" type="button" onClick={signOut}>
                        <LogOut size={17} strokeWidth={2.5} aria-hidden="true" />
                        <span>나가기</span>
                    </button>
                </div>
            </header>

            <section className="bookshelf-stage" aria-label="교재 목록">
                {bookshelfCourses.map((course) => (
                    <Link key={course.href} className="book-link" href={course.href} aria-label={`${course.title} 교재 보기`}>
                        <span className="book-visual">
                            <img className="book-cover" src={course.image} alt={`${course.title} 교재 표지`} draggable={false} />
                        </span>
                    </Link>
                ))}
            </section>
        </main>
    );
}
