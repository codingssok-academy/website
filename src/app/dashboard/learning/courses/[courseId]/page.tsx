"use client";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { sanitizeHTML } from "@/lib/sanitize";
import { injectCodeRunner, injectScrollTracker } from "@/lib/inject-code-runner";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase";
import { XP_REWARDS, XP_PENALTIES, canAccessContent, getTierInfo } from "@/lib/xp-engine";
import { useUserProgress } from "@/hooks/useUserProgress";
import { awardXP, deductXP } from "@/lib/xp-client";
import { trackMission } from "@/lib/mission-tracker";
import { checkAchievementBadges } from "@/lib/reward-engine";
import { getCourseById, getAllUnits } from "@/data/courses";
import { getHtmlContentPath } from "@/data/courses/html-content-map";

declare global { interface Window { __runCCode?: (btn: HTMLButtonElement) => Promise<void>; } }
import type { Unit, Quiz, Chapter as ChapterType, Page, CodeProblem } from "@/data/courses";
import LevelUpModal from "@/components/ui/LevelUpModal";
import CodeEditor from "@/components/ui/CodeEditor";
import BookViewer from "@/components/ui/BookViewer";
import { MI, glassPanel, QuizPanel, CodeProblemCard, TYPE_STYLES, DIFF_LABELS } from "./components";
import { useStudyNotes } from "@/hooks/useStudyNotes";
import { useStudyProgress } from "@/hooks/useStudyProgress";
import StudyNotesEditor from "./StudyNotesEditor";
import { usePresenceHeartbeat } from "@/hooks/usePresenceHeartbeat";
import { useActivityLog } from "@/hooks/useActivityLog";
import { useLessonAnswerPersistence, useLessonSessionProgress } from "@/hooks/useLessonPersistence";
import { evaluateLessonCompletion, type LessonAnswerSnapshot } from "@/lib/python-core-learning";
import AITutor from "@/components/ui/AITutor";
import CosProSelector from "./CosProSelector";
import ProgrammingContestSelector from "./ProgrammingContestSelector";
import ProgrammingContestComingSoon from "./ProgrammingContestComingSoon";
import WordProcessorView from "./WordProcessorView";
import CertificateSelector from "./CertificateSelector";
import { getCertificateChapters } from "@/data/courses";

/* ── Highlighter Colors ── */
const HL_COLORS = [
    { id: "yellow", bg: "rgba(253,224,71,0.45)", solid: "#fde047", label: "노랑" },
    { id: "green", bg: "rgba(74,222,128,0.35)", solid: "#4ade80", label: "녹색" },
    { id: "blue", bg: "rgba(96,165,250,0.30)", solid: "#60a5fa", label: "파랑" },
    { id: "purple", bg: "rgba(192,132,252,0.30)", solid: "#93c5fd", label: "보라" },
    { id: "red", bg: "rgba(252,165,165,0.40)", solid: "#fca5a5", label: "빨강" },
    { id: "orange", bg: "rgba(251,146,60,0.35)", solid: "#fb923c", label: "주황" },
];

const NOTE_BG: Record<string, { bg: string; border: string }> = {
    yellow: { bg: "#fef9c3", border: "#fde047" },
    green: { bg: "#dcfce7", border: "#86efac" },
    blue: { bg: "#dbeafe", border: "#93c5fd" },
    purple: { bg: "#dbeafe", border: "#93c5fd" },
    red: { bg: "#fee2e2", border: "#fca5a5" },
    orange: { bg: "#ffedd5", border: "#fdba74" },
};

export default function CourseDetailPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const courseId = params.courseId as string;
    const contestTrack = searchParams.get("track");
    const certId = searchParams.get("cert");
    const { user } = useAuth();
    const isTeacherView = user?.role === "teacher" || (user?.role as string) === "admin" || user?.name === "장민";
    const supabase = useMemo(() => createClient(), []);
    const contentRef = useRef<HTMLDivElement>(null);
    const htmlContentRef = useRef<HTMLDivElement>(null);
    const lastPageIdRef = useRef<string>("");

    const courseDataRaw = useMemo(() => getCourseById(courseId), [courseId]);
    // 자격증 서브코스: chapters를 동적으로 교체
    const courseData = useMemo(() => {
        if (courseId === '7' && certId && courseDataRaw) {
            const certChapters = getCertificateChapters(certId);
            const certTitles: Record<string, string> = {
                'cert-wordprocessor': '워드프로세서 필기',
                'cert-computer-2': '컴퓨터활용능력 2급',
                'cert-programming': '프로그래밍기능사',
            };
            return { ...courseDataRaw, chapters: certChapters, title: certTitles[certId] ?? '자격증' };
        }
        return courseDataRaw;
    }, [courseId, certId, courseDataRaw]);
    const allUnits = useMemo(() => {
        if (!courseData) return [];
        return courseData.chapters.flatMap(ch => ch.units);
    }, [courseData]);
    const { progress: userProgress } = useUserProgress();
    const presenceCourseId = courseId === "6" && contestTrack ? `6-${contestTrack}` : courseId;
    const courseDisplayTitle = courseId === "6" && contestTrack === "c"
        ? "프로그래밍 대회 · C언어"
        : courseId === "6" && contestTrack === "python"
            ? "프로그래밍 대회 · 파이썬"
            : courseId === "6" && contestTrack === "koi"
                ? "프로그래밍 대회 · 정보올림피아드 (KOI)"
                : courseData?.title || "";
    const courseBackHref = courseId === "6" && (contestTrack === "c" || contestTrack === "koi")
        ? "/dashboard/learning/courses/6"
        : courseId === "7" && certId
            ? "/dashboard/learning/courses/7"
            : "/dashboard/learning";

    usePresenceHeartbeat({ courseId: presenceCourseId, courseTitle: courseDisplayTitle || courseData?.title });

    // 티어 접근 제한 체크
    const requiredTier = courseData?.requiredTier;
    const tierLocked = !!requiredTier && !canAccessContent(userProgress.tier, requiredTier);

    // ── State ──
    const { completedUnits, toggleUnit, setUnitCompleted, saveStatus: completionSaveStatus } = useStudyProgress(user?.id, courseId);
    const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
    const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
    const [activePage, setActivePage] = useState<Page | null>(null);
    const isPythonCorePage = courseId === '3' && !!activePage?.id.startsWith('py-core-');
    const isDigitalCreatorPage = courseId === '11' && !!activePage?.id.startsWith('kids-it-first-');
    const usesFocusedLessonUx = courseId === '4' || courseId === '11' || isPythonCorePage;

    // 학생 학습 활동 영구 기록 — student_activity_log INSERT/UPDATE
    // 학부모 portal /parent dashboard가 fetch하는 테이블. 담당자 '성장기록 데이터 연동 안된 듯'
    // 진단: 이전엔 usePresenceHeartbeat(student_presence)만 호출 → activity_log 빈 채로 → 학부모 화면 0.
    useActivityLog({
        courseId: presenceCourseId,
        courseTitle: courseDisplayTitle || courseData?.title,
        unitId: selectedUnit?.id,
        unitTitle: selectedUnit?.title,
        pageId: activePage?.id,
        pageTitle: activePage?.title,
    });
    // 담당자 명시 '코스 입장하면 16:9 수업자료 | 컴파일러 split' — 좌측 outline default close,
    // 메인 = 슬라이드 풀폭 + 우측 코드 사이드바(default 'code' 탭) 동시 노출.
    // 학생이 챕터/유닛 list 필요하면 좌상단 chevron 버튼 클릭.
    const [leftOpen, setLeftOpen] = useState(false);
    // 어린이 IT (id 11)는 영유아용 슬라이드 학습 전용 → 우측 패널 default 닫음 (PNG 풀폭 표시)
    const [rightOpen, setRightOpen] = useState(courseId !== '11');
    const [bookViewerOpen, setBookViewerOpen] = useState(true);
    const [slideMode, setSlideMode] = useState(false); // 수업자료 슬라이드 모드
    // 책 모드 (1|2 페이지 분할) — 피드백 #G
    const [bookMode, setBookMode] = useState<boolean>(false);
    useEffect(() => {
        try { setBookMode(localStorage.getItem('learning_book_mode') === '1'); } catch {}
    }, []);
    // 책모드 켜지면 커리큘럼 자동 닫힘, 끄면 자동 열림
    const toggleBookMode = useCallback(() => {
        setBookMode(prev => {
            const next = !prev;
            try { localStorage.setItem('learning_book_mode', next ? '1' : '0'); } catch {}
            if (next) setLeftOpen(false); else setLeftOpen(true);
            return next;
        });
    }, []);

    // Resizable panels
    const [leftW, setLeftW] = useState(280);
    const [rightW, setRightW] = useState(480);
    const [isDragging, setIsDragging] = useState(false);
    const dragRef = useRef<{ side: "left" | "right"; startX: number; startW: number } | null>(null);

    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            const d = dragRef.current;
            if (!d) return;
            e.preventDefault();
            const delta = e.clientX - d.startX;
            if (d.side === "left") {
                setLeftW(Math.max(200, Math.min(450, d.startW + delta)));
            } else {
                setRightW(Math.max(280, Math.min(700, d.startW - delta)));
            }
        };
        const onUp = () => {
            if (!dragRef.current) return;
            dragRef.current = null;
            setIsDragging(false);
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
        };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
        return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    }, []);

    const startDrag = (side: "left" | "right", e: React.MouseEvent) => {
        e.preventDefault();
        dragRef.current = { side, startX: e.clientX, startW: side === "left" ? leftW : rightW };
        setIsDragging(true);
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
    };

    // Quiz state
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [quizResult, setQuizResult] = useState<"correct" | "wrong" | null>(null);
    const [wrongCount, setWrongCount] = useState(0);
    const [showHint, setShowHint] = useState(false);
    const [shaking, setShaking] = useState(false);
    const [levelUpInfo, setLevelUpInfo] = useState<{ level: number } | null>(null);
    const [xpMsg, setXpMsg] = useState("");

    // Code problem state
    const [showProblemAnswer, setShowProblemAnswer] = useState<Record<number, boolean>>({});
    const [editorCode, setEditorCode] = useState<Record<number, string>>({});
    const [runResult, setRunResult] = useState<Record<number, { stdout: string; stderr: string; exitCode: number } | null>>({});
    const [runLoading, setRunLoading] = useState<Record<number, boolean>>({});
    const [completionMessage, setCompletionMessage] = useState("");
    const [digitalCreatorAnswer, setDigitalCreatorAnswer] = useState("");

    const isPythonCoreUnit = courseId === "3" && !!selectedUnit?.id.startsWith("py-core-");
    const isDigitalCreatorUnit = courseId === "11" && !!selectedUnit?.id.startsWith("kids-it-first-");
    const usesLessonPersistence = isPythonCoreUnit || isDigitalCreatorUnit;
    const lessonPageIds = useMemo(() => selectedUnit?.pages?.map((page) => page.id) ?? [], [selectedUnit]);
    const lessonQuizPageIds = useMemo(
        () => selectedUnit?.pages?.filter((page) => page.quiz).map((page) => page.id) ?? [],
        [selectedUnit],
    );
    const lessonProblemIds = useMemo(
        () => selectedUnit?.pages?.flatMap((page) => page.problems?.map((problem) => problem.id) ?? []) ?? [],
        [selectedUnit],
    );
    const lessonActivityPageIds = useMemo(
        () => selectedUnit?.pages?.filter((page) => page.activity).map((page) => page.id) ?? [],
        [selectedUnit],
    );
    const {
        progress: lessonSessionProgress,
        status: lessonProgressSaveStatus,
        ready: lessonProgressReady,
        markPageVisited,
        markQuizCorrect,
        markProblemSuccessful,
        setActivityCompleted,
    } = useLessonSessionProgress({
        enabled: usesLessonPersistence,
        userId: user?.id,
        courseId,
        unitId: selectedUnit?.id,
    });
    const lessonCompletion = useMemo(
        () => evaluateLessonCompletion(
            lessonSessionProgress,
            lessonPageIds,
            lessonQuizPageIds,
            lessonProblemIds,
            lessonActivityPageIds,
        ),
        [lessonActivityPageIds, lessonPageIds, lessonProblemIds, lessonQuizPageIds, lessonSessionProgress],
    );

    const restoreLessonAnswer = useCallback((saved: LessonAnswerSnapshot) => {
        if (isDigitalCreatorPage) {
            const restoredAnswer = saved.codeAnswers.activity ?? "";
            setDigitalCreatorAnswer(restoredAnswer);
            if (activePage?.activity) {
                setActivityCompleted(activePage.id, restoredAnswer.trim().length >= (activePage.activity.minLength ?? 1));
            }
            return;
        }
        setSelectedAnswer(saved.quizAnswer);
        setQuizResult(saved.quizResult);
        setEditorCode(Object.fromEntries(
            Object.entries(saved.codeAnswers).map(([problemId, code]) => [Number(problemId), code]),
        ));
    }, [activePage, isDigitalCreatorPage, setActivityCompleted]);
    const lessonAnswerDraft = useMemo(() => isDigitalCreatorPage ? ({
        quizAnswer: null,
        quizResult: null,
        codeAnswers: { activity: digitalCreatorAnswer },
    }) : ({
        quizAnswer: selectedAnswer,
        quizResult: quizResult === "correct" ? "correct" as const : null,
        codeAnswers: Object.fromEntries(Object.entries(editorCode).map(([problemId, code]) => [String(problemId), code])),
    }), [digitalCreatorAnswer, editorCode, isDigitalCreatorPage, quizResult, selectedAnswer]);
    const { status: answerSaveStatus } = useLessonAnswerPersistence({
        enabled: isPythonCorePage || (isDigitalCreatorPage && !!activePage?.activity),
        userId: user?.id,
        courseId,
        unitId: selectedUnit?.id,
        pageId: activePage?.id,
        answer: lessonAnswerDraft,
        onRestore: restoreLessonAnswer,
    });

    useEffect(() => {
        if ((isPythonCorePage || isDigitalCreatorPage) && activePage && lessonProgressReady) markPageVisited(activePage.id);
    }, [activePage, isDigitalCreatorPage, isPythonCorePage, lessonProgressReady, markPageVisited]);

    const updateDigitalCreatorAnswer = useCallback((value: string) => {
        setDigitalCreatorAnswer(value);
        if (activePage?.activity) {
            setActivityCompleted(activePage.id, value.trim().length >= (activePage.activity.minLength ?? 1));
        }
    }, [activePage, setActivityCompleted]);

    // Notes
    const { saveNote, getNote } = useStudyNotes(user?.id);
    const noteKey = `${user?.id || "anon"}_${courseId}_${selectedUnit?.id || ""}_${activePage?.id || ""}`;
    const existingNote = getNote(noteKey);
    const [noteText, setNoteText] = useState(existingNote?.content || "");
    const [noteColor, setNoteColor] = useState(existingNote?.color || "white");
    const noteSaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    // Highlighter
    const [activeHL, setActiveHL] = useState<string | null>(null);

    // iframe 코드 실행 + 스크롤 진행률
    const [readProgress, setReadProgress] = useState(0);
    const scrollCleanupRef = useRef<(() => void) | null>(null);

    // Right panel tab
    // 어린이 IT는 코드 컴파일러 무용 → default 'notes'
    const [rightTab, setRightTab] = useState<"notes" | "timer" | "qa" | "bookmarks" | "code">(courseId === '11' ? 'notes' : 'code');

    // 슬라이드 lightbox — 학생이 이미지 클릭하면 풀스크린 zoom (담당자 '이미지 잘 보이게' 명시)
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

    // Timer
    const [timerMode, setTimerMode] = useState<"focus" | "short" | "long">("focus");
    const [timerSec, setTimerSec] = useState(25 * 60);
    const [timerRunning, setTimerRunning] = useState(false);
    const [timerSessions, setTimerSessions] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
    const TIMER_DURATIONS = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 };

    useEffect(() => {
        if (timerRunning && timerSec > 0) {
            timerRef.current = setInterval(() => setTimerSec(s => s - 1), 1000);
            return () => clearInterval(timerRef.current);
        } else if (timerSec === 0 && timerRunning) {
            setTimerRunning(false);
            if (timerMode === "focus") setTimerSessions(s => s + 1);
        }
    }, [timerRunning, timerSec, timerMode]);

    const resetTimer = (mode: "focus" | "short" | "long") => { setTimerMode(mode); setTimerSec(TIMER_DURATIONS[mode]); setTimerRunning(false); if (timerRef.current) clearInterval(timerRef.current); };


    // Q&A
    const [qaList, setQaList] = useState<{ q: string; ts: number }[]>(() => {
        if (typeof window === "undefined") return [];
        try { const s = localStorage.getItem(`codingssok_qa_${user?.id || "anon"}_${courseId}`); return s ? JSON.parse(s) : []; } catch { return []; }
    });
    const [qaInput, setQaInput] = useState("");
    const addQuestion = () => {
        if (!qaInput.trim()) return;
        const next = [{ q: qaInput.trim(), ts: Date.now() }, ...qaList];
        setQaList(next); setQaInput("");
        try { localStorage.setItem(`codingssok_qa_${user?.id || "anon"}_${courseId}`, JSON.stringify(next)); } catch {}
    };

    // ── Teacher Announcements widget ──
    const [announcements, setAnnouncements] = useState<{ id: string; title: string; content: string | null; is_pinned: boolean; created_at: string }[]>([]);
    const [annWidgetOpen, setAnnWidgetOpen] = useState(false);
    const [annHasNew, setAnnHasNew] = useState(false);
    const [annLastSeen, setAnnLastSeen] = useState<string | null>(null);

    useEffect(() => {
        const stored = typeof window !== "undefined" ? localStorage.getItem("codingssok_ann_last_seen") : null;
        setAnnLastSeen(stored);

        let cancelled = false;
        async function loadAnnouncements() {
            try {
                const { data } = await supabase
                    .from("announcements")
                    .select("id, title, content, is_pinned, created_at")
                    .order("is_pinned", { ascending: false })
                    .order("created_at", { ascending: false })
                    .limit(5);
                if (!cancelled && data) {
                    setAnnouncements(data);
                    if (data.length > 0) {
                        const latest = data[0].created_at;
                        if (!stored || latest > stored) setAnnHasNew(true);
                    }
                }
            } catch {}
        }
        loadAnnouncements();

        const channel = supabase
            .channel("announcements-realtime")
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "announcements" }, (payload: { new: { id: string; title: string; content: string | null; is_pinned: boolean; created_at: string } }) => {
                const newAnn = payload.new as { id: string; title: string; content: string | null; is_pinned: boolean; created_at: string };
                setAnnouncements(prev => {
                    const updated = [newAnn, ...prev].slice(0, 5);
                    return updated.sort((a, b) => {
                        if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
                        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                    });
                });
                setAnnHasNew(true);
            })
            .subscribe();

        return () => {
            cancelled = true;
            supabase.removeChannel(channel);
        };
    }, [supabase]);

    const handleOpenAnnWidget = () => {
        setAnnWidgetOpen(o => !o);
        if (!annWidgetOpen) {
            const now = new Date().toISOString();
            setAnnLastSeen(now);
            setAnnHasNew(false);
            try { localStorage.setItem("codingssok_ann_last_seen", now); } catch {}
        }
    };

    // Bookmarks
    const [bookmarks, setBookmarks] = useState<{ unitId: string; unitTitle: string; pageId: string; pageTitle: string; ts: number }[]>(() => {
        if (typeof window === "undefined") return [];
        try { const s = localStorage.getItem(`codingssok_bm_${user?.id || "anon"}_${courseId}`); return s ? JSON.parse(s) : []; } catch { return []; }
    });
    const addBookmark = () => {
        if (!selectedUnit || !activePage) return;
        if (bookmarks.some(b => b.unitId === selectedUnit.id && b.pageId === activePage.id)) return;
        const next = [{ unitId: selectedUnit.id, unitTitle: selectedUnit.title, pageId: activePage.id, pageTitle: activePage.title, ts: Date.now() }, ...bookmarks];
        setBookmarks(next);
        try { localStorage.setItem(`codingssok_bm_${user?.id || "anon"}_${courseId}`, JSON.stringify(next)); } catch {}
    };
    const removeBookmark = (ts: number) => {
        const next = bookmarks.filter(b => b.ts !== ts);
        setBookmarks(next);
        try { localStorage.setItem(`codingssok_bm_${user?.id || "anon"}_${courseId}`, JSON.stringify(next)); } catch {}
    };
    const isBookmarked = selectedUnit && activePage ? bookmarks.some(b => b.unitId === selectedUnit.id && b.pageId === activePage.id) : false;

    // Sync note text when selection changes
    useEffect(() => {
        const n = getNote(noteKey);
        setNoteText(n?.content || "");
        setNoteColor(n?.color || "yellow");
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [noteKey]);

    // Auto-save note (debounced — avoids re-render flicker)
    const saveNoteDebounced = useCallback((text: string, color: string) => {
        if (noteSaveTimer.current) clearTimeout(noteSaveTimer.current);
        noteSaveTimer.current = setTimeout(() => {
            if (text.trim()) saveNote(noteKey, text, color);
        }, 800);
    }, [noteKey, saveNote]);
    useEffect(() => () => { if (noteSaveTimer.current) clearTimeout(noteSaveTimer.current); }, []);

    // Highlight persistence key
    const hlStorageKey = `codingssok_hl_${user?.id || "anon"}_${courseId}_${selectedUnit?.id || ""}_${activePage?.id || ""}`;

    // Save highlights to localStorage + Supabase
    const hlDebounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const saveHighlights = useCallback(() => {
        if (!htmlContentRef.current) return;
        const html = htmlContentRef.current.innerHTML;
        try { localStorage.setItem(hlStorageKey, html); } catch {}
        // Sync to Supabase (debounced)
        if (user?.id) {
            if (hlDebounceRef.current) clearTimeout(hlDebounceRef.current);
            hlDebounceRef.current = setTimeout(() => {
                const pageKey = `${courseId}_${selectedUnit?.id || ''}_${activePage?.id || ''}`;
                supabase.from('study_highlights').upsert({
                    user_id: user.id,
                    page_key: pageKey,
                    html_content: html,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'user_id,page_key' }).then(() => {});
            }, 1500);
        }
    }, [hlStorageKey, user, courseId, selectedUnit, activePage, supabase]);

    // Attach click-to-remove + persist on <mark> elements
    const attachMarkListeners = useCallback(() => {
        if (!htmlContentRef.current) return;
        htmlContentRef.current.querySelectorAll("mark").forEach(mark => {
            if (mark.dataset.hlBound) return;
            mark.dataset.hlBound = "1";
            mark.style.cursor = "pointer";
            mark.title = "클릭하여 형광편 제거";
            mark.addEventListener("click", () => {
                mark.replaceWith(...Array.from(mark.childNodes));
                saveHighlights();
            });
        });
    }, [saveHighlights]);

    // Set HTML content only once per page change (ref-based to preserve highlights)
    useEffect(() => {
        if (!htmlContentRef.current || !activePage?.content) return;
        const pageId = `${selectedUnit?.id || ''}_${activePage.id}_${bookMode ? 'book' : 'single'}`;
        if (lastPageIdRef.current === pageId) return; // already set
        lastPageIdRef.current = pageId;

        // iframe content는 DOM API로 직접 생성 (DOMPurify가 sandbox를 추가하여 로딩 차단하므로)
        const iframeSrcMatch = activePage.content.match(/src="([^"]+)"/);
        if (iframeSrcMatch) {
            htmlContentRef.current.textContent = '';
            // 책모드: 현재 + 다음 페이지 iframe을 1|2 로 병치 (둘 다 iframe일 때만)
            const pagesArr = selectedUnit?.pages || [];
            const curIdx = pagesArr.findIndex(p => p.id === activePage.id);
            const nextPg = curIdx >= 0 && curIdx + 1 < pagesArr.length ? pagesArr[curIdx + 1] : null;
            const nextSrcMatch = nextPg?.content?.match(/src="([^"]+)"/);
            if (bookMode && nextSrcMatch) {
                // 초기 비율은 localStorage 에서 복원 (기본 50%)
                const savedPct = parseFloat(localStorage.getItem('bookmode_split_pct') || '50');
                const initialPct = isNaN(savedPct) ? 50 : Math.max(20, Math.min(80, savedPct));
                const container = document.createElement('div');
                container.setAttribute('data-bookmode-container', '1');
                container.style.cssText = 'display:flex;width:100%;height:100%;min-height:80vh;position:relative';
                const mkPane = (src: string, label: string) => {
                    const wrap = document.createElement('div');
                    wrap.style.cssText = 'position:relative;height:100%;display:flex;flex-direction:column;min-width:0;overflow:hidden';
                    const tag = document.createElement('div');
                    tag.textContent = label;
                    tag.style.cssText = 'position:absolute;top:6px;left:10px;z-index:2;font-size:10px;font-weight:700;color:#94a3b8;letter-spacing:.1em;background:rgba(255,255,255,.85);padding:2px 6px;border-radius:4px';
                    const iframe = document.createElement('iframe');
                    iframe.src = src;
                    iframe.style.cssText = 'width:100%;height:100%;border:none;display:block;flex:1';
                    wrap.appendChild(tag); wrap.appendChild(iframe);
                    return wrap;
                };
                const leftPane = mkPane(iframeSrcMatch[1], `PAGE ${curIdx + 1}`);
                leftPane.style.flex = `0 0 ${initialPct}%`;
                leftPane.style.paddingRight = '6px';
                const rightPane = mkPane(nextSrcMatch[1], `PAGE ${curIdx + 2}`);
                rightPane.style.flex = '1';
                rightPane.style.paddingLeft = '6px';

                // 드래그 핸들 (리사이즈)
                const handle = document.createElement('div');
                handle.setAttribute('role', 'separator');
                handle.setAttribute('aria-label', '좌우 페이지 크기 조절');
                handle.setAttribute('tabindex', '0');
                handle.title = '드래그: 좌우 비율 조절 / 더블클릭: 50:50 리셋';
                handle.style.cssText = 'flex:0 0 8px;cursor:col-resize;background:#e2e8f0;position:relative;user-select:none;transition:background .15s;z-index:3';
                handle.addEventListener('mouseenter', () => { handle.style.background = '#3b82f6'; });
                handle.addEventListener('mouseleave', () => { handle.style.background = '#e2e8f0'; });
                handle.addEventListener('dblclick', () => {
                    leftPane.style.flex = '0 0 50%';
                    try { localStorage.setItem('bookmode_split_pct', '50'); } catch {}
                });
                let dragging = false;
                handle.addEventListener('mousedown', (e) => {
                    dragging = true;
                    e.preventDefault();
                    document.body.style.cursor = 'col-resize';
                });
                const onMove = (e: MouseEvent) => {
                    if (!dragging || !container.isConnected) return;
                    const rect = container.getBoundingClientRect();
                    const pct = ((e.clientX - rect.left) / rect.width) * 100;
                    const clamped = Math.max(20, Math.min(80, pct));
                    leftPane.style.flex = `0 0 ${clamped}%`;
                };
                const onUp = () => {
                    if (!dragging) return;
                    dragging = false;
                    document.body.style.cursor = '';
                    // 현재 비율 저장
                    const flexBasis = leftPane.style.flex.match(/([\d.]+)%/);
                    if (flexBasis) {
                        try { localStorage.setItem('bookmode_split_pct', flexBasis[1]); } catch {}
                    }
                };
                document.addEventListener('mousemove', onMove);
                document.addEventListener('mouseup', onUp);
                // 클린업을 위해 ref에 핸들러 저장 (페이지 변경 시 removeEventListener)
                (container as any).__cleanup = () => {
                    document.removeEventListener('mousemove', onMove);
                    document.removeEventListener('mouseup', onUp);
                };

                container.appendChild(leftPane);
                container.appendChild(handle);
                container.appendChild(rightPane);
                htmlContentRef.current.appendChild(container);
            } else {
                const iframe = document.createElement('iframe');
                iframe.src = iframeSrcMatch[1];
                iframe.style.cssText = 'width:100%;height:100%;border:none;display:block';
                htmlContentRef.current.appendChild(iframe);
            }
        } else {
            // 일반 텍스트 content는 sanitize 적용
            // 담당자 진단: localStorage/supabase study_highlights에 stale HTML(이전 cpp.ts wrapper trick)
            // 저장 → fresh cpp.ts pageImg 무시 → 슬라이드 잘림. cpp 코스(courseId='4')는 항상
            // fresh content 사용 (형광펜 잠깐 사라져도 OK, 슬라이드 fit 우선).
            // 어린이 IT(11)도 동일 — kids-it.ts에 inline style 강제 추가했지만 stale HTML이 무시했음.
            const skipStaleHtml = courseId === '4' || courseId === '11' || isPythonCorePage;
            const saved = skipStaleHtml ? null : localStorage.getItem(hlStorageKey);
            if (saved) {
                htmlContentRef.current.innerHTML = sanitizeHTML(saved);
                attachMarkListeners();
            } else {
                htmlContentRef.current.innerHTML = sanitizeHTML(activePage.content);
                // 다른 코스만 supabase study_highlights load (cpp는 fresh 보장)
                if (user?.id && !skipStaleHtml) {
                    const pageKey = `${courseId}_${selectedUnit?.id || ''}_${activePage?.id || ''}`;
                    supabase.from('study_highlights')
                        .select('html_content')
                        .eq('user_id', user.id)
                        .eq('page_key', pageKey)
                        .maybeSingle()
                        .then(({ data }: { data: { html_content: string | null } | null }) => {
                            if (data?.html_content && htmlContentRef.current) {
                                htmlContentRef.current.innerHTML = sanitizeHTML(data.html_content);
                                localStorage.setItem(hlStorageKey, data.html_content);
                                attachMarkListeners();
                            }
                        });
                }
            }
        }

        // 책모드 drag handler cleanup (페이지/모드 변경 시)
        return () => {
            const prevContainer = htmlContentRef.current?.querySelector('[data-bookmode-container]') as any;
            if (prevContainer?.__cleanup) prevContainer.__cleanup();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activePage, selectedUnit, hlStorageKey, bookMode]);

    // Highlight selected text in content
    const highlightSelection = useCallback((colorId: string) => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed || !htmlContentRef.current) return;
        const range = sel.getRangeAt(0);
        if (!htmlContentRef.current.contains(range.commonAncestorContainer)) return;
        const hlColor = HL_COLORS.find(c => c.id === colorId);
        if (!hlColor) return;
        const mark = document.createElement("mark");
        mark.style.background = hlColor.bg;
        mark.style.borderBottom = `2px solid ${hlColor.solid}`;
        mark.style.padding = "1px 2px";
        mark.style.borderRadius = "3px";
        mark.style.cursor = "pointer";
        mark.title = "클릭하여 형광펜 제거";
        mark.addEventListener("click", () => { mark.replaceWith(...Array.from(mark.childNodes)); saveHighlights(); });
        try {
            range.surroundContents(mark);
        } catch {
            // Cross-element selection: extract and wrap
            const fragment = range.extractContents();
            mark.appendChild(fragment);
            range.insertNode(mark);
        }
        sel.removeAllRanges();
        saveHighlights();
    }, [saveHighlights]);

    // Listen for text selection when highlighter is active
    useEffect(() => {
        if (!activeHL) return;
        const handleMouseUp = () => {
            const sel = window.getSelection();
            if (sel && !sel.isCollapsed) highlightSelection(activeHL);
        };
        document.addEventListener("mouseup", handleMouseUp);
        return () => document.removeEventListener("mouseup", handleMouseUp);
    }, [activeHL, highlightSelection]);

    // ── Init ──
    useEffect(() => {
        if (courseData?.chapters?.[0]) setExpandedChapters(new Set([courseData.chapters[0].id]));
    }, [courseData]);

    // Progress now handled by useStudyProgress hook

    // ── Inject __runCCode ──
    useEffect(() => {
        window.__runCCode = async (btn: HTMLButtonElement) => {
            const code = btn.getAttribute("data-code")?.replace(/\\n/g, "\n").replace(/\\"/g, '"') ?? "";
            btn.disabled = true; btn.textContent = "⏳ 실행 중...";
            const wrapper = btn.closest(".lms-code-wrap");
            try {
                const res = await fetch("/api/compile", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ code, language: courseData?.defaultLanguage ?? "c" }),
                });
                const data = await res.json();
                const output = data.stdout ?? data.program_output ?? data.stderr ?? data.compiler_error ?? data.program_error ?? data.error ?? "(출력 없음)";
                const isError = !!(data.stderr || data.compiler_error || data.program_error || data.error) || !res.ok;
                let outEl = wrapper?.querySelector(".lms-run-output") as HTMLDivElement;
                if (!outEl) { outEl = document.createElement("div"); outEl.className = "lms-run-output"; wrapper?.appendChild(outEl); }
                outEl.innerHTML = sanitizeHTML(`<div class="status ${isError ? "error" : "success"}">${isError ? "✗ 에러" : "✓ 실행 완료"}</div><pre>${output}</pre>`);
            } catch {} finally { btn.disabled = false; btn.textContent = "▶ 실행"; }
        };
        return () => { delete window.__runCCode; };
    }, [courseData?.defaultLanguage]);

    // ── Copy btns ──
    useEffect(() => {
        if (!contentRef.current) return;
        const timer = setTimeout(() => {
            contentRef.current?.querySelectorAll("pre").forEach(pre => {
                if (pre.querySelector(".copy-btn")) return;
                const btn = document.createElement("button");
                btn.className = "copy-btn";
                btn.textContent = "복사";
                Object.assign(btn.style, { position: "absolute", top: "6px", right: "6px", padding: "3px 10px", border: "none", borderRadius: "6px", background: "rgba(255,255,255,0.9)", color: "#475569", fontSize: "10px", fontWeight: "700", cursor: "pointer", opacity: "0", transition: "opacity 0.2s", zIndex: "10" });
                pre.style.position = "relative";
                pre.addEventListener("mouseenter", () => { btn.style.opacity = "1"; });
                pre.addEventListener("mouseleave", () => { btn.style.opacity = "0"; });
                btn.addEventListener("click", async () => {
                    const code = pre.querySelector("code")?.textContent || pre.textContent || "";
                    try { await navigator.clipboard.writeText(code); btn.textContent = "✓"; setTimeout(() => { btn.textContent = "복사"; }, 1200); } catch {}
                });
                pre.appendChild(btn);
            });
        }, 300);
        return () => clearTimeout(timer);
    }, [activePage?.content]);

    // ── Book View: inject CSS into iframe ──
    const isIframePage = !!activePage?.content?.includes('<iframe');

    // ── iframe 코드 실행 버튼 주입 + 스크롤 진행률 ──
    useEffect(() => {
        if (!isIframePage || !htmlContentRef.current) return;

        // 언어 결정: courseId 기반
        const language = courseId === '4' ? 'cpp' : courseId === '3' ? 'python' : null;

        // 이전 스크롤 리스너 정리
        if (scrollCleanupRef.current) { scrollCleanupRef.current(); scrollCleanupRef.current = null; }
        setReadProgress(0);

        // iframe이 DOM에 삽입된 뒤 찾아서 onload 연결
        const attach = () => {
            const iframe = htmlContentRef.current?.querySelector('iframe');
            if (!iframe) return;

            const handleLoad = () => {
                if (language) injectCodeRunner(iframe, language);
                const cleanup = injectScrollTracker(iframe, (pct) => {
                    setReadProgress(pct);
                    // 80% 이상 읽으면 현재 유닛 완료 처리
                    if (pct >= 80 && selectedUnit && !completedUnits.has(selectedUnit.id)) {
                        completeUnit(selectedUnit);
                    }
                });
                scrollCleanupRef.current = cleanup;
            };

            if (iframe.contentDocument?.readyState === 'complete') {
                handleLoad();
            } else {
                iframe.addEventListener('load', handleLoad, { once: true });
            }
        };

        // innerHTML 주입 후 약간 delay (React가 DOM 반영하는 시간)
        const timer = setTimeout(attach, 100);
        return () => {
            clearTimeout(timer);
            if (scrollCleanupRef.current) { scrollCleanupRef.current(); scrollCleanupRef.current = null; }
        };
    // completeUnit은 activePage/selectedUnit 변경 때마다 새로 실행돼야 함
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activePage, isIframePage, courseId]);

    // ── iframe postMessage 리스너 (학습 완료 / 다음 유닛) ──
    useEffect(() => {
        const handler = (e: MessageEvent) => {
            if (e.data?.type === 'unit-complete' && selectedUnit) {
                completeUnit(selectedUnit);
            }
            if (e.data?.type === 'next-unit') {
                // pages는 아래 useMemo 이후 계산되므로 현재 state에서 직접 계산
                if (selectedUnit) {
                    const curUnitIdx = allUnits.findIndex(u => u.id === selectedUnit.id);
                    const nextUnit = curUnitIdx >= 0 && curUnitIdx < allUnits.length - 1
                        ? allUnits[curUnitIdx + 1]
                        : null;
                    if (nextUnit) {
                        selectUnit(nextUnit);
                        // 사이드바 챕터 확장
                        const parentChapter = courseData?.chapters?.find((ch: ChapterType) =>
                            ch.units.some((u: Unit) => u.id === nextUnit.id)
                        );
                        if (parentChapter) {
                            setExpandedChapters(prev => { const n = new Set(prev); n.add(parentChapter.id); return n; });
                        }
                    }
                }
            }
        };
        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedUnit, allUnits, courseData]);

    // ── Actions ──
    const toggleChapter = (id: string) => setExpandedChapters(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

    const selectUnit = (unit: Unit) => {
        setSelectedUnit(unit);
        setSlideMode(false); // 유닛 전환 시 슬라이드 모드 해제
        // Auto-inject HTML textbook page if available (skip for courses with direct page mapping)
        const unitIdx = allUnits.indexOf(unit);
        const skipAutoInject = ['1','2','4','8'].includes(courseId); // 커리큘럼 ts에서 직접 경로 관리
        const htmlPath = skipAutoInject ? null : getHtmlContentPath(courseId, unitIdx + 1);
        let pagesWithHtml = unit.pages ?? [];
        if (htmlPath && !pagesWithHtml.some(p => p.id.endsWith('.0'))) {
            const textbookPage: Page = {
                id: `${unit.unitNumber ?? 0}.0`,
                title: '교재',
                type: '페이지' as const,
                content: `<iframe src="${htmlPath}" style="width:100%;height:100%;border:none;display:block" />`,
            };
            pagesWithHtml = [textbookPage, ...pagesWithHtml];
        }
        const firstPage = pagesWithHtml.find(p => p.content || p.quiz || p.problems) || pagesWithHtml[0] || null;
        setActivePage(firstPage);
        resetQuiz();
    };

    const resetQuiz = () => { setSelectedAnswer(null); setQuizResult(null); setWrongCount(0); setShowHint(false); setShaking(false); setShowProblemAnswer({}); setEditorCode({}); setRunResult({}); setDigitalCreatorAnswer(""); };

    const executeCode = async (probId: number, code: string) => {
        setEditorCode(prev => ({ ...prev, [probId]: code }));
        setRunLoading(prev => ({ ...prev, [probId]: true }));
        setRunResult(prev => ({ ...prev, [probId]: null }));
        try {
            const res = await fetch("/api/compile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code, language: courseData?.defaultLanguage ?? "c" }),
            });
            const data = await res.json();
            const stdout = data.stdout ?? data.program_output ?? "";
            const stderr = data.stderr ?? data.program_error ?? data.compiler_error ?? data.error ?? "";
            const exitCode = typeof data.exitCode === "number"
                ? data.exitCode
                : data.status === "0" || data.success === true
                    ? 0
                    : stderr || !res.ok ? 1 : 0;
            setRunResult(prev => ({ ...prev, [probId]: { stdout, stderr, exitCode } }));
            if (isPythonCorePage && exitCode === 0) {
                const template = activePage?.problems?.find((problem) => problem.id === probId)?.codeTemplate ?? "";
                if (code.trim() !== template.trim()) {
                    markProblemSuccessful(probId);
                    setCompletionMessage("");
                } else {
                    setCompletionMessage("예제 코드를 한 곳 이상 직접 바꾼 뒤 다시 실행하면 코딩 활동이 인정됩니다.");
                }
            }
        } catch { setRunResult(prev => ({ ...prev, [probId]: { stdout: "", stderr: "네트워크 오류", exitCode: 1 } })); }
        finally { setRunLoading(prev => ({ ...prev, [probId]: false })); }
    };

    const handleQuizCheck = (quiz: Quiz, unit: Unit) => {
        if (selectedAnswer === null) return;
        if (selectedAnswer === quiz.answer) {
            setQuizResult("correct");
            trackMission("quiz_solve");
            if (isPythonCorePage && activePage) {
                markQuizCorrect(activePage.id);
            } else {
                setTimeout(() => completeUnit(unit), 1500);
            }
        } else {
            setQuizResult("wrong"); setShaking(true);
            const nw = wrongCount + 1; setWrongCount(nw);
            if (user) { deductXP(user.id, XP_PENALTIES.wrong_answer, `오답: ${unit.title}`); setXpMsg(`-${XP_PENALTIES.wrong_answer} XP`); setTimeout(() => setXpMsg(""), 2500); }
            if (nw >= 3) setShowHint(true);
            setTimeout(() => { setShaking(false); setQuizResult(null); setSelectedAnswer(null); }, 1500);
        }
    };

    const completeUnit = async (unit: Unit) => {
        if (completedUnits.has(unit.id)) return;
        if (unit.id.startsWith("py-core-") && !lessonCompletion.ready) {
            setCompletionMessage("10단계 학습, 확인 퀴즈, 코딩 실습을 모두 마치면 수업을 완료할 수 있어요.");
            return;
        }
        if (unit.id.startsWith("kids-it-first-") && !lessonCompletion.ready) {
            setCompletionMessage("10개 학습 화면과 네 번의 탐험 기록을 모두 마치면 이번 회차를 완료할 수 있어요.");
            return;
        }
        setCompletionMessage("");
        const persisted = await setUnitCompleted(unit.id, true);
        const nc = new Set(completedUnits); nc.add(unit.id);
        resetQuiz();
        if (user) {
            const result = await awardXP("unit_complete", `course:${courseId}:unit:${unit.id}`);
            setXpMsg(`+${XP_REWARDS.lesson_complete} XP!`); setTimeout(() => setXpMsg(""), 3000);
            if (result?.levelUp) setLevelUpInfo({ level: result.level });
            trackMission("lesson_complete");
            checkAchievementBadges({ completedUnits: nc.size, codeRuns: 0, quizStreak: 0 });
            const prog = Math.round((nc.size / allUnits.length) * 100);
            await supabase.from("user_course_progress").upsert({ user_id: user.id, course_id: courseId, progress: prog, completed_lessons: Array.from(nc) }, { onConflict: "user_id,course_id" });
        }
        if (!persisted.savedToCloud && persisted.savedLocally) {
            setCompletionMessage("수업 완료는 이 기기에 저장됐습니다. 인터넷 연결 후 다시 동기화해 주세요.");
        }
    };

    // Page navigation (include injected HTML textbook page)
    const pages = useMemo(() => {
        const basePgs = selectedUnit?.pages ?? [];
        if (!selectedUnit) return basePgs;
        const uIdx = allUnits.indexOf(selectedUnit);
        const skipInject = ['1','2','4','8'].includes(courseId);
        const htmlPath = skipInject ? null : getHtmlContentPath(courseId, uIdx + 1);
        if (htmlPath && !basePgs.some(p => p.id.endsWith('.0'))) {
            const textbookPage: Page = {
                id: `${selectedUnit.unitNumber ?? 0}.0`,
                title: '교재',
                type: '페이지' as const,
                content: `<iframe src="${htmlPath}" style="width:100%;height:100%;border:none;display:block" />`,
            };
            return [textbookPage, ...basePgs];
        }
        return basePgs;
    }, [selectedUnit, allUnits, courseId]);
    const currentPageIdx = pages.findIndex(p => p.id === activePage?.id);
    const prevPage = currentPageIdx > 0 ? pages[currentPageIdx - 1] : null;
    const nextPage = currentPageIdx < pages.length - 1 ? pages[currentPageIdx + 1] : null;
    const navigatePage = (pg: Page) => { setActivePage(pg); resetQuiz(); if (contentRef.current) contentRef.current.scrollTop = 0; };

    // 키보드 단축키 — ←/→ 이전/다음, Esc 라이트박스 닫기
    // 담당자 'F 누르면 확장 되고 미친 버그' (2026-04-28) — F 단독 단축키 제거. 코드 입력 중 'f' 빈번
    // (for/function/false) + Monaco editor의 contentEditable이 target 가드 우회.
    // 향후 패널 토글 단축키 필요하면 modifier 있는 조합 (Ctrl+B 등 VSCode 표준)으로만 추가.
    useEffect(() => {
        const isTextInput = (el: HTMLElement | null) => !!el && (
            el.tagName === "INPUT" ||
            el.tagName === "TEXTAREA" ||
            el.isContentEditable ||
            !!el.closest('.monaco-editor') ||
            el.tagName === "IFRAME"
        );
        const handler = (e: KeyboardEvent) => {
            if (lightboxSrc) {
                if (e.key === "Escape") setLightboxSrc(null);
                return;
            }
            const t = e.target as HTMLElement | null;
            const ae = document.activeElement as HTMLElement | null;
            if (isTextInput(t) || isTextInput(ae)) return;
            if (e.key === "ArrowLeft" && prevPage) { e.preventDefault(); navigatePage(prevPage); }
            if (e.key === "ArrowRight" && nextPage) { e.preventDefault(); navigatePage(nextPage); }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [prevPage, nextPage, lightboxSrc]);

    // 슬라이드 이미지 클릭 → lightbox open + nuclear option: img inline style 강제 적용
    // (sanitizeHTML이 inline style strip하고 글로벌 CSS도 specificity 밀려도 JS로 직접 setProperty('important')로 강제)
    useEffect(() => {
        const root = htmlContentRef.current;
        if (!root) return;

        const handler = (e: MouseEvent) => {
            const t = e.target as HTMLElement;
            if (t.tagName === "IMG") {
                const src = (t as HTMLImageElement).src;
                if (src) setLightboxSrc(src);
            }
        };
        root.addEventListener("click", handler);

        // 모든 img에 inline style 강제 — sanitize/CSS 우회 nuclear option
        const forceImgFit = () => {
            root.querySelectorAll("img").forEach((img) => {
                const el = img as HTMLImageElement;
                el.style.setProperty("width", "100%", "important");
                el.style.setProperty("max-width", "100%", "important");
                el.style.setProperty("height", "auto", "important");
                el.style.setProperty("display", "block", "important");
                el.style.setProperty("margin", "16px auto", "important");
                el.style.setProperty("border-radius", "14px", "important");
                el.style.setProperty("cursor", "zoom-in", "important");
                el.style.setProperty("box-shadow", "0 12px 40px rgba(15,23,42,0.18)", "important");
            });
            // wrapper div도 width 강제
            root.querySelectorAll(".cs-slide-wrap, div").forEach((div) => {
                const el = div as HTMLElement;
                if (el.querySelector("img")) {
                    el.style.setProperty("max-width", "100%", "important");
                    el.style.setProperty("overflow", "hidden", "important");
                }
            });
        };
        forceImgFit();
        // 담당자 'image #4 그대로' — innerHTML 비동기 변경 + img onload 타이밍 보장
        // setTimeout 폴링으로 0/100/300/800ms 시점 모두 강제 (이미지 lazy load 완료 후 재적용)
        const t1 = setTimeout(forceImgFit, 100);
        const t2 = setTimeout(forceImgFit, 300);
        const t3 = setTimeout(forceImgFit, 800);
        // img onload마다 재적용 — lazy load 끝나면 dimension 확정되니 그때 강제
        root.querySelectorAll("img").forEach(img => {
            (img as HTMLImageElement).addEventListener("load", forceImgFit, { once: true });
        });

        // innerHTML이 비동기로 변경되는 경우(supabase fetch 등) MutationObserver로 자동 재적용
        const observer = new MutationObserver(forceImgFit);
        observer.observe(root, { childList: true, subtree: true });

        return () => {
            root.removeEventListener("click", handler);
            observer.disconnect();
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
        };
    }, [activePage?.id, activePage?.content]);

    // 다음 페이지 이미지 prefetch — 학생이 navigate 클릭하면 즉시 표시
    useEffect(() => {
        if (!nextPage?.content) return;
        const matches = nextPage.content.match(/src=["']([^"']+\.(png|jpg|jpeg|webp|svg))["']/gi);
        if (!matches) return;
        matches.forEach((m) => {
            const srcMatch = m.match(/src=["']([^"']+)["']/);
            if (srcMatch?.[1]) {
                const img = new Image();
                img.src = srcMatch[1];
            }
        });
    }, [nextPage?.id, nextPage?.content]);

    if (!courseData) return <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>코스를 찾을 수 없습니다.</div>;

    if (courseData.comingSoon) {
        return (
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "linear-gradient(135deg,#eff6ff,#f8fafc)" }}>
                <div style={{ width: "min(100%, 520px)", padding: 32, borderRadius: 24, background: "#fff", border: "1px solid #dbeafe", boxShadow: "0 20px 60px rgba(15,23,42,0.08)", textAlign: "center" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 44, color: "#3b82f6", marginBottom: 12 }}>construction</span>
                    <h1 style={{ margin: "0 0 10px", color: "#0f172a", fontSize: 26, fontWeight: 900 }}>{courseData.title}</h1>
                    <p style={{ margin: "0 0 24px", color: "#64748b", lineHeight: 1.7, wordBreak: "keep-all" }}>
                        이 코스의 학습 자료 이미지를 준비하고 있습니다. 자료 업로드가 완료되면 바로 열람할 수 있습니다.
                    </p>
                    <Link href="/dashboard/learning" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 18px", borderRadius: 12, background: "#2563eb", color: "#fff", fontWeight: 800, textDecoration: "none" }}>
                        학습 홈으로 돌아가기
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
                    </Link>
                </div>
            </div>
        );
    }

    if (tierLocked && requiredTier) {
        const reqTier = getTierInfo(requiredTier);
        return (
            <div style={{ textAlign: "center", padding: 80, color: "#64748b" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}><span className="material-symbols-outlined" style={{ fontSize: 48 }}>lock</span></div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20, verticalAlign: "middle" }}>{reqTier.icon}</span> {reqTier.nameKo} 이상 전용 코스
                </h2>
                <p style={{ fontSize: 14, marginBottom: 24 }}>
                    이 코스는 <span style={{ color: reqTier.color, fontWeight: 700 }}>{reqTier.nameKo}</span> 등급 이상부터 이용할 수 있습니다.
                </p>
                <button
                    onClick={() => router.push("/dashboard/learning")}
                    style={{
                        padding: "10px 24px", borderRadius: 12, border: "none", cursor: "pointer",
                        background: "linear-gradient(135deg, #0ea5e9, #3b82f6)", color: "#fff",
                        fontSize: 14, fontWeight: 700,
                    }}
                >
                    대시보드로 돌아가기
                </button>
            </div>
        );
    }

    // 자격증 (id:'7') → 서브코스 선택기만 (certId 있으면 아래 일반 뷰 사용)
    if (courseId === '7' && !certId) return <CertificateSelector />;

    // CosPro (id:'5') → show sub-course selector
    if (courseId === '5') return <CosProSelector />;
    if (courseId === "6" && !contestTrack) return <ProgrammingContestSelector />;
    if (courseId === "6" && contestTrack === "c") {
        router.replace("/dashboard/learning/problem-book/c-problems");
        return null;
    }
    if (courseId === "6" && contestTrack === "python") {
        router.replace("/dashboard/learning/problem-book/py-problems");
        return null;
    }

    const progressPct = allUnits.length > 0 ? Math.round((completedUnits.size / allUnits.length) * 100) : 0;

    return (
        <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", background: "#f8fafc" }}>
            <style>{`
                .hide-sb::-webkit-scrollbar{display:none} .hide-sb{-ms-overflow-style:none;scrollbar-width:none}
                @keyframes confetti-pop{0%{transform:scale(0)}50%{transform:scale(1.2)}100%{transform:scale(1)}}
                @keyframes pulse-green{0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,0.4)}50%{box-shadow:0 0 0 12px rgba(16,185,129,0)}}
                .panel-drag{width:6px;cursor:col-resize;background:rgba(147,197,253,0.3);flex-shrink:0;position:relative;z-index:20;transition:background .15s}
                .panel-drag:hover,.panel-drag:active{background:rgba(59,130,246,0.25)}
                .panel-drag::after{content:'';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:2px;height:32px;border-radius:2px;background:#93c5fd;transition:background .15s}
                .panel-drag:hover::after,.panel-drag:active::after{background:#3b82f6}

                /* ── PYTHON CORE · C++형 집중 학습 UI ── */
                .pycore-frame{width:100%;margin:0 auto 24px}
                .pycore-frame-top{display:flex;align-items:center;gap:10px;margin:0 2px 12px;min-height:34px}
                .pycore-frame-count{display:inline-flex;align-items:center;justify-content:center;min-width:58px;height:30px;padding:0 12px;border-radius:999px;background:linear-gradient(135deg,#2563eb,#0ea5e9);color:#fff;font-size:12px;font-weight:900;box-shadow:0 5px 14px rgba(37,99,235,.24)}
                .pycore-frame-context{font-size:11px;color:#64748b;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
                .pycore-save-state{display:inline-flex;align-items:center;gap:5px;margin-left:auto;padding:6px 9px;border:1px solid #dbeafe;border-radius:999px;background:#f8fbff;color:#64748b;font-size:10px;font-weight:800;white-space:nowrap}.pycore-save-state[data-status="saving"],.pycore-save-state[data-status="loading"]{color:#2563eb}.pycore-save-state[data-status="saved"]{color:#047857;border-color:#a7f3d0;background:#ecfdf5}.pycore-save-state[data-status="local"]{color:#b45309;border-color:#fde68a;background:#fffbeb}.pycore-save-state[data-status="error"]{color:#b91c1c;border-color:#fecaca;background:#fef2f2}
                .pycore-focus-btn{margin-left:auto;display:inline-flex;align-items:center;gap:5px;padding:7px 10px;border:1px solid #dbeafe;border-radius:10px;background:#fff;color:#2563eb;font-size:11px;font-weight:800;cursor:pointer}
                .pycore-save-state+.pycore-focus-btn{margin-left:0}
                .pycore-focus-btn:hover{background:#eff6ff}
                .pycore-content{width:100%}
                .pycore-slide{--pc-blue:#2563eb;--pc-cyan:#0ea5e9;--pc-navy:#102a56;--pc-mint:#0f9f7f;--pc-purple:#7154d8;overflow:hidden;width:100%;min-height:620px;border:1px solid #dbeafe;border-radius:22px;background:linear-gradient(145deg,#f8fbff 0%,#eef6ff 54%,#f7f5ff 100%);box-shadow:0 18px 54px rgba(30,64,175,.14),0 2px 8px rgba(15,23,42,.08);color:#1f2d3d}
                .pycore-hero{position:relative;padding:32px 38px 28px;background:radial-gradient(circle at 92% 12%,rgba(56,189,248,.25),transparent 26%),linear-gradient(135deg,#102a56 0%,#173b77 62%,#2563eb 100%);color:#fff}
                .pycore-hero:after{content:'PY';position:absolute;right:28px;bottom:-12px;font:900 88px/1 'JetBrains Mono',monospace;color:rgba(255,255,255,.055);letter-spacing:-8px}
                .pycore-step{display:inline-flex;padding:5px 9px;border-radius:7px;background:#38bdf8;color:#082f49;font:900 10px/1 'JetBrains Mono',monospace;letter-spacing:.8px}
                .pycore-eyebrow{margin-left:9px;font:800 10px/1 'JetBrains Mono',monospace;color:#bfdbfe;letter-spacing:1.2px}
                .pycore-hero h2{position:relative;z-index:1;margin:15px 0 8px;font-size:clamp(24px,3vw,34px);line-height:1.25;letter-spacing:-1px;color:#fff;word-break:keep-all}
                .pycore-hero p{position:relative;z-index:1;max-width:780px;margin:0;color:#dbeafe;font-size:14px;line-height:1.7;word-break:keep-all}
                .pycore-body{padding:30px 38px 34px}
                .pycore-mission-grid,.pycore-choice-grid,.pycore-score-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
                .pycore-card,.pycore-choice-grid>div,.pycore-score-grid>div{padding:20px;border:1px solid #dbeafe;border-radius:17px;background:rgba(255,255,255,.9);box-shadow:0 8px 20px rgba(15,23,42,.05)}
                .pycore-card .material-symbols-outlined,.pycore-score-grid .material-symbols-outlined{display:flex;width:40px;height:40px;align-items:center;justify-content:center;margin-bottom:14px;border-radius:12px;background:#dbeafe;color:#2563eb;font-size:22px}
                .pycore-card-mint .material-symbols-outlined{background:#d1fae5;color:#0f9f7f}.pycore-card-purple .material-symbols-outlined{background:#ede9fe;color:#7154d8}
                .pycore-card strong,.pycore-choice-grid b,.pycore-score-grid b{display:block;margin-bottom:6px;color:#102a56;font-size:16px}.pycore-card p,.pycore-choice-grid p,.pycore-score-grid p{margin:0;color:#64748b;font-size:12px;line-height:1.65}
                .pycore-route{display:flex;align-items:center;justify-content:center;margin:24px 0 18px}.pycore-route span{padding:7px 12px;border-radius:999px;background:#fff;border:1px solid #bfdbfe;color:#1d4ed8;font-size:11px;font-weight:800}.pycore-route i{width:30px;height:2px;background:#bfdbfe}
                .pycore-callout,.pycore-rule{display:grid;grid-template-columns:130px 1fr;overflow:hidden;border-radius:13px;border:1px solid #93c5fd;background:#fff}.pycore-callout b,.pycore-rule b{display:flex;align-items:center;justify-content:center;padding:13px;background:#2563eb;color:#fff;font-size:12px}.pycore-callout span,.pycore-rule span{padding:13px 16px;color:#334155;font-size:12px;font-weight:700;line-height:1.6}
                .pycore-split{display:grid;grid-template-columns:1fr 1fr;gap:15px}.pycore-concept-card{display:flex;gap:16px;padding:20px;border:1px solid #dbeafe;border-radius:18px;background:#fff}.pycore-icon-bubble{display:flex;flex:0 0 46px;height:46px;align-items:center;justify-content:center;border-radius:14px;background:#dbeafe;color:#2563eb}.pycore-icon-bubble.mint{background:#d1fae5;color:#0f9f7f}.pycore-concept-card small{font-size:10px;color:#64748b;font-weight:800}.pycore-concept-card h3{margin:3px 0 10px;color:#102a56;font-size:16px}.pycore-concept-card code,.pycore-code-compare code,.pycore-predict-list code,.pycore-error-card code{display:block;padding:10px 12px;border-radius:9px;background:#102a56;color:#e0f2fe;font:700 12px/1.5 'JetBrains Mono',monospace}.pycore-concept-card p{margin:9px 0 0;color:#64748b;font-size:11px;line-height:1.55}
                .pycore-code-compare{display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-top:15px}.pycore-code-compare>div{padding:15px;border-radius:15px;background:#fff;border:1px solid #dbeafe}.pycore-code-compare span{display:block;margin-bottom:8px;color:#2563eb;font-size:11px;font-weight:900}.pycore-code-compare b{display:block;margin-top:9px;color:#475569;font-size:11px}
                .pycore-question,.pycore-tip{display:flex;align-items:center;gap:11px;margin-top:16px;padding:14px 16px;border-radius:13px;background:#fff7d6;border:1px solid #fde68a;color:#713f12}.pycore-question p,.pycore-tip p{margin:0;font-size:12px;line-height:1.6}
                .pycore-predict-list{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.pycore-predict-list>div{padding:16px;border:1px solid #dbeafe;border-radius:15px;background:#fff}.pycore-predict-list span{display:block;margin-bottom:8px;color:#7154d8;font-size:10px;font-weight:900}.pycore-predict-list p{margin:10px 0 0;color:#64748b;font-size:11px;line-height:1.55}.pycore-rule{margin-top:16px;border-color:#c4b5fd}.pycore-rule b{background:#7154d8}
                .pycore-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.pycore-steps>div{display:flex;gap:11px;padding:14px;border:1px solid #dbeafe;border-radius:14px;background:#fff}.pycore-steps b{display:flex;flex:0 0 30px;height:30px;align-items:center;justify-content:center;border-radius:9px;background:#2563eb;color:#fff}.pycore-steps strong,.pycore-steps small{display:block}.pycore-steps strong{color:#102a56;font-size:12px}.pycore-steps small{margin-top:4px;color:#64748b;font-size:10px;line-height:1.45}
                .pycore-code{margin:16px 0;padding:18px 20px;border-radius:15px;background:#0f2445;color:#dbeafe;overflow:auto;box-shadow:inset 0 0 0 1px rgba(125,211,252,.13)}.pycore-code code{font:600 13px/1.75 'JetBrains Mono',monospace;white-space:pre-wrap}.pycore-check,.pycore-selfcheck{display:flex;flex-wrap:wrap;gap:8px}.pycore-check span,.pycore-selfcheck span{flex:1;min-width:150px;padding:10px 12px;border:1px solid #dbeafe;border-radius:10px;background:#fff;color:#475569;font-size:11px;font-weight:700}
                .pycore-sort-board{display:grid;grid-template-columns:1.4fr 1fr 1fr;overflow:hidden;border:1px solid #bfdbfe;border-radius:15px;background:#fff}.pycore-sort-board>div{padding:12px;border-right:1px solid #dbeafe;border-bottom:1px solid #dbeafe;text-align:center;color:#475569;font-size:12px}.pycore-sort-board>.label{background:#2563eb;color:#fff;font-weight:900}.pycore-sort-board code{font:700 12px 'JetBrains Mono',monospace;color:#102a56}
                .pycore-blueprint{display:grid;grid-template-columns:repeat(5,1fr);gap:9px}.pycore-blueprint>div{padding:14px 10px;border:1px solid #dbeafe;border-radius:13px;background:#fff;text-align:center}.pycore-blueprint span{display:inline-block;padding:3px 7px;border-radius:6px;background:#dbeafe;color:#1d4ed8;font-size:9px;font-weight:900}.pycore-blueprint b,.pycore-blueprint small{display:block}.pycore-blueprint b{margin:9px 0 5px;color:#102a56;font-size:12px}.pycore-blueprint small{color:#64748b;font-size:9px;line-height:1.45}.pycore-blueprint+.pycore-callout{margin-top:16px}
                .pycore-debug-flow{display:flex;align-items:center}.pycore-debug-flow>div{display:flex;flex:1;gap:9px;align-items:center;padding:13px;border:1px solid #fecaca;border-radius:13px;background:#fff}.pycore-debug-flow>i{width:18px;height:2px;background:#fca5a5}.pycore-debug-flow b{display:flex;flex:0 0 28px;height:28px;align-items:center;justify-content:center;border-radius:8px;background:#ef4444;color:#fff}.pycore-debug-flow span,.pycore-debug-flow small{display:block}.pycore-debug-flow span{color:#7f1d1d;font-size:11px;font-weight:800}.pycore-debug-flow small{margin-top:3px;color:#64748b;font-size:9px;line-height:1.4}.pycore-error-card{display:grid;grid-template-columns:100px 1fr;gap:10px;margin:16px 0;padding:15px;border:1px solid #fecaca;border-radius:14px;background:#fff}.pycore-error-card>span{display:flex;align-items:center;justify-content:center;border-radius:9px;background:#fee2e2;color:#b91c1c;font:800 11px 'JetBrains Mono',monospace}.pycore-error-card p{grid-column:1/-1;margin:0;color:#64748b;font-size:11px}
                .pycore-choice-grid>div>span{display:inline-block;margin-bottom:9px;padding:4px 7px;border-radius:6px;background:#ede9fe;color:#6d28d9;font:900 9px 'JetBrains Mono',monospace}.pycore-score-grid{grid-template-columns:repeat(4,1fr)}.pycore-score-grid>div{text-align:center}.pycore-score-grid .material-symbols-outlined{margin:0 auto 12px}
                .pycore-reflection{display:grid;gap:10px}.pycore-reflection>div{display:flex;gap:14px;align-items:center;padding:14px 16px;border:1px solid #dbeafe;border-radius:14px;background:#fff}.pycore-reflection>div>span{display:flex;flex:0 0 36px;height:36px;align-items:center;justify-content:center;border-radius:10px;background:#dbeafe;color:#1d4ed8;font-size:11px;font-weight:900}.pycore-reflection p,.pycore-reflection b,.pycore-reflection small{display:block;margin:0}.pycore-reflection b{color:#102a56;font-size:12px}.pycore-reflection small{margin-top:3px;color:#64748b;font-size:10px}.pycore-homework{display:flex;gap:16px;align-items:center;margin:16px 0;padding:18px;border-radius:16px;background:linear-gradient(135deg,#dbeafe,#ede9fe);border:1px solid #bfdbfe}.pycore-homework>.material-symbols-outlined{display:flex;flex:0 0 46px;height:46px;align-items:center;justify-content:center;border-radius:14px;background:#2563eb;color:#fff}.pycore-homework small{color:#1d4ed8;font-size:10px;font-weight:900}.pycore-homework h3{margin:2px 0 5px;color:#102a56;font-size:15px}.pycore-homework p{margin:0;color:#475569;font-size:11px;line-height:1.55}
                .pycore-completion{margin:22px 0 8px;padding:22px;border:1px solid #bae6fd;border-radius:20px;background:linear-gradient(145deg,#fff,#f0f9ff);box-shadow:0 12px 32px rgba(14,165,233,.08)}.pycore-completion h3{margin:0 0 6px;color:#102a56;font-size:18px}.pycore-completion>p{margin:0;color:#64748b;font-size:12px;line-height:1.6}.pycore-completion-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:16px 0}.pycore-completion-grid>div{padding:13px;border:1px solid #dbeafe;border-radius:13px;background:#fff}.pycore-completion-grid span,.pycore-completion-grid b{display:block}.pycore-completion-grid span{color:#64748b;font-size:10px;font-weight:800}.pycore-completion-grid b{margin-top:5px;color:#1d4ed8;font-size:16px}.pycore-complete-btn{width:100%;padding:13px 18px;border:0;border-radius:13px;background:linear-gradient(135deg,#10b981,#059669);color:#fff;font-size:13px;font-weight:900;cursor:pointer;box-shadow:0 7px 18px rgba(5,150,105,.2)}.pycore-complete-btn:disabled{background:#cbd5e1;box-shadow:none;cursor:not-allowed}.pycore-completion-message{margin-top:10px!important;padding:9px 11px;border-radius:9px;background:#fff7ed;color:#9a3412!important;font-weight:700}
                @media(max-width:960px){.pycore-slide{min-height:auto}.pycore-hero,.pycore-body{padding-left:24px;padding-right:24px}.pycore-mission-grid,.pycore-choice-grid,.pycore-predict-list,.pycore-steps{grid-template-columns:1fr}.pycore-score-grid{grid-template-columns:1fr 1fr}.pycore-blueprint{grid-template-columns:1fr 1fr}.pycore-debug-flow{display:grid;grid-template-columns:1fr 1fr;gap:8px}.pycore-debug-flow>i{display:none}}
                @media(max-width:620px){.pycore-hero,.pycore-body{padding-left:18px;padding-right:18px}.pycore-split,.pycore-code-compare{grid-template-columns:1fr}.pycore-score-grid{grid-template-columns:1fr}.pycore-route{display:grid;grid-template-columns:1fr 1fr;gap:6px}.pycore-route i{display:none}.pycore-callout,.pycore-rule{grid-template-columns:1fr}.pycore-blueprint{grid-template-columns:1fr}.pycore-debug-flow{grid-template-columns:1fr}.pycore-frame-context{display:none}.pycore-completion-grid{grid-template-columns:1fr}.pycore-save-state{margin-left:auto}.pycore-focus-btn{display:none}}

                /* ── MOBILE ── */
                @media (max-width: 768px) {
                    .course-left-panel {
                        position: fixed !important;
                        top: 0; left: 0; bottom: 0;
                        z-index: 200;
                        width: min(85vw, 300px) !important;
                        box-shadow: 4px 0 24px rgba(0,0,0,0.15);
                    }
                    .course-left-panel-closed {
                        transform: translateX(-100%) !important;
                        opacity: 0 !important;
                        pointer-events: none;
                    }
                    .course-right-panel {
                        display: none !important;
                    }
                    .course-panel-drag { display: none !important; }
                    .course-content-pad {
                        padding: 20px 16px 80px !important;
                    }
                    .course-toolbar {
                        padding: 6px 12px !important;
                        gap: 4px !important;
                        flex-wrap: wrap;
                        overflow-x: auto;
                    }
                    .course-iframe-wrap {
                        touch-action: pan-y;
                        display: flex;
                        flex-direction: column;
                    }
                    .course-iframe-wrap > div {
                        flex: 1;
                        min-height: 0;
                    }
                    .course-iframe-wrap iframe {
                        width: 100%;
                        height: 100%;
                        min-height: 80vh;
                        border: none;
                    }
                }
                @media (max-width: 768px) {
                    .course-mobile-overlay {
                        display: block !important;
                        position: fixed; inset: 0; z-index: 199;
                        background: rgba(0,0,0,0.4);
                    }
                }
                .course-mobile-overlay { display: none; }
            `}</style>

            {levelUpInfo && <LevelUpModal level={levelUpInfo.level} onClose={() => setLevelUpInfo(null)} />}

            {/* BookViewer fullscreen overlay */}
            {bookViewerOpen && isIframePage && activePage?.content && (activePage.content.match(/src="([^"]+)"/) ?? [])[1] ? (() => {
                const curIdx = allUnits.findIndex(u => u.id === selectedUnit?.id);
                const nextUnit = curIdx >= 0 && curIdx < allUnits.length - 1 ? allUnits[curIdx + 1] : null;
                const unitDone = selectedUnit ? completedUnits.has(selectedUnit.id) : false;
                return (
                    <BookViewer
                        src={(activePage.content.match(/src="([^"]+)"/) ?? [])[1]!}
                        unitTitle={`Unit ${selectedUnit?.unitNumber}. ${selectedUnit?.title ?? ""}`}
                        onClose={() => setBookViewerOpen(false)}
                        isCompleted={unitDone}
                        onComplete={selectedUnit && !unitDone ? () => completeUnit(selectedUnit) : undefined}
                        onNext={nextUnit ? () => {
                            selectUnit(nextUnit);
                        } : undefined}
                        nextUnitTitle={nextUnit ? nextUnit.title : undefined}
                    />
                );
            })() : null}
            {/*
              XP 알림: Local xpMsg UI 비활성화 (피드백 L29 중첩 해결)
              awardXP()가 내부에서 dispatchEvent('xp-earned')를 발사하고,
              layout.tsx의 Global <XPToast>가 유일한 표시 경로가 된다.
              xpMsg state는 -XP(감점) 표시용으로만 남겨두되 렌더는 생략.
              근본 원인은 docs/xp-toast-duplication-analysis.md 참조.
            */}
            {/* Local XP toast deliberately removed to prevent duplication with Global XPToast */}

            {/* ══════════════════════════════════════════════
                LEFT PANEL — 커리큘럼 트리
               ══════════════════════════════════════════════ */}
            {/* Mobile overlay backdrop */}
            {leftOpen && <div className="course-mobile-overlay" onClick={() => setLeftOpen(false)} />}

            <aside
                className={`course-left-panel${!leftOpen ? " course-left-panel-closed" : ""}`}
                style={{ width: leftOpen ? leftW : 0, opacity: leftOpen ? 1 : 0, flexShrink: 0, overflow: "hidden", borderRight: leftOpen ? "1px solid #e2e8f0" : "none", background: "#fff", display: "flex", flexDirection: "column", transition: isDragging ? "none" : "width .25s ease, opacity .2s ease" }}>

                {/* Header */}
                <div style={{ padding: "20px 16px 12px", borderBottom: "1px solid #f1f5f9" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                        <Link href={courseBackHref} style={{ fontSize: 11, color: "#94a3b8", textDecoration: "none", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                            <MI icon="arrow_back" style={{ fontSize: 14 }} /> 대시보드
                        </Link>
                        <button onClick={() => setLeftOpen(false)} aria-label="커리큘럼 패널 접기" style={{ width: 26, height: 26, borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 15, color: "#94a3b8" }}>chevron_left</span>
                        </button>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 28 }}>{courseData.icon}</span>
                        <div>
                            <h2 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0, lineHeight: 1.3 }}>{courseDisplayTitle}</h2>
                            <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>{allUnits.length}개 유닛</span>
                        </div>
                    </div>
                    {/* Progress */}
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b" }}>진행률</span>
                        <span style={{ fontSize: 10, fontWeight: 800, color: progressPct === 100 ? "#10b981" : "#3b82f6" }}>{progressPct}%</span>
                    </div>
                    <div style={{ height: 6, background: "#f1f5f9", borderRadius: 999, overflow: "hidden" }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${progressPct}%` }} style={{ height: "100%", background: courseData.gradient, borderRadius: 999 }} />
                    </div>
                </div>

                {/* Chapter Tree */}
                <div className="hide-sb" style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
                    {courseData.chapters.map((ch: ChapterType) => {
                        const isExp = expandedChapters.has(ch.id);
                        const chDone = ch.units.filter(u => completedUnits.has(u.id)).length;
                        return (
                            <div key={ch.id} style={{ marginBottom: 2 }}>
                                {/* Chapter header */}
                                <button onClick={() => toggleChapter(ch.id)} style={{
                                    width: "100%", padding: "10px 16px", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                                    background: isExp ? "rgba(99,102,241,0.04)" : "transparent", textAlign: "left", transition: "background 0.15s",
                                }}>
                                    <span style={{ fontSize: 10, transition: "transform 0.2s", transform: isExp ? "rotate(90deg)" : "rotate(0)", color: "#94a3b8" }}>▶</span>
                                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{ch.icon}</span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 9, fontWeight: 800, color: "#94a3b8", letterSpacing: 1, textTransform: "uppercase" as const }}>CH.{ch.chapterNumber}</div>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ch.title}</div>
                                        {/* 챕터 진행률 fine progress bar */}
                                        {chDone > 0 && (
                                            <div style={{ height: 2, background: "#f1f5f9", borderRadius: 999, marginTop: 4, overflow: "hidden" }}>
                                                <div style={{
                                                    height: "100%",
                                                    width: `${(chDone / ch.units.length) * 100}%`,
                                                    background: chDone === ch.units.length ? "linear-gradient(90deg,#10b981,#059669)" : "linear-gradient(90deg,#3b82f6,#6366f1)",
                                                    borderRadius: 999,
                                                    transition: "width 0.3s ease",
                                                }} />
                                            </div>
                                        )}
                                    </div>
                                    <span style={{ fontSize: 9, fontWeight: 800, color: chDone === ch.units.length ? "#10b981" : "#94a3b8", padding: "2px 6px", borderRadius: 6, background: chDone === ch.units.length ? "#f0fdf4" : "#f8fafc" }}>{chDone}/{ch.units.length}</span>
                                </button>

                                {/* Units */}
                                <AnimatePresence initial={false}>
                                    {isExp && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
                                            {ch.units.map((unit, i) => {
                                                const done = completedUnits.has(unit.id);
                                                const prevU = i > 0 ? ch.units[i - 1] : null;
                                                const locked = prevU ? !completedUnits.has(prevU.id) && !done : false;
                                                const isSelected = selectedUnit?.id === unit.id;
                                                const uIdx = allUnits.indexOf(unit);
                                                const hasHtml = !!getHtmlContentPath(courseId, uIdx + 1);
                                                const hasContent = unit.pages?.some(p => p.content || p.quiz || p.problems) || unit.content || hasHtml;
                                                return (
                                                    <button key={unit.id} onClick={() => !locked && hasContent && selectUnit(unit)} disabled={locked || !hasContent}
                                                        style={{
                                                            width: "100%", padding: "8px 16px 8px 40px", border: "none", cursor: locked || !hasContent ? "not-allowed" : "pointer",
                                                            display: "flex", alignItems: "center", gap: 8, textAlign: "left", transition: "all 0.15s",
                                                            background: isSelected ? "linear-gradient(90deg, rgba(99,102,241,0.08), transparent)" : "transparent",
                                                            borderLeft: isSelected ? "3px solid #3b82f6" : "3px solid transparent",
                                                            opacity: locked ? 0.4 : !hasContent ? 0.5 : 1,
                                                        }}>
                                                        <div style={{
                                                            width: 22, height: 22, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                                                            background: done ? "#10b981" : locked ? "#e2e8f0" : isSelected ? "#3b82f6" : "#f1f5f9",
                                                            color: (done || isSelected) ? "#fff" : locked ? "#cbd5e1" : "#64748b", fontSize: 9, fontWeight: 800,
                                                        }}>{done ? <span className="material-symbols-outlined" style={{fontSize:12}}>check</span> : locked ? <span className="material-symbols-outlined" style={{fontSize:12}}>lock</span> : unit.unitNumber}</div>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{ fontSize: 11, fontWeight: isSelected ? 700 : 600, color: isSelected ? "#0f172a" : done ? "#64748b" : "#334155", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{unit.title}</div>
                                                            {unit.duration && <div style={{ fontSize: 9, color: "#94a3b8" }}>{unit.duration}</div>}
                                                        </div>
                                                        {!hasContent && <span style={{ fontSize: 8, color: "#94a3b8", fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: "#f1f5f9" }}>준비중</span>}
                                                    </button>
                                                );
                                            })}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            </aside>

            {/* Left drag handle + toggle */}
            {leftOpen && <div className="panel-drag" onMouseDown={(e) => startDrag("left", e)} onDoubleClick={() => setLeftOpen(false)} title="드래그: 크기 조절 / 더블클릭: 접기" />}
            {!leftOpen && (
                <button onClick={() => setLeftOpen(true)} aria-label="커리큘럼 패널 열기" style={{ width: 24, height: 48, position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", zIndex: 50, borderRadius: "0 8px 8px 0", border: "1px solid #bfdbfe", borderLeft: "none", background: "#eff6ff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "2px 0 8px rgba(59,130,246,0.08)" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: "#3b82f6" }}>chevron_right</span>
                </button>
            )}

            {/* ══════════════════════════════════════════════
                CENTER PANEL — 학습 콘텐츠
               ══════════════════════════════════════════════ */}
            <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>

                {selectedUnit && activePage ? (
                    <>
                        {/* Toolbar — 형광펜 + 보기 모드 (cpp/어린이IT는 hide) */}
                        <div className="course-toolbar" style={{ display: usesFocusedLessonUx ? "none" : "flex", alignItems: "center", justifyContent: "center", gap: 6, borderBottom: "1px solid #e2e8f0", background: "#fff", padding: "8px 24px", flexShrink: 0 }}>
                            {!isIframePage && <>
                            <MI icon="ink_highlighter" style={{ fontSize: 16, color: activeHL ? HL_COLORS.find(c => c.id === activeHL)?.solid || "#3b82f6" : "#94a3b8" }} />
                            {HL_COLORS.map(c => {
                                const isOn = activeHL === c.id;
                                return (
                                    <button key={c.id} onClick={() => setActiveHL(isOn ? null : c.id)} title={c.label}
                                        style={{
                                            width: 24, height: 18, borderRadius: 6, cursor: "pointer", transition: "all 0.15s", position: "relative",
                                            border: isOn ? `2px solid ${c.solid}` : "1px solid #e2e8f0",
                                            background: c.bg,
                                            transform: isOn ? "scale(1.15)" : "scale(1)",
                                            boxShadow: isOn ? `0 2px 6px ${c.bg}` : "none",
                                        }}>
                                        <div style={{ position: "absolute", bottom: 2, left: 4, right: 4, height: 2, background: c.solid, borderRadius: 1 }} />
                                    </button>
                                );
                            })}
                            {activeHL && (
                                <button onClick={() => setActiveHL(null)} title="형광펜 끄기" style={{ width: 20, height: 18, borderRadius: 6, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", fontSize: 10, color: "#94a3b8", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                            )}
                            {activeHL && <span style={{ fontSize: 10, color: HL_COLORS.find(c => c.id === activeHL)?.solid || "#3b82f6", fontWeight: 700, marginLeft: 4 }}>텍스트를 드래그하세요</span>}
                            </>}

                            {/* 뷰모드 전환 */}
                            {isIframePage && (
                                <>
                                    <span style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>Unit {selectedUnit.unitNumber}. {selectedUnit.title}</span>
                                    <div style={{ flex: 1 }} />
                                    {/* 책 모드 토글 (피드백 #G) — ON 시 커리큘럼 자동 닫힘 + 1|2 iframe 분할 */}
                                    <button
                                        onClick={toggleBookMode}
                                        title={bookMode ? "책 모드 끄기 (커리큘럼 다시 열림)" : "책 모드 — 1|2 페이지 분할"}
                                        style={{
                                            padding: "5px 12px", borderRadius: 8, border: "none",
                                            background: bookMode ? "linear-gradient(135deg, #3b82f6, #2563eb)" : "#f1f5f9",
                                            color: bookMode ? "#fff" : "#64748b",
                                            fontSize: 11, fontWeight: 700, cursor: "pointer",
                                            display: "flex", alignItems: "center", gap: 5, marginRight: 8,
                                        }}
                                    >
                                        <MI icon={bookMode ? "menu_book" : "auto_stories"} style={{ fontSize: 14 }} />
                                        {bookMode ? "책모드 ON" : "책모드"}
                                    </button>
                                    {/* 수업자료 슬라이드 토글 */}
                                    {(courseId === "4" || courseId === "10") && (() => {
                                        // C언어: HTML 파일명에서 PDF 경로 추출
                                        // AI 강의: 유닛 ID에서 직접 PDF 경로 생성
                                        let hasPdf = false;
                                        if (courseId === "4") {
                                            const pg = selectedUnit?.pages?.find((p: any) => p.content?.includes('<iframe'));
                                            hasPdf = !!pg;
                                        } else if (courseId === "10") {
                                            hasPdf = true; // AI 강의는 유닛 ID = PDF 파일명
                                        }
                                        if (!hasPdf) return null;
                                        return (
                                            <button
                                                onClick={() => setSlideMode(!slideMode)}
                                                title={slideMode ? "교재 보기" : "수업자료 슬라이드 보기"}
                                                style={{
                                                    padding: "5px 12px", borderRadius: 8, border: "none",
                                                    background: slideMode ? "linear-gradient(135deg, #0ea5e9, #2563eb)" : "#f1f5f9",
                                                    color: slideMode ? "#fff" : "#64748b",
                                                    fontSize: 11, fontWeight: 700, cursor: "pointer",
                                                    display: "flex", alignItems: "center", gap: 5, marginRight: 8,
                                                }}
                                            >
                                                <MI icon={slideMode ? "slideshow" : "slideshow"} style={{ fontSize: 14 }} />
                                                {slideMode ? "교재 보기" : "수업자료"}
                                            </button>
                                        );
                                    })()}

                                    {/* 읽기 진행률 바 */}
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginRight: 4 }} title={`읽기 진행률 ${readProgress}%`}>
                                        <span style={{ fontSize: 10, color: readProgress >= 80 ? "#16a34a" : "#64748b", fontWeight: 700, minWidth: 28, textAlign: "right" }}>{readProgress}%</span>
                                        <div style={{ width: 80, height: 6, background: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}>
                                            <div style={{ width: `${readProgress}%`, height: "100%", background: readProgress >= 80 ? "#16a34a" : "#2563eb", borderRadius: 3, transition: "width 0.3s ease" }} />
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setBookViewerOpen(true)}
                                        title="분할 뷰어 열기"
                                        style={{ padding: "5px 10px", borderRadius: 8, cursor: "pointer", border: "1px solid rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.06)", color: "#4f46e5", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                                        <MI icon="menu_book" style={{ fontSize: 15 }} />
                                        분할 뷰
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Content */}
                        {slideMode && (courseId === "4" || courseId === "10") ? (
                            /* ── 수업자료 슬라이드 모드 ── */
                            (() => {
                                let pdfUrl = '';
                                if (courseId === "4") {
                                    const pg = selectedUnit.pages?.find((p: any) => p.content?.includes('<iframe'));
                                    const m = pg?.content?.match(/src=["']([^"']+)["']/);
                                    const fn = m ? (m[1].split('/').pop() || '') : '';
                                    pdfUrl = fn ? `/slides/c-lang/${fn.replace('.html', '.pdf')}` : '';
                                } else if (courseId === "10") {
                                    pdfUrl = `/slides/ai/${selectedUnit.id}.pdf`;
                                }
                                return (
                                    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
                                        <iframe
                                            src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
                                            title="수업자료 슬라이드"
                                            style={{ width: "100%", flex: 1, border: "none", minHeight: "80vh" }}
                                        />
                                    </div>
                                );
                            })()
                        ) : (
                        <div ref={contentRef} className={`hide-sb${isIframePage ? " course-iframe-wrap" : " course-content-pad"}`} style={{
                            flex: 1, overflowY: isIframePage ? "hidden" : "auto",
                            // cpp/어린이IT: 풀폭 활용 (담당자 '공간 낭비'). 다른 코스: 1080 가운데.
                            padding: isIframePage
                                ? 0
                                : usesFocusedLessonUx
                                    ? "16px 16px 100px"
                                    : "32px max(40px, calc((100% - 1080px) / 2)) 120px",
                            background: isIframePage ? "#fafafa" : undefined,
                            position: "relative",
                            minHeight: 0,
                        }}>
                                                        {/* Page header — breadcrumb + progress + title (cpp/어린이IT는 hide — 담당자 '딱 수업자료만') */}
                            {!isIframePage && !usesFocusedLessonUx && (() => {
                                const currentChapter = courseData.chapters.find((c: any) => c.units.some((u: any) => u.id === selectedUnit.id));
                                const unitIdxInChapter = currentChapter ? currentChapter.units.findIndex((u: any) => u.id === selectedUnit.id) + 1 : 0;
                                const totalInChapter = currentChapter?.units.length || 0;
                                const typeColors: Record<string, { bg: string; fg: string }> = {
                                    "퀴즈": { bg: "#eff6ff", fg: "#1d4ed8" },
                                    "핵심정리": { bg: "#f0f9ff", fg: "#0284c7" },
                                    "이론": { bg: "#eef2ff", fg: "#4f46e5" },
                                    "실습": { bg: "#fef3c7", fg: "#92400e" },
                                    "종합": { bg: "#fce7f3", fg: "#be185d" },
                                };
                                const t = typeColors[activePage.type] || { bg: "#f0fdf4", fg: "#059669" };
                                return (
                                    <motion.div
                                        key={`hdr-${activePage.id}`}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                        style={{ marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid #f1f5f9" }}
                                    >
                                        {/* Breadcrumb */}
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, fontSize: 11, fontWeight: 700, flexWrap: "wrap" }}>
                                            {currentChapter && (
                                                <>
                                                    <span style={{ color: "#3b82f6" }}>{currentChapter.title}</span>
                                                    <span style={{ color: "#cbd5e1" }}>›</span>
                                                </>
                                            )}
                                            <span style={{ color: "#64748b" }}>
                                                {totalInChapter > 0 && (
                                                    <>
                                                        <span style={{ color: "#0f172a", fontWeight: 800 }}>{unitIdxInChapter}/{totalInChapter}.</span>{" "}
                                                    </>
                                                )}
                                                {selectedUnit.title}
                                            </span>
                                            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
                                                {selectedUnit.duration && (
                                                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 999, fontSize: 10, fontWeight: 700, background: "#f8fafc", color: "#64748b", border: "1px solid #e2e8f0" }}>
                                                        <MI icon="schedule" style={{ fontSize: 12 }} />
                                                        {selectedUnit.duration}
                                                    </span>
                                                )}
                                                <button
                                                    onClick={() => { const wasOpen = leftOpen || rightOpen; setLeftOpen(!wasOpen); setRightOpen(!wasOpen); }}
                                                    title="집중 모드 — 양쪽 패널 hide (단축키: F)"
                                                    style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 999, fontSize: 10, fontWeight: 700, background: (!leftOpen && !rightOpen) ? "linear-gradient(135deg,#1e293b,#0f172a)" : "#f8fafc", color: (!leftOpen && !rightOpen) ? "#fff" : "#64748b", border: "1px solid #e2e8f0", cursor: "pointer", fontFamily: "inherit" }}
                                                >
                                                    <MI icon="center_focus_strong" style={{ fontSize: 12 }} />
                                                    집중
                                                </button>
                                                <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 9, fontWeight: 800, background: t.bg, color: t.fg, letterSpacing: 0.3 }}>
                                                    {activePage.type}
                                                </span>
                                            </div>
                                        </div>
                                        {/* Progress bar */}
                                        {totalInChapter > 0 && (
                                            <div style={{ height: 4, borderRadius: 999, background: "#f1f5f9", overflow: "hidden", marginBottom: 16 }}>
                                                <div style={{
                                                    height: "100%",
                                                    width: `${(unitIdxInChapter / totalInChapter) * 100}%`,
                                                    background: "linear-gradient(90deg, #3b82f6, #6366f1)",
                                                    borderRadius: 999,
                                                    transition: "width 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                                                }} />
                                            </div>
                                        )}
                                        {/* Title */}
                                        <h1 style={{ fontSize: 26, fontWeight: 900, color: "#0f172a", margin: 0, lineHeight: 1.3, letterSpacing: -0.5 }}>{activePage.title}</h1>
                                    </motion.div>
                                );
                            })()}

                            {/* HTML content — cpp(4)는 React img 직접 렌더, 어린이 IT(11)는 HTML 슬라이드 렌더 */}
                            {activePage.content && (
                                (courseId === '4') ? (() => {
                                    // src 추출 후 React img 직접 — sanitize/innerHTML/캐시/CSS 모든 layer 우회
                                    const m = activePage.content.match(/src=["']([^"']+\.(?:png|jpg|jpeg|webp|svg))["']/i);
                                    const src = m?.[1];
                                    if (!src) return null;
                                    const cppCurIdx = allUnits.findIndex((u: any) => u.id === selectedUnit?.id);
                                    const cppUnitN = cppCurIdx + 1;
                                    const cppCurChapter = courseData.chapters.find((c: any) => c.units.some((u: any) => u.id === selectedUnit?.id));
                                    return (
                                        <motion.div
                                            key={`cpp-content-${activePage.id}`}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.35, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
                                            style={{
                                                width: "100%",
                                                maxWidth: "100%",
                                                margin: "16px auto",
                                                marginBottom: activePage.quiz || (activePage.problems && activePage.problems.length > 0) ? 32 : 16,
                                            }}
                                        >
                                            {/* Minimal header — 담당자 '숫자대로 나열 1~5 이렇게' */}
                                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, padding: "0 4px", flexWrap: "wrap" as const }}>
                                                <span style={{
                                                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                                                    minWidth: 32, height: 28, padding: "0 10px", borderRadius: 999,
                                                    background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                                                    color: "#fff", fontSize: 13, fontWeight: 800, letterSpacing: 0.3,
                                                    boxShadow: "0 2px 8px rgba(37,99,235,0.25)",
                                                }}>
                                                    {cppUnitN}
                                                </span>
                                                <span style={{ color: "#cbd5e1", fontSize: 11, fontWeight: 700 }}>/ {allUnits.length}</span>
                                                {cppCurChapter && (
                                                    <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>
                                                        · {cppCurChapter.title}
                                                    </span>
                                                )}
                                                <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 800, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                                                    {selectedUnit?.title}
                                                </span>
                                            </div>
                                            <img
                                                src={src}
                                                alt={activePage.title}
                                                onClick={() => setLightboxSrc(src)}
                                                loading="lazy"
                                                style={{
                                                    display: "block",
                                                    width: "100%",
                                                    height: "auto",
                                                    maxWidth: "100%",
                                                    borderRadius: 14,
                                                    boxShadow: "0 12px 40px rgba(15,23,42,0.18)",
                                                    cursor: "zoom-in",
                                                    transition: "transform 0.25s, box-shadow 0.25s",
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.transform = "translateY(-3px)";
                                                    e.currentTarget.style.boxShadow = "0 16px 48px rgba(15,23,42,0.22)";
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.transform = "translateY(0)";
                                                    e.currentTarget.style.boxShadow = "0 12px 40px rgba(15,23,42,0.18)";
                                                }}
                                            />
                                        </motion.div>
                                    );
                                })() : isPythonCorePage ? (() => {
                                    const corePageIndex = (selectedUnit.pages?.findIndex((p) => p.id === activePage.id) ?? 0) + 1;
                                    const corePageTotal = selectedUnit.pages?.length ?? 1;
                                    const coreChapter = courseData.chapters.find((chapter) => chapter.units.some((unit) => unit.id === selectedUnit.id));
                                    return (
                                        <motion.section
                                            key={`python-core-content-${activePage.id}`}
                                            className="pycore-frame"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                        >
                                            <div className="pycore-frame-top">
                                                <span className="pycore-frame-count">{corePageIndex} / {corePageTotal}</span>
                                                <span className="pycore-frame-context">{coreChapter?.title} · {selectedUnit.title}</span>
                                                <span className="pycore-save-state" data-status={answerSaveStatus === "idle" ? lessonProgressSaveStatus : answerSaveStatus}>
                                                    <MI icon={(answerSaveStatus === "saving" || answerSaveStatus === "loading") ? "sync" : answerSaveStatus === "error" ? "cloud_off" : answerSaveStatus === "local" ? "save" : "cloud_done"} style={{ fontSize: 13 }} />
                                                    {(answerSaveStatus === "saving" || answerSaveStatus === "loading") ? "저장 중" : answerSaveStatus === "error" ? "저장 오류" : answerSaveStatus === "local" ? "기기에 저장" : "자동 저장됨"}
                                                </span>
                                                <button
                                                    className="pycore-focus-btn"
                                                    onClick={() => {
                                                        const shouldOpen = !leftOpen && !rightOpen;
                                                        setLeftOpen(shouldOpen);
                                                        setRightOpen(shouldOpen);
                                                    }}
                                                    title="양쪽 패널을 접거나 엽니다"
                                                >
                                                    <MI icon="center_focus_strong" style={{ fontSize: 14 }} />
                                                    {!leftOpen && !rightOpen ? '도구 열기' : '집중 모드'}
                                                </button>
                                            </div>
                                            <div ref={htmlContentRef} className="pycore-content" />
                                        </motion.section>
                                    );
                                })() : (
                                    <motion.div
                                        ref={htmlContentRef}
                                        key={`content-${activePage.id}`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.35, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
                                        style={{
                                            maxWidth: "100%", margin: "0 auto",
                                            fontSize: isIframePage ? undefined : 14,
                                            lineHeight: isIframePage ? undefined : 1.9,
                                            color: isIframePage ? undefined : "#334155",
                                            height: isIframePage ? "100%" : undefined,
                                            marginBottom: activePage.quiz || (activePage.problems && activePage.problems.length > 0) ? 32 : 0,
                                        }}
                                    />
                                )
                            )}

                            {isDigitalCreatorPage && activePage.activity && (
                                <section className="kids-activity-panel">
                                    <div className="kids-activity-top">
                                        <span>{activePage.activity.label}</span>
                                        <b data-status={answerSaveStatus}>
                                            <MI icon={(answerSaveStatus === "saving" || answerSaveStatus === "loading") ? "sync" : answerSaveStatus === "error" ? "cloud_off" : answerSaveStatus === "local" ? "save" : "cloud_done"} style={{ fontSize: 15 }} />
                                            {(answerSaveStatus === "saving" || answerSaveStatus === "loading") ? "저장 중" : answerSaveStatus === "error" ? "저장 오류" : answerSaveStatus === "local" ? "이 기기에 저장" : "자동 저장됨"}
                                        </b>
                                    </div>
                                    <h3>{activePage.activity.prompt}</h3>
                                    {activePage.activity.example && <p className="kids-activity-example"><strong>생각이 안 날 때 예시</strong>{activePage.activity.example}</p>}
                                    <textarea
                                        value={digitalCreatorAnswer}
                                        onChange={(event) => updateDigitalCreatorAnswer(event.target.value)}
                                        placeholder={activePage.activity.placeholder}
                                        maxLength={500}
                                        aria-label={activePage.activity.prompt}
                                    />
                                    <p className="kids-activity-help">한 단어나 짧은 문장으로 적어도 괜찮아요. 선생님과 함께 적을 수도 있어요.</p>
                                </section>
                            )}

                            {isDigitalCreatorPage && isTeacherView && activePage.teacherGuide && (
                                <details className="kids-teacher-guide">
                                    <summary><MI icon="school" style={{ fontSize: 18 }} /> 강사용 지도안 열기</summary>
                                    <div className="kids-teacher-guide-grid">
                                        <article><span>이번 화면 목표</span><p>{activePage.teacherGuide.objective}</p></article>
                                        <article><span>아이에게 이렇게 설명하세요</span><p>{activePage.teacherGuide.say}</p></article>
                                        <article><span>발문 예시</span><ul>{activePage.teacherGuide.questions.map((question) => <li key={question}>{question}</li>)}</ul></article>
                                        <article><span>기대 답변</span><p>{activePage.teacherGuide.expectedAnswer}</p></article>
                                        <article><span>도움이 필요한 학생</span><p>{activePage.teacherGuide.coaching}</p></article>
                                        <article><span>빠른 학생 확장</span><p>{activePage.teacherGuide.extension}</p></article>
                                    </div>
                                    <div className="kids-teacher-check"><strong>관찰 체크</strong>{activePage.teacherGuide.assessment.map((item) => <span key={item}>□ {item}</span>)}</div>
                                </details>
                            )}

                            {/* Quiz */}
                            {activePage.quiz && <QuizPanel quiz={activePage.quiz} unit={selectedUnit} selectedAnswer={selectedAnswer} setSelectedAnswer={setSelectedAnswer} quizResult={quizResult} shaking={shaking} wrongCount={wrongCount} showHint={showHint} onCheck={() => handleQuizCheck(activePage.quiz!, selectedUnit)} />}

                            {/* Code Problems */}
                            {activePage.problems && activePage.problems.length > 0 && (
                                <div style={{ display: "flex", flexDirection: "column", gap: 24, marginTop: activePage.content ? 28 : 0 }}>
                                    {activePage.problems.map((prob: CodeProblem) => (
                                        <CodeProblemCard key={prob.id} prob={prob} editorCode={editorCode} setEditorCode={setEditorCode} runResult={runResult} runLoading={runLoading} executeCode={executeCode} showProblemAnswer={showProblemAnswer} setShowProblemAnswer={setShowProblemAnswer} />
                                    ))}
                                </div>
                            )}

                            {isPythonCorePage && currentPageIdx === pages.length - 1 && (
                                <section className="pycore-completion">
                                    <h3>120분 수업 완료 확인</h3>
                                    <p>단순 열람이 아니라 개념 확인과 코딩 실행까지 마치면 이번 회차가 완료됩니다.</p>
                                    <div className="pycore-completion-grid">
                                        <div><span>학습 단계</span><b>{lessonCompletion.pages.completed} / {lessonCompletion.pages.total}</b></div>
                                        <div><span>확인 퀴즈</span><b>{lessonCompletion.quizzes.completed} / {lessonCompletion.quizzes.total}</b></div>
                                        <div><span>코드 수정·실행</span><b>{lessonCompletion.problems.completed} / {lessonCompletion.problems.total}</b></div>
                                    </div>
                                    <button
                                        className="pycore-complete-btn"
                                        disabled={!lessonCompletion.ready || completedUnits.has(selectedUnit.id)}
                                        onClick={() => void completeUnit(selectedUnit)}
                                    >
                                        {completedUnits.has(selectedUnit.id)
                                            ? completionSaveStatus === "saving" ? "수업 완료 저장 중..." : "✓ 이번 회차 완료됨"
                                            : lessonCompletion.ready ? "이번 회차 수업 완료하기" : "학습 활동을 모두 마쳐주세요"}
                                    </button>
                                    {completionMessage && <p className="pycore-completion-message">{completionMessage}</p>}
                                </section>
                            )}

                            {isDigitalCreatorUnit && selectedUnit.lessonPackage && currentPageIdx === pages.length - 1 && (
                                <section className="kids-completion">
                                    <div className="kids-completion-heading">
                                        <span><MI icon="workspace_premium" style={{ fontSize: 20 }} /> 120분 수업 완료 확인</span>
                                        <p>화면만 넘기는 것이 아니라 탐험 기록과 결과물까지 마치면 수업이 완료됩니다.</p>
                                    </div>
                                    <div className="kids-completion-grid">
                                        <div><span>학습 화면</span><b>{lessonCompletion.pages.completed} / {lessonCompletion.pages.total}</b></div>
                                        <div><span>탐험 기록</span><b>{lessonCompletion.activities.completed} / {lessonCompletion.activities.total}</b></div>
                                        <div><span>오늘의 결과물</span><b>{selectedUnit.lessonPackage.deliverable}</b></div>
                                    </div>
                                    <button
                                        className="kids-complete-btn"
                                        disabled={!lessonCompletion.ready || completedUnits.has(selectedUnit.id)}
                                        onClick={() => void completeUnit(selectedUnit)}
                                    >
                                        {completedUnits.has(selectedUnit.id)
                                            ? completionSaveStatus === "saving" ? "수업 완료 저장 중..." : "✓ 이번 회차 완료됨"
                                            : lessonCompletion.ready ? "이번 회차 수업 완료하기" : "남은 화면과 탐험 기록을 마쳐주세요"}
                                    </button>
                                    {completionMessage && <p className="kids-completion-message">{completionMessage}</p>}
                                </section>
                            )}

                            {/* Floating sticky pill nav — Codecademy/Replit 스타일 (Glassmorphism) */}
                            {!isIframePage && (() => {
                                const curIdx = allUnits.findIndex((u: any) => u.id === selectedUnit.id);
                                const unitIdxInCourse = curIdx + 1;
                                const totalUnits = allUnits.length;
                                const nextUnitInCourse = curIdx >= 0 && curIdx < totalUnits - 1 ? allUnits[curIdx + 1] : null;
                                const prevUnitInCourse = curIdx > 0 ? allUnits[curIdx - 1] : null;
                                const canGoBack = !!prevPage || !!prevUnitInCourse;
                                const goBack = () => {
                                    if (prevPage) navigatePage(prevPage);
                                    else if (prevUnitInCourse) selectUnit(prevUnitInCourse);
                                };
                                return (
                                    <div style={{
                                        // 담당자 '수업자료 밑에 두지' — cpp/어린이IT 코스 inline (슬라이드 바로 아래),
                                        // 다른 코스 fixed 우하단. AI tutor button + toast와 겹침 회피.
                                        ...(usesFocusedLessonUx
                                            ? {
                                                position: "static" as const,
                                                margin: "16px auto 8px",
                                                width: "fit-content",
                                            }
                                            : {
                                                position: "fixed" as const,
                                                bottom: 20,
                                                right: 20,
                                                zIndex: 50,
                                            }),
                                        background: "rgba(255,255,255,0.95)",
                                        backdropFilter: "blur(20px)",
                                        WebkitBackdropFilter: "blur(20px)",
                                        borderRadius: 999, padding: "6px 10px",
                                        boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(15,23,42,0.06)",
                                        display: "flex", gap: 6, alignItems: "center",
                                    }}>
                                        <button
                                            disabled={!canGoBack}
                                            onClick={goBack}
                                            aria-label="이전"
                                            title={prevPage ? "이전 페이지" : prevUnitInCourse ? `이전 단원: ${prevUnitInCourse.title}` : "처음 단원"}
                                            style={{
                                                width: 38, height: 38, borderRadius: 999,
                                                border: "none", cursor: canGoBack ? "pointer" : "not-allowed",
                                                background: canGoBack ? "#f1f5f9" : "#f8fafc",
                                                color: canGoBack ? "#475569" : "#cbd5e1",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                transition: "background 0.15s",
                                            }}
                                            onMouseEnter={(e) => { if (canGoBack) (e.currentTarget as HTMLButtonElement).style.background = "#e2e8f0"; }}
                                            onMouseLeave={(e) => { if (canGoBack) (e.currentTarget as HTMLButtonElement).style.background = "#f1f5f9"; }}
                                        >
                                            <MI icon="arrow_back" style={{ fontSize: 18 }} />
                                        </button>
                                        <div style={{ padding: "0 10px", fontSize: 11, fontWeight: 700, color: "#64748b", whiteSpace: "nowrap" as const }}>
                                            <span style={{ color: "#0f172a", fontWeight: 800 }}>{unitIdxInCourse}</span>
                                            <span style={{ margin: "0 4px", color: "#cbd5e1" }}>/</span>
                                            <span>{totalUnits}</span>
                                        </div>
                                        {nextPage ? (
                                            <button
                                                onClick={() => navigatePage(nextPage)}
                                                style={{
                                                    height: 38, padding: "0 18px", borderRadius: 999,
                                                    border: "none", cursor: "pointer",
                                                    background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                                                    color: "#fff", fontSize: 12, fontWeight: 700,
                                                    display: "flex", alignItems: "center", gap: 5,
                                                    boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)",
                                                }}
                                            >
                                                다음 <MI icon="arrow_forward" style={{ fontSize: 16 }} />
                                            </button>
                                        ) : nextUnitInCourse ? (
                                            <>
                                                <button
                                                    onClick={() => { if (!completedUnits.has(selectedUnit.id)) completeUnit(selectedUnit); }}
                                                    style={{
                                                        height: 38, padding: "0 14px", borderRadius: 999,
                                                        border: "none", cursor: "pointer",
                                                        background: completedUnits.has(selectedUnit.id) ? "#dcfce7" : "linear-gradient(135deg,#10b981,#059669)",
                                                        color: completedUnits.has(selectedUnit.id) ? "#065f46" : "#fff", fontSize: 11, fontWeight: 700,
                                                        display: "flex", alignItems: "center", gap: 4,
                                                    }}
                                                >
                                                    {completedUnits.has(selectedUnit.id) ? "✓ 완료" : "✓"}
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        if (!completedUnits.has(selectedUnit.id)) {
                                                            await completeUnit(selectedUnit);
                                                            if ((isPythonCoreUnit || (isDigitalCreatorUnit && !!selectedUnit.lessonPackage)) && !lessonCompletion.ready) return;
                                                        }
                                                        selectUnit(nextUnitInCourse);
                                                    }}
                                                    style={{
                                                        height: 38, padding: "0 18px", borderRadius: 999,
                                                        border: "none", cursor: "pointer",
                                                        background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                                                        color: "#fff", fontSize: 12, fontWeight: 700,
                                                        display: "flex", alignItems: "center", gap: 5,
                                                        boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)",
                                                    }}
                                                >
                                                    다음 단원 <MI icon="arrow_forward" style={{ fontSize: 16 }} />
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => { if (!completedUnits.has(selectedUnit.id)) completeUnit(selectedUnit); }}
                                                style={{
                                                    height: 38, padding: "0 18px", borderRadius: 999,
                                                    border: "none", cursor: "pointer",
                                                    background: completedUnits.has(selectedUnit.id) ? "linear-gradient(135deg,#a3e635,#65a30d)" : "linear-gradient(135deg,#10b981,#059669)",
                                                    color: "#fff", fontSize: 12, fontWeight: 700,
                                                    display: "flex", alignItems: "center", gap: 5,
                                                    boxShadow: "0 2px 8px rgba(16, 185, 129, 0.25)",
                                                }}
                                            >
                                                {completedUnits.has(selectedUnit.id) ? "✓ 완료됨" : "✓ 학습 완료"}
                                            </button>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* Global slide CSS — class 기반(sanitize 보존) + inline 백업 + 부모 overflow */}
                            <style dangerouslySetInnerHTML={{ __html: `
                                /* 부모 영역 가로 overflow 차단 — 어떤 자식이든 못 넘게 */
                                .course-content-pad {
                                    overflow-x: hidden !important;
                                    max-width: 100% !important;
                                }
                                .course-content-pad * {
                                    max-width: 100% !important;
                                    box-sizing: border-box !important;
                                }
                                /* 슬라이드 wrapper class — sanitize ADD_ATTR로 보존 */
                                .course-content-pad .cs-slide-wrap {
                                    width: 100% !important;
                                    max-width: 100% !important;
                                    overflow: hidden !important;
                                    margin: 16px auto !important;
                                    border-radius: 14px !important;
                                    box-shadow: 0 12px 40px rgba(15,23,42,0.18) !important;
                                    display: block !important;
                                }
                                /* 슬라이드 img class */
                                .course-content-pad .cs-slide,
                                .course-content-pad img {
                                    display: block !important;
                                    width: 100% !important;
                                    height: auto !important;
                                    max-width: 100% !important;
                                    transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease;
                                    cursor: zoom-in;
                                }
                                .course-content-pad .cs-slide:hover,
                                .course-content-pad img:hover {
                                    transform: translateY(-3px);
                                    box-shadow: 0 16px 48px rgba(15,23,42,0.22) !important;
                                }
                                .course-content-pad .kids-it-slide {
                                    width: min(100%, 1080px);
                                    margin: 18px auto 24px;
                                    padding: clamp(18px, 3vw, 34px);
                                    border-radius: 22px;
                                    background:
                                        radial-gradient(circle at top left, rgba(59,130,246,0.14), transparent 32%),
                                        linear-gradient(135deg, #ffffff 0%, #f8fbff 56%, #eff6ff 100%);
                                    border: 1px solid rgba(191,219,254,0.9);
                                    box-shadow: 0 18px 48px rgba(15,23,42,0.12);
                                    color: #0f172a;
                                }
                                .course-content-pad .kids-it-phase {
                                    display: inline-flex;
                                    align-items: center;
                                    gap: 8px;
                                    margin-bottom: 16px;
                                    padding: 7px 12px;
                                    border-radius: 999px;
                                    background: #ede9fe;
                                    color: #6d28d9;
                                    font-size: 12px;
                                    font-weight: 900;
                                }
                                .course-content-pad .kids-it-phase span {
                                    color: #7c3aed;
                                    opacity: .72;
                                }
                                .course-content-pad .kids-it-cue {
                                    display: inline-flex;
                                    margin: 0 0 16px 10px;
                                    color: #475569;
                                    font-size: 13px;
                                    font-weight: 850;
                                }
                                .course-content-pad .kids-it-hero {
                                    display: grid;
                                    grid-template-columns: 1fr auto;
                                    gap: 18px;
                                    align-items: start;
                                    margin-bottom: 20px;
                                }
                                .course-content-pad .kids-it-kicker {
                                    margin: 0 0 10px;
                                    color: #2563eb;
                                    font-size: 13px;
                                    font-weight: 900;
                                }
                                .course-content-pad .kids-it-hero h2 {
                                    margin: 0;
                                    color: #0f172a;
                                    font-size: clamp(28px, 4vw, 46px);
                                    line-height: 1.18;
                                    font-weight: 950;
                                }
                                .course-content-pad .kids-it-hero-copy > p:last-child {
                                    margin: 14px 0 0;
                                    color: #475569;
                                    font-size: clamp(18px, 2.2vw, 24px);
                                    line-height: 1.65;
                                    font-weight: 700;
                                }
                                .course-content-pad .kids-it-number {
                                    display: inline-flex;
                                    width: 72px;
                                    height: 72px;
                                    align-items: center;
                                    justify-content: center;
                                    border-radius: 22px;
                                    background: linear-gradient(135deg, #3b82f6, #2563eb);
                                    color: #fff;
                                    font-size: 28px;
                                    font-weight: 950;
                                    box-shadow: 0 12px 28px rgba(37,99,235,0.28);
                                }
                                .course-content-pad .kids-it-grid {
                                    display: grid;
                                    grid-template-columns: repeat(2, minmax(0, 1fr));
                                    gap: 16px;
                                    margin-top: 22px;
                                }
                                .course-content-pad .kids-it-card,
                                .course-content-pad .kids-it-remember {
                                    border-radius: 18px;
                                    border: 1px solid #dbeafe;
                                    background: rgba(255,255,255,0.88);
                                    padding: 20px;
                                    box-shadow: 0 10px 24px rgba(37,99,235,0.08);
                                }
                                .course-content-pad .kids-it-card span,
                                .course-content-pad .kids-it-remember strong {
                                    display: inline-flex;
                                    margin-bottom: 10px;
                                    color: #1d4ed8;
                                    font-size: 14px;
                                    font-weight: 950;
                                }
                                .course-content-pad .kids-it-card p,
                                .course-content-pad .kids-it-remember p {
                                    margin: 0;
                                    color: #334155;
                                    font-size: clamp(17px, 1.8vw, 21px);
                                    line-height: 1.75;
                                    font-weight: 700;
                                }
                                .course-content-pad .kids-it-card ol {
                                    margin: 0;
                                    padding-left: 24px;
                                    color: #334155;
                                    font-size: clamp(16px, 1.7vw, 20px);
                                    line-height: 1.8;
                                    font-weight: 700;
                                }
                                .course-content-pad .kids-it-card li + li {
                                    margin-top: 6px;
                                }
                                .course-content-pad .kids-it-card-analogy {
                                    background: linear-gradient(135deg, #ecfdf5, #ffffff);
                                    border-color: #bbf7d0;
                                }
                                .course-content-pad .kids-it-plan {
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    flex-wrap: wrap;
                                    gap: 8px;
                                    margin-top: 16px;
                                    padding: 14px 16px;
                                    border-radius: 16px;
                                    background: linear-gradient(135deg, #eef2ff, #f5f3ff);
                                    border: 1px solid #ddd6fe;
                                    color: #4338ca;
                                    font-size: 12px;
                                    font-weight: 850;
                                }
                                .course-content-pad .kids-it-plan strong { color: #312e81; margin-right: 4px; }
                                .course-content-pad .kids-it-plan i { color: #a78bfa; font-style: normal; }
                                .course-content-pad .kids-it-toolkit {
                                    display: grid;
                                    grid-template-columns: repeat(3, minmax(0, 1fr));
                                    gap: 12px;
                                    margin-top: 16px;
                                }
                                .course-content-pad .kids-it-toolkit article {
                                    padding: 15px 16px;
                                    border: 1px solid #c7d2fe;
                                    border-radius: 15px;
                                    background: rgba(255,255,255,.92);
                                }
                                .course-content-pad .kids-it-toolkit span {
                                    display: block;
                                    margin-bottom: 5px;
                                    color: #4338ca;
                                    font-size: 11px;
                                    font-weight: 950;
                                }
                                .course-content-pad .kids-it-toolkit p {
                                    margin: 0;
                                    color: #334155;
                                    font-size: 14px;
                                    line-height: 1.6;
                                    font-weight: 750;
                                }
                                .course-content-pad .kids-it-remember {
                                    margin-top: 16px;
                                    background: linear-gradient(135deg, #fffbeb, #ffffff);
                                    border-color: #fde68a;
                                }
                                .course-content-pad .kids-it-remember strong {
                                    color: #b45309;
                                }
                                .course-content-pad .kids-it-finish {
                                    margin-top: 16px;
                                    padding: 20px;
                                    border: 1px solid #a7f3d0;
                                    border-radius: 18px;
                                    background: linear-gradient(135deg,#ecfdf5,#fff);
                                }
                                .course-content-pad .kids-it-finish > span { color:#047857;font-size:14px;font-weight:950; }
                                .course-content-pad .kids-it-finish ul { margin:10px 0 14px;padding-left:22px;color:#334155;font-size:14px;line-height:1.75;font-weight:700; }
                                .course-content-pad .kids-it-finish p { margin:0;padding:12px 14px;border-radius:12px;background:#fff;color:#475569;font-size:13px;line-height:1.65; }
                                .course-content-pad .kids-it-finish b { display:block;margin-bottom:4px;color:#0f766e; }
                                .kids-activity-panel,.kids-teacher-guide,.kids-completion { width:min(100%,1080px);margin:16px auto;padding:22px;border-radius:20px;box-sizing:border-box; }
                                .kids-activity-panel { border:1px solid #c4b5fd;background:linear-gradient(135deg,#faf5ff,#fff);box-shadow:0 12px 30px rgba(109,40,217,.08); }
                                .kids-activity-top { display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px; }
                                .kids-activity-top > span { color:#6d28d9;font-size:12px;font-weight:950; }
                                .kids-activity-top b { display:inline-flex;align-items:center;gap:5px;padding:6px 9px;border-radius:999px;background:#f5f3ff;color:#7c3aed;font-size:10px; }
                                .kids-activity-top b[data-status="saved"] { background:#ecfdf5;color:#047857; }.kids-activity-top b[data-status="local"] { background:#fffbeb;color:#b45309; }.kids-activity-top b[data-status="error"] { background:#fef2f2;color:#b91c1c; }
                                .kids-activity-panel h3 { margin:0 0 10px;color:#312e81;font-size:18px;line-height:1.5; }
                                .kids-activity-example { margin:0 0 12px;padding:11px 13px;border-radius:12px;background:#fff;color:#64748b;font-size:12px;line-height:1.6; }
                                .kids-activity-example strong { display:block;margin-bottom:2px;color:#7c3aed; }
                                .kids-activity-panel textarea { width:100%;min-height:100px;resize:vertical;padding:14px 16px;border:2px solid #ddd6fe;border-radius:14px;outline:none;background:#fff;color:#1e293b;font:700 15px/1.7 inherit;box-sizing:border-box; }
                                .kids-activity-panel textarea:focus { border-color:#8b5cf6;box-shadow:0 0 0 4px rgba(139,92,246,.1); }
                                .kids-activity-help { margin:8px 2px 0;color:#64748b;font-size:11px;font-weight:650; }
                                .kids-teacher-guide { border:1px solid #bae6fd;background:linear-gradient(135deg,#f0f9ff,#fff); }
                                .kids-teacher-guide summary { display:flex;align-items:center;gap:7px;color:#075985;font-size:14px;font-weight:950;cursor:pointer;list-style:none; }
                                .kids-teacher-guide-grid { display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px;margin-top:16px; }
                                .kids-teacher-guide article { padding:14px;border:1px solid #dbeafe;border-radius:14px;background:#fff; }
                                .kids-teacher-guide article span { color:#0369a1;font-size:11px;font-weight:950; }.kids-teacher-guide article p,.kids-teacher-guide article ul { margin:6px 0 0;color:#475569;font-size:12px;line-height:1.7; }.kids-teacher-guide article ul { padding-left:18px; }
                                .kids-teacher-check { display:flex;flex-wrap:wrap;gap:8px;margin-top:12px; }.kids-teacher-check strong { width:100%;color:#075985;font-size:11px; }.kids-teacher-check span { padding:8px 10px;border-radius:10px;background:#fff;color:#475569;font-size:11px;font-weight:700; }
                                .kids-completion { border:1px solid #a7f3d0;background:linear-gradient(135deg,#ecfdf5,#fff);box-shadow:0 14px 34px rgba(5,150,105,.09); }
                                .kids-completion-heading span { display:flex;align-items:center;gap:7px;color:#047857;font-size:18px;font-weight:950; }.kids-completion-heading p { margin:6px 0 0;color:#64748b;font-size:12px;line-height:1.6; }
                                .kids-completion-grid { display:grid;grid-template-columns:.7fr .7fr 2fr;gap:10px;margin:16px 0; }.kids-completion-grid div { padding:13px;border:1px solid #d1fae5;border-radius:13px;background:#fff; }.kids-completion-grid span,.kids-completion-grid b { display:block; }.kids-completion-grid span { color:#64748b;font-size:10px;font-weight:850; }.kids-completion-grid b { margin-top:5px;color:#047857;font-size:14px;line-height:1.5; }
                                .kids-complete-btn { width:100%;padding:14px 18px;border:0;border-radius:13px;background:linear-gradient(135deg,#10b981,#059669);color:#fff;font-size:13px;font-weight:950;cursor:pointer;box-shadow:0 8px 20px rgba(5,150,105,.2); }.kids-complete-btn:disabled { background:#cbd5e1;box-shadow:none;cursor:not-allowed; }.kids-completion-message { margin:10px 0 0;padding:9px 11px;border-radius:9px;background:#fff7ed;color:#9a3412;font-size:12px;font-weight:750; }
                                @media (max-width: 760px) {
                                    .course-content-pad .kids-it-slide {
                                        border-radius: 16px;
                                        margin: 8px auto 18px;
                                    }
                                    .course-content-pad .kids-it-hero,
                                    .course-content-pad .kids-it-grid {
                                        grid-template-columns: 1fr;
                                    }
                                    .course-content-pad .kids-it-number {
                                        width: 56px;
                                        height: 56px;
                                        border-radius: 16px;
                                        font-size: 22px;
                                    }
                                    .course-content-pad .kids-it-toolkit,.kids-teacher-guide-grid,.kids-completion-grid { grid-template-columns:1fr; }
                                    .kids-activity-panel,.kids-teacher-guide,.kids-completion { padding:16px; }
                                }
                            `}} />

                            {/* Slide lightbox — 이미지 클릭 시 풀스크린 zoom */}
                            <AnimatePresence>
                                {lightboxSrc && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        onClick={() => setLightboxSrc(null)}
                                        style={{
                                            position: "fixed", inset: 0, zIndex: 10000,
                                            background: "rgba(0,0,0,0.88)",
                                            backdropFilter: "blur(20px)",
                                            WebkitBackdropFilter: "blur(20px)",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            padding: 24, cursor: "zoom-out",
                                        }}
                                    >
                                        <motion.img
                                            initial={{ scale: 0.92, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0.92, opacity: 0 }}
                                            transition={{ type: "spring", stiffness: 320, damping: 28 }}
                                            src={lightboxSrc}
                                            alt="확대 이미지"
                                            onClick={(e) => e.stopPropagation()}
                                            style={{ maxWidth: "95vw", maxHeight: "95vh", borderRadius: 12, boxShadow: "0 24px 80px rgba(0,0,0,0.5)", cursor: "default" }}
                                        />
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setLightboxSrc(null); }}
                                            aria-label="닫기"
                                            style={{
                                                position: "fixed", top: 24, right: 24,
                                                width: 44, height: 44, borderRadius: 999,
                                                border: "none", cursor: "pointer",
                                                background: "rgba(255,255,255,0.15)",
                                                backdropFilter: "blur(20px)",
                                                WebkitBackdropFilter: "blur(20px)",
                                                color: "#fff", fontSize: 22, fontWeight: 300,
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                            }}
                                        >
                                            ×
                                        </button>
                                        <div style={{
                                            position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
                                            padding: "8px 16px", borderRadius: 999,
                                            background: "rgba(255,255,255,0.12)",
                                            backdropFilter: "blur(20px)",
                                            WebkitBackdropFilter: "blur(20px)",
                                            color: "rgba(255,255,255,0.85)", fontSize: 11, fontWeight: 600,
                                            letterSpacing: 0.3,
                                        }}>
                                            배경 클릭 또는 ESC로 닫기
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Nav buttons (inline — 페이지 제목 보이는 큰 버튼, cpp/어린이IT는 hide) */}
                            <div style={{ display: usesFocusedLessonUx ? "none" : "flex", justifyContent: "space-between", marginTop: 32, gap: 16 }}>
                                {prevPage ? (
                                    <button onClick={() => navigatePage(prevPage)} style={{ padding: "12px 22px", borderRadius: 14, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#475569", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                                        <MI icon="arrow_back" style={{ fontSize: 16 }} />
                                        <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
                                            <span style={{ fontSize: 9, color: "#94a3b8", fontWeight: 700, letterSpacing: 0.5 }}>이전</span>
                                            <span>{prevPage.title}</span>
                                        </span>
                                    </button>
                                ) : <div />}
                                {nextPage ? (
                                    <button onClick={() => navigatePage(nextPage)} style={{ padding: "12px 22px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#3b82f6,#2563eb)", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 12px rgba(59,130,246,0.3)" }}>
                                        <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                                            <span style={{ fontSize: 9, opacity: 0.85, fontWeight: 700, letterSpacing: 0.5 }}>다음</span>
                                            <span>{nextPage.title}</span>
                                        </span>
                                        <MI icon="arrow_forward" style={{ fontSize: 16 }} />
                                    </button>
                                ) : (
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        {/* 수업자료 버튼 — C언어 유닛 */}
                                        {courseId === "4" && (() => {
                                            const pg = selectedUnit.pages?.find((p: any) => p.content?.includes('<iframe'));
                                            if (!pg) return null;
                                            const m = pg.content?.match(/src=["']([^"']+)["']/);
                                            const f = m ? (m[1].split('/').pop() || '') : '';
                                            if (!f) return null;
                                            return (
                                                <a
                                                    href={`/slides/c-lang/${f.replace('.html', '.pdf')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{
                                                        padding: "10px 18px", borderRadius: 12, textDecoration: "none",
                                                        background: "linear-gradient(135deg, #0ea5e9, #2563eb)",
                                                        color: "#fff", fontWeight: 700, fontSize: 12,
                                                        display: "flex", alignItems: "center", gap: 5,
                                                        boxShadow: "0 3px 12px rgba(37,99,235,0.25)",
                                                    }}
                                                >
                                                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>slideshow</span>
                                                    수업자료
                                                </a>
                                            );
                                        })()}
                                        <button onClick={() => { if (!completedUnits.has(selectedUnit.id)) completeUnit(selectedUnit); }} style={{ padding: "10px 20px", borderRadius: 12, border: "none", background: completedUnits.has(selectedUnit.id) ? "linear-gradient(135deg,#a3e635,#65a30d)" : "linear-gradient(135deg,#10b981,#059669)", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#fff" }}>
                                            {completedUnits.has(selectedUnit.id) ? "✓ 완료됨" : "✓ 학습 완료"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        )}

                    </>
                ) : selectedUnit && !activePage && selectedUnit.content ? (
                    /* Legacy unit with direct content (no pages) */
                    <div ref={contentRef} className="hide-sb" style={{ flex: 1, overflowY: "auto", padding: "32px 40px 120px" }}>
                        <div style={{ marginBottom: 28, paddingBottom: 20, borderBottom: "1px solid #f1f5f9" }}>
                            <span style={{ fontSize: 10, fontWeight: 800, color: "#94a3b8", letterSpacing: 1.5 }}>UNIT {selectedUnit.unitNumber}</span>
                            <h1 style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", margin: "6px 0 0" }}>{selectedUnit.title}</h1>
                        </div>
                        <p style={{ fontSize: 14, lineHeight: 1.9, color: "#334155" }}>{selectedUnit.content}</p>
                        {selectedUnit.tip && <p style={{ fontSize: 13, color: "#0ea5e9", fontWeight: 600, marginTop: 12 }}>{selectedUnit.tip}</p>}
                        {selectedUnit.quiz && <QuizPanel quiz={selectedUnit.quiz} unit={selectedUnit} selectedAnswer={selectedAnswer} setSelectedAnswer={setSelectedAnswer} quizResult={quizResult} shaking={shaking} wrongCount={wrongCount} showHint={showHint} onCheck={() => handleQuizCheck(selectedUnit.quiz!, selectedUnit)} />}
                    </div>
                ) : (
                    /* 담당자 명시 '코스 입장 시 새 페이지 = 커리큘럼 리스트' — 풀스크린 카드 그리드 */
                    <div style={{ flex: 1, overflowY: "auto", padding: "32px max(40px, calc((100% - 1080px) / 2)) 80px", background: "#fafafa" }}>
                        {/* 코스 헤더 */}
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28, textAlign: "center" }}>
                            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8, fontWeight: 700, letterSpacing: 0.5 }}>커리큘럼</div>
                            <h1 style={{ fontSize: 32, fontWeight: 900, color: "#0f172a", margin: 0, letterSpacing: -0.5 }}>{courseDisplayTitle || courseData.title}</h1>
                            {courseData.description && <p style={{ fontSize: 14, color: "#64748b", margin: "10px 0 0", lineHeight: 1.7, maxWidth: 600, marginInline: "auto" }}>{courseData.description}</p>}
                            <div style={{ marginTop: 16, display: "flex", justifyContent: "center", gap: 16, fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>
                                <span>{allUnits.length}개 유닛</span>
                                <span style={{ color: "#cbd5e1" }}>·</span>
                                <span>{progressPct}% 완료</span>
                            </div>
                        </motion.div>

                        {/* 챕터별 카드 — 담당자 '접고 열 수 있는 기능' (사이드바 expandedChapters state 공유) */}
                        {courseData.chapters.map((ch: ChapterType, chIdx: number) => {
                            const chDone = ch.units.filter(u => completedUnits.has(u.id)).length;
                            const chComplete = chDone === ch.units.length && ch.units.length > 0;
                            const isExp = expandedChapters.has(ch.id);
                            return (
                                <motion.div
                                    key={ch.id}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.05 + chIdx * 0.04 }}
                                    style={{ marginBottom: 16, padding: "20px 22px", background: "#fff", borderRadius: 18, boxShadow: "0 2px 12px rgba(0,0,0,0.05), 0 0 0 1px rgba(226,232,240,0.7)" }}
                                >
                                    <div
                                        onClick={() => toggleChapter(ch.id)}
                                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleChapter(ch.id); } }}
                                        role="button"
                                        tabIndex={0}
                                        aria-expanded={isExp}
                                        aria-label={`챕터 ${ch.chapterNumber} ${ch.title} ${isExp ? "접기" : "펼치기"}`}
                                        style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: isExp ? 12 : 0, cursor: "pointer", userSelect: "none" as const, transition: "margin 0.2s ease", outline: "none", borderRadius: 8 }}
                                        onFocus={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 2px #3b82f633"; }}
                                        onBlur={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
                                    >
                                        <div style={{ width: 40, height: 40, borderRadius: 12, background: chComplete ? "linear-gradient(135deg, #10b981, #059669)" : "linear-gradient(135deg, #3b82f6, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#fff" }}>{ch.icon}</span>
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 10, fontWeight: 800, color: "#94a3b8", letterSpacing: 1.5, textTransform: "uppercase" as const }}>CH.{ch.chapterNumber}</div>
                                            <h2 style={{ fontSize: 17, fontWeight: 900, color: "#0f172a", margin: 0, lineHeight: 1.3 }}>{ch.title}</h2>
                                        </div>
                                        <span style={{ fontSize: 11, fontWeight: 800, color: chComplete ? "#10b981" : "#3b82f6", padding: "4px 10px", borderRadius: 999, background: chComplete ? "#f0fdf4" : "#eff6ff", whiteSpace: "nowrap" as const }}>{chDone}/{ch.units.length}</span>
                                        <span className="material-symbols-outlined" style={{ fontSize: 22, color: "#94a3b8", transition: "transform 0.25s ease", transform: isExp ? "rotate(0deg)" : "rotate(-90deg)", flexShrink: 0 }}>expand_more</span>
                                    </div>
                                    <AnimatePresence initial={false}>{isExp && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: "easeOut" }} style={{ overflow: "hidden" }}>
                                    {ch.description && <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 14px", lineHeight: 1.6 }}>{ch.description}</p>}
                                    {/* 담당자 'list 점검' — type별 색상 분리, 2-col 강제 (wide), polish */}
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 360px), 1fr))", gap: 8 }}>
                                        {ch.units.map((unit) => {
                                            const done = completedUnits.has(unit.id);
                                            const typeColor = unit.type === "이론" ? { bg: "#eff6ff", fg: "#1d4ed8", border: "#bfdbfe" }
                                                : unit.type === "실습" ? { bg: "#fff7ed", fg: "#c2410c", border: "#fed7aa" }
                                                : unit.type === "종합" ? { bg: "#f0fdf4", fg: "#15803d", border: "#bbf7d0" }
                                                : unit.type === "퀴즈" ? { bg: "#fdf4ff", fg: "#a21caf", border: "#f5d0fe" }
                                                : { bg: "#f1f5f9", fg: "#475569", border: "#cbd5e1" };
                                            return (
                                                <button
                                                    key={unit.id}
                                                    onClick={() => selectUnit(unit)}
                                                    style={{
                                                        padding: "12px 14px", borderRadius: 12,
                                                        border: done ? "1.5px solid #10b981" : `1px solid ${typeColor.border}`,
                                                        background: done ? "rgba(240,253,244,0.7)" : "#fff", cursor: "pointer", textAlign: "left",
                                                        display: "flex", alignItems: "center", gap: 12, transition: "all 0.15s",
                                                        fontFamily: "inherit",
                                                    }}
                                                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = done ? "#10b981" : "#3b82f6"; (e.currentTarget as HTMLElement).style.background = done ? "rgba(240,253,244,0.9)" : typeColor.bg; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
                                                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = done ? "#10b981" : typeColor.border; (e.currentTarget as HTMLElement).style.background = done ? "rgba(240,253,244,0.7)" : "#fff"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
                                                >
                                                    <div style={{
                                                        width: 36, height: 36, borderRadius: 10,
                                                        background: done ? "linear-gradient(135deg, #10b981, #059669)" : `linear-gradient(135deg, ${typeColor.bg}, #fff)`,
                                                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                                                        border: done ? "none" : `1px solid ${typeColor.border}`,
                                                        boxShadow: done ? "0 2px 8px rgba(16,185,129,0.3)" : "none",
                                                    }}>
                                                        {done
                                                            ? <span style={{ fontSize: 16, color: "#fff", fontWeight: 800 }}>✓</span>
                                                            : <span style={{ fontSize: 13, fontWeight: 800, color: typeColor.fg }}>{unit.unitNumber}</span>}
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, marginBottom: 3 }}>{unit.title}</div>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "#94a3b8" }}>
                                                            <span style={{ padding: "2px 7px", borderRadius: 999, background: typeColor.bg, color: typeColor.fg, fontWeight: 700, letterSpacing: 0.2 }}>{unit.type}</span>
                                                            <span>·</span>
                                                            <span>{unit.duration || "15분"}</span>
                                                            {unit.pages && unit.pages.length > 1 && (
                                                                <>
                                                                    <span>·</span>
                                                                    <span>{unit.pages.length}장</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <span style={{ fontSize: 16, color: "#cbd5e1", flexShrink: 0 }}>→</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    </motion.div>)}</AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Right drag handle + toggle */}
            {rightOpen && <div className="panel-drag course-panel-drag" onMouseDown={(e) => startDrag("right", e)} onDoubleClick={() => setRightOpen(false)} title="드래그: 크기 조절 / 더블클릭: 접기" />}
            {!rightOpen && (
                <button onClick={() => setRightOpen(true)} aria-label="도구 패널 열기" style={{ width: 24, height: 48, position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", zIndex: 50, borderRadius: "8px 0 0 8px", border: "1px solid #bfdbfe", borderRight: "none", background: "#eff6ff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "-2px 0 8px rgba(59,130,246,0.08)" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: "#3b82f6" }}>chevron_left</span>
                </button>
            )}

            {/* ══════════════════════════════════════════════
                RIGHT PANEL — 도구 패널
               ══════════════════════════════════════════════ */}
            <aside
                className="course-right-panel"
                style={{ width: rightOpen ? rightW : 0, opacity: rightOpen ? 1 : 0, flexShrink: 0, overflow: "hidden", borderLeft: rightOpen ? "1px solid #e2e8f0" : "none", background: "#fff", display: "flex", flexDirection: "column", transition: isDragging ? "none" : "width .25s ease, opacity .2s ease" }}>

                {/* ── Tab Bar ── 어린이 IT는 code 탭 제거 (영유아 코드 무용) */}
                <div style={{ display: "flex", borderBottom: "1px solid #f1f5f9", background: "#fafafa" }}>
                    {(courseId === '11'
                        ? (["notes", "timer", "qa", "bookmarks"] as const)
                        : (["notes", "code", "timer", "qa", "bookmarks"] as const)
                    ).map(tab => {
                        const icons = { notes: "edit_note", code: "terminal", timer: "timer", qa: "help_outline", bookmarks: "bookmark" };
                        const labels = { notes: "노트", code: "코드", timer: "타이머", qa: "Q&A", bookmarks: "북마크" };
                        const isActive = rightTab === tab;
                        return (
                            <button key={tab} onClick={() => setRightTab(tab)} style={{
                                flex: 1, padding: "10px 0", border: "none", cursor: "pointer", background: "transparent",
                                borderBottom: isActive ? "2px solid #3b82f6" : "2px solid transparent",
                                color: isActive ? "#3b82f6" : "#94a3b8", fontSize: 10, fontWeight: isActive ? 800 : 600,
                                display: "flex", flexDirection: "column", alignItems: "center", gap: 2, transition: "all 0.15s",
                            }}>
                                <MI icon={icons[tab]} style={{ fontSize: 16 }} />
                                {labels[tab]}
                            </button>
                        );
                    })}
                    <button onClick={() => setRightOpen(false)} aria-label="도구 패널 접기" style={{ padding: "0 10px", border: "none", cursor: "pointer", background: "transparent", borderBottom: "2px solid transparent", color: "#cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", transition: "color 0.15s" }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#94a3b8")}
                        onMouseLeave={e => (e.currentTarget.style.color = "#cbd5e1")}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_right</span>
                    </button>
                </div>

                {/* ── Tab Content ── */}
                <div className="hide-sb" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>

                    {rightTab === "notes" && (
                        selectedUnit ? (
                            <StudyNotesEditor
                                key={noteKey}
                                initialContent={existingNote?.content || ""}
                                initialColor={existingNote?.color || "yellow"}
                                unitTitle={selectedUnit.title}
                                onSave={(content, color) => saveNote(noteKey, content, color)}
                            />
                        ) : (
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#cbd5e1", gap: 8 }}>
                                <MI icon="sticky_note_2" style={{ fontSize: 32 }} />
                                <p style={{ fontSize: 12, margin: 0, textAlign: "center" }}>유닛을 선택하면<br />노트를 작성할 수 있습니다</p>
                            </div>
                        )
                    )}

                    {/* ━━ CODE TAB ━━ */}
                    {rightTab === "code" && (
                        <CodeEditor
                            language={courseData?.defaultLanguage ?? 'python'}
                            saveContext={selectedUnit && activePage
                                ? `unit:${courseId}/${selectedUnit.id}/${activePage.id}`
                                : `course:${courseId}`}
                            onCodeRun={() => {
                                trackMission("code_run");
                                if (user?.id) {
                                    awardXP("code_run", `course:${crypto.randomUUID()}`);
                                    checkAchievementBadges({ completedUnits: completedUnits.size, codeRuns: 1, quizStreak: 0 });
                                }
                            }}
                        />
                    )}

                    {/* ━━ TIMER TAB ━━ */}
                    {rightTab === "timer" && (() => {
                        const totalSec = TIMER_DURATIONS[timerMode];
                        const pct = totalSec > 0 ? ((totalSec - timerSec) / totalSec) * 100 : 0;
                        const mm = String(Math.floor(timerSec / 60)).padStart(2, "0");
                        const ss = String(timerSec % 60).padStart(2, "0");
                        return (
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 16px", gap: 20 }}>
                                {/* Mode selector */}
                                <div style={{ display: "flex", gap: 6, background: "#f1f5f9", borderRadius: 12, padding: 4 }}>
                                    {(["focus", "short", "long"] as const).map(m => (
                                        <button key={m} onClick={() => resetTimer(m)} style={{
                                            padding: "6px 14px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 11, fontWeight: timerMode === m ? 700 : 500,
                                            background: timerMode === m ? "#fff" : "transparent", color: timerMode === m ? "#3b82f6" : "#64748b",
                                            boxShadow: timerMode === m ? "0 2px 8px rgba(0,0,0,0.06)" : "none", transition: "all 0.15s",
                                        }}>{m === "focus" ? "집중" : m === "short" ? "짧은 휴식" : "긴 휴식"}</button>
                                    ))}
                                </div>

                                {/* Circular progress */}
                                <div style={{ position: "relative", width: 180, height: 180 }}>
                                    <svg width="180" height="180" style={{ transform: "rotate(-90deg)" }}>
                                        <circle cx="90" cy="90" r="80" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                                        <circle cx="90" cy="90" r="80" fill="none" stroke={timerMode === "focus" ? "#3b82f6" : "#10b981"} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 80}`} strokeDashoffset={`${2 * Math.PI * 80 * (1 - pct / 100)}`} style={{ transition: "stroke-dashoffset 0.5s" }} />
                                    </svg>
                                    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                                        <span style={{ fontSize: 40, fontWeight: 900, color: "#0f172a", fontFamily: "monospace", letterSpacing: 2 }}>{mm}:{ss}</span>
                                        <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>{timerMode === "focus" ? "집중 시간" : "휴식 시간"}</span>
                                    </div>
                                </div>

                                {/* Controls */}
                                <div style={{ display: "flex", gap: 10 }}>
                                    <button onClick={() => setTimerRunning(!timerRunning)} style={{
                                        padding: "10px 28px", borderRadius: 14, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700,
                                        background: timerRunning ? "#f1f5f9" : "linear-gradient(135deg,#3b82f6,#2563eb)",
                                        color: timerRunning ? "#475569" : "#fff",
                                    }}>{timerRunning ? "⏸ 일시정지" : timerSec < totalSec ? "▶ 계속" : "▶ 시작"}</button>
                                    <button onClick={() => resetTimer(timerMode)} style={{ padding: "10px 16px", borderRadius: 14, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#64748b" }}>↺</button>
                                </div>

                                {/* Sessions */}
                                <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>오늘 완료: <span style={{ color: "#3b82f6", fontWeight: 800 }}>{timerSessions}</span> 세션</div>
                            </div>
                        );
                    })()}

                    {/* ━━ Q&A TAB ━━ */}
                    {rightTab === "qa" && (
                        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                            <div style={{ padding: 16, borderBottom: "1px solid #f1f5f9" }}>
                                <div style={{ display: "flex", gap: 6 }}>
                                    <input value={qaInput} onChange={e => setQaInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addQuestion()}
                                        placeholder="질문을 입력하세요..."
                                        style={{ flex: 1, padding: "8px 14px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12, outline: "none", background: "#f8fafc" }} />
                                    <button onClick={addQuestion} style={{ padding: "8px 14px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#3b82f6,#2563eb)", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>등록</button>
                                </div>
                            </div>
                            <div className="hide-sb" style={{ flex: 1, overflowY: "auto", padding: "8px 16px" }}>
                                {qaList.length === 0 ? (
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#cbd5e1", gap: 8, padding: 20 }}>
                                        <MI icon="help_outline" style={{ fontSize: 32 }} />
                                        <p style={{ fontSize: 12, margin: 0, textAlign: "center" }}>궁금한 점을 질문해보세요</p>
                                    </div>
                                ) : qaList.map((item, i) => (
                                    <div key={item.ts} style={{ padding: "10px 0", borderBottom: i < qaList.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                                        <p style={{ fontSize: 12, color: "#334155", margin: 0, lineHeight: 1.6 }}>Q. {item.q}</p>
                                        <span style={{ fontSize: 9, color: "#cbd5e1" }}>{new Date(item.ts).toLocaleDateString("ko")}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ━━ BOOKMARKS TAB ━━ */}
                    {rightTab === "bookmarks" && (
                        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                            {selectedUnit && activePage && (
                                <div style={{ padding: 16, borderBottom: "1px solid #f1f5f9" }}>
                                    <button onClick={addBookmark} disabled={isBookmarked} style={{
                                        width: "100%", padding: "10px", borderRadius: 12, border: isBookmarked ? "1px solid #c7d2fe" : "1px solid #e2e8f0",
                                        background: isBookmarked ? "#EFF6FF" : "#fff", cursor: isBookmarked ? "default" : "pointer",
                                        fontSize: 12, fontWeight: 700, color: isBookmarked ? "#3b82f6" : "#475569", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                                    }}>
                                        <MI icon={isBookmarked ? "bookmark" : "bookmark_border"} style={{ fontSize: 16 }} />
                                        {isBookmarked ? "북마크됨" : "현재 페이지 북마크"}
                                    </button>
                                </div>
                            )}
                            <div className="hide-sb" style={{ flex: 1, overflowY: "auto", padding: "8px 16px" }}>
                                {bookmarks.length === 0 ? (
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#cbd5e1", gap: 8, padding: 20 }}>
                                        <MI icon="bookmark_border" style={{ fontSize: 32 }} />
                                        <p style={{ fontSize: 12, margin: 0, textAlign: "center" }}>중요한 페이지를<br />북마크해보세요</p>
                                    </div>
                                ) : bookmarks.map(bm => (
                                    <div key={bm.ts} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "1px solid #f8fafc" }}>
                                        <button onClick={() => {
                                            const u = allUnits.find(u => u.id === bm.unitId);
                                            if (u) { selectUnit(u); const pg = u.pages?.find(p => p.id === bm.pageId); if (pg) setActivePage(pg); }
                                        }} style={{ flex: 1, textAlign: "left", border: "none", background: "transparent", cursor: "pointer", padding: 0 }}>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: "#334155" }}>{bm.pageTitle}</div>
                                            <div style={{ fontSize: 9, color: "#94a3b8" }}>{bm.unitTitle}</div>
                                        </button>
                                        <button onClick={() => removeBookmark(bm.ts)} style={{ border: "none", background: "transparent", cursor: "pointer", color: "#cbd5e1", fontSize: 14 }}>✕</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            {/* ══ 선생님 메시지 플로팅 위젯 ══ */}
            <div style={{ position: "fixed", bottom: 24, right: 90, zIndex: 100, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                <AnimatePresence>
                    {annWidgetOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 16, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 16, scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            style={{
                                width: 320,
                                maxHeight: 400,
                                background: "rgba(30,41,59,0.95)",
                                backdropFilter: "blur(16px)",
                                borderRadius: 16,
                                border: "1px solid rgba(255,255,255,0.1)",
                                boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
                                display: "flex",
                                flexDirection: "column",
                                overflow: "hidden",
                            }}
                        >
                            {/* Widget header */}
                            <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", display: "flex", alignItems: "center", gap: 8 }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>campaign</span>
                                    선생님 메시지
                                    <span style={{ marginLeft: "auto", fontSize: 10, color: "#64748b", fontWeight: 600 }}>
                                        최신 {announcements.length}개
                                    </span>
                                </div>
                            </div>

                            {/* Announcement list */}
                            <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}
                                className="hide-sb"
                            >
                                {announcements.length === 0 ? (
                                    <div style={{ textAlign: "center", padding: "32px 16px", color: "#475569", fontSize: 12 }}>
                                        공지사항이 없습니다
                                    </div>
                                ) : announcements.map((ann) => (
                                    <div key={ann.id} style={{
                                        padding: "10px 16px",
                                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                                    }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                                            {ann.is_pinned && <span className="material-symbols-outlined" style={{ fontSize: 12 }}>push_pin</span>}
                                            <span style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", flex: 1 }}>{ann.title}</span>
                                        </div>
                                        {ann.content && (
                                            <p style={{ fontSize: 11, color: "#94a3b8", margin: "0 0 4px", lineHeight: 1.6 }}>
                                                {ann.content}
                                            </p>
                                        )}
                                        <span style={{ fontSize: 10, color: "#475569" }}>
                                            {new Date(ann.created_at).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Toggle button */}
                <motion.button
                    onClick={handleOpenAnnWidget}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                        position: "relative",
                        padding: "10px 18px",
                        borderRadius: 14,
                        border: "1px solid rgba(255,255,255,0.15)",
                        background: annWidgetOpen
                            ? "rgba(5,150,105,0.9)"
                            : "rgba(30,41,59,0.92)",
                        backdropFilter: "blur(12px)",
                        color: "#f1f5f9",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                    }}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>campaign</span>
                    선생님 메시지 {announcements.length}개
                    {annHasNew && !annWidgetOpen && (
                        <span style={{
                            position: "absolute",
                            top: -4,
                            right: -4,
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: "#ef4444",
                            border: "2px solid #0f172a",
                        }} />
                    )}
                </motion.button>
            </div>

            {/* AI 튜터 — Smart Context (코스 > 챕터 > 유닛 + 언어) */}
            <AITutor
                context={(() => {
                    const ch = courseData.chapters.find((c: any) => c.units.some((u: any) => u.id === selectedUnit?.id));
                    return [courseData.title, ch?.title, selectedUnit?.title].filter(Boolean).join(" > ");
                })()}
                studentId={user?.id}
                currentLanguage={courseId === '4' ? 'cpp' : courseId === '3' ? 'python' : undefined}
            />
        </div>
    );
}
