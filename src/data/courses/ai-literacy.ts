/**
 * AI 강의 커리큘럼 — 코딩쏙 아카데미
 * 10챕터 60유닛: AI 기초부터 에이전트/진로까지
 * 초중학생 대상, 전문 용어 포함, PPT(NotebookLM) 기반 수업
 */

import type { Chapter, Page } from './types';

const BASE = '/learn/AI강의';

function page(id: string, title: string, file: string): Page {
    return {
        id,
        title,
        type: '페이지' as const,
        content: `<iframe src="${BASE}/${file}" style="width:100%;height:100%;border:none;min-height:80vh" />`,
    };
}

function slidePage(id: string, title: string): Page {
    return {
        id: `${id}-slide`,
        title,
        type: '페이지' as const,
        content: `<iframe src="/slides/ai/${id}.pdf#toolbar=0&navpanes=0&scrollbar=1&view=FitH" style="width:100%;height:100%;border:none;min-height:85vh;display:block" title="${title}"></iframe>`,
    };
}

function unit(id: string, num: number, title: string, subtitle: string, htmlFile?: string, dur = '30분') {
    // HTML 교재가 있으면 iframe, 없으면 슬라이드 PDF 페이지 자동 생성
    const unitPages = htmlFile
        ? [page(`${id}-p1`, title, htmlFile)]
        : [slidePage(id, title)];
    return {
        id,
        unitNumber: num,
        title,
        subtitle,
        type: '이론' as const,
        difficulty: 2 as const,
        duration: dur,
        pages: unitPages,
    };
}

export const AI_LITERACY_CHAPTERS: Chapter[] = [
    // ═══════════════════════════════════════════
    // CH1: AI의 세계로 — 기초 개념
    // ═══════════════════════════════════════════
    {
        id: 'ai-ch1',
        chapterNumber: 1,
        title: 'AI의 세계로',
        icon: 'smart_toy',
        description: 'AI란 무엇인가, 역사, 종류, 그리고 우리 생활 속 AI를 이해합니다.',
        units: [
            unit('ai-u01', 1, 'AI란 무엇인가?', '인공지능의 정의와 역사'),
            unit('ai-u02', 2, 'AI vs ML vs 딥러닝', '용어 정리 — 세 가지의 관계'),
            unit('ai-u03', 3, '약한 AI vs 강한 AI (ANI vs AGI)', '현재 AI의 수준과 한계'),
            unit('ai-u04', 4, '우리 생활 속 AI', '유튜브 추천, 시리, 번역기, 자율주행'),
            unit('ai-u05', 5, 'AI의 역사 타임라인', '튜링 테스트부터 ChatGPT까지'),
            unit('ai-u06', 6, 'AI가 잘하는 것 / 못하는 것', '도구로 활용하는 마인드셋'),
        ],
    },

    // ═══════════════════════════════════════════
    // CH2: AI는 어떻게 배우는가 — 머신러닝 기초
    // ═══════════════════════════════════════════
    {
        id: 'ai-ch2',
        chapterNumber: 2,
        title: 'AI는 어떻게 배우는가',
        icon: 'model_training',
        description: '머신러닝, 신경망, 학습 데이터 — AI가 똑똑해지는 원리를 배웁니다.',
        units: [
            unit('ai-u07', 7, '머신러닝이란?', '데이터로 규칙을 스스로 찾는 방법'),
            unit('ai-u08', 8, '지도학습 vs 비지도학습 vs 강화학습', '세 가지 학습 방식'),
            unit('ai-u09', 9, '신경망(Neural Network) 기초', '뉴런, 층(Layer), 가중치(Weight)'),
            unit('ai-u10', 10, '학습 데이터의 중요성', '쓰레기가 들어가면 쓰레기가 나온다'),
            unit('ai-u11', 11, '과적합(Overfitting)과 편향(Bias)', 'AI가 실수하는 이유'),
            unit('ai-u12', 12, '모델 평가 — 정확도만이 전부가 아니다', '정밀도, 재현율, F1'),
        ],
    },

    // ═══════════════════════════════════════════
    // CH3: 대규모 언어 모델(LLM) 이해하기
    // ═══════════════════════════════════════════
    {
        id: 'ai-ch3',
        chapterNumber: 3,
        title: '대규모 언어 모델(LLM)',
        icon: 'psychology',
        description: 'GPT, Claude, Gemini — 지금 세상을 바꾸고 있는 AI의 핵심을 이해합니다.',
        units: [
            unit('ai-u13', 13, 'LLM은 어떻게 말할까', '확률 기반 다음 토큰 예측'),
            unit('ai-u14', 14, '토큰(Token)이란?', '단어를 쪼개는 방법'),
            unit('ai-u15', 15, '트랜스포머(Transformer) 아키텍처', '어텐션(Attention)의 마법'),
            unit('ai-u16', 16, '파라미터와 모델 크기', '7B, 70B, 405B — 숫자의 의미'),
            unit('ai-u17', 17, '환각(Hallucination)', 'AI가 그럴듯한 거짓말을 하는 이유'),
            unit('ai-u18', 18, '컨텍스트 윈도우', 'AI가 한 번에 기억할 수 있는 양'),
        ],
    },

    // ═══════════════════════════════════════════
    // CH4: 프롬프트 엔지니어링 마스터
    // ═══════════════════════════════════════════
    {
        id: 'ai-ch4',
        chapterNumber: 4,
        title: '프롬프트 엔지니어링',
        icon: 'edit_note',
        description: '좋은 답을 끌어내는 질문법 — 역할 부여, 단계 분해, 예시 제공',
        units: [
            unit('ai-u19', 19, '좋은 프롬프트 vs 나쁜 프롬프트', '구체적으로 묻기'),
            unit('ai-u20', 20, '역할 부여 (System Prompt)', '"너는 ~ 전문가다"'),
            unit('ai-u21', 21, '단계 분해 (Chain of Thought)', '생각하는 과정을 유도하기'),
            unit('ai-u22', 22, '예시 학습 (Few-shot)', '예시 2~3개로 패턴 가르치기'),
            unit('ai-u23', 23, '제약 조건 명시', '형식, 길이, 언어, 금지사항'),
            unit('ai-u24', 24, '컨텍스트 엔지니어링', 'AI에게 최적의 환경을 만들어주는 기술'),
        ],
    },

    // ═══════════════════════════════════════════
    // CH5: AI 도구 실전 — 텍스트/코드
    // ═══════════════════════════════════════════
    {
        id: 'ai-ch5',
        chapterNumber: 5,
        title: 'AI 도구 — 텍스트와 코드',
        icon: 'build',
        description: 'ChatGPT, Claude, Gemini, Cursor — 실전 AI 코딩과 학습 도구',
        units: [
            unit('ai-u25', 25, 'ChatGPT 완전 정복', '무료/유료, 기능, 활용법'),
            unit('ai-u26', 26, 'Claude — 깊이 있는 AI', '긴 문서 분석, 코드 리뷰'),
            unit('ai-u27', 27, 'Gemini — 구글의 AI', '검색 통합, 멀티모달'),
            unit('ai-u28', 28, 'AI로 코드 짜기', 'ChatGPT/Claude 코딩 보조 패턴'),
            unit('ai-u29', 29, 'AI로 디버깅하기', '에러 메시지를 AI에게 보여주기'),
            unit('ai-u30', 30, 'Cursor / Claude Code', 'AI 코딩 IDE — 미래의 개발 환경'),
        ],
    },

    // ═══════════════════════════════════════════
    // CH6: AI 도구 실전 — 이미지/영상/음악
    // ═══════════════════════════════════════════
    {
        id: 'ai-ch6',
        chapterNumber: 6,
        title: 'AI 도구 — 창작의 세계',
        icon: 'palette',
        description: 'AI 이미지, 영상, 음악 생성 — 창작의 한계를 넓히다',
        units: [
            unit('ai-u31', 31, 'AI 이미지 생성 — DALL-E, Midjourney', '텍스트→그림'),
            unit('ai-u32', 32, 'AI 영상 생성 — Sora, Runway', '텍스트→영상의 시대'),
            unit('ai-u33', 33, 'AI 음악 — Suno, Udio', 'AI가 만드는 음악'),
            unit('ai-u34', 34, 'AI 프레젠테이션 — Gamma, NotebookLM', '문서→슬라이드 자동 생성'),
            unit('ai-u35', 35, 'AI 디자인 — Figma AI, Canva AI', '디자인 자동화'),
            unit('ai-u36', 36, '멀티모달 AI', '텍스트+이미지+음성을 동시에 이해하는 AI'),
        ],
    },

    // ═══════════════════════════════════════════
    // CH7: MCP와 AI 에이전트
    // ═══════════════════════════════════════════
    {
        id: 'ai-ch7',
        chapterNumber: 7,
        title: 'MCP와 AI 에이전트',
        icon: 'extension',
        description: 'AI를 도구와 연결하는 MCP, 스스로 계획하고 실행하는 AI 에이전트',
        units: [
            unit('ai-u37', 37, 'API란 무엇인가', '프로그램끼리 대화하는 방법'),
            unit('ai-u38', 38, 'MCP — AI를 도구와 연결하는 표준', 'Model Context Protocol'),
            unit('ai-u39', 39, 'AI 에이전트란?', '스스로 계획하고 실행하는 AI'),
            unit('ai-u40', 40, '에이전트 vs 챗봇', '명령 실행 vs 대화'),
            unit('ai-u41', 41, '도구 사용 (Tool Use / Function Calling)', 'AI가 외부 도구를 쓰는 방법'),
            unit('ai-u42', 42, '워크플로우 자동화', '반복 작업을 AI에게 맡기기'),
        ],
    },

    // ═══════════════════════════════════════════
    // CH8: AI 핵심 용어 사전
    // ═══════════════════════════════════════════
    {
        id: 'ai-ch8',
        chapterNumber: 8,
        title: 'AI 핵심 용어 사전',
        icon: 'dictionary',
        description: 'AI 분야에서 반드시 알아야 할 전문 용어를 정리합니다.',
        units: [
            unit('ai-u43', 43, '데이터 관련 용어', '데이터셋, 레이블링, 전처리, 증강'),
            unit('ai-u44', 44, '모델 관련 용어', '파인튜닝, 양자화, RLHF, RAG'),
            unit('ai-u45', 45, '학습 관련 용어', '에포크, 배치, 러닝레이트, 손실함수'),
            unit('ai-u46', 46, '서비스 관련 용어', 'API, 토큰, 레이턴시, 스루풋'),
            unit('ai-u47', 47, '최신 트렌드 용어', 'AGI, ASI, RLHF, DPO, MoE, LoRA'),
            unit('ai-u48', 48, 'AI 회사/모델 지도', 'OpenAI, Anthropic, Google, Meta, xAI'),
        ],
    },

    // ═══════════════════════════════════════════
    // CH9: AI 시대의 안전과 윤리
    // ═══════════════════════════════════════════
    {
        id: 'ai-ch9',
        chapterNumber: 9,
        title: 'AI 안전과 윤리',
        icon: 'verified_user',
        description: '저작권, 개인정보, 딥페이크, 편향 — 책임감 있게 AI를 사용하기',
        units: [
            unit('ai-u49', 49, 'AI 생성물의 저작권', '내 것일까 AI 것일까'),
            unit('ai-u50', 50, '개인정보와 AI', '프롬프트에 절대 넣으면 안 되는 것'),
            unit('ai-u51', 51, '딥페이크와 AI 범죄', '가짜 영상, 가짜 목소리'),
            unit('ai-u52', 52, 'AI 편향(Bias)과 공정성', '데이터가 차별을 만든다'),
            unit('ai-u53', 53, 'AI 답을 검증하는 습관', '출처 확인, 팩트체크'),
            unit('ai-u54', 54, 'AI에 의존하지 않기', '내 사고력을 잃지 않는 법'),
        ],
    },

    // ═══════════════════════════════════════════
    // CH10: AI 시대의 진로와 미래
    // ═══════════════════════════════════════════
    {
        id: 'ai-ch10',
        chapterNumber: 10,
        title: 'AI 시대의 진로와 미래',
        icon: 'rocket_launch',
        description: 'AI가 바꿀 직업의 미래, AI 시대에 필요한 역량, 진로 탐색',
        units: [
            unit('ai-u55', 55, 'AI가 대체하는 직업 vs 새로 생기는 직업', '변화하는 노동 시장'),
            unit('ai-u56', 56, 'AI 시대에 필요한 5가지 역량', '비판적 사고, 창의성, 소통, 공감, 적응력'),
            unit('ai-u57', 57, 'AI 관련 직업 탐구', 'ML 엔지니어, 프롬프트 엔지니어, AI 윤리학자'),
            unit('ai-u58', 58, 'AI 프로젝트 기획하기', '나만의 AI 활용 프로젝트 설계'),
            unit('ai-u59', 59, 'AI와 코딩의 미래', '코딩이 없어질까? 더 중요해질까?'),
            unit('ai-u60', 60, 'AI 시대를 준비하는 마인드셋', '평생 학습, 도구 활용, 인간의 고유 가치'),
        ],
    },
];
