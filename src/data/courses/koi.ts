/**
 * KOI (정보올림피아드 대회) — C++ 트랙
 *
 * 담당자 학원 시간표 구조 (2026-04-29):
 * - 2 교시 × 4 난이도 = 8 단원
 * - 1교시: 입문 / 초급 / 중급 / 고급
 * - 2교시: 입문 / 초급 / 중급 / 고급
 *
 * 8 part PNG 매핑:
 * - 1교시 입문 = part-01 (51장), 초급 = part-02 (55장), 중급 = part-03 (51장), 고급 = part-04 (55장)
 * - 2교시 입문 = part-05 (55장), 초급 = part-06 (55장), 중급 = part-07 (55장), 고급 = part-08 (33장)
 *
 * 카드 PNG: /learn/koi/<part>/<page>.png
 */

import type { Chapter } from './types';

const KOI_BASE = '/learn/koi';

type Level = '입문' | '초급' | '중급' | '고급';

interface UnitDef {
  part: string;
  pageCount: number;
  level: Level;
  unitId: string;
}

interface PeriodDef {
  period: number;
  chapterId: string;
  units: UnitDef[];
}

const PERIODS: PeriodDef[] = [
  {
    period: 1,
    chapterId: 'koi-period-1',
    units: [
      { part: '01', pageCount: 51, level: '입문', unitId: 'koi-1-intro' },
      { part: '02', pageCount: 55, level: '초급', unitId: 'koi-1-basic' },
      { part: '03', pageCount: 51, level: '중급', unitId: 'koi-1-mid' },
      { part: '04', pageCount: 55, level: '고급', unitId: 'koi-1-adv' },
    ],
  },
  {
    period: 2,
    chapterId: 'koi-period-2',
    units: [
      { part: '05', pageCount: 55, level: '입문', unitId: 'koi-2-intro' },
      { part: '06', pageCount: 55, level: '초급', unitId: 'koi-2-basic' },
      { part: '07', pageCount: 55, level: '중급', unitId: 'koi-2-mid' },
      { part: '08', pageCount: 33, level: '고급', unitId: 'koi-2-adv' },
    ],
  },
];

const LEVEL_DIFFICULTY: Record<Level, 1 | 2 | 3> = {
  '입문': 1,
  '초급': 1,
  '중급': 2,
  '고급': 3,
};

function makePages(part: string, count: number) {
  return Array.from({ length: count }, (_, i) => {
    const pageNum = String(i + 1).padStart(3, '0');
    return {
      id: `koi-${part}-p${i + 1}`,
      title: `카드 ${i + 1}`,
      type: '페이지' as const,
      content: `<div class="cs-slide-wrap"><img class="cs-slide" src="${KOI_BASE}/${part}/${pageNum}.png" alt="KOI ${part} 카드 ${i + 1}" loading="lazy" /></div>`,
    };
  });
}

export const KOI_CHAPTERS: Chapter[] = PERIODS.map((p) => ({
  id: p.chapterId,
  chapterNumber: p.period,
  title: `${p.period}교시`,
  icon: 'schedule',
  description: `${p.period}교시 — 입문 · 초급 · 중급 · 고급 4단계 학습 카드.`,
  ageLevel: 'middle',
  recommendedGrade: '초고~중',
  units: p.units.map((u, idx) => ({
    id: u.unitId,
    unitNumber: idx + 1,
    title: u.level,
    type: '종합' as const,
    difficulty: LEVEL_DIFFICULTY[u.level],
    duration: `${Math.ceil(u.pageCount * 0.5)}분`,
    pages: makePages(u.part, u.pageCount),
  })),
}));
