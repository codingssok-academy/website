"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { COURSES } from "@/data/courses";

function QuickCard({
    icon,
    label,
    sub,
    href,
    color,
}: {
    icon: string;
    label: string;
    sub: string;
    href: string;
    color: string;
}) {
    return (
        <Link href={href} className="quick-card">
            <span className="material-symbols-outlined" style={{ color }}>{icon}</span>
            <strong>{label}</strong>
            <small>{sub}</small>
        </Link>
    );
}

export default function StudentHomeScreen() {
    const { user } = useAuth();
    const visibleCourses = COURSES.slice(0, 10);

    return (
        <main className="student-home">
            <header className="topbar">
                <img src="/images/promo/logo-codingssok.png" alt="코딩쏙" />
                <div>
                    <span>학습 플랫폼</span>
                    <strong>{user?.name || "학생"}</strong>
                </div>
            </header>

            <section className="hero-card">
                <p className="eyebrow">Student workspace</p>
                <h1>오늘 수업 자료와 결과물을 한 곳에서 관리합니다.</h1>
                <p>코스 학습, 코드 실행, 파일 보관함을 바로 열 수 있습니다.</p>
            </section>

            <section className="quick-grid" aria-label="빠른 메뉴">
                <QuickCard icon="folder_open" label="내 파일함" sub="결과물 저장" href="/dashboard/learning/files" color="#4f46e5" />
                <QuickCard icon="menu_book" label="코스 보기" sub="교재와 문제" href="/dashboard/learning/courses" color="#2563eb" />
                <QuickCard icon="terminal" label="코드 실행" sub="C-Studio" href="/dashboard/compiler" color="#0f172a" />
                <QuickCard icon="emoji_events" label="문제 풀이" sub="알고리즘 카드" href="/dashboard/learning/courses/12" color="#ca8a04" />
            </section>

            <section className="course-section" aria-label="코스 목록">
                <div className="section-title">
                    <h2>코스</h2>
                    <Link href="/dashboard/learning/courses">전체 보기</Link>
                </div>
                <div className="course-list">
                    {visibleCourses.map(course => (
                        <Link key={course.id} href={`/dashboard/learning/courses/${course.id}`} className="course-row">
                            <div>
                                <strong>{course.title}</strong>
                                <small>{course.description}</small>
                            </div>
                            <span className="material-symbols-outlined">chevron_right</span>
                        </Link>
                    ))}
                </div>
            </section>

            <style>{`
                .student-home { min-height: 100vh; padding: 18px; background: #f5f7fb; color: #0f172a; font-family: Pretendard, system-ui, sans-serif; }
                .topbar { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
                .topbar img { width: 42px; height: 42px; object-fit: contain; border-radius: 12px; background: #fff; box-shadow: 0 8px 24px rgba(15,23,42,.08); }
                .topbar span { display: block; color: #64748b; font-size: 12px; font-weight: 800; }
                .topbar strong { display: block; font-size: 20px; font-weight: 900; letter-spacing: -0.03em; }
                .hero-card { padding: 24px; border-radius: 24px; background: linear-gradient(135deg, #0f172a, #1d4ed8); color: #fff; box-shadow: 0 20px 50px rgba(37,99,235,.24); margin-bottom: 14px; }
                .hero-card .eyebrow { margin: 0 0 10px; color: #bfdbfe; text-transform: uppercase; letter-spacing: .14em; font-size: 11px; font-weight: 900; }
                .hero-card h1 { margin: 0; font-size: 25px; line-height: 1.22; letter-spacing: -0.04em; }
                .hero-card p:last-child { margin: 12px 0 0; color: rgba(255,255,255,.74); font-size: 13px; font-weight: 700; line-height: 1.6; }
                .quick-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; }
                .quick-card { min-height: 118px; padding: 16px; border-radius: 18px; background: #fff; border: 1px solid #dbe4f2; text-decoration: none; color: #0f172a; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 12px 30px rgba(15,23,42,.06); }
                .quick-card .material-symbols-outlined { font-size: 26px; }
                .quick-card strong { font-size: 16px; font-weight: 900; letter-spacing: -0.02em; }
                .quick-card small { color: #64748b; font-size: 12px; font-weight: 700; }
                .course-section { background: #fff; border: 1px solid #dbe4f2; border-radius: 22px; padding: 16px; box-shadow: 0 12px 30px rgba(15,23,42,.05); }
                .section-title { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
                .section-title h2 { margin: 0; font-size: 18px; letter-spacing: -0.03em; }
                .section-title a { color: #2563eb; text-decoration: none; font-size: 13px; font-weight: 900; }
                .course-list { display: flex; flex-direction: column; gap: 8px; }
                .course-row { display: flex; justify-content: space-between; gap: 12px; align-items: center; padding: 14px; border-radius: 15px; background: #f8fafc; text-decoration: none; color: #0f172a; }
                .course-row strong { display: block; font-size: 15px; font-weight: 900; }
                .course-row small { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-top: 4px; color: #64748b; font-size: 12px; font-weight: 700; line-height: 1.45; }
                .course-row .material-symbols-outlined { color: #94a3b8; }
            `}</style>
        </main>
    );
}
