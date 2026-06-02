// === STATE ===
const SK = 'pcce_learn_v2';
let showBmOnly = false, curIdx = -1, filtered = [];

// === STORAGE ===
function ld() { try { return JSON.parse(localStorage.getItem(SK)) || {} } catch { return {} } }
function sv(d) { localStorage.setItem(SK, JSON.stringify(d)) }
function isDone(id) { return !!(ld()[id] || {}).done }
function isBm(id) { return !!(ld()[id] || {}).bm }
function setDone(id, v) { const d = ld(); if (!d[id]) d[id] = {}; d[id].done = v; sv(d) }
function setBm(id, v) { const d = ld(); if (!d[id]) d[id] = {}; d[id].bm = v; sv(d) }

// === THEME ===
function toggleTheme() {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('wp_theme', next);
    injectIcons();
}
(() => {
    const saved = localStorage.getItem('wp_theme');
    if (saved) document.documentElement.dataset.theme = saved;
})();

// === ICON INJECTION ===
function injectIcons() {
    const t = document.documentElement.dataset.theme;
    const I = ICONS;
    const set = (id, svg) => { const el = document.getElementById(id); if (el) el.innerHTML = svg };
    set('searchIcon', I.search);
    set('bmFilterIcon', I.bookmark);
    set('themeIcon', t === 'dark' ? I.sun : I.moon);
    set('emptyIcon', I.search);
    set('dpClose', I.close);
    set('dpPrevIcon', I.arrowLeft);
    set('dpNextIcon', I.arrowRight);
}

// === TOAST ===
function toast(msg, type) {
    const w = document.getElementById('toasts');
    const el = document.createElement('div');
    el.className = 'toast' + (type ? ' t-' + type : '');
    el.textContent = msg;
    w.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateY(6px)'; setTimeout(() => el.remove(), 200) }, 2200);
}

// === FILTER & RENDER ===
function filterTerms() {
    const q = document.getElementById('searchIn').value.toLowerCase().trim();
    filtered = TERMS.filter(t => {
        if (showBmOnly && !isBm(t.id)) return false;
        if (q && !t.name.includes(q) && !t.short.includes(q) && !t.hanja.includes(q)) return false;
        return true;
    });
    renderGrid();
    updateProgress();
}

function renderGrid() {
    const grid = document.getElementById('grid');
    const empty = document.getElementById('empty');
    if (!filtered.length) { grid.innerHTML = ''; empty.style.display = 'block'; return }
    empty.style.display = 'none';

    grid.innerHTML = filtered.map(t => {
        const idx = TERMS.indexOf(t);
        const done = isDone(t.id);
        const bm = isBm(t.id);
        return `<div class="card${done ? ' done' : ''}" style="--c-accent:${t.color}" onclick="openDetail(${idx})">
            <div class="card-top">
                <div class="card-svg" style="background:${t.color}0d;color:${t.color}">${ICONS[t.icon]}</div>
                <div class="card-actions">
                    <button class="card-action${bm ? ' bm-on' : ''}" onclick="event.stopPropagation();toggleBm('${t.id}')" title="북마크">${bm ? ICONS.bookmarkFill : ICONS.bookmark}</button>
                    <button class="card-action${done ? ' ck-on' : ''}" onclick="event.stopPropagation();toggleDone('${t.id}')" title="학습완료">${done ? ICONS.checkCircle : ICONS.check}</button>
                </div>
            </div>
            <div class="card-name">${t.name}<span class="card-hanja">${t.hanja}</span></div>
            <p class="card-short">${t.short}</p>
            <div class="card-done-badge">${ICONS.checkCircle} 학습 완료</div>
            <div class="card-bottom">
                <span class="card-tag">PCCE Python</span>
                <span class="card-cta">자세히 ${ICONS.arrowRight}</span>
            </div>
        </div>`;
    }).join('');
}

function toggleBm(id) {
    const v = !isBm(id);
    setBm(id, v);
    toast(v ? '북마크 추가' : '북마크 해제', v ? 'am' : '');
    filterTerms();
    if (curIdx >= 0) updateDetailButtons();
}
function toggleDone(id) {
    const v = !isDone(id);
    setDone(id, v);
    toast(v ? '학습 완료!' : '학습 취소', v ? 'gn' : '');
    filterTerms();
    if (curIdx >= 0) updateDetailButtons();
}
function toggleBookmarkFilter() {
    showBmOnly = !showBmOnly;
    document.getElementById('bmFilter').classList.toggle('on', showBmOnly);
    filterTerms();
}

// === PROGRESS ===
function updateProgress() {
    const total = TERMS.length;
    const done = TERMS.filter(t => isDone(t.id)).length;
    const pct = total ? Math.round(done / total * 100) : 0;
    document.getElementById('learnedCount').textContent = done;
    document.getElementById('totalCount').textContent = total;
    document.getElementById('progressFill').style.width = pct + '%';
    document.getElementById('progressPct').textContent = pct + '%';
}

// === DETAIL PANEL ===
function openDetail(idx) {
    curIdx = idx;
    const t = TERMS[idx];
    if (!t) return;

    // Header
    const iconEl = document.getElementById('dpIcon');
    iconEl.style.background = t.color;
    iconEl.innerHTML = ICONS[t.icon];
    document.getElementById('dpHanja').textContent = t.hanja;
    document.getElementById('dpName').textContent = t.name;
    document.getElementById('dpShort').textContent = t.short;

    // Build body
    const body = document.getElementById('dpBody');
    body.innerHTML = t.sections.map((sec, si) => {
        switch (sec.type) {
            case 'definition':
                return `<div class="sec"><div class="sec-head"><span class="sec-icon">${ICONS.list}</span><span class="sec-label">${sec.title}</span></div><p class="def-text">${sec.content}</p></div>`;

            case 'keypoints':
                return `<div class="sec"><div class="sec-head"><span class="sec-icon">${ICONS.checkCircle}</span><span class="sec-label">${sec.title}</span></div><div class="kp-list">${sec.items.map((item, i) =>
                    `<div class="kp-item"><span class="kp-num">${i + 1}</span><div class="kp-content"><div class="kp-label">${item.label}</div><div class="kp-desc">${item.desc}</div></div></div>`
                ).join('')}</div></div>`;

            case 'compare':
                return `<div class="sec"><div class="sec-head"><span class="sec-icon">${ICONS.table}</span><span class="sec-label">${sec.title}</span></div><table class="cmp-table"><thead><tr>${sec.headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${sec.rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;

            case 'exam':
                return `<div class="sec"><div class="sec-head"><span class="sec-icon">${ICONS.quiz}</span><span class="sec-label">${sec.title}</span></div>${sec.questions.map((q, qi) => {
                    const qid = `q_${idx}_${si}_${qi}`;
                    return `<div class="quiz-card" id="${qid}"><div class="quiz-q">Q. ${q.q}</div><div class="quiz-choices">${q.choices.map((c, ci) =>
                        `<div class="quiz-choice" data-qid="${qid}" data-ci="${ci}" data-ans="${q.answer}" onclick="checkAnswer(this)"><span class="quiz-num">${ci + 1}</span><span>${c}</span></div>`
                    ).join('')}</div><div class="quiz-explanation" id="${qid}_exp">${q.explanation}</div></div>`;
                }).join('')}</div>`;

            case 'tip':
                return `<div class="sec"><div class="tip-box"><span class="tip-box-icon">${ICONS.lightbulb}</span><div>${sec.content}</div></div></div>`;

            default: return '';
        }
    }).join('');

    // Related
    if (t.related && t.related.length) {
        body.innerHTML += `<div class="sec"><div class="sec-head"><span class="sec-icon">${ICONS.link}</span><span class="sec-label">관련 용어</span></div><div class="rel-list">${t.related.map(rid => {
            const rt = TERMS.find(x => x.id === rid);
            if (!rt) return '';
            return `<span class="rel-chip" onclick="openDetail(${TERMS.indexOf(rt)})">${ICONS[rt.icon]} ${rt.name}</span>`;
        }).join('')}</div></div>`;
    }

    updateDetailButtons();
    document.getElementById('overlay').classList.add('on');
    document.body.style.overflow = 'hidden';
    body.scrollTop = 0;
}

function updateDetailButtons() {
    if (curIdx < 0) return;
    const t = TERMS[curIdx];
    const done = isDone(t.id);
    const bm = isBm(t.id);
    const lb = document.getElementById('dpLearnBtn');
    const bb = document.getElementById('dpBmBtn');
    document.getElementById('dpLearnIcon').innerHTML = done ? ICONS.checkCircle : ICONS.check;
    document.getElementById('dpLearnText').textContent = done ? '학습 완료됨' : '학습 완료';
    lb.classList.toggle('on', done);
    document.getElementById('dpBmIcon').innerHTML = bm ? ICONS.bookmarkFill : ICONS.bookmark;
    document.getElementById('dpBmText').textContent = bm ? '북마크됨' : '북마크';
    bb.classList.toggle('on', bm);
}

function closeDetail() {
    document.getElementById('overlay').classList.remove('on');
    document.body.style.overflow = '';
    curIdx = -1;
}

function toggleLearnInDetail() {
    if (curIdx < 0) return;
    toggleDone(TERMS[curIdx].id);
}
function toggleBmInDetail() {
    if (curIdx < 0) return;
    toggleBm(TERMS[curIdx].id);
}

function navDetail(dir) {
    const ci = filtered.findIndex(t => TERMS.indexOf(t) === curIdx);
    if (ci < 0) return;
    const ni = ci + dir;
    if (ni < 0 || ni >= filtered.length) return;
    openDetail(TERMS.indexOf(filtered[ni]));
}

// === QUIZ ===
function checkAnswer(el) {
    const qid = el.dataset.qid;
    const ci = parseInt(el.dataset.ci);
    const ans = parseInt(el.dataset.ans);
    const card = document.getElementById(qid);
    const choices = card.querySelectorAll('.quiz-choice');

    // Mark all as disabled, then highlight
    choices.forEach((c, i) => {
        c.classList.add('disabled');
        if (i === ans) c.classList.add('correct');
        if (i === ci && ci !== ans) c.classList.add('wrong');
    });

    // Show explanation
    document.getElementById(qid + '_exp').classList.add('show');
}

// === KEYBOARD ===
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeDetail();
    if (document.getElementById('overlay').classList.contains('on')) {
        if (e.key === 'ArrowLeft') navDetail(-1);
        if (e.key === 'ArrowRight') navDetail(1);
    }
});

// === BOOT ===
injectIcons();
filterTerms();

