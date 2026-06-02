// ========== ULTRA UPGRADE: Extra Features ==========

// --- Bookmarks ---
function gbm(p) { return (ld()[pk(p)] || {}).bookmarked || false }
function sbm(p) { const d = ld(), k = pk(p); if (!d[k]) d[k] = {}; d[k].bookmarked = !d[k].bookmarked; sv(d); render(); toast(d[k].bookmarked ? '북마크 추가' : '북마크 해제', 'cy') }

// --- Code Storage ---
function gcode(p) { return (ld()[pk(p)] || {}).code || '' }
function scode(p, c) { const d = ld(), k = pk(p); if (!d[k]) d[k] = {}; d[k].code = c; sv(d) }
function opCode(i) {
    const p = KOI_PROBLEMS[i];
    document.getElementById('codeTitle').textContent = p.n + ' 풀이 코드';
    document.getElementById('codeArea').value = gcode(p);
    document.getElementById('codeBg').dataset.idx = i;
    document.getElementById('codeBg').classList.add('on');
}
function clCode() { document.getElementById('codeBg').classList.remove('on') }
function svCode() {
    const i = parseInt(document.getElementById('codeBg').dataset.idx);
    const p = KOI_PROBLEMS[i];
    scode(p, document.getElementById('codeArea').value);
    clCode(); toast('코드 저장됨', 'gn'); render();
}

// --- Spaced Repetition Review ---
function getReviews() {
    const d = ld(), today = new Date().toISOString().slice(0, 10), reviews = [];
    const intervals = [3, 7, 30];
    Object.keys(d).forEach(k => {
        if (d[k].doneDate && d[k].status === 'done') {
            const done = new Date(d[k].doneDate);
            intervals.forEach(days => {
                const rev = new Date(done); rev.setDate(rev.getDate() + days);
                if (rev.toISOString().slice(0, 10) === today) {
                    const p = KOI_PROBLEMS.find(x => pk(x) === k);
                    if (p) reviews.push({ problem: p, days: days });
                }
            });
        }
    });
    return reviews;
}
function checkReviews() {
    const revs = getReviews();
    if (revs.length > 0) {
        setTimeout(() => {
            toast(`📋 오늘 복습할 문제 ${revs.length}개!`, 'cy');
        }, 1500);
    }
}
function openReviews() {
    const revs = getReviews();
    if (!revs.length) { toast('오늘 복습할 문제가 없습니다', 'am'); return }
    const html = revs.map(r => `<div class="rev-item" onclick="opV('${OF ? r.problem.op : r.problem.lp}','${r.problem.y} ${r.problem.r}차 ${r.problem.n}')">
        <span class="rev-name">${r.problem.y} ${r.problem.r}차 ${r.problem.n}</span>
        <span class="rev-days">${r.days}일 후 복습</span>
    </div>`).join('');
    document.getElementById('reviewContent').innerHTML = html;
    document.getElementById('reviewBg').classList.add('on');
}
function clReview() { document.getElementById('reviewBg').classList.remove('on') }

// --- Contest Simulation ---
let contestTimer = null, contestEnd = 0;
function openContestSetup() { document.getElementById('contestBg').classList.add('on') }
function clContest() { document.getElementById('contestBg').classList.remove('on'); if (contestTimer) clearInterval(contestTimer) }
function startContest() {
    const yr = parseInt(document.getElementById('contestYear').value);
    const rd = parseInt(document.getElementById('contestRound').value);
    const mins = parseInt(document.getElementById('contestTime').value) || 100;
    clContest();
    const problems = KOI_PROBLEMS.filter(p => p.y === yr && p.r === rd && p.d.includes(aD));
    if (!problems.length) { toast('해당 연도/차수 문제가 없습니다', 'am'); return }
    contestEnd = Date.now() + mins * 60 * 1000;
    document.getElementById('simBar').style.display = 'flex';
    document.getElementById('simProblems').innerHTML = problems.map(p => {
        const pu = OF ? p.op : p.lp;
        return `<button class="lk lk-v" onclick="opV('${pu}','${p.n}')">${p.n}</button>`;
    }).join('');
    document.getElementById('simLabel').textContent = `${yr} ${rd}차 ${DLB[aD]}`;
    contestTimer = setInterval(() => {
        const left = Math.max(0, contestEnd - Date.now());
        const m = Math.floor(left / 60000), s = Math.floor(left % 60000 / 1000);
        document.getElementById('simTime').textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
        if (left <= 0) { clearInterval(contestTimer); toast('시험 종료!', 'am'); document.getElementById('simTime').textContent = '00:00' }
        if (left <= 300000 && left > 299000) toast('⚠ 5분 남았습니다!', 'am');
    }, 1000);
    toast(`대회 시뮬레이션 시작! ${mins}분`, 'gn');
}
function endContest() {
    if (contestTimer) clearInterval(contestTimer);
    document.getElementById('simBar').style.display = 'none';
    toast('시뮬레이션 종료', 'am');
}

// --- Study Plan ---
function getStudyPlan() { try { return JSON.parse(localStorage.getItem('koi_plan')) || {} } catch (e) { return {} } }
function svStudyPlan(p) { localStorage.setItem('koi_plan', JSON.stringify(p)) }
function openStudyPlan() {
    const plan = getStudyPlan();
    document.getElementById('planGoal').value = plan.weeklyGoal || 5;
    document.getElementById('planBg').classList.add('on');
    renderStudyPlan();
}
function clPlan() { document.getElementById('planBg').classList.remove('on') }
function savePlanGoal() {
    const plan = getStudyPlan();
    plan.weeklyGoal = parseInt(document.getElementById('planGoal').value) || 5;
    svStudyPlan(plan); renderStudyPlan(); toast('목표 저장', 'gn');
}
function renderStudyPlan() {
    const plan = getStudyPlan(), d = ld(), goal = plan.weeklyGoal || 5;
    const today = new Date(), weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const wsStr = weekStart.toISOString().slice(0, 10);
    let weekDone = 0;
    Object.values(d).forEach(v => { if (v.doneDate && v.doneDate >= wsStr) weekDone++ });
    const pct = Math.min(100, Math.round(weekDone / goal * 100));
    document.getElementById('planProgress').innerHTML = `
        <div class="plan-ring" style="background:conic-gradient(var(--gn) ${pct * 3.6}deg,var(--bg3) 0)">
            <span>${weekDone}/${goal}</span>
        </div>
        <div class="plan-info">
            <div class="plan-pct">${pct}% 달성</div>
            <div class="plan-left">${Math.max(0, goal - weekDone)}문제 남음</div>
        </div>`;
}

// --- Keyboard Shortcuts Guide ---
function openShortcuts() { document.getElementById('shortcutsBg').classList.add('on') }
function clShortcuts() { document.getElementById('shortcutsBg').classList.remove('on') }

// --- Search Highlight ---
function highlightText(text, query) {
    if (!query) return text;
    const re = new RegExp('(' + query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
    return text.replace(re, '<mark class="hl">$1</mark>');
}

// --- Progress Timeline ---
function renderTimeline() {
    const d = ld(), dates = {};
    Object.values(d).forEach(v => { if (v.doneDate) { dates[v.doneDate] = (dates[v.doneDate] || 0) + 1 } });
    const sorted = Object.keys(dates).sort();
    if (sorted.length < 2) return '<p style="color:var(--tx3);font-size:.7rem;text-align:center">데이터가 부족합니다</p>';
    let cumulative = 0; const points = sorted.map(dt => { cumulative += dates[dt]; return { d: dt, v: cumulative } });
    const maxV = points[points.length - 1].v;
    const w = 400, h = 120, px = 20, py = 10;
    const xScale = (i) => px + i / (points.length - 1) * (w - 2 * px);
    const yScale = (v) => h - py - v / maxV * (h - 2 * py);
    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScale(p.v).toFixed(1)}`).join(' ');
    const areaD = pathD + ` L${xScale(points.length - 1).toFixed(1)},${h - py} L${px},${h - py} Z`;
    return `<svg viewBox="0 0 ${w} ${h}" class="timeline-svg">
        <defs><linearGradient id="tlg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="var(--ac)" stop-opacity=".3"/><stop offset="100%" stop-color="var(--ac)" stop-opacity="0"/></linearGradient></defs>
        <path d="${areaD}" fill="url(#tlg)"/>
        <path d="${pathD}" fill="none" stroke="var(--ac)" stroke-width="2" stroke-linecap="round"/>
        ${points.map((p, i) => `<circle cx="${xScale(i).toFixed(1)}" cy="${yScale(p.v).toFixed(1)}" r="3" fill="var(--ac)"><title>${p.d}: ${p.v}문제</title></circle>`).join('')}
        <text x="${px}" y="${h - 2}" fill="var(--tx3)" font-size="8">${sorted[0]}</text>
        <text x="${w - px}" y="${h - 2}" fill="var(--tx3)" font-size="8" text-anchor="end">${sorted[sorted.length - 1]}</text>
        <text x="${px}" y="10" fill="var(--tx3)" font-size="8">${maxV}문제</text>
    </svg>`;
}

// --- Enhanced keyboard handler (add ? key + Escape for new modals) ---
const _origKeydown = document.onkeydown;
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { clCode(); clReview(); clContest(); clPlan(); clShortcuts(); clWrong(); return }
    if (e.key === '?' && !document.querySelector('.cmd-bg.on') && !document.querySelector('.mm-bg.on') && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault(); openShortcuts();
    }
});

// --- Override renderStats to include timeline ---
const _origRenderStats = renderStats;
renderStats = function () {
    _origRenderStats();
    const sc = document.getElementById('statsContent');
    const grid = sc.querySelector('.stat-grid');
    if (grid) {
        const tlCard = document.createElement('div');
        tlCard.className = 'stat-card stat-card-wide';
        tlCard.innerHTML = '<h3>진도 타임라인</h3>' + renderTimeline();
        grid.appendChild(tlCard);
    }
};


// --- Override render to add search highlight ---
const _origRender = render;
render = function () {
    _origRender();
    // Apply search highlight
    const q = document.getElementById('q').value.trim();
    if (q) {
        document.querySelectorAll('.pn').forEach(el => {
            el.innerHTML = highlightText(el.textContent, q);
        });
    }
};

// --- Add new commands to command palette ---
const _origGetCmdItems = getCmdItems;
getCmdItems = function (q) {
    const items = _origGetCmdItems(q);
    const extra = [
        { name: '대회 시뮬레이션', key: ic('trophy', 14), action: () => { closeCmd(); openContestSetup() } },
        { name: '복습할 문제', key: ic('clipboard', 14), action: () => { closeCmd(); openReviews() } },
        { name: '학습 계획', key: ic('calendar', 14), action: () => { closeCmd(); openStudyPlan() } },
        { name: '단축키 가이드', key: ic('keyboard', 14), action: () => { closeCmd(); openShortcuts() } },
    ];
    if (!q) return [...extra, ...items].slice(0, 14);
    const fExtra = extra.filter(i => i.name.toLowerCase().includes(q.toLowerCase()));
    return [...fExtra, ...items].slice(0, 14);
};

// --- Boot extras ---
checkReviews();

// ═══════════════════════════════════════════════════════════════
// WRONG NOTE SYSTEM
// ═══════════════════════════════════════════════════════════════
const WRONG_TYPES = ['구현 실수', '시간초과', '엣지케이스', '문제 이해', '자료구조', '수학/공식', '그리디 실패', '기타'];

function gwrong(p) { return (ld()[pk(p)] || {}).wrongNote || '' }
function swrong(p, v) { const d = ld(), k = pk(p); if (!d[k]) d[k] = {}; d[k].wrongNote = v; sv(d) }
function gwrongTags(p) { return (ld()[pk(p)] || {}).wrongTags || [] }
function swrongTags(p, v) { const d = ld(), k = pk(p); if (!d[k]) d[k] = {}; d[k].wrongTags = v; sv(d) }

let wrongIdx = -1;
function opWrong(i) {
    wrongIdx = i;
    const p = KOI_PROBLEMS[i];
    document.getElementById('wrongTx').value = gwrong(p);
    renderWrongTags(p);
    document.getElementById('wrongBg').classList.add('on');
}
function clWrong() { document.getElementById('wrongBg').classList.remove('on'); wrongIdx = -1 }
function svWrong() {
    if (wrongIdx < 0) return;
    const p = KOI_PROBLEMS[wrongIdx];
    swrong(p, document.getElementById('wrongTx').value);
    clWrong(); toast('오답노트 저장됨', 'rd'); render();
}
function renderWrongTags(p) {
    const cur = gwrongTags(p);
    const el = document.getElementById('wrongTags');
    el.innerHTML = WRONG_TYPES.map(t => {
        const active = cur.includes(t);
        return `<span class="wrong-tag ${active ? '' : 'wrong-tag-add'}" onclick="toggleWrongTag('${t}')">${active ? '✕ ' : '+ '}${t}</span>`;
    }).join('');
}
function toggleWrongTag(tag) {
    if (wrongIdx < 0) return;
    const p = KOI_PROBLEMS[wrongIdx];
    let tags = gwrongTags(p);
    if (tags.includes(tag)) tags = tags.filter(t => t !== tag);
    else tags.push(tag);
    swrongTags(p, tags);
    renderWrongTags(p);
}

// ═══════════════════════════════════════════════════════════════
// TAG FILTER POPULATION
// ═══════════════════════════════════════════════════════════════
function populateTagFilter() {
    const allTags = new Set();
    const d = ld();
    KOI_PROBLEMS.forEach(p => {
        const k = pk(p);
        if (d[k] && d[k].tags) d[k].tags.forEach(t => allTags.add(t));
    });
    const sel = document.getElementById('tagFilter');
    if (!sel) return;
    const cur = sel.value;
    sel.innerHTML = '<option value="">태그: 전체</option>' +
        [...allTags].sort().map(t => `<option value="${t}" ${t === cur ? 'selected' : ''}>${t}</option>`).join('');
}

// ═══════════════════════════════════════════════════════════════
// TAG STATISTICS
// ═══════════════════════════════════════════════════════════════
function getTagStats() {
    const d = ld();
    const stats = {};
    KOI_PROBLEMS.forEach(p => {
        const k = pk(p);
        const tags = (d[k] && d[k].tags) ? d[k].tags : [];
        const st = (d[k] && d[k].status) || '';
        tags.forEach(t => {
            if (!stats[t]) stats[t] = { total: 0, done: 0, wip: 0 };
            stats[t].total++;
            if (st === 'done') stats[t].done++;
            else if (st === 'wip') stats[t].wip++;
        });
    });
    return stats;
}

function renderTagStats() {
    const stats = getTagStats();
    const keys = Object.keys(stats).sort((a, b) => stats[b].total - stats[a].total);
    if (!keys.length) return '<div style="color:var(--tx3);font-size:.65rem;padding:8px">태그를 추가하면 통계가 표시됩니다</div>';
    const maxTotal = Math.max(...keys.map(k => stats[k].total));
    return '<div class="tag-stat-grid">' + keys.map(k => {
        const s = stats[k];
        const pct = Math.round(s.done / s.total * 100);
        const w = Math.round(s.total / maxTotal * 80);
        return `<div class="tag-stat-item">
            <span class="tag-stat-name">${k}</span>
            <div style="flex:1;display:flex;align-items:center;gap:4px">
                <div class="tag-stat-bar" style="width:${w}px;opacity:${.4 + pct / 100 * .6}"></div>
            </div>
            <span class="tag-stat-cnt">${s.done}/${s.total} (${pct}%)</span>
        </div>`;
    }).join('') + '</div>';
}

// ═══════════════════════════════════════════════════════════════
// SOLVE TIME GRAPH
// ═══════════════════════════════════════════════════════════════
function renderTimeGraph() {
    const d = ld();
    const items = [];
    KOI_PROBLEMS.forEach(p => {
        const k = pk(p);
        if (d[k] && d[k].time > 0) items.push({ name: p.n, time: d[k].time, y: p.y });
    });
    if (!items.length) return '<div style="color:var(--tx3);font-size:.65rem;padding:8px">타이머를 사용하면 시간 그래프가 표시됩니다</div>';

    items.sort((a, b) => a.time - b.time);
    const maxTime = Math.max(...items.map(i => i.time));
    const barH = 18, gap = 4, svgH = items.length * (barH + gap) + 10;
    const svgW = 400, labelW = 80, barMax = svgW - labelW - 60;

    let svg = `<svg class="time-graph-svg" viewBox="0 0 ${svgW} ${svgH}" xmlns="http://www.w3.org/2000/svg">`;
    items.forEach((item, idx) => {
        const y = idx * (barH + gap) + 5;
        const w = Math.max(4, item.time / maxTime * barMax);
        svg += `<text x="${labelW - 4}" y="${y + barH / 2 + 4}" text-anchor="end" fill="var(--tx2)" font-size="9" font-family="var(--f)">${item.name.substring(0, 10)}</text>`;
        svg += `<rect x="${labelW}" y="${y}" width="${w}" height="${barH}" rx="4" fill="var(--ac)" opacity=".7"/>`;
        svg += `<text x="${labelW + w + 4}" y="${y + barH / 2 + 4}" fill="var(--tx3)" font-size="8" font-family="var(--fm)">${fmtTime(item.time)}</text>`;
    });
    svg += '</svg>';
    return svg;
}

// ═══════════════════════════════════════════════════════════════
// SMART PROBLEM RECOMMENDATION
// ═══════════════════════════════════════════════════════════════
const _origSuggest = suggestProblem;
suggestProblem = function () {
    const d = ld();
    // Score each undone problem
    const candidates = KOI_PROBLEMS.filter(p => {
        const st = (d[pk(p)] || {}).status || '';
        return st !== 'done' && p.d.includes(aD);
    });
    if (!candidates.length) { toast('모든 문제를 풀었습니다! 🎉', 'gn'); return; }

    const doneProblems = KOI_PROBLEMS.filter(p => (d[pk(p)] || {}).status === 'done');
    const avgDiff = doneProblems.length > 0
        ? doneProblems.reduce((s, p) => s + gdf(p), 0) / doneProblems.length
        : 2;

    // Score: prefer problems near avg difficulty + slightly harder, prefer WIP, prefer bookmarked
    const scored = candidates.map(p => {
        let score = 100;
        const diff = gdf(p) || avgDiff;
        score -= Math.abs(diff - (avgDiff + 0.5)) * 15; // near sweet spot
        if ((d[pk(p)] || {}).status === 'wip') score += 30; // prefer in-progress
        if (gbm(p)) score += 20; // prefer bookmarked
        if (gtime(p) > 0) score -= 10; // already attempted
        score += Math.random() * 10; // some randomness
        return { p, score };
    });
    scored.sort((a, b) => b.score - a.score);

    const pick = scored[0].p;
    const i = KOI_PROBLEMS.indexOf(pick);
    const pu = OF ? pick.op : pick.lp;
    toast(`추천: ${pick.y} ${pick.r}차 ${pick.n}`, 'ac');
    opV(pu, `${pick.y} ${pick.r}차 ${pick.n}`, i);
};

// ═══════════════════════════════════════════════════════════════
// CODE EDITOR SYNTAX HIGHLIGHTING
// ═══════════════════════════════════════════════════════════════
const _origOpCode = opCode;
opCode = function (i) {
    _origOpCode(i);
    // Add preview panel if highlight.js loaded
    setTimeout(() => {
        const area = document.getElementById('codeArea');
        const code = area.value;
        let previewEl = document.getElementById('codePreview');
        if (!previewEl) {
            previewEl = document.createElement('div');
            previewEl.id = 'codePreview';
            previewEl.className = 'code-highlight-wrap';
            previewEl.style.marginTop = '8px';
            area.parentNode.insertBefore(previewEl, area.nextSibling?.nextSibling);
        }
        updateCodePreview(code);
        area.oninput = function () { updateCodePreview(this.value) };
    }, 100);
};

function updateCodePreview(code) {
    const el = document.getElementById('codePreview');
    if (!el || !code.trim()) { if (el) el.innerHTML = ''; return; }
    if (typeof hljs !== 'undefined') {
        const result = hljs.highlightAuto(code);
        el.innerHTML = `<pre><code class="hljs">${result.value}</code></pre>`;
    }
}

// ═══════════════════════════════════════════════════════════════
// ENHANCED STATS — TAG STATS + TIME GRAPH
// ═══════════════════════════════════════════════════════════════
const _origRenderStats2 = renderStats;
renderStats = function () {
    _origRenderStats2();
    const body = document.getElementById('statsContent');
    if (!body) return;
    const grid = body.querySelector('.stat-grid');
    if (!grid) return;

    // Append tag stats section
    const tagSection = document.createElement('div');
    tagSection.className = 'stat-card stat-card-wide';
    tagSection.innerHTML = `<h4 class="stat-card-title">${ic('chart', 14)} 태그별 통계</h4>` + renderTagStats();
    grid.appendChild(tagSection);

    // Append time graph section
    const timeSection = document.createElement('div');
    timeSection.className = 'stat-card stat-card-wide';
    timeSection.innerHTML = `<h4 class="stat-card-title">${ic('timer', 14)} 풀이 시간 분포</h4>` + renderTimeGraph();
    grid.appendChild(timeSection);
};

// ═══════════════════════════════════════════════════════════════
// MOBILE AUTO CARD-VIEW
// ═══════════════════════════════════════════════════════════════
function checkMobileView() {
    if (window.innerWidth <= 768 && viewMode !== 'card') {
        viewMode = 'card';
        const btn = document.getElementById('viewToggle');
        if (btn) btn.innerHTML = ic('grid');
    }
}

// ═══════════════════════════════════════════════════════════════
// POPULATE TAG FILTER + OVERRIDE RENDER
// ═══════════════════════════════════════════════════════════════
const _origRender2 = render;
render = function () {
    populateTagFilter();
    _origRender2();
};

// --- Boot new features ---
checkMobileView();
window.addEventListener('resize', () => { checkMobileView() });
populateTagFilter();
document.getElementById('wrongBg').addEventListener('click', e => { if (e.target === document.getElementById('wrongBg')) clWrong() });
