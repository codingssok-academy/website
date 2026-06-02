/* ═══ C 언어 코딩 도장 제출 시스템 (v3 — SVG Premium) ═══ */
document.addEventListener('DOMContentLoaded', function () {
    const submitBtn = document.getElementById('btn-submit');
    const modal = document.getElementById('submit-modal');
    const closeBtn = document.getElementById('btn-close-modal');
    if (submitBtn) submitBtn.addEventListener('click', submitWork);
    if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('show'));
    if (modal) modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('show'); });
    const d = document.getElementById('stu-date');
    if (d) d.value = new Date().toISOString().slice(0, 10);

    /* Dark mode support for unit pages */
    const saved = localStorage.getItem('c-dojo-theme');
    if (saved) document.documentElement.setAttribute('data-theme', saved);
    else if (matchMedia('(prefers-color-scheme:dark)').matches) document.documentElement.setAttribute('data-theme', 'dark');
});

function submitWork() {
    const name = document.getElementById('stu-name').value.trim();
    const date = document.getElementById('stu-date').value;
    if (!name) { alert('이름을 입력하세요!'); document.getElementById('stu-name').focus(); return; }
    if (!date) { alert('날짜를 선택하세요!'); return; }
    const sub = document.querySelector('.hdr .sub')?.textContent || '';
    const textareas = document.querySelectorAll('.write');
    let answered = 0;
    let content = '═══════════════════════════════════════════\n';
    content += '  C 언어 학습지 제출\n';
    content += '═══════════════════════════════════════════\n\n';
    content += `이름: ${name}\n`;
    content += `날짜: ${date}\n`;
    content += `과목: ${sub}\n\n`;

    // 성적 요약 (localStorage)
    let gradeCorrect = 0, gradeWrong = 0;
    try {
        const platform = JSON.parse(localStorage.getItem('ct_platform') || '{}');
        const path = location.pathname;
        const file = path.split('/').pop().replace('.html', '');
        const prefix = path.includes('컴퓨팅') ? 'ct' : 'kf';
        const pageKey = `${prefix}_${file}`;
        const pageData = platform[pageKey] || {};
        Object.values(pageData).forEach(v => {
            if (v === 'correct') gradeCorrect++;
            if (v === 'wrong') gradeWrong++;
        });
        if (gradeCorrect + gradeWrong > 0) {
            const total = gradeCorrect + gradeWrong;
            const rate = Math.round((gradeCorrect / total) * 100);
            content += `[채점 결과]\n`;
            content += `  정답: ${gradeCorrect}문제\n`;
            content += `  오답: ${gradeWrong}문제\n`;
            content += `  정답률: ${rate}%\n\n`;
        }
    } catch (e) { }

    content += '───────────────────────────────────────────\n\n';
    const probs = document.querySelectorAll('.prob');
    probs.forEach((prob, i) => {
        const num = prob.querySelector('.prob-num')?.textContent || (i + 1);
        const title = prob.querySelector('.prob-title')?.textContent || '';
        const ta = prob.querySelector('.write');
        const val = ta ? ta.value.trim() : '';
        if (val) answered++;

        let gradeIcon = '  ';
        if (prob.classList.contains('graded-correct')) gradeIcon = '[O]';
        else if (prob.classList.contains('graded-wrong')) gradeIcon = '[X]';

        content += `${gradeIcon} [${num}번] ${title}\n`;
        content += `${val || '(미작성)'}\n\n`;
    });
    content += '───────────────────────────────────────────\n';
    content += `작성 현황: ${answered}/${textareas.length}문제 (${Math.round(answered / textareas.length * 100)}%)\n`;
    if (gradeCorrect + gradeWrong > 0) {
        content += `정답률: ${Math.round((gradeCorrect / (gradeCorrect + gradeWrong)) * 100)}%\n`;
    }
    content += '═══════════════════════════════════════════\n';

    const safeSub = sub.replace(/[^가-힣a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_');
    const filename = `C도장_${safeSub}_${name}_${date}.txt`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    document.getElementById('modal-name').textContent = name;
    document.getElementById('modal-date').textContent = date;
    document.getElementById('modal-count').textContent = `${answered}/${textareas.length}문제`;
    document.getElementById('modal-filename').textContent = filename;
    document.getElementById('submit-modal').classList.add('show');
}
