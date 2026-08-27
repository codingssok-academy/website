"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ParentGrowthRecord } from "@/lib/parent-dashboard";
import { MonthlyAttendancePanel } from "@/features/growth-v2/attendance/MonthlyAttendancePanel";
import styles from "./student-growth.module.css";

type StudentGrowthResponse = {
    success: boolean;
    error?: string;
    student?: {
        name: string;
        school: string | null;
        grade: string | null;
        className: string | null;
    };
    growth?: {
        current: ParentGrowthRecord | null;
        history: ParentGrowthRecord[];
    };
};

function formatDate(value: string | null) {
    if (!value) return "날짜 없음";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "날짜 없음";
    return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric" }).format(date);
}

function GrowthItem({ icon, label, value, tone }: { icon: string; label: string; value: string | null; tone: string }) {
    return (
        <article className={styles.item} data-tone={tone}>
            <div className={styles.itemTitle}>
                <span className="material-symbols-outlined">{icon}</span>
                <h2>{label}</h2>
            </div>
            <p>{value || "선생님이 내용을 준비하고 있어요."}</p>
        </article>
    );
}

export default function StudentGrowthPage() {
    const [data, setData] = useState<StudentGrowthResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const controller = new AbortController();
        let active = true;

        fetch("/api/student/growth", { signal: controller.signal, cache: "no-store" })
            .then(async response => {
                const body = await response.json() as StudentGrowthResponse;
                if (!response.ok) throw new Error(body.error || "성장 기록을 불러오지 못했습니다.");
                if (active) setData(body);
            })
            .catch(error => {
                if (active && (error as { name?: string }).name !== "AbortError") {
                    setData({ success: false, error: error instanceof Error ? error.message : "성장 기록을 불러오지 못했습니다." });
                }
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
            controller.abort();
        };
    }, []);

    const current = data?.growth?.current || null;
    const profileLine = [data?.student?.school, data?.student?.grade, data?.student?.className].filter(Boolean).join(" · ");

    return (
        <main className={styles.page}>
            <header className={styles.header}>
                <Link href="/dashboard/learning" aria-label="학습 홈으로 돌아가기">
                    <span className="material-symbols-outlined">arrow_back</span>
                </Link>
                <div>
                    <p>Growth 2.0</p>
                    <h1>나의 성장 기록</h1>
                </div>
            </header>

            {loading ? (
                <section className={styles.state} aria-label="성장 기록 불러오는 중">
                    <span className="material-symbols-outlined">progress_activity</span>
                    <strong>성장 기록을 불러오고 있어요.</strong>
                </section>
            ) : !data?.success ? (
                <section className={styles.state} data-error="true">
                    <span className="material-symbols-outlined">link_off</span>
                    <strong>{data?.error || "성장 기록을 불러오지 못했습니다."}</strong>
                    <p>선생님께 학생 계정 연결 상태를 확인해달라고 말씀해주세요.</p>
                </section>
            ) : (
                <>
                    <section className={styles.studentSummary}>
                        <div className={styles.avatar}>{data.student?.name.slice(0, 1)}</div>
                        <div>
                            <p>선생님이 완료하여 공개한 기록</p>
                            <h2>{data.student?.name} 학생</h2>
                            <span>{profileLine || "학습 정보를 확인하고 있어요."}</span>
                        </div>
                    </section>

                    {current ? (
                        <>
                            <div className={styles.recordMeta}>
                                <strong>최근 성장 기록</strong>
                                <time>{formatDate(current.recordedAt)}</time>
                            </div>
                            <section className={styles.grid} aria-label="최근 성장 기록 내용">
                                <GrowthItem icon="menu_book" label="이번 수업에서 배운 내용" value={current.classProgress} tone="blue" />
                                <GrowthItem icon="auto_awesome" label="잘하고 있는 점" value={current.strengths} tone="green" />
                                <GrowthItem icon="flag" label="다음 목표" value={current.currentGoal} tone="violet" />
                                <GrowthItem icon="forum" label="선생님 이야기" value={current.parentFeedback} tone="amber" />
                            </section>
                        </>
                    ) : (
                        <section className={styles.state}>
                            <span className="material-symbols-outlined">hourglass_top</span>
                            <strong>공개된 성장 기록이 아직 없어요.</strong>
                            <p>선생님이 기록을 완료하면 이 화면과 학부모 현황판에 함께 표시됩니다.</p>
                        </section>
                    )}

                    {(data.growth?.history.length || 0) > 0 && (
                        <section className={styles.history} aria-label="지난 성장 기록">
                            <h2>지난 성장 기록</h2>
                            {data.growth?.history.map(record => (
                                <details key={record.id}>
                                    <summary>
                                        <strong>{record.currentClass || "성장 기록"}</strong>
                                        <span>{formatDate(record.recordedAt)}</span>
                                    </summary>
                                    <p>{record.classProgress || record.currentGoal || "기록된 내용을 확인하고 있어요."}</p>
                                </details>
                            ))}
                        </section>
                    )}

                    <MonthlyAttendancePanel source="student" />
                </>
            )}

            <p className={styles.notice}>작성 중인 기록과 선생님 내부 메모는 학생에게 표시되지 않습니다.</p>
        </main>
    );
}
