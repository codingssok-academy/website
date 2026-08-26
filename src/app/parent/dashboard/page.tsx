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

const SECTION_TONE = {
    blue: "bg-blue-50 text-blue-600",
    violet: "bg-violet-50 text-violet-600",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
} as const;

function formatDate(value?: string | null) {
    if (!value) return "기록 없음";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "기록 없음";
    return new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric" }).format(date);
}

function formatMonth(value?: string | null) {
    if (!value || !/^\d{4}-\d{2}$/.test(value)) return "이번 달 출석";
    const [year, month] = value.split("-");
    return `${year}년 ${Number(month)}월 출석`;
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
            <div className="mx-auto max-w-[1180px] px-4 py-6 sm:px-6" aria-label="학부모 통합 현황 불러오는 중">
                <div className="h-36 animate-pulse rounded-[28px] bg-slate-200" />
                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    {[0, 1, 2, 3].map(item => <div key={item} className="h-64 animate-pulse rounded-[26px] bg-slate-200" />)}
                </div>
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
    const displayName = name || student.name;
    const profileLine = [student.school, student.grade, student.currentClass].filter(Boolean).join(" · ");

    return (
        <div
            aria-label="학부모 통합 현황판"
            className="relative mx-auto max-w-[1180px] overflow-hidden px-4 pb-7 pt-5 text-slate-900 sm:px-6 sm:pt-7 lg:px-8"
        >
            <div className="pointer-events-none absolute -right-24 top-28 h-64 w-64 rounded-full bg-blue-100/50 blur-3xl" />
            <div className="pointer-events-none absolute -left-24 top-[520px] h-56 w-56 rounded-full bg-violet-100/40 blur-3xl" />

            <header className="relative mb-5 flex items-center justify-between gap-3 sm:mb-6">
                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-lg font-black text-white shadow-[0_10px_25px_rgba(37,99,235,0.28)] sm:h-14 sm:w-14 sm:text-xl">
                        {displayName.slice(0, 1)}
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <p className="text-xs font-black uppercase tracking-[0.12em] text-blue-600">Growth Report</p>
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-600">안전 공개</span>
                        </div>
                        <h1 className="mt-1 truncate text-xl font-black tracking-tight sm:text-2xl lg:text-3xl">{displayName} 학생의 성장 현황</h1>
                        <p className="mt-1 truncate text-xs font-semibold text-slate-500 sm:text-sm">
                            {profileLine || "학습 정보를 확인하고 있어요"}
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    aria-label="통합 현황 새로고침"
                    onClick={() => void handleRefresh()}
                    disabled={refreshing}
                    className="flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-slate-500 shadow-sm transition hover:border-blue-200 hover:text-blue-600 disabled:opacity-50 sm:px-4"
                >
                    <span className={`material-symbols-outlined text-xl ${refreshing ? "animate-spin" : ""}`}>refresh</span>
                    <span className="hidden text-xs font-black sm:inline">새로고침</span>
                </button>
            </header>

            <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#2563eb] via-[#3156d9] to-[#4338ca] p-5 text-white shadow-[0_22px_55px_rgba(37,99,235,0.28)] sm:p-7" aria-label="학습 요약">
                <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full border-[34px] border-white/10" />
                <div className="absolute -bottom-28 left-1/3 h-48 w-48 rounded-full bg-white/5" />
                <div className="relative grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(340px,0.85fr)] md:items-end">
                    <div>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-black text-blue-50 backdrop-blur-sm">
                            <span className="material-symbols-outlined text-[15px]">school</span>
                            현재 수업
                        </span>
                        <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">{student.currentClass || "수업 반 확인 중"}</h2>
                        <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-blue-100 sm:text-sm">
                            <span className="material-symbols-outlined text-base">schedule</span>
                            최근 학습일 {formatDate(student.lastActive)}
                        </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2.5">
                        <SummaryStat icon="workspace_premium" value={`Lv.${student.level}`} label="학습 레벨" />
                        <SummaryStat icon="timer" value={`${activity.todayMinutes}분`} label="오늘 학습" />
                        <SummaryStat icon="task_alt" value={`${student.totalProblems}개`} label="푼 문제" />
                    </div>
                </div>
            </section>

            <div aria-label="학습 세부 현황" className="relative mt-5 grid gap-4 lg:grid-cols-12 lg:gap-5">
                <DashboardSection className="lg:col-span-7" icon="trending_up" title="Growth 2.0" subtitle="선생님이 완료하여 공개한 최신 성장 기록" tone="blue">
                    {currentGrowth ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                            <InfoBlock icon="menu_book" label="이번 수업에서 배운 내용" value={currentGrowth.classProgress} />
                            <InfoBlock icon="auto_awesome" label="잘하고 있는 점" value={currentGrowth.strengths} tone="green" />
                            <InfoBlock icon="flag" label="다음 수업 목표" value={currentGrowth.currentGoal} tone="blue" />
                            {currentGrowth.parentFeedback && <InfoBlock icon="forum" label="선생님 이야기" value={currentGrowth.parentFeedback} tone="amber" />}
                            <p className="text-right text-[11px] font-semibold text-slate-400 sm:col-span-2">최근 기록 {formatDate(currentGrowth.recordedAt)}</p>
                        </div>
                    ) : (
                        <EmptyState icon="lock_clock" text="선생님이 완료한 성장 기록이 아직 없습니다." />
                    )}
                </DashboardSection>

                <DashboardSection className="lg:col-span-5" icon="calendar_month" title={formatMonth(attendance?.month)} subtitle="월 수강 기준 출석·결석·보강 현황" tone="violet">
                    {attendance ? (
                        <>
                            <div className="grid grid-cols-3 gap-2">
                                <MiniStat icon="check_circle" value={attendance.summary.present} label="출석" color="text-emerald-600" bg="bg-emerald-50" />
                                <MiniStat icon="cancel" value={attendance.summary.absent} label="결석" color="text-rose-600" bg="bg-rose-50" />
                                <MiniStat icon="event_repeat" value={attendance.summary.makeup} label="보강" color="text-amber-600" bg="bg-amber-50" />
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

                <DashboardSection className="lg:col-span-7" icon="campaign" title="선생님 메시지" subtitle="학원에서 전달한 최신 안내" tone="amber">
                    {recentAnnouncements.length > 0 ? (
                        <div className="grid gap-2 sm:grid-cols-2">
                            {recentAnnouncements.map(message => (
                                <article key={message.id} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 transition hover:border-blue-100 hover:bg-blue-50/40">
                                    <div className="flex items-center gap-2">
                                        {message.isPinned && <span className="material-symbols-outlined text-base text-amber-500">push_pin</span>}
                                        <h3 className="min-w-0 flex-1 truncate text-sm font-black text-slate-800">{message.title}</h3>
                                        <time className="text-[10px] font-bold text-slate-400">{formatDate(message.createdAt)}</time>
                                    </div>
                                    <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-xs leading-5 text-slate-600">{message.content}</p>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <EmptyState icon="notifications_none" text="새로운 선생님 메시지가 없습니다." />
                    )}
                </DashboardSection>

                <DashboardSection className="lg:col-span-5" icon="history" title="최근 학습 활동" subtitle="홈페이지에서 확인된 최근 학습 기록" tone="emerald">
                    {recentActivities.length > 0 ? (
                        <div className="divide-y divide-slate-100">
                            {recentActivities.map((item, index) => (
                                <div key={`${item.created_at || "activity"}-${index}`} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                        <span className="material-symbols-outlined text-lg">code</span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-black text-slate-700">{activityLabel(item)}</p>
                                        <p className="mt-0.5 text-[11px] font-semibold text-slate-400">{formatDate(item.created_at)}</p>
                                    </div>
                                    <span className="material-symbols-outlined text-lg text-slate-300">chevron_right</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState icon="hourglass_empty" text="최근 홈페이지 학습 활동이 아직 없습니다." />
                    )}
                </DashboardSection>
            </div>

            <Link
                href="/parent/feedback"
                className="relative mt-5 flex min-h-16 items-center justify-between overflow-hidden rounded-[22px] bg-slate-900 px-5 text-sm font-black text-white no-underline shadow-[0_14px_32px_rgba(15,23,42,0.2)] transition hover:-translate-y-0.5 hover:bg-slate-800 sm:px-6"
            >
                <span className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                        <span className="material-symbols-outlined text-xl">description</span>
                    </span>
                    자세한 수업 피드백 보기
                </span>
                <span className="material-symbols-outlined">arrow_forward</span>
            </Link>

            <p className="relative px-3 pb-2 pt-5 text-center text-[11px] font-semibold leading-5 text-slate-400">
                작성 중인 평가와 선생님 내부 메모는 표시되지 않습니다.<br className="sm:hidden" /> 완료하여 공개한 기록만 보여드립니다.
            </p>
        </div>
    );
}

function SummaryStat({ icon, value, label }: { icon: string; value: string; label: string }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/12 px-2 py-3 text-center backdrop-blur-sm sm:py-4">
            <span className="material-symbols-outlined text-lg text-blue-100">{icon}</span>
            <strong className="mt-0.5 block text-base font-black sm:text-lg">{value}</strong>
            <span className="mt-0.5 block text-[10px] font-bold text-blue-100">{label}</span>
        </div>
    );
}

function DashboardSection({
    icon,
    title,
    subtitle,
    children,
    tone,
    className = "",
}: {
    icon: string;
    title: string;
    subtitle: string;
    children: React.ReactNode;
    tone: keyof typeof SECTION_TONE;
    className?: string;
}) {
    return (
        <section className={`rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.055)] sm:p-6 ${className}`}>
            <div className="mb-4 flex items-center gap-3">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${SECTION_TONE[tone]}`}>
                    <span className="material-symbols-outlined text-xl">{icon}</span>
                </div>
                <div className="min-w-0">
                    <h2 className="text-base font-black text-slate-900 sm:text-lg">{title}</h2>
                    <p className="mt-0.5 text-[11px] font-semibold text-slate-400">{subtitle}</p>
                </div>
            </div>
            {children}
        </section>
    );
}

function InfoBlock({
    icon,
    label,
    value,
    tone = "slate",
}: {
    icon: string;
    label: string;
    value: string | null;
    tone?: "slate" | "green" | "blue" | "amber";
}) {
    const tones = {
        slate: "border-slate-100 bg-slate-50 text-slate-500",
        green: "border-emerald-100 bg-emerald-50 text-emerald-600",
        blue: "border-blue-100 bg-blue-50 text-blue-600",
        amber: "border-amber-100 bg-amber-50 text-amber-600",
    };
    return (
        <div className={`rounded-2xl border p-4 ${tones[tone]}`}>
            <p className="flex items-center gap-1.5 text-[11px] font-black">
                <span className="material-symbols-outlined text-base">{icon}</span>
                {label}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm font-bold leading-6 text-slate-800">{value || "아직 작성된 내용이 없습니다."}</p>
        </div>
    );
}

function MiniStat({ icon, value, label, color, bg }: { icon: string; value: number; label: string; color: string; bg: string }) {
    return (
        <div className={`rounded-2xl px-2 py-3 text-center ${bg}`}>
            <span className={`material-symbols-outlined text-lg ${color}`}>{icon}</span>
            <strong className={`block text-lg font-black sm:text-xl ${color}`}>{value}회</strong>
            <span className="mt-0.5 block text-[10px] font-bold text-slate-500">{label}</span>
        </div>
    );
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
    return (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center">
            <span className="material-symbols-outlined text-3xl text-slate-300">{icon}</span>
            <p className="mt-2 text-xs font-bold leading-5 text-slate-500">{text}</p>
        </div>
    );
}
