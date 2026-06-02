/* ═══ CT 통합 프로젝트 제출 시스템 ═══ */
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
    const lvMatch = sub.match(/Level\s*(\d)/i);
    const lv = lvMatch ? lvMatch[1] : '?';
    const textareas = document.querySelectorAll('.write');
    let answered = 0;
    let content = '═══════════════════════════════════════════\n';
    content += '  🎯 CT 통합 프로젝트 학습지 제출\n';
    content += '═══════════════════════════════════════════\n\n';
    content += `👤 이름: ${name}\n`;
    content += `📅 날짜: ${date}\n`;
    content += `📘 레벨: Level ${lv}\n\n`;
    content += '───────────────────────────────────────────\n\n';
    const projects = document.querySelectorAll('.proj');
    projects.forEach((proj, pi) => {
        const num = proj.querySelector('.proj-num')?.textContent || (pi + 1);
        const title = proj.querySelector('.proj-title')?.textContent || '';
        content += `\n【프로젝트 ${num}】 ${title}\n`;
        const steps = proj.querySelectorAll('.step-section');
        steps.forEach(step => {
            const header = step.querySelector('.step-header')?.textContent || '';
            const ta = step.querySelector('.write');
            const val = ta ? ta.value.trim() : '';
            if (val) answered++;
            content += `  [${header.trim()}] ${val || '(미작성)'}\n`;
        });
        content += '\n';
    });
    content += '───────────────────────────────────────────\n';
    content += `📊 작성 현황: ${answered}/${textareas.length} 단계 완료 (${Math.round(answered / textareas.length * 100)}%)\n`;
    content += '═══════════════════════════════════════════\n';

    const filename = `CT프로젝트_Level${lv}_${name}_${date}.txt`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    document.getElementById('modal-name').textContent = `👤 ${name}`;
    document.getElementById('modal-date').textContent = `📅 ${date}`;
    document.getElementById('modal-count').textContent = `📝 ${answered}/${textareas.length}단계`;
    document.getElementById('modal-filename').textContent = filename;
    document.getElementById('submit-modal').classList.add('show');
}
