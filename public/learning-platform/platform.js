/* ═══════════════════════════════════════════
   🎯 Platform.js — 학습 플랫폼 코어 엔진
   자기 채점 · localStorage · 진행률 추적
   ═══════════════════════════════════════════ */
(function () {
    'use strict';

    // ─── 1. 페이지 식별 ───
    const PAGE_KEY = (() => {
        const path = location.pathname;
        // 파일명에서 키 추출: "논리_쉬움.html" → "논리_쉬움"
        const file = path.split('/').pop().replace('.html', '');
        // 상위 폴더에서 커리큘럼 구분
        const isKoding = path.includes('코딩') || path.includes('논리') || path.includes('수학') ||
            path.includes('순서도') || path.includes('문제해결') || path.includes('이산수학');
        const isCL = path.includes('C언어') || path.includes('C%EC%96%B8%EC%96%B4');
        const prefix = isCL ? 'cl' : (isKoding ? 'kf' : 'ct');
        return `${prefix}_${file}`;
    })();

    // ─── 2. localStorage 헬퍼 ───
    const Storage = {
        getAll() {
            try {
                return JSON.parse(localStorage.getItem('ct_platform') || '{}');
            } catch { return {}; }
        },
        save(data) {
            localStorage.setItem('ct_platform', JSON.stringify(data));
        },
        getPage(pageKey) {
            const all = this.getAll();
            return all[pageKey] || {};
        },
        setProblem(pageKey, probNum, result) {
            const all = this.getAll();
            if (!all[pageKey]) all[pageKey] = {};
            all[pageKey][probNum] = result;
            this.save(all);
            // Hook: notify iframe parent of progress change
            if (typeof _onProgressChange === 'function') _onProgressChange();
        },
        getAnswer(pageKey, probNum) {
            try {
                const answers = JSON.parse(localStorage.getItem('ct_answers') || '{}');
                return (answers[pageKey] && answers[pageKey][probNum]) || '';
            } catch { return ''; }
        },
        saveAnswer(pageKey, probNum, text) {
            try {
                const answers = JSON.parse(localStorage.getItem('ct_answers') || '{}');
                if (!answers[pageKey]) answers[pageKey] = {};
                answers[pageKey][probNum] = text;
                localStorage.setItem('ct_answers', JSON.stringify(answers));
            } catch { }
        }
    };

    // ─── 3. CSS 주입 ───
    const style = document.createElement('style');
    style.textContent = `
    /* ─── Progress Bar ─── */
    .pf-progress-wrap {
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 14px;
        padding: 16px 20px;
        margin-bottom: 24px;
        box-shadow: 0 1px 3px rgba(0,0,0,.04);
        display: flex;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
    }
    .pf-progress-label {
        font-size: .82rem;
        font-weight: 700;
        color: #1e293b;
        white-space: nowrap;
    }
    .pf-progress-bar {
        flex: 1;
        min-width: 120px;
        height: 8px;
        background: #f1f5f9;
        border-radius: 99px;
        overflow: hidden;
        position: relative;
    }
    .pf-progress-fill {
        height: 100%;
        border-radius: 99px;
        background: linear-gradient(90deg, #6366f1, #a78bfa);
        transition: width .5s cubic-bezier(.4,0,.2,1);
        min-width: 0;
    }
    .pf-progress-stats {
        display: flex;
        gap: 12px;
        font-size: .78rem;
        color: #64748b;
    }
    .pf-progress-stats strong {
        color: #1e293b;
        font-weight: 800;
    }
    .pf-stat-correct { color: #10b981; }
    .pf-stat-wrong { color: #ef4444; }

    /* ─── Self-Grade Buttons ─── */
    .pf-grade-wrap {
        display: flex;
        gap: 8px;
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px dashed #e5e7eb;
    }
    .pf-grade-btn {
        flex: 1;
        padding: 10px 16px;
        border: 1.5px solid #e5e7eb;
        border-radius: 10px;
        background: #fff;
        font-size: .82rem;
        font-weight: 700;
        cursor: pointer;
        transition: all .2s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
    }
    .pf-grade-btn svg {
        width: 16px; height: 16px;
        fill: none; stroke: currentColor;
        stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;
    }
    .pf-grade-btn:hover { transform: translateY(-1px); box-shadow: 0 3px 8px rgba(0,0,0,.08); }
    .pf-grade-btn.correct {
        border-color: #10b981;
        color: #10b981;
    }
    .pf-grade-btn.correct:hover,
    .pf-grade-btn.correct.active {
        background: #10b981;
        color: #fff;
        border-color: #10b981;
    }
    .pf-grade-btn.wrong {
        border-color: #ef4444;
        color: #ef4444;
    }
    .pf-grade-btn.wrong:hover,
    .pf-grade-btn.wrong.active {
        background: #ef4444;
        color: #fff;
        border-color: #ef4444;
    }

    /* ─── Graded State Indicator ─── */
    .prob.graded-correct .prob-num { box-shadow: 0 0 0 2.5px #10b981; }
    .prob.graded-wrong .prob-num { box-shadow: 0 0 0 2.5px #ef4444; }
    .pf-grade-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: .72rem;
        font-weight: 700;
        padding: 3px 8px;
        border-radius: 6px;
        margin-left: auto;
    }
    .pf-grade-badge.correct {
        background: rgba(16,185,129,.1);
        color: #10b981;
    }
    .pf-grade-badge.wrong {
        background: rgba(239,68,68,.1);
        color: #ef4444;
    }
    .pf-grade-badge svg {
        width: 12px; height: 12px;
        fill: none; stroke: currentColor;
        stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round;
    }

    /* ─── Textarea Auto-Save Indicator ─── */
    .pf-saved-indicator {
        font-size: .68rem;
        color: #94a3b8;
        text-align: right;
        margin-top: 4px;
        opacity: 0;
        transition: opacity .3s;
    }
    .pf-saved-indicator.show {
        opacity: 1;
    }

    @media print {
        .pf-progress-wrap, .pf-grade-wrap, .pf-grade-badge, .pf-saved-indicator { display: none !important; }
    }
    `;
    document.head.appendChild(style);

    // ─── 4. 페이지 로드 후 초기화 ───
    function init() {
        const problems = document.querySelectorAll('.prob');
        if (!problems.length) {
            // 아직 렌더링 안 됐으면 재시도
            setTimeout(init, 100);
            return;
        }

        const pageData = Storage.getPage(PAGE_KEY);
        const total = problems.length;

        // 4a. 프로그레스 바 삽입
        insertProgressBar(total, pageData);

        // 4b. 각 문제에 자기 채점 UI 추가
        problems.forEach((prob, i) => {
            const num = i + 1;
            const details = prob.querySelector('details.ans');
            const textarea = prob.querySelector('textarea.write');

            if (!details) return;

            // 저장된 답 복원
            if (textarea) {
                const savedAnswer = Storage.getAnswer(PAGE_KEY, num);
                if (savedAnswer) textarea.value = savedAnswer;

                // 답 자동 저장 (디바운스)
                let saveTimer;
                const indicator = document.createElement('div');
                indicator.className = 'pf-saved-indicator';
                indicator.textContent = '자동 저장됨';
                textarea.parentElement.insertBefore(indicator, textarea.nextSibling);

                textarea.addEventListener('input', () => {
                    clearTimeout(saveTimer);
                    saveTimer = setTimeout(() => {
                        Storage.saveAnswer(PAGE_KEY, num, textarea.value);
                        indicator.classList.add('show');
                        setTimeout(() => indicator.classList.remove('show'), 1500);
                    }, 800);
                });
            }

            // 채점 버튼 삽입
            const gradeWrap = document.createElement('div');
            gradeWrap.className = 'pf-grade-wrap';
            gradeWrap.innerHTML = `
                <button class="pf-grade-btn correct" data-prob="${num}" data-grade="correct">
                    <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                    맞았어요
                </button>
                <button class="pf-grade-btn wrong" data-prob="${num}" data-grade="wrong">
                    <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    틀렸어요
                </button>
            `;

            // details 내부 하단에 삽입
            details.appendChild(gradeWrap);

            // 이벤트 리스너
            gradeWrap.querySelectorAll('.pf-grade-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const grade = btn.dataset.grade;
                    Storage.setProblem(PAGE_KEY, num, grade);

                    // 버튼 상태 업데이트
                    gradeWrap.querySelectorAll('.pf-grade-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');

                    // 문제 카드 시각적 표시
                    prob.classList.remove('graded-correct', 'graded-wrong');
                    prob.classList.add(`graded-${grade}`);

                    // prob-top에 배지 추가
                    updateBadge(prob, grade);

                    // 프로그레스 바 업데이트
                    updateProgressBar(total);
                });
            });

            // 기존 채점 상태 복원
            if (pageData[num]) {
                const grade = pageData[num];
                prob.classList.add(`graded-${grade}`);
                const btn = gradeWrap.querySelector(`[data-grade="${grade}"]`);
                if (btn) btn.classList.add('active');
                updateBadge(prob, grade);
            }
        });

        // After init, start iframe sync if applicable
        _initIframeSync(problems.length);
    }

    // ─── 5. 프로그레스 바 ───
    function insertProgressBar(total, pageData) {
        const wrap = document.querySelector('.wrap') || document.querySelector('main') || document.body;
        const stuBar = document.querySelector('.stu-bar');
        const hdr = document.querySelector('.hdr');

        const bar = document.createElement('div');
        bar.className = 'pf-progress-wrap';
        bar.id = 'pf-progress';

        const correct = Object.values(pageData).filter(v => v === 'correct').length;
        const wrong = Object.values(pageData).filter(v => v === 'wrong').length;
        const graded = correct + wrong;
        const pct = total > 0 ? Math.round((graded / total) * 100) : 0;

        bar.innerHTML = `
            <div class="pf-progress-label">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle;margin-right:4px"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                학습 진행
            </div>
            <div class="pf-progress-bar"><div class="pf-progress-fill" style="width:${pct}%"></div></div>
            <div class="pf-progress-stats">
                <span><strong>${graded}</strong>/${total} 풀이</span>
                <span class="pf-stat-correct">✓ <strong>${correct}</strong></span>
                <span class="pf-stat-wrong">✗ <strong>${wrong}</strong></span>
                <span><strong>${pct}%</strong></span>
            </div>
        `;

        // stu-bar 또는 hdr 다음에 삽입
        const anchor = stuBar || hdr;
        if (anchor && anchor.nextSibling) {
            anchor.parentElement.insertBefore(bar, anchor.nextSibling);
        } else {
            const probsContainer = document.getElementById('problems');
            if (probsContainer) {
                probsContainer.parentElement.insertBefore(bar, probsContainer);
            }
        }
    }

    function updateProgressBar(total) {
        const pageData = Storage.getPage(PAGE_KEY);
        const correct = Object.values(pageData).filter(v => v === 'correct').length;
        const wrong = Object.values(pageData).filter(v => v === 'wrong').length;
        const graded = correct + wrong;
        const pct = total > 0 ? Math.round((graded / total) * 100) : 0;

        const bar = document.getElementById('pf-progress');
        if (!bar) return;

        bar.querySelector('.pf-progress-fill').style.width = `${pct}%`;
        bar.querySelector('.pf-progress-stats').innerHTML = `
            <span><strong>${graded}</strong>/${total} 풀이</span>
            <span class="pf-stat-correct">✓ <strong>${correct}</strong></span>
            <span class="pf-stat-wrong">✗ <strong>${wrong}</strong></span>
            <span><strong>${pct}%</strong></span>
        `;
    }

    // ─── 6. 채점 배지 ───
    function updateBadge(prob, grade) {
        // 기존 배지 제거
        const old = prob.querySelector('.pf-grade-badge');
        if (old) old.remove();

        const badge = document.createElement('span');
        badge.className = `pf-grade-badge ${grade}`;

        if (grade === 'correct') {
            badge.innerHTML = `<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> 정답`;
        } else {
            badge.innerHTML = `<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> 오답`;
        }

        const probTop = prob.querySelector('.prob-top');
        if (probTop) probTop.appendChild(badge);
    }

    // ─── 7. 시작 ───
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(init, 50));
    } else {
        setTimeout(init, 50);
    }

    // ─── 8. 글로벌 API (허브 페이지에서 사용) ───
    window.CTplatform = {
        Storage,
        getPageStats(pageKey) {
            const data = Storage.getPage(pageKey);
            const correct = Object.values(data).filter(v => v === 'correct').length;
            const wrong = Object.values(data).filter(v => v === 'wrong').length;
            return { correct, wrong, total: correct + wrong };
        },
        getAllStats() {
            const all = Storage.getAll();
            const result = {};
            for (const [key, data] of Object.entries(all)) {
                const correct = Object.values(data).filter(v => v === 'correct').length;
                const wrong = Object.values(data).filter(v => v === 'wrong').length;
                result[key] = { correct, wrong, total: correct + wrong };
            }
            return result;
        }
    };

    // ═══════════════════════════════════════════
    // 9. iframe postMessage 연동
    //    codingssok.com 대시보드 임베딩 시 자동 활성화
    //    독립 실행 시 완전히 비활성 (에러 없음)
    // ═══════════════════════════════════════════

    const isInIframe = (() => {
        try { return window.self !== window.top; } catch { return true; }
    })();

    const ALLOWED_ORIGINS = [
        'https://codingssok.com',
        'https://www.codingssok.com',
        'http://localhost:3000',
        'http://localhost:5173'
    ];

    let _parentOrigin = null;
    let _isCompleted = false;
    let _heartbeatTimer = null;
    let _totalProblems = 0;
    let _onProgressChange = null;  // set after iframe sync init

    // Track 추출: PAGE_KEY 접두사 → 트랙명
    const _track = PAGE_KEY.split('_')[0];

    /** 부모 프레임에 메시지 전송 (안전 래퍼) */
    function _sendToParent(type, data) {
        if (!isInIframe) return;
        const origin = _parentOrigin || '*';
        try {
            window.parent.postMessage({ type, data }, origin);
            console.log(`[Platform] → ${type}`, data);
        } catch (e) {
            console.warn('[Platform] postMessage failed:', e);
        }
    }

    /** 현재 진행 상태를 계산 */
    function _getProgressData() {
        const pageData = Storage.getPage(PAGE_KEY);
        const correct = Object.values(pageData).filter(v => v === 'correct').length;
        const wrong = Object.values(pageData).filter(v => v === 'wrong').length;
        const total = _totalProblems || (correct + wrong) || 1;
        const pct = total > 0 ? Math.round((correct / total) * 1000) / 10 : 0;

        return {
            content_id: PAGE_KEY,
            track: _track,
            progress_percent: pct,
            correct_count: correct,
            wrong_count: wrong,
            current_position: {
                page: 1,
                scroll: Math.round(window.scrollY)
            }
        };
    }

    /** PROGRESS 전송 */
    function _sendProgress() {
        if (_isCompleted) return;
        _sendToParent('PROGRESS', _getProgressData());
    }

    /** COMPLETE 전송 (한 번만) */
    function _checkAndSendComplete() {
        if (_isCompleted) return;
        const pageData = Storage.getPage(PAGE_KEY);
        const graded = Object.values(pageData).filter(v => v === 'correct' || v === 'wrong').length;
        if (_totalProblems > 0 && graded >= _totalProblems) {
            _isCompleted = true;
            const correct = Object.values(pageData).filter(v => v === 'correct').length;
            const wrong = Object.values(pageData).filter(v => v === 'wrong').length;
            const score = _totalProblems > 0 ? Math.round((correct / _totalProblems) * 100) : 0;
            _sendToParent('COMPLETE', {
                content_id: PAGE_KEY,
                track: _track,
                final_score: score,
                correct_count: correct,
                wrong_count: wrong
            });
            // Heartbeat 중지
            if (_heartbeatTimer) {
                clearInterval(_heartbeatTimer);
                _heartbeatTimer = null;
            }
        }
    }

    /** INIT 메시지 처리: 위치 복원, 답안 복원 */
    function _handleInit(data) {
        console.log('[Platform] ← INIT received', data);

        // 학생 이름 표시 (있으면)
        if (data.student_name) {
            const nameEl = document.querySelector('.stu-name') || document.querySelector('.student-name');
            if (nameEl) nameEl.textContent = data.student_name;
        }

        // 답안 복원
        if (data.saved_answers) {
            try {
                const answers = typeof data.saved_answers === 'string'
                    ? JSON.parse(data.saved_answers) : data.saved_answers;
                // ct_answers 형식으로 저장하면 기존 복원 로직이 동작
                const existing = JSON.parse(localStorage.getItem('ct_answers') || '{}');
                Object.assign(existing, answers);
                localStorage.setItem('ct_answers', JSON.stringify(existing));
            } catch (e) {
                console.warn('[Platform] Failed to restore answers:', e);
            }
        }

        // 위치 복원
        if (data.saved_position) {
            const pos = data.saved_position;
            if (pos.scroll) {
                setTimeout(() => window.scrollTo({ top: pos.scroll, behavior: 'smooth' }), 300);
            }
        }
    }

    /** 메시지 수신 리스너 (origin 검증 포함) */
    function _onMessage(event) {
        // origin 검증
        if (!ALLOWED_ORIGINS.includes(event.origin)) {
            return;
        }

        const msg = event.data;
        if (!msg || !msg.type) return;

        // 첫 응답의 origin을 기억 (이후 전송에 사용)
        if (!_parentOrigin) {
            _parentOrigin = event.origin;
            console.log('[Platform] Parent origin set:', _parentOrigin);
        }

        switch (msg.type) {
            case 'INIT':
                _handleInit(msg.data || {});
                break;
            default:
                console.log('[Platform] Unknown message type:', msg.type);
        }
    }

    /** iframe sync 초기화 (init 완료 후 호출) */
    function _initIframeSync(totalProblems) {
        _totalProblems = totalProblems;

        if (!isInIframe) {
            console.log('[Platform] Standalone mode — postMessage disabled');
            return;
        }

        console.log('[Platform] iframe mode detected — postMessage enabled');

        // 메시지 리스너 등록
        window.addEventListener('message', _onMessage);

        // 진도 변경 콜백 설정
        _onProgressChange = () => {
            _sendProgress();
            _checkAndSendComplete();
        };

        // READY 전송
        _sendToParent('READY', {
            track: _track,
            content_id: PAGE_KEY
        });

        // 30초 Heartbeat
        _heartbeatTimer = setInterval(() => {
            if (!_isCompleted) _sendProgress();
        }, 30000);

        // 페이지 언로드 시 정리
        window.addEventListener('beforeunload', () => {
            if (_heartbeatTimer) clearInterval(_heartbeatTimer);
            // 마지막 PROGRESS 전송
            if (!_isCompleted) _sendProgress();
        });
    }

    // iframe API를 글로벌에 노출
    window.CTplatform.isInIframe = isInIframe;
    window.CTplatform.sendProgress = _sendProgress;

})();
