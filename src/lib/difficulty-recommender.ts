import type { BankProblem, BankDifficulty } from '@/data/problem-bank';

const DIFFICULTY_ORDER: BankDifficulty[] = ['bronze', 'silver', 'gold', 'platinum'];

interface CategoryStat {
  total: number;
  solved: number;
  accuracy: number; // 0~1
}

export interface SolveRecord {
  problemId: string;
  isCorrect: boolean;
  solvedAt: number; // Unix ms
  timeSpentMs?: number; // 풀이 소요 시간 (ms)
}

/**
 * 카테고리별 정답률을 계산한다.
 * solvedIds: 정답 처리된 문제 id 배열
 */
function calcCategoryStats(
  solvedIds: string[],
  allProblems: BankProblem[]
): Record<string, CategoryStat> {
  const solvedSet = new Set(solvedIds);
  const stats: Record<string, CategoryStat> = {};

  for (const p of allProblems) {
    if (!stats[p.category]) {
      stats[p.category] = { total: 0, solved: 0, accuracy: 0 };
    }
    stats[p.category].total++;
    if (solvedSet.has(p.id)) {
      stats[p.category].solved++;
    }
  }

  for (const cat of Object.keys(stats)) {
    const s = stats[cat];
    s.accuracy = s.total > 0 ? s.solved / s.total : 0;
  }

  return stats;
}

/**
 * 카테고리별 마지막 풀이 시각을 반환한다.
 * 오래 안 푼 카테고리를 가중치 계산에 활용한다.
 */
function calcCategoryLastSolved(
  records: SolveRecord[],
  allProblems: BankProblem[]
): Record<string, number> {
  const problemCat = new Map<string, string>();
  for (const p of allProblems) {
    problemCat.set(p.id, p.category);
  }

  const lastSolved: Record<string, number> = {};
  for (const r of records) {
    const cat = problemCat.get(r.problemId);
    if (!cat) continue;
    if (!lastSolved[cat] || r.solvedAt > lastSolved[cat]) {
      lastSolved[cat] = r.solvedAt;
    }
  }
  return lastSolved;
}

/**
 * 카테고리별 연속 오답 횟수를 반환한다.
 * 최근 records 기준으로 역순 탐색하여 연속 실패를 카운트한다.
 */
function calcConsecutiveWrong(
  records: SolveRecord[],
  allProblems: BankProblem[]
): Record<string, number> {
  const problemCat = new Map<string, string>();
  for (const p of allProblems) {
    problemCat.set(p.id, p.category);
  }

  // 최신순 정렬
  const sorted = [...records].sort((a, b) => b.solvedAt - a.solvedAt);
  const consecutive: Record<string, number> = {};

  for (const r of sorted) {
    const cat = problemCat.get(r.problemId);
    if (!cat) continue;
    if (cat in consecutive) continue; // 이미 연속 실패 계산 완료
    if (r.isCorrect) {
      consecutive[cat] = 0; // 가장 최근 풀이가 정답이면 연속 실패 없음
    } else {
      // 연속 오답 카운트
      let count = 0;
      for (const rec of sorted) {
        const c = problemCat.get(rec.problemId);
        if (c !== cat) continue;
        if (!rec.isCorrect) count++;
        else break;
      }
      consecutive[cat] = count;
    }
  }
  return consecutive;
}

/**
 * 풀이 속도 점수 계산.
 * 빠를수록 난이도를 올려도 되고, 느릴수록 현재 난이도 유지 선호.
 * 반환값: -1 (느림) ~ +1 (빠름)
 */
function calcSpeedScore(
  records: SolveRecord[],
  allProblems: BankProblem[],
  category: string
): number {
  const problemCat = new Map<string, string>();
  for (const p of allProblems) {
    problemCat.set(p.id, p.category);
  }

  const catRecords = records.filter(
    (r) => problemCat.get(r.problemId) === category && r.isCorrect && r.timeSpentMs
  );
  if (catRecords.length === 0) return 0;

  const avgMs = catRecords.reduce((sum, r) => sum + (r.timeSpentMs ?? 0), 0) / catRecords.length;
  // 기준: 2분(120,000ms) 이하면 빠름, 5분(300,000ms) 이상이면 느림
  if (avgMs <= 120_000) return 1;
  if (avgMs >= 300_000) return -1;
  return 1 - (avgMs - 120_000) / (300_000 - 120_000) * 2;
}

/**
 * 풀이 기록 기반으로 추천 문제를 반환한다.
 *
 * 개선된 로직:
 * - 기존: 카테고리별 정답률 기반 단순 추천
 * - 추가1: 풀이 속도 — 빠를수록 높은 난이도 선호 (speedBonus)
 * - 추가2: 연속 오답 패턴 — 3회 이상 연속 실패 시 쉬운 문제 강제 가중 (streakPenalty)
 * - 추가3: 마지막 학습 시간 — 오래 안 푼 카테고리에 복습 가중치 (staleness bonus)
 * - 아직 한 문제도 없는 경우: bronze 문제 전체에서 랜덤 추천
 */
export function recommendProblems(
  solvedIds: string[],
  allProblems: BankProblem[],
  maxResults: number = 5,
  records: SolveRecord[] = []
): BankProblem[] {
  const solvedSet = new Set(solvedIds);
  const unsolvedProblems = allProblems.filter((p) => !solvedSet.has(p.id));

  // 풀이 기록이 없으면 bronze 문제에서 추천
  if (solvedIds.length === 0) {
    const bronzeProblems = unsolvedProblems.filter((p) => p.difficulty === 'bronze');
    return shuffleArray(bronzeProblems).slice(0, maxResults);
  }

  const stats = calcCategoryStats(solvedIds, allProblems);
  const lastSolved = calcCategoryLastSolved(records, allProblems);
  const consecutiveWrong = calcConsecutiveWrong(records, allProblems);
  const now = Date.now();

  const recommendations: Array<{ problem: BankProblem; score: number }> = [];

  for (const p of unsolvedProblems) {
    const stat = stats[p.category];
    if (!stat) {
      // 아직 시도 안 한 카테고리 — 낮은 우선순위로 추가
      recommendations.push({ problem: p, score: calcBaseScore(p, 0.5) });
      continue;
    }

    const accuracy = stat.accuracy;
    const diffIdx = DIFFICULTY_ORDER.indexOf(p.difficulty);

    // ── 연속 오답 패턴 페널티 ──
    // 3회 이상 연속 오답: 해당 카테고리의 가장 쉬운 문제를 강하게 우선
    const wrongStreak = consecutiveWrong[p.category] ?? 0;
    const streakPenalty = wrongStreak >= 3 ? (diffIdx * -15) : 0; // 어려울수록 패널티

    // ── 풀이 속도 보너스 ──
    const speedScore = calcSpeedScore(records, allProblems, p.category); // -1 ~ 1
    const speedBonus = speedScore * 8; // 최대 ±8점

    // ── 오래 안 푼 카테고리 복습 가중치 (staleness) ──
    const catLastMs = lastSolved[p.category] ?? 0;
    const daysSince = catLastMs > 0 ? (now - catLastMs) / 86_400_000 : 0;
    // 7일 이상 안 풀었으면 복습 필요: 최대 +20점, 쉬운 문제에만 적용
    const stalenessBonus =
      daysSince >= 7 && diffIdx <= 1
        ? Math.min(20, (daysSince - 7) * 2)
        : 0;

    let score = 0;

    if (accuracy < 0.5) {
      // 정답률 낮음 → 쉬운 문제 높은 점수
      const easyBonus = (3 - diffIdx) * 10;
      score = calcBaseScore(p, accuracy) + easyBonus + streakPenalty + stalenessBonus;
    } else {
      // 정답률 높음 → 카테고리 내 가장 많이 푼 난이도보다 높은 난이도 선호
      const highestSolvedDiff = getHighestSolvedDifficulty(p.category, solvedIds, allProblems);
      const highestIdx = DIFFICULTY_ORDER.indexOf(highestSolvedDiff ?? 'bronze');
      const targetIdx = Math.min(highestIdx + 1, DIFFICULTY_ORDER.length - 1);

      if (diffIdx === targetIdx) {
        score = calcBaseScore(p, accuracy) + 20 + speedBonus + stalenessBonus;
      } else if (diffIdx > targetIdx) {
        score = calcBaseScore(p, accuracy) - 5 + speedBonus;
      } else {
        score = calcBaseScore(p, accuracy) + stalenessBonus;
      }
      score += streakPenalty;
    }

    recommendations.push({ problem: p, score });
  }

  // 점수 내림차순 정렬 후 상위 N개 반환
  recommendations.sort((a, b) => b.score - a.score);
  return recommendations.slice(0, maxResults).map((r) => r.problem);
}

function calcBaseScore(p: BankProblem, accuracy: number): number {
  // 정답률이 낮을수록, 쉬울수록 높은 기본 점수
  const diffBonus = (3 - DIFFICULTY_ORDER.indexOf(p.difficulty)) * 5;
  return Math.round((1 - accuracy) * 30 + diffBonus);
}

function getHighestSolvedDifficulty(
  category: string,
  solvedIds: string[],
  allProblems: BankProblem[]
): BankDifficulty | null {
  const solvedSet = new Set(solvedIds);
  const solvedInCat = allProblems.filter(
    (p) => p.category === category && solvedSet.has(p.id)
  );
  if (solvedInCat.length === 0) return null;

  let highest = 0;
  for (const p of solvedInCat) {
    const idx = DIFFICULTY_ORDER.indexOf(p.difficulty);
    if (idx > highest) highest = idx;
  }
  return DIFFICULTY_ORDER[highest];
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
