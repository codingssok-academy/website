"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, MotionConfig } from "framer-motion";
import {
    readLocalTrackAssignments,
    upsertLocalTrackAssignment,
    type GrowthTrackId,
} from "@/lib/growth-os-client";
import { createClient, isSupabaseConfigured } from "@/lib/supabase";
import { buildStudentAuthEmail, buildStudentAuthPassword } from "@/lib/auth-bridge";
import {
    Activity,
    BarChart3,
    ClipboardCheck,
    Code2,
    Database,
    FileText,
    FolderCheck,
    GitBranch,
    MessageSquareText,
    Search,
    ShieldCheck,
    Target,
    Users,
} from "lucide-react";

type TrackId = GrowthTrackId;
type TrackTone = "blue" | "green" | "purple" | "amber" | "slate";

interface StudentTrackRow {
    id: string;
    name: string;
    grade: string;
    school: string;
    status: string;
    currentTrack: TrackId;
    recommendedTrack: TrackId;
    assignedTrack: TrackId;
    confidence: number;
    diagnosticScore: number;
    lessonRecords: number;
    codeRuns: number;
    errorFixes: number;
    portfolioRecords: number;
    reportStatus: string;
    nextGoal: string;
    loginPin?: string | null;
    authUserId?: string | null;
    evidence: string[];
    missing: string[];
    note: string;
    lastUpdated: string;
}

interface StoredLessonRecord {
    id: string;
    studentId?: string;
    studentName?: string;
}

interface StoredPortfolioRecord {
    id: string;
    studentId?: string;
    studentName?: string;
}

interface StoredReportDraft {
    studentId?: string;
    studentName?: string;
    status?: string;
    nextGoal?: string;
}

interface StoredNextLessonPlan {
    studentId?: string;
    studentName?: string;
    topic?: string;
}

interface LocalStudentSignupRow {
    id: string;
    name: string;
    grade?: string | null;
    pin?: string | null;
    status?: string | null;
    auth_user_id?: string | null;
    savedAt?: string | null;
}

interface GrowthAuditStudent {
    id: string;
    name: string;
    hasAuth: boolean;
    counts: {
        logins: number;
        diagnostics: number;
        lessons: number;
        codeRuns?: number;
        errorFixes?: number;
        activityLogs?: number;
        progressRecords?: number;
        portfolios: number;
        reports: number;
        plans: number;
        assignments: number;
        notionFeedbacks: number;
    };
    gaps: string[];
}

interface GrowthAuditResponse {
    checkedAt: string;
    source: {
        notion: {
            configured: boolean;
            feedbackCount: number;
            propertyNames: string[];
        };
    };
    totals: {
        students: number;
        allStudents?: number;
        adminExcluded?: number;
        studentsWithPin?: number;
        diagnosticResults: number;
        lessonRecords: number;
        codeSubmissions?: number;
        compilerActivities?: number;
        studentActivityLogs?: number;
        userProgress?: number;
        portfolioRecords: number;
        parentReports: number;
        nextLessonPlans: number;
        trackAssignments: number;
        loginEvents: number;
        studentsWithDataGaps: number;
    };
    loginSummary: {
        studentsWithAuth: number;
        studentsWithoutAuth: number;
        eventsByType: Record<string, number>;
    };
    students: GrowthAuditStudent[];
    optionalMissing?: string[];
    errors?: string[];
}

interface TrackStudentsResponse {
    checkedAt: string;
    source?: {
        supabase?: boolean;
        serviceRole?: boolean;
    };
    totals?: Record<string, number>;
    students?: StudentTrackRow[];
    optionalMissing?: string[];
    errors?: string[];
    error?: string;
}

const TRACK_META: Record<TrackId, { title: string; desc: string; tone: TrackTone }> = {
    공통기초: {
        title: "공통기초",
        desc: "진단 후 4주 동안 컴퓨터기초, 코딩기초, 사고력 기록을 모으는 단계",
        tone: "blue",
    },
    A: {
        title: "A · C++/정올",
        desc: "구현력, 알고리즘, 대회 기록 중심",
        tone: "green",
    },
    B: {
        title: "B · Python/프로젝트",
        desc: "Python, AI 협업, GitHub 포트폴리오 중심",
        tone: "purple",
    },
    C: {
        title: "C · 기초/흥미",
        desc: "컴퓨터기초, 엔트리, AI 체험, 자신감 회복 중심",
        tone: "amber",
    },
    D: {
        title: "D · 피지컬컴퓨팅",
        desc: "아두이노, 센서, 회로, 시연 영상 중심",
        tone: "slate",
    },
};

const DATA_COLUMNS = [
    { key: "diagnostic", label: "진단/정확도", icon: ClipboardCheck },
    { key: "lesson", label: "수업", icon: FileText },
    { key: "code", label: "코드", icon: Code2 },
    { key: "portfolio", label: "포트폴리오", icon: FolderCheck },
    { key: "report", label: "리포트", icon: MessageSquareText },
    { key: "plan", label: "다음 계획", icon: Target },
] as const;

function buildLocalSignupStudent(row: LocalStudentSignupRow): StudentTrackRow {
    return {
        id: row.id,
        name: row.name,
        grade: row.grade ?? "학년 미입력",
        school: "회원가입 계정",
        status: row.status === "deactivated" ? "비활성" : "배정 필요",
        currentTrack: "공통기초",
        recommendedTrack: "공통기초",
        assignedTrack: "공통기초",
        confidence: 0,
        diagnosticScore: 0,
        lessonRecords: 0,
        codeRuns: 0,
        errorFixes: 0,
        portfolioRecords: 0,
        reportStatus: "초안 필요",
        nextGoal: "진단 테스트 후 트랙 배정",
        loginPin: row.pin ?? null,
        authUserId: row.auth_user_id ?? null,
        evidence: ["회원가입"],
        missing: ["진단 테스트", "수업 기록", "학부모 리포트"],
        note: "회원가입은 완료됐고, 진단과 수업 기록을 연결해야 합니다.",
        lastUpdated: row.savedAt ? new Date(row.savedAt).toLocaleDateString("ko-KR") : "가입",
    };
}

function readArray<T>(key: string): T[] {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed as T[] : [];
    } catch {
        return [];
    }
}

function dataCompleteness(student: StudentTrackRow) {
    const total = DATA_COLUMNS.length;
    const done = [
        student.diagnosticScore > 0,
        student.lessonRecords > 0,
        student.codeRuns > 0,
        student.portfolioRecords > 0,
        student.reportStatus !== "초안 필요",
        student.nextGoal !== "다음 목표 입력 필요" && !student.missing.includes("다음 수업 계획"),
    ].filter(Boolean).length;
    return Math.round((done / total) * 100);
}

function recommendStatus(student: StudentTrackRow) {
    if (student.assignedTrack === student.recommendedTrack) return "추천 일치";
    if (student.assignedTrack === "공통기초") return "보류";
    return "수동 조정";
}

export default function TrackAssignmentAdminPage() {
    const router = useRouter();
    const [students, setStudents] = useState<StudentTrackRow[]>([]);
    const [selectedId, setSelectedId] = useState("");
    const [query, setQuery] = useState("");
    const [trackFilter, setTrackFilter] = useState<TrackId | "전체">("전체");
    const [notice, setNotice] = useState("Supabase 실제 학생 데이터를 불러오는 중입니다.");
    const [remoteConnected, setRemoteConnected] = useState(false);
    const [loadingStudents, setLoadingStudents] = useState(true);
    const [audit, setAudit] = useState<GrowthAuditResponse | null>(null);
    const [auditLoading, setAuditLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const applyLocalRows = (fallbackNotice?: string) => {
            const lessons = readArray<StoredLessonRecord>("codingssok_lesson_records");
            const portfolio = readArray<StoredPortfolioRecord>("codingssok_portfolio_records");
            const reports = readArray<StoredReportDraft>("codingssok_parent_reports");
            const plans = readArray<StoredNextLessonPlan>("codingssok_next_lesson_plans");
            const assignments = readLocalTrackAssignments();
            const localSignups = readArray<LocalStudentSignupRow>("codingssok_local_students");

            const rows = localSignups
                .filter((signup) => signup.id && signup.name)
                .map((signup) => {
                    const student = buildLocalSignupStudent(signup);
                const assignment = assignments.find((item) => item.studentId === student.id);
                const studentLessons = lessons.filter((item) => item.studentId === student.id || item.studentName === student.name);
                const studentPortfolio = portfolio.filter((item) => item.studentId === student.id || item.studentName === student.name);
                const studentReports = reports.filter((item) => item.studentId === student.id || item.studentName === student.name);
                const studentPlans = plans.filter((item) => item.studentId === student.id || item.studentName === student.name);
                const reportStatus = studentReports[0]?.status ?? assignment?.reportStatus ?? student.reportStatus;
                return {
                    ...student,
                    status: assignment ? (assignment.track === "공통기초" ? "공통기초 유지" : "배정 완료") : student.status,
                    recommendedTrack: assignment?.recommendedTrack ?? student.recommendedTrack,
                    assignedTrack: assignment?.track ?? student.assignedTrack,
                    confidence: assignment?.confidence ?? student.confidence,
                    lessonRecords: studentLessons.length,
                    codeRuns: 0,
                    portfolioRecords: studentPortfolio.length,
                    reportStatus,
                    nextGoal: assignment?.nextGoal ?? studentReports[0]?.nextGoal ?? studentPlans[0]?.topic ?? student.nextGoal,
                    loginPin: signup.pin ?? student.loginPin ?? null,
                    authUserId: signup.auth_user_id ?? student.authUserId ?? null,
                    evidence: Array.from(new Set([
                        ...student.evidence,
                        ...(assignment ? ["트랙 배정"] : []),
                        ...(studentLessons.length ? ["수업 기록"] : []),
                        ...(studentPortfolio.length ? ["포트폴리오"] : []),
                        ...(studentReports.length ? ["학부모 리포트"] : []),
                        ...(studentPlans.length ? ["다음 수업 계획"] : []),
                    ])),
                    missing: [
                        !studentLessons.length ? "수업 기록" : null,
                        !studentPortfolio.length ? "포트폴리오" : null,
                        !studentReports.length ? "학부모 리포트" : null,
                        !studentPlans.length ? "다음 수업 계획" : null,
                        !assignment ? "트랙 배정" : null,
                    ].filter(Boolean) as string[],
                    lastUpdated: assignment?.savedAt
                        ? new Date(assignment.savedAt).toLocaleDateString("ko-KR")
                        : student.lastUpdated,
                };
                });

            if (!cancelled) {
                setStudents(rows);
                setSelectedId(rows[0]?.id ?? "");
                setRemoteConnected(false);
                setLoadingStudents(false);
                setNotice(fallbackNotice ?? (rows.length
                    ? "Supabase 연결 전이라 현재 브라우저의 실제 회원가입 기록만 표시합니다."
                    : "실제 학생 데이터가 없습니다. Supabase 학생 테이블 또는 회원가입 기록이 연결되면 여기에 표시됩니다."));
            }
        };

        void (async () => {
            setLoadingStudents(true);
            try {
                if (!isSupabaseConfigured()) {
                    applyLocalRows("Supabase 브라우저 환경변수가 없어 실제 로컬 회원가입 기록만 표시합니다.");
                    return;
                }

                const response = await fetch("/api/teacher/growth-os/students", { cache: "no-store" });
                const data = await response.json() as TrackStudentsResponse;

                if (!response.ok || !Array.isArray(data.students)) {
                    throw new Error(data.error || "실제 학생 데이터를 불러오지 못했습니다.");
                }

                if (!cancelled) {
                    const rows = data.students;
                    setStudents(rows);
                    setSelectedId(rows[0]?.id ?? "");
                    setRemoteConnected(Boolean(data.source?.supabase));
                    setLoadingStudents(false);
                    setNotice(rows.length
                        ? `실제 Supabase 학생 ${rows.length}명을 불러왔습니다. 비밀번호와 성장 데이터는 서버 API에서 직접 연결됩니다.`
                        : "Supabase에 표시할 실제 학생 계정이 없습니다. 빈 상태로 표시합니다.");

                    if (data.errors?.length) {
                        setNotice(`실제 학생 ${rows.length}명 연결 완료. 일부 데이터 테이블 확인 필요: ${data.errors.slice(0, 2).join(" / ")}`);
                    } else if (data.optionalMissing?.length) {
                        setNotice(`실제 학생 ${rows.length}명 연결 완료. 성장 OS 확장 테이블 ${data.optionalMissing.length}개는 아직 생성 전이라 운영 테이블 기준으로 표시합니다.`);
                    }
                }
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                applyLocalRows(`Supabase 실제 데이터 조회 실패: ${message}. 실제 로컬 회원가입 기록만 표시합니다.`);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    const filteredStudents = useMemo(() => students.filter((student) => {
        const matchesQuery = `${student.name} ${student.grade} ${student.school}`.toLowerCase().includes(query.toLowerCase());
        const matchesTrack = trackFilter === "전체" || student.assignedTrack === trackFilter || student.recommendedTrack === trackFilter;
        return matchesQuery && matchesTrack;
    }), [students, query, trackFilter]);

    const selected = students.find((student) => student.id === selectedId) ?? filteredStudents[0] ?? null;
    const selectedAudit = selected ? audit?.students.find((student) => student.id === selected.id || student.name === selected.name) : undefined;
    const auditRows = useMemo(() => (
        audit?.students
            .slice()
            .sort((a, b) => b.gaps.length - a.gaps.length || a.name.localeCompare(b.name, "ko-KR"))
            ?? []
    ), [audit]);
    const needAssignment = students.filter((student) => student.status.includes("배정 필요") || student.missing.includes("트랙 배정")).length;
    const avgCompleteness = students.length ? Math.round(students.reduce((sum, student) => sum + dataCompleteness(student), 0) / students.length) : 0;
    const reportReady = students.filter((student) => student.reportStatus !== "초안 필요").length;
    const assignedCount = students.filter((student) => student.assignedTrack !== "공통기초").length;

    const runAudit = async () => {
        setAuditLoading(true);
        try {
            const response = await fetch("/api/teacher/growth-os/audit", { cache: "no-store" });
            const data = await response.json() as Partial<GrowthAuditResponse> & { error?: string };

            if (!response.ok || !data.totals || !data.students) {
                throw new Error(data.error || "실데이터 점검을 불러오지 못했습니다.");
            }

            const auditData = data as GrowthAuditResponse;
            setAudit(auditData);
            setNotice(`실데이터 점검 완료: 대상 ${auditData.totals.students}명 · 학습활동 ${auditData.totals.studentActivityLogs ?? 0}건 · 정확도 ${auditData.totals.userProgress ?? 0}건 · Notion ${auditData.source.notion.feedbackCount}건`);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            const friendlyMessage = message.includes("Supabase service role")
                ? "서버 Supabase 서비스 키 설정이 필요합니다."
                : message.includes("로그인") || message.includes("인증")
                    ? "운영 교사/관리자 로그인과 서버 환경변수가 필요합니다."
                    : message;
            setNotice(`실데이터 점검 실패: ${friendlyMessage}`);
        } finally {
            setAuditLoading(false);
        }
    };

    const viewAsStudent = async (student: StudentTrackRow) => {
        const previousUser = localStorage.getItem("codingssok_user");
        const previousRole = localStorage.getItem("codingssok_role");

        if (isSupabaseConfigured() && !student.loginPin) {
            setNotice(`${student.name} 학생의 비밀번호가 조회되지 않아 실제 학생 세션으로 전환할 수 없습니다.`);
            return;
        }

        try {
            let authUserId = student.authUserId ?? `${student.id}-preview-auth`;

            if (isSupabaseConfigured()) {
                const sb = createClient();
                const signInStudent = () => sb.auth.signInWithPassword({
                    email: buildStudentAuthEmail(student.id),
                    password: buildStudentAuthPassword(student.id, student.loginPin ?? ""),
                });

                let { data, error } = await signInStudent();

                if ((error || !data.user) && remoteConnected) {
                    const prepareResponse = await fetch("/api/teacher/growth-os/student-auth", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ studentId: student.id }),
                    });
                    const prepareResult = await prepareResponse.json().catch(() => ({})) as { authUserId?: string; error?: string };
                    if (!prepareResponse.ok) {
                        throw new Error(prepareResult.error || "학생 Auth 계정을 준비하지 못했습니다.");
                    }

                    setStudents((prev) => prev.map((item) => (
                        item.id === student.id
                            ? { ...item, authUserId: prepareResult.authUserId ?? item.authUserId }
                            : item
                    )));

                    const retry = await signInStudent();
                    data = retry.data;
                    error = retry.error;
                }

                if (error || !data.user) throw error ?? new Error("학생 계정 로그인에 실패했습니다.");
                authUserId = data.user.id;
            }

            let parsedPreviousUser: unknown = null;
            try {
                parsedPreviousUser = previousUser ? JSON.parse(previousUser) : null;
            } catch {
                parsedPreviousUser = previousUser;
            }

            localStorage.setItem("codingssok_admin_snapshot", JSON.stringify({
                user: parsedPreviousUser,
                role: previousRole,
                savedAt: new Date().toISOString(),
            }));
            localStorage.setItem("codingssok_impersonation", JSON.stringify({
                studentId: student.id,
                studentName: student.name,
                from: "track-assignment-admin",
                savedAt: new Date().toISOString(),
            }));
            localStorage.setItem("codingssok_user", JSON.stringify({
                id: authUserId,
                studentId: student.id,
                name: student.name,
                email: buildStudentAuthEmail(student.id),
                role: "student",
                grade: student.grade,
                level: 1,
                xp: 0,
                streak: 0,
                joinedAt: new Date().toISOString(),
            }));
            localStorage.setItem("codingssok_role", "student");
            document.cookie = `codingssok_session=${authUserId}; path=/; max-age=${60 * 60 * 24 * 30}; Secure; SameSite=Lax`;
            window.location.href = "/dashboard/learning";
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            setNotice(`${student.name} 학생 계정 전환 실패: ${message}`);
        }
    };

    const assignTrack = async (track: TrackId) => {
        if (!selected) {
            setNotice("트랙을 배정할 실제 학생을 먼저 선택해야 합니다.");
            return;
        }

        const savedAt = new Date().toISOString();
        setStudents((prev) => prev.map((student) => (
            student.id === selected.id
                ? { ...student, assignedTrack: track, status: track === "공통기초" ? "공통기초 유지" : "배정 완료", lastUpdated: "방금 전" }
                : student
        )));

        if (!isSupabaseConfigured() || !remoteConnected) {
            upsertLocalTrackAssignment({
                studentId: selected.id,
                studentName: selected.name,
                track,
                recommendedTrack: selected.recommendedTrack,
                confidence: selected.confidence,
                reason: selected.note,
                nextGoal: selected.nextGoal,
                reportStatus: selected.reportStatus,
                savedAt,
                source: "local-admin",
            });
            setNotice(`${selected.name} 학생을 ${TRACK_META[track].title}으로 로컬 배정했습니다. Supabase 연결 후 DB 기준으로 다시 저장해야 합니다.`);
            return;
        }

        try {
            const response = await fetch("/api/teacher/growth-os/students", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    studentId: selected.id,
                    track,
                    recommendedTrack: selected.recommendedTrack,
                    confidence: selected.confidence,
                    reason: selected.note,
                }),
            });
            const result = await response.json().catch(() => ({})) as { error?: string };
            if (!response.ok) throw new Error(result.error || "트랙 배정 저장에 실패했습니다.");
            setNotice(`${selected.name} 학생을 ${TRACK_META[track].title}으로 Supabase DB에 저장했습니다.`);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            setRemoteConnected(false);
            setNotice(`${selected.name} 학생 트랙은 화면에만 반영됐습니다. Supabase 저장 실패: ${message}`);
        }
    };

    return (
        <MotionConfig transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
            <main className="track-admin">
                <style>{`
                    .track-admin {
                        min-height: 100vh;
                        background:
                            linear-gradient(115deg, rgba(37,99,235,0.11), transparent 35%),
                            linear-gradient(250deg, rgba(124,58,237,0.08), transparent 40%),
                            #f5f8fc;
                        color: #0f172a;
                        font-family: Pretendard, Inter, system-ui, sans-serif;
                        padding: 22px;
                    }
                    .admin-shell {
                        width: min(1840px, 100%);
                        margin: 0 auto;
                        display: grid;
                        gap: 16px;
                    }
                    .admin-top {
                        min-height: 104px;
                        border: 1px solid #dbe4f0;
                        border-radius: 8px;
                        background: rgba(255,255,255,0.88);
                        box-shadow: 0 18px 54px rgba(15,23,42,0.07);
                        padding: 18px;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 18px;
                    }
                    .admin-kicker {
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                        color: #1d4ed8;
                        background: #eff6ff;
                        border: 1px solid #bfdbfe;
                        border-radius: 999px;
                        padding: 6px 10px;
                        font-size: 12px;
                        font-weight: 950;
                    }
                    .admin-kicker.remote {
                        color: #047857;
                        background: #ecfdf5;
                        border-color: #a7f3d0;
                    }
                    .admin-kicker.local {
                        color: #92400e;
                        background: #fffbeb;
                        border-color: #fde68a;
                    }
                    .admin-top h1 {
                        margin: 10px 0 6px;
                        font-size: 30px;
                        line-height: 1.12;
                        letter-spacing: 0;
                    }
                    .admin-top p {
                        margin: 0;
                        color: #64748b;
                        font-size: 13px;
                        line-height: 1.45;
                        font-weight: 750;
                    }
                    .top-actions {
                        display: flex;
                        gap: 8px;
                        flex-wrap: wrap;
                        justify-content: flex-end;
                    }
                    .admin-btn {
                        border: 1px solid #dbe4f0;
                        background: #fff;
                        color: #334155;
                        border-radius: 8px;
                        min-height: 36px;
                        padding: 0 12px;
                        display: inline-flex;
                        align-items: center;
                        gap: 7px;
                        font-size: 12px;
                        font-weight: 900;
                        cursor: pointer;
                        white-space: nowrap;
                    }
                    .admin-btn.primary {
                        border-color: #2563eb;
                        background: #2563eb;
                        color: #fff;
                        box-shadow: 0 12px 28px rgba(37,99,235,0.20);
                    }
                    .admin-btn:disabled {
                        opacity: 0.58;
                        cursor: progress;
                    }
                    .summary-grid {
                        display: grid;
                        grid-template-columns: repeat(5, 1fr);
                        gap: 12px;
                    }
                    .summary-card,
                    .admin-panel,
                    .student-row,
                    .detail-card,
                    .track-option,
                    .matrix-cell {
                        border-radius: 8px;
                    }
                    .summary-card {
                        border: 1px solid #dbe4f0;
                        background: rgba(255,255,255,0.9);
                        padding: 14px;
                        box-shadow: 0 12px 34px rgba(15,23,42,0.05);
                    }
                    .summary-card span {
                        display: flex;
                        align-items: center;
                        gap: 7px;
                        color: #64748b;
                        font-size: 12px;
                        font-weight: 900;
                    }
                    .summary-card strong {
                        display: block;
                        margin-top: 10px;
                        font-size: 28px;
                        line-height: 1;
                    }
                    .summary-card p {
                        margin: 7px 0 0;
                        color: #64748b;
                        font-size: 12px;
                        font-weight: 750;
                    }
                    .audit-board {
                        border: 1px solid #c7d2fe;
                        border-radius: 8px;
                        background:
                            linear-gradient(135deg, rgba(37,99,235,0.08), rgba(255,255,255,0.92) 50%),
                            #ffffff;
                        box-shadow: 0 18px 50px rgba(30,64,175,0.08);
                        padding: 16px;
                    }
                    .audit-board-head {
                        display: flex;
                        align-items: flex-start;
                        justify-content: space-between;
                        gap: 14px;
                        margin-bottom: 12px;
                    }
                    .audit-board-head h2 {
                        margin: 0;
                        font-size: 18px;
                    }
                    .audit-board-head p {
                        margin: 5px 0 0;
                        color: #64748b;
                        font-size: 12px;
                        font-weight: 750;
                    }
                    .audit-table {
                        display: grid;
                        gap: 7px;
                        max-height: 330px;
                        overflow: auto;
                        padding-right: 3px;
                    }
                    .audit-table-head,
                    .audit-row {
                        display: grid;
                        grid-template-columns: minmax(160px, 1fr) 96px 132px 108px minmax(260px, 1.35fr);
                        gap: 9px;
                        align-items: center;
                    }
                    .audit-table-head {
                        color: #64748b;
                        font-size: 11px;
                        font-weight: 950;
                        padding: 0 10px;
                    }
                    .audit-row {
                        border: 1px solid #e2e8f0;
                        border-radius: 8px;
                        background: rgba(255,255,255,0.88);
                        padding: 10px;
                    }
                    .audit-row.warn {
                        border-color: #fde68a;
                        background: #fffbeb;
                    }
                    .audit-row button {
                        border: 0;
                        background: transparent;
                        color: #0f172a;
                        font: inherit;
                        font-weight: 950;
                        text-align: left;
                        cursor: pointer;
                        padding: 0;
                    }
                    .audit-row small {
                        display: block;
                        margin-top: 2px;
                        color: #64748b;
                        font-size: 11px;
                        font-weight: 750;
                    }
                    .gap-list {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 5px;
                    }
                    .gap-pill {
                        border: 1px solid #fed7aa;
                        border-radius: 999px;
                        background: #fff7ed;
                        color: #9a3412;
                        padding: 4px 7px;
                        font-size: 10px;
                        font-weight: 900;
                    }
                    .gap-pill.clear {
                        border-color: #bbf7d0;
                        background: #f0fdf4;
                        color: #15803d;
                    }
                    .work-grid {
                        display: grid;
                        grid-template-columns: minmax(760px, 1.55fr) minmax(420px, 0.8fr);
                        gap: 16px;
                    }
                    .admin-panel {
                        border: 1px solid #dbe4f0;
                        background: rgba(255,255,255,0.9);
                        box-shadow: 0 16px 46px rgba(15,23,42,0.06);
                        padding: 16px;
                        min-width: 0;
                    }
                    .panel-head {
                        display: flex;
                        align-items: flex-start;
                        justify-content: space-between;
                        gap: 12px;
                        margin-bottom: 13px;
                    }
                    .panel-head h2 {
                        margin: 0;
                        font-size: 18px;
                        letter-spacing: 0;
                    }
                    .panel-head p {
                        margin: 5px 0 0;
                        color: #64748b;
                        font-size: 12px;
                        font-weight: 750;
                    }
                    .toolbar {
                        display: flex;
                        gap: 8px;
                        flex-wrap: wrap;
                        align-items: center;
                    }
                    .search-box {
                        min-width: 240px;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        border: 1px solid #dbe4f0;
                        background: #fff;
                        border-radius: 8px;
                        padding: 0 10px;
                        height: 36px;
                        color: #64748b;
                    }
                    .search-box input {
                        border: 0;
                        outline: 0;
                        min-width: 0;
                        flex: 1;
                        font: inherit;
                        font-size: 13px;
                        background: transparent;
                        color: #0f172a;
                    }
                    .track-filter {
                        border: 1px solid #dbe4f0;
                        background: #fff;
                        border-radius: 8px;
                        height: 36px;
                        padding: 0 10px;
                        color: #334155;
                        font-size: 12px;
                        font-weight: 850;
                    }
                    .student-table {
                        display: grid;
                        gap: 8px;
                        overflow-x: auto;
                        padding-bottom: 2px;
                    }
                    .student-empty {
                        border: 1px dashed #cbd5e1;
                        background: rgba(248,250,252,0.82);
                        border-radius: 10px;
                        padding: 22px;
                        color: #475569;
                    }
                    .student-empty strong {
                        display: block;
                        color: #0f172a;
                        font-size: 14px;
                        margin-bottom: 6px;
                    }
                    .student-empty span {
                        display: block;
                        font-size: 12px;
                        line-height: 1.6;
                    }
                    .table-head,
                    .student-row {
                        display: grid;
                        grid-template-columns: minmax(160px, 1.1fr) 88px 102px 88px 74px 104px 104px 104px 104px;
                        gap: 10px;
                        align-items: center;
                        min-width: 960px;
                    }
                    .table-head {
                        color: #64748b;
                        font-size: 11px;
                        font-weight: 950;
                        padding: 0 10px;
                    }
                    .student-row {
                        border: 1px solid #e2e8f0;
                        background: #fff;
                        padding: 10px;
                        cursor: pointer;
                    }
                    .student-row.active {
                        border-color: #93c5fd;
                        background: #eff6ff;
                        box-shadow: 0 12px 30px rgba(37,99,235,0.10);
                    }
                    .student-main {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        min-width: 0;
                    }
                    .avatar {
                        width: 38px;
                        height: 38px;
                        border-radius: 8px;
                        background: linear-gradient(135deg, #1d4ed8, #38bdf8);
                        color: #fff;
                        display: grid;
                        place-items: center;
                        font-weight: 950;
                    }
                    .student-main strong {
                        display: block;
                        font-size: 13px;
                    }
                    .student-main span,
                    .cell-sub {
                        display: block;
                        color: #64748b;
                        font-size: 11px;
                        margin-top: 2px;
                    }
                    .track-badge,
                    .status-badge {
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        width: fit-content;
                        border-radius: 999px;
                        padding: 5px 8px;
                        border: 1px solid currentColor;
                        font-size: 11px;
                        font-weight: 950;
                        white-space: nowrap;
                    }
                    .pin-code {
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        min-width: 54px;
                        width: fit-content;
                        border-radius: 8px;
                        padding: 6px 8px;
                        background: #0f172a;
                        color: #e0f2fe;
                        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                        font-size: 12px;
                        font-weight: 950;
                        letter-spacing: 0.06em;
                    }
                    .student-login-btn {
                        height: 32px;
                        border: 1px solid #bfdbfe;
                        border-radius: 8px;
                        background: #eff6ff;
                        color: #1d4ed8;
                        font-size: 11px;
                        font-weight: 950;
                        cursor: pointer;
                    }
                    .student-login-btn:disabled {
                        opacity: 0.45;
                        cursor: not-allowed;
                    }
                    .tone-blue { color: #1d4ed8; background: #eff6ff; }
                    .tone-green { color: #15803d; background: #f0fdf4; }
                    .tone-purple { color: #6d28d9; background: #f5f3ff; }
                    .tone-amber { color: #b45309; background: #fffbeb; }
                    .tone-slate { color: #475569; background: #f8fafc; }
                    .progress {
                        height: 7px;
                        border-radius: 999px;
                        background: #e2e8f0;
                        overflow: hidden;
                    }
                    .progress i {
                        display: block;
                        height: 100%;
                        border-radius: 999px;
                        background: linear-gradient(90deg, #60a5fa, #2563eb);
                    }
                    .detail-stack {
                        display: grid;
                        gap: 12px;
                    }
                    .detail-card {
                        border: 1px solid #e2e8f0;
                        background: #fff;
                        padding: 14px;
                    }
                    .audit-card {
                        border-color: #bfdbfe;
                        background:
                            linear-gradient(135deg, rgba(37,99,235,0.08), rgba(255,255,255,0.9) 55%),
                            #ffffff;
                    }
                    .audit-grid {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 8px;
                    }
                    .audit-chip {
                        border: 1px solid #dbe4f0;
                        background: rgba(255,255,255,0.78);
                        border-radius: 8px;
                        padding: 9px;
                    }
                    .audit-chip span {
                        display: block;
                        color: #64748b;
                        font-size: 10px;
                        font-weight: 900;
                    }
                    .audit-chip strong {
                        display: block;
                        margin-top: 4px;
                        font-size: 16px;
                    }
                    .detail-title {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 10px;
                        margin-bottom: 10px;
                    }
                    .detail-title h3 {
                        margin: 0;
                        font-size: 15px;
                    }
                    .detail-stats {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 8px;
                    }
                    .detail-stat {
                        border: 1px solid #e2e8f0;
                        border-radius: 8px;
                        padding: 9px;
                        background: #f8fafc;
                    }
                    .detail-stat span {
                        color: #64748b;
                        font-size: 10px;
                        font-weight: 900;
                    }
                    .detail-stat strong {
                        display: block;
                        margin-top: 4px;
                        font-size: 16px;
                    }
                    .credential-strip {
                        margin-top: 10px;
                        border: 1px solid #dbe4f0;
                        background: #f8fafc;
                        border-radius: 10px;
                        padding: 10px;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 10px;
                    }
                    .credential-strip span {
                        color: #475569;
                        font-size: 12px;
                        font-weight: 850;
                    }
                    .credential-strip strong {
                        margin-left: 6px;
                        color: #0f172a;
                        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                        letter-spacing: 0.08em;
                    }
                    .track-options {
                        display: grid;
                        grid-template-columns: repeat(5, 1fr);
                        gap: 8px;
                    }
                    .track-option {
                        border: 1px solid #dbe4f0;
                        background: #fff;
                        padding: 10px;
                        text-align: left;
                        cursor: pointer;
                    }
                    .track-option.active {
                        border-color: #2563eb;
                        box-shadow: 0 12px 28px rgba(37,99,235,0.12);
                    }
                    .track-option strong {
                        display: block;
                        font-size: 13px;
                    }
                    .track-option span {
                        display: block;
                        margin-top: 5px;
                        color: #64748b;
                        font-size: 10px;
                        line-height: 1.35;
                    }
                    .data-matrix {
                        display: grid;
                        grid-template-columns: repeat(6, 1fr);
                        gap: 7px;
                    }
                    .matrix-cell {
                        border: 1px solid #e2e8f0;
                        background: #f8fafc;
                        padding: 9px 6px;
                        text-align: center;
                        min-height: 66px;
                    }
                    .matrix-cell.done {
                        border-color: #bbf7d0;
                        background: #f0fdf4;
                        color: #15803d;
                    }
                    .matrix-cell svg {
                        display: block;
                        margin: 0 auto 5px;
                    }
                    .matrix-cell span {
                        display: block;
                        font-size: 10px;
                        font-weight: 900;
                    }
                    .evidence-list {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 6px;
                    }
                    .evidence-pill {
                        border: 1px solid #dbe4f0;
                        border-radius: 999px;
                        padding: 5px 8px;
                        background: #f8fafc;
                        color: #334155;
                        font-size: 11px;
                        font-weight: 850;
                    }
                    .missing-list {
                        margin: 8px 0 0;
                        color: #92400e;
                        font-size: 12px;
                        line-height: 1.45;
                    }
                    .notice {
                        position: fixed;
                        right: 22px;
                        bottom: 20px;
                        border: 1px solid #bfdbfe;
                        background: rgba(255,255,255,0.94);
                        color: #1e3a8a;
                        box-shadow: 0 18px 48px rgba(30,64,175,0.16);
                        border-radius: 8px;
                        padding: 11px 13px;
                        display: flex;
                        align-items: center;
                        gap: 9px;
                        font-size: 12px;
                        font-weight: 900;
                        z-index: 50;
                    }
                    @media (max-width: 1420px) {
                        .work-grid { grid-template-columns: 1fr; }
                        .audit-table-head,
                        .audit-row {
                            grid-template-columns: minmax(160px, 1fr) 92px 124px minmax(220px, 1.2fr);
                        }
                        .audit-table-head span:nth-child(4),
                        .audit-row > :nth-child(4) { display: none; }
                        .table-head, .student-row {
                            grid-template-columns: minmax(180px, 1fr) 92px 104px 104px 108px;
                        }
                        .table-head span:nth-child(n+6),
                        .student-row > :nth-child(n+6) { display: none; }
                    }
                    @media (max-width: 880px) {
                        .track-admin { padding: 12px; }
                        .admin-top { flex-direction: column; align-items: flex-start; }
                        .summary-grid,
                        .detail-stats,
                        .track-options,
                        .audit-grid,
                        .data-matrix { grid-template-columns: 1fr 1fr; }
                        .audit-board-head { flex-direction: column; }
                        .audit-table-head { display: none; }
                        .audit-row { grid-template-columns: 1fr; }
                        .table-head { display: none; }
                        .student-row { grid-template-columns: 1fr; }
                    }
                `}</style>

                <div className="admin-shell">
                    <section className="admin-top">
                        <div>
                            <span className="admin-kicker"><ShieldCheck size={14} />관리자 운영 화면</span>
                            <h1>코딩쏙 트랙 배정 센터</h1>
                            <p>학생별 진단, 수업 기록, 코드 실행, 포트폴리오, 리포트, 다음 수업 계획을 한 화면에서 확인하고 A/B/C/D 트랙을 배정합니다.</p>
                        </div>
                        <div className="top-actions">
                            <span className={`admin-kicker ${remoteConnected ? "remote" : "local"}`}>
                                <Database size={14} />{remoteConnected ? "Supabase 연결" : "로컬 프리뷰"}
                            </span>
                            <button className="admin-btn" disabled={auditLoading} onClick={runAudit}>
                                <Database size={15} />{auditLoading ? "점검 중" : "실데이터 점검"}
                            </button>
                            <button className="admin-btn" onClick={() => router.push("/teacher/admin")}>
                                <ShieldCheck size={15} />관리자 페이지
                            </button>
                            <button className="admin-btn primary" disabled={!selected} onClick={() => selected && assignTrack(selected.recommendedTrack)}>
                                <GitBranch size={15} />추천 트랙 배정
                            </button>
                        </div>
                    </section>

                    <section className="summary-grid">
                        <div className="summary-card"><span><Users size={15} />관리 학생</span><strong>{students.length}명</strong><p>트랙 배정 대상 전체</p></div>
                        <div className="summary-card"><span><GitBranch size={15} />배정 필요</span><strong>{needAssignment}명</strong><p>추천 트랙 확정 대기</p></div>
                        <div className="summary-card"><span><ShieldCheck size={15} />배정 완료</span><strong>{assignedCount}명</strong><p>A/B/C/D 확정 학생</p></div>
                        <div className="summary-card"><span><Database size={15} />데이터 완성도</span><strong>{avgCompleteness}%</strong><p>진단·수업·리포트 기준</p></div>
                        <div className="summary-card"><span><MessageSquareText size={15} />리포트 준비</span><strong>{reportReady}명</strong><p>학부모 공유 가능 포함</p></div>
                    </section>

                    {audit && (
                        <section className="audit-board">
                            <div className="audit-board-head">
                                <div>
                                    <h2>실데이터 연결 현황</h2>
                                    <p>Supabase 성장 기록, 로그인/회원가입 이벤트, Notion 피드백을 학생별로 맞춰 누락 데이터를 먼저 보여줍니다.</p>
                                </div>
                                <span className="admin-kicker remote">
                                    <Database size={14} />{new Date(audit.checkedAt).toLocaleString("ko-KR")}
                                </span>
                            </div>
                            <div className="audit-table">
                                <div className="audit-table-head">
                                    <span>학생</span><span>로그인</span><span>성장 데이터</span><span>Notion</span><span>확인 필요</span>
                                </div>
                                {auditRows.map((row) => {
                                    const growthCount =
                                        row.counts.diagnostics +
                                        row.counts.lessons +
                                        (row.counts.codeRuns ?? 0) +
                                        row.counts.portfolios +
                                        row.counts.reports +
                                        row.counts.plans +
                                        row.counts.assignments;
                                    const matchedStudent = students.find((student) => student.id === row.id || student.name === row.name);

                                    return (
                                        <div className={`audit-row ${row.gaps.length ? "warn" : ""}`} key={row.id || row.name}>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (matchedStudent) setSelectedId(matchedStudent.id);
                                                }}
                                            >
                                                {row.name}
                                                <small>{row.hasAuth ? "Auth 연결됨" : "Auth 미연결"}</small>
                                            </button>
                                            <span className={`track-badge ${row.counts.logins ? "tone-green" : "tone-amber"}`}>{row.counts.logins}건</span>
                                            <span className="cell-sub" style={{ color: "#0f172a", fontWeight: 900 }}>
                                                {growthCount}건 · 진단 {row.counts.diagnostics} · 수업 {row.counts.lessons} · 코드 {row.counts.codeRuns ?? 0}
                                            </span>
                                            <span className={`track-badge ${row.counts.notionFeedbacks ? "tone-purple" : "tone-slate"}`}>
                                                {row.counts.notionFeedbacks}건
                                            </span>
                                            <div className="gap-list">
                                                {row.gaps.length ? row.gaps.slice(0, 5).map((gap) => (
                                                    <span className="gap-pill" key={gap}>{gap}</span>
                                                )) : (
                                                    <span className="gap-pill clear">필수 데이터 연결 완료</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    <section className="work-grid">
                        <div className="admin-panel">
                            <div className="panel-head">
                                <div>
                                    <h2>학생별 트랙 배정 현황</h2>
                                    <p>추천만 보지 않고 모든 성장 증거와 누락 데이터를 함께 확인합니다.</p>
                                </div>
                                <div className="toolbar">
                                    <label className="search-box">
                                        <Search size={15} />
                                        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="학생명, 학년, 학교 검색" />
                                    </label>
                                    <select className="track-filter" value={trackFilter} onChange={(event) => setTrackFilter(event.target.value as TrackId | "전체")}>
                                        {(["전체", "공통기초", "A", "B", "C", "D"] as const).map((track) => (
                                            <option key={track} value={track}>{track === "전체" ? "전체 트랙" : TRACK_META[track].title}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="student-table">
                                <div className="table-head">
                                    <span>학생</span><span>현재</span><span>추천</span><span>배정</span><span>PIN</span><span>완성도</span><span>리포트</span><span>최근 갱신</span><span>학생 보기</span>
                                </div>
                                {loadingStudents ? (
                                    <div className="student-empty">
                                        <strong>실제 학생 데이터를 불러오는 중입니다.</strong>
                                        <span>Supabase 학생·진단·수업·코드·리포트·트랙배정 데이터를 서버에서 연결하고 있습니다.</span>
                                    </div>
                                ) : filteredStudents.length ? filteredStudents.map((student) => {
                                    const completeness = dataCompleteness(student);
                                    return (
                                        <motion.div
                                            className={`student-row ${selected?.id === student.id ? "active" : ""}`}
                                            key={student.id}
                                            onClick={() => setSelectedId(student.id)}
                                            whileHover={{ y: -1 }}
                                        >
                                            <div className="student-main">
                                                <div className="avatar">{student.name.slice(0, 1)}</div>
                                                <div>
                                                    <strong>{student.name}</strong>
                                                    <span>{student.grade} · {student.school}</span>
                                                </div>
                                            </div>
                                            <span className={`track-badge tone-${TRACK_META[student.currentTrack].tone}`}>{student.currentTrack}</span>
                                            <span className={`track-badge tone-${TRACK_META[student.recommendedTrack].tone}`}>{TRACK_META[student.recommendedTrack].title}</span>
                                            <span className={`track-badge tone-${TRACK_META[student.assignedTrack].tone}`}>{student.assignedTrack}</span>
                                            <span className="pin-code">{student.loginPin ?? "미조회"}</span>
                                            <div>
                                                <div className="progress"><i style={{ width: `${completeness}%` }} /></div>
                                                <span className="cell-sub">{completeness}% · {recommendStatus(student)}</span>
                                            </div>
                                            <span className="cell-sub">{student.reportStatus}</span>
                                            <span className="cell-sub">{student.lastUpdated}</span>
                                            <button
                                                className="student-login-btn"
                                                disabled={isSupabaseConfigured() && !student.loginPin}
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    void viewAsStudent(student);
                                                }}
                                            >
                                                학생 보기
                                            </button>
                                        </motion.div>
                                    );
                                }) : (
                                    <div className="student-empty">
                                        <strong>표시할 실제 학생 데이터가 없습니다.</strong>
                                        <span>Supabase students 테이블 또는 실제 회원가입 기록이 생기면 자동으로 표시됩니다.</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <aside className="admin-panel detail-stack">
                            {selected ? (
                                <>
                            <div className="detail-card">
                                <div className="detail-title">
                                    <div>
                                        <h3>{selected.name} 트랙 배정</h3>
                                        <span className="cell-sub">{selected.grade} · {selected.school} · {selected.status}</span>
                                    </div>
                                    <span className={`status-badge tone-${TRACK_META[selected.recommendedTrack].tone}`}>{selected.confidence}% 확신</span>
                                </div>
                                <div className="detail-stats">
                                    <div className="detail-stat"><span>진단</span><strong>{selected.diagnosticScore}%</strong></div>
                                    <div className="detail-stat"><span>수업 기록</span><strong>{selected.lessonRecords}</strong></div>
                                    <div className="detail-stat"><span>코드 실행</span><strong>{selected.codeRuns}</strong></div>
                                    <div className="detail-stat"><span>오류 수정</span><strong>{selected.errorFixes}</strong></div>
                                </div>
                                <div className="credential-strip">
                                    <span>학생 로그인 PIN <strong>{selected.loginPin ?? "미조회"}</strong></span>
                                    <button
                                        className="student-login-btn"
                                        disabled={isSupabaseConfigured() && !selected.loginPin}
                                        onClick={() => void viewAsStudent(selected)}
                                    >
                                        학생 계정으로 보기
                                    </button>
                                </div>
                            </div>

                            {audit && (
                                <div className="detail-card audit-card">
                                    <div className="detail-title">
                                        <div>
                                            <h3>실데이터 점검</h3>
                                            <span className="cell-sub">{new Date(audit.checkedAt).toLocaleString("ko-KR")}</span>
                                        </div>
                                        <span className={`status-badge ${audit.source.notion.configured ? "tone-green" : "tone-amber"}`}>
                                            Notion {audit.source.notion.configured ? "연결" : "미설정"}
                                        </span>
                                    </div>
                                    <div className="audit-grid">
                                        <div className="audit-chip"><span>대상 학생</span><strong>{audit.totals.students}명</strong></div>
                                        <div className="audit-chip"><span>PIN 조회</span><strong>{audit.totals.studentsWithPin ?? 0}명</strong></div>
                                        <div className="audit-chip"><span>학습 활동</span><strong>{audit.totals.studentActivityLogs ?? 0}건</strong></div>
                                        <div className="audit-chip"><span>정확도</span><strong>{audit.totals.userProgress ?? 0}건</strong></div>
                                        <div className="audit-chip"><span>로그인</span><strong>{audit.totals.loginEvents}건</strong></div>
                                        <div className="audit-chip"><span>Notion</span><strong>{audit.source.notion.feedbackCount}건</strong></div>
                                        <div className="audit-chip"><span>누락 있음</span><strong>{audit.totals.studentsWithDataGaps}명</strong></div>
                                        <div className="audit-chip"><span>관리자 제외</span><strong>{audit.totals.adminExcluded ?? 0}명</strong></div>
                                    </div>
                                    {selectedAudit && (
                                        <p className="cell-sub" style={{ marginTop: 10, color: "#0f172a", fontWeight: 850 }}>
                                            {selected.name}: {selectedAudit.gaps.length ? selectedAudit.gaps.slice(0, 4).join(" · ") : "필수 성장 데이터 연결 완료"}
                                        </p>
                                    )}
                                    {audit.errors?.length ? (
                                        <p className="missing-list">확인 필요: {audit.errors.slice(0, 2).join(" / ")}</p>
                                    ) : null}
                                    {audit.optionalMissing?.length ? (
                                        <p className="missing-list">확장 테이블 생성 전: {audit.optionalMissing.map((item) => item.split(":")[0]).slice(0, 4).join(" · ")}{audit.optionalMissing.length > 4 ? " 외" : ""}</p>
                                    ) : null}
                                </div>
                            )}

                            <div className="detail-card">
                                <div className="detail-title">
                                    <h3>트랙 선택</h3>
                                    <span className="cell-sub">추천: {TRACK_META[selected.recommendedTrack].title}</span>
                                </div>
                                <div className="track-options">
                                    {(["공통기초", "A", "B", "C", "D"] as TrackId[]).map((track) => (
                                        <button
                                            className={`track-option ${selected.assignedTrack === track ? "active" : ""}`}
                                            key={track}
                                            onClick={() => assignTrack(track)}
                                        >
                                            <strong>{TRACK_META[track].title}</strong>
                                            <span>{TRACK_META[track].desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="detail-card">
                                <div className="detail-title">
                                    <h3>데이터 연동 매트릭스</h3>
                                    <span className="cell-sub">누락 데이터까지 관리</span>
                                </div>
                                <div className="data-matrix">
                                    {DATA_COLUMNS.map((column) => {
                                        const Icon = column.icon;
                                        const done =
                                            (column.key === "diagnostic" && selected.diagnosticScore > 0) ||
                                            (column.key === "lesson" && selected.lessonRecords > 0) ||
                                            (column.key === "code" && selected.codeRuns > 0) ||
                                            (column.key === "portfolio" && selected.portfolioRecords > 0) ||
                                            (column.key === "report" && selected.reportStatus !== "초안 필요") ||
                                            (column.key === "plan" && selected.nextGoal !== "다음 목표 입력 필요");
                                        return (
                                            <div className={`matrix-cell ${done ? "done" : ""}`} key={column.key}>
                                                <Icon size={16} />
                                                <span>{column.label}</span>
                                                <span>{done ? "연동" : "누락"}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="detail-card">
                                <div className="detail-title">
                                    <h3>배정 근거</h3>
                                    <span className="cell-sub">학부모·선생님 공유 기준</span>
                                </div>
                                <div className="evidence-list">
                                    {selected.evidence.map((item) => <span className="evidence-pill" key={item}>{item}</span>)}
                                </div>
                                {selected.missing.length > 0 && (
                                    <p className="missing-list">누락 확인: {selected.missing.join(", ")}</p>
                                )}
                                <p className="cell-sub" style={{ marginTop: 10 }}>{selected.note}</p>
                            </div>

                            <div className="detail-card">
                                <div className="detail-title">
                                    <h3>다음 목표</h3>
                                    <span className="cell-sub">{selected.reportStatus}</span>
                                </div>
                                <p className="cell-sub" style={{ color: "#0f172a", fontWeight: 850 }}>{selected.nextGoal}</p>
                                <div className="top-actions" style={{ justifyContent: "flex-start", marginTop: 12 }}>
                                    <button className="admin-btn" disabled={isSupabaseConfigured() && !selected.loginPin} onClick={() => void viewAsStudent(selected)}>
                                        <BarChart3 size={15} />학생 계정으로 보기
                                    </button>
                                    <button className="admin-btn" onClick={() => setNotice(`${selected.name} 학생 리포트와 포트폴리오를 확인했습니다.`)}>
                                        <FileText size={15} />전체 기록 확인
                                    </button>
                                </div>
                            </div>
                                </>
                            ) : (
                                <div className="detail-card empty-state">
                                    <h3>선택된 실제 학생이 없습니다</h3>
                                    <p className="cell-sub">Supabase 학생 테이블이나 실제 회원가입 기록이 연결되면 트랙 배정, 비밀번호, 성장 데이터가 이 영역에 표시됩니다.</p>
                                </div>
                            )}
                        </aside>
                    </section>
                </div>

                <motion.div className="notice" key={notice} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                    <Activity size={15} />
                    <span>{notice}</span>
                </motion.div>
            </main>
        </MotionConfig>
    );
}
