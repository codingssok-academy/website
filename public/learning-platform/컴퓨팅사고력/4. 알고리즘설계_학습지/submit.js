// 알고리즘 설계 학습지 제출 시스템
(function () {
    // 오늘 날짜를 기본값으로
    const today = new Date().toISOString().slice(0, 10);
    const dateInput = document.getElementById('stu-date');
    if (dateInput) dateInput.value = today;

    // 제출 버튼
    const btn = document.getElementById('btn-submit');
    if (btn) btn.addEventListener('click', submitWork);

    // 모달 닫기
    const closeBtn = document.getElementById('btn-close-modal');
    if (closeBtn) closeBtn.addEventListener('click', () => {
        document.getElementById('submit-modal').classList.remove('show');
    });

    function submitWork() {
        const name = document.getElementById('stu-name').value.trim();
        const date = document.getElementById('stu-date').value;
        const level = document.title;

        if (!name) {
            alert('이름을 입력해주세요! ✏️');
            document.getElementById('stu-name').focus();
            return;
        }
        if (!date) {
            alert('날짜를 선택해주세요! 📅');
            document.getElementById('stu-date').focus();
            return;
        }

        // 모든 textarea 답안 수집
        const textareas = document.querySelectorAll('textarea.write');
        const answers = [];
        let answered = 0;

        textareas.forEach((ta, i) => {
            const val = ta.value.trim();
            if (val) answered++;
            answers.push({
                번호: i + 1,
                제목: document.querySelectorAll('.prob-title')[i]?.textContent || '',
                답안: val || '(미작성)'
            });
        });

        // 레벨 추출
        const levelMatch = level.match(/Level\s*(\d)/);
        const lv = levelMatch ? levelMatch[1] : '?';

        // 텍스트 파일 생성
        let content = '═══════════════════════════════════════════\n';
        content += '  ⚙️ 알고리즘 설계(Algorithm Design) 학습지 제출\n';
        content += '═══════════════════════════════════════════\n\n';
        content += `📘 레벨: Level ${lv}\n`;
        content += `👤 이름: ${name}\n`;
        content += `📅 날짜: ${date}\n`;
        content += `📝 작성: ${answered}/${textareas.length}문제\n`;
        content += `⏰ 제출 시각: ${new Date().toLocaleString('ko-KR')}\n`;
        content += '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

        answers.forEach(a => {
            content += `┌─ 문제 ${a.번호}. ${a.제목}\n`;
            content += `│\n`;
            const lines = a.답안.split('\n');
            lines.forEach(line => {
                content += `│  ${line}\n`;
            });
            content += `│\n`;
            content += `└─────────────────────────────────────\n\n`;
        });

        content += '═══════════════════════════════════════════\n';
        content += `  제출 완료 — ${name} (${date})\n`;
        content += '═══════════════════════════════════════════\n';

        
    // ─── 성적 요약 (localStorage) ───
    let gradeCorrect = 0, gradeWrong = 0;
    try {
        const platform = JSON.parse(localStorage.getItem('ct_platform') || '{}');
        const path = location.pathname;
        const file = path.split('/').pop().replace('.html', '');
        const pageKey = 'ct_' + file;
        const pageData = platform[pageKey] || {};
        Object.values(pageData).forEach(v => {
            if (v === 'correct') gradeCorrect++;
            if (v === 'wrong') gradeWrong++;
        });
        if (gradeCorrect + gradeWrong > 0) {
            const total = gradeCorrect + gradeWrong;
            const rate = Math.round((gradeCorrect / total) * 100);
            content += '\n📊 자기 채점 결과\n';
            content += '   ✅ 정답: ' + gradeCorrect + '문제\n';
            content += '   ❌ 오답: ' + gradeWrong + '문제\n';
            content += '   📈 정답률: ' + rate + '%\n\n';
        }
    } catch(e) {}

        // 파일 다운로드
        const filename = `알고리즘_Level${lv}_${name}_${date}.txt`;
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // 모달 표시
        document.getElementById('modal-name').textContent = name;
        document.getElementById('modal-date').textContent = date;
        document.getElementById('modal-count').textContent = `${answered}/${textareas.length}`;
        document.getElementById('modal-filename').textContent = filename;
        document.getElementById('submit-modal').classList.add('show');
    }
})();
