/* submit.js — 학습지 제출 기능 */
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('btn-submit');
    const modal = document.getElementById('submit-modal');
    const closeBtn = document.getElementById('btn-close-modal');
    if (!btn || !modal) return;

    btn.addEventListener('click', () => {
        const name = document.getElementById('stu-name')?.value.trim() || '이름없음';
        const date = document.getElementById('stu-date')?.value || new Date().toISOString().slice(0, 10);
        const textareas = document.querySelectorAll('textarea.write');
        let answered = 0;
        const answers = [];
        textareas.forEach((ta, i) => {
            const val = ta.value.trim();
            if (val) answered++;
            answers.push({ q: i + 1, a: val || '(미작성)' });
        });

        const total = textareas.length;
        const title = document.title || '학습지';
        const filename = `${title.replace(/[^a-zA-Z0-9가-힣]/g, '_')}_${name}_${date}.txt`;

        let content = `${title}\n`;
        content += `학생: ${name}\n날짜: ${date}\n`;
        content += `작성: ${answered}/${total}문제\n`;
        content += `${'='.repeat(50)}\n\n`;
        answers.forEach(a => {
            content += `[문제 ${a.q}]\n${a.a}\n\n`;
        });

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);

        document.getElementById('modal-name').textContent = `👤 ${name}`;
        document.getElementById('modal-date').textContent = `📅 ${date}`;
        document.getElementById('modal-count').textContent = `📝 ${answered}/${total}문제`;
        document.getElementById('modal-filename').textContent = filename;
        modal.classList.add('show');
    });

    closeBtn?.addEventListener('click', () => modal.classList.remove('show'));
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('show'); });
});
