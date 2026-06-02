/* ═══════════════════════════════════════════
   📊 Hub Progress — 허브 페이지 진도 표시
   localStorage 데이터 읽어서 진행률 바 표시
   ═══════════════════════════════════════════ */
(function () {
    'use strict';

    const style = document.createElement('style');
    style.textContent = `
    /* ─── Hub Progress Bars ─── */
    .hub-progress {
        width: 100%;
        height: 5px;
        background: #f1f5f9;
        border-radius: 99px;
        overflow: hidden;
        margin-top: 8px;
    }
    .hub-progress-fill {
        height: 100%;
        border-radius: 99px;
        transition: width .6s cubic-bezier(.4,0,.2,1);
        min-width: 0;
    }
    .hub-progress-text {
        font-size: .68rem;
        color: #94a3b8;
        margin-top: 4px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .hub-progress-text .pct {
        font-weight: 800;
        color: #1e293b;
    }
    .hub-progress-text .correct-rate {
        color: #10b981;
        font-weight: 700;
    }

    /* ─── Hero Stats Override ─── */
    .hub-total-stats {
        display: flex;
        justify-content: center;
        gap: 12px;
        margin-top: 16px;
        flex-wrap: wrap;
    }
    .hub-total-chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 50px;
        padding: 8px 16px;
        font-size: .78rem;
        font-weight: 600;
        color: #64748b;
        box-shadow: 0 1px 3px rgba(0,0,0,.04);
    }
    .hub-total-chip strong {
        font-weight: 800;
        color: #1e293b;
    }
    .hub-total-chip.green strong { color: #10b981; }
    .hub-total-chip.red strong { color: #ef4444; }
    .hub-total-chip.blue strong { color: #6366f1; }

    /* ─── Dashboard Link ─── */
    .hub-dashboard-link {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin-top: 20px;
        padding: 12px 24px;
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        color: #fff;
        text-decoration: none;
        border-radius: 12px;
        font-size: .85rem;
        font-weight: 700;
        transition: all .3s;
        box-shadow: 0 4px 12px rgba(99,102,241,.25);
    }
    .hub-dashboard-link:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(99,102,241,.35);
    }
    .hub-dashboard-link svg {
        width: 18px; height: 18px;
        fill: none; stroke: currentColor;
        stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;
    }
    `;
    document.head.appendChild(style);

    // ─── Read localStorage ───
    function getAll() {
        try { return JSON.parse(localStorage.getItem('ct_platform') || '{}'); } catch { return {}; }
    }

    function getStatsForKeys(keys) {
        const all = getAll();
        let correct = 0, wrong = 0;
        keys.forEach(k => {
            const data = all[k];
            if (!data) return;
            Object.values(data).forEach(v => {
                if (v === 'correct') correct++;
                if (v === 'wrong') wrong++;
            });
        });
        return { correct, wrong, total: correct + wrong };
    }

    // ─── 코딩 기초 사고력 키 매핑 ───
    const KF_MAP = {
        '논리': ['kf_논리_쉬움', 'kf_논리_보통', 'kf_논리_어려움'],
        '수학': ['kf_수학_쉬움', 'kf_수학_보통', 'kf_수학_어려움'],
        '순서도': ['kf_순서도_쉬움', 'kf_순서도_보통', 'kf_순서도_어려움'],
        '문제해결': ['kf_문제해결_쉬움', 'kf_문제해결_보통', 'kf_문제해결_어려움'],
        '이산수학': ['kf_이산수학_쉬움', 'kf_이산수학_보통', 'kf_이산수학_어려움']
    };

    // ─── 컴퓨팅 사고력 키 매핑 ───
    const CT_MAP = {
        '분해': ['ct_분해_Level1', 'ct_분해_Level2', 'ct_분해_Level3', 'ct_분해_Level4', 'ct_분해_Level5',
            'ct_분해_Level1_추가', 'ct_분해_Level2_추가', 'ct_분해_Level3_추가', 'ct_분해_Level4_추가', 'ct_분해_Level5_추가'],
        '패턴': ['ct_패턴_Level1', 'ct_패턴_Level2', 'ct_패턴_Level3', 'ct_패턴_Level4', 'ct_패턴_Level5'],
        '추상화': ['ct_추상화_Level1', 'ct_추상화_Level2', 'ct_추상화_Level3', 'ct_추상화_Level4', 'ct_추상화_Level5'],
        '알고리즘': ['ct_알고리즘_Level1', 'ct_알고리즘_Level2', 'ct_알고리즘_Level3', 'ct_알고리즘_Level4', 'ct_알고리즘_Level5'],
        '종합평가': ['ct_종합평가_Level1', 'ct_종합평가_Level2', 'ct_종합평가_Level3'],
        '프로젝트': ['ct_프로젝트_Level1', 'ct_프로젝트_Level2', 'ct_프로젝트_Level3']
    };

    // ─── Detect which hub we're on ───
    const isKF = location.pathname.includes('코딩') || document.title.includes('코딩');
    const isCT = location.pathname.includes('컴퓨팅') || document.title.includes('컴퓨팅');
    const MAP = isKF ? KF_MAP : (isCT ? CT_MAP : null);
    if (!MAP) return;

    // ─── Add progress to sections ───
    function init() {
        const sections = document.querySelectorAll('.domain-section, .level-grid, .feature-grid');
        if (isKF) initKF();
        if (isCT) initCT();
        addTotalStats();
        addDashboardLink();
    }

    function initKF() {
        // 각 도메인 섹션에 프로그레스 바 추가
        const domainSections = document.querySelectorAll('.domain-section');
        const keys = Object.keys(KF_MAP);
        domainSections.forEach((sec, i) => {
            if (i >= keys.length) return;
            const stats = getStatsForKeys(KF_MAP[keys[i]]);
            if (stats.total === 0) return;
            const expectedTotal = 180; // 60 × 3
            addProgressToElement(sec, stats, expectedTotal);
        });

        // 개별 카드에 정답 개수 표시
        const cards = document.querySelectorAll('.card');
        const allKeys = Object.values(KF_MAP).flat();
        cards.forEach((card, i) => {
            if (i >= allKeys.length) return;
            const key = allKeys[i];
            const data = getAll()[key];
            if (!data) return;
            const correct = Object.values(data).filter(v => v === 'correct').length;
            const wrong = Object.values(data).filter(v => v === 'wrong').length;
            const total = correct + wrong;
            if (total > 0) {
                const bar = document.createElement('div');
                bar.className = 'hub-progress';
                const pct = Math.round((total / 60) * 100);
                const color = correct / total > 0.7 ? '#10b981' : correct / total > 0.4 ? '#f59e0b' : '#ef4444';
                bar.innerHTML = `<div class="hub-progress-fill" style="width:${pct}%;background:${color}"></div>`;
                const footer = card.querySelector('.card-footer');
                if (footer) card.insertBefore(bar, footer);
                else card.appendChild(bar);

                const txt = document.createElement('div');
                txt.className = 'hub-progress-text';
                txt.innerHTML = `<span><span class="pct">${total}/60</span> 풀이</span><span class="correct-rate">${Math.round(correct / total * 100)}% 정답</span>`;
                bar.after(txt);
            }
        });
    }

    function initCT() {
        // 각 레벨 그리드에 해당 섹션의 통계 표시
        const levelGrids = document.querySelectorAll('.level-grid');
        const gridKeys = ['분해', '패턴', '추상화', '알고리즘'];
        levelGrids.forEach((grid, i) => {
            if (i >= gridKeys.length) return;
            const stats = getStatsForKeys(CT_MAP[gridKeys[i]]);
            if (stats.total === 0) return;
            const expectedTotal = 300;
            addProgressToElement(grid, stats, expectedTotal, true);
        });

        // 레벨 카드에 개별 진행률
        const levelCards = document.querySelectorAll('.level-card');
        levelCards.forEach(card => {
            const href = card.getAttribute('href');
            if (!href) return;
            // 파일명 추출
            const file = href.split('/').pop().replace('.html', '');
            const key = `ct_${file}`;
            const data = getAll()[key];
            if (!data) return;
            const correct = Object.values(data).filter(v => v === 'correct').length;
            const wrong = Object.values(data).filter(v => v === 'wrong').length;
            const total = correct + wrong;
            if (total > 0) {
                const bar = document.createElement('div');
                bar.className = 'hub-progress';
                bar.style.marginTop = '6px';
                const pct = Math.round((total / 60) * 100);
                const color = correct / total > 0.7 ? '#10b981' : correct / total > 0.4 ? '#f59e0b' : '#ef4444';
                bar.innerHTML = `<div class="hub-progress-fill" style="width:${Math.min(pct, 100)}%;background:${color}"></div>`;
                card.appendChild(bar);
            }
        });
    }

    function addProgressToElement(el, stats, expectedTotal, before) {
        const wrap = document.createElement('div');
        wrap.style.cssText = 'margin: -8px 0 16px; padding: 0 4px;';
        const pct = Math.round((stats.total / expectedTotal) * 100);
        const correctRate = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
        wrap.innerHTML = `
            <div class="hub-progress" style="height:4px">
                <div class="hub-progress-fill" style="width:${Math.min(pct, 100)}%;background:linear-gradient(90deg,#6366f1,#a78bfa)"></div>
            </div>
            <div class="hub-progress-text">
                <span><span class="pct">${stats.total}/${expectedTotal}</span> 풀이</span>
                <span class="correct-rate">정답률 ${correctRate}%</span>
            </div>
        `;
        if (before) {
            el.parentElement.insertBefore(wrap, el);
        } else {
            el.appendChild(wrap);
        }
    }

    function addTotalStats() {
        const allMap = isKF ? KF_MAP : CT_MAP;
        const allKeys = Object.values(allMap).flat();
        const stats = getStatsForKeys(allKeys);
        if (stats.total === 0) return;

        const wrap = document.createElement('div');
        wrap.className = 'hub-total-stats';
        const correctRate = Math.round((stats.correct / stats.total) * 100);
        wrap.innerHTML = `
            <div class="hub-total-chip blue">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                총 풀이 <strong>${stats.total}</strong>문제
            </div>
            <div class="hub-total-chip green">✓ 정답 <strong>${stats.correct}</strong></div>
            <div class="hub-total-chip red">✗ 오답 <strong>${stats.wrong}</strong></div>
            <div class="hub-total-chip">정답률 <strong>${correctRate}%</strong></div>
        `;

        // 히어로 또는 헤더 아래에 삽입
        const hero = document.querySelector('.hero, .hub-header');
        if (hero) hero.appendChild(wrap);
    }

    function addDashboardLink() {
        const hero = document.querySelector('.hero, .hub-header');
        if (!hero) return;

        const link = document.createElement('a');
        link.className = 'hub-dashboard-link';
        link.href = 'dashboard.html';
        link.innerHTML = `
            <svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            성취도 대시보드 보기
        `;
        hero.appendChild(link);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
