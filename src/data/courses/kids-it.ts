/**
 * 어린이 IT — 영유아~초저 (5~9세) IT 입문 코스
 * 13단계 × 평균 30개 단원 ≈ 450개 콘텐츠 풀 시리즈
 *
 * 각 sub-step (예: 0-1, 0-2)이 unit 1개 = 슬라이드 10페이지
 * 슬라이드 PNG: /learn/kids-it/<sub-step>/01.png ~ 10.png
 *
 * cpp.ts 패턴 — 학생이 좌우 화살표로 페이지 navigation
 */

import type { Chapter } from './types';

const KIDS_IT_BASE = '/learn/kids-it';

/**
 * 한 unit = N페이지 슬라이드 PNG (default 10, 1-1/1-2는 15)
 * subStep 예: '0-1', '0-2', '1-1' ...
 *
 * cpp.ts 100% 동일 패턴 — page.tsx의 (courseId === '4' || '11') 분기에서
 * React img 직접 렌더 (sanitize/innerHTML/CSS 모든 layer 우회).
 * inline style 불필요 — src만 추출되면 됨.
 */
function makePages(subStep: string, count: number = 10) {
  return Array.from({ length: count }, (_, i) => {
    const pageNum = String(i + 1).padStart(2, '0');
    return {
      id: `kids-it-${subStep}-p${i + 1}`,
      title: `슬라이드 ${i + 1}`,
      type: '페이지' as const,
      content: `<div class="cs-slide-wrap"><img class="cs-slide" src="${KIDS_IT_BASE}/${subStep}/${pageNum}.png" alt="${subStep} 슬라이드 ${i + 1}" loading="lazy" /></div>`,
    };
  });
}

interface UnitDef {
  id: string;
  unitNumber: number;
  title: string;
  subStep: string;
  duration?: string;
  ready?: boolean;
  pageCount?: number; // 슬라이드 갯수 (default 10, 1-1/1-2는 15)
}

function makeUnit({ id, unitNumber, title, subStep, duration = '4분', ready = false, pageCount = 10 }: UnitDef) {
  return {
    id,
    unitNumber,
    title,
    type: '종합' as const,
    difficulty: 1 as const,
    duration,
    pages: ready
      ? makePages(subStep, pageCount)
      : [
          {
            id: `${id}-placeholder`,
            title: '준비 중',
            type: '페이지' as const,
            content: `<div class="cs-slide-wrap" style="display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:24px;padding:80px;text-align:center">📚 ${title}<br/><br/>슬라이드 준비 중입니다</div>`,
          },
        ],
  };
}

export const KIDS_IT_CHAPTERS: Chapter[] = [
  // ─────────────── 0단계. 디지털 세상 감각 ───────────────
  {
    id: 'kids-it-step-0',
    chapterNumber: 0,
    title: '0단계. 디지털 세상 감각 만들기',
    icon: 'sensors',
    description: '기계와 디지털 세상에 대한 첫 감각. 5~7세 입문.',
    ageLevel: 'elementary',
    recommendedGrade: '5~7세',
    units: [
      makeUnit({ id: 'kids-it-0-1', unitNumber: 1, title: '0-1. 기계와 친해지기', subStep: '0-1', ready: true }),
      makeUnit({ id: 'kids-it-0-2', unitNumber: 2, title: '0-2. 컴퓨터와 태블릿 구분', subStep: '0-2', ready: true }),
    ],
  },

  // ─────────────── 1단계. 화면 감각 ───────────────
  {
    id: 'kids-it-step-1',
    chapterNumber: 1,
    title: '1단계. 화면 감각',
    icon: 'visibility',
    description: '화면을 읽는 눈을 키워요.',
    ageLevel: 'elementary',
    recommendedGrade: '5~8세',
    units: [
      makeUnit({ id: 'kids-it-1-1', unitNumber: 1, title: '1-1. 화면 보기', subStep: '1-1', ready: true, pageCount: 15 }),
      makeUnit({ id: 'kids-it-1-2', unitNumber: 2, title: '1-2. 화면 속 약속 (아이콘)', subStep: '1-2', ready: true, pageCount: 15 }),
    ],
  },

  // ─────────────── 2단계. 손 조작 기초 ───────────────
  {
    id: 'kids-it-step-2',
    chapterNumber: 2,
    title: '2단계. 손 조작 기초',
    icon: 'touch_app',
    description: '마우스와 터치 조작 첫 걸음.',
    ageLevel: 'elementary',
    recommendedGrade: '6~8세',
    units: [
      makeUnit({ id: 'kids-it-2-1', unitNumber: 1, title: '2-1. 마우스 전 단계', subStep: '2-1' }),
      makeUnit({ id: 'kids-it-2-2', unitNumber: 2, title: '2-2. 마우스 조작', subStep: '2-2' }),
      makeUnit({ id: 'kids-it-2-3', unitNumber: 3, title: '2-3. 터치 조작', subStep: '2-3' }),
    ],
  },

  // ─────────────── 3단계. 키보드 초미세 ───────────────
  {
    id: 'kids-it-step-3',
    chapterNumber: 3,
    title: '3단계. 키보드 초미세',
    icon: 'keyboard',
    description: '키보드 관찰부터 입력 습관까지.',
    ageLevel: 'elementary',
    recommendedGrade: '6~9세',
    units: [
      makeUnit({ id: 'kids-it-3-1', unitNumber: 1, title: '3-1. 키보드 관찰', subStep: '3-1' }),
      makeUnit({ id: 'kids-it-3-2', unitNumber: 2, title: '3-2. 입력 기초', subStep: '3-2' }),
      makeUnit({ id: 'kids-it-3-3', unitNumber: 3, title: '3-3. 키보드 습관', subStep: '3-3' }),
    ],
  },

  // ─────────────── 4단계. 글자·그림·소리 만들기 ───────────────
  {
    id: 'kids-it-step-4',
    chapterNumber: 4,
    title: '4단계. 글자·그림·소리 만들기',
    icon: 'palette',
    description: '디지털로 표현하는 첫 작품.',
    ageLevel: 'elementary',
    recommendedGrade: '6~9세',
    units: [
      makeUnit({ id: 'kids-it-4-1', unitNumber: 1, title: '4-1. 글자 다루기', subStep: '4-1' }),
      makeUnit({ id: 'kids-it-4-2', unitNumber: 2, title: '4-2. 그림 다루기', subStep: '4-2' }),
      makeUnit({ id: 'kids-it-4-3', unitNumber: 3, title: '4-3. 소리와 영상 기초', subStep: '4-3' }),
    ],
  },

  // ─────────────── 5단계. 파일 초미세 ───────────────
  {
    id: 'kids-it-step-5',
    chapterNumber: 5,
    title: '5단계. 파일 초미세',
    icon: 'description',
    description: '파일 존재 → 종류 → 행동까지.',
    ageLevel: 'elementary',
    recommendedGrade: '7~9세',
    units: [
      makeUnit({ id: 'kids-it-5-1', unitNumber: 1, title: '5-1. 파일의 존재', subStep: '5-1' }),
      makeUnit({ id: 'kids-it-5-2', unitNumber: 2, title: '5-2. 파일 종류', subStep: '5-2' }),
      makeUnit({ id: 'kids-it-5-3', unitNumber: 3, title: '5-3. 파일 행동', subStep: '5-3' }),
    ],
  },

  // ─────────────── 6단계. 폴더·정리 ───────────────
  {
    id: 'kids-it-step-6',
    chapterNumber: 6,
    title: '6단계. 폴더·정리',
    icon: 'folder',
    description: '폴더와 정리 습관 만들기.',
    ageLevel: 'elementary',
    recommendedGrade: '7~9세',
    units: [
      makeUnit({ id: 'kids-it-6-1', unitNumber: 1, title: '6-1. 폴더 기초', subStep: '6-1' }),
      makeUnit({ id: 'kids-it-6-2', unitNumber: 2, title: '6-2. 정리 습관', subStep: '6-2' }),
    ],
  },

  // ─────────────── 7단계. 컴퓨터 부품 ───────────────
  {
    id: 'kids-it-step-7',
    chapterNumber: 7,
    title: '7단계. 컴퓨터 부품',
    icon: 'memory',
    description: 'CPU, RAM, 저장공간, 그래픽카드까지.',
    ageLevel: 'elementary',
    recommendedGrade: '7~10세',
    units: [
      makeUnit({ id: 'kids-it-7-1', unitNumber: 1, title: '7-1. 몸 비유', subStep: '7-1' }),
      makeUnit({ id: 'kids-it-7-2', unitNumber: 2, title: '7-2. CPU', subStep: '7-2' }),
      makeUnit({ id: 'kids-it-7-3', unitNumber: 3, title: '7-3. RAM', subStep: '7-3' }),
      makeUnit({ id: 'kids-it-7-4', unitNumber: 4, title: '7-4. 저장공간', subStep: '7-4' }),
      makeUnit({ id: 'kids-it-7-5', unitNumber: 5, title: '7-5. 그래픽·소리·연결', subStep: '7-5' }),
    ],
  },

  // ─────────────── 8단계. 인터넷 ───────────────
  {
    id: 'kids-it-step-8',
    chapterNumber: 8,
    title: '8단계. 인터넷',
    icon: 'language',
    description: '연결 감각부터 검색·업로드까지.',
    ageLevel: 'elementary',
    recommendedGrade: '7~10세',
    units: [
      makeUnit({ id: 'kids-it-8-1', unitNumber: 1, title: '8-1. 연결 감각', subStep: '8-1' }),
      makeUnit({ id: 'kids-it-8-2', unitNumber: 2, title: '8-2. 웹 사용', subStep: '8-2' }),
      makeUnit({ id: 'kids-it-8-3', unitNumber: 3, title: '8-3. 검색', subStep: '8-3' }),
      makeUnit({ id: 'kids-it-8-4', unitNumber: 4, title: '8-4. 업로드·다운로드', subStep: '8-4' }),
    ],
  },

  // ─────────────── 9단계. 디지털 안전 ───────────────
  {
    id: 'kids-it-step-9',
    chapterNumber: 9,
    title: '9단계. 디지털 안전',
    icon: 'shield',
    description: '개인정보, 비밀번호, 안전한 인터넷 생활.',
    ageLevel: 'elementary',
    recommendedGrade: '7~10세',
    units: [
      makeUnit({ id: 'kids-it-9-1', unitNumber: 1, title: '9-1. 개인정보 지키기', subStep: '9-1' }),
      makeUnit({ id: 'kids-it-9-2', unitNumber: 2, title: '9-2. 비밀번호와 위험', subStep: '9-2' }),
      makeUnit({ id: 'kids-it-9-3', unitNumber: 3, title: '9-3. 건강한 디지털', subStep: '9-3' }),
    ],
  },

  // ─────────────── 10단계. 코딩 전 사고력 ───────────────
  {
    id: 'kids-it-step-10',
    chapterNumber: 10,
    title: '10단계. 코딩 전 사고력',
    icon: 'psychology',
    description: '순서, 명령, 조건, 반복 감각.',
    ageLevel: 'elementary',
    recommendedGrade: '8~11세',
    units: [
      makeUnit({ id: 'kids-it-10-1', unitNumber: 1, title: '10-1. 순서 감각', subStep: '10-1' }),
      makeUnit({ id: 'kids-it-10-2', unitNumber: 2, title: '10-2. 명령 감각', subStep: '10-2' }),
      makeUnit({ id: 'kids-it-10-3', unitNumber: 3, title: '10-3. 조건 감각', subStep: '10-3' }),
      makeUnit({ id: 'kids-it-10-4', unitNumber: 4, title: '10-4. 반복 감각', subStep: '10-4' }),
    ],
  },

  // ─────────────── 11단계. 코딩 개념 ───────────────
  {
    id: 'kids-it-step-11',
    chapterNumber: 11,
    title: '11단계. 코딩 개념',
    icon: 'code',
    description: '코딩, 변수, 함수, 디버깅까지.',
    ageLevel: 'elementary',
    recommendedGrade: '8~11세',
    units: [
      makeUnit({ id: 'kids-it-11-1', unitNumber: 1, title: '11-1. 코드와 프로그램', subStep: '11-1' }),
      makeUnit({ id: 'kids-it-11-2', unitNumber: 2, title: '11-2. 이벤트와 변수', subStep: '11-2' }),
      makeUnit({ id: 'kids-it-11-3', unitNumber: 3, title: '11-3. 좌표와 함수', subStep: '11-3' }),
    ],
  },

  // ─────────────── 12단계. 블록 코딩 제작 ───────────────
  {
    id: 'kids-it-step-12',
    chapterNumber: 12,
    title: '12단계. 블록 코딩 제작',
    icon: 'extension',
    description: '캐릭터, 움직임, 게임, 프로젝트.',
    ageLevel: 'elementary',
    recommendedGrade: '9~12세',
    units: [
      makeUnit({ id: 'kids-it-12-1', unitNumber: 1, title: '12-1. 캐릭터', subStep: '12-1' }),
      makeUnit({ id: 'kids-it-12-2', unitNumber: 2, title: '12-2. 움직임', subStep: '12-2' }),
      makeUnit({ id: 'kids-it-12-3', unitNumber: 3, title: '12-3. 게임 기초', subStep: '12-3' }),
      makeUnit({ id: 'kids-it-12-4', unitNumber: 4, title: '12-4. 프로젝트 유형', subStep: '12-4' }),
    ],
  },

  // ─────────────── 13단계. AI ───────────────
  {
    id: 'kids-it-step-13',
    chapterNumber: 13,
    title: '13단계. AI 친구',
    icon: 'smart_toy',
    description: 'AI에게 잘 부탁하는 법, 안전하게 쓰는 법.',
    ageLevel: 'elementary',
    recommendedGrade: '9~12세',
    units: [
      makeUnit({ id: 'kids-it-13-1', unitNumber: 1, title: '13-1. AI 첫 만남', subStep: '13-1' }),
      makeUnit({ id: 'kids-it-13-2', unitNumber: 2, title: '13-2. 좋은 질문 만들기', subStep: '13-2' }),
    ],
  },
];
