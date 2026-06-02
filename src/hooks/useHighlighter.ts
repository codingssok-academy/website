"use client";
import { useCallback, useEffect, useRef } from "react";

const COLORS = ["#fef08a", "#bbf7d0", "#bfdbfe", "#fecaca", "#e9d5ff"] as const;
type HighlightColor = typeof COLORS[number];

interface StoredHighlight {
    /** Simplified path from container to text node */
    path: number[];
    startOffset: number;
    endOffset: number;
    text: string;
    color: HighlightColor;
}

function getStorageKey(courseId: string, unitId: string, pageId: string) {
    return `cs_hl_${courseId}_${unitId}_${pageId}`;
}

/** Walk from container to a text node via child-index path */
function walkPath(root: Node, path: number[]): Node | null {
    let node: Node = root;
    for (const idx of path) {
        if (!node.childNodes[idx]) return null;
        node = node.childNodes[idx];
    }
    return node;
}

/** Build an index path from container to a descendant text node */
function buildPath(root: Node, target: Node): number[] | null {
    const path: number[] = [];
    let node: Node | null = target;
    while (node && node !== root) {
        const parent: Node | null = node.parentNode;
        if (!parent) return null;
        const idx = Array.from(parent.childNodes).indexOf(node as ChildNode);
        if (idx < 0) return null;
        path.unshift(idx);
        node = parent;
    }
    return node === root ? path : null;
}

export function useHighlighter(
    containerRef: React.RefObject<HTMLDivElement | null>,
    courseId: string,
    unitId: string,
    pageId: string,
) {
    const colorRef = useRef<HighlightColor>(COLORS[0]);
    const highlightsRef = useRef<StoredHighlight[]>([]);

    const storageKey = getStorageKey(courseId, unitId, pageId);

    // Load saved highlights on mount / page change
    useEffect(() => {
        if (!containerRef.current) return;
        // Clear existing marks
        containerRef.current.querySelectorAll("mark[data-hl]").forEach(el => {
            const parent = el.parentNode;
            if (!parent) return;
            while (el.firstChild) parent.insertBefore(el.firstChild, el);
            parent.removeChild(el);
        });

        try {
            const raw = localStorage.getItem(storageKey);
            if (!raw) { highlightsRef.current = []; return; }
            const saved: StoredHighlight[] = JSON.parse(raw);
            highlightsRef.current = saved;
            // Restore each highlight
            for (const hl of saved) {
                try {
                    const textNode = walkPath(containerRef.current, hl.path);
                    if (!textNode || textNode.nodeType !== Node.TEXT_NODE) continue;
                    const range = document.createRange();
                    range.setStart(textNode, Math.min(hl.startOffset, textNode.textContent?.length ?? 0));
                    range.setEnd(textNode, Math.min(hl.endOffset, textNode.textContent?.length ?? 0));
                    const mark = document.createElement("mark");
                    mark.setAttribute("data-hl", "1");
                    mark.style.backgroundColor = hl.color;
                    mark.style.borderRadius = "2px";
                    mark.style.padding = "0 1px";
                    mark.style.cursor = "pointer";
                    range.surroundContents(mark);
                } catch { /* skip broken highlights */ }
            }
        } catch { highlightsRef.current = []; }
    }, [storageKey, containerRef]);

    const addHighlight = useCallback(() => {
        const container = containerRef.current;
        if (!container) return;

        const sel = window.getSelection();
        if (!sel || sel.isCollapsed || sel.rangeCount === 0) return;

        const range = sel.getRangeAt(0);
        // Only highlight within our content container
        if (!container.contains(range.commonAncestorContainer)) return;

        const text = range.toString().trim();
        if (!text || text.length < 2) return;

        // Build path before wrapping (wrapping changes DOM)
        const startPath = buildPath(container, range.startContainer);
        if (!startPath) return;

        const hl: StoredHighlight = {
            path: startPath,
            startOffset: range.startOffset,
            endOffset: range.endOffset,
            text: text.slice(0, 200),
            color: colorRef.current,
        };

        // Wrap selection in mark
        try {
            const mark = document.createElement("mark");
            mark.setAttribute("data-hl", "1");
            mark.style.backgroundColor = colorRef.current;
            mark.style.borderRadius = "2px";
            mark.style.padding = "0 1px";
            mark.style.cursor = "pointer";
            range.surroundContents(mark);
        } catch {
            // surroundContents fails if range spans multiple elements
            // Fallback: use CSS highlight (execCommand deprecated but works)
            return;
        }

        highlightsRef.current.push(hl);
        localStorage.setItem(storageKey, JSON.stringify(highlightsRef.current));
        sel.removeAllRanges();
    }, [containerRef, storageKey]);

    const clearHighlights = useCallback(() => {
        const container = containerRef.current;
        if (!container) return;
        container.querySelectorAll("mark[data-hl]").forEach(el => {
            const parent = el.parentNode;
            if (!parent) return;
            while (el.firstChild) parent.insertBefore(el.firstChild, el);
            parent.removeChild(el);
        });
        highlightsRef.current = [];
        localStorage.removeItem(storageKey);
    }, [containerRef, storageKey]);

    const setColor = useCallback((color: HighlightColor) => {
        colorRef.current = color;
    }, []);

    return { addHighlight, clearHighlights, setColor, colors: COLORS, currentColor: colorRef };
}
