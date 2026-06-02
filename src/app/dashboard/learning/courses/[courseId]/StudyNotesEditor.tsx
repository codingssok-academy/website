"use client";
import { useState, useRef, useCallback, useEffect } from "react";

/* ── 배경 컬러 팔레트 ── */
const BG_COLORS = [
    { id: "white", bg: "#ffffff", border: "#e2e8f0", label: "화이트" },
    { id: "yellow", bg: "#fef9c3", border: "#fde047", label: "노랑" },
    { id: "green", bg: "#dcfce7", border: "#86efac", label: "녹색" },
    { id: "blue", bg: "#dbeafe", border: "#93c5fd", label: "파랑" },
    { id: "purple", bg: "#dbeafe", border: "#93c5fd", label: "보라" },
    { id: "red", bg: "#fee2e2", border: "#fca5a5", label: "빨강" },
    { id: "orange", bg: "#ffedd5", border: "#fdba74", label: "주황" },
];

/* ── 텍스트 하이라이트 컬러 ── */
const HL_PALETTE = [
    "#fde047", "#86efac", "#93c5fd", "#93c5fd", "#fca5a5", "#fdba74",
];

/* ── 포맷팅 툴바 버튼 정의 ── */
interface ToolBtn {
    icon: string;
    cmd: string;
    arg?: string;
    title: string;
    type?: "cmd" | "custom";
}

const DIVIDER = "---";

const TOOLBAR: (ToolBtn | typeof DIVIDER)[] = [
    { icon: "format_bold", cmd: "bold", title: "굵게 (Ctrl+B)" },
    { icon: "format_italic", cmd: "italic", title: "기울임 (Ctrl+I)" },
    { icon: "format_underlined", cmd: "underline", title: "밑줄 (Ctrl+U)" },
    { icon: "format_strikethrough", cmd: "strikeThrough", title: "취소선" },
    DIVIDER,
    { icon: "format_list_bulleted", cmd: "insertUnorderedList", title: "글머리 목록" },
    { icon: "format_list_numbered", cmd: "insertOrderedList", title: "번호 목록" },
    { icon: "checklist", cmd: "insertChecklist", title: "체크리스트", type: "custom" },
    DIVIDER,
    { icon: "format_quote", cmd: "formatBlock", arg: "blockquote", title: "인용" },
    { icon: "code", cmd: "insertCode", title: "인라인 코드", type: "custom" },
    { icon: "horizontal_rule", cmd: "insertHorizontalRule", title: "구분선" },
];

/* ── 헤딩 옵션 ── */
const HEADING_OPTIONS = [
    { label: "본문", value: "P" },
    { label: "제목 1", value: "H1" },
    { label: "제목 2", value: "H2" },
    { label: "제목 3", value: "H3" },
];

interface StudyNotesEditorProps {
    initialContent: string;
    initialColor: string;
    unitTitle: string;
    onSave: (content: string, color: string) => void;
}

export default function StudyNotesEditor({ initialContent, initialColor, unitTitle, onSave }: StudyNotesEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const [bgColor, setBgColor] = useState(initialColor || "white");
    const [charCount, setCharCount] = useState(0);
    const [showHeadingMenu, setShowHeadingMenu] = useState(false);
    const [showHighlightMenu, setShowHighlightMenu] = useState(false);
    const [isSaved, setIsSaved] = useState(true);
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const headingBtnRef = useRef<HTMLButtonElement>(null);
    const highlightBtnRef = useRef<HTMLButtonElement>(null);
    const initializedRef = useRef(false);
    const onSaveRef = useRef(onSave);
    onSaveRef.current = onSave;

    /* ── 초기 콘텐츠 설정 (마운트 시 1회만) ── */
    useEffect(() => {
        if (editorRef.current && !initializedRef.current) {
            initializedRef.current = true;
            if (initialContent) {
                editorRef.current.innerHTML = initialContent;
                setCharCount(editorRef.current.innerText.length);
            }
        }
    }, [initialContent]);

    /* ── 자동 저장 (디바운스) — onSave를 ref로 사용하여 불필요한 재렌더 방지 ── */
    const bgColorRef = useRef(bgColor);
    bgColorRef.current = bgColor;
    const triggerSave = useCallback(() => {
        if (!editorRef.current) return;
        setIsSaved(false);
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
            if (editorRef.current) {
                onSaveRef.current(editorRef.current.innerHTML, bgColorRef.current);
                setIsSaved(true);
            }
        }, 500);
    }, []);

    /* ── 배경색 변경 ── */
    const changeBg = useCallback((colorId: string) => {
        setBgColor(colorId);
        if (editorRef.current) {
            onSaveRef.current(editorRef.current.innerHTML, colorId);
        }
    }, []);

    /* ── execCommand 래퍼 — 커서 위치 보존 ── */
    const savedSelectionRef = useRef<{ range: Range } | null>(null);
    const saveSelection = useCallback(() => {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
            savedSelectionRef.current = { range: sel.getRangeAt(0).cloneRange() };
        }
    }, []);
    const restoreSelection = useCallback(() => {
        if (savedSelectionRef.current) {
            const sel = window.getSelection();
            if (sel) { sel.removeAllRanges(); sel.addRange(savedSelectionRef.current.range); }
        }
    }, []);

    const exec = useCallback((cmd: string, arg?: string) => {
        restoreSelection();
        editorRef.current?.focus();
        document.execCommand(cmd, false, arg);
        triggerSave();
    }, [triggerSave, restoreSelection]);

    /* ── 커스텀 명령: 체크리스트 ── */
    const insertChecklist = useCallback(() => {
        editorRef.current?.focus();
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;
        const range = sel.getRangeAt(0);
        const checkbox = document.createElement("label");
        checkbox.contentEditable = "false";
        checkbox.style.cssText = "display:inline-flex;align-items:center;gap:6px;cursor:pointer;user-select:none;margin-right:4px;";
        const input = document.createElement("input");
        input.type = "checkbox";
        input.style.cssText = "width:16px;height:16px;accent-color:#3b82f6;cursor:pointer;";
        input.addEventListener("change", () => {
            const span = checkbox.nextSibling;
            if (span && span instanceof HTMLElement) {
                span.style.textDecoration = input.checked ? "line-through" : "none";
                span.style.color = input.checked ? "#94a3b8" : "inherit";
            }
        });
        checkbox.appendChild(input);
        range.insertNode(checkbox);
        // Place cursor after
        range.setStartAfter(checkbox);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        triggerSave();
    }, [triggerSave]);

    /* ── 커스텀 명령: 인라인 코드 ── */
    const insertInlineCode = useCallback(() => {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;
        const text = sel.toString();
        if (text) {
            exec("insertHTML", `<code style="background:#f1f5f9;padding:1px 6px;border-radius:4px;font-family:'JetBrains Mono',monospace;font-size:12px;color:#e11d48;border:1px solid #e2e8f0;">${text}</code>&nbsp;`);
        }
    }, [exec]);

    /* ── 텍스트 하이라이트 ── */
    const applyHighlight = useCallback((color: string) => {
        exec("hiliteColor", color);
        setShowHighlightMenu(false);
    }, [exec]);

    /* ── 키보드 단축키 ── */
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case "b": e.preventDefault(); exec("bold"); break;
                case "i": e.preventDefault(); exec("italic"); break;
                case "u": e.preventDefault(); exec("underline"); break;
                case "d": e.preventDefault(); exec("strikeThrough"); break;
                case "e": e.preventDefault(); insertInlineCode(); break;
            }
        }
        // Tab for indent
        if (e.key === "Tab") {
            e.preventDefault();
            if (e.shiftKey) exec("outdent");
            else exec("indent");
        }
    }, [exec, insertInlineCode]);

    /* ── input 이벤트 ── */
    const handleInput = useCallback(() => {
        if (editorRef.current) {
            setCharCount(editorRef.current.innerText.length);
            triggerSave();
        }
    }, [triggerSave]);

    /* ── 툴바 클릭 핸들러 ── */
    const handleToolClick = useCallback((tool: ToolBtn) => {
        if (tool.type === "custom") {
            if (tool.cmd === "insertChecklist") insertChecklist();
            else if (tool.cmd === "insertCode") insertInlineCode();
        } else {
            exec(tool.cmd, tool.arg);
        }
    }, [exec, insertChecklist, insertInlineCode]);

    /* ── 헤딩 변경 ── */
    const applyHeading = useCallback((tag: string) => {
        exec("formatBlock", tag);
        setShowHeadingMenu(false);
    }, [exec]);

    /* ── 클린업 ── */
    useEffect(() => () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); }, []);

    const bgInfo = BG_COLORS.find(c => c.id === bgColor) || BG_COLORS[0];

    return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 0 }}>
            {/* ── 배경색 선택 바 ── */}
            <div style={{ padding: "8px 12px 4px", display: "flex", alignItems: "center", gap: 4 }}>
                {BG_COLORS.map(c => (
                    <button key={c.id} onClick={() => changeBg(c.id)} title={c.label}
                        style={{
                            width: 20, height: 20, borderRadius: 8, cursor: "pointer",
                            border: bgColor === c.id ? `2.5px solid ${c.id === "white" ? "#3b82f6" : c.border}` : c.id === "white" ? "1.5px solid #d1d5db" : "1px solid #e2e8f0",
                            background: c.bg, transition: "all 0.15s",
                            boxShadow: bgColor === c.id ? `0 0 0 2px ${c.id === "white" ? "rgba(99,102,241,0.15)" : "rgba(0,0,0,0.05)"}` : "none",
                        }} />
                ))}
                <span style={{ fontSize: 9, color: "#94a3b8", marginLeft: "auto", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{unitTitle}</span>
            </div>

            {/* ── 포맷팅 툴바 ── */}
            <div style={{
                padding: "4px 12px", display: "flex", alignItems: "center", gap: 1,
                borderBottom: `1px solid ${bgInfo.border}`, flexWrap: "wrap",
            }}>
                {/* 헤딩 드롭다운 */}
                <div style={{ position: "relative" }}>
                    <button ref={headingBtnRef} onClick={() => { setShowHeadingMenu(!showHeadingMenu); setShowHighlightMenu(false); }}
                        style={{
                            display: "flex", alignItems: "center", gap: 2, padding: "3px 8px",
                            borderRadius: 6, border: "1px solid #e2e8f0", background: "#f8fafc",
                            cursor: "pointer", fontSize: 11, fontWeight: 600, color: "#475569",
                        }}>
                        <span>가</span>
                        <span className="material-symbols-outlined" style={{ fontSize: 12 }}>expand_more</span>
                    </button>
                    {showHeadingMenu && (
                        <div style={{
                            position: "absolute", top: "100%", left: 0, marginTop: 4, zIndex: 100,
                            background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10,
                            boxShadow: "0 8px 24px rgba(0,0,0,0.12)", padding: 4, minWidth: 120,
                        }}>
                            {HEADING_OPTIONS.map(h => (
                                <button key={h.value} onClick={() => applyHeading(h.value)}
                                    style={{
                                        display: "block", width: "100%", padding: "6px 12px", textAlign: "left",
                                        border: "none", background: "transparent", cursor: "pointer",
                                        borderRadius: 6, fontSize: h.value === "P" ? 12 : h.value === "H1" ? 16 : h.value === "H2" ? 14 : 13,
                                        fontWeight: h.value === "P" ? 400 : 700, color: "#334155",
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.background = "#f1f5f9")}
                                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                                    {h.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ width: 1, height: 16, background: "#e2e8f0", margin: "0 4px" }} />

                {/* 메인 툴바 버튼들 */}
                {TOOLBAR.map((item, i) => {
                    if (item === DIVIDER) return <div key={`d-${i}`} style={{ width: 1, height: 16, background: "#e2e8f0", margin: "0 3px" }} />;
                    const tool = item as ToolBtn;
                    return (
                        <button key={tool.cmd} onClick={() => handleToolClick(tool)} title={tool.title}
                            style={{
                                width: 26, height: 26, borderRadius: 6, border: "none",
                                background: "transparent", cursor: "pointer", display: "flex",
                                alignItems: "center", justifyContent: "center", transition: "all 0.15s",
                                color: "#64748b",
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#1e293b"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#64748b"; }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{tool.icon}</span>
                        </button>
                    );
                })}

                <div style={{ width: 1, height: 16, background: "#e2e8f0", margin: "0 3px" }} />

                {/* 하이라이트 */}
                <div style={{ position: "relative" }}>
                    <button ref={highlightBtnRef} onClick={() => { setShowHighlightMenu(!showHighlightMenu); setShowHeadingMenu(false); }} title="텍스트 하이라이트"
                        style={{
                            width: 26, height: 26, borderRadius: 6, border: "none",
                            background: "transparent", cursor: "pointer", display: "flex",
                            alignItems: "center", justifyContent: "center", color: "#64748b",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = "#f1f5f9"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>ink_highlighter</span>
                    </button>
                    {showHighlightMenu && (
                        <div style={{
                            position: "absolute", top: "100%", right: 0, marginTop: 4, zIndex: 100,
                            background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10,
                            boxShadow: "0 8px 24px rgba(0,0,0,0.12)", padding: 8,
                            display: "flex", gap: 4,
                        }}>
                            {HL_PALETTE.map(color => (
                                <button key={color} onClick={() => applyHighlight(color)}
                                    style={{
                                        width: 22, height: 22, borderRadius: 6, border: "1px solid rgba(0,0,0,0.1)",
                                        background: color, cursor: "pointer",
                                    }} />
                            ))}
                            <button onClick={() => { exec("removeFormat"); setShowHighlightMenu(false); }} title="하이라이트 제거"
                                style={{
                                    width: 22, height: 22, borderRadius: 6, border: "1px solid #e2e8f0",
                                    background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 12, color: "#94a3b8" }}>close</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* 전체 삭제 */}
                <button onClick={() => {
                    if (editorRef.current && window.confirm("노트 내용을 모두 지우시겠습니까?")) {
                        editorRef.current.innerHTML = "";
                        triggerSave();
                        setCharCount(0);
                    }
                }} title="전체 삭제"
                    style={{
                        width: 26, height: 26, borderRadius: 6, border: "none",
                        background: "transparent", cursor: "pointer", display: "flex",
                        alignItems: "center", justifyContent: "center", color: "#94a3b8", marginLeft: "auto",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#fef2f2"; e.currentTarget.style.color = "#ef4444"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94a3b8"; }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>delete_sweep</span>
                </button>
            </div>

            {/* ── 에디터 영역 ── */}
            <div style={{ flex: 1, padding: "0 12px 12px", display: "flex", flexDirection: "column", minHeight: 0 }}>
                <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={handleInput}
                    onKeyDown={handleKeyDown}
                    onBlur={saveSelection}
                    onClick={() => { setShowHeadingMenu(false); setShowHighlightMenu(false); }}
                    data-placeholder="학습하면서 메모를 남겨보세요..."
                    style={{
                        flex: 1, minHeight: 380, padding: 16, borderRadius: 14,
                        border: `1.5px solid ${bgInfo.border}`, background: bgInfo.bg,
                        fontSize: 13, lineHeight: 1.9, color: "#334155",
                        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                        outline: "none", transition: "border-color 0.2s, background 0.2s",
                        boxSizing: "border-box", overflowY: "auto", wordBreak: "break-word",
                    }}
                />
                <style>{`
                    [data-placeholder]:empty::before {
                        content: attr(data-placeholder);
                        color: #94a3b8;
                        pointer-events: none;
                    }
                    [contenteditable] h1 { font-size: 20px; font-weight: 800; margin: 8px 0 4px; color: #0f172a; }
                    [contenteditable] h2 { font-size: 17px; font-weight: 700; margin: 6px 0 3px; color: #1e293b; border: none; background: none; padding: 0; }
                    [contenteditable] h3 { font-size: 15px; font-weight: 600; margin: 4px 0 2px; color: #334155; border: none; }
                    [contenteditable] blockquote {
                        border-left: 3px solid #3b82f6; margin: 6px 0; padding: 4px 12px;
                        background: rgba(99,102,241,0.04); color: #475569; font-style: italic;
                    }
                    [contenteditable] ul, [contenteditable] ol { padding-left: 20px; margin: 4px 0; }
                    [contenteditable] li { margin-bottom: 2px; }
                    [contenteditable] hr {
                        border: none; height: 1px; background: #e2e8f0; margin: 10px 0;
                    }
                    [contenteditable] code {
                        background: #f1f5f9; padding: 1px 6px; border-radius: 4px;
                        font-family: 'JetBrains Mono', monospace; font-size: 12px;
                        color: #e11d48; border: 1px solid #e2e8f0;
                    }
                `}</style>
            </div>

            {/* ── 상태바 ── */}
            <div style={{
                padding: "6px 16px", borderTop: "1px solid #f1f5f9",
                fontSize: 10, color: "#94a3b8", display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {isSaved ? (
                        <><span className="material-symbols-outlined" style={{ fontSize: 11, color: "#10b981" }}>cloud_done</span> 저장됨</>
                    ) : (
                        <><span className="material-symbols-outlined" style={{ fontSize: 11, color: "#f59e0b" }}>sync</span> 저장 중...</>
                    )}
                </span>
                <span>{charCount}자</span>
            </div>
        </div>
    );
}
