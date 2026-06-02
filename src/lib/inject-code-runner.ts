/**
 * iframe 내부 교재 HTML에 "실행" 버튼과 스크롤 진행률 트래커를 주입한다.
 * same-origin 전제 (/learn/... 경로).
 */

export function injectCodeRunner(
    iframe: HTMLIFrameElement,
    language: string = 'c',
): void {
    const doc = iframe.contentDocument;
    if (!doc) return;

    // .code-wrap 내 .code-body 블록을 대상으로 함
    // 교재 구조: .code-wrap > .code-bar + .code-body
    const codeWraps = doc.querySelectorAll<HTMLElement>('.code-wrap');

    codeWraps.forEach((wrap) => {
        // 이미 주입됐으면 스킵
        if (wrap.querySelector('.cs-run-btn')) return;

        const codeBody = wrap.querySelector<HTMLElement>('.code-body');
        if (!codeBody) return;

        // code-bar가 있는지 확인 (없으면 비코드 블록일 수 있음)
        const codeBar = wrap.querySelector<HTMLElement>('.code-bar');

        // 코드 텍스트 추출 — .ln (줄번호) 제외, .lc (줄내용)만 수집
        const extractCode = (): string => {
            const lines = codeBody.querySelectorAll<HTMLElement>('.lc');
            if (lines.length > 0) {
                return Array.from(lines).map(lc => lc.textContent ?? '').join('\n');
            }
            // fallback: 전체 텍스트에서 줄번호 패턴 제거
            return codeBody.textContent?.replace(/^\d+\s*/gm, '') ?? '';
        };

        // "실행" 버튼 — code-bar 우측에 추가, code-bar 없으면 wrap 상단에 절대 위치
        const btn = doc.createElement('button');
        btn.className = 'cs-run-btn';
        btn.textContent = '▶ 실행';

        if (codeBar) {
            btn.style.cssText = `
                padding: 3px 12px; border-radius: 6px; border: none;
                background: #2563eb; color: #fff; font-size: 11px;
                font-weight: 700; cursor: pointer; opacity: 0.9;
                transition: opacity 0.2s, background 0.2s;
                font-family: 'Noto Sans KR', sans-serif;
                white-space: nowrap;
            `;
            codeBar.appendChild(btn);
        } else {
            wrap.style.position = 'relative';
            btn.style.cssText = `
                position: absolute; top: 8px; right: 8px;
                padding: 3px 12px; border-radius: 6px; border: none;
                background: #2563eb; color: #fff; font-size: 11px;
                font-weight: 700; cursor: pointer; z-index: 10;
                opacity: 0.85; transition: opacity 0.2s, background 0.2s;
                font-family: 'Noto Sans KR', sans-serif;
            `;
            wrap.appendChild(btn);
        }

        btn.addEventListener('mouseenter', () => { btn.style.opacity = '1'; btn.style.background = '#1d4ed8'; });
        btn.addEventListener('mouseleave', () => { btn.style.opacity = '0.9'; btn.style.background = '#2563eb'; });

        // 결과 영역
        const resultDiv = doc.createElement('div');
        resultDiv.className = 'cs-run-result';
        resultDiv.style.cssText = `
            display: none; margin-top: 0; padding: 10px 16px;
            background: #0f172a; color: #4ade80; border-radius: 0 0 10px 10px;
            font-family: 'JetBrains Mono', 'Consolas', monospace; font-size: 13px;
            white-space: pre-wrap; line-height: 1.6;
            border: 1px solid #1e293b; border-top: none;
        `;
        wrap.insertAdjacentElement('afterend', resultDiv);

        // 클릭 핸들러
        btn.addEventListener('click', async () => {
            const code = extractCode();
            if (!code.trim()) return;

            btn.textContent = '⏳ 실행 중...';
            btn.setAttribute('disabled', 'true');
            btn.style.opacity = '0.6';
            resultDiv.style.display = 'block';
            resultDiv.style.color = '#94a3b8';
            resultDiv.textContent = '컴파일 중...';

            try {
                const res = await fetch('/api/compile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code, language, stdin: '' }),
                });
                const data: {
                    success: boolean;
                    stdout?: string;
                    stderr?: string;
                    error?: string;
                } = await res.json();

                if (data.success) {
                    resultDiv.style.color = '#4ade80';
                    resultDiv.textContent = data.stdout || '(출력 없음)';
                } else {
                    resultDiv.style.color = '#f87171';
                    resultDiv.textContent = data.stderr || data.error || '컴파일 에러';
                }
            } catch {
                resultDiv.style.color = '#f87171';
                resultDiv.textContent = '서버 연결 실패';
            } finally {
                btn.textContent = '▶ 실행';
                btn.removeAttribute('disabled');
                btn.style.opacity = '0.9';
            }
        });
    });
}

/**
 * iframe 내부 스크롤을 감지해서 읽기 진행률(0~100)을 콜백으로 전달한다.
 * cleanup 함수를 반환하므로 useEffect return에서 호출할 것.
 */
export function injectScrollTracker(
    iframe: HTMLIFrameElement,
    onProgress: (percent: number) => void,
): () => void {
    const doc = iframe.contentDocument;
    if (!doc) return () => {};

    const handler = () => {
        const el = doc.documentElement;
        const scrollTop = el.scrollTop || doc.body.scrollTop;
        const scrollHeight = el.scrollHeight - el.clientHeight;
        const percent = scrollHeight > 0 ? Math.round((scrollTop / scrollHeight) * 100) : 0;
        onProgress(Math.min(percent, 100));
    };

    doc.addEventListener('scroll', handler, { passive: true });
    // 초기값
    handler();

    return () => doc.removeEventListener('scroll', handler);
}
