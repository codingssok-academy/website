import type { StudentGrowthDashboard } from "@/features/growth-v2/types/student-dashboard";
import { INITIAL_GROWTH_TIMELINE } from "@/features/growth-v2/data/growth-timeline.mock";

export const MOCK_STUDENT_DASHBOARD = {
  dataKind: "mock",
  student: {
    displayName: "민준",
    level: 8,
    totalXp: 2480,
    nextLevelXp: 2720,
    streakDays: 6,
  },
  missions: [
    {
      id: "mission-loop-questions",
      title: "반복문 문제 3개 풀기",
      detail: "같은 일을 똑똑하게 되풀이하는 연습",
      status: "completed",
      xp: 30,
    },
    {
      id: "mission-fix-last-code",
      title: "지난 수업 코드 수정하기",
      detail: "선생님 표시를 보고 코드 한 곳 고치기",
      status: "completed",
      xp: 20,
    },
    {
      id: "mission-project-log",
      title: "프로젝트 진행 기록 작성하기",
      detail: "오늘 만든 것과 다음에 할 일을 한 줄씩 남기기",
      status: "in-progress",
      xp: 25,
    },
  ],
  weeklyGrowth: {
    goalProgress: 72,
    learnedConcepts: ["for 반복문", "조건 비교", "오류 찾기"],
    assignmentCompletion: 80,
    changeFromLastWeek: "지난주보다 학습 시간이 12% 늘었어요.",
  },
  teacherFeedback: {
    comment: "막히는 부분을 그냥 넘기지 않고 직접 질문한 점이 아주 좋았어요.",
    nextLessonGoal: "반복문 안에 조건문을 넣어 간단한 점수 계산기를 완성해 봐요.",
  },
  project: {
    name: "나만의 우주 탐험 게임",
    progress: 64,
    recentWork: "행성이 나타나는 순서를 반복문으로 정리했어요.",
  },
  recentBadges: [
    {
      id: "badge-steady-learner",
      name: "꾸준한 탐험가",
      description: "5일 연속 학습",
      icon: "flame",
    },
    {
      id: "badge-loop-starter",
      name: "반복문 첫걸음",
      description: "반복문 문제 첫 완료",
      icon: "code",
    },
    {
      id: "badge-project-builder",
      name: "프로젝트 빌더",
      description: "프로젝트 진행률 50% 달성",
      icon: "rocket",
    },
  ],
  growthTimeline: INITIAL_GROWTH_TIMELINE,
} satisfies StudentGrowthDashboard;
