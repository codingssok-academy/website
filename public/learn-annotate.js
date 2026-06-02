/**
 * 학습 자료 주석 도구 — iframe 내부에 주입되어 동작
 * 기능:
 *  1. 텍스트 드래그 → 형광펜 (5색)
 *  2. 더블클릭 → 메모 추가
 *  3. localStorage 영구 저장 (key: annotate:{pageKey})
 *  4. 부모 창 postMessage 통신 (도구 ON/OFF, 색 변경)
 */
(function () {
    'use strict';
    if (window.__codingssokAnnotateLoaded) return;
    window.__codingssokAnnotateLoaded = true;

    const STORAGE_PREFIX = 'annotate:';
    const COLORS = ['#fef08a', '#bbf7d0', '#bfdbfe', '#fecaca', '#e9d5ff'];

    // 페이지 키: parent가 postMessage로 알려줌. 없으면 location.pathname 사용.
    let pageKey = location.pathname;
    let activeColor = COLORS[0];
    let toolMode = 'off'; // 'off' | 'highlight' | 'note'

    // ── 스타일 주입 ──
    const style = document.createElement('style');
    style.textContent = `
        .cs-hl { padding: 1px 2px; border-radius: 3px; cursor: pointer; transition: filter 0.15s; }
        .cs-hl:hover { filter: brightness(0.92); }
        .cs-answer-input {
            display: inline-block; min-width: 120px; padding: 4px 10px;
            border: 2px solid #3b82f6; border-radius: 6px;
            font-family: inherit; font-size: inherit; color: #1e40af;
            background: #eff6ff; outline: none; margin: 0 2px;
            transition: border-color 0.2s;
        }
        .cs-answer-input:focus { border-color: #2563eb; background: #fff; box-shadow: 0 0 0 3px rgba(59,130,246,0.15); }
        .cs-answer-input.saved { border-color: #10b981; background: #f0fdf4; }
        .cs-note-marker {
            display: inline-block; width: 18px; height: 18px; margin: 0 2px;
            background: #fbbf24; border-radius: 50%; cursor: pointer;
            box-shadow: 0 1px 4px rgba(0,0,0,0.2);
            font-size: 11px; font-weight: 700; color: #fff;
            text-align: center; line-height: 18px; vertical-align: middle;
        }
        .cs-note-popup {
            position: fixed; z-index: 99999; background: #fffbeb;
            border: 2px solid #fbbf24; border-radius: 12px;
            padding: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.18);
            min-width: 240px; max-width: 320px;
        }
        .cs-note-popup textarea {
            width: 100%; min-height: 80px; border: 1px solid #fde68a;
            border-radius: 6px; padding: 8px; font-family: inherit;
            font-size: 13px; resize: vertical; box-sizing: border-box;
        }
        .cs-note-popup .cs-note-actions { display: flex; gap: 6px; margin-top: 8px; justify-content: flex-end; }
        .cs-note-popup button {
            padding: 5px 12px; border: none; border-radius: 6px;
            font-size: 12px; font-weight: 700; cursor: pointer;
        }
        .cs-note-save { background: #fbbf24; color: #78350f; }
        .cs-note-del { background: #fecaca; color: #991b1b; }
        .cs-note-cancel { background: #e5e7eb; color: #374151; }
        body[data-annotate-mode="highlight"] { cursor: text; }
        body[data-annotate-mode="note"] { cursor: crosshair; }
    `;
    document.head.appendChild(style);

    // ── 저장/로드 ──
    function loadAnnotations() {
        try {
            const raw = localStorage.getItem(STORAGE_PREFIX + pageKey);
            return raw ? JSON.parse(raw) : { highlights: [], notes: [] };
        } catch { return { highlights: [], notes: [] }; }
    }
    function saveAnnotations(data) {
        try { localStorage.setItem(STORAGE_PREFIX + pageKey, JSON.stringify(data)); } catch {}
        // 부모에게 알림
        try { parent.postMessage({ type: 'annotate-saved', pageKey, count: data.highlights.length + data.notes.length }, '*'); } catch {}
    }

    // ── 형광펜: 선택된 텍스트 감싸기 ──
    function wrapSelection(color) {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return false;
        const range = sel.getRangeAt(0);
        try {
            const span = document.createElement('span');
            span.className = 'cs-hl';
            span.style.background = color;
            span.dataset.csHl = '1';
            range.surroundContents(span);
            sel.removeAllRanges();
            persistFromDOM();
            return true;
        } catch (e) {
            // 복잡한 selection (여러 노드 걸침)은 surroundContents 실패 → 무시
            return false;
        }
    }

    // ── DOM 상태에서 주석 직렬화 (XPath 기반) ──
    function getXPath(node) {
        if (node.nodeType !== 1) node = node.parentNode;
        const parts = [];
        while (node && node.nodeType === 1 && node !== document.body) {
            let idx = 1;
            let sib = node.previousSibling;
            while (sib) { if (sib.nodeName === node.nodeName) idx++; sib = sib.previousSibling; }
            parts.unshift(node.nodeName.toLowerCase() + '[' + idx + ']');
            node = node.parentNode;
        }
        return '/' + parts.join('/');
    }

    function persistFromDOM() {
        const data = loadAnnotations();
        data.highlights = Array.from(document.querySelectorAll('.cs-hl')).map(el => ({
            xpath: getXPath(el), color: el.style.background, text: el.textContent,
        }));
        data.notes = Array.from(document.querySelectorAll('.cs-note-marker')).map(el => ({
            xpath: getXPath(el), text: el.dataset.note || '',
        }));
        data.answers = Array.from(document.querySelectorAll('.cs-answer-input')).map(el => ({
            xpath: getXPath(el), value: el.value || '', placeholder: el.placeholder || '',
        }));
        saveAnnotations(data);
    }

    // ── 답안 입력 필드 생성 ──
    function createAnswerInput(initialValue = '', placeholder = '답을 입력하세요') {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'cs-answer-input';
        input.value = initialValue;
        input.placeholder = placeholder;
        input.addEventListener('input', () => {
            input.classList.remove('saved');
        });
        input.addEventListener('blur', () => {
            persistFromDOM();
            input.classList.add('saved');
            setTimeout(() => input.classList.remove('saved'), 1500);
        });
        // Enter 시 blur
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
        });
        return input;
    }

    // ── 메모 팝업 ──
    let activePopup = null;
    function closePopup() {
        if (activePopup) { activePopup.remove(); activePopup = null; }
    }
    function openNotePopup(marker, x, y) {
        closePopup();
        const popup = document.createElement('div');
        popup.className = 'cs-note-popup';
        popup.style.left = Math.min(x, window.innerWidth - 340) + 'px';
        popup.style.top = Math.min(y, window.innerHeight - 200) + 'px';
        const textarea = document.createElement('textarea');
        textarea.value = marker.dataset.note || '';
        textarea.placeholder = '메모를 입력하세요...';
        const actions = document.createElement('div');
        actions.className = 'cs-note-actions';
        const saveBtn = document.createElement('button');
        saveBtn.className = 'cs-note-save'; saveBtn.textContent = '저장';
        const delBtn = document.createElement('button');
        delBtn.className = 'cs-note-del'; delBtn.textContent = '삭제';
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'cs-note-cancel'; cancelBtn.textContent = '닫기';
        saveBtn.onclick = () => { marker.dataset.note = textarea.value; persistFromDOM(); closePopup(); };
        delBtn.onclick = () => { marker.remove(); persistFromDOM(); closePopup(); };
        cancelBtn.onclick = closePopup;
        actions.append(saveBtn, delBtn, cancelBtn);
        popup.append(textarea, actions);
        document.body.appendChild(popup);
        textarea.focus();
        activePopup = popup;
    }

    // ── 이벤트 ──
    document.addEventListener('mouseup', (e) => {
        if (toolMode !== 'highlight') return;
        if (e.target.closest('.cs-note-popup')) return;
        wrapSelection(activeColor);
    });

    document.addEventListener('click', (e) => {
        const hl = e.target.closest('.cs-hl');
        if (hl && toolMode === 'highlight') {
            // 토글: 형광펜 클릭 시 제거
            const parent = hl.parentNode;
            while (hl.firstChild) parent.insertBefore(hl.firstChild, hl);
            hl.remove();
            persistFromDOM();
            return;
        }
        const marker = e.target.closest('.cs-note-marker');
        if (marker) {
            e.preventDefault(); e.stopPropagation();
            openNotePopup(marker, e.clientX, e.clientY);
            return;
        }
        if (toolMode === 'note' && !e.target.closest('.cs-note-popup')) {
            const range = document.caretRangeFromPoint ? document.caretRangeFromPoint(e.clientX, e.clientY) : null;
            if (!range) return;
            const marker = document.createElement('span');
            marker.className = 'cs-note-marker';
            marker.dataset.note = '';
            marker.textContent = '✎';
            range.insertNode(marker);
            openNotePopup(marker, e.clientX, e.clientY);
            return;
        }
        // 답안 입력 모드: 클릭 위치에 input 필드 삽입
        if (toolMode === 'answer' && !e.target.closest('.cs-answer-input')) {
            // 이미 기존 input 클릭은 무시
            const range = document.caretRangeFromPoint ? document.caretRangeFromPoint(e.clientX, e.clientY) : null;
            if (!range) return;
            const input = createAnswerInput();
            range.insertNode(input);
            input.focus();
            persistFromDOM();
        }
    });

    // ── 부모와 통신 ──
    window.addEventListener('message', (e) => {
        const msg = e.data;
        if (!msg || typeof msg !== 'object') return;
        if (msg.type === 'annotate-set-key') {
            pageKey = msg.pageKey || pageKey;
            restoreAnnotations();
        } else if (msg.type === 'annotate-set-mode') {
            toolMode = msg.mode || 'off';
            document.body.dataset.annotateMode = toolMode;
            if (toolMode === 'off') closePopup();
        } else if (msg.type === 'annotate-set-color') {
            activeColor = msg.color || COLORS[0];
        } else if (msg.type === 'annotate-clear') {
            document.querySelectorAll('.cs-hl').forEach(el => {
                const p = el.parentNode;
                while (el.firstChild) p.insertBefore(el.firstChild, el);
                el.remove();
            });
            document.querySelectorAll('.cs-note-marker').forEach(el => el.remove());
            persistFromDOM();
        }
    });

    // ── 복원 ──
    function findByXPath(xpath) {
        try {
            const result = document.evaluate(xpath, document.body, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            return result.singleNodeValue;
        } catch { return null; }
    }
    function restoreAnnotations() {
        // 기존 마커/입력 필드 제거 (페이지 키 변경 시)
        document.querySelectorAll('.cs-hl, .cs-note-marker, .cs-answer-input').forEach(el => {
            if (el.classList.contains('cs-hl')) {
                const p = el.parentNode;
                while (el.firstChild) p.insertBefore(el.firstChild, el);
                el.remove();
            } else el.remove();
        });
        const data = loadAnnotations();
        data.answers = data.answers || [];
        // 답안 입력 복원 (XPath 기반 — DOM 변경에 약함, best-effort)
        data.answers.forEach(a => {
            const node = findByXPath(a.xpath);
            if (node && node.parentNode) {
                const input = createAnswerInput(a.value, a.placeholder);
                node.parentNode.insertBefore(input, node.nextSibling);
                node.remove();
            }
        });
        // 단순 복원: 텍스트 매칭으로 형광펜만 복원 (XPath는 DOM 변경 시 깨짐)
        data.highlights.forEach(h => {
            if (!h.text) return;
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
            let node;
            while ((node = walker.nextNode())) {
                const idx = node.textContent.indexOf(h.text);
                if (idx >= 0 && !node.parentElement.closest('.cs-hl')) {
                    const range = document.createRange();
                    range.setStart(node, idx);
                    range.setEnd(node, idx + h.text.length);
                    const span = document.createElement('span');
                    span.className = 'cs-hl'; span.style.background = h.color; span.dataset.csHl = '1';
                    try { range.surroundContents(span); } catch {}
                    break;
                }
            }
        });
    }

    // 부모에게 준비 완료 알림
    try { parent.postMessage({ type: 'annotate-ready' }, '*'); } catch {}
    restoreAnnotations();
})();
