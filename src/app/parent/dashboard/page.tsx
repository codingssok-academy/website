"use client";

import Link from "next/link";
import { useState } from "react";
import { useParentDashboard } from "../hooks/useParentDashboard";

const ATTENDANCE_LABEL = {
    scheduled: "예정",
    present: "출석",
    absent: "결석",
    makeup: "보강 완료",
} as const;

function formatDate(value?: string | null) {
    if (!value) return "기록 없음";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "기록 없음";
    return new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric" }).format(date);
}

function activityLabel(activity: {
    course_title?: string | null;
    unit_title?: string | null;
    page_title?: string | null;
}) {
    return activity.page_title || activity.unit_title || activity.course_title || "학습 활동";
}

export default function ParentDashboardPage() {
    const { data, loading, name, refresh } = useParentDashboard();
    const [refreshing, setRefreshing] = useState(false);

    const handleRefresh = async () => {
        if (refreshing) return;
        setRefreshing(true);
        try {
            await refresh();
        } finally {
            setRefreshing(false);
        }
    };

    if (loading && !data) {
        return (
            <div className="mx-auto max-w-[520px] px-4 py-6" aria-label="학부모 통합 현황 불러오는 중">
                <div className="h-28 animate-pulse rounded-3xl bg-slate-200" />
                <div className="mt-4 grid grid-cols-3 gap-2">
                    {[0, 1, 2].map(item => <div key={item} className="h-24 animate-pulse rounded-2xl bg-slate-200" />)}
                </div>
                <div className="mt-4 h-56 animate-pulse rounded-3xl bg-slate-200" />
            </div>
        );
    }

    if (!data?.found || !data.student) {
        return (
            <div className="mx-auto max-w-[520px] px-4 py-10 text-center">
                <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                    <span className="material-symbols-outlined text-5xl text-slate-300">person_search</span>
                    <h1 className="mt-3 text-lg font-black text-slate-900">자녀의 학습 정보를 찾지 못했습니다.</h1>
                    <p className="mt-2 text-sm leading-6 text-slate-500">학원에서 받은 학생 이름과 학부모 인증번호를 다시 확인해주세요.</p>
                </div>
            </div>
        );
    }

    const { student, growth, attendance, announcements, activity } = data;
    const currentGrowth = growth?.current || null;
    const recentActivities = activity.recent.slice(0, 4);
    const recentAnnouncements = announcements.slice(0, 3);

    return (
        <div className="mx-auto max-w-[520px] px-4 pb-5 pt-5 text-slate-900">
            <header className="mb-5 flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-bold text-blue-600">통합 학습 현황</p>
                    <h1 className="mt-1 text-2xl font-black tracking-tight">{name || student.name} 학생의 오늘</h1>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                        {[student.school, student.grade, student.currentClass].filter(Boolean).join(" · ") || "학습 정보를 확인하고 있어요"}
                    </p>
                </div>
                <button
                    type="button"
                    aria-label="통합 현황 새로고침"
                    onClick={() => void handleRefresh()}
                    disabled={refreshing}
                    className="flex min-h-11 min-w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm disabled:opacity-50"
                >
                    <span className={`material-symbols-outlined text-xl ${refreshing ? "animate-spin" : ""}`}>refresh</span>
                </button>
            </header>

            <section className="rounded-[26px] bg-gradient-to-br from-blue-600 to-indigo-700 p-5 text-white shadow-[0_18px_45px_rgba(37,99,235,0.25)]" aria-label="학습 요약">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-bold text-blue-100">현재 수업</p>
                        <h2 className="mt-1 text-xl font-black">{student.currentClass || "수업 반 확인 중"}</h2>
                    </div>
                    <div className="rounded-2xl bg-white/15 px-3 py-2 text-right backdrop-blur-sm">
                        <p className="text-[10px] font-bold text-blue-100">최근 학습일</p>
                        <strong className="text-sm">{formatDate(student.lastActive)}</strong>
                    </div>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2">
                    <SummaryStat value={`Lv.${student.level}`} label="학습 레벨" />
                    <SummaryStat value={`${activity.todayMinutes}분`} label="오늘 학습" />
                    <SummaryStat value={`${student.totalProblems}개`} label="푼 문제" />
                </div>
            </section>

            <DashboardSection icon="trending_up" title="Growth 2.0" subtitle="선생님이 완료하여 공개한 최신 성장 기록">
                {currentGrowth ? (
                    <div className="space-y-3">
                        <InfoBlock label="이번 수업에서 배운 내용" value={currentGrowth.classProgress} />
                        <InfoBlock label="잘하고 있는 점" value={currentGrowth.strengths} tone="green" />
                        <InfoBlock label="다음 수업 목표" value={currentGrowth.currentGoal} tone="blue" />
                        {currentGrowth.parentFeedback && <InfoBlock label="선생님 이야기" value={currentGrowth.parentFeedback} tone="amber" />}
                        <p className="text-right text-[11px] font-semibold text-slate-400">최근 기록 {formatDate(currentGrowth.recordedAt)}</p>
                    </div>
                ) : (
                    <EmptyState icon="lock_clock" text="선생님이 완료한 성장 기록이 아직 없습니다." />
                )}
            </DashboardSection>

            <DashboardSection icon="calendar_month" title="이번 달 출석" subtitle="월 수강 기준 출석·결석·보강 현황">
                {attendance ? (
                    <>
                        <div className="grid grid-cols-3 gap-2">
                            <MiniStat value={attendance.summary.present} label="출석" color="text-emerald-600" />
                            <MiniStat value={attendance.summary.absent} label="결석" color="text-rose-600" />
                            <MiniStat value={attendance.summary.makeup} label="보강" color="text-amber-600" />
                        </div>
                        {attendance.records.length > 0 ? (
                            <div className="mt-3 divide-y divide-slate-100">
                                {attendance.records.slice(-4).reverse().map(record => (
                                    <div key={record.id} className="flex items-center gap-3 py-3 text-sm">
                                        <span className="min-w-14 font-bold text-slate-500">{formatDate(record.classDate)}</span>
                                        <span className="min-w-0 flex-1 truncate font-bold text-slate-700">{record.lessonTitle}</span>
                                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-600">{ATTENDANCE_LABEL[record.status]}</span>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="mt-3 text-center text-xs font-semibold text-slate-400">이 달에 등록된 출석 기록이 없습니다.</p>}
                    </>
                ) : (
                    <EmptyState icon="event_busy" text="출석 기록이 연결되면 월별 현황이 여기에 표시됩니다." />
                )}
            </DashboardSection>

            <DashboardSection icon="campaign" title="선생님 메시지" subtitle="학원에서 전달한 최신 안내">
                {recentAnnouncements.length > 0 ? (
                    <div className="space-y-2">
                        {recentAnnouncements.map(message => (
                            <article key={message.id} className="rounded-2xl bg-slate-50 p-4">
                                <div className="flex items-center gap-2">
                                    {message.isPinned && <span className="material-symbols-outlined text-base text-amber-500">push_pin</span>}
                                    <h3 className="min-w-0 flex-1 truncate text-sm font-black text-slate-800">{message.title}</h3>
                                    <time className="text-[10px] font-bold text-slate-400">{formatDate(message.createdAt)}</time>
                                </div>
                                <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-600">{message.content}</p>
                            </article>
                        ))}
                    </div>
                ) : (
                    <EmptyState icon="notifications_none" text="새로운 선생님 메시지가 없습니다." />
                )}
            </DashboardSection>

            <DashboardSection icon="history" title="최근 학습 활동" subtitle="홈페이지에서 확인된 최근 학습 기록">
                {recentActivities.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                        {recentActivities.map((item, index) => (
                            <div key={`${item.created_at || "activity"}-${index}`} className="flex items-center gap-3 py-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                    <span className="material-symbols-outlined text-lg">code</span>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-black text-slate-700">{activityLabel(item)}</p>
                                    <p className="mt-0.5 text-[11px] font-semibold text-slate-400">{formatDate(item.created_at)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <EmptyState icon="hourglass_empty" text="최근 홈페이지 학습 활동이 아직 없습니다." />
                )}
            </DashboardSection>

            <Link
                href="/parent/feedback"
                className="mt-4 flex min-h-14 items-center justify-between rounded-2xl bg-slate-900 px-5 text-sm font-black text-white no-underline shadow-lg"
            >
                <span>자세한 수업 피드백 보기</span>
                <span className="material-symbols-outlined">arrow_forward</span>
            </Link>

            <p className="px-3 pb-2 pt-5 text-center text-[11px] font-semibold leading-5 text-slate-400">
                작성 중인 평가와 선생님 내부 메모는 표시되지 않습니다.<br />완료하여 공개한 기록만 보여드립니다.
            </p>
        </div>
    );
}

function SummaryStat({ value, label }: { value: string; label: string }) {
    return (
        <div className="rounded-2xl bg-white/12 px-2 py-3 text-center backdrop-blur-sm">
            <strong className="block text-lg font-black">{value}</strong>
            <span className="mt-0.5 block text-[10px] font-bold text-blue-100">{label}</span>
        </div>
    );
}

function DashboardSection({ icon, title, subtitle, children }: { icon: string; title: string; subtitle: string; children: React.ReactNode }) {
    return (
        <section className="mt-4 rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.05)]">
            <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <span className="material-symbols-outlined text-xl">{icon}</span>
                </div>
                <div className="min-w-0">
                    <h2 className="text-base font-black text-slate-900">{title}</h2>
                    <p className="mt-0.5 text-[11px] font-semibold text-slate-400">{subtitle}</p>
                </div>
            </div>
            {children}
        </section>
    );
}

function InfoBlock({ label, value, tone = "slate" }: { label: string; value: string | null; tone?: "slate" | "green" | "blue" | "amber" }) {
    const tones = {
        slate: "border-slate-100 bg-slate-50",
        green: "border-emerald-100 bg-emerald-50",
        blue: "border-blue-100 bg-blue-50",
        amber: "border-amber-100 bg-amber-50",
    };
    return (
        <div className={`rounded-2xl border p-4 ${tones[tone]}`}>
            <p className="text-[11px] font-black text-slate-500">{label}</p>
            <p className="mt-1.5 whitespace-pre-wrap text-sm font-bold leading-6 text-slate-800">{value || "아직 작성된 내용이 없습니다."}</p>
        </div>
    );
}

function MiniStat({ value, label, color }: { value: number; label: string; color: string }) {
    return (
        <div className="rounded-2xl bg-slate-50 px-2 py-3 text-center">
            <strong className={`block text-xl font-black ${color}`}>{value}회</strong>
            <span className="mt-0.5 block text-[10px] font-bold text-slate-500">{label}</span>
        </div>
    );
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
    return (
        <div className="rounded-2xl bg-slate-50 px-4 py-7 text-center">
            <span className="material-symbols-outlined text-3xl text-slate-300">{icon}</span>
            <p className="mt-2 text-xs font-bold leading-5 text-slate-500">{text}</p>
        </div>
    );
}
