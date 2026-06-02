"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, MotionConfig } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
    ensureGrowthOsStudentId,
    filterLocalStudentRecords,
    getLocalTrackAssignmentForStudent,
    getTrackTitle,
    pickLocalStudentRecord,
    upsertLocalStudentRecord,
    type LocalTrackAssignment,
} from "@/lib/growth-os-client";
import { useAuth } from "@/contexts/AuthContext";
import { createClient, isSupabaseConfigured } from "@/lib/supabase";
import {
    Activity,
    Award,
    Bell,
    Bot,
    Braces,
    Bug,
    CheckCircle2,
    ChevronRight,
    CircleDot,
    ClipboardCheck,
    Code2,
    Database,
    FileCheck2,
    FileText,
    FolderCheck,
    Gauge,
    GitBranch,
    LineChart,
    LogOut,
    Maximize2,
    MessageSquareText,
    MonitorCheck,
    Play,
    Route,
    ScrollText,
    ShieldCheck,
    Sparkles,
    Target,
    TrendingUp,
    WandSparkles,
    Workflow,
} from "lucide-react";

type Tone = "blue" | "green" | "purple" | "amber" | "slate";

interface MetricItem {
    title: string;
    value: string;
    desc: string;
    icon: LucideIcon;
    tone: Tone;
}

interface RoadmapStep {
    number: string;
    title: string;
    status: string;
    desc: string;
    record: string;
    action: string;
    progress: number;
    tone: Tone;
    icon: LucideIcon;
    current?: boolean;
}

interface CoachingBlock {
    label: string;
    content: string;
    tone: Tone;
}

interface TestBlock {
    title: string;
    items: string[];
    tone: Tone;
}

interface TimelineItem {
    type: string;
    title: string;
    desc: string;
    time: string;
    tone: Tone;
}

interface CurriculumItem {
    name: string;
    desc: string;
    stage: string;
    records: string;
    next: string;
    progress: number;
    tone: Tone;
}

interface StoredDiagnosticResult {
    areaScore?: Partial<Record<"computer" | "coding" | "thinking" | "language" | "interest", number>>;
    areaMax?: Partial<Record<"computer" | "coding" | "thinking" | "language" | "interest", number>>;
    trackCounts?: Partial<Record<string, number>>;
    total?: number;
    max?: number;
    percent?: number;
    topTrack?: string;
    startStage?: string;
    answered?: number;
}

interface StoredDiagnosticSnapshot {
    studentId?: string;
    studentName?: string;
    result?: StoredDiagnosticResult;
    savedAt?: string;
}

interface TestSummaryItem {
    label: string;
    value: string;
    percent: number;
    tone: Tone;
}

interface DataSignal {
    label: string;
    value: string;
    desc: string;
    icon: LucideIcon;
    tone: Tone;
}

interface LessonRecord {
    id: string;
    studentId?: string;
    studentName?: string;
    title: string;
    summary: string;
    code: string;
    result: string;
    feedback: string;
    savedAt: string;
}

interface PortfolioRecord {
    id: string;
    studentId?: string;
    studentName?: string;
    title: string;
    includes: string;
    representative: string;
    savedAt: string;
}

interface ParentReportDraft {
    studentId?: string;
    studentName?: string;
    summary: string;
    strength: string;
    improvement: string;
    nextGoal: string;
    status: string;
    savedAt?: string;
    source?: string;
}

interface NextLessonPlan {
    studentId?: string;
    studentName?: string;
    topic: string;
    next: string;
    method: string;
    track: string;
    reason: string;
    savedAt?: string;
    source?: string;
}

interface RemoteGrowthSnapshot {
    configured?: boolean;
    student?: {
        id: string;
        authUserId?: string;
        name: string;
        grade?: string | null;
        track: "공통기초" | "A" | "B" | "C" | "D";
        trackTitle?: string;
    } | null;
    assignment?: {
        track: "공통기초" | "A" | "B" | "C" | "D";
        recommendedTrack?: "공통기초" | "A" | "B" | "C" | "D";
        confidence?: number | null;
        reason?: string | null;
        status?: string | null;
        savedAt?: string | null;
    } | null;
    diagnostic?: (StoredDiagnosticResult & { savedAt?: string | null }) | null;
    progress?: {
        xp?: number;
        level?: number;
        streak?: number;
        accuracy?: number;
        totalCodeRuns?: number;
        totalProblems?: number;
        lastActive?: string | null;
    } | null;
    summary?: {
        lessonRecords: number;
        storedLessons: number;
        activityRecords: number;
        codeRuns: number;
        errorFixes: number;
        portfolioRecords: number;
        reportRecords: number;
        planRecords: number;
        loginRecords: number;
        evidenceRecords: number;
        completionPercent: number;
        growthPercent: number;
        nextGoal: string;
        lastUpdated?: string | null;
    };
    latest?: {
        lesson?: {
            title: string;
            summary?: string | null;
            code?: string | null;
            result?: string | null;
            feedback?: string | null;
            savedAt?: string | null;
        } | null;
        portfolio?: {
            title: string;
            includes?: string | null;
            representative?: string | null;
            savedAt?: string | null;
        } | null;
        report?: ParentReportDraft | null;
        plan?: NextLessonPlan | null;
    };
    timeline?: TimelineItem[];
    curriculum?: CurriculumItem[];
}

interface CurrentStudent {
    id: string;
    authUserId: string;
    name: string;
    grade?: string;
    avatar?: string;
}

const heroMetrics: MetricItem[] = [
    { title: "현재 트랙", value: "공통기초", desc: "실제 배정 기록 기준", icon: Route, tone: "blue" },
    { title: "이번 달 성장률", value: "0%", desc: "코드·실행·피드백 기준", icon: TrendingUp, tone: "green" },
    { title: "다음 목표", value: "미정", desc: "다음 수업 계획 대기", icon: Target, tone: "amber" },
    { title: "학부모 리포트", value: "기록 없음", desc: "작성된 리포트 없음", icon: FileText, tone: "purple" },
];

const roadmapSteps: RoadmapStep[] = [
    {
        number: "1",
        title: "진단 테스트",
        status: "완료",
        desc: "기초 성향 확인",
        record: "테스트 1회",
        action: "공통기초 시작",
        progress: 100,
        tone: "green",
        icon: ClipboardCheck,
    },
    {
        number: "2",
        title: "공통기초",
        status: "진행 중",
        desc: "3단계 진행 중",
        record: "성장 기록 12개",
        action: "조건문 설명 훈련",
        progress: 62,
        tone: "blue",
        icon: Code2,
        current: true,
    },
    {
        number: "3",
        title: "4주 체크",
        status: "다음 수업 후",
        desc: "실력과 흥미 재확인",
        record: "대기 중",
        action: "A/B/C/D 분석",
        progress: 22,
        tone: "amber",
        icon: LineChart,
    },
    {
        number: "4",
        title: "트랙 추천",
        status: "대기",
        desc: "학생 성향 기반 추천",
        record: "분석 예정",
        action: "추천 경로 생성",
        progress: 8,
        tone: "purple",
        icon: GitBranch,
    },
    {
        number: "5",
        title: "포트폴리오",
        status: "누적 예정",
        desc: "결과물과 피드백 저장",
        record: "저장 준비",
        action: "대표 기록 선택",
        progress: 4,
        tone: "slate",
        icon: FolderCheck,
    },
];

const coachingBlocks: CoachingBlock[] = [
    { label: "자주 틀린 부분", content: "if 안에 else 위치를 헷갈림", tone: "amber" },
    { label: "추천 힌트", content: "조건을 먼저 말로 설명한 뒤 코드로 바꾸기", tone: "blue" },
    { label: "선생님용 메모", content: "중첩 조건문 전에 종이에 흐름 그리기", tone: "purple" },
    { label: "리포트 포인트", content: "오류를 고치는 과정이 좋아졌고, 설명 훈련이 필요함", tone: "green" },
];

const testBlocks: TestBlock[] = [
    {
        title: "강점",
        items: ["사고력 문제에서 규칙 찾기 가능", "문제풀이 집중력 좋음"],
        tone: "green",
    },
    {
        title: "보완 필요",
        items: ["코딩기초 용어 정리 필요", "조건문 설명 훈련 필요"],
        tone: "amber",
    },
    {
        title: "추천 경로",
        items: ["공통기초 4주", "C++ 기초", "정올 맛보기반"],
        tone: "blue",
    },
];

const timelineItems: TimelineItem[] = [
    { type: "코드", title: "if 조건문 미션", desc: "조건을 바꿔 출력 결과 수정", time: "오늘", tone: "blue" },
    { type: "실행", title: "비교 연산자 결과", desc: "성공 3회 · 오류 수정 1회", time: "어제", tone: "green" },
    { type: "피드백", title: "선생님 코멘트", desc: "문제 설명은 좋아졌고 변수 이름 정리 필요", time: "이번 주", tone: "purple" },
    { type: "리포트", title: "학부모 공유 가능", desc: "오늘 수업 요약이 리포트에 반영됨", time: "이번 주", tone: "amber" },
    { type: "포트폴리오", title: "성장 기록 저장", desc: "코드, 실행 결과, 피드백이 함께 저장됨", time: "누적", tone: "slate" },
];

const curriculumItems: CurriculumItem[] = [
    {
        name: "공통기초",
        desc: "컴퓨터기초 · 코딩기초 · 사고력",
        stage: "3단계 진행 중",
        records: "12개",
        next: "조건문 말로 설명하기",
        progress: 36,
        tone: "blue",
    },
    {
        name: "Python",
        desc: "조건문 3단계 / 6단계",
        stage: "기초 조건문",
        records: "6개",
        next: "반복문 맛보기",
        progress: 18,
        tone: "green",
    },
    {
        name: "C++",
        desc: "구현력 · 알고리즘 입문",
        stage: "입력과 출력 복습",
        records: "4개",
        next: "변수와 연산자",
        progress: 12,
        tone: "purple",
    },
    {
        name: "피지컬컴퓨팅",
        desc: "센서 · 아두이노 · 만들기",
        stage: "준비 단계",
        records: "2개",
        next: "LED 제어",
        progress: 8,
        tone: "amber",
    },
    {
        name: "AI 프로젝트",
        desc: "AI 활용 · 프로젝트 · 포트폴리오",
        stage: "체험 전",
        records: "1개",
        next: "AI에게 질문하기",
        progress: 5,
        tone: "slate",
    },
];

const evidenceCells = [1, 2, 1, 0, 3, 2, 4, 1, 2, 3, 0, 4, 2, 1, 3, 4, 2, 3, 1, 0, 2, 4, 3, 2, 1, 3, 4, 2];

const TODAY_LESSON_RECORD: Omit<LessonRecord, "id" | "savedAt"> = {
    title: "조건문 실행 흐름 설명",
    summary: "조건문 실행 흐름을 직접 설명하고, 조건을 바꿔 출력 결과를 수정했습니다.",
    code: `if (score >= 60) {
    cout << "합격";
} else {
    cout << "다시 도전";
}`,
    result: "성공 3회 / 오류 수정 1회",
    feedback: "문제 설명은 좋아졌고, 변수 이름 정리가 필요함",
};

const DEFAULT_REPORT: ParentReportDraft = {
    summary: "조건문 실행 흐름을 직접 설명하고, 코드를 수정했습니다.",
    strength: "오류를 보고 다시 고치는 태도가 좋아졌습니다.",
    improvement: "변수 이름과 조건 설명을 더 정확히 해야 합니다.",
    nextGoal: "조건문을 3줄로 말하고 코드로 옮기기",
    status: "학부모 공유 가능",
};

const DEFAULT_NEXT_PLAN: NextLessonPlan = {
    topic: "비교/논리 연산자 복습",
    next: "if-else 심화",
    method: "종이 흐름도 → 코드 변환",
    track: "공통기초 유지",
    reason: "현재 학생은 문제풀이 집중력은 좋지만, 조건을 말로 설명하는 훈련이 더 필요합니다.",
};

function toggleFullscreen() {
    if (typeof document === "undefined") return;
    if (document.fullscreenElement) {
        void document.exitFullscreen();
        return;
    }
    void document.documentElement.requestFullscreen().catch(() => {});
}

function ToneIcon({ icon: Icon, tone }: { icon: LucideIcon; tone: Tone }) {
    return (
        <span className={`tone-icon tone-${tone}`}>
            <Icon size={16} strokeWidth={2.2} />
        </span>
    );
}

function StatusBadge({ children, tone }: { children: string; tone: Tone }) {
    return <span className={`status-badge tone-${tone}`}>{children}</span>;
}

function ActionButton({
    children,
    icon: Icon,
    primary = false,
    onClick,
}: {
    children: string;
    icon?: LucideIcon;
    primary?: boolean;
    onClick?: () => void;
}) {
    return (
        <motion.button
            className={`action-button ${primary ? "primary" : ""}`}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
        >
            {Icon && <Icon size={15} strokeWidth={2.3} />}
            {children}
        </motion.button>
    );
}

function SectionTitle({ title, desc }: { title: string; desc: string }) {
    return (
        <div className="section-title">
            <h2>{title}</h2>
            <p>{desc}</p>
        </div>
    );
}

function ProgressBar({ value, tone }: { value: number; tone: Tone }) {
    return (
        <span className="progress-bar">
            <motion.i
                className={`tone-bg-${tone}`}
                initial={{ width: 0 }}
                whileInView={{ width: `${value}%` }}
                viewport={{ once: true, amount: 0.45 }}
                transition={{ duration: 0.9, ease: "easeOut" }}
            />
        </span>
    );
}

function scoreToLabel(score?: number, max?: number) {
    if (typeof score !== "number" || typeof max !== "number" || max <= 0) return "미측정";
    const ratio = score / max;
    if (ratio >= 0.8) return "좋음";
    if (ratio >= 0.5) return "보통";
    return "약함";
}

function scoreToTone(score?: number, max?: number): Tone {
    if (typeof score !== "number" || typeof max !== "number" || max <= 0) return "slate";
    const ratio = score / max;
    if (ratio >= 0.8) return "green";
    if (ratio >= 0.5) return "blue";
    return "amber";
}

function scoreToPercent(score?: number, max?: number, fallback = 0) {
    if (typeof score !== "number" || typeof max !== "number" || max <= 0) return fallback;
    return Math.round((score / max) * 100);
}

function createLocalId(prefix: string) {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}-${crypto.randomUUID()}`;
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readLocalArray<T>(key: string): T[] {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as T[] : [];
}

function writeLocalArray<T>(key: string, value: T[]) {
    localStorage.setItem(key, JSON.stringify(value));
}

function prependLocalRecord<T extends { id: string }>(key: string, record: T, limit = 200) {
    const rows = readLocalArray<T>(key);
    const next = [record, ...rows.filter((row) => row.id !== record.id)].slice(0, limit);
    writeLocalArray(key, next);
    return next;
}

export default function LearningDashboard() {
    const router = useRouter();
    const { user } = useAuth();
    const [diagnosticSnapshot, setDiagnosticSnapshot] = useState<StoredDiagnosticSnapshot | null>(null);
    const [lessonRecords, setLessonRecords] = useState<LessonRecord[]>([]);
    const [portfolioRecords, setPortfolioRecords] = useState<PortfolioRecord[]>([]);
    const [reportDraft, setReportDraft] = useState<ParentReportDraft>(DEFAULT_REPORT);
    const [nextPlan, setNextPlan] = useState<NextLessonPlan>(DEFAULT_NEXT_PLAN);
    const [trackAssignment, setTrackAssignment] = useState<LocalTrackAssignment | null>(null);
    const [remoteSnapshot, setRemoteSnapshot] = useState<RemoteGrowthSnapshot | null>(null);
    const [workflowNotice, setWorkflowNotice] = useState("성장 기록 워크플로우 대기 중");

    const currentStudent = useMemo<CurrentStudent | null>(() => {
        if (!user?.id || !user.name) return null;
        return {
            id: user.studentId ?? user.id,
            authUserId: user.id,
            name: user.name,
            grade: user.grade,
            avatar: user.avatar,
        };
    }, [user]);

    const currentStudentId = currentStudent?.id ?? "";
    const currentStudentName = currentStudent?.name ?? "학생";
    const currentStudentInitial = currentStudentName.trim().charAt(0) || "?";
    const currentStudentGrade = currentStudent?.grade ?? "학년 미입력";

    useEffect(() => {
        if (!currentStudent) return;

        const frame = window.requestAnimationFrame(() => {
            try {
                const storedDiagnostics = readLocalArray<StoredDiagnosticSnapshot>("codingssok_diagnostic_results");
                const storedDiagnostic = pickLocalStudentRecord(storedDiagnostics, currentStudent.id, currentStudent.name);
                const raw = localStorage.getItem("codingssok_diagnostic_result");
                if (storedDiagnostic?.result) {
                    setDiagnosticSnapshot(storedDiagnostic);
                } else if (raw) {
                    const parsed = JSON.parse(raw) as StoredDiagnosticSnapshot;
                    const belongsToCurrent = (
                        (!parsed.studentId && !parsed.studentName)
                        || parsed.studentId === currentStudent.id
                        || parsed.studentName === currentStudent.name
                    );
                    if (parsed?.result && belongsToCurrent) setDiagnosticSnapshot(parsed);
                }

                const storedLessons = filterLocalStudentRecords(readLocalArray<LessonRecord>("codingssok_lesson_records"), currentStudent.id, currentStudent.name);
                const storedPortfolio = filterLocalStudentRecords(readLocalArray<PortfolioRecord>("codingssok_portfolio_records"), currentStudent.id, currentStudent.name);
                const storedReports = readLocalArray<ParentReportDraft>("codingssok_parent_reports");
                const storedPlans = readLocalArray<NextLessonPlan>("codingssok_next_lesson_plans");
                const storedAssignment = getLocalTrackAssignmentForStudent(currentStudent.id, currentStudent.name);
                const storedReport = pickLocalStudentRecord(storedReports, currentStudent.id, currentStudent.name);
                const storedPlan = pickLocalStudentRecord(storedPlans, currentStudent.id, currentStudent.name);

                setLessonRecords(storedLessons);
                setPortfolioRecords(storedPortfolio);
                setTrackAssignment(storedAssignment);
                if (storedReport) {
                    setReportDraft(storedReport);
                } else if (storedAssignment) {
                    setReportDraft({
                        ...DEFAULT_REPORT,
                        nextGoal: storedAssignment.nextGoal ?? DEFAULT_REPORT.nextGoal,
                        status: storedAssignment.reportStatus ?? DEFAULT_REPORT.status,
                    });
                }
                if (storedPlan) {
                    setNextPlan(storedPlan);
                } else if (storedAssignment) {
                    const assignedTitle = getTrackTitle(storedAssignment.track);
                    setNextPlan({
                        ...DEFAULT_NEXT_PLAN,
                        track: storedAssignment.track === "공통기초" ? "공통기초 유지" : `${assignedTitle} 배정`,
                        reason: storedAssignment.reason ?? DEFAULT_NEXT_PLAN.reason,
                    });
                }
            } catch {
                setDiagnosticSnapshot(null);
                setLessonRecords([]);
                setPortfolioRecords([]);
                setTrackAssignment(null);
            }
        });

        return () => window.cancelAnimationFrame(frame);
    }, [currentStudent]);

    useEffect(() => {
        if (!currentStudent || !isSupabaseConfigured()) return;

        let cancelled = false;
        (async () => {
            try {
                const response = await fetch("/api/growth-os/student", { cache: "no-store" });
                const payload = await response.json().catch(() => null) as RemoteGrowthSnapshot | null;
                if (cancelled || !response.ok || !payload?.student) return;

                setRemoteSnapshot(payload);
                if (payload.latest?.report) {
                    setReportDraft({
                        ...DEFAULT_REPORT,
                        ...payload.latest.report,
                        studentId: currentStudent.id,
                        studentName: currentStudent.name,
                    });
                }
                if (payload.latest?.plan) {
                    setNextPlan({
                        ...DEFAULT_NEXT_PLAN,
                        ...payload.latest.plan,
                        studentId: currentStudent.id,
                        studentName: currentStudent.name,
                    });
                }
                if (payload.assignment) {
                    setTrackAssignment({
                        studentId: currentStudent.id,
                        studentName: currentStudent.name,
                        track: payload.assignment.track,
                        recommendedTrack: payload.assignment.recommendedTrack,
                        confidence: payload.assignment.confidence ?? undefined,
                        reason: payload.assignment.reason ?? undefined,
                        nextGoal: payload.summary?.nextGoal,
                        reportStatus: payload.latest?.report?.status,
                        savedAt: payload.assignment.savedAt ?? new Date().toISOString(),
                        source: "supabase-admin",
                    });
                }
                setWorkflowNotice(`실제 성장 기록 ${payload.summary?.evidenceRecords ?? 0}개를 불러왔습니다.`);
            } catch {
                if (!cancelled) setRemoteSnapshot(null);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [currentStudent]);

    const activeAssignment = remoteSnapshot?.assignment ? {
        studentId: currentStudentId,
        studentName: currentStudentName,
        track: remoteSnapshot.assignment.track,
        recommendedTrack: remoteSnapshot.assignment.recommendedTrack,
        confidence: remoteSnapshot.assignment.confidence ?? undefined,
        reason: remoteSnapshot.assignment.reason ?? undefined,
        nextGoal: remoteSnapshot.summary?.nextGoal,
        reportStatus: remoteSnapshot.latest?.report?.status,
        savedAt: remoteSnapshot.assignment.savedAt ?? new Date().toISOString(),
        source: "supabase-admin" as const,
    } : trackAssignment;
    const diagnostic = remoteSnapshot?.diagnostic ?? diagnosticSnapshot?.result;
    const diagnosticSavedAt = remoteSnapshot?.diagnostic?.savedAt ?? diagnosticSnapshot?.savedAt;
    const testSummaryItems = useMemo<TestSummaryItem[]>(() => {
        const areaScore = diagnostic?.areaScore ?? {};
        const areaMax = diagnostic?.areaMax ?? {};
        const areaItem = (
            key: "computer" | "coding" | "thinking" | "language",
            label: string,
            fallbackValue: string,
            fallbackPercent: number,
            fallbackTone: Tone,
        ): TestSummaryItem => {
            const score = areaScore[key];
            const max = areaMax[key];
            return {
                label,
                value: scoreToLabel(score, max) === "미측정" ? fallbackValue : scoreToLabel(score, max),
                percent: scoreToPercent(score, max, fallbackPercent),
                tone: scoreToTone(score, max) === "slate" ? fallbackTone : scoreToTone(score, max),
            };
        };

        return [
            areaItem("computer", "컴퓨터기초", "미측정", 0, "slate"),
            areaItem("coding", "코딩기초", "미측정", 0, "slate"),
            areaItem("thinking", "사고력", "미측정", 0, "slate"),
            areaItem("language", "언어 감각", "미측정", 0, "slate"),
            {
                label: "트랙 후보",
                value: diagnostic?.topTrack ? `${diagnostic.topTrack} 트랙` : "미측정",
                percent: diagnostic?.topTrack ? 72 : 0,
                tone: diagnostic?.topTrack ? "purple" : "slate",
            },
        ];
    }, [diagnostic]);

    const assignedTrackTitle = activeAssignment ? getTrackTitle(activeAssignment.track) : remoteSnapshot?.student?.trackTitle ?? "공통기초";
    const assignedTrackValue = activeAssignment?.track === "공통기초" || !activeAssignment ? "공통기초" : `${activeAssignment.track} 트랙`;
    const heroTitle = activeAssignment
        ? `${currentStudentName} 학생은 ${assignedTrackTitle} 경로로 배정되었습니다`
        : `${currentStudentName} 학생은 공통기초 단계 진행 중`;
    const assignmentNextGoal = remoteSnapshot?.summary?.nextGoal ?? activeAssignment?.nextGoal ?? DEFAULT_REPORT.nextGoal;
    const growthStudentInput = currentStudent ? {
        name: currentStudent.name,
        grade: currentStudent.grade,
        className: assignedTrackTitle,
        status: "active",
    } : null;

    const effectiveMetrics = useMemo<MetricItem[]>(() => {
        return heroMetrics.map((metric) => {
            if (metric.title === "현재 트랙") {
                return {
                    ...metric,
                    value: assignedTrackValue,
                    desc: activeAssignment
                        ? `관리자 배정 · 추천 ${activeAssignment.recommendedTrack ?? "공통기초"} · 신뢰도 ${activeAssignment.confidence ?? 0}%`
                        : diagnostic?.topTrack ? `진단 후보 ${diagnostic.topTrack} 트랙 · 4주 체크 확정` : metric.desc,
                };
            }
            if (metric.title === "다음 목표" && assignmentNextGoal) {
                return {
                    ...metric,
                    value: remoteSnapshot?.summary?.planRecords ? "계획 반영" : activeAssignment ? "배정 목표" : "다음 목표",
                    desc: assignmentNextGoal,
                };
            }
            if (metric.title === "이번 달 성장률") {
                return {
                    ...metric,
                    value: `${remoteSnapshot?.summary?.growthPercent ?? diagnostic?.percent ?? 0}%`,
                    desc: remoteSnapshot?.summary
                        ? `실제 기록 ${remoteSnapshot.summary.evidenceRecords}종 반영`
                        : diagnostic ? `최근 진단 ${diagnostic.percent ?? 0}% 반영` : metric.desc,
                };
            }
            if (metric.title === "학부모 리포트") {
                return {
                    ...metric,
                    value: remoteSnapshot?.summary?.reportRecords ? `${remoteSnapshot.summary.reportRecords}개` : reportDraft.savedAt ? "초안 저장" : metric.value,
                    desc: remoteSnapshot?.summary
                        ? `수업 ${remoteSnapshot.summary.lessonRecords}개 · 포트폴리오 ${remoteSnapshot.summary.portfolioRecords}개`
                        : diagnostic?.answered ? `진단 응답 ${diagnostic.answered}개` : metric.desc,
                };
            }
            return metric;
        });
    }, [activeAssignment, assignedTrackValue, assignmentNextGoal, diagnostic, remoteSnapshot, reportDraft.savedAt]);

    const savedLessonCount = remoteSnapshot?.summary?.lessonRecords ?? lessonRecords.length;
    const savedPortfolioCount = remoteSnapshot?.summary?.portfolioRecords ?? portfolioRecords.length;
    const latestPortfolioTitle = remoteSnapshot?.latest?.portfolio?.title ?? portfolioRecords[0]?.title ?? "저장된 포트폴리오 없음";
    const representativeRecord = remoteSnapshot?.latest?.portfolio?.representative ?? portfolioRecords[0]?.representative ?? "대표 기록 미선택";
    const hasReportRecord = Boolean(remoteSnapshot?.latest?.report || reportDraft.savedAt);
    const hasPlanRecord = Boolean(remoteSnapshot?.latest?.plan || nextPlan.savedAt);
    const displayedReport = hasReportRecord ? reportDraft : {
        ...DEFAULT_REPORT,
        summary: "저장된 학부모 리포트가 없습니다.",
        strength: "성장 기록 저장 후 자동으로 정리됩니다.",
        improvement: "수업 기록과 진단 결과가 필요합니다.",
        nextGoal: assignmentNextGoal,
        status: "작성 필요",
    };
    const displayedNextPlan = hasPlanRecord ? nextPlan : {
        ...DEFAULT_NEXT_PLAN,
        topic: "저장된 다음 수업 계획 없음",
        next: assignmentNextGoal,
        method: "수업 기록 저장 후 추천",
        track: assignedTrackValue,
        reason: "실제 수업 기록과 진단 결과가 쌓이면 추천 이유가 표시됩니다.",
    };
    const reportStatus = hasReportRecord ? (remoteSnapshot?.latest?.report?.status ?? "초안 저장됨") : "작성 필요";
    const growthPercent = remoteSnapshot?.summary?.growthPercent ?? diagnostic?.percent ?? 0;
    const evidencePercent = remoteSnapshot?.summary?.completionPercent ?? (diagnostic?.percent ? Math.max(0, Math.min(100, diagnostic.percent)) : 0);
    const errorFixCount = remoteSnapshot?.summary?.errorFixes ?? 0;

    const dataSignals: DataSignal[] = [
        activeAssignment ? {
            label: "트랙 배정",
            value: assignedTrackValue,
            desc: "관리자 확정",
            icon: GitBranch,
            tone: "purple",
        } : {
            label: "성장 기록",
            value: `${savedLessonCount + (remoteSnapshot?.summary?.codeRuns ?? 0)}개`,
            desc: "코드·실행·피드백",
            icon: Database,
            tone: "blue",
        },
        {
            label: "증거 완성도",
            value: `${evidencePercent}%`,
            desc: "리포트 사용 가능",
            icon: Gauge,
            tone: "green",
        },
        {
            label: "오늘 집중",
            value: remoteSnapshot?.latest?.plan?.topic ?? "다음 목표",
            desc: remoteSnapshot?.summary?.nextGoal ?? "수업 계획 대기",
            icon: MonitorCheck,
            tone: "amber",
        },
        {
            label: "AI 분석",
            value: diagnostic || remoteSnapshot ? "반영됨" : "대기 중",
            desc: diagnosticSavedAt ? new Date(diagnosticSavedAt).toLocaleDateString("ko-KR") : "진단 저장 시 갱신",
            icon: Activity,
            tone: "purple",
        },
    ];

    const effectiveRoadmapSteps = useMemo<RoadmapStep[]>(() => {
        const hasDiagnostic = Boolean(diagnostic);
        const hasAssignment = Boolean(activeAssignment);
        const portfolioCount = savedPortfolioCount;
        return [
            {
                ...roadmapSteps[0],
                status: hasDiagnostic ? "완료" : "미실시",
                record: hasDiagnostic ? "진단 1회" : "기록 없음",
                action: hasDiagnostic ? "공통기초 반영" : "진단 보기",
                progress: hasDiagnostic ? 100 : 0,
                current: !hasDiagnostic,
            },
            {
                ...roadmapSteps[1],
                status: hasAssignment && activeAssignment?.track !== "공통기초" ? "기초 완료" : "진행 중",
                record: `성장 기록 ${savedLessonCount}개`,
                action: remoteSnapshot?.summary?.nextGoal ?? "다음 목표 설정",
                progress: Math.max(0, Math.min(100, growthPercent)),
                current: !hasAssignment || activeAssignment?.track === "공통기초",
            },
            {
                ...roadmapSteps[2],
                status: hasAssignment ? "완료" : "다음 수업 후",
                record: hasAssignment ? "체크 반영" : "대기 중",
                action: hasAssignment ? "추천 경로 확인" : "A/B/C/D 분석",
                progress: hasAssignment ? 100 : hasDiagnostic ? 42 : 0,
                current: hasDiagnostic && !hasAssignment,
            },
            {
                ...roadmapSteps[3],
                status: hasAssignment ? "배정 완료" : diagnostic?.topTrack ? "추천 대기" : "대기",
                record: hasAssignment ? assignedTrackValue : diagnostic?.topTrack ? `${diagnostic.topTrack} 후보` : "분석 예정",
                action: hasAssignment ? "트랙 수업 시작" : "추천 경로 생성",
                progress: hasAssignment ? 100 : diagnostic?.topTrack ? 54 : 0,
                current: false,
            },
            {
                ...roadmapSteps[4],
                status: portfolioCount > 0 ? "누적 중" : "누적 예정",
                record: portfolioCount > 0 ? `${portfolioCount}개 저장` : "저장 준비",
                action: portfolioCount > 0 ? "대표 기록 선택" : "첫 기록 저장",
                progress: Math.min(100, portfolioCount * 18),
                current: false,
            },
        ];
    }, [activeAssignment, assignedTrackValue, diagnostic, growthPercent, remoteSnapshot?.summary?.nextGoal, savedLessonCount, savedPortfolioCount]);

    const effectiveTestBlocks = useMemo<TestBlock[]>(() => {
        if (!diagnostic) {
            return [
                { title: "진단 기록", items: ["아직 저장된 진단 결과가 없습니다."], tone: "slate" },
                { title: "현재 기준", items: activeAssignment ? [`배정 트랙: ${assignedTrackTitle}`] : ["트랙 배정 전입니다."], tone: activeAssignment ? "blue" : "amber" },
                { title: "다음 행동", items: ["진단 테스트 또는 첫 수업 기록을 저장해야 합니다."], tone: "purple" },
            ];
        }

        const strengths = testSummaryItems
            .filter((item) => item.percent >= 70)
            .map((item) => `${item.label}: ${item.value}`);
        const improvements = testSummaryItems
            .filter((item) => item.percent > 0 && item.percent < 50)
            .map((item) => `${item.label}: ${item.value}`);

        return [
            {
                title: "강점",
                items: strengths.length ? strengths : ["진단 결과에서 두드러진 강점은 추가 기록이 필요합니다."],
                tone: "green",
            },
            {
                title: "보완 필요",
                items: improvements.length ? improvements : ["현재 진단 기준으로 즉시 보완 항목은 크지 않습니다."],
                tone: "amber",
            },
            {
                title: "추천 경로",
                items: [
                    activeAssignment ? `${assignedTrackTitle} 배정` : diagnostic.topTrack ? `${diagnostic.topTrack} 트랙 후보` : "공통기초 유지",
                    assignmentNextGoal,
                ],
                tone: "blue",
            },
        ];
    }, [activeAssignment, assignedTrackTitle, assignmentNextGoal, diagnostic, testSummaryItems]);

    const latestLocalLesson = lessonRecords[0] ?? null;
    const displayedLesson = remoteSnapshot?.latest?.lesson ? {
        title: remoteSnapshot.latest.lesson.title,
        summary: remoteSnapshot.latest.lesson.summary ?? "",
        code: remoteSnapshot.latest.lesson.code ?? "",
        result: remoteSnapshot.latest.lesson.result ?? "",
        feedback: remoteSnapshot.latest.lesson.feedback ?? "",
        savedAt: remoteSnapshot.latest.lesson.savedAt ?? "",
    } : latestLocalLesson;
    const hasDisplayedLesson = Boolean(displayedLesson);
    const localTimelineItems: TimelineItem[] = [
        ...lessonRecords.slice(0, 2).map((record) => ({
            type: "수업",
            title: record.title,
            desc: record.result || record.summary,
            time: record.savedAt ? new Date(record.savedAt).toLocaleDateString("ko-KR") : "저장됨",
            tone: "blue" as Tone,
        })),
        ...portfolioRecords.slice(0, 1).map((record) => ({
            type: "포트폴리오",
            title: record.title,
            desc: record.representative,
            time: record.savedAt ? new Date(record.savedAt).toLocaleDateString("ko-KR") : "저장됨",
            tone: "green" as Tone,
        })),
        ...(reportDraft.savedAt ? [{
            type: "리포트",
            title: "학부모 리포트 초안",
            desc: reportDraft.nextGoal,
            time: new Date(reportDraft.savedAt).toLocaleDateString("ko-KR"),
            tone: "amber" as Tone,
        }] : []),
        ...(nextPlan.savedAt ? [{
            type: "다음 계획",
            title: nextPlan.topic,
            desc: nextPlan.next,
            time: new Date(nextPlan.savedAt).toLocaleDateString("ko-KR"),
            tone: "purple" as Tone,
        }] : []),
    ];
    const effectiveTimelineItems = remoteSnapshot?.timeline?.length
        ? remoteSnapshot.timeline
        : localTimelineItems.length
            ? localTimelineItems
            : [{ type: "기록", title: "저장된 성장 기록 없음", desc: "진단 또는 수업 기록을 저장하면 이곳에 표시됩니다.", time: "대기", tone: "slate" as Tone }];
    const effectiveCurriculumItems = remoteSnapshot?.curriculum?.length ? remoteSnapshot.curriculum : curriculumItems.map((item, index) => {
        if (index === 0) {
            return {
                ...item,
                records: `${savedLessonCount}개`,
                next: assignmentNextGoal,
                progress: Math.max(0, Math.min(100, growthPercent)),
            };
        }
        return {
            ...item,
            records: "0개",
            progress: 0,
            stage: activeAssignment && item.name === assignedTrackTitle ? "배정 완료" : "대기",
        };
    });

    const saveLessonRecord = async () => {
        if (!currentStudent) return;

        const record: LessonRecord = {
            id: createLocalId("lesson"),
            studentId: currentStudentId,
            studentName: currentStudentName,
            savedAt: new Date().toISOString(),
            ...TODAY_LESSON_RECORD,
        };
        const nextAll = prependLocalRecord("codingssok_lesson_records", record);
        const next = filterLocalStudentRecords(nextAll, currentStudentId, currentStudentName).slice(0, 20);
        setLessonRecords(next);
        setWorkflowNotice("오늘 수업 기록을 성장 기록장에 저장했습니다.");

        if (!isSupabaseConfigured()) return;

        try {
            const studentId = growthStudentInput ? await ensureGrowthOsStudentId(growthStudentInput) : null;
            if (!studentId) return;
            const supabase = createClient();
            const { data: userResult } = await supabase.auth.getUser();
            const { error } = await supabase.from("lesson_records").insert({
                student_id: studentId,
                title: record.title,
                goal: "조건문 실행 흐름을 코드로 설명하기",
                mission: "if 조건문 미션",
                code: record.code,
                execution_result: record.result,
                error_fix_count: 1,
                feedback: record.feedback,
                evidence: { summary: record.summary, source: "growth-os-dashboard" },
                created_by: userResult.user?.id ?? null,
            });

            if (error) throw error;
            setWorkflowNotice("오늘 수업 기록을 Supabase 성장 OS에 연동했습니다.");
        } catch {
            setWorkflowNotice("오늘 수업 기록은 로컬에 저장했습니다. Supabase 연동은 권한/스키마 확인이 필요합니다.");
        }
    };

    const savePortfolioRecord = async () => {
        if (!currentStudent) return;

        const record: PortfolioRecord = {
            id: createLocalId("portfolio"),
            studentId: currentStudentId,
            studentName: currentStudentName,
            title: "조건문 실행 흐름 설명",
            includes: "코드, 실행 결과, 선생님 피드백",
            representative: "오류를 직접 고친 과정",
            savedAt: new Date().toISOString(),
        };
        const nextAll = prependLocalRecord("codingssok_portfolio_records", record);
        const next = filterLocalStudentRecords(nextAll, currentStudentId, currentStudentName).slice(0, 20);
        setPortfolioRecords(next);
        setWorkflowNotice("대표 포트폴리오 기록을 저장했습니다.");

        if (!isSupabaseConfigured()) return;

        try {
            const studentId = growthStudentInput ? await ensureGrowthOsStudentId(growthStudentInput) : null;
            if (!studentId) return;
            const supabase = createClient();
            const { data: userResult } = await supabase.auth.getUser();
            const { error } = await supabase.from("portfolio_records").insert({
                student_id: studentId,
                title: record.title,
                includes: record.includes,
                representative: record.representative,
                artifacts: { code: TODAY_LESSON_RECORD.code, execution_result: TODAY_LESSON_RECORD.result },
                is_featured: true,
                created_by: userResult.user?.id ?? null,
            });

            if (error) throw error;
            setWorkflowNotice("대표 포트폴리오 기록을 Supabase 성장 OS에 연동했습니다.");
        } catch {
            setWorkflowNotice("대표 포트폴리오 기록은 로컬에 저장했습니다. Supabase 연동은 권한/스키마 확인이 필요합니다.");
        }
    };

    const generateReportDraft = async () => {
        if (!currentStudent) return;

        const draft: ParentReportDraft = {
            ...DEFAULT_REPORT,
            studentId: currentStudentId,
            studentName: currentStudentName,
            summary: activeAssignment
                ? `${TODAY_LESSON_RECORD.summary} 관리자 배정 트랙(${assignedTrackTitle})과 오늘 수업 기록을 함께 반영했습니다.`
                : `${TODAY_LESSON_RECORD.summary} 최근 진단 결과와 오늘 수업 기록을 함께 반영했습니다.`,
            nextGoal: assignmentNextGoal,
            status: "학부모 공유 가능",
            savedAt: new Date().toISOString(),
            source: activeAssignment ? "track-assignment-report" : "growth-dashboard-report",
        };
        setReportDraft(draft);
        upsertLocalStudentRecord("codingssok_parent_reports", draft);
        setWorkflowNotice("학부모 리포트 초안을 생성하고 저장했습니다.");

        if (!isSupabaseConfigured()) return;

        try {
            const studentId = growthStudentInput ? await ensureGrowthOsStudentId(growthStudentInput) : null;
            if (!studentId) return;
            const supabase = createClient();
            const { data: userResult } = await supabase.auth.getUser();
            const { error } = await supabase.from("parent_reports").insert({
                student_id: studentId,
                summary: draft.summary,
                strength: draft.strength,
                improvement: draft.improvement,
                next_goal: draft.nextGoal,
                status: "shared",
                created_by: userResult.user?.id ?? null,
            });

            if (error) throw error;
            setWorkflowNotice("학부모 리포트 초안을 Supabase 성장 OS에 연동했습니다.");
        } catch {
            setWorkflowNotice("학부모 리포트는 로컬에 저장했습니다. Supabase 연동은 권한/스키마 확인이 필요합니다.");
        }
    };

    const saveNextPlan = async () => {
        if (!currentStudent) return;

        const plan: NextLessonPlan = {
            ...DEFAULT_NEXT_PLAN,
            studentId: currentStudentId,
            studentName: currentStudentName,
            track: activeAssignment
                ? activeAssignment.track === "공통기초" ? "공통기초 유지" : `${assignedTrackTitle} 배정`
                : DEFAULT_NEXT_PLAN.track,
            reason: activeAssignment?.reason ?? DEFAULT_NEXT_PLAN.reason,
            savedAt: new Date().toISOString(),
            source: activeAssignment ? "track-assignment-plan" : "growth-dashboard-plan",
        };
        setNextPlan(plan);
        upsertLocalStudentRecord("codingssok_next_lesson_plans", plan);
        setWorkflowNotice("다음 수업 계획을 저장했습니다.");

        if (!isSupabaseConfigured()) return;

        try {
            const studentId = growthStudentInput ? await ensureGrowthOsStudentId(growthStudentInput) : null;
            if (!studentId) return;
            const supabase = createClient();
            const { data: userResult } = await supabase.auth.getUser();
            const { error } = await supabase.from("next_lesson_plans").insert({
                student_id: studentId,
                topic: plan.topic,
                next_step: plan.next,
                method: plan.method,
                track: plan.track,
                reason: plan.reason,
                status: "planned",
                created_by: userResult.user?.id ?? null,
            });

            if (error) throw error;
            setWorkflowNotice("다음 수업 계획을 Supabase 성장 OS에 연동했습니다.");
        } catch {
            setWorkflowNotice("다음 수업 계획은 로컬에 저장했습니다. Supabase 연동은 권한/스키마 확인이 필요합니다.");
        }
    };

    const runCoachAction = (label: string) => {
        if (!currentStudent) return;

        localStorage.setItem("codingssok_ai_coach_last_action", JSON.stringify({
            label,
            student: currentStudentName,
            savedAt: new Date().toISOString(),
        }));
        setWorkflowNotice(`AI 코칭 작업을 준비했습니다: ${label}`);
    };

    return (
        <MotionConfig transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
            <main className="growth-os">
                <style>{`
                    .growth-os {
                        min-height: 100vh;
                        background:
                            linear-gradient(115deg, rgba(37, 99, 235, 0.10), transparent 34%),
                            linear-gradient(245deg, rgba(124, 58, 237, 0.08), transparent 38%),
                            linear-gradient(180deg, #f7faff 0%, #eef4ff 100%);
                        color: #0f172a;
                        font-family: Pretendard, Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                        letter-spacing: 0;
                        position: relative;
                        overflow-x: hidden;
                    }
                    .growth-os::before {
                        content: "";
                        position: fixed;
                        inset: 70px 0 0;
                        pointer-events: none;
                        background-image:
                            linear-gradient(rgba(37, 99, 235, 0.055) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(37, 99, 235, 0.055) 1px, transparent 1px);
                        background-size: 36px 36px;
                        mask-image: linear-gradient(180deg, rgba(0,0,0,0.75), transparent 72%);
                        z-index: 0;
                    }
                    .app-header {
                        height: 70px;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        padding: 0 28px;
                        border-bottom: 1px solid rgba(148, 163, 184, 0.28);
                        background: rgba(255, 255, 255, 0.76);
                        backdrop-filter: blur(18px);
                        position: sticky;
                        top: 0;
                        z-index: 20;
                    }
                    .brand {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        min-width: 240px;
                    }
                    .brand-mark {
                        width: 38px;
                        height: 38px;
                        border-radius: 8px;
                        display: grid;
                        place-items: center;
                        background: linear-gradient(135deg, #1d4ed8, #2563eb 52%, #7c3aed);
                        color: #fff;
                        box-shadow: 0 12px 28px rgba(37, 99, 235, 0.22);
                    }
                    .brand strong {
                        display: block;
                        font-size: 17px;
                        line-height: 1.1;
                        letter-spacing: 0;
                    }
                    .brand span {
                        display: block;
                        color: #64748b;
                        font-size: 12px;
                        font-weight: 800;
                        margin-top: 3px;
                    }
                    .header-right {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    }
                    .online-state {
                        display: inline-flex;
                        align-items: center;
                        gap: 7px;
                        padding: 8px 11px;
                        border: 1px solid #dbe4f0;
                        border-radius: 8px;
                        background: #fff;
                        color: #334155;
                        font-size: 13px;
                        font-weight: 850;
                        white-space: nowrap;
                    }
                    .online-dot {
                        width: 8px;
                        height: 8px;
                        border-radius: 50%;
                        background: #16a34a;
                        box-shadow: 0 0 0 4px rgba(22, 163, 74, 0.12);
                    }
                    .admin-badge {
                        border: 1px solid #bfdbfe;
                        background: #eff6ff;
                        color: #1d4ed8;
                        border-radius: 999px;
                        padding: 6px 10px;
                        font-size: 12px;
                        font-weight: 900;
                    }
                    .icon-button,
                    .exit-button {
                        border: 1px solid #dbe4f0;
                        background: #fff;
                        color: #334155;
                        border-radius: 8px;
                        height: 36px;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        gap: 7px;
                        cursor: pointer;
                    }
                    .icon-button {
                        width: 36px;
                    }
                    .exit-button {
                        padding: 0 12px;
                        font-size: 13px;
                        font-weight: 850;
                    }
                    .dashboard-shell {
                        width: min(1840px, calc(100% - 36px));
                        margin: 0 auto;
                        padding: 18px 0 28px;
                        display: grid;
                        gap: 16px;
                        position: relative;
                        z-index: 1;
                    }
                    .hero-panel,
                    .dashboard-panel,
                    .roadmap-step,
                    .metric-tile,
                    .coaching-block,
                    .test-block,
                    .lesson-chip,
                    .portfolio-preview,
                    .report-sheet,
                    .next-plan-box {
                        border-radius: 8px;
                    }
                    .hero-panel {
                        position: relative;
                        overflow: hidden;
                        display: grid;
                        grid-template-columns: 250px minmax(0, 1fr) 500px;
                        gap: 18px;
                        min-height: 255px;
                        padding: 20px;
                        border: 1px solid rgba(191, 219, 254, 0.82);
                        background:
                            linear-gradient(135deg, rgba(255,255,255,0.96), rgba(239,246,255,0.9)),
                            linear-gradient(120deg, rgba(37,99,235,0.08), rgba(124,58,237,0.08));
                        box-shadow: 0 24px 80px rgba(30, 64, 175, 0.12);
                    }
                    .hero-panel::before {
                        content: "";
                        position: absolute;
                        inset: 0;
                        background:
                            linear-gradient(90deg, transparent 0, rgba(255,255,255,0.72) 50%, transparent 100%),
                            repeating-linear-gradient(90deg, rgba(37,99,235,0.07) 0 1px, transparent 1px 62px);
                        opacity: 0.34;
                        transform: translateX(-100%);
                        animation: heroScan 9s ease-in-out infinite;
                        pointer-events: none;
                    }
                    @keyframes heroScan {
                        0%, 42% { transform: translateX(-100%); opacity: 0; }
                        55% { opacity: 0.32; }
                        78%, 100% { transform: translateX(100%); opacity: 0; }
                    }
                    .student-panel,
                    .hero-copy,
                    .hero-metrics {
                        position: relative;
                        z-index: 1;
                    }
                    .student-panel {
                        border: 1px solid #dbeafe;
                        background: rgba(255, 255, 255, 0.72);
                        padding: 16px;
                        display: flex;
                        flex-direction: column;
                        gap: 14px;
                    }
                    .student-avatar {
                        width: 58px;
                        height: 58px;
                        border-radius: 50%;
                        display: grid;
                        place-items: center;
                        background: linear-gradient(135deg, #1d4ed8, #38bdf8);
                        color: #fff;
                        font-size: 22px;
                        font-weight: 950;
                        box-shadow: 0 16px 32px rgba(37, 99, 235, 0.26);
                    }
                    .student-panel h3 {
                        margin: 0;
                        font-size: 20px;
                        letter-spacing: 0;
                    }
                    .student-panel p {
                        margin: 4px 0 0;
                        color: #64748b;
                        font-size: 13px;
                        font-weight: 750;
                    }
                    .student-stats {
                        display: grid;
                        gap: 8px;
                    }
                    .student-stat {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        border-top: 1px solid #e2e8f0;
                        padding-top: 8px;
                        font-size: 12px;
                        color: #64748b;
                    }
                    .student-stat strong {
                        color: #0f172a;
                        font-size: 13px;
                    }
                    .hero-copy {
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        min-width: 0;
                    }
                    .hero-eyebrow {
                        display: inline-flex;
                        width: fit-content;
                        align-items: center;
                        gap: 8px;
                        padding: 7px 10px;
                        border: 1px solid #bfdbfe;
                        border-radius: 999px;
                        background: #eff6ff;
                        color: #1d4ed8;
                        font-size: 12px;
                        font-weight: 950;
                    }
                    .hero-copy h1 {
                        margin: 14px 0 10px;
                        font-size: clamp(30px, 3.4vw, 52px);
                        line-height: 1.05;
                        letter-spacing: 0;
                        color: #0f172a;
                        max-width: 720px;
                    }
                    .hero-copy .growth-line {
                        margin: 0;
                        color: #1e40af;
                        font-size: clamp(18px, 1.4vw, 24px);
                        font-weight: 900;
                        line-height: 1.35;
                    }
                    .hero-copy .growth-desc {
                        margin: 10px 0 0;
                        max-width: 720px;
                        color: #475569;
                        font-size: 14px;
                        line-height: 1.6;
                        font-weight: 650;
                    }
                    .growth-badges {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 8px;
                        margin-top: 16px;
                    }
                    .growth-badge {
                        display: inline-flex;
                        align-items: center;
                        gap: 7px;
                        border: 1px solid #dbe4f0;
                        border-radius: 999px;
                        background: rgba(255,255,255,0.82);
                        padding: 7px 10px;
                        color: #334155;
                        font-size: 12px;
                        font-weight: 850;
                    }
                    .growth-data-strip {
                        display: grid;
                        grid-template-columns: repeat(4, minmax(0, 1fr));
                        gap: 8px;
                        margin-top: 14px;
                    }
                    .data-signal {
                        border: 1px solid #dbe4f0;
                        border-radius: 8px;
                        background:
                            linear-gradient(180deg, rgba(255,255,255,0.92), rgba(248,250,252,0.78));
                        padding: 9px 10px;
                        display: grid;
                        grid-template-columns: 30px minmax(0,1fr);
                        gap: 8px;
                        align-items: center;
                        box-shadow: inset 0 1px 0 rgba(255,255,255,0.75);
                    }
                    .data-signal span {
                        display: block;
                        color: #64748b;
                        font-size: 10px;
                        font-weight: 900;
                        white-space: nowrap;
                    }
                    .data-signal strong {
                        display: block;
                        color: #0f172a;
                        font-size: 13px;
                        line-height: 1.15;
                        margin-top: 2px;
                    }
                    .data-signal small {
                        display: block;
                        color: #64748b;
                        font-size: 10px;
                        line-height: 1.2;
                        margin-top: 3px;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }
                    .hero-actions {
                        display: flex;
                        align-items: center;
                        gap: 9px;
                        margin-top: 18px;
                    }
                    .hero-metrics {
                        display: grid;
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                        gap: 10px;
                        align-content: stretch;
                    }
                    .metric-tile {
                        border: 1px solid #dbe4f0;
                        background: rgba(255, 255, 255, 0.78);
                        padding: 14px;
                        min-height: 105px;
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                    }
                    .metric-title {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 8px;
                        color: #64748b;
                        font-size: 12px;
                        font-weight: 900;
                    }
                    .metric-tile strong {
                        display: block;
                        margin-top: 12px;
                        font-size: 26px;
                        line-height: 1;
                        letter-spacing: 0;
                    }
                    .metric-tile p {
                        margin: 7px 0 0;
                        color: #64748b;
                        font-size: 12px;
                        line-height: 1.35;
                        font-weight: 700;
                    }
                    .insight-grid {
                        display: grid;
                        grid-template-columns: minmax(0, 1.85fr) minmax(340px, 0.82fr);
                        gap: 16px;
                    }
                    .side-stack {
                        display: grid;
                        gap: 16px;
                    }
                    .middle-grid {
                        display: grid;
                        grid-template-columns: minmax(420px, 1.25fr) minmax(320px, 0.82fr) minmax(380px, 1fr);
                        gap: 16px;
                    }
                    .bottom-grid {
                        display: grid;
                        grid-template-columns: minmax(320px, 0.9fr) minmax(440px, 1.1fr) minmax(320px, 0.92fr);
                        gap: 16px;
                    }
                    .dashboard-panel {
                        border: 1px solid #dbe4f0;
                        background: rgba(255,255,255,0.88);
                        box-shadow: 0 16px 42px rgba(15, 23, 42, 0.06);
                        padding: 18px;
                        min-width: 0;
                        position: relative;
                        overflow: hidden;
                    }
                    .dashboard-panel::before {
                        content: "";
                        position: absolute;
                        left: 0;
                        right: 0;
                        top: 0;
                        height: 2px;
                        background: linear-gradient(90deg, rgba(37,99,235,0.52), rgba(124,58,237,0.28), transparent);
                        opacity: 0.72;
                    }
                    .dashboard-panel > * {
                        position: relative;
                        z-index: 1;
                    }
                    .section-head {
                        display: flex;
                        align-items: flex-start;
                        justify-content: space-between;
                        gap: 14px;
                        margin-bottom: 14px;
                    }
                    .section-actions {
                        display: inline-flex;
                        align-items: center;
                        justify-content: flex-end;
                        gap: 8px;
                        flex-wrap: wrap;
                    }
                    .section-title h2 {
                        margin: 0;
                        font-size: 18px;
                        line-height: 1.2;
                        letter-spacing: 0;
                    }
                    .section-title p {
                        margin: 5px 0 0;
                        color: #64748b;
                        font-size: 12px;
                        line-height: 1.45;
                        font-weight: 700;
                    }
                    .roadmap-flow {
                        position: relative;
                        display: grid;
                        grid-template-columns: repeat(5, minmax(0, 1fr));
                        gap: 10px;
                    }
                    .roadmap-flow::before {
                        content: "";
                        position: absolute;
                        left: 9%;
                        right: 9%;
                        top: 36px;
                        height: 2px;
                        background: linear-gradient(90deg, #22c55e 0%, #2563eb 35%, #cbd5e1 72%, #cbd5e1 100%);
                        opacity: 0.55;
                    }
                    .roadmap-flow::after {
                        content: "";
                        position: absolute;
                        left: 9%;
                        top: 35px;
                        height: 4px;
                        width: 95px;
                        border-radius: 999px;
                        background: linear-gradient(90deg, transparent, rgba(37, 99, 235, 0.95), transparent);
                        animation: routePulse 4.8s ease-in-out infinite;
                    }
                    @keyframes routePulse {
                        0% { transform: translateX(0); opacity: 0; }
                        18% { opacity: 0.7; }
                        70% { opacity: 0.7; }
                        100% { transform: translateX(690%); opacity: 0; }
                    }
                    .roadmap-step {
                        position: relative;
                        z-index: 1;
                        border: 1px solid #dbe4f0;
                        background: #fff;
                        min-height: 196px;
                        padding: 14px;
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                    }
                    .roadmap-step.current {
                        border-color: #93c5fd;
                        background: linear-gradient(180deg, #eff6ff 0%, #ffffff 100%);
                        transform: translateY(-6px);
                        box-shadow: 0 18px 46px rgba(37, 99, 235, 0.13);
                    }
                    .roadmap-top {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 8px;
                    }
                    .step-number {
                        width: 34px;
                        height: 34px;
                        display: grid;
                        place-items: center;
                        border-radius: 50%;
                        color: #fff;
                        background: #1d4ed8;
                        font-weight: 950;
                        box-shadow: 0 10px 22px rgba(37, 99, 235, 0.2);
                    }
                    .roadmap-step h3 {
                        margin: 0;
                        font-size: 15px;
                        letter-spacing: 0;
                    }
                    .roadmap-step p {
                        margin: 0;
                        color: #64748b;
                        font-size: 12px;
                        line-height: 1.4;
                    }
                    .roadmap-record {
                        display: grid;
                        gap: 4px;
                        margin-top: auto;
                        font-size: 12px;
                        color: #475569;
                    }
                    .roadmap-record strong {
                        color: #0f172a;
                    }
                    .ai-panel {
                        border-color: #ddd6fe;
                        background:
                            linear-gradient(135deg, rgba(124,58,237,0.12), transparent 44%),
                            rgba(255,255,255,0.9);
                    }
                    .coaching-grid {
                        display: grid;
                        gap: 9px;
                    }
                    .coaching-block {
                        border: 1px solid #e2e8f0;
                        background: rgba(255,255,255,0.78);
                        padding: 10px 11px;
                    }
                    .coaching-block span {
                        display: flex;
                        align-items: center;
                        gap: 7px;
                        color: #64748b;
                        font-size: 11px;
                        font-weight: 900;
                    }
                    .coaching-block p {
                        margin: 6px 0 0;
                        color: #0f172a;
                        font-size: 13px;
                        line-height: 1.42;
                        font-weight: 780;
                    }
                    .button-grid {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 8px;
                        margin-top: 12px;
                    }
                    .test-summary {
                        display: grid;
                        grid-template-columns: repeat(5, 1fr);
                        gap: 6px;
                        margin-bottom: 12px;
                    }
                    .test-pill {
                        border: 1px solid #e2e8f0;
                        border-radius: 8px;
                        background: #fff;
                        padding: 8px 6px;
                        text-align: left;
                        min-width: 0;
                    }
                    .test-pill span {
                        display: block;
                        color: #64748b;
                        font-size: 10px;
                        font-weight: 850;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }
                    .test-pill strong {
                        display: block;
                        margin-top: 4px;
                        font-size: 12px;
                    }
                    .test-mini-bar {
                        display: block;
                        width: 100%;
                        height: 5px;
                        margin-top: 7px;
                        border-radius: 999px;
                        background: #e2e8f0;
                        overflow: hidden;
                    }
                    .test-mini-bar i {
                        display: block;
                        height: 100%;
                        border-radius: 999px;
                    }
                    .test-blocks {
                        display: grid;
                        gap: 8px;
                    }
                    .test-block {
                        border: 1px solid #e2e8f0;
                        background: #fff;
                        padding: 10px;
                    }
                    .test-block h3 {
                        margin: 0 0 7px;
                        display: flex;
                        align-items: center;
                        gap: 7px;
                        font-size: 13px;
                    }
                    .test-block ul {
                        list-style: none;
                        margin: 0;
                        padding: 0;
                        display: grid;
                        gap: 4px;
                    }
                    .test-block li {
                        color: #475569;
                        font-size: 12px;
                        line-height: 1.4;
                    }
                    .lesson-layout {
                        display: grid;
                        grid-template-columns: minmax(0, 1fr) 260px;
                        gap: 14px;
                        align-items: stretch;
                    }
                    .lesson-grid {
                        display: grid;
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                        gap: 9px;
                    }
                    .lesson-chip {
                        border: 1px solid #e2e8f0;
                        background: #fff;
                        padding: 11px;
                    }
                    .lesson-chip span {
                        display: flex;
                        align-items: center;
                        gap: 7px;
                        color: #64748b;
                        font-size: 11px;
                        font-weight: 900;
                    }
                    .lesson-chip strong {
                        display: block;
                        margin-top: 6px;
                        font-size: 13px;
                        line-height: 1.35;
                    }
                    .code-box {
                        border-radius: 8px;
                        background: #0f172a;
                        color: #dbeafe;
                        padding: 14px;
                        position: relative;
                        overflow: hidden;
                        min-height: 194px;
                        box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08);
                    }
                    .code-box::before {
                        content: "";
                        position: absolute;
                        inset: 0;
                        background: linear-gradient(90deg, transparent, rgba(96,165,250,0.13), transparent);
                        transform: translateX(-100%);
                        animation: codeSweep 4s ease-in-out infinite;
                    }
                    @keyframes codeSweep {
                        0%, 35% { transform: translateX(-100%); }
                        70%, 100% { transform: translateX(100%); }
                    }
                    .code-box pre {
                        position: relative;
                        z-index: 1;
                        margin: 0;
                        font-size: 12px;
                        line-height: 1.72;
                        white-space: pre-wrap;
                    }
                    .code-status {
                        position: relative;
                        z-index: 1;
                        display: flex;
                        gap: 7px;
                        flex-wrap: wrap;
                        margin-top: 14px;
                    }
                    .timeline-list {
                        position: relative;
                        display: grid;
                        gap: 10px;
                    }
                    .timeline-list::before {
                        content: "";
                        position: absolute;
                        left: 10px;
                        top: 10px;
                        bottom: 10px;
                        width: 2px;
                        background: #dbe4f0;
                    }
                    .timeline-item {
                        display: grid;
                        grid-template-columns: 24px minmax(0, 1fr) auto;
                        gap: 9px;
                        align-items: start;
                    }
                    .timeline-dot {
                        width: 22px;
                        height: 22px;
                        border-radius: 50%;
                        border: 4px solid #fff;
                        box-shadow: 0 0 0 1px #dbe4f0;
                        position: relative;
                        z-index: 1;
                    }
                    .timeline-item h3 {
                        margin: 0;
                        font-size: 13px;
                        line-height: 1.25;
                    }
                    .timeline-item p {
                        margin: 3px 0 0;
                        color: #64748b;
                        font-size: 12px;
                        line-height: 1.35;
                    }
                    .timeline-type,
                    .timeline-time {
                        font-size: 11px;
                        font-weight: 900;
                        color: #64748b;
                        white-space: nowrap;
                    }
                    .curriculum-list {
                        display: grid;
                        gap: 9px;
                    }
                    .curriculum-row {
                        display: grid;
                        grid-template-columns: 34px minmax(0,1fr) 42px;
                        gap: 10px;
                        align-items: center;
                        border: 1px solid #e2e8f0;
                        border-radius: 8px;
                        background: #fff;
                        padding: 10px;
                    }
                    .curriculum-row h3 {
                        margin: 0;
                        font-size: 13px;
                    }
                    .curriculum-row p {
                        margin: 3px 0 0;
                        color: #64748b;
                        font-size: 11px;
                        line-height: 1.35;
                    }
                    .curriculum-row small {
                        display: block;
                        margin-top: 5px;
                        color: #334155;
                        font-size: 11px;
                        font-weight: 850;
                    }
                    .curriculum-percent {
                        text-align: right;
                        font-size: 14px;
                        font-weight: 950;
                    }
                    .portfolio-preview {
                        display: grid;
                        grid-template-columns: 88px minmax(0,1fr);
                        gap: 14px;
                        border: 1px solid #dbe4f0;
                        background: #fff;
                        padding: 12px;
                    }
                    .doc-thumb {
                        height: 116px;
                        border-radius: 8px;
                        border: 1px solid #dbe4f0;
                        background:
                            linear-gradient(180deg, #eff6ff, #fff),
                            repeating-linear-gradient(0deg, #dbeafe 0 2px, transparent 2px 14px);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: #1d4ed8;
                    }
                    .portfolio-stats {
                        display: grid;
                        gap: 8px;
                        margin-bottom: 10px;
                    }
                    .portfolio-stats p {
                        margin: 0;
                        color: #475569;
                        font-size: 12px;
                        line-height: 1.4;
                    }
                    .heatmap {
                        display: grid;
                        grid-template-columns: repeat(14, 1fr);
                        gap: 4px;
                        margin-top: 10px;
                    }
                    .heat-cell {
                        height: 11px;
                        border-radius: 3px;
                        background: #e2e8f0;
                        animation: heatPulse 3.8s ease-in-out infinite;
                    }
                    .heat-cell.level-1 { background: #bfdbfe; }
                    .heat-cell.level-2 { background: #60a5fa; }
                    .heat-cell.level-3 { background: #2563eb; }
                    .heat-cell.level-4 { background: #1d4ed8; }
                    @keyframes heatPulse {
                        0%, 100% { opacity: 0.72; transform: scale(1); }
                        50% { opacity: 1; transform: scale(1.08); }
                    }
                    .report-sheet {
                        border: 1px solid #dbe4f0;
                        background:
                            linear-gradient(90deg, rgba(37,99,235,0.08) 0 4px, transparent 4px),
                            #fff;
                        padding: 15px 16px;
                        display: grid;
                        grid-template-columns: repeat(2, minmax(0,1fr));
                        gap: 10px 16px;
                    }
                    .report-line h3 {
                        margin: 0;
                        color: #1d4ed8;
                        font-size: 12px;
                    }
                    .report-line p {
                        margin: 5px 0 0;
                        color: #334155;
                        font-size: 13px;
                        line-height: 1.45;
                        font-weight: 700;
                    }
                    .next-plan-box {
                        border: 1px solid #fed7aa;
                        background:
                            linear-gradient(135deg, rgba(245,158,11,0.14), transparent 42%),
                            #fff;
                        padding: 14px;
                    }
                    .next-plan-list {
                        display: grid;
                        gap: 9px;
                        margin-bottom: 12px;
                    }
                    .next-plan-row {
                        display: flex;
                        justify-content: space-between;
                        gap: 10px;
                        color: #475569;
                        font-size: 12px;
                        border-bottom: 1px solid #f1f5f9;
                        padding-bottom: 8px;
                    }
                    .next-plan-row strong {
                        color: #0f172a;
                        text-align: right;
                    }
                    .ai-reason {
                        border: 1px solid #dbeafe;
                        border-radius: 8px;
                        background: #eff6ff;
                        color: #1e3a8a;
                        padding: 10px;
                        font-size: 12px;
                        line-height: 1.45;
                        font-weight: 750;
                    }
                    .evidence-orbit {
                        position: absolute;
                        right: 520px;
                        bottom: 18px;
                        width: 168px;
                        height: 98px;
                        perspective: 680px;
                        pointer-events: none;
                        opacity: 0.95;
                    }
                    .orbit-card {
                        position: absolute;
                        inset: 0;
                        border: 1px solid rgba(37,99,235,0.18);
                        border-radius: 8px;
                        background: rgba(255,255,255,0.72);
                        box-shadow: 0 12px 28px rgba(15,23,42,0.08);
                        transform-style: preserve-3d;
                        animation: float3d 5.4s ease-in-out infinite;
                    }
                    .orbit-card:nth-child(1) { transform: rotateX(12deg) rotateY(-20deg) translateZ(20px); }
                    .orbit-card:nth-child(2) { transform: rotateX(12deg) rotateY(-20deg) translate(14px, 12px) translateZ(8px); animation-delay: 0.35s; }
                    .orbit-card:nth-child(3) { transform: rotateX(12deg) rotateY(-20deg) translate(28px, 24px) translateZ(-6px); animation-delay: 0.7s; }
                    @keyframes float3d {
                        0%, 100% { margin-top: 0; }
                        50% { margin-top: -8px; }
                    }
                    .tone-icon {
                        width: 30px;
                        height: 30px;
                        border-radius: 8px;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .tone-blue { color: #1d4ed8; background: #eff6ff; border-color: #bfdbfe; }
                    .tone-green { color: #15803d; background: #f0fdf4; border-color: #bbf7d0; }
                    .tone-purple { color: #6d28d9; background: #f5f3ff; border-color: #ddd6fe; }
                    .tone-amber { color: #b45309; background: #fffbeb; border-color: #fde68a; }
                    .tone-slate { color: #475569; background: #f8fafc; border-color: #e2e8f0; }
                    .tone-bg-blue { background: linear-gradient(90deg, #60a5fa, #2563eb); }
                    .tone-bg-green { background: linear-gradient(90deg, #86efac, #16a34a); }
                    .tone-bg-purple { background: linear-gradient(90deg, #c4b5fd, #7c3aed); }
                    .tone-bg-amber { background: linear-gradient(90deg, #fcd34d, #f59e0b); }
                    .tone-bg-slate { background: linear-gradient(90deg, #cbd5e1, #64748b); }
                    .status-badge {
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        border: 1px solid currentColor;
                        border-radius: 999px;
                        padding: 4px 7px;
                        font-size: 10px;
                        font-weight: 950;
                        line-height: 1;
                        white-space: nowrap;
                    }
                    .progress-bar {
                        display: block;
                        width: 100%;
                        height: 7px;
                        border-radius: 999px;
                        background: #e2e8f0;
                        overflow: hidden;
                    }
                    .progress-bar i {
                        display: block;
                        height: 100%;
                        border-radius: 999px;
                    }
                    .action-button {
                        border: 1px solid #dbe4f0;
                        background: #fff;
                        color: #334155;
                        border-radius: 8px;
                        min-height: 34px;
                        padding: 0 11px;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        gap: 7px;
                        font-size: 12px;
                        font-weight: 900;
                        cursor: pointer;
                        white-space: nowrap;
                    }
                    .action-button.primary {
                        color: #fff;
                        border-color: #2563eb;
                        background: linear-gradient(135deg, #2563eb, #1d4ed8);
                        box-shadow: 0 12px 24px rgba(37, 99, 235, 0.22);
                    }
                    .workflow-toast {
                        position: fixed;
                        right: 24px;
                        bottom: 22px;
                        z-index: 60;
                        display: inline-flex;
                        align-items: center;
                        gap: 10px;
                        max-width: min(420px, calc(100vw - 32px));
                        border: 1px solid #bfdbfe;
                        border-radius: 8px;
                        background: rgba(255, 255, 255, 0.92);
                        color: #1e3a8a;
                        padding: 11px 13px;
                        box-shadow: 0 18px 50px rgba(30, 64, 175, 0.16);
                        backdrop-filter: blur(18px);
                        font-size: 12px;
                        font-weight: 900;
                        line-height: 1.35;
                    }
                    @media (max-width: 1500px) {
                        .hero-panel {
                            grid-template-columns: 220px minmax(0,1fr) 420px;
                        }
                        .middle-grid,
                        .bottom-grid {
                            grid-template-columns: 1fr 1fr;
                        }
                        .curriculum-panel,
                        .next-panel {
                            grid-column: 1 / -1;
                        }
                        .evidence-orbit {
                            display: none;
                        }
                    }
                    @media (max-width: 1120px) {
                        .app-header {
                            padding: 0 16px;
                        }
                        .hero-panel,
                        .insight-grid,
                        .middle-grid,
                        .bottom-grid {
                            grid-template-columns: 1fr;
                        }
                        .roadmap-flow {
                            grid-template-columns: 1fr;
                        }
                        .roadmap-flow::before,
                        .roadmap-flow::after {
                            display: none;
                        }
                        .roadmap-step.current {
                            transform: none;
                        }
                        .lesson-layout {
                            grid-template-columns: 1fr;
                        }
                    }
                    @media (max-width: 720px) {
                        .header-right .admin-badge,
                        .header-right .icon-button {
                            display: none;
                        }
                        .workflow-toast {
                            right: 10px;
                            bottom: 10px;
                        }
                        .dashboard-shell {
                            width: min(100% - 20px, 1840px);
                            padding-top: 10px;
                        }
                        .hero-metrics,
                        .growth-data-strip,
                        .paper-info,
                        .test-summary,
                        .lesson-grid,
                        .report-sheet {
                            grid-template-columns: 1fr;
                        }
                        .hero-panel,
                        .dashboard-panel {
                            padding: 14px;
                        }
                        .hero-copy h1 {
                            font-size: 30px;
                        }
                    }
                `}</style>

                <header className="app-header">
                    <div className="brand">
                        <motion.div className="brand-mark" whileHover={{ rotate: -6, scale: 1.04 }}>
                            <Braces size={22} strokeWidth={2.4} />
                        </motion.div>
                        <div>
                            <strong>코딩쏙</strong>
                            <span>성장 OS</span>
                        </div>
                    </div>

                    <div className="header-right">
                        <span className="online-state"><i className="online-dot" />{currentStudentName}</span>
                        <span className="admin-badge">학생</span>
                        <button className="icon-button" aria-label="알림"><Bell size={17} /></button>
                        <button className="icon-button" aria-label="전체화면" onClick={toggleFullscreen}><Maximize2 size={17} /></button>
                        <button className="exit-button" onClick={() => router.push("/login")}><LogOut size={15} />나가기</button>
                    </div>
                </header>

                <div className="dashboard-shell">
                    <motion.section className="hero-panel" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="student-panel">
                            <div>
                                <div className="student-avatar">{currentStudentInitial}</div>
                                <h3>{currentStudentName}</h3>
                                <p>{assignedTrackTitle} · {currentStudentGrade}</p>
                            </div>
                            <div className="student-stats">
                                <div className="student-stat"><span>현재 트랙</span><strong>{assignedTrackValue}</strong></div>
                                <div className="student-stat"><span>수업 누적</span><strong>{savedLessonCount}회</strong></div>
                                <div className="student-stat"><span>최근 성공 기록</span><strong>오류 수정 {errorFixCount}회</strong></div>
                            </div>
                            <ProgressBar value={growthPercent} tone="blue" />
                        </div>

                        <div className="hero-copy">
                            <span className="hero-eyebrow"><Sparkles size={14} />학생 성장 증거 대시보드</span>
                            <h1>{heroTitle}</h1>
                            <p className="growth-line">조건문을 직접 고치고, 실행 결과를 설명하는 단계까지 성장했습니다.</p>
                            <p className="growth-desc">
                                오늘은 조건문 실행 흐름을 설명하고, 직접 고친 코드와 실행 결과를 성장 기록으로 남기는 날입니다.
                            </p>
                            <div className="growth-badges">
                                <span className="growth-badge"><CheckCircle2 size={14} />코드 실행 성공</span>
                                <span className="growth-badge"><Bug size={14} />오류 수정 경험</span>
                                <span className="growth-badge"><MessageSquareText size={14} />설명력 향상</span>
                            </div>
                            <div className="growth-data-strip">
                                {dataSignals.map((signal) => (
                                    <div className="data-signal" key={signal.label}>
                                        <ToneIcon icon={signal.icon} tone={signal.tone} />
                                        <div>
                                            <span>{signal.label}</span>
                                            <strong>{signal.value}</strong>
                                            <small>{signal.desc}</small>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="hero-actions">
                                <ActionButton icon={ClipboardCheck} primary onClick={() => router.push("/dashboard/learning/level-test")}>진단 보기</ActionButton>
                                <ActionButton icon={Code2} onClick={() => router.push("/dashboard/compiler")}>코드 작성</ActionButton>
                            </div>
                        </div>

                        <div className="hero-metrics">
                            {effectiveMetrics.map((metric, index) => {
                                const Icon = metric.icon;
                                return (
                                    <motion.div
                                        className="metric-tile"
                                        key={metric.title}
                                        initial={{ opacity: 0, y: 14 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.08 + index * 0.06 }}
                                        whileHover={{ y: -3 }}
                                    >
                                        <div className="metric-title">
                                            <span>{metric.title}</span>
                                            <ToneIcon icon={Icon} tone={metric.tone} />
                                        </div>
                                        <div>
                                            <strong>{metric.value}</strong>
                                            <p>{metric.desc}</p>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        <div className="evidence-orbit" aria-hidden="true">
                            <div className="orbit-card" />
                            <div className="orbit-card" />
                            <div className="orbit-card" />
                        </div>
                    </motion.section>

                    <section className="insight-grid">
                        <motion.section className="dashboard-panel" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }}>
                            <div className="section-head">
                                <SectionTitle title="내 성장 로드맵" desc="트랙을 먼저 고르지 않고, 진단과 공통기초 기록으로 추천 경로를 만듭니다." />
                                <ActionButton icon={ClipboardCheck} onClick={() => router.push("/dashboard/learning/level-test")}>진단 보기</ActionButton>
                            </div>
                            <div className="roadmap-flow">
                                {effectiveRoadmapSteps.map((step, index) => {
                                    const Icon = step.icon;
                                    return (
                                        <motion.article
                                            className={`roadmap-step ${step.current ? "current" : ""}`}
                                            key={step.title}
                                            initial={{ opacity: 0, y: 18 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true, amount: 0.35 }}
                                            transition={{ delay: index * 0.05 }}
                                        >
                                            <div className="roadmap-top">
                                                <span className="step-number">{step.number}</span>
                                                <ToneIcon icon={Icon} tone={step.tone} />
                                            </div>
                                            <div>
                                                <h3>{step.title}</h3>
                                                <p>{step.desc}</p>
                                            </div>
                                            <StatusBadge tone={step.tone}>{step.status}</StatusBadge>
                                            <div className="roadmap-record">
                                                <span>완료 기록 <strong>{step.record}</strong></span>
                                                <span>다음 행동 <strong>{step.action}</strong></span>
                                            </div>
                                            <ProgressBar value={step.progress} tone={step.tone} />
                                        </motion.article>
                                    );
                                })}
                            </div>
                        </motion.section>

                        <div className="side-stack">
                            <motion.section className="dashboard-panel ai-panel" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.35 }}>
                                <div className="section-head">
                                    <SectionTitle title="오늘의 AI 코칭" desc="정답 대신 성장 기록을 만드는 방식" />
                                    <ToneIcon icon={Bot} tone="purple" />
                                </div>
                                <div className="coaching-grid">
                                    {coachingBlocks.map((block) => (
                                        <div className="coaching-block" key={block.label}>
                                            <span><CircleDot size={12} />{block.label}</span>
                                            <p>{block.content}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="button-grid">
                                    <ActionButton icon={WandSparkles} onClick={() => runCoachAction("힌트 만들기")}>힌트 만들기</ActionButton>
                                    <ActionButton icon={Bug} onClick={() => runCoachAction("오류 설명")}>오류 설명</ActionButton>
                                    <ActionButton icon={Workflow} onClick={() => runCoachAction("코드 비교")}>코드 비교</ActionButton>
                                    <ActionButton icon={ScrollText} onClick={generateReportDraft}>리포트 초안</ActionButton>
                                </div>
                            </motion.section>

                            <motion.section className="dashboard-panel" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.35 }}>
                                <div className="section-head">
                                    <SectionTitle title="최근 테스트 결과" desc={diagnostic ? "저장된 진단 결과를 대시보드에 반영했습니다." : "성향 진단 + 기초 확인"} />
                                    <StatusBadge tone={diagnostic ? "green" : "blue"}>{diagnostic ? "실시간 반영" : "분석 완료"}</StatusBadge>
                                </div>
                                <div className="test-summary">
                                    {testSummaryItems.map((item) => (
                                        <div className="test-pill" key={item.label}>
                                            <span>{item.label}</span>
                                            <strong>{item.value}</strong>
                                            <em className="test-mini-bar">
                                                <i className={`tone-bg-${item.tone}`} style={{ width: `${item.percent}%` }} />
                                            </em>
                                        </div>
                                    ))}
                                </div>
                                <div className="test-blocks">
                                    {effectiveTestBlocks.map((block) => (
                                        <div className="test-block" key={block.title}>
                                            <h3><CircleDot className={`tone-${block.tone}`} size={13} />{block.title}</h3>
                                            <ul>
                                                {block.items.map((item) => <li key={item}>· {item}</li>)}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </motion.section>
                        </div>
                    </section>

                    <section className="middle-grid">
                        <motion.section className="dashboard-panel" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }}>
                            <div className="section-head">
                                <SectionTitle title="오늘의 수업 기록" desc="PNG 자료를 보고 끝나는 수업이 아니라, 코드와 실행 결과를 남기는 수업입니다." />
                                <div className="section-actions">
                                    <StatusBadge tone="green">포트폴리오 저장 가능</StatusBadge>
                                    <ActionButton icon={Database} onClick={saveLessonRecord}>기록 저장</ActionButton>
                                </div>
                            </div>
                            <div className="lesson-layout">
                                <div className="lesson-grid">
                                    <div className="lesson-chip"><span><Target size={13} />최근 목표</span><strong>{displayedLesson?.title ?? "저장된 수업 기록 없음"}</strong></div>
                                    <div className="lesson-chip"><span><Play size={13} />수업 요약</span><strong>{displayedLesson?.summary || "기록 없음"}</strong></div>
                                    <div className="lesson-chip"><span><Code2 size={13} />코드 기록</span><strong>{hasDisplayedLesson ? "코드/실행 결과 연결됨" : "저장 전"}</strong></div>
                                    <div className="lesson-chip"><span><CheckCircle2 size={13} />실행 결과</span><strong>{displayedLesson?.result || "실행 기록 없음"}</strong></div>
                                    <div className="lesson-chip"><span><MessageSquareText size={13} />피드백</span><strong>{displayedLesson?.feedback || "피드백 기록 없음"}</strong></div>
                                    <div className="lesson-chip"><span><FolderCheck size={13} />저장 상태</span><strong>{hasDisplayedLesson ? "성장 기록 저장됨" : "저장 필요"}</strong></div>
                                </div>
                                <div className="code-box">
                                    <pre>{displayedLesson?.code || "저장된 코드 기록 없음"}</pre>
                                    <div className="code-status">
                                        <StatusBadge tone="green">실행 성공</StatusBadge>
                                        <StatusBadge tone="amber">오류 수정 1회</StatusBadge>
                                    </div>
                                </div>
                            </div>
                        </motion.section>

                        <motion.section className="dashboard-panel" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }}>
                            <div className="section-head">
                                <SectionTitle title="성장 타임라인" desc="코드·실행·프로젝트·피드백 누적" />
                            </div>
                            <div className="timeline-list">
                                {effectiveTimelineItems.map((item) => (
                                    <div className="timeline-item" key={item.title}>
                                        <span className={`timeline-dot tone-bg-${item.tone}`} />
                                        <div>
                                            <span className="timeline-type">{item.type}</span>
                                            <h3>{item.title}</h3>
                                            <p>{item.desc}</p>
                                        </div>
                                        <span className="timeline-time">{item.time}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.section>

                        <motion.section className="dashboard-panel curriculum-panel" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }}>
                            <div className="section-head">
                                <SectionTitle title="내 커리큘럼" desc="책 표지는 교재 자산으로 쓰고, 진행률은 성장 기록과 연결합니다." />
                            </div>
                            <div className="curriculum-list">
                                {effectiveCurriculumItems.map((item) => (
                                    <article className="curriculum-row" key={item.name}>
                                        <ToneIcon icon={BookIconFor(item.name)} tone={item.tone} />
                                        <div>
                                            <h3>{item.name}</h3>
                                            <p>{item.desc} · {item.stage}</p>
                                            <small>완료 기록 {item.records} · 다음 목표 {item.next}</small>
                                            <ProgressBar value={item.progress} tone={item.tone} />
                                        </div>
                                        <div className="curriculum-percent">{item.progress}%</div>
                                    </article>
                                ))}
                            </div>
                        </motion.section>
                    </section>

                    <section className="bottom-grid">
                        <motion.section className="dashboard-panel" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }}>
                            <div className="section-head">
                                <SectionTitle title="포트폴리오 저장 기록" desc="코드, 실행 결과, 선생님 피드백이 함께 쌓입니다." />
                            </div>
                            <div className="portfolio-preview">
                                <div className="doc-thumb"><FileCheck2 size={34} strokeWidth={1.8} /></div>
                                <div>
                                    <div className="portfolio-stats">
                                        <p><strong>저장된 성장 기록:</strong> {savedPortfolioCount}개</p>
                                        <p><strong>최근 저장:</strong> {latestPortfolioTitle}</p>
                                        <p><strong>포함 자료:</strong> {portfolioRecords[0]?.includes ?? "코드, 실행 결과, 선생님 피드백"}</p>
                                        <p><strong>대표 기록:</strong> {representativeRecord}</p>
                                    </div>
                                    <div className="heatmap" aria-label="성장 기록 저장 밀도">
                                        {evidenceCells.map((level, index) => (
                                            <span
                                                className={`heat-cell level-${level}`}
                                                key={`${level}-${index}`}
                                                style={{ animationDelay: `${index * 0.04}s` }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="hero-actions">
                                <ActionButton icon={FolderCheck} onClick={() => setWorkflowNotice(`최근 포트폴리오: ${latestPortfolioTitle}`)}>포트폴리오 보기</ActionButton>
                                <ActionButton icon={Award} onClick={savePortfolioRecord}>대표 기록 선택</ActionButton>
                            </div>
                        </motion.section>

                        <motion.section className="dashboard-panel" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }}>
                            <div className="section-head">
                                <SectionTitle title="학부모 리포트 미리보기" desc="학부모가 읽기 좋은 성장 문장으로 정리합니다." />
                                <StatusBadge tone="green">{reportStatus}</StatusBadge>
                            </div>
                            <div className="report-sheet">
                                <div className="report-line"><h3>이번 수업 요약</h3><p>{displayedReport.summary}</p></div>
                                <div className="report-line"><h3>잘한 점</h3><p>{displayedReport.strength}</p></div>
                                <div className="report-line"><h3>보완할 점</h3><p>{displayedReport.improvement}</p></div>
                                <div className="report-line"><h3>다음 목표</h3><p>{displayedReport.nextGoal}</p></div>
                            </div>
                            <div className="hero-actions">
                                <ActionButton icon={ScrollText} primary onClick={generateReportDraft}>리포트 작성</ActionButton>
                                <ActionButton icon={FileText} onClick={() => setWorkflowNotice(`리포트 미리보기: ${displayedReport.nextGoal}`)}>미리보기</ActionButton>
                            </div>
                        </motion.section>

                        <motion.section className="dashboard-panel next-panel" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }}>
                            <div className="section-head">
                                <SectionTitle title="다음 수업 추천" desc="학생의 현재 기록을 기준으로 다음 행동을 정합니다." />
                                <ToneIcon icon={ShieldCheck} tone="amber" />
                            </div>
                            <div className="next-plan-box">
                                <div className="next-plan-list">
                                    <div className="next-plan-row"><span>추천 주제</span><strong>{displayedNextPlan.topic}</strong></div>
                                    <div className="next-plan-row"><span>이어서 학습</span><strong>{displayedNextPlan.next}</strong></div>
                                    <div className="next-plan-row"><span>추천 방식</span><strong>{displayedNextPlan.method}</strong></div>
                                    <div className="next-plan-row"><span>추천 트랙</span><strong>{displayedNextPlan.track}</strong></div>
                                </div>
                                <div className="ai-reason">
                                    AI 추천 이유: {displayedNextPlan.reason}
                                </div>
                            </div>
                            <div className="hero-actions">
                                <ActionButton icon={ClipboardCheck} primary onClick={saveNextPlan}>수업 계획 만들기</ActionButton>
                                <ActionButton icon={ChevronRight} onClick={() => runCoachAction("조건문 추가 문제 추천")}>문제 추천</ActionButton>
                            </div>
                        </motion.section>
                    </section>
                </div>

                <motion.div
                    className="workflow-toast"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={workflowNotice}
                >
                    <Database size={16} />
                    <span>{workflowNotice}</span>
                </motion.div>
            </main>
        </MotionConfig>
    );
}

function BookIconFor(name: string): LucideIcon {
    if (name === "공통기초") return Braces;
    if (name === "Python") return Code2;
    if (name === "C++") return Workflow;
    if (name === "피지컬컴퓨팅") return Play;
    return Bot;
}
