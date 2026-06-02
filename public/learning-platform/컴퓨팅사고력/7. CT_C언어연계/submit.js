/* ═══ CT C언어 연계 제출 시스템 ═══ */
document.addEventListener('DOMContentLoaded', function () {
    const submitBtn = document.getElementById('btn-submit');
    const modal = document.getElementById('submit-modal');
    const closeBtn = document.getElementById('btn-close-modal');
    if (submitBtn) submitBtn.addEventListener('click', submitWork);
    if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('show'));
    if (modal) modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('show'); });
    const d = document.getElementById('stu-date');
    if (d) d.value = new Date().toISOString().slice(0, 10);
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
    content += '  💻 CT → C언어 연계 학습지 제출\n';
    content += '═══════════════════════════════════════════\n\n';
    content += `👤 이름: ${name}\n`;
    content += `📅 날짜: ${date}\n`;
    content += `📘 과목: ${sub}\n\n`;
    content += '───────────────────────────────────────────\n\n';
    const probs = document.querySelectorAll('.prob');
    probs.forEach((prob, i) => {
        const num = prob.querySelector('.prob-num')?.textContent || (i + 1);
        const title = prob.querySelector('.prob-title')?.textContent || '';
        const ta = prob.querySelector('.write');
        const val = ta ? ta.value.trim() : '';
        if (val) answered++;
        content += `【${num}번】 ${title}\n`;
        content += `${val || '(미작성)'}\n\n`;
    });
    content += '───────────────────────────────────────────\n';
    content += `📊 작성 현황: ${answered}/${textareas.length}문제 (${Math.round(answered / textareas.length * 100)}%)\n`;
    content += '═══════════════════════════════════════════\n';

    const safeSub = sub.replace(/[^가-힣a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_');
    const filename = `CT_C언어_${safeSub}_${name}_${date}.txt`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    document.getElementById('modal-name').textContent = `👤 ${name}`;
    document.getElementById('modal-date').textContent = `📅 ${date}`;
    document.getElementById('modal-count').textContent = `📝 ${answered}/${textareas.length}문제`;
    document.getElementById('modal-filename').textContent = filename;
    document.getElementById('submit-modal').classList.add('show');
}
