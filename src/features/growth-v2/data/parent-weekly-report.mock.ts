import { INITIAL_GROWTH_TIMELINE, PREVIEW_MISSION_TIMELINE_ENTRY } from "@/features/growth-v2/data/growth-timeline.mock";
import { MOCK_STUDENT_DASHBOARD } from "@/features/growth-v2/data/student-dashboard.mock";
import type { ParentWeeklyReportData } from "@/features/growth-v2/types/parent-weekly-report";

const CONCEPT_DESCRIPTIONS: Record<string, string> = {
  "for 반복문": "같은 작업을 여러 번 실행하는 방법을 연습했습니다.",
  "조건 비교": "상황에 따라 다른 결과를 만드는 방법을 배웠습니다.",
  "오류 찾기": "코드가 작동하지 않는 원인을 찾아 고치는 연습을 했습니다.",
};

export const MOCK_PARENT_WEEKLY_REPORT = {
  dataKind: "mock",
  studentName: MOCK_STUDENT_DASHBOARD.student.displayName,
  period: "7월 6일 ~ 7월 12일",
  introduction: "수업, 미션, 프로젝트에서 달라진 점을 정리했어요.",
  attendance: {
    attended: 2,
    scheduled: 2,
  },
  assignmentCompletion: MOCK_STUDENT_DASHBOARD.weeklyGrowth.assignmentCompletion,
  weeklyGoalProgress: MOCK_STUDENT_DASHBOARD.weeklyGrowth.goalProgress,
  learnedConcepts: MOCK_STUDENT_DASHBOARD.weeklyGrowth.learnedConcepts.map((name) => ({
    name,
    description: CONCEPT_DESCRIPTIONS[name],
  })),
  teacherEvaluation: {
    strength:
      "막히는 부분을 그냥 넘기지 않고 직접 질문하며 해결하는 습관이 좋아졌습니다.",
    improvement:
      "문제를 바로 코딩하기 전에 실행 순서를 글이나 그림으로 정리하는 연습이 더 필요합니다.",
    nextLessonGoal:
      "반복문 안에 조건문을 넣어 간단한 점수 계산기를 완성합니다.",
  },
  growthActivities: [
    {
      id: INITIAL_GROWTH_TIMELINE[0].id,
      type: INITIAL_GROWTH_TIMELINE[0].type,
      title: INITIAL_GROWTH_TIMELINE[0].title,
    },
    {
      id: INITIAL_GROWTH_TIMELINE[1].id,
      type: INITIAL_GROWTH_TIMELINE[1].type,
      title: INITIAL_GROWTH_TIMELINE[1].title,
    },
    {
      id: PREVIEW_MISSION_TIMELINE_ENTRY.id,
      type: PREVIEW_MISSION_TIMELINE_ENTRY.type,
      title: PREVIEW_MISSION_TIMELINE_ENTRY.title,
    },
    {
      id: INITIAL_GROWTH_TIMELINE[2].id,
      type: INITIAL_GROWTH_TIMELINE[2].type,
      title: "선생님 피드백 확인",
    },
    {
      id: INITIAL_GROWTH_TIMELINE[4].id,
      type: INITIAL_GROWTH_TIMELINE[4].type,
      title: "꾸준한 탐험가 배지 획득",
    },
  ],
  project: {
    name: MOCK_STUDENT_DASHBOARD.project.name,
    progress: MOCK_STUDENT_DASHBOARD.project.progress,
    recentWork: "행성이 나타나는 순서를 반복문으로 정리했습니다.",
    nextWork: "조건문을 사용해 점수 계산 기능을 추가할 예정입니다.",
  },
  conversationPrompt:
    "“반복문을 사용하면 어떤 일을 편하게 할 수 있어?”라고 물어보며 민준 학생이 배운 내용을 직접 설명할 기회를 만들어 주세요.",
} satisfies ParentWeeklyReportData;
