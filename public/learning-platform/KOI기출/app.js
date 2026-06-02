const OF = true, SK = 'koi_p', YRS = [2025, 2024, 2023, 2022, 2021, 2020, 2019], RDS = [{ v: 1, l: '1차' }, { v: 2, l: '2차' }], STS = [{ v: 'todo', l: 'dash', li: '—' }, { v: 'wip', l: 'half', li: '◐' }, { v: 'done', l: 'check', li: '✓' }], DVS = ['초', '중', '고'], DLB = { 초: '초등부', 중: '중등부', 고: '고등부' };
let aD = '초', mP = null, sortMode = 'default', cmdSel = 0, viewMode = 'table', showWritten = false;
const F = { y: new Set(), r: new Set(), s: new Set() };

// Storage
function ld() { try { return JSON.parse(localStorage.getItem(SK)) || {} } catch (e) { return {} } }
function sv(d) { localStorage.setItem(SK, JSON.stringify(d)) }
function pk(p) { return p.y + '-' + p.r + '-' + p.n }
function gs(p) { return (ld()[pk(p)] || {}).status || 'todo' }
function ss(p, s) { const d = ld(), k = pk(p); if (!d[k]) d[k] = {}; const prev = d[k].status; d[k].status = s; if (s === 'done') d[k].doneDate = new Date().toISOString().slice(0, 10); sv(d); if (s === 'done' && prev !== 'done') { confetti(); toast('완료! ' + p.n, 'gn') } else if (s === 'wip') { toast('진행중: ' + p.n, 'am') } render(); met(); upStreak(); upHeatmap(); upAch() }
function gn(p) { return (ld()[pk(p)] || {}).note || '' }
function sn(p, n) { const d = ld(), k = pk(p); if (!d[k]) d[k] = {}; d[k].note = n; sv(d) }
function gdf(p) { return (ld()[pk(p)] || {}).diff || 0 }
function sdf(p, v) { const d = ld(), k = pk(p); if (!d[k]) d[k] = {}; d[k].diff = v; sv(d); render() }
function gtags(p) { return (ld()[pk(p)] || {}).tags || [] }
function stags(p, t) { const d = ld(), k = pk(p); if (!d[k]) d[k] = {}; d[k].tags = t; sv(d); render() }
function gtime(p) { return (ld()[pk(p)] || {}).time || 0 }
function stime(p, t) { const d = ld(), k = pk(p); if (!d[k]) d[k] = {}; d[k].time = t; sv(d) }

// Theme w/ ripple
function togT() {
    const isDark = document.documentElement.dataset.theme === 'dark';
    const next = isDark ? 'light' : 'dark';
    const btn = document.querySelector('.t-btn');
    const rect = btn.getBoundingClientRect();
    const x = rect.left + rect.width / 2, y = rect.top + rect.height / 2;
    const maxR = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const rip = document.createElement('div');
    rip.className = 'theme-ripple';
    rip.style.cssText = `left:${x}px;top:${y}px;--max-r:${maxR}px;background:${next === 'dark' ? '#09090b' : '#ffffff'}`;
    document.body.appendChild(rip);
    requestAnimationFrame(() => rip.classList.add('expand'));
    setTimeout(() => { document.documentElement.dataset.theme = next; localStorage.setItem('koi_t', next); rip.remove(); btn.innerHTML = ic(next === 'dark' ? 'moon' : 'sun') }, 450);
}
(() => { const t = localStorage.getItem('koi_t'); if (t) document.documentElement.dataset.theme = t; document.addEventListener('DOMContentLoaded', () => { const b = document.getElementById('btnTheme'); if (b) b.innerHTML = ic(document.documentElement.dataset.theme === 'light' ? 'sun' : 'moon') }) })();

// Toast
function toast(msg, type) {
    const w = document.getElementById('toastWrap');
    const t = document.createElement('div'); t.className = 'toast' + (type ? ' toast-' + type : ''); t.textContent = msg;
    w.appendChild(t); setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(20px)'; setTimeout(() => t.remove(), 200) }, 2500);
}

// Confetti
function confetti() {
    const box = document.getElementById('confettiBox');
    const cols = ['#22c55e', '#3b82f6', '#eab308', '#ef4444', '#a855f7', '#06b6d4'];
    for (let i = 0; i < 18; i++) {
        const el = document.createElement('div'); el.className = 'confetti';
        const p = document.createElement('i');
        p.style.cssText = `left:${(Math.random() - .5) * 200}px;background:${cols[i % 6]};animation-delay:${Math.random() * .3}s;animation-duration:${.7 + Math.random() * .5}s;width:${4 + Math.random() * 4}px;height:${4 + Math.random() * 4}px;border-radius:${Math.random() > .5 ? '50%' : '1px'}`;
        el.appendChild(p); box.appendChild(el); setTimeout(() => el.remove(), 1500);
    }
}

// Streak
function upStreak() {
    const d = ld(), dates = new Set();
    Object.values(d).forEach(v => { if (v.doneDate) dates.add(v.doneDate) });
    const el = document.getElementById('streakTxt');
    if (!dates.size) { el.textContent = '0일 연속'; return }
    let streak = 0, day = new Date(); const fmt = d => d.toISOString().slice(0, 10);
    if (!dates.has(fmt(day))) { day.setDate(day.getDate() - 1); if (!dates.has(fmt(day))) { el.textContent = '0일 연속'; return } }
    while (dates.has(fmt(day))) { streak++; day.setDate(day.getDate() - 1) }
    el.textContent = streak + '일 연속';
}

// Heatmap
function upHeatmap() {
    const d = ld(), counts = {};
    Object.values(d).forEach(v => { if (v.doneDate) { counts[v.doneDate] = (counts[v.doneDate] || 0) + 1 } });
    const wrap = document.getElementById('heatmapEl');
    let html = ''; const today = new Date();
    for (let w = 11; w >= 0; w--) {
        html += '<div class="hm-col">';
        for (let day = 0; day < 7; day++) {
            const dt = new Date(today); dt.setDate(dt.getDate() - (w * 7 + 6 - day));
            const key = dt.toISOString().slice(0, 10); const c = counts[key] || 0;
            const lvl = c === 0 ? '' : c <= 1 ? 'hm-1' : c <= 2 ? 'hm-2' : c <= 4 ? 'hm-3' : 'hm-4';
            html += `<div class="hm-cell ${lvl}" title="${key}: ${c}문제"></div>`;
        }
        html += '</div>';
    }
    wrap.innerHTML = html;
}

// Achievements
const ACHS = [
    { id: 'first', name: '첫 풀이', desc: '첫 번째 문제 완료', icon: 'target', check: d => Object.values(d).filter(v => v.status === 'done').length >= 1 },
    { id: 'ten', name: '10문제', desc: '10문제 완료', icon: 'medal', check: d => Object.values(d).filter(v => v.status === 'done').length >= 10 },
    { id: 'fifty', name: '50문제', desc: '50문제 완료', icon: 'star', check: d => Object.values(d).filter(v => v.status === 'done').length >= 50 },
    { id: 'hundred', name: '100문제', desc: '100문제 완료', icon: 'hundred', check: d => Object.values(d).filter(v => v.status === 'done').length >= 100 },
    { id: 'year', name: '연도 정복', desc: '한 연도 전체 완료', icon: 'crown', check: d => { return YRS.some(y => { const ps = KOI_PROBLEMS.filter(p => p.y === y); return ps.length > 0 && ps.every(p => (d[pk(p)] || {}).status === 'done') }) } },
    { id: 'streak3', name: '3일 연속', desc: '3일 연속 풀이', icon: 'fire', check: d => { const dates = new Set(); Object.values(d).forEach(v => { if (v.doneDate) dates.add(v.doneDate) }); let s = 0, day = new Date(); const fmt = d => d.toISOString().slice(0, 10); if (!dates.has(fmt(day))) { day.setDate(day.getDate() - 1) } while (dates.has(fmt(day))) { s++; day.setDate(day.getDate() - 1) } return s >= 3 } },
    { id: 'streak7', name: '7일 연속', desc: '7일 연속 풀이', icon: 'bolt', check: d => { const dates = new Set(); Object.values(d).forEach(v => { if (v.doneDate) dates.add(v.doneDate) }); let s = 0, day = new Date(); const fmt = d => d.toISOString().slice(0, 10); if (!dates.has(fmt(day))) { day.setDate(day.getDate() - 1) } while (dates.has(fmt(day))) { s++; day.setDate(day.getDate() - 1) } return s >= 7 } },
    { id: 'noter', name: '메모광', desc: '10개 이상 메모', icon: 'memo', check: d => Object.values(d).filter(v => v.note && v.note.trim()).length >= 10 },
];
function upAch() {
    const d = ld(), bar = document.getElementById('achBar');
    bar.innerHTML = ACHS.map(a => `<div class="ach ${a.check(d) ? 'unlocked' : ''}" title="${a.desc}">${ic(a.icon, 14)} ${a.name}</div>`).join('');
}

// Export/Import
function expData() {
    const d = ld(); const blob = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'koi_progress_' + new Date().toISOString().slice(0, 10) + '.json'; a.click(); toast('백업 파일 다운로드', 'gn');
}
function impData(e) {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader(); r.onload = ev => { try { const d = JSON.parse(ev.target.result); sv(d); render(); met(); upStreak(); upHeatmap(); upAch(); toast('복원 완료!', 'gn') } catch (err) { toast('파일 오류', 'am') } }; r.readAsText(f);
}

// Filters
function initF() {
    const yc = document.getElementById('fY');
    YRS.forEach(y => { const b = document.createElement('button'); b.className = 'pill'; b.textContent = y; b.onclick = () => { F.y.has(y) ? F.y.delete(y) : F.y.add(y); b.classList.toggle('on'); render() }; yc.appendChild(b) });
    const rc = document.getElementById('fR');
    RDS.forEach(r => { const b = document.createElement('button'); b.className = 'pill'; b.textContent = r.l; b.onclick = () => { F.r.has(r.v) ? F.r.delete(r.v) : F.r.add(r.v); b.classList.toggle('on'); render() }; rc.appendChild(b) });
    const sc = document.getElementById('fS');
    [{ v: 'todo', l: '미풀이' }, { v: 'wip', l: '진행중' }, { v: 'done', l: '완료' }].forEach(s => { const b = document.createElement('button'); b.className = 'pill'; b.textContent = s.l; b.onclick = () => { F.s.has(s.v) ? F.s.delete(s.v) : F.s.add(s.v); b.classList.toggle('on'); render() }; sc.appendChild(b) });
}

function filt(dv) {
    const q = document.getElementById('q').value.toLowerCase().trim();
    const tf = document.getElementById('tagFilter') ? document.getElementById('tagFilter').value : '';
    return KOI_PROBLEMS.filter(p => {
        if (!p.d.includes(dv)) return false;
        if (F.y.size && !F.y.has(p.y)) return false;
        if (F.r.size && !F.r.has(p.r)) return false;
        if (F.s.size && !F.s.has(gs(p))) return false;
        if (q && !p.n.toLowerCase().includes(q)) return false;
        if (tf && !gtags(p).includes(tf)) return false;
        return true;
    });
}

// Sort
function sortProblems(items) {
    if (sortMode === 'name') return [...items].sort((a, b) => a.n.localeCompare(b.n));
    if (sortMode === 'diff-asc') return [...items].sort((a, b) => gdf(a) - gdf(b));
    if (sortMode === 'diff-desc') return [...items].sort((a, b) => gdf(b) - gdf(a));
    if (sortMode === 'status') return [...items].sort((a, b) => { const o = { done: 0, wip: 1, todo: 2 }; return o[gs(a)] - o[gs(b)] });
    return items;
}

// Random
function randPick() {
    const items = filt(aD).filter(p => gs(p) !== 'done');
    if (!items.length) { toast('미풀이 문제가 없습니다!', 'am'); return }
    const p = items[Math.floor(Math.random() * items.length)];
    opV(OF ? p.op : p.lp, p.y + ' ' + p.r + '차 ' + p.n);
}

// Tabs
function initTabs() {
    const c = document.getElementById('dTabs');
    DVS.forEach(d => {
        const t = document.createElement('div'); t.className = 'tab t-' + d + (d === aD ? ' on' : ''); t.dataset.div = d;
        t.innerHTML = DLB[d] + ' <span class="tc" id="tc_' + d + '"></span>';
        t.onclick = () => { aD = d; showWritten = false; document.querySelectorAll('.tab').forEach(x => x.classList.remove('on')); t.classList.add('on'); toggleWrittenView(); render() };
        c.appendChild(t);
    });
    // Written exam tab
    const wt = document.createElement('div'); wt.className = 'tab tab-written'; wt.id = 'tabWritten';
    wt.innerHTML = '1교시 필기 <span class="tc" id="tc_written">' + (typeof KOI_WRITTEN !== 'undefined' ? KOI_WRITTEN.length : 0) + '</span>';
    wt.onclick = () => { showWritten = true; document.querySelectorAll('.tab').forEach(x => x.classList.remove('on')); wt.classList.add('on'); toggleWrittenView(); renderWritten() };
    c.appendChild(wt);
}
function toggleWrittenView() {
    const ww = document.getElementById('writtenWrap');
    const tw = document.getElementById('tW');
    const emp = document.getElementById('emp');
    const ctrl = document.querySelector('.ctrl');
    if (showWritten) { ww.style.display = 'block'; tw.style.display = 'none'; emp.style.display = 'none'; ctrl.style.display = 'none'; }
    else { ww.style.display = 'none'; tw.style.display = 'block'; ctrl.style.display = ''; }
}
function renderWritten() {
    if (typeof KOI_WRITTEN === 'undefined') return;
    const w = document.getElementById('writtenTable');
    const years = [...new Set(KOI_WRITTEN.map(e => e.y))].sort((a, b) => b - a);
    const DLB_W = { '초': '초등부', '중': '중등부', '고': '고등부' };
    w.innerHTML = years.map(y => {
        const items = KOI_WRITTEN.filter(e => e.y === y);
        const rows = items.map(e => {
            const dcls = 'dv dv-' + e.d;
            return `<tr>
                <td><span class="${dcls}">${DLB_W[e.d]}</span></td>
                <td><div class="lks"><button class="lk lk-v" onclick="opV('${e.op}','${y} 1교시 ${DLB_W[e.d]} 문제')">${ic('eye', 11)} 문제</button>${e.oa ? `<button class="lk lk-s" onclick="opV('${e.oa}','${y} 1교시 ${DLB_W[e.d]} 정답')">${ic('sol', 11)} 정답</button>` : ''}</div></td>
            </tr>`;
        }).join('');
        return `<div class="yg"><div class="yl"><span class="yt">${y}</span><span class="yr">1교시</span></div><table class="pt"><thead><tr><th>부문</th><th>PDF</th></tr></thead><tbody>${rows}</tbody></table></div>`;
    }).join('');
}

// Tags
function addTag(i) {
    const tag = prompt('알고리즘 태그 입력 (예: DP, 그리디, BFS):');
    if (!tag || !tag.trim()) return;
    const p = KOI_PROBLEMS[i]; const tags = gtags(p);
    if (!tags.includes(tag.trim())) { tags.push(tag.trim()); stags(p, tags) }
}
function rmTag(i, t) { const p = KOI_PROBLEMS[i]; const tags = gtags(p).filter(x => x !== t); stags(p, tags) }

// Viewer (supports split view)
let splitMode = false;
let viewerProbIdx = -1;
function opV(u, t, probIdx) {
    splitMode = false;
    viewerProbIdx = (typeof probIdx === 'number') ? probIdx : -1;
    document.getElementById('vwT').textContent = t;
    document.getElementById('vwF').src = u;
    document.getElementById('vwO').href = u;
    document.getElementById('vw').classList.add('on');
    document.getElementById('vw').classList.remove('split', 'split-ans');
    document.getElementById('vwF2').src = 'about:blank';
    document.body.style.overflow = 'hidden';
}
function opSplit(pu, su, t, probIdx) {
    splitMode = true;
    viewerProbIdx = (typeof probIdx === 'number') ? probIdx : -1;
    document.getElementById('vwT').textContent = t + ' (문제 | 풀이)';
    document.getElementById('vwF').src = pu;
    document.getElementById('vwF2').src = su;
    document.getElementById('vwO').href = pu;
    document.getElementById('vw').classList.add('on', 'split');
    document.getElementById('vw').classList.remove('split-ans');
    document.body.style.overflow = 'hidden';
}
function clV() { document.getElementById('vw').classList.remove('on', 'split', 'split-ans'); document.getElementById('vwF').src = 'about:blank'; document.getElementById('vwF2').src = 'about:blank'; document.body.style.overflow = ''; viewerProbIdx = -1; stopTimer() }

// Timer
let timerInterval = null, timerStart = 0, timerTotal = 0, timerProblem = null;
function startTimer(p) {
    stopTimer();
    timerProblem = p;
    timerTotal = gtime(p);
    timerStart = Date.now();
    const el = document.getElementById('timerDisplay');
    el.style.display = 'flex';
    timerInterval = setInterval(() => {
        const elapsed = timerTotal + Math.floor((Date.now() - timerStart) / 1000);
        el.querySelector('.timer-time').textContent = fmtTime(elapsed);
    }, 1000);
    el.querySelector('.timer-time').textContent = fmtTime(timerTotal);
}
function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        if (timerProblem) {
            const elapsed = timerTotal + Math.floor((Date.now() - timerStart) / 1000);
            stime(timerProblem, elapsed);
        }
        timerInterval = null;
    }
    const el = document.getElementById('timerDisplay');
    if (el) el.style.display = 'none';
    timerProblem = null;
}
function fmtTime(s) {
    const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), sec = s % 60;
    return (h ? h + ':' : '') + String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
}

// Memo
function opM(i) { mP = KOI_PROBLEMS[i]; document.getElementById('mmT').textContent = mP.n + ' 메모'; document.getElementById('mmTx').value = gn(mP); document.getElementById('mmBg').classList.add('on') }
function clM() { document.getElementById('mmBg').classList.remove('on'); mP = null }
function svM() { if (!mP) return; sn(mP, document.getElementById('mmTx').value); clM(); render(); toast('메모 저장됨', 'gn') }
document.getElementById('mmBg').addEventListener('click', e => { if (e.target === document.getElementById('mmBg')) clM() });

// Command Palette
function openCmd() { document.getElementById('cmdBg').classList.add('on'); const inp = document.getElementById('cmdIn'); inp.value = ''; inp.focus(); cmdSel = 0; renderCmd() }
function closeCmd() { document.getElementById('cmdBg').classList.remove('on') }
function getCmdItems(q) {
    q = q.toLowerCase().trim(); const items = [];
    items.push({ name: '랜덤 문제 풀기', key: ic('shuffle', 14), action: () => { closeCmd(); randPick() } });
    items.push({ name: '테마 변경', key: ic('moon', 14), action: () => { closeCmd(); togT() } });
    items.push({ name: '뷰 전환 (테이블/카드)', key: ic('grid', 14), action: () => { closeCmd(); toggleView() } });
    items.push({ name: '통계 보기', key: ic('stats', 14), action: () => { closeCmd(); openStats() } });
    items.push({ name: '진도 백업 (JSON)', key: ic('download', 14), action: () => { closeCmd(); expData() } });
    items.push({ name: '문제 추천', key: ic('bulb', 14), action: () => { closeCmd(); suggestProblem() } });
    items.push({ name: '초등부 보기', action: () => { closeCmd(); aD = '초'; showWritten = false; document.querySelectorAll('.tab').forEach(x => x.classList.remove('on')); document.querySelector('.tab.t-초').classList.add('on'); toggleWrittenView(); render() } });
    items.push({ name: '중등부 보기', action: () => { closeCmd(); aD = '중'; showWritten = false; document.querySelectorAll('.tab').forEach(x => x.classList.remove('on')); document.querySelector('.tab.t-중').classList.add('on'); toggleWrittenView(); render() } });
    items.push({ name: '고등부 보기', action: () => { closeCmd(); aD = '고'; showWritten = false; document.querySelectorAll('.tab').forEach(x => x.classList.remove('on')); document.querySelector('.tab.t-고').classList.add('on'); toggleWrittenView(); render() } });
    KOI_PROBLEMS.forEach(p => { items.push({ name: `${p.y} ${p.r}차 — ${p.n}`, action: () => { closeCmd(); opV(OF ? p.op : p.lp, p.y + ' ' + p.r + '차 ' + p.n) } }) });
    if (!q) return items.slice(0, 12);
    return items.filter(i => i.name.toLowerCase().includes(q)).slice(0, 12);
}
function renderCmd() {
    const q = document.getElementById('cmdIn').value;
    const items = getCmdItems(q);
    const list = document.getElementById('cmdList');
    if (!items.length) { list.innerHTML = '<div class="cmd-empty">결과 없음</div>'; return }
    cmdSel = Math.min(cmdSel, items.length - 1);
    list.innerHTML = items.map((it, i) => `<div class="cmd-item${i === cmdSel ? ' sel' : ''}" onclick="getCmdItems('${q.replace(/'/g, "\\\'")}')[${i}].action()">${it.name}${it.key ? '<span class="ci-key">' + it.key + '</span>' : ''}</div>`).join('');
}
document.getElementById('cmdBg').addEventListener('click', e => { if (e.target === document.getElementById('cmdBg')) closeCmd() });

// Keyboard
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { clV(); clM(); closeCmd(); closeStats(); if (typeof clWrong === 'function') clWrong(); return }
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); openCmd(); return }
    if (document.getElementById('cmdBg').classList.contains('on')) {
        const items = getCmdItems(document.getElementById('cmdIn').value);
        if (e.key === 'ArrowDown') { e.preventDefault(); cmdSel = Math.min(cmdSel + 1, items.length - 1); renderCmd() }
        if (e.key === 'ArrowUp') { e.preventDefault(); cmdSel = Math.max(cmdSel - 1, 0); renderCmd() }
        if (e.key === 'Enter' && items[cmdSel]) { e.preventDefault(); items[cmdSel].action() }
    }
});

// Scroll to top
window.addEventListener('scroll', () => {
    const btn = document.getElementById('scrollTop');
    btn.classList.toggle('show', window.scrollY > 300);
});

// View mode toggle (table/card)
function toggleView() {
    viewMode = viewMode === 'table' ? 'card' : 'table';
    document.getElementById('viewToggle').innerHTML = ic('grid');
    render();
    toast(viewMode === 'card' ? '카드 뷰' : '테이블 뷰', 'gn');
}

// Progress bars
function renderProg() {
    const d = ld();
    document.getElementById('progBars').innerHTML = DVS.map(dv => {
        const ps = KOI_PROBLEMS.filter(p => p.d.includes(dv));
        const done = ps.filter(p => (d[pk(p)] || {}).status === 'done').length;
        const pct = ps.length ? Math.round(done / ps.length * 100) : 0;
        const col = dv === '초' ? 'var(--gn)' : dv === '중' ? 'var(--cy)' : 'var(--rd)';
        return `<div class="prog-w"><div class="prog-lbl"><span>${DLB[dv]}</span><span>${done}/${ps.length} (${pct}%)</span></div><div class="prog-tk"><div class="prog-fl" style="width:${pct}%;background:${col}"></div></div></div>`;
    }).join('');
}

// Stats Dashboard
function openStats() {
    document.getElementById('statsBg').classList.add('on');
    document.body.style.overflow = 'hidden';
    renderStats();
}
function closeStats() { document.getElementById('statsBg').classList.remove('on'); document.body.style.overflow = '' }
function renderStats() {
    const d = ld();
    const total = KOI_PROBLEMS.length;
    const done = KOI_PROBLEMS.filter(p => (d[pk(p)] || {}).status === 'done').length;
    const wip = KOI_PROBLEMS.filter(p => (d[pk(p)] || {}).status === 'wip').length;
    const todo = total - done - wip;

    // Donut chart data
    const donutData = [
        { label: '완료', value: done, color: 'var(--gn)' },
        { label: '진행중', value: wip, color: 'var(--am)' },
        { label: '미풀이', value: todo, color: 'var(--bg3)' },
    ];
    const donutSVG = makeDonut(donutData, total);

    // By year bar chart
    const yearBars = YRS.map(y => {
        const ps = KOI_PROBLEMS.filter(p => p.y === y);
        const dn = ps.filter(p => (d[pk(p)] || {}).status === 'done').length;
        const pct = ps.length ? Math.round(dn / ps.length * 100) : 0;
        return `<div class="stat-bar-row"><span class="stat-bar-label">${y}</span><div class="stat-bar-track"><div class="stat-bar-fill" style="width:${pct}%"></div></div><span class="stat-bar-val">${dn}/${ps.length}</span></div>`;
    }).join('');

    // By division donut
    const divStats = DVS.map(dv => {
        const ps = KOI_PROBLEMS.filter(p => p.d.includes(dv));
        const dn = ps.filter(p => (d[pk(p)] || {}).status === 'done').length;
        const pct = ps.length ? Math.round(dn / ps.length * 100) : 0;
        const col = dv === '초' ? '#22c55e' : dv === '중' ? '#06b6d4' : '#ef4444';
        return `<div class="stat-div"><div class="stat-div-ring" style="background:conic-gradient(${col} ${pct * 3.6}deg, var(--bg3) 0)"><span>${pct}%</span></div><span class="stat-div-name">${DLB[dv]}</span></div>`;
    }).join('');

    // Difficulty distribution
    const diffs = [1, 2, 3, 4, 5];
    const diffBars = diffs.map(df => {
        const cnt = KOI_PROBLEMS.filter(p => gdf(p) === df).length;
        const maxCnt = Math.max(...diffs.map(d => KOI_PROBLEMS.filter(p => gdf(p) === d).length), 1);
        const pct = Math.round(cnt / maxCnt * 100);
        return `<div class="stat-bar-row"><span class="stat-bar-label">${'★'.repeat(df)}</span><div class="stat-bar-track"><div class="stat-bar-fill stat-bar-star" style="width:${pct}%"></div></div><span class="stat-bar-val">${cnt}</span></div>`;
    }).join('');

    // Time stats
    let totalTime = 0, timedCount = 0;
    KOI_PROBLEMS.forEach(p => { const t = gtime(p); if (t > 0) { totalTime += t; timedCount++ } });
    const avgTime = timedCount > 0 ? Math.round(totalTime / timedCount) : 0;

    document.getElementById('statsContent').innerHTML = `
        <div class="stat-grid">
            <div class="stat-card stat-card-main">
                <h3>전체 진행률</h3>
                ${donutSVG}
                <div class="stat-legend">${donutData.map(d => `<span class="stat-leg-item"><i style="background:${d.color}"></i>${d.label}: ${d.value}</span>`).join('')}</div>
            </div>
            <div class="stat-card">
                <h3>부문별 달성률</h3>
                <div class="stat-divs">${divStats}</div>
            </div>
            <div class="stat-card stat-card-wide">
                <h3>연도별 완료</h3>
                ${yearBars}
            </div>
            <div class="stat-card">
                <h3>난이도 분포</h3>
                ${diffBars}
            </div>
            <div class="stat-card">
                <h3>시간 통계</h3>
                <div class="stat-time-grid">
                    <div class="stat-time-item"><span class="stat-time-val">${fmtTime(totalTime)}</span><span class="stat-time-label">총 소요시간</span></div>
                    <div class="stat-time-item"><span class="stat-time-val">${fmtTime(avgTime)}</span><span class="stat-time-label">평균 풀이시간</span></div>
                    <div class="stat-time-item"><span class="stat-time-val">${timedCount}</span><span class="stat-time-label">타이머 사용</span></div>
                </div>
            </div>
        </div>
    `;
}
function makeDonut(data, total) {
    let offset = 0; const r = 60, cx = 80, cy = 80, sw = 16;
    const circ = 2 * Math.PI * r;
    const paths = data.filter(d => d.value > 0).map(d => {
        const pct = d.value / total;
        const dash = circ * pct;
        const gap = circ - dash;
        const s = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${d.color}" stroke-width="${sw}" stroke-dasharray="${dash} ${gap}" stroke-dashoffset="${-offset}" stroke-linecap="round" style="transition:all .6s ease"/>`;
        offset += dash;
        return s;
    }).join('');
    const pct = total > 0 ? Math.round(data[0].value / total * 100) : 0;
    return `<svg viewBox="0 0 160 160" class="stat-donut"><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--bg3)" stroke-width="${sw}"/>${paths}<text x="${cx}" y="${cy - 4}" text-anchor="middle" fill="var(--tx)" font-size="24" font-weight="700">${pct}%</text><text x="${cx}" y="${cy + 14}" text-anchor="middle" fill="var(--tx3)" font-size="10">완료</text></svg>`;
}

// Problem Recommendation
function suggestProblem() {
    const d = ld();
    const undone = KOI_PROBLEMS.filter(p => {
        const st = (d[pk(p)] || {}).status;
        return st !== 'done' && p.d.includes(aD);
    });
    if (!undone.length) { toast('모든 문제를 완료했습니다!', 'gn'); return }
    // Prefer WIP first, then by similar difficulty to average completed
    const doneDiffs = KOI_PROBLEMS.filter(p => (d[pk(p)] || {}).status === 'done' && gdf(p) > 0).map(p => gdf(p));
    const avgDiff = doneDiffs.length > 0 ? doneDiffs.reduce((a, b) => a + b, 0) / doneDiffs.length : 2;
    const wips = undone.filter(p => (d[pk(p)] || {}).status === 'wip');
    if (wips.length > 0) {
        const p = wips[0];
        toast(`추천: ${p.y} ${p.r}차 ${p.n} (진행중)`, 'cy');
        opV(OF ? p.op : p.lp, p.y + ' ' + p.r + '차 ' + p.n);
        return;
    }
    // Sort by closest difficulty to avg
    const sorted = [...undone].sort((a, b) => Math.abs(gdf(a) - avgDiff) - Math.abs(gdf(b) - avgDiff));
    const p = sorted[0];
    toast(`추천: ${p.y} ${p.r}차 ${p.n}`, 'cy');
    opV(OF ? p.op : p.lp, p.y + ' ' + p.r + '차 ' + p.n);
}

// Compare progress (JSON diff)
function compareProgress() {
    document.getElementById('cmpFile').click();
}
function handleCompare(e) {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader(); r.onload = ev => {
        try {
            const other = JSON.parse(ev.target.result);
            const mine = ld();
            openCompareModal(mine, other);
        } catch (err) { toast('파일 오류', 'am') }
    }; r.readAsText(f);
}
function openCompareModal(mine, other) {
    const el = document.getElementById('compareContent');
    const rows = KOI_PROBLEMS.map(p => {
        const k = pk(p);
        const myS = (mine[k] || {}).status || 'todo';
        const otS = (other[k] || {}).status || 'todo';
        if (myS === otS) return '';
        const sIc = { todo: ic('dash', 12), wip: ic('half', 12), done: ic('check', 12) };
        const cls = myS === 'done' && otS !== 'done' ? 'cmp-win' : otS === 'done' && myS !== 'done' ? 'cmp-lose' : '';
        return `<tr class="${cls}"><td>${p.y} ${p.r}차</td><td>${p.n}</td><td>${sIc[myS]}</td><td>${sIc[otS]}</td></tr>`;
    }).filter(Boolean).join('');
    if (!rows) { el.innerHTML = '<p class="cmp-same">진도가 동일합니다!</p>'; }
    else { el.innerHTML = `<table class="cmp-table"><thead><tr><th>대회</th><th>문제</th><th>나</th><th>상대</th></tr></thead><tbody>${rows}</tbody></table>`; }
    document.getElementById('compareBg').classList.add('on');
}
function closeCompare() { document.getElementById('compareBg').classList.remove('on') }

// Print mode
function printList() {
    const items = sortProblems(filt(aD));
    const d = ld();
    const printHTML = `<html><head><title>KOI ${DLB[aD]} 문제 목록</title><style>
        body{font-family:sans-serif;padding:2rem;color:#111}h1{font-size:1.2rem;margin-bottom:1rem}
        table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:6px 10px;text-align:left;font-size:.85rem}
        th{background:#f5f5f5;font-weight:600}.done{color:#22c55e}.wip{color:#eab308}
        .stars{color:#fbbf24}@media print{body{padding:0}}
    </style></head><body><h1>KOI ${DLB[aD]} 기출문제 (${items.length}문제)</h1><table><thead><tr><th>#</th><th>연도</th><th>차수</th><th>문제</th><th>상태</th><th>난이도</th><th>메모</th></tr></thead><tbody>${items.map((p, i) => {
        const st = gs(p); const diff = gdf(p); const note = gn(p);
        const stLabel = st === 'done' ? '✓' : st === 'wip' ? '◐' : '—';
        const stCls = st === 'done' ? 'done' : st === 'wip' ? 'wip' : '';
        return `<tr><td>${i + 1}</td><td>${p.y}</td><td>${p.r}차</td><td>${p.n}</td><td class="${stCls}">${stLabel}</td><td class="stars">${'★'.repeat(diff)}${'☆'.repeat(5 - diff)}</td><td>${note ? note.substring(0, 50) : ''}</td></tr>`;
    }).join('')
        }</tbody></table><script>window.print()</script></body></html>`;
    const w = window.open('', '_blank');
    w.document.write(printHTML);
    w.document.close();
}

// Render
function render() {
    const items = sortProblems(filt(aD));
    DVS.forEach(d => { const el = document.getElementById('tc_' + d); if (el) el.textContent = filt(d).length });
    const total = KOI_PROBLEMS.filter(p => p.d.includes(aD)).length;
    document.getElementById('cntL').textContent = items.length + '/' + total;
    const w = document.getElementById('tW'), emp = document.getElementById('emp');
    if (!items.length) { w.innerHTML = ''; emp.style.display = 'block'; return }
    emp.style.display = 'none';

    if (viewMode === 'card') { renderCards(items); return }

    const grp = {}; items.forEach(p => { const k = p.y + '.' + p.r; if (!grp[k]) grp[k] = { y: p.y, r: p.r, ps: [] }; grp[k].ps.push(p) });
    const sorted = Object.values(grp).sort((a, b) => b.y - a.y || a.r - b.r);
    const prog = ld();
    w.innerHTML = sorted.map(g => {
        const gD = g.ps.filter(p => (prog[pk(p)] || {}).status === 'done').length;
        const gP = g.ps.length ? Math.round(gD / g.ps.length * 100) : 0;
        const rows = g.ps.map(p => {
            const i = KOI_PROBLEMS.indexOf(p); const pu = OF ? p.op : p.lp; const su = OF ? (p.os || null) : (p.ls || null);
            const st = gs(p); const note = gn(p); const diff = gdf(p); const tags = gtags(p); const time = gtime(p);
            const divs = p.d.split('').filter(c => '초중고'.includes(c)).map(c => `<span class="dv dv-${c}">${c}</span>`).join('');
            let lks = `<button class="lk lk-v" onclick="opV('${pu}','${p.y} ${p.r}차 ${p.n}',${i})">${ic('eye', 11)} 보기</button>`;
            if (su) {
                lks += `<a class="lk lk-s" href="${su}" target="_blank">${ic('sol', 11)} 풀이</a>`;
                lks += `<button class="lk lk-sp" onclick="opSplit('${pu}','${su}','${p.y} ${p.r}차 ${p.n}',${i})" title="분할 보기">${ic('split', 11)}</button>`;
            }
            if (p.o) lks += `<a class="lk lk-o" href="${p.o}" target="_blank">${ic('oj', 11)} OJ</a>`;
            const stB = STS.map(s => `<button class="sb" ${st === s.v ? `data-on="${s.v}"` : ''} onclick="ss(KOI_PROBLEMS[${i}],'${s.v}')">${ic(s.l, 12)}</button>`).join('');
            const stars = Array.from({ length: 5 }, (_, j) => `<span class="star${j < diff ? ' lit' : ''}" onclick="sdf(KOI_PROBLEMS[${i}],${j + 1})">${j < diff ? ic('starFill', 12) : ic('star', 12)}</span>`).join('');
            const tagHtml = tags.map(t => `<span class="tag" onclick="rmTag(${i},'${t.replace(/'/g, "\\'")}')">×${t}</span>`).join('') + `<span class="tag tag-add" onclick="addTag(${i})">${ic('plus', 10)}</span>`;
            const timeHtml = time > 0 ? `<span class="time-badge" title="소요시간">${ic('timer', 10)} ${fmtTime(time)}</span>` : '';
            const timerBtn = `<button class="lk lk-timer" onclick="event.stopPropagation();startTimer(KOI_PROBLEMS[${i}]);opV('${pu}','${p.y} ${p.r}차 ${p.n}',${i})" title="타이머 시작">${ic('timer', 11)}</button>`;
            const codeBtn = `<button class="lk" onclick="event.stopPropagation();opCode(${i})" title="풀이 코드" style="color:var(--pp);border-color:rgba(192,132,252,.2);background:var(--pps)">${ic('code', 11)}</button>`;
            const bmActive = gbm(p) ? 'active' : '';
            const bmBtn = `<button class="bm-btn ${bmActive}" onclick="event.stopPropagation();sbm(KOI_PROBLEMS[${i}])" title="북마크">${gbm(p) ? ic('bookmarkFill', 12) : ic('bookmark', 12)}</button>`;
            const wrongBtn = `<button class="lk" onclick="event.stopPropagation();opWrong(${i})" title="오답노트" style="color:var(--rd);border-color:rgba(251,113,133,.2);background:var(--rds)">${ic('wrongNote', 11)}</button>`;
            return `<tr><td><span class="pn">${p.n}</span><div class="tags">${tagHtml}</div>${timeHtml}</td><td><div class="pd">${divs}</div></td><td><div class="lks">${lks}${timerBtn}${codeBtn}${wrongBtn}${bmBtn}</div></td><td><div class="sc">${stB}<div class="stars">${stars}</div><button class="mb ${note ? 'has' : ''}" onclick="opM(${i})">${ic('memo', 12)}</button></div></td></tr>`;
        }).join('');
        return `<div class="yg"><div class="yl"><span class="yt">${g.y}</span><span class="yr">${g.r}차</span><div class="yp"><div class="yp-tk"><div class="yp-fl" style="width:${gP}%"></div></div></div><span class="yc">${gD}/${g.ps.length}</span></div><table class="pt"><thead><tr><th>문제</th><th>부문</th><th>링크</th><th>상태 / 난이도</th></tr></thead><tbody>${rows}</tbody></table></div>`;
    }).join('');
    renderProg();
}

// Card view render
function renderCards(items) {
    const w = document.getElementById('tW');
    const prog = ld();
    w.innerHTML = '<div class="card-grid">' + items.map(p => {
        const i = KOI_PROBLEMS.indexOf(p);
        const pu = OF ? p.op : p.lp; const su = OF ? (p.os || null) : (p.ls || null);
        const st = gs(p); const diff = gdf(p); const note = gn(p); const tags = gtags(p); const time = gtime(p);
        const stCls = st === 'done' ? 'card-done' : st === 'wip' ? 'card-wip' : '';
        const stIcon = st === 'done' ? ic('check', 14) : st === 'wip' ? ic('half', 14) : '';
        const stars = Array.from({ length: 5 }, (_, j) => `<span class="star${j < diff ? ' lit' : ''}" onclick="sdf(KOI_PROBLEMS[${i}],${j + 1})">${j < diff ? ic('starFill', 12) : ic('star', 12)}</span>`).join('');
        const tagHtml = tags.map(t => `<span class="tag" onclick="rmTag(${i},'${t.replace(/'/g, "\\\\'")}')">×${t}</span>`).join('') + `<span class="tag tag-add" onclick="addTag(${i})">${ic('plus', 10)}</span>`;
        const divs = p.d.split('').filter(c => '초중고'.includes(c)).map(c => `<span class="dv dv-${c}">${c}</span>`).join('');
        return `<div class="p-card ${stCls}" data-idx="${i}">
            <div class="card-top">
                <span class="card-year">${p.y} · ${p.r}차</span>
                ${stIcon ? `<span class="card-st-icon">${stIcon}</span>` : ''}
            </div>
            <h3 class="card-name">${p.n}</h3>
            <div class="card-divs">${divs}</div>
            <div class="stars card-stars">${stars}</div>
            <div class="tags card-tags">${tagHtml}</div>
            ${time > 0 ? `<span class="time-badge">${ic('timer', 10)} ${fmtTime(time)}</span>` : ''}

            <div class="card-actions">
                <button class="lk lk-v" onclick="opV('${pu}','${p.y} ${p.r}차 ${p.n}',${i})">${ic('eye', 11)} 보기</button>
                ${su ? `<button class="lk lk-sp" onclick="opSplit('${pu}','${su}','${p.y} ${p.r}차 ${p.n}',${i})">${ic('split', 11)}</button>` : ''}
                ${p.o ? `<a class="lk lk-o" href="${p.o}" target="_blank">${ic('oj', 11)} OJ</a>` : ''}
                <button class="lk lk-timer" onclick="event.stopPropagation();startTimer(KOI_PROBLEMS[${i}]);opV('${pu}','${p.y} ${p.r}차 ${p.n}',${i})">${ic('timer', 11)}</button>
                <button class="lk" onclick="event.stopPropagation();opCode(${i})" title="풀이 코드" style="color:var(--pp);border-color:rgba(192,132,252,.2);background:var(--pps)">${ic('code', 11)}</button>
                <button class="lk" onclick="event.stopPropagation();opWrong(${i})" title="오답노트" style="color:var(--rd);border-color:rgba(251,113,133,.2);background:var(--rds)">${ic('wrongNote', 11)}</button>
                <button class="bm-btn ${gbm(p) ? 'active' : ''}" onclick="event.stopPropagation();sbm(KOI_PROBLEMS[${i}])">${gbm(p) ? ic('bookmarkFill', 12) : ic('bookmark', 12)}</button>
                <button class="mb ${note ? 'has' : ''}" onclick="opM(${i})">${ic('memo', 12)}</button>
            </div>
            <div class="card-status-btns">${STS.map(s => `<button class="sb" ${st === s.v ? `data-on="${s.v}"` : ''} onclick="event.stopPropagation();ss(KOI_PROBLEMS[${i}],'${s.v}')">${ic(s.l, 12)}</button>`).join('')}</div>
        </div>`;
    }).join('') + '</div>';
    renderProg();
}

// Animated counter
function animNum(el, target) {
    const dur = 600, start = performance.now(), from = parseInt(el.textContent) || 0;
    if (from === target) { el.textContent = target; return }
    function tick(now) {
        const p = Math.min((now - start) / dur, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(from + (target - from) * ease);
        if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
}

function met() {
    const d = ld(); const t = KOI_PROBLEMS.length;
    const done = KOI_PROBLEMS.filter(p => (d[pk(p)] || {}).status === 'done').length;
    const wip = KOI_PROBLEMS.filter(p => (d[pk(p)] || {}).status === 'wip').length;
    animNum(document.getElementById('mT'), t);
    animNum(document.getElementById('mD'), done);
    animNum(document.getElementById('mW'), wip);
}

// Boot
initF(); initTabs(); render(); met(); upStreak(); upHeatmap(); upAch(); renderProg();
