"use client";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { XP_REWARDS, XP_PENALTIES } from "@/lib/xp-engine";
import { awardXP, deductXP } from "@/lib/xp-client";
import { trackMission } from "@/lib/mission-tracker";
import { getCourseById, getAllUnits } from "@/data/courses";
import { getHtmlContentPath } from "@/data/courses/html-content-map";
import type { Unit, Page, Quiz, CodeProblem } from "@/data/courses";

declare global { interface Window { __runCCode?: (btn: HTMLButtonElement) => Promise<void>; } }
import LevelUpModal from "@/components/ui/LevelUpModal";
import AITutor from "@/components/ui/AITutor";
import { QuizPanel, CodeProblemCard, MI, glassPanel } from "../../../../components";
import confetti from "canvas-confetti";
import { useWrongAnswers } from "@/hooks/useWrongAnswers";
import { useHighlighter } from "@/hooks/useHighlighter";
import { sanitizeHTML } from "@/lib/sanitize";
import { usePresenceHeartbeat } from "@/hooks/usePresenceHeartbeat";
import { useActivityLog } from "@/hooks/useActivityLog";
import { useLessonAnswerPersistence } from "@/hooks/useLessonPersistence";
import type { LessonAnswerSnapshot } from "@/lib/python-core-learning";
import PptViewer from "@/components/learning/PptViewer";
import SlideViewer from "@/components/learning/SlideViewer";
import BookSlideViewer from "@/components/learning/BookSlideViewer";
import { createClient } from "@/lib/supabase";
import { DigitalCreatorActionWriting, type DigitalCreatorActionAnswers } from "../../../../DigitalCreatorActionWriting";

/* ──────────────────────────────────────────────
   Learning Content Page
   /dashboard/learning/courses/[courseId]/units/[unitId]/pages/[pageId]
   ────────────────────────────────────────────── */

export default function LearningContentPage() {
    const params = useParams();
    const router = useRouter();
    const courseId = params.courseId as string;
    const unitIdParam = params.unitId as string;
    const pageIdParam = params.pageId as string;
    const { user } = useAuth();
    const contentRef = useRef<HTMLDivElement>(null);

    const courseData = useMemo(() => getCourseById(courseId), [courseId]);
    const allUnits = useMemo(() => getAllUnits(courseId), [courseId]);

    // Find unit by 1-based index in allUnits (URL param is index, not unitNumber)
    const unitIndex = parseInt(unitIdParam, 10) - 1;
    const unit = useMemo(() => (unitIndex >= 0 && unitIndex < allUnits.length) ? allUnits[unitIndex] : undefined, [allUnits, unitIndex]);
    // Auto-inject HTML textbook page if available
    const htmlContentPath = useMemo(() => getHtmlContentPath(courseId, unitIndex + 1), [courseId, unitIndex]);
    const pages = useMemo(() => {
        const basePgs = unit?.pages ?? [];
        if (htmlContentPath && !basePgs.some(p => p.id.endsWith('.0'))) {
            const textbookPage: Page = { id: `${unit?.unitNumber ?? 0}.0`, title: '교재', type: '페이지' as const, content: `<iframe src="${htmlContentPath}" style="width:100%;height:100%;border:none;display:block" />` };
            return [textbookPage, ...basePgs];
        }
        return basePgs;
    }, [unit, htmlContentPath]);
    // Use local state for page switching to avoid full re-mount
    const [activePageId, setActivePageId] = useState(pageIdParam);
    useEffect(() => { setActivePageId(pageIdParam); }, [pageIdParam]);
    const currentPage = useMemo(() => pages.find(p => p.id === activePageId), [pages, activePageId]);
    const currentPageIndex = useMemo(() => pages.findIndex(p => p.id === activePageId), [pages, activePageId]);

    // Presence heartbeat (현재 상태)
    usePresenceHeartbeat({
        courseId, courseTitle: courseData?.title,
        unitId: unitIdParam, unitTitle: unit?.title,
        pageId: activePageId, pageTitle: currentPage?.title,
    });
    // 학습 기록 영구 저장 (모든 페이지 방문 + 체류 시간)
    useActivityLog({
        courseId, courseTitle: courseData?.title,
        unitId: unitIdParam, unitTitle: unit?.title,
        pageId: activePageId, pageTitle: currentPage?.title,
    });

    // Quiz state
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [quizResult, setQuizResult] = useState<"correct" | "wrong" | null>(null);
    const [wrongCount, setWrongCount] = useState(0);
    const [showHint, setShowHint] = useState(false);
    const [hintLevel, setHintLevel] = useState(0); // 0: no hint, 1-3: progressive hints
    const [shaking, setShaking] = useState(false);
    const [levelUpInfo, setLevelUpInfo] = useState<{ level: number } | null>(null);
    const [xpMsg, setXpMsg] = useState("");

    // Code problem state
    const [showProblemAnswer, setShowProblemAnswer] = useState<Record<number, boolean>>({});
    const [editorCode, setEditorCode] = useState<Record<number, string>>({});
    const [runResult, setRunResult] = useState<Record<number, { stdout: string; stderr: string; exitCode: number } | null>>({});
    const [runLoading, setRunLoading] = useState<Record<number, boolean>>({});
    const [projectActionAnswers, setProjectActionAnswers] = useState<DigitalCreatorActionAnswers>({ make: "", challenge: "" });
    const [preservedActivityAnswer, setPreservedActivityAnswer] = useState("");

    const restoreActionWritingAnswer = useCallback((saved: LessonAnswerSnapshot) => {
        setPreservedActivityAnswer(saved.codeAnswers.activity ?? "");
        setProjectActionAnswers({
            make: saved.codeAnswers.make ?? "",
            challenge: saved.codeAnswers.challenge ?? "",
        });
    }, []);
    const actionWritingDraft = useMemo(() => ({
        quizAnswer: null,
        quizResult: null,
        codeAnswers: {
            activity: preservedActivityAnswer,
            make: projectActionAnswers.make,
            challenge: projectActionAnswers.challenge,
        },
    }), [preservedActivityAnswer, projectActionAnswers]);
    const { status: actionWritingSaveStatus } = useLessonAnswerPersistence({
        enabled: courseId === "11" && !!currentPage?.actionWriting,
        userId: user?.id,
        courseId,
        unitId: unit?.id,
        pageId: currentPage?.id,
        answer: actionWritingDraft,
        onRestore: restoreActionWritingAnswer,
    });

    // Wrong answer notebook
    const { addWrongAnswer } = useWrongAnswers();

    // Highlighter
    const hlContentRef = useRef<HTMLDivElement>(null);
    const { addHighlight, clearHighlights, setColor, colors } = useHighlighter(hlContentRef, courseId, unitIdParam, activePageId);
    const [hlActive, setHlActive] = useState(false);
    const [hlColor, setHlColor] = useState(0);

    // Unit completion state
    const [unitCompleted, setUnitCompleted] = useState(false);
    const [completing, setCompleting] = useState(false);

    // setTimeout cleanup refs
    const quizAutoNextTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const quizShakeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const xpMsgTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    useEffect(() => () => {
        clearTimeout(quizAutoNextTimerRef.current);
        clearTimeout(quizShakeTimerRef.current);
        clearTimeout(xpMsgTimerRef.current);
    }, []);

    // ── Code execution ──
    const executeCode = async (probId: number, code: string) => {
        setRunLoading(prev => ({ ...prev, [probId]: true }));
        setRunResult(prev => ({ ...prev, [probId]: null }));
        try {
            const res = await fetch('/api/compile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) });
            const data = await res.json();
            setRunResult(prev => ({ ...prev, [probId]: { stdout: data.program_output || "", stderr: data.program_error || data.compiler_error || "", exitCode: data.status === "0" ? 0 : 1 } }));
        } catch (err) {
            if (process.env.NODE_ENV === 'development') console.error('[Compile] executeCode failed:', err);
            setRunResult(prev => ({ ...prev, [probId]: { stdout: "", stderr: "네트워크 오류가 발생했습니다.", exitCode: 1 } }));
        } finally {
            setRunLoading(prev => ({ ...prev, [probId]: false }));
        }
    };

    // ── Reset quiz/problem state when page changes ──
    useEffect(() => {
        setSelectedAnswer(null);
        setQuizResult(null);
        setWrongCount(0);
        setShowHint(false);
        setHintLevel(0);
        setShaking(false);
        setShowProblemAnswer({});
        setEditorCode({});
        setRunResult({});
        setProjectActionAnswers({ make: "", challenge: "" });
        setPreservedActivityAnswer("");
        if (contentRef.current) contentRef.current.scrollTop = 0;
    }, [activePageId]);

    // ── Inject __runCCode for in-content run buttons ──
    useEffect(() => {
        window.__runCCode = async (btn: HTMLButtonElement) => {
            const code = btn.getAttribute("data-code")?.replace(/\\n/g, "\n").replace(/\\"/g, '"') ?? "";
            btn.disabled = true;
            btn.textContent = "⏳ 실행 중...";
            const wrapper = btn.closest(".lms-code-wrap");
            try {
                const res = await fetch("/api/compile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
                const data = await res.json();
                const output = data.program_output || data.compiler_error || data.program_error || "(출력 없음)";
                const isError = !!(data.compiler_error || data.program_error);
                let outEl = wrapper?.querySelector(".lms-run-output") as HTMLDivElement;
                if (!outEl) { outEl = document.createElement("div"); outEl.className = "lms-run-output"; wrapper?.appendChild(outEl); }
                outEl.innerHTML = sanitizeHTML(`<div class="status ${isError ? "error" : "success"}">${isError ? "✗ 에러" : "✓ 실행 완료"}</div><pre>${output}</pre>`);
            } catch (e) { if (process.env.NODE_ENV === 'development') console.error('[Compile] __runCCode failed:', e); } finally { btn.disabled = false; btn.textContent = "▶ 실행"; }
        };
        return () => { delete window.__runCCode; };
    }, []);

    // ── Inject copy buttons into code blocks ──
    useEffect(() => {
        if (!contentRef.current) return;
        const timer = setTimeout(() => {
            const blocks = contentRef.current?.querySelectorAll('pre');
            if (!blocks) return;
            blocks.forEach(pre => {
                if (pre.querySelector('.copy-btn')) return;
                const btn = document.createElement('button');
                btn.className = 'copy-btn';
                btn.textContent = '≡ 복사';
                btn.title = '코드 복사';
                Object.assign(btn.style, {
                    position: 'absolute', top: '6px', right: '6px', padding: '4px 10px',
                    border: 'none', borderRadius: '8px', background: 'rgba(255,255,255,0.9)',
                    color: '#475569', fontSize: '11px', fontWeight: '700', cursor: 'pointer',
                    opacity: '0', transition: 'opacity 0.2s', zIndex: '10',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                });
                pre.style.position = 'relative';
                pre.addEventListener('mouseenter', () => { btn.style.opacity = '1'; });
                pre.addEventListener('mouseleave', () => { btn.style.opacity = '0'; });
                btn.addEventListener('click', async () => {
                    const code = pre.querySelector('code')?.textContent || pre.textContent || '';
                    try {
                        await navigator.clipboard.writeText(code);
                        btn.textContent = '✓ 복사됨!';
                        setTimeout(() => { btn.textContent = '≡ 복사'; }, 1500);
                    } catch { btn.textContent = '✗ 실패'; setTimeout(() => { btn.textContent = '≡ 복사'; }, 1500); }
                });
                pre.appendChild(btn);
            });
        }, 300);
        return () => clearTimeout(timer);
    }, [currentPage?.content, pageIdParam]);

    // ── iframe 주석 도구 (형광펜/메모) ──
    const iframeRefL = useRef<HTMLIFrameElement>(null);
    const iframeRefR = useRef<HTMLIFrameElement>(null);
    const [annotateMode, setAnnotateMode] = useState<'off' | 'highlight' | 'note' | 'answer'>('off');
    const [annotateColor, setAnnotateColor] = useState('#fef08a');
    const ANNOTATE_COLORS = ['#fef08a', '#bbf7d0', '#bfdbfe', '#fecaca', '#e9d5ff'];

    // iframe 로드 후 주석 스크립트 주입
    const injectAnnotate = useCallback((iframe: HTMLIFrameElement | null, pageKey: string) => {
        if (!iframe) return;
        try {
            const doc = iframe.contentDocument;
            const win = iframe.contentWindow;
            if (!doc || !win) return;
            // 이미 주입됐으면 키만 업데이트
            if ((win as any).__codingssokAnnotateLoaded) {
                win.postMessage({ type: 'annotate-set-key', pageKey }, '*');
                win.postMessage({ type: 'annotate-set-mode', mode: annotateMode }, '*');
                win.postMessage({ type: 'annotate-set-color', color: annotateColor }, '*');
                return;
            }
            const script = doc.createElement('script');
            script.src = '/learn-annotate.js';
            script.onload = () => {
                win.postMessage({ type: 'annotate-set-key', pageKey }, '*');
                win.postMessage({ type: 'annotate-set-mode', mode: annotateMode }, '*');
                win.postMessage({ type: 'annotate-set-color', color: annotateColor }, '*');
            };
            doc.head.appendChild(script);
        } catch (e) {
            if (process.env.NODE_ENV === 'development') console.warn('[annotate] inject failed:', e);
        }
    }, [annotateMode, annotateColor]);

    // 모드/색 변경 시 iframe에 전파
    useEffect(() => {
        [iframeRefL.current, iframeRefR.current].forEach(ifr => {
            try { ifr?.contentWindow?.postMessage({ type: 'annotate-set-mode', mode: annotateMode }, '*'); } catch {}
        });
    }, [annotateMode]);
    useEffect(() => {
        [iframeRefL.current, iframeRefR.current].forEach(ifr => {
            try { ifr?.contentWindow?.postMessage({ type: 'annotate-set-color', color: annotateColor }, '*'); } catch {}
        });
    }, [annotateColor]);

    // ── 책 모드 (1|2 페이지 분할) ──
    const [bookMode, setBookMode] = useState<boolean>(false);
    useEffect(() => {
        try { setBookMode(localStorage.getItem('learning_book_mode') === '1'); } catch {}
    }, []);
    const toggleBookMode = useCallback(() => {
        setBookMode(prev => {
            const next = !prev;
            try { localStorage.setItem('learning_book_mode', next ? '1' : '0'); } catch {}
            return next;
        });
    }, []);

    // ── Navigation helpers ──
    const prevPage = currentPageIndex > 0 ? pages[currentPageIndex - 1] : null;
    const nextPage = currentPageIndex < pages.length - 1 ? pages[currentPageIndex + 1] : null;
    // 책모드에서 오른쪽 페이지(다음 페이지)도 iframe 콘텐츠일 때만 분할 표시
    const rightPage = bookMode && nextPage && currentPage?.content?.includes('<iframe') && nextPage.content?.includes('<iframe') ? nextPage : null;
    const navigatePage = useCallback((pageId: string) => {
        setActivePageId(pageId);
        // Shallow URL update without full re-mount
        window.history.replaceState(null, '', `/dashboard/learning/courses/${courseId}/units/${unitIdParam}/pages/${pageId}`);
    }, [courseId, unitIdParam]);

    // ── Quiz check (defined after nextPage/navigatePage to avoid stale closure) ──
    const handleQuizCheck = useCallback((quiz: Quiz) => {
        if (selectedAnswer === null) return;
        if (selectedAnswer === quiz.answer) {
            setQuizResult("correct");
            //  Confetti celebration!
            confetti({ particleCount: 200, spread: 80, origin: { y: 0.75 }, colors: ['#2563eb', '#F59E0B', '#34D399', '#818CF8'] });
            trackMission("quiz_solve");
            if (user?.id) {
                awardXP("quiz_correct", `quiz:${courseId}:${unitIdParam}:${activePageId}`).then(r => {
                    if (r?.levelUp) setLevelUpInfo({ level: r.level });
                    setXpMsg(`+${XP_REWARDS.lesson_complete} XP`);
                    xpMsgTimerRef.current = setTimeout(() => setXpMsg(""), 2500);
                });
            }
            // 자동 다음 페이지 전환 (2초 후)
            quizAutoNextTimerRef.current = setTimeout(() => {
                if (nextPage) {
                    navigatePage(nextPage.id);
                }
            }, 2000);
        } else {
            setQuizResult("wrong");
            setShaking(true);
            quizShakeTimerRef.current = setTimeout(() => setShaking(false), 600);
            const newWrongCount = wrongCount + 1;
            setWrongCount(newWrongCount);
            // Progressive hints: level 1 at 2 wrong, level 2 at 4 wrong, level 3 (full answer) at 6 wrong
            if (newWrongCount >= 2) { setShowHint(true); setHintLevel(Math.min(3, Math.ceil(newWrongCount / 2))); }
            // 오답 노트에 자동 기록
            if (currentPage?.quiz) {
                addWrongAnswer({
                    id: `${courseId}__${unitIdParam}__${pageIdParam}__0`,
                    courseId,
                    unitTitle: unit?.title ?? "",
                    pageTitle: currentPage.title,
                    question: quiz.question,
                    options: quiz.options,
                    correctAnswer: quiz.answer,
                    userAnswer: selectedAnswer,
                });
            }
            if (user?.id) {
                deductXP(user.id, XP_PENALTIES.wrong_answer, "오답");
            }
        }
    }, [selectedAnswer, user, wrongCount, currentPage, unit, addWrongAnswer, courseId, unitIdParam, pageIdParam, nextPage, navigatePage]);

    // ── Highlighter: apply on mouseup when active ──
    useEffect(() => {
        if (!hlActive) return;
        const handleMouseUp = () => { setTimeout(() => addHighlight(), 10); };
        document.addEventListener("mouseup", handleMouseUp);
        return () => document.removeEventListener("mouseup", handleMouseUp);
    }, [hlActive, addHighlight]);

    // ── Unit completion ──
    const markUnitComplete = useCallback(async () => {
        if (!user?.id || !unit || completing) return;
        setCompleting(true);
        try {
            const supabase = createClient();
            const { data: existing } = await supabase
                .from("user_course_progress")
                .select("completed_lessons, progress")
                .eq("user_id", user.id)
                .eq("course_id", courseId)
                .maybeSingle();

            const completedSet = new Set<string>(
                Array.isArray(existing?.completed_lessons) ? existing.completed_lessons : []
            );
            completedSet.add(unit.id);
            const totalUnits = allUnits.length;
            const progress = Math.round((completedSet.size / totalUnits) * 100);

            await supabase.from("user_course_progress").upsert({
                user_id: user.id,
                course_id: courseId,
                completed_lessons: Array.from(completedSet),
                progress,
            }, { onConflict: "user_id,course_id" });

            const r = await awardXP("unit_complete", `unit:${courseId}:${unitIdParam}`);
            if (r?.levelUp) setLevelUpInfo({ level: r.level });
            setXpMsg(`+${XP_REWARDS.lesson_complete * 2} XP`);
            setTimeout(() => setXpMsg(""), 3000);
            trackMission("lesson_complete");

            setUnitCompleted(true);
            confetti({ particleCount: 300, spread: 100, origin: { y: 0.6 }, colors: ['#10b981', '#059669', '#34d399', '#fbbf24'] });
        } catch (err) {
            if (process.env.NODE_ENV === 'development') console.error('[UnitComplete]', err);
        } finally {
            setCompleting(false);
        }
    }, [user, unit, courseId, allUnits.length, completing]);

    // ── Keyboard navigation (←→ arrow keys) ──
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const el = e.target as HTMLElement;
            const tag = el?.tagName;
            // Don't interfere with ANY text input contexts
            if (tag === 'INPUT' || tag === 'TEXTAREA' || el?.isContentEditable) return;
            if (el?.closest('[contenteditable]') || el?.closest('.notes-area') || el?.closest('iframe')) return;
            if (e.key === 'ArrowLeft' && prevPage) {
                e.preventDefault();
                navigatePage(prevPage.id);
            } else if (e.key === 'ArrowRight' && nextPage) {
                e.preventDefault();
                navigatePage(nextPage.id);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [prevPage, nextPage]);

    // Find chapter containing this unit
    const chapterInfo = useMemo(() => {
        if (!courseData || !unit) return null;
        for (const ch of courseData.chapters) {
            if (ch.units.some(u => u.id === unit.id)) {
                return ch;
            }
        }
        return null;
    }, [courseData, unit]);

    // Find next unit for auto-advance
    const nextUnitInfo = useMemo(() => {
        if (!courseData || !unit) return null;
        const allCourseUnits = courseData.chapters.flatMap(ch => ch.units);
        const currentIdx = allCourseUnits.findIndex(u => u.id === unit.id);
        if (currentIdx < 0 || currentIdx >= allCourseUnits.length - 1) return null;
        const next = allCourseUnits[currentIdx + 1];
        const hasContent = next.pages && next.pages.some(p => p.content || p.quiz || p.problems);
        if (!hasContent) return null;
        const firstPage = next.pages?.find(p => p.content || p.quiz || p.problems) || next.pages?.[0];
        if (!firstPage) return null;
        return { unit: next, unitIdx: currentIdx + 2, firstPageId: firstPage.id };
    }, [courseData, unit]);

    // ── Not found ──
    if (!courseData || !unit) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", flexDirection: "column", gap: 16 }}>
                <span style={{ fontSize: 48, opacity: 0.3 }}></span>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "#334155" }}>유닛을 찾을 수 없습니다</h2>
                <Link href={`/dashboard/learning/courses/${courseId}`} style={{ color: "#0ea5e9", fontWeight: 600, fontSize: 14 }}>
                    ← 코스로 돌아가기
                </Link>
            </div>
        );
    }

    if (!currentPage) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", flexDirection: "column", gap: 16 }}>
                <span style={{ fontSize: 48, opacity: 0.3 }}></span>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "#334155" }}>페이지를 찾을 수 없습니다</h2>
                <p style={{ fontSize: 13, color: "#94a3b8" }}>이 유닛에는 {pages.length}개의 페이지가 있습니다.</p>
                {pages.length > 0 && (
                    <button onClick={() => navigatePage(pages[0].id)} style={{ padding: "8px 20px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #0ea5e9, #3b82f6)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                        첫 번째 페이지로 이동
                    </button>
                )}
                <Link href={`/dashboard/learning/courses/${courseId}`} style={{ color: "#0ea5e9", fontWeight: 600, fontSize: 14 }}>
                    ← 코스로 돌아가기
                </Link>
            </div>
        );
    }

    const pageIcon = currentPage.type === '퀴즈' ? '?' : currentPage.type === '핵심정리' ? '≡' : currentPage.type === 'QnA' ? '' : '';

    return (
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "28px 16px 80px" }}>
            {/*
              XP 알림 Local UI 제거 (피드백 L29/L51 중첩 해결)
              awardXP가 내부에서 dispatchEvent('xp-earned')를 발사하므로
              layout.tsx의 Global <XPToast>가 유일한 표시 경로가 됨.
              근본 원인: docs/xp-toast-duplication-analysis.md
            */}

            {levelUpInfo && <LevelUpModal level={levelUpInfo.level} onClose={() => setLevelUpInfo(null)} />}

            {/* ═══ Breadcrumb ═══ */}
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
                <Link href="/dashboard/learning" style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, textDecoration: "none" }}>학습</Link>
                <span style={{ fontSize: 10, color: "#cbd5e1" }}>›</span>
                <Link href={`/dashboard/learning/courses/${courseId}`} style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, textDecoration: "none" }}>{courseData.title}</Link>
                <span style={{ fontSize: 10, color: "#cbd5e1" }}>›</span>
                {chapterInfo && <><span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>CH.{chapterInfo.chapterNumber}</span><span style={{ fontSize: 10, color: "#cbd5e1" }}>›</span></>}
                <span style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>Unit {unit.unitNumber}. {unit.title}</span>
            </motion.div>

            {/* ═══ Page Tabs ═══ */}
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                className="hide-scrollbar"
                style={{ ...glassPanel, display: "flex", gap: 2, overflowX: "auto", marginBottom: 24, padding: 6, borderRadius: 18 }}>
                {pages.map((pg, i) => {
                    const isActive = pg.id === activePageId;
                    const icon = pg.type === '퀴즈' ? '?' : pg.type === '핵심정리' ? '≡' : pg.type === 'QnA' ? '' : '';
                    const hasContent = !!(pg.content || pg.quiz || pg.problems);
                    return (
                        <motion.button key={pg.id} whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
                            onClick={() => hasContent && navigatePage(pg.id)}
                            disabled={!hasContent}
                            style={{
                                padding: "10px 16px", border: "none", cursor: hasContent ? "pointer" : "not-allowed",
                                background: isActive ? "linear-gradient(135deg, rgba(14,165,233,0.1), rgba(99,102,241,0.08))" : "transparent",
                                borderRadius: 14, position: "relative", fontSize: 12,
                                fontWeight: isActive ? 700 : 500, color: isActive ? "#0369a1" : "#64748b",
                                whiteSpace: "nowrap", opacity: hasContent ? 1 : 0.4,
                                transition: "all 0.2s",
                            }}>
                            {icon} {pg.id}. {pg.title}
                            {isActive && <motion.div layoutId="page-tab-indicator" style={{ position: "absolute", bottom: 2, left: 8, right: 8, height: 2, background: "linear-gradient(90deg, #0ea5e9, #3b82f6)", borderRadius: 999 }} />}
                        </motion.button>
                    );
                })}
            </motion.div>

            {/* ═══ Content Card ═══ */}
            <motion.div ref={contentRef} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                style={{ ...glassPanel, borderRadius: 28, overflow: "hidden", position: "relative" }}>
                {/* Gradient top bar */}
                <div style={{ height: 3, background: "linear-gradient(90deg, #0ea5e9, #3b82f6, #2563eb)" }} />

                {/* Page Header */}
                <div style={{ padding: "32px 36px 0", borderBottom: "1px solid rgba(14,165,233,0.06)", position: "relative" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: "#94a3b8", letterSpacing: 1.5, textTransform: "uppercase" as const }}>
                            Page {currentPage.id}
                        </span>
                        <span style={{
                            padding: "2px 10px", borderRadius: 8, fontSize: 10, fontWeight: 700,
                            background: currentPage.type === '퀴즈' ? "rgba(168,85,247,0.08)" : currentPage.type === '핵심정리' ? "rgba(14,165,233,0.08)" : "rgba(16,185,129,0.08)",
                            color: currentPage.type === '퀴즈' ? "#1d4ed8" : currentPage.type === '핵심정리' ? "#0284c7" : "#059669",
                        }}>
                            {pageIcon} {currentPage.type}
                        </span>
                    </div>
                    <h1 style={{ fontSize: 26, fontWeight: 900, color: "#0f172a", margin: "0 0 24px", lineHeight: 1.3, letterSpacing: -0.5 }}>
                        {currentPage.title}
                    </h1>
                    {/* 책 모드 토글 — iframe 콘텐츠일 때만 노출 */}
                    {currentPage.content?.includes('<iframe') && nextPage?.content?.includes('<iframe') && (
                        <button
                            onClick={toggleBookMode}
                            title={bookMode ? "한 페이지 보기" : "책 모드 (1|2 페이지)"}
                            style={{
                                position: "absolute", top: 24, right: 24,
                                padding: "8px 14px", borderRadius: 10, border: "none",
                                background: bookMode ? "linear-gradient(135deg, #3b82f6, #2563eb)" : "#f1f5f9",
                                color: bookMode ? "#fff" : "#64748b",
                                fontSize: 12, fontWeight: 700, cursor: "pointer",
                                display: "flex", alignItems: "center", gap: 6,
                                boxShadow: bookMode ? "0 4px 12px rgba(59,130,246,0.3)" : "none",
                                transition: "all 0.2s",
                            }}>
                            <MI icon={bookMode ? "menu_book" : "auto_stories"} style={{ fontSize: 16 }} />
                            {bookMode ? "책 모드 ON" : "책 모드"}
                        </button>
                    )}
                </div>

                {/* iframe 콘텐츠용 주석 툴바 (형광펜/메모) */}
                {currentPage.content?.includes('<iframe') && (
                    <div style={{
                        padding: "8px 36px", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
                        borderBottom: "1px solid rgba(0,0,0,0.04)", background: "rgba(248,250,252,0.5)",
                    }}>
                        <button
                            onClick={() => setAnnotateMode(m => m === 'highlight' ? 'off' : 'highlight')}
                            title="형광펜 — 텍스트 드래그로 칠하기"
                            style={{
                                padding: "5px 12px", borderRadius: 8, border: "none", fontSize: 12, fontWeight: 700,
                                background: annotateMode === 'highlight' ? "linear-gradient(135deg, #fef08a, #fde047)" : "#f1f5f9",
                                color: annotateMode === 'highlight' ? "#854d0e" : "#64748b", cursor: "pointer",
                                display: "flex", alignItems: "center", gap: 5,
                            }}>
                            <MI icon="edit" style={{ fontSize: 16 }} />
                            형광펜
                        </button>
                        <button
                            onClick={() => setAnnotateMode(m => m === 'note' ? 'off' : 'note')}
                            title="메모 — 클릭한 위치에 메모 추가"
                            style={{
                                padding: "5px 12px", borderRadius: 8, border: "none", fontSize: 12, fontWeight: 700,
                                background: annotateMode === 'note' ? "linear-gradient(135deg, #fbbf24, #f59e0b)" : "#f1f5f9",
                                color: annotateMode === 'note' ? "#fff" : "#64748b", cursor: "pointer",
                                display: "flex", alignItems: "center", gap: 5,
                            }}>
                            <MI icon="sticky_note_2" style={{ fontSize: 16 }} />
                            메모
                        </button>
                        <button
                            onClick={() => setAnnotateMode(m => m === 'answer' ? 'off' : 'answer')}
                            title="답안 입력 — 클릭한 위치에 답안 입력란 추가"
                            style={{
                                padding: "5px 12px", borderRadius: 8, border: "none", fontSize: 12, fontWeight: 700,
                                background: annotateMode === 'answer' ? "linear-gradient(135deg, #3b82f6, #2563eb)" : "#f1f5f9",
                                color: annotateMode === 'answer' ? "#fff" : "#64748b", cursor: "pointer",
                                display: "flex", alignItems: "center", gap: 5,
                            }}>
                            <MI icon="edit_square" style={{ fontSize: 16 }} />
                            답안 입력
                        </button>
                        {annotateMode === 'highlight' && (
                            <>
                                <span style={{ width: 1, height: 18, background: "#e2e8f0", margin: "0 4px" }} />
                                {ANNOTATE_COLORS.map(c => (
                                    <button key={c} onClick={() => setAnnotateColor(c)}
                                        title={`색 변경`}
                                        style={{
                                            width: 22, height: 22, borderRadius: 6,
                                            border: annotateColor === c ? "2px solid #334155" : "1px solid #e2e8f0",
                                            background: c, cursor: "pointer",
                                        }} />
                                ))}
                            </>
                        )}
                        <button
                            onClick={() => {
                                if (!confirm('이 페이지의 모든 형광펜/메모를 삭제할까요?')) return;
                                [iframeRefL.current, iframeRefR.current].forEach(ifr => {
                                    try { ifr?.contentWindow?.postMessage({ type: 'annotate-clear' }, '*'); } catch {}
                                });
                            }}
                            title="이 페이지 주석 모두 지우기"
                            style={{ marginLeft: "auto", padding: "5px 12px", borderRadius: 8, border: "1px solid #fecaca", background: "#fff", fontSize: 11, color: "#dc2626", fontWeight: 600, cursor: "pointer" }}>
                            모두 지우기
                        </button>
                    </div>
                )}

                {/* Highlighter Toolbar — only for non-iframe HTML content */}
                {currentPage.content && !currentPage.content.includes('<iframe') && (
                    <div style={{
                        padding: "8px 36px", display: "flex", alignItems: "center", gap: 8,
                        borderBottom: "1px solid rgba(0,0,0,0.04)", background: "rgba(248,250,252,0.5)",
                    }}>
                        <button
                            onClick={() => setHlActive(!hlActive)}
                            title={hlActive ? "형광펜 끄기" : "형광펜 켜기"}
                            style={{
                                padding: "5px 12px", borderRadius: 8, border: "none", fontSize: 12, fontWeight: 700,
                                background: hlActive ? "linear-gradient(135deg, #fef08a, #fde047)" : "#f1f5f9",
                                color: hlActive ? "#854d0e" : "#64748b", cursor: "pointer",
                                display: "flex", alignItems: "center", gap: 5, transition: "all 0.2s",
                            }}>
                            <MI icon="edit_note" style={{ fontSize: 16 }} />
                            {hlActive ? "형광펜 ON" : "형광펜"}
                        </button>
                        {hlActive && (
                            <>
                                {colors.map((c, i) => (
                                    <button key={c} onClick={() => { setHlColor(i); setColor(c); }}
                                        style={{
                                            width: 22, height: 22, borderRadius: 6, border: hlColor === i ? "2px solid #334155" : "1px solid #e2e8f0",
                                            background: c, cursor: "pointer", transition: "all 0.15s",
                                        }} />
                                ))}
                                <button onClick={clearHighlights} title="형광펜 전체 지우기"
                                    style={{ padding: "4px 10px", borderRadius: 8, border: "1px solid #fecaca", background: "#fff", fontSize: 11, color: "#dc2626", fontWeight: 600, cursor: "pointer" }}>
                                    지우기
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* Content Body */}
                <div style={{ padding: "28px 36px 36px" }}>
                    {/* HTML content — all content is sanitized via isomorphic-dompurify in sanitizeHTML() */}
                    {courseData.materialMode === 'ppt' && courseId !== '11' && courseId !== '12' ? (
                        /* PPT 모드 (컴퓨터기초/코딩기초/피지컬) — 선생님 PPT iframe */
                        <PptViewer courseId={courseId} unitId={unit.id} unitTitle={unit.title} />
                    ) : currentPage.content && (currentPage.content.includes('<iframe') || currentPage.content.includes('cs-slide-wrap')) ? (
                        (() => {
                            // src 추출 (cs-slide-wrap의 <img> 또는 <iframe> 양쪽 지원)
                            const srcMatch = currentPage.content.match(/src=["']([^"']+)["']/);
                            const leftSrc = srcMatch ? srcMatch[1] : '';
                            const isImage = /\.(png|jpe?g|webp|gif)$/i.test(leftSrc);
                            const leftKey = `${courseId}/${unitIdParam}/${currentPage.id}`;
                            const renderMedia = (src: string, title: string, key: string, refOpt?: React.RefObject<HTMLIFrameElement | null>) =>
                                isImage ? (
                                    <div style={{ width: '100%', minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
                                        <img src={src} alt={title}
                                            style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', display: 'block' }} />
                                    </div>
                                ) : (
                                    <iframe ref={refOpt} src={src} title={title} onLoad={() => refOpt && injectAnnotate(refOpt.current, key)} style={{ width: '100%', height: '100%', minHeight: '85vh', border: 'none', display: 'block' }} />
                                );
                            if (rightPage) {
                                const rSrcMatch = rightPage.content?.match(/src=["']([^"']+)["']/);
                                const rightSrc = rSrcMatch ? rSrcMatch[1] : '';
                                const rightKey = `${courseId}/${unitIdParam}/${rightPage.id}`;
                                return (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, width: '100%', minHeight: '85vh' }}>
                                        <div style={{ borderRight: '2px solid #e2e8f0', paddingRight: 8, position: 'relative' }}>
                                            <div style={{ position: 'absolute', top: 8, left: 12, fontSize: 10, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.1em', zIndex: 1 }}>PAGE {currentPageIndex + 1}</div>
                                            {renderMedia(leftSrc, 'page-left', leftKey, iframeRefL)}
                                        </div>
                                        <div style={{ paddingLeft: 8, position: 'relative' }}>
                                            <div style={{ position: 'absolute', top: 8, right: 12, fontSize: 10, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.1em', zIndex: 1 }}>PAGE {currentPageIndex + 2}</div>
                                            {renderMedia(rightSrc, 'page-right', rightKey, iframeRefR)}
                                        </div>
                                    </div>
                                );
                            }
                            return renderMedia(leftSrc, 'page', leftKey, iframeRefL);
                        })()
                    ) : currentPage.content ? (
                        <>
                            <div
                                ref={hlContentRef}
                                className={courseId === '11' ? 'kids-it-content' : undefined}
                                dangerouslySetInnerHTML={{ __html: sanitizeHTML(currentPage.content) }}
                                style={{
                                    fontSize: 14, lineHeight: 1.9, color: "#334155",
                                    marginBottom: currentPage.quiz || currentPage.problems ? 32 : 0,
                                    cursor: hlActive ? "text" : "auto",
                                }}
                            />
                            {courseId === "11" && currentPage.actionWriting && (
                                <DigitalCreatorActionWriting
                                    activity={currentPage.actionWriting}
                                    value={projectActionAnswers}
                                    onChange={setProjectActionAnswers}
                                    saveStatus={actionWritingSaveStatus}
                                />
                            )}
                            {courseId === '11' && (
                                <style dangerouslySetInnerHTML={{ __html: `
                                    .kids-it-content .kids-it-slide {
                                        width: min(100%, 1080px);
                                        margin: 0 auto 4px;
                                        padding: clamp(18px, 3vw, 34px);
                                        border-radius: 22px;
                                        background:
                                            radial-gradient(circle at top left, rgba(59,130,246,0.14), transparent 32%),
                                            linear-gradient(135deg, #ffffff 0%, #f8fbff 56%, #eff6ff 100%);
                                        border: 1px solid rgba(191,219,254,0.9);
                                        box-shadow: 0 18px 48px rgba(15,23,42,0.12);
                                        color: #0f172a;
                                    }
                                    .kids-it-content .kids-it-phase {
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
                                    .kids-it-content .kids-it-phase span { color: #7c3aed; opacity: .72; }
                                    .kids-it-content .kids-it-hero {
                                        display: grid;
                                        grid-template-columns: 1fr auto;
                                        gap: 18px;
                                        align-items: start;
                                        margin-bottom: 20px;
                                    }
                                    .kids-it-content .kids-it-kicker {
                                        margin: 0 0 10px;
                                        color: #2563eb;
                                        font-size: 13px;
                                        font-weight: 900;
                                    }
                                    .kids-it-content .kids-it-hero h2 {
                                        margin: 0;
                                        color: #0f172a;
                                        font-size: clamp(28px, 4vw, 46px);
                                        line-height: 1.18;
                                        font-weight: 950;
                                    }
                                    .kids-it-content .kids-it-hero-copy > p:last-child {
                                        margin: 14px 0 0;
                                        color: #475569;
                                        font-size: clamp(18px, 2.2vw, 24px);
                                        line-height: 1.65;
                                        font-weight: 700;
                                    }
                                    .kids-it-content .kids-it-number {
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
                                    .kids-it-content .kids-it-grid {
                                        display: grid;
                                        grid-template-columns: repeat(2, minmax(0, 1fr));
                                        gap: 16px;
                                        margin-top: 22px;
                                    }
                                    .kids-it-content .kids-it-card,
                                    .kids-it-content .kids-it-remember {
                                        border-radius: 18px;
                                        border: 1px solid #dbeafe;
                                        background: rgba(255,255,255,0.88);
                                        padding: 20px;
                                        box-shadow: 0 10px 24px rgba(37,99,235,0.08);
                                    }
                                    .kids-it-content .kids-it-card span,
                                    .kids-it-content .kids-it-remember strong {
                                        display: inline-flex;
                                        margin-bottom: 10px;
                                        color: #1d4ed8;
                                        font-size: 14px;
                                        font-weight: 950;
                                    }
                                    .kids-it-content .kids-it-card p,
                                    .kids-it-content .kids-it-remember p {
                                        margin: 0;
                                        color: #334155;
                                        font-size: clamp(17px, 1.8vw, 21px);
                                        line-height: 1.75;
                                        font-weight: 700;
                                    }
                                    .kids-it-content .kids-it-card ol {
                                        margin: 0;
                                        padding-left: 24px;
                                        color: #334155;
                                        font-size: clamp(16px, 1.7vw, 20px);
                                        line-height: 1.8;
                                        font-weight: 700;
                                    }
                                    .kids-it-content .kids-it-card li + li {
                                        margin-top: 6px;
                                    }
                                    .kids-it-content .kids-it-card-analogy {
                                        background: linear-gradient(135deg, #ecfdf5, #ffffff);
                                        border-color: #bbf7d0;
                                    }
                                    .kids-it-content .kids-it-plan {
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
                                    .kids-it-content .kids-it-plan strong { color: #312e81; margin-right: 4px; }
                                    .kids-it-content .kids-it-plan i { color: #a78bfa; font-style: normal; }
                                    .kids-it-content .kids-it-remember {
                                        margin-top: 16px;
                                        background: linear-gradient(135deg, #fffbeb, #ffffff);
                                        border-color: #fde68a;
                                    }
                                    .kids-it-content .kids-it-remember strong {
                                        color: #b45309;
                                    }
                                    .kids-it-content .kids-it-textbook {
                                        position:relative;overflow:hidden;width:min(100%,1120px);min-height:720px;
                                        padding:clamp(24px,3.4vw,46px);border:1px solid #dce5ef;border-radius:8px;
                                        background:linear-gradient(rgba(255,255,255,.965),rgba(255,255,255,.965)),repeating-linear-gradient(0deg,transparent 0 27px,rgba(148,163,184,.07) 27px 28px);
                                        box-shadow:0 18px 52px rgba(71,85,105,.16),0 0 0 8px rgba(255,255,255,.72);color:#16335f;
                                        font-family:'Pretendard','Noto Sans KR',system-ui,sans-serif;
                                    }
                                    .kids-it-content .kids-it-textbook::before { content:'';position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at 12% 8%,rgba(191,219,254,.18),transparent 23%),radial-gradient(circle at 90% 12%,rgba(254,240,138,.12),transparent 18%); }
                                    .kids-it-content .kids-it-doodle { position:absolute;z-index:0;user-select:none;opacity:.8; }
                                    .kids-it-content .kids-it-doodle-star { top:25px;left:17%;color:#facc15;font-size:28px;transform:rotate(-9deg); }
                                    .kids-it-content .kids-it-doodle-cloud { top:31px;right:19%;color:#bae6fd;font-size:39px; }
                                    .kids-it-content .kids-it-doodle-plane { top:58px;right:7%;color:#fbbf24;font-size:30px;transform:rotate(-24deg); }
                                    .kids-it-content .kids-it-textbook > *:not(.kids-it-doodle) { position:relative;z-index:1; }
                                    .kids-it-content .kids-it-textbook-top { display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:18px; }
                                    .kids-it-content .kids-it-textbook-brand { display:flex;flex-direction:column;gap:2px;color:#1d4ed8; }
                                    .kids-it-content .kids-it-textbook-brand small { font-size:9px;font-weight:900;letter-spacing:.14em;color:#7c9bc5; }
                                    .kids-it-content .kids-it-textbook-brand b { font-size:clamp(20px,2.3vw,30px);font-weight:950;letter-spacing:-.06em; }
                                    .kids-it-content .kids-it-textbook .kids-it-phase { margin:0;padding:8px 13px;border:1px solid #bfdbfe;background:#eff6ff;color:#1d4ed8;font-size:11px; }
                                    .kids-it-content .kids-it-mission-ribbon { width:min(250px,72%);margin:0 auto 18px;padding:8px 34px;text-align:center;background:linear-gradient(90deg,#fde68a,#fbbf24,#fde68a);clip-path:polygon(0 0,100% 0,88% 50%,100% 100%,0 100%,12% 50%);color:#4a3211;font-size:16px;font-weight:950; }
                                    .kids-it-content .kids-it-title-row { display:grid;grid-template-columns:1fr auto;gap:18px;align-items:end;text-align:center; }
                                    .kids-it-content .kids-it-title-row > div:first-child { padding-left:80px; }
                                    .kids-it-content .kids-it-title-row h2 { margin:0;color:#123265;font-size:clamp(30px,4.6vw,52px);line-height:1.18;font-weight:950;letter-spacing:-.065em;word-break:keep-all; }
                                    .kids-it-content .kids-it-title-row .kids-it-cue { display:block;margin:9px 0 0;color:#5f728d;font-size:14px;line-height:1.6;font-weight:750; }
                                    .kids-it-content .kids-it-textbook .kids-it-number { width:62px;height:62px;border:2px solid #bfdbfe;border-radius:50%;background:#eff6ff;color:#2563eb;box-shadow:none;font-size:24px; }
                                    .kids-it-content .kids-it-pencil-line { height:13px;margin:10px 4% 20px;background:radial-gradient(12px 8px at 12px 0,transparent 11px,#a7d8f5 12px,#a7d8f5 13px,transparent 14px) 0 0/24px 13px repeat-x; }
                                    .kids-it-content .kids-it-think-box { display:grid;grid-template-columns:minmax(0,.95fr) minmax(250px,1.05fr);gap:22px;align-items:center;margin-bottom:15px;padding:20px 24px;border:1px solid #bae6fd;border-radius:22px;background:linear-gradient(135deg,#f2fbff,#eaf7ff); }
                                    .kids-it-content .kids-it-section-title { display:flex;align-items:center;gap:9px;margin-bottom:11px;color:#1e6ab4;font-size:21px;font-weight:950; }
                                    .kids-it-content .kids-it-section-title i { display:inline-flex;width:38px;height:38px;align-items:center;justify-content:center;border-radius:50%;background:#70b9ea;color:#fff;font-size:19px;font-style:normal; }
                                    .kids-it-content .kids-it-think-copy > p { margin:0;color:#294968;font-size:clamp(16px,1.8vw,20px);line-height:1.7;font-weight:750; }
                                    .kids-it-content .kids-it-analogy { margin-top:14px;padding:13px 15px;border:2px dashed #92c8eb;border-radius:16px;background:rgba(255,255,255,.78);color:#58708b;font-size:13px;line-height:1.65; }
                                    .kids-it-content .kids-it-analogy b { display:block;margin-bottom:3px;color:#2270b5;font-size:12px; }
                                    .kids-it-content .kids-it-illustration-frame { display:flex!important;width:100%!important;max-width:430px!important;height:230px!important;margin:0 auto!important;padding:12px 18px!important;align-items:center!important;justify-content:center!important;overflow:visible!important; }
                                    .kids-it-content img.kids-it-illustration { display:block!important;width:100%!important;max-width:394px!important;height:auto!important;max-height:var(--kids-art-height,206px)!important;margin:0 auto!important;border-radius:0!important;box-shadow:none!important;object-fit:contain!important; }
                                    .kids-it-content .kids-it-action-grid { display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px;margin-bottom:15px; }
                                    .kids-it-content .kids-it-action { position:relative;min-height:150px;padding:19px 22px;border-radius:20px; }
                                    .kids-it-content .kids-it-action-make { border:1px solid #bbf7d0;background:linear-gradient(135deg,#f3fff6,#eefbf0); }
                                    .kids-it-content .kids-it-action-challenge { border:1px solid #bae6fd;background:linear-gradient(135deg,#f2faff,#eaf6ff); }
                                    .kids-it-content .kids-it-action-make .kids-it-section-title { color:#268a53; }
                                    .kids-it-content .kids-it-action-make .kids-it-section-title i { background:#77c692; }
                                    .kids-it-content .kids-it-action p { margin:0 38px 20px 0;color:#31516d;font-size:15px;line-height:1.65;font-weight:750; }
                                    .kids-it-content .kids-it-step-number { position:absolute;top:18px;right:18px;display:flex;width:28px;height:28px;align-items:center;justify-content:center;border-radius:9px;background:#fff;color:#5082ab;font-size:12px;font-weight:950;box-shadow:0 3px 8px rgba(15,23,42,.08); }
                                    .kids-it-content .kids-it-action-cue { padding:10px 12px;border:2px dashed rgba(85,124,156,.38);border-radius:12px;background:rgba(255,255,255,.67);color:#4b6b85;font-size:12px;line-height:1.45;font-weight:850;text-align:center; }
                                    .kids-it-content .kids-it-record-box { display:grid;grid-template-columns:auto 1fr auto;gap:15px;align-items:center;margin-top:15px;padding:16px 20px;border:1px solid #fde68a;border-radius:19px;background:linear-gradient(135deg,#fffdf3,#fff9df);box-shadow:none; }
                                    .kids-it-content .kids-it-record-box strong { margin:0;color:#895708;font-size:19px; }
                                    .kids-it-content .kids-it-record-box p { padding:10px 14px;border:1px solid #f9d56e;border-radius:11px;background:#fff;color:#65583b;font-size:13px;line-height:1.55; }
                                    .kids-it-content .kids-it-stars { display:flex;gap:7px;color:#f5b800;font-size:29px;line-height:1; }
                                    @media (max-width: 760px) {
                                        .kids-it-content .kids-it-slide {
                                            border-radius: 16px;
                                        }
                                        .kids-it-content .kids-it-hero,
                                        .kids-it-content .kids-it-grid {
                                            grid-template-columns: 1fr;
                                        }
                                        .kids-it-content .kids-it-number {
                                            width: 56px;
                                            height: 56px;
                                            border-radius: 16px;
                                            font-size: 22px;
                                        }
                                        .kids-it-content .kids-it-textbook { min-height:auto;padding:20px 16px;border-radius:6px; }
                                        .kids-it-content .kids-it-doodle { display:none; }
                                        .kids-it-content .kids-it-textbook-brand small { display:none; }
                                        .kids-it-content .kids-it-title-row,.kids-it-content .kids-it-think-box,.kids-it-content .kids-it-action-grid { grid-template-columns:1fr; }
                                        .kids-it-content .kids-it-title-row > div:first-child { padding-left:0; }
                                        .kids-it-content .kids-it-textbook .kids-it-number { display:none; }
                                        .kids-it-content .kids-it-illustration-frame { --kids-art-height:170px;height:190px!important;padding:10px 14px!important; }
                                        .kids-it-content .kids-it-record-box { grid-template-columns:1fr; }
                                        .kids-it-content .kids-it-stars { justify-content:center; }
                                    }
                                `}} />
                            )}
                        </>
                    ) : null}

                    {/* Quiz */}
                    {currentPage.quiz && (
                        <QuizPanel
                            quiz={currentPage.quiz} unit={unit}
                            selectedAnswer={selectedAnswer} setSelectedAnswer={setSelectedAnswer}
                            quizResult={quizResult} shaking={shaking}
                            wrongCount={wrongCount} showHint={showHint}
                            onCheck={() => handleQuizCheck(currentPage.quiz!)}
                        />
                    )}

                    {/* Code Problems */}
                    {currentPage.problems && currentPage.problems.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 24, marginTop: currentPage.content ? 28 : 0 }}>
                            {currentPage.problems.map((prob: CodeProblem) => (
                                <CodeProblemCard key={prob.id} prob={prob}
                                    editorCode={editorCode} setEditorCode={setEditorCode}
                                    runResult={runResult} runLoading={runLoading}
                                    executeCode={executeCode}
                                    showProblemAnswer={showProblemAnswer} setShowProblemAnswer={setShowProblemAnswer}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>

            {/* ═══ Navigation Footer ═══ */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24, gap: 16 }}>
                {prevPage ? (
                    <motion.button whileHover={{ x: -3 }} whileTap={{ scale: 0.97 }}
                        onClick={() => navigatePage(prevPage.id)}
                        style={{ ...glassPanel, padding: "14px 24px", border: "none", cursor: "pointer", borderRadius: 16, display: "flex", alignItems: "center", gap: 10, flex: 1, maxWidth: 300 }}>
                        <MI icon="arrow_back" style={{ fontSize: 16, color: "#94a3b8" }} />
                        <div style={{ textAlign: "left" }}>
                            <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>이전</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>{prevPage.title}</div>
                        </div>
                    </motion.button>
                ) : <div />}

                {nextPage ? (
                    <motion.button whileHover={{ x: 3 }} whileTap={{ scale: 0.97 }}
                        onClick={() => {
                            // 책모드: 두 페이지를 동시에 보고 있으므로 2칸 건너뛰기
                            const target = rightPage && pages[currentPageIndex + 2] ? pages[currentPageIndex + 2] : nextPage;
                            navigatePage(target.id);
                        }}
                        style={{ ...glassPanel, padding: "14px 24px", border: "none", cursor: "pointer", borderRadius: 16, display: "flex", alignItems: "center", gap: 10, flex: 1, maxWidth: 300, justifyContent: "flex-end" }}>
                        <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>다음</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>{nextPage.title}</div>
                        </div>
                        <MI icon="arrow_forward" style={{ fontSize: 16, color: "#94a3b8" }} />
                    </motion.button>
                ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {/* 수업자료 버튼 — 하단에 배치 */}
                        {courseId === "4" && (() => {
                            const ifPg = pages.find(p => p.content?.includes('<iframe'));
                            if (!ifPg) return null;
                            const sm = ifPg.content?.match(/src=["']([^"']+)["']/);
                            const fn = sm ? (sm[1].split('/').pop() || '') : '';
                            if (!fn) return null;
                            const pdfPath = `/slides/c-lang/${fn.replace('.html', '.pdf')}`;
                            return (
                                <motion.a
                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                    href={pdfPath}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        padding: "14px 20px", border: "none", cursor: "pointer",
                                        borderRadius: 16, textDecoration: "none",
                                        background: "linear-gradient(135deg, #0ea5e9, #2563eb)",
                                        color: "#fff", fontWeight: 800, fontSize: 13,
                                        boxShadow: "0 4px 16px rgba(37,99,235,0.25)",
                                        display: "flex", alignItems: "center", gap: 6,
                                    }}
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>slideshow</span>
                                    수업자료
                                </motion.a>
                            );
                        })()}

                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                            onClick={async () => {
                                if (!unitCompleted && !completing) await markUnitComplete();
                                setTimeout(() => {
                                    if (nextUnitInfo) router.push(`/dashboard/learning/courses/${courseId}/units/${nextUnitInfo.unitIdx}/pages/${nextUnitInfo.firstPageId}`);
                                    else router.push(`/dashboard/learning/courses/${courseId}`);
                                }, unitCompleted ? 0 : 1200);
                            }}
                            disabled={completing}
                            style={{ padding: "14px 28px", border: "none", cursor: completing ? "wait" : "pointer", borderRadius: 16, background: unitCompleted ? "linear-gradient(135deg, #a3e635, #65a30d)" : nextUnitInfo ? "linear-gradient(135deg, #3b82f6, #2563eb)" : "linear-gradient(135deg, #10b981, #059669)", color: "#fff", fontWeight: 800, fontSize: 13, boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}>
                            {completing ? "저장 중..." : unitCompleted ? "✓ 완료!" : nextUnitInfo ? `유닛 완료 → ${nextUnitInfo.unit.title}` : "✓ 유닛 완료 · 목록으로"}
                        </motion.button>
                    </div>
                )}
            </motion.div>

            {/* ═══ Minimal Bottom Progress Bar ═══ */}
            <div style={{
                position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
                background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)",
                borderTop: "1px solid rgba(226,232,240,0.4)",
                padding: "6px 24px",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
                <div style={{ flex: 1, maxWidth: 400, height: 4, borderRadius: 4, background: "#f1f5f9", overflow: "hidden" }}>
                    <div style={{ width: `${((currentPageIndex + 1) / pages.length) * 100}%`, height: "100%", background: "linear-gradient(90deg, #3b82f6, #2563eb)", borderRadius: 4, transition: "width 0.3s" }} />
                </div>
                <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, minWidth: 40, textAlign: "center" }}>
                    {currentPageIndex + 1}/{pages.length}
                </span>
            </div>

            {/* ═══ AI Tutor — Smart Context ═══ */}
            <AITutor
                context={`${courseData.title} > Unit ${unit.unitNumber}. ${unit.title} > ${currentPage.title}`}
            />
        </div>
    );
}
