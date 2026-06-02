"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { COSPRO_SUB_COURSES } from "@/data/courses";
import { COSPRO_PY2_CATEGORIES, type CosProUnit, type CosProCategory } from "@/data/cospro-python-units";
import { MI } from "../../components";
import StudyNotesEditor from "../../StudyNotesEditor";
import CodeEditor from "@/components/ui/CodeEditor";
import { useStudyNotes } from "@/hooks/useStudyNotes";
import { usePresenceHeartbeat } from "@/hooks/usePresenceHeartbeat";

/* ── Highlighter Colors (for future non-iframe content) ── */
const HL_COLORS = [
    { id: "yellow", bg: "rgba(253,224,71,0.45)", solid: "#fde047", label: "노랑" },
    { id: "green", bg: "rgba(74,222,128,0.35)", solid: "#4ade80", label: "녹색" },
    { id: "blue", bg: "rgba(96,165,250,0.30)", solid: "#60a5fa", label: "파랑" },
    { id: "purple", bg: "rgba(192,132,252,0.30)", solid: "#93c5fd", label: "보라" },
    { id: "red", bg: "rgba(252,165,165,0.40)", solid: "#fca5a5", label: "빨강" },
    { id: "orange", bg: "rgba(251,146,60,0.35)", solid: "#fb923c", label: "주황" },
];

export default function CosProSubCoursePage() {
    const params = useParams();
    const router = useRouter();
    const subId = params.subId as string;
    const { user } = useAuth();

    const sub = useMemo(() => COSPRO_SUB_COURSES.find(s => s.id === subId), [subId]);
    const hasContent = subId === "cospro-python-2";
    const categories: CosProCategory[] = hasContent ? COSPRO_PY2_CATEGORIES : [];
    const allUnits = useMemo(() => categories.flatMap(c => c.units), [categories]);

    usePresenceHeartbeat({ courseId: "5", courseTitle: sub?.title });

    // ── State ──
    const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(["theory"]));
    const [activeUnit, setActiveUnit] = useState<CosProUnit | null>(null);
    const [leftOpen, setLeftOpen] = useState(true);
    const [rightOpen, setRightOpen] = useState(true);
    const [rightTab, setRightTab] = useState<"notes" | "code" | "timer" | "qa" | "bookmarks">("notes");
    const [activeHL, setActiveHL] = useState<string | null>(null);

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
        try { const s = localStorage.getItem(`codingssok_qa_${user?.id || "anon"}_cospro_${subId}`); return s ? JSON.parse(s) : []; } catch { return []; }
    });
    const [qaInput, setQaInput] = useState("");
    const addQuestion = () => {
        if (!qaInput.trim()) return;
        const next = [{ q: qaInput.trim(), ts: Date.now() }, ...qaList];
        setQaList(next); setQaInput("");
        try { localStorage.setItem(`codingssok_qa_${user?.id || "anon"}_cospro_${subId}`, JSON.stringify(next)); } catch {}
    };

    // Bookmarks
    const [bookmarks, setBookmarks] = useState<{ unitId: string; unitTitle: string; ts: number }[]>(() => {
        if (typeof window === "undefined") return [];
        try { const s = localStorage.getItem(`codingssok_bm_${user?.id || "anon"}_cospro_${subId}`); return s ? JSON.parse(s) : []; } catch { return []; }
    });
    const addBookmark = () => {
        if (!activeUnit) return;
        if (bookmarks.some(b => b.unitId === activeUnit.id)) return;
        const next = [{ unitId: activeUnit.id, unitTitle: activeUnit.title, ts: Date.now() }, ...bookmarks];
        setBookmarks(next);
        try { localStorage.setItem(`codingssok_bm_${user?.id || "anon"}_cospro_${subId}`, JSON.stringify(next)); } catch {}
    };
    const removeBookmark = (ts: number) => {
        const next = bookmarks.filter(b => b.ts !== ts);
        setBookmarks(next);
        try { localStorage.setItem(`codingssok_bm_${user?.id || "anon"}_cospro_${subId}`, JSON.stringify(next)); } catch {}
    };
    const isBookmarked = activeUnit ? bookmarks.some(b => b.unitId === activeUnit.id) : false;

    // Notes
    const { saveNote, getNote } = useStudyNotes(user?.id);
    const noteKey = `${user?.id || "anon"}_cospro_${subId}_${activeUnit?.id || ""}`;
    const existingNote = getNote(noteKey);

    // Toggle category
    const toggleCat = (catId: string) => {
        setExpandedCats(prev => {
            const next = new Set(prev);
            if (next.has(catId)) next.delete(catId); else next.add(catId);
            return next;
        });
    };

    // Select unit
    const selectUnit = (unit: CosProUnit) => {
        setActiveUnit(unit);
        // Auto-expand the category containing this unit
        for (const cat of categories) {
            if (cat.units.some(u => u.id === unit.id) && !expandedCats.has(cat.id)) {
                setExpandedCats(prev => new Set([...prev, cat.id]));
            }
        }
    };

    if (!sub) {
        return (
            <div style={{ textAlign: "center", padding: 80, color: "#64748b" }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>코스를 찾을 수 없습니다</h2>
                <button onClick={() => router.push("/dashboard/learning/courses/5")} style={{
                    padding: "10px 24px", borderRadius: 12, border: "none", cursor: "pointer",
                    background: "linear-gradient(135deg, #ec4899, #8b5cf6)", color: "#fff", fontSize: 14, fontWeight: 700, marginTop: 16,
                }}>CosPro 선택으로 돌아가기</button>
            </div>
        );
    }

    // 콘텐츠 없는 서브 코스
    if (!hasContent) {
        return (
            <div style={{ minHeight: "100vh", background: "linear-gradient(145deg, #f8fafc, #f0f4ff)", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", padding: "32px 24px" }}>
                <div style={{ maxWidth: 800, margin: "0 auto" }}>
                    <a style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#94a3b8", cursor: "pointer", marginBottom: 24 }}
                        onClick={() => router.push("/dashboard/learning/courses/5")}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
                        CosPro 선택으로 돌아가기
                    </a>
                    <div style={{ maxWidth: 800, margin: "0 auto 40px", borderRadius: 20, padding: 40, background: sub.gradient, color: "#fff", textAlign: "center", position: "relative", overflow: "hidden" }}>
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,rgba(255,255,255,0.1),transparent 50%)", pointerEvents: "none" }} />
                        <h1 style={{ fontSize: 32, fontWeight: 900, margin: "0 0 8px", letterSpacing: -0.3 }}>{sub.title}</h1>
                        <p style={{ fontSize: 15, opacity: 0.8, margin: 0, lineHeight: 1.6 }}>{sub.description}</p>
                    </div>
                    <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center", background: "#fff", borderRadius: 16, padding: "48px 32px", border: "1px solid #e2e8f0" }}>
                        <MI icon="menu_book" style={{ fontSize: 48, color: "#cbd5e1" }} />
                        <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: "12px 0 8px" }}>학습 자료 준비 중</h3>
                        <p style={{ fontSize: 14, color: "#94a3b8", margin: 0, lineHeight: 1.6 }}>{sub.title} 학습 자료를 준비하고 있습니다.</p>
                    </div>
                </div>
            </div>
        );
    }

    const totalUnits = allUnits.length;

    return (
        <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", background: "#f8fafc" }}>
            <style>{`
                .hide-sb::-webkit-scrollbar{display:none} .hide-sb{-ms-overflow-style:none;scrollbar-width:none}
                .panel-drag{width:6px;cursor:col-resize;background:transparent;flex-shrink:0;position:relative;z-index:20;transition:background .15s}
                .panel-drag:hover,.panel-drag:active{background:rgba(59,130,246,0.15)}
                .panel-drag::after{content:'';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:2px;height:32px;border-radius:2px;background:#cbd5e1;transition:background .15s}
                .panel-drag:hover::after,.panel-drag:active::after{background:#3b82f6}
            `}</style>

            {/* ══════════════════════════════════════════════
                LEFT PANEL — 커리큘럼 트리
               ══════════════════════════════════════════════ */}
            <aside
                style={{ width: leftOpen ? leftW : 0, opacity: leftOpen ? 1 : 0, flexShrink: 0, overflow: "hidden", borderRight: leftOpen ? "1px solid #e2e8f0" : "none", background: "#fff", display: "flex", flexDirection: "column", transition: isDragging ? "none" : "width .25s ease, opacity .2s ease" }}>

                {/* Header */}
                <div style={{ padding: "20px 16px 12px", borderBottom: "1px solid #f1f5f9" }}>
                    <a onClick={() => router.push("/dashboard/learning/courses/5")} style={{ fontSize: 11, color: "#94a3b8", textDecoration: "none", fontWeight: 600, display: "flex", alignItems: "center", gap: 4, marginBottom: 12, cursor: "pointer" }}>
                        <MI icon="arrow_back" style={{ fontSize: 14 }} /> CosPro 선택
                    </a>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: sub.gradient, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <MI icon="workspace_premium" style={{ fontSize: 18, color: "#fff" }} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", margin: 0, lineHeight: 1.3 }}>{sub.title}</h2>
                            <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>{totalUnits}개 유닛</span>
                        </div>
                    </div>
                </div>

                {/* Category Tree */}
                <div className="hide-sb" style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
                    {categories.map((cat) => {
                        const isExp = expandedCats.has(cat.id);
                        return (
                            <div key={cat.id} style={{ marginBottom: 2 }}>
                                {/* Category header */}
                                <button onClick={() => toggleCat(cat.id)} style={{
                                    width: "100%", padding: "10px 16px", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                                    background: isExp ? "rgba(99,102,241,0.04)" : "transparent", textAlign: "left", transition: "background 0.15s",
                                }}>
                                    <span style={{ fontSize: 10, transition: "transform 0.2s", transform: isExp ? "rotate(90deg)" : "rotate(0)", color: "#94a3b8" }}>▶</span>
                                    <div style={{ width: 28, height: 28, borderRadius: 8, background: cat.gradient, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                        <MI icon={cat.icon} style={{ fontSize: 14, color: "#fff" }} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cat.title}</div>
                                        <div style={{ fontSize: 9, fontWeight: 600, color: "#94a3b8" }}>{cat.units.length}개 유닛</div>
                                    </div>
                                </button>

                                {/* Units */}
                                <AnimatePresence initial={false}>
                                    {isExp && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
                                            {cat.units.map((unit, i) => {
                                                const isSelected = activeUnit?.id === unit.id;
                                                return (
                                                    <button key={unit.id} onClick={() => selectUnit(unit)}
                                                        style={{
                                                            width: "100%", padding: "8px 16px 8px 40px", border: "none", cursor: "pointer",
                                                            display: "flex", alignItems: "center", gap: 8, textAlign: "left", transition: "all 0.15s",
                                                            background: isSelected ? "linear-gradient(90deg, rgba(99,102,241,0.08), transparent)" : "transparent",
                                                            borderLeft: isSelected ? "3px solid #3b82f6" : "3px solid transparent",
                                                        }}>
                                                        <div style={{
                                                            width: 22, height: 22, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                                                            background: isSelected ? "#3b82f6" : "#f1f5f9",
                                                            color: isSelected ? "#fff" : "#64748b", fontSize: 9, fontWeight: 800,
                                                        }}>{i + 1}</div>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{ fontSize: 11, fontWeight: isSelected ? 700 : 600, color: isSelected ? "#0f172a" : "#334155", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{unit.title}</div>
                                                            {unit.description && <div style={{ fontSize: 9, color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{unit.description}</div>}
                                                        </div>
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
                <button onClick={() => setLeftOpen(true)} style={{ width: 24, height: 48, position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", zIndex: 50, borderRadius: "0 8px 8px 0", border: "1px solid #e2e8f0", borderLeft: "none", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "2px 0 8px rgba(0,0,0,0.04)" }}>
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>▸</span>
                </button>
            )}

            {/* ══════════════════════════════════════════════
                CENTER PANEL — 학습 콘텐츠
               ══════════════════════════════════════════════ */}
            <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>

                {activeUnit ? (
                    <>
                        {/* Highlighter Toolbar */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, borderBottom: "1px solid #e2e8f0", background: "#fff", padding: "10px 24px", flexShrink: 0 }}>
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

                            <div style={{ flex: 1 }} />

                            {/* Unit info */}
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#475569", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{activeUnit.title}</span>

                            {/* Bookmark button */}
                            <button onClick={addBookmark} title={isBookmarked ? "북마크됨" : "북마크"} style={{
                                width: 28, height: 28, borderRadius: 8, border: "1px solid #e2e8f0", background: isBookmarked ? "#eff6ff" : "#fff",
                                cursor: isBookmarked ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                                <MI icon={isBookmarked ? "bookmark" : "bookmark_border"} style={{ fontSize: 16, color: isBookmarked ? "#3b82f6" : "#94a3b8" }} />
                            </button>
                        </div>

                        {/* iframe content */}
                        <iframe
                            src={`/learn/cospro-python/${activeUnit.htmlFile}`}
                            style={{ flex: 1, border: "none", width: "100%", background: "#fff" }}
                            title={activeUnit.title}
                        />
                    </>
                ) : (
                    /* Empty state — no unit selected */
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, color: "#94a3b8" }}>
                        <svg width="160" height="140" viewBox="0 0 160 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="20" y="100" width="120" height="8" rx="4" fill="#e2e8f0" />
                            <rect x="35" y="108" width="8" height="20" rx="2" fill="#cbd5e1" />
                            <rect x="117" y="108" width="8" height="20" rx="2" fill="#cbd5e1" />
                            <rect x="38" y="82" width="50" height="10" rx="2" fill="#c7d2fe" />
                            <rect x="40" y="72" width="46" height="10" rx="2" fill="#a5b4fc" />
                            <rect x="42" y="62" width="42" height="10" rx="2" fill="#60a5fa" />
                            <g transform="translate(70, 50)">
                                <path d="M0 10 C0 4, 8 0, 30 0 L30 40 C8 40, 0 36, 0 30Z" fill="#dbeafe" stroke="#93c5fd" strokeWidth="1.5" />
                                <path d="M60 10 C60 4, 52 0, 30 0 L30 40 C52 40, 60 36, 60 30Z" fill="#dbeafe" stroke="#c4b5fd" strokeWidth="1.5" />
                                <line x1="30" y1="2" x2="30" y2="38" stroke="#cbd5e1" strokeWidth="1" />
                                <line x1="6" y1="10" x2="24" y2="10" stroke="#93c5fd" strokeWidth="1.5" strokeLinecap="round" />
                                <line x1="6" y1="16" x2="20" y2="16" stroke="#bfdbfe" strokeWidth="1.5" strokeLinecap="round" />
                                <line x1="6" y1="22" x2="22" y2="22" stroke="#bfdbfe" strokeWidth="1.5" strokeLinecap="round" />
                                <line x1="36" y1="10" x2="54" y2="10" stroke="#c4b5fd" strokeWidth="1.5" strokeLinecap="round" />
                                <line x1="36" y1="16" x2="50" y2="16" stroke="#ddd6fe" strokeWidth="1.5" strokeLinecap="round" />
                                <line x1="36" y1="22" x2="52" y2="22" stroke="#ddd6fe" strokeWidth="1.5" strokeLinecap="round" />
                            </g>
                            <g transform="translate(108, 68)">
                                <path d="M0 0 L0 20 L6 15 L12 24 L16 22 L10 13 L17 11Z" fill="#3b82f6" stroke="#2563eb" strokeWidth="1" strokeLinejoin="round" />
                            </g>
                            <circle cx="55" cy="42" r="2" fill="#fbbf24" opacity="0.8">
                                <animate attributeName="opacity" values="0.8;0.2;0.8" dur="2s" repeatCount="indefinite" />
                            </circle>
                            <circle cx="140" cy="55" r="1.5" fill="#60a5fa" opacity="0.6">
                                <animate attributeName="opacity" values="0.6;0.1;0.6" dur="1.8s" repeatCount="indefinite" />
                            </circle>
                        </svg>
                        <div style={{ textAlign: "center" }}>
                            <h3 style={{ fontSize: 17, fontWeight: 800, color: "#475569", margin: "0 0 6px" }}>학습할 유닛을 선택하세요</h3>
                            <p style={{ fontSize: 13, color: "#94a3b8", margin: 0, lineHeight: 1.6 }}>← 커리큘럼에서 원하는 유닛을 클릭하면<br />학습이 시작됩니다</p>
                        </div>
                    </div>
                )}
            </main>

            {/* Right drag handle + toggle */}
            {rightOpen && <div className="panel-drag" onMouseDown={(e) => startDrag("right", e)} onDoubleClick={() => setRightOpen(false)} title="드래그: 크기 조절 / 더블클릭: 접기" />}
            {!rightOpen && (
                <button onClick={() => setRightOpen(true)} style={{ width: 24, height: 48, position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", zIndex: 50, borderRadius: "8px 0 0 8px", border: "1px solid #e2e8f0", borderRight: "none", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "-2px 0 8px rgba(0,0,0,0.04)" }}>
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>◂</span>
                </button>
            )}

            {/* ══════════════════════════════════════════════
                RIGHT PANEL — 도구 패널
               ══════════════════════════════════════════════ */}
            <aside
                style={{ width: rightOpen ? rightW : 0, opacity: rightOpen ? 1 : 0, flexShrink: 0, overflow: "hidden", borderLeft: rightOpen ? "1px solid #e2e8f0" : "none", background: "#fff", display: "flex", flexDirection: "column", transition: isDragging ? "none" : "width .25s ease, opacity .2s ease" }}>

                {/* Tab Bar */}
                <div style={{ display: "flex", borderBottom: "1px solid #f1f5f9", background: "#fafafa" }}>
                    {(["notes", "code", "timer", "qa", "bookmarks"] as const).map(tab => {
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
                </div>

                {/* Tab Content */}
                <div className="hide-sb" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>

                    {/* ━━ NOTES TAB ━━ */}
                    {rightTab === "notes" && (
                        activeUnit ? (
                            <StudyNotesEditor
                                key={noteKey}
                                initialContent={existingNote?.content || ""}
                                initialColor={existingNote?.color || "yellow"}
                                unitTitle={activeUnit.title}
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
                            language="python"
                            saveContext={`cospro:${params.subId || "main"}`}
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
                            {activeUnit && (
                                <div style={{ padding: 16, borderBottom: "1px solid #f1f5f9" }}>
                                    <button onClick={addBookmark} disabled={isBookmarked} style={{
                                        width: "100%", padding: "10px", borderRadius: 12, border: isBookmarked ? "1px solid #c7d2fe" : "1px solid #e2e8f0",
                                        background: isBookmarked ? "#EFF6FF" : "#fff", cursor: isBookmarked ? "default" : "pointer",
                                        fontSize: 12, fontWeight: 700, color: isBookmarked ? "#3b82f6" : "#475569", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                                    }}>
                                        <MI icon={isBookmarked ? "bookmark" : "bookmark_border"} style={{ fontSize: 16 }} />
                                        {isBookmarked ? "북마크됨" : "현재 유닛 북마크"}
                                    </button>
                                </div>
                            )}
                            <div className="hide-sb" style={{ flex: 1, overflowY: "auto", padding: "8px 16px" }}>
                                {bookmarks.length === 0 ? (
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#cbd5e1", gap: 8, padding: 20 }}>
                                        <MI icon="bookmark_border" style={{ fontSize: 32 }} />
                                        <p style={{ fontSize: 12, margin: 0, textAlign: "center" }}>중요한 유닛을<br />북마크해보세요</p>
                                    </div>
                                ) : bookmarks.map(bm => (
                                    <div key={bm.ts} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "1px solid #f8fafc" }}>
                                        <button onClick={() => {
                                            const u = allUnits.find(u => u.id === bm.unitId);
                                            if (u) selectUnit(u);
                                        }} style={{ flex: 1, textAlign: "left", border: "none", background: "transparent", cursor: "pointer", padding: 0 }}>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: "#334155" }}>{bm.unitTitle}</div>
                                            <div style={{ fontSize: 9, color: "#94a3b8" }}>{new Date(bm.ts).toLocaleDateString("ko")}</div>
                                        </button>
                                        <button onClick={() => removeBookmark(bm.ts)} style={{ border: "none", background: "transparent", cursor: "pointer", color: "#cbd5e1", fontSize: 14 }}>✕</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </aside>
        </div>
    );
}
